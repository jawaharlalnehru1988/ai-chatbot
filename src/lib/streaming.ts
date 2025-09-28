'use client';

import { io, Socket } from 'socket.io-client';
import { OpenAIMessage } from './openai';

interface StreamingResponse {
  id: string;
  content: string;
  isComplete: boolean;
  error?: string;
}

interface StreamingCallbacks {
  onStart?: (messageId: string) => void;
  onChunk?: (messageId: string, chunk: string, fullContent: string) => void;
  onComplete?: (messageId: string, fullContent: string) => void;
  onError?: (messageId: string, error: string) => void;
}

export class StreamingService {
  private static instance: StreamingService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private callbacks: Map<string, StreamingCallbacks> = new Map();
  
  private constructor() {}

  public static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  public async connect(): Promise<void> {
    if (this.socket && this.isConnected) {
      console.log('Already connected to streaming service');
      return Promise.resolve();
    }

    console.log('Attempting to connect to streaming service at http://localhost:4000');

    return new Promise((resolve, reject) => {
      try {
        // Connect to your backend WebSocket
        this.socket = io('http://localhost:4000', {
          transports: ['websocket'],
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to streaming service successfully');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('❌ Disconnected from streaming service');
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          this.isConnected = false;
          reject(new Error(`Failed to connect to WebSocket: ${error.message}`));
        });

        // Listen for streaming responses
        this.socket.on('chatChunk', (data: StreamingResponse) => {
          const callbacks = this.callbacks.get(data.id);
          if (callbacks) {
            if (data.error) {
              callbacks.onError?.(data.id, data.error);
            } else if (data.isComplete) {
              callbacks.onComplete?.(data.id, data.content);
              this.callbacks.delete(data.id); // Clean up
            } else {
              callbacks.onChunk?.(data.id, '', data.content); // chunk is incremental, content is full
            }
          }
        });

        this.socket.on('chatStart', (data: { id: string }) => {
          const callbacks = this.callbacks.get(data.id);
          callbacks?.onStart?.(data.id);
        });

        this.socket.on('chatComplete', (data: { id: string, content: string }) => {
          const callbacks = this.callbacks.get(data.id);
          callbacks?.onComplete?.(data.id, data.content);
          this.callbacks.delete(data.id);
        });

        this.socket.on('chatError', (data: { id: string, error: string }) => {
          const callbacks = this.callbacks.get(data.id);
          callbacks?.onError?.(data.id, data.error);
          this.callbacks.delete(data.id);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  public async sendMessage(
    messages: OpenAIMessage[],
    callbacks: StreamingCallbacks
  ): Promise<string> {
    console.log('📤 Sending message via streaming service...');
    
    if (!this.socket || !this.isConnected) {
      console.log('🔌 Not connected, attempting to connect...');
      await this.connect();
    }

    if (!this.socket || !this.isConnected) {
      throw new Error('Failed to establish WebSocket connection');
    }

    return new Promise((resolve, reject) => {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('📝 Generated message ID:', messageId);
      
      // Store callbacks for this message
      const enhancedCallbacks: StreamingCallbacks = {
        ...callbacks,
        onComplete: (id, content) => {
          console.log('✅ Message completed:', id);
          callbacks.onComplete?.(id, content);
          resolve(content);
        },
        onError: (id, error) => {
          console.error('❌ Message error:', id, error);
          callbacks.onError?.(id, error);
          reject(new Error(error));
        }
      };

      this.callbacks.set(messageId, enhancedCallbacks);
      console.log('📋 Stored callbacks for message:', messageId);

      // Send the message
      console.log('🚀 Emitting sendMessage event with payload:', { id: messageId, messages });
      this.socket?.emit('sendMessage', {
        id: messageId,
        messages: messages
      });

      // Set timeout for the request
      setTimeout(() => {
        if (this.callbacks.has(messageId)) {
          console.log('⏰ Request timeout for message:', messageId);
          this.callbacks.delete(messageId);
          reject(new Error('Request timeout'));
        }
      }, 60000); // 60 second timeout
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.callbacks.clear();
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const streamingService = StreamingService.getInstance();