import { NextRequest, NextResponse } from 'next/server';
import { openaiService, CreateOpenaiDto } from '../../../../lib/openaiService';

export async function POST(request: NextRequest) {
  try {
    const body: CreateOpenaiDto = await request.json();
    
    console.log('Streaming endpoint called');

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of openaiService.createStreamingChatCompletion(body)) {
            const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
            
            if (chunk.isComplete) {
              controller.close();
              break;
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          const errorChunk = {
            id: 'error',
            content: '',
            isComplete: true,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          const errorData = `data: ${JSON.stringify(errorChunk)}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
