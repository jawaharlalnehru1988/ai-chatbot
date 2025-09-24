import axios from 'axios';

const API_BASE_URL = 'https://ai-chat-bot-backend-f6tf.vercel.app';

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIRequest {
  messages: OpenAIMessage[];
}

export interface OpenAIChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
    refusal: null;
    annotations: unknown[];
  };
  logprobs: null;
  finish_reason: string;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      cached_tokens: number;
      audio_tokens: number;
    };
    completion_tokens_details: {
      reasoning_tokens: number;
      audio_tokens: number;
      accepted_prediction_tokens: number;
      rejected_prediction_tokens: number;
    };
  };
  service_tier: string;
  system_fingerprint: string;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  private constructor() {
    // Add request interceptor for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log('Making API request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => {
        console.log('API response received:', response.status);
        return response;
      },
      (error) => {
        console.error('API error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  public async getChatCompletion(messages: OpenAIMessage[]): Promise<string> {
    try {
      const payload: OpenAIRequest = { messages };
      
      const response = await this.apiClient.post<OpenAIResponse>(
        '/openai/chatCompletion',
        payload
      );

      if (response.data.choices && response.data.choices.length > 0) {
        const assistantMessage = response.data.choices[0].message;
        return assistantMessage.content;
      } else {
        throw new Error('No response choices received from API');
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Unable to connect to the AI service. Please check your internet connection and try again.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.response?.status === 500) {
          throw new Error('Internal server error. Please try again later.');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid request. Please check your message and try again.');
        }
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }
}

export const openAIService = OpenAIService.getInstance();