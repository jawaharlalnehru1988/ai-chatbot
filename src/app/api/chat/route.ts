import { NextRequest, NextResponse } from 'next/server';

// Use local Next.js API routes instead of external backend
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { useStreaming, ...requestData } = body;
    
    // Get the base URL from the request
    const baseUrl = new URL(request.url).origin;
    
    // Choose the correct local endpoint based on streaming mode
    const endpoint = useStreaming 
      ? `${baseUrl}/api/openai/chatCompletion` // Streaming endpoint
      : `${baseUrl}/api/openai/chatCompletion/simple`; // Regular endpoint
    
    console.log(`🎯 Using ${useStreaming ? 'streaming' : 'regular'} endpoint:`, endpoint);
    
    // For streaming, we need to handle SSE
    if (useStreaming) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming endpoint error:', response.status, errorText);
        
        return NextResponse.json(
          { 
            error: 'Streaming service error',
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
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Simple endpoint error:', response.status, errorText);
        
        return NextResponse.json(
          { 
            error: 'Service error',
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
    console.error('API error:', error);
    
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