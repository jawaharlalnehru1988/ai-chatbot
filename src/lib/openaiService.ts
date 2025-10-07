import OpenAI from 'openai';

export interface CreateOpenaiDto {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface StreamingChunk {
  id: string;
  content: string;
  isComplete: boolean;
  error?: string;
}

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createChatCompletion(dto: CreateOpenaiDto) {
    try {
      const response = await this.openai.chat.completions.create({
        model: dto.model || 'gpt-3.5-turbo',
        messages: dto.messages,
        temperature: dto.temperature || 0.7,
        max_tokens: dto.max_tokens || 1000,
        stream: false,
      });

      return {
        id: response.id,
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage,
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async* createStreamingChatCompletion(dto: CreateOpenaiDto): AsyncGenerator<StreamingChunk> {
    try {
      const stream = await this.openai.chat.completions.create({
        model: dto.model || 'gpt-3.5-turbo',
        messages: dto.messages,
        temperature: dto.temperature || 0.7,
        max_tokens: dto.max_tokens || 1000,
        stream: true,
      });

      let fullContent = '';
      let chunkId = `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        
        if (content) {
          fullContent += content;
          yield {
            id: chunkId,
            content: fullContent,
            isComplete: false,
          };
        }

        // Check if streaming is complete
        if (chunk.choices[0]?.finish_reason) {
          yield {
            id: chunkId,
            content: fullContent,
            isComplete: true,
          };
          break;
        }
      }
    } catch (error) {
      console.error('OpenAI Streaming Error:', error);
      yield {
        id: 'error',
        content: '',
        isComplete: true,
        error: error instanceof Error ? error.message : 'Unknown streaming error',
      };
    }
  }
}

export const openaiService = new OpenAIService();