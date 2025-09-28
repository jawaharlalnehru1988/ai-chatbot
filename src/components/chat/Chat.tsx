'use client';

import { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import MessagesDisplay, { Message } from './MessagesDisplay';
import { OpenAIMessage } from 'nest/lib/openai';
import { chatService } from 'nest/lib/chatService';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState(false); // Default to regular API first
  const streamingMessageRef = useRef<string>('');

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
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Convert current messages to OpenAI format and add the new user message
      const currentMessages = [...messages, userMessage];
      const openAIMessages = convertToOpenAIMessages(currentMessages);
      
      console.log('🔍 Sending messages to API:', openAIMessages);
      
      const aiMessageId = (Date.now() + 1).toString();
      
      // Only add empty AI message if we're actually streaming
      if (useStreaming) {
        setIsStreaming(true);
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
          // Update the streaming message with new content
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: fullContent }
              : msg
          ));
        },
        onComplete: (messageId: string, finalContent: string) => {
          console.log('Streaming completed for message:', messageId);
          // Final update with complete content
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: finalContent }
              : msg
          ));
          setIsStreaming(false);
          setStreamingMessageId(null);
          streamingMessageRef.current = '';
        },
        onError: (messageId: string, error: string) => {
          console.error('Streaming error for message:', messageId, error);
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: `Error: ${error}` }
              : msg
          ));
          setIsStreaming(false);
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
        setMessages(prev => [...prev, finalAiMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsStreaming(false);
      setStreamingMessageId(null);
      streamingMessageRef.current = '';
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  // Clean up empty or error messages from the conversation
  const cleanupMessages = () => {
    setMessages(prev => prev.filter(msg => 
      msg.text.trim() !== '' && 
      !msg.text.includes('Request timeout') &&
      !msg.text.startsWith('Error: Request timeout')
    ));
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