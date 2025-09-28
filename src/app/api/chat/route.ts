import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:4000';
// const BACKEND_URL = 'https://ai-chat-bot-backend-f6tf.vercel.app';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { useStreaming, ...requestData } = body;
    
    // Choose the correct endpoint based on streaming mode
    const endpoint = useStreaming 
      ? `${BACKEND_URL}/openai/chatCompletion` // Streaming endpoint
      : `${BACKEND_URL}/openai/chatCompletion/simple`; // Regular endpoint
    
    console.log(`🎯 Using ${useStreaming ? 'streaming' : 'regular'} endpoint:`, endpoint);
    
    // For streaming, we need to handle SSE
    if (useStreaming) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestData), // Send without the useStreaming flag
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend streaming error:', response.status, errorText);
        
        return NextResponse.json(
          { 
            error: 'Backend streaming service error',
            details: `Status: ${response.status}`,
            message: response.status === 429 ? 'Rate limit exceeded' : 
                     response.status === 500 ? 'Internal server error' :
                     response.status === 400 ? 'Invalid request' :
                     'Unknown error occurred'
          },
          { status: response.status }
        );
      }

      // Forward SSE stream with proper headers
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
        },
      });
    } else {
      // For regular/simple API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData), // Send without the useStreaming flag
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);
        
        return NextResponse.json(
          { 
            error: 'Backend service error',
            details: `Status: ${response.status}`,
            message: response.status === 429 ? 'Rate limit exceeded' : 
                     response.status === 500 ? 'Internal server error' :
                     response.status === 400 ? 'Invalid request' :
                     'Unknown error occurred'
          },
          { status: response.status }
        );
      }

      // Get the response data and return JSON
      const data = await response.json();
      return NextResponse.json(data);
    }
    
  } catch (error) {
    console.error('API proxy error:', error);
    
    // Handle different types of errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'Connection failed',
          message: 'Unable to connect to the AI service. Please make sure the backend is running.',
          details: 'ECONNREFUSED'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}