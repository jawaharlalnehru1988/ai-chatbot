import { NextRequest, NextResponse } from 'next/server';
import { openaiService, CreateOpenaiDto } from '../../../../../lib/openaiService';

export async function POST(request: NextRequest) {
  try {
    const body: CreateOpenaiDto = await request.json();
    
    console.log('Simple endpoint called');

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const result = await openaiService.createChatCompletion(body);
    return NextResponse.json(result);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
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
