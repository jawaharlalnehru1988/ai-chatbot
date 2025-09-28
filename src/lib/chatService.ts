'use client';

import { openAIService, OpenAIMessage } from './openai';
import { sseStreamingService } from './sseStreaming';

interface ChatService {
  sendMessage(messages: OpenAIMessage[], options?: {
    useStreaming?: boolean;
    onStart?: (messageId: string) => void;
    onChunk?: (messageId: string, chunk: string, fullContent: string) => void;
    onComplete?: (messageId: string, fullContent: string) => void;
    onError?: (messageId: string, error: string) => void;
  }): Promise<string>;
}

class ChatServiceImpl implements ChatService {
  async sendMessage(
    messages: OpenAIMessage[], 
    options: {
      useStreaming?: boolean;
      onStart?: (messageId: string) => void;
      onChunk?: (messageId: string, chunk: string, fullContent: string) => void;
      onComplete?: (messageId: string, fullContent: string) => void;
      onError?: (messageId: string, error: string) => void;
    } = {}
  ): Promise<string> {
    const { useStreaming = false, onStart, onChunk, onComplete, onError } = options;

    if (useStreaming) {
      console.log('🌊 Attempting SSE streaming...');
      try {
        // Use the new SSE streaming service
        const result = await sseStreamingService.sendMessage(messages, {
          onStart,
          onChunk,
          onComplete,
          onError
        });
        console.log('✅ SSE streaming successful');
        return result;
      } catch (streamingError) {
        console.warn('⚠️ SSE streaming failed, falling back to regular API:', streamingError);
        
        // Fallback to regular API
        try {
          const result = await openAIService.getChatCompletion(messages, false); // Use regular endpoint
          // Simulate the completion callback for UI consistency
          const messageId = `fallback_${Date.now()}`;
          onComplete?.(messageId, result);
          console.log('✅ Fallback API successful');
          return result;
        } catch (apiError) {
          console.error('❌ Both streaming and regular API failed:', apiError);
          const errorMessage = apiError instanceof Error ? apiError.message : 'Failed to get response';
          const messageId = `error_${Date.now()}`;
          onError?.(messageId, errorMessage);
          throw new Error(errorMessage);
        }
      }
    } else {
      console.log('� Using regular API...');
      try {
        const result = await openAIService.getChatCompletion(messages, false); // Explicitly pass false for streaming
        console.log('✅ Regular API successful');
        return result;
      } catch (apiError) {
        console.error('❌ Regular API failed:', apiError);
        const errorMessage = apiError instanceof Error ? apiError.message : 'Failed to get response';
        throw new Error(errorMessage);
      }
    }
  }
}

export const chatService = new ChatServiceImpl();