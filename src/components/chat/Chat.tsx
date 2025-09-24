'use client';

import { useState } from 'react';
import ChatInput from './ChatInput';
import MessagesDisplay, { Message } from './MessagesDisplay';
import { openAIService, OpenAIMessage } from 'nest/lib/openai';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Convert our UI messages to OpenAI format for API calls
  const convertToOpenAIMessages = (messages: Message[]): OpenAIMessage[] => {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.text
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
      
      // Call the OpenAI API
      const aiResponse = await openAIService.getChatCompletion(openAIMessages);
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b border-blue-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-blue-100 text-sm">Connected to OpenAI • Ask me anything!</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-700 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages Display */}
      <MessagesDisplay messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading}
        placeholder="Type your message and press Enter to send..."
      />
    </div>
  );
}