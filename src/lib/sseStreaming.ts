'use client';

import { OpenAIMessage } from './openai';

interface StreamingCallbacks {
  onStart?: (messageId: string) => void;
  onChunk?: (messageId: string, chunk: string, fullContent: string) => void;
  onComplete?: (messageId: string, fullContent: string) => void;
  onError?: (messageId: string, error: string) => void;
}

export class SSEStreamingService {
  private static instance: SSEStreamingService;

  private constructor() {}

  public static getInstance(): SSEStreamingService {
    if (!SSEStreamingService.instance) {
      SSEStreamingService.instance = new SSEStreamingService();
    }
    return SSEStreamingService.instance;
  }

  public async sendMessage(
    messages: OpenAIMessage[],
    callbacks: StreamingCallbacks
  ): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let fullContent = '';
    
    console.log('🌊 Starting SSE streaming request...');

    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      
      // Call the API route which will forward to the streaming endpoint
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages,
          useStreaming: true, // This will route to the streaming endpoint
        }),
        signal: controller.signal,
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        callbacks.onStart?.(messageId);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('🏁 SSE stream completed');
              callbacks.onComplete?.(messageId, fullContent);
              resolve(fullContent);
              break;
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = line.slice(6); // Remove 'data: ' prefix
                  
                  if (jsonData.trim() === '') continue; // Skip empty data
                  if (jsonData === '[DONE]') {
                    console.log('🏁 Received [DONE] marker');
                    callbacks.onComplete?.(messageId, fullContent);
                    resolve(fullContent);
                    return;
                  }

                  const data = JSON.parse(jsonData);
                  
                  if (data.content) {
                    if (data.isComplete) {
                      // Final chunk - use the complete content from the API
                      fullContent = data.content;
                      console.log('✅ Streaming completed');
                      callbacks.onComplete?.(messageId, fullContent);
                      resolve(fullContent);
                      return;
                    } else {
                      // Intermediate chunk - data.content already contains the full accumulated text
                      fullContent = data.content; // Replace, don't append!
                      console.log('📦 Received chunk, full content length:', fullContent.length);
                      callbacks.onChunk?.(messageId, data.content, fullContent);
                    }
                  }
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse SSE data:', line, parseError);
                }
              }
            }
          }
        } catch (readerError) {
          console.error('❌ SSE reader error:', readerError);
          callbacks.onError?.(messageId, 'Stream reading failed');
          reject(readerError);
        }
      })
      .catch((fetchError) => {
        console.error('❌ SSE fetch error:', fetchError);
        // Only show error if it's not an abort error
        if (fetchError.name !== 'AbortError') {
          callbacks.onError?.(messageId, fetchError.message);
          reject(fetchError);
        }
      });

      // Timeout after 5 minutes (300 seconds) - enough for long responses
      setTimeout(() => {
        controller.abort();
        console.warn('⏱️ Request timed out after 5 minutes');
        callbacks.onError?.(messageId, 'Request timeout after 5 minutes');
        reject(new Error('Request timeout'));
      }, 30000000);
    });
  }
}

export const sseStreamingService = SSEStreamingService.getInstance();