'use client';

import { useState } from 'react';
import { useChatHistory } from '../../contexts/ChatHistoryContext';
import ThemeToggle from '../ui/ThemeToggle';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  selectedComponent: string;
  onSelectComponent: (component: string) => void;
}

const components = [
  {
    id: 'chat',
    name: 'Chat Assistant',
    icon: '💬',
    description: 'AI-powered chat assistant'
  },
  {
    id: 'code-gen',
    name: 'Code Generator',
    icon: '⚡',
    description: 'Generate code snippets'
  },
  {
    id: 'translator',
    name: 'Translator',
    icon: '🌐',
    description: 'Language translation'
  },
  {
    id: 'summarizer',
    name: 'Text Summarizer',
    icon: '📄',
    description: 'Summarize long content'
  }
];

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  selectedChatId,
  onSelectChat,
  selectedComponent,
  onSelectComponent
}: SidebarProps) {
  const [activeSection, setActiveSection] = useState<'chats' | 'components'>('chats');
  const { chatHistories, createNewChat, deleteChat } = useChatHistory();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const handleNewChat = () => {
    const newChatId = createNewChat();
    onSelectChat(newChatId);
    onSelectComponent('chat');
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  if (isCollapsed) {
    return (
      <div className="bg-gray-900 h-full flex flex-col items-center py-4 space-y-4 border-r border-gray-700">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <button
          onClick={handleNewChat}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="New chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        <div className="mt-auto">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 h-full flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">AI Assistant</h2>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex rounded-lg bg-gray-800 p-1">
          <button
            onClick={() => setActiveSection('chats')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors font-medium ${
              activeSection === 'chats'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💬 Chats
          </button>
          <button
            onClick={() => setActiveSection('components')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors font-medium ${
              activeSection === 'components'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🧩 Tools
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'chats' && (
          <div className="p-2">
            {chatHistories.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">No chat history yet</p>
                <p className="text-gray-500 text-xs mt-1">Start a new conversation!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatHistories.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group rounded-lg transition-colors ${
                      selectedChatId === chat.id
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Chat selection area */}
                      <button
                        onClick={() => {
                          onSelectChat(chat.id);
                          onSelectComponent('chat');
                        }}
                        className="flex-1 text-left p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{formatTime(chat.lastUpdated)}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{chat.messages.length} messages</span>
                          </div>
                        </div>
                      </button>
                      
                      {/* Delete button - separate from chat selection */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity p-3">
                        <button 
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="p-1 text-gray-400 hover:text-red-400 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                          title="Delete chat"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'components' && (
          <div className="p-2">
            <div className="space-y-2">
              {components.map((component) => (
                <button
                  key={component.id}
                  onClick={() => onSelectComponent(component.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedComponent === component.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{component.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{component.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{component.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 p-4 space-y-3">
        <ThemeToggle />
        
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>💾 {chatHistories.length} conversations (in-memory)</p>
          <p>Powered by OpenAI GPT-4</p>
        </div>
      </div>
    </div>
  );
}