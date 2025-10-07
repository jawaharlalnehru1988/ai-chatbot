'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ChatInput from './ChatInput';
import MessagesDisplay, { Message } from './MessagesDisplay';
import { OpenAIMessage } from 'nest/lib/openai';
import { chatService } from 'nest/lib/chatService';
import { useChatHistory } from '../../contexts/ChatHistoryContext';

interface ChatProps {
  chatId?: string | null;
}

export default function Chat({ chatId }: ChatProps = {}) {
  const { 
    currentChatId, 
    getCurrentChatMessages,
    updateChatMessages, 
    createNewChat 
  } = useChatHistory();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState(false); // Default to regular API first
  const streamingMessageRef = useRef<string>('');
  const isStreamingRef = useRef<boolean>(false); // Track streaming state to avoid infinite updates
  const lastLoadedChatId = useRef<string | null>(null); // Track last loaded chat to prevent unnecessary loads
  const hasLoadedInitially = useRef<boolean>(false); // Track if we've loaded initially
  const throttleRef = useRef<NodeJS.Timeout | null>(null); // Throttle streaming updates
  const activeChatId = chatId || currentChatId;

  // Load messages only when chatId actually changes
  useEffect(() => {
    // Only load if the chat ID has actually changed
    if (activeChatId !== lastLoadedChatId.current) {
      console.log('Loading messages for chat:', activeChatId, 'Previous:', lastLoadedChatId.current);
      lastLoadedChatId.current = activeChatId;
      hasLoadedInitially.current = true;
      
      if (activeChatId) {
        // Get messages once without creating reactive dependencies
        const chatMessages = getCurrentChatMessages();
        setMessages(chatMessages);
      } else {
        setMessages([]);
      }
    }
  }, [activeChatId, getCurrentChatMessages]); // Include getCurrentChatMessages dependency

  // Helper function to update chat history manually when needed
  const updateChatHistoryManually = useCallback((chatId: string, newMessages: Message[]) => {
    console.log('Manual update requested for chat:', chatId, 'Streaming:', isStreamingRef.current, 'Messages:', newMessages.length);
    if (!isStreamingRef.current) {
      console.log('Updating chat history...');
      updateChatMessages(chatId, newMessages);
    } else {
      console.log('Skipping update - currently streaming');
    }
  }, [updateChatMessages]);

  // Convert our UI messages to OpenAI format for API calls
  const convertToOpenAIMessages = (messages: Message[]): OpenAIMessage[] => {
    return messages
      .filter(msg => msg.text.trim() !== '') // Filter out empty messages
      .filter(msg => !msg.text.startsWith('Error:') || !msg.text.includes('timeout')) // Filter out error messages
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text.trim()
      }));
  };

  const handleSendMessage = async (text: string) => {
    // Ensure we have a chat ID
    let currentChatIdToUse = activeChatId;
    if (!currentChatIdToUse) {
      currentChatIdToUse = createNewChat();
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Update chat history with user message immediately
    const messagesWithUser = [...messages, userMessage];
    updateChatHistoryManually(currentChatIdToUse, messagesWithUser);

    try {
      // Convert current messages to OpenAI format and add the new user message
      const currentMessages = [...messages, userMessage];
      const openAIMessages = convertToOpenAIMessages(currentMessages);
      
      console.log('🔍 Sending messages to API:', openAIMessages);
      
      const aiMessageId = (Date.now() + 1).toString();
      
      // Only add empty AI message if we're actually streaming
      if (useStreaming) {
        setIsStreaming(true);
        isStreamingRef.current = true; // Set streaming ref
        setStreamingMessageId(aiMessageId);
        streamingMessageRef.current = '';
        
        // Add empty AI message that will be updated with streaming content
        const aiMessage: Message = {
          id: aiMessageId,
          text: '',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }

      const response = await chatService.sendMessage(openAIMessages, {
        useStreaming,
        onStart: (messageId: string) => {
          console.log('Streaming started for message:', messageId);
        },
        onChunk: (messageId: string, chunk: string, fullContent: string) => {
          console.log('Received chunk for message:', messageId, 'Content length:', fullContent.length);
          streamingMessageRef.current = fullContent;
          
          // Throttle updates to prevent rapid re-renders that cause shivering
          if (throttleRef.current) {
            clearTimeout(throttleRef.current);
          }
          
          throttleRef.current = setTimeout(() => {
            // Update the streaming message with new content
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: fullContent }
                : msg
            ));
          }, 50); // Update every 50ms max to reduce shivering
        },
        onComplete: (messageId: string, finalContent: string) => {
          console.log('Streaming completed for message:', messageId);
          
          // Clear any pending throttled updates
          if (throttleRef.current) {
            clearTimeout(throttleRef.current);
            throttleRef.current = null;
          }
          
          // Final update with complete content
          const finalMessages = [...currentMessages, {
            id: aiMessageId,
            text: finalContent,
            sender: 'ai' as const,
            timestamp: new Date(),
          }];
          
          setMessages(finalMessages);
          setIsStreaming(false);
          isStreamingRef.current = false; // Reset streaming ref
          setStreamingMessageId(null);
          streamingMessageRef.current = '';
          
          // Now update chat history with final result
          if (currentChatIdToUse) {
            updateChatMessages(currentChatIdToUse, finalMessages);
          }
        },
        onError: (messageId: string, error: string) => {
          console.error('Streaming error for message:', messageId, error);
          
          // Clear any pending throttled updates
          if (throttleRef.current) {
            clearTimeout(throttleRef.current);
            throttleRef.current = null;
          }
          
          // Only show error if we don't have any content yet
          // If we already received content, keep it and just stop streaming
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMessageId) {
              // Keep existing content if we have any, otherwise show error
              if (msg.text && msg.text.trim().length > 0) {
                console.log('Keeping existing content, ignoring error:', error);
                return msg; // Keep the message as is
              } else {
                // No content received yet, show the error
                return { ...msg, text: `Error: ${error}` };
              }
            }
            return msg;
          }));
          
          setIsStreaming(false);
          isStreamingRef.current = false; // Reset streaming ref on error
          setStreamingMessageId(null);
          streamingMessageRef.current = '';
        }
      });

      // For non-streaming mode, add the complete response
      if (!useStreaming) {
        const finalAiMessage: Message = {
          id: aiMessageId,
          text: response,
          sender: 'ai',
          timestamp: new Date(),
        };
        const finalMessages = [...messagesWithUser, finalAiMessage];
        setMessages(finalMessages);
        
        // Update chat history with complete conversation
        updateChatHistoryManually(currentChatIdToUse, finalMessages);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      const messagesWithError = [...messagesWithUser, errorMessage];
      setMessages(messagesWithError);
      
      // Update chat history with error message
      updateChatHistoryManually(currentChatIdToUse, messagesWithError);
      
      setIsStreaming(false);
      isStreamingRef.current = false; // Reset streaming ref on error
      setStreamingMessageId(null);
      streamingMessageRef.current = '';
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    // Update chat history to reflect cleared conversation
    if (activeChatId) {
      updateChatHistoryManually(activeChatId, []);
    }
  };

  // Clean up empty or error messages from the conversation
  const cleanupMessages = () => {
    const cleanedMessages = messages.filter(msg => 
      msg.text.trim() !== '' && 
      !msg.text.includes('Request timeout') &&
      !msg.text.startsWith('Error: Request timeout')
    );
    setMessages(cleanedMessages);
    
    // Update chat history with cleaned messages
    if (activeChatId) {
      updateChatHistoryManually(activeChatId, cleanedMessages);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b border-blue-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`}></div>
              <p className="text-blue-100 text-sm">
                {isStreaming ? 'Streaming response...' : 'Connected to OpenAI'} • 
                {useStreaming ? ' Streaming Mode' : ' Regular Mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Streaming Mode Toggle */}
            <button
              onClick={() => setUseStreaming(!useStreaming)}
              disabled={isLoading || isStreaming}
              className={`px-3 py-1 text-xs rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed ${
                useStreaming 
                  ? 'bg-green-500 hover:bg-green-400 disabled:bg-green-700 text-white' 
                  : 'bg-gray-500 hover:bg-gray-400 disabled:bg-gray-700 text-white'
              }`}
              title={`Switch to ${useStreaming ? 'regular' : 'streaming'} mode`}
            >
              {useStreaming ? '📡 Streaming' : '📄 Regular'}
            </button>
            
            {/* Clear Chat Button */}
            {messages.length > 0 && (
              <>
                <button
                  onClick={cleanupMessages}
                  disabled={isLoading || isStreaming}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-700 disabled:cursor-not-allowed text-white text-xs rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  title="Remove empty and error messages"
                >
                  🧹 Clean
                </button>
                <button
                  onClick={clearConversation}
                  disabled={isLoading || isStreaming}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-700 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Clear Chat
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Display */}
      <MessagesDisplay 
        messages={messages} 
        isLoading={isLoading} 
        isStreaming={isStreaming}
        streamingMessageId={streamingMessageId}
      />

      {/* Input */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading || isStreaming}
        placeholder={
          isStreaming 
            ? "AI is responding..." 
            : "Type your message and press Enter to send..."
        }
      />
    </div>
  );
}