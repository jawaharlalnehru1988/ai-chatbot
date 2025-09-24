'use client';

import { useEffect, useRef } from 'react';
import MessageContent from './MessageContent';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface MessagesDisplayProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessagesDisplay({ messages, isLoading = false }: MessagesDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Send a message to begin!</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {message.sender === 'user' ? (
                  <div className="whitespace-pre-wrap break-words">{message.text}</div>
                ) : (
                  <MessageContent content={message.text} />
                )}
                <div 
                  className={`text-xs mt-1 ${
                    message.sender === 'user' 
                      ? 'text-blue-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 max-w-[80%]">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">AI is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}