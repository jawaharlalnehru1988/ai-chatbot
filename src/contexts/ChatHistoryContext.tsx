'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Message } from '../components/chat/MessagesDisplay';

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  lastUpdated: Date;
}

interface ChatHistoryContextType {
  chatHistories: ChatHistory[];
  currentChatId: string | null;
  createNewChat: () => string;
  selectChat: (chatId: string | null) => void;
  updateChatMessages: (chatId: string, messages: Message[]) => void;
  deleteChat: (chatId: string) => void;
  getCurrentChatMessages: () => Message[];
  getChatMessages: (chatId: string) => Message[];
  updateCurrentChatTitle: (title: string) => void;
  clearAllHistory: () => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | null>(null);

interface ChatHistoryProviderProps {
  children: ReactNode;
}

const MAX_HISTORY_COUNT = 50; // In-memory limit

export function ChatHistoryProvider({ children }: ChatHistoryProviderProps) {
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const generateChatTitle = (messages: Message[]): string => {
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (firstUserMessage && firstUserMessage.text.length > 0) {
      // Use first 50 characters of first user message as title
      return firstUserMessage.text.slice(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '');
    }
    return `Chat ${new Date().toLocaleDateString()}`;
  };

  const createNewChat = useCallback((): string => {
    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      timestamp: new Date(),
      lastUpdated: new Date()
    };

    setChatHistories(prev => [newChat, ...prev].slice(0, MAX_HISTORY_COUNT));
    setCurrentChatId(newChatId);
    
    return newChatId;
  }, []);

  const selectChat = useCallback((chatId: string | null) => {
    setCurrentChatId(chatId);
  }, []);

  const updateChatMessages = useCallback((chatId: string, messages: Message[]) => {
    setChatHistories(prev => {
      const updated = prev.map(chat => {
        if (chat.id === chatId) {
          const title = messages.length > 0 && chat.title === 'New Chat' 
            ? generateChatTitle(messages)
            : chat.title;
          
          return {
            ...chat,
            messages,
            title,
            lastUpdated: new Date()
          };
        }
        return chat;
      });

      // If chat doesn't exist, create it
      const existingChat = updated.find(chat => chat.id === chatId);
      if (!existingChat) {
        const newChat: ChatHistory = {
          id: chatId,
          title: generateChatTitle(messages),
          messages,
          timestamp: new Date(),
          lastUpdated: new Date()
        };
        return [newChat, ...updated].slice(0, MAX_HISTORY_COUNT);
      }

      // Sort by lastUpdated
      return updated.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
    });
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChatHistories(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  }, [currentChatId]);

  const getCurrentChatMessages = useCallback((): Message[] => {
    if (!currentChatId) return [];
    const currentChat = chatHistories.find(chat => chat.id === currentChatId);
    return currentChat?.messages || [];
  }, [currentChatId, chatHistories]);

  const getChatMessages = useCallback((chatId: string): Message[] => {
    if (!chatId) return [];
    const chat = chatHistories.find(chat => chat.id === chatId);
    return chat?.messages || [];
  }, [chatHistories]);

  const updateCurrentChatTitle = useCallback((title: string) => {
    if (!currentChatId) return;
    
    setChatHistories(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, title, lastUpdated: new Date() }
        : chat
    ));
  }, [currentChatId]);

  const clearAllHistory = useCallback(() => {
    setChatHistories([]);
    setCurrentChatId(null);
  }, []);

  return (
    <ChatHistoryContext.Provider value={{
      chatHistories,
      currentChatId,
      createNewChat,
      selectChat,
      updateChatMessages,
      deleteChat,
      getCurrentChatMessages,
      getChatMessages,
      updateCurrentChatTitle,
      clearAllHistory
    }}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function useChatHistory() {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
}