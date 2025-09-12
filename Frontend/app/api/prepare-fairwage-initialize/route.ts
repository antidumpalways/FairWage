import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔧 Proxying FairWage initialization request to backend:', BACKEND_URL);
    
    const response = await fetch(`${BACKEND_URL}/api/prepare-fairwage-initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    console.log('✅ Got response from backend:', response.status);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend proxy error for prepare-fairwage-initialize:', error);
    return NextResponse.json(
      { error: 'Backend not available', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 503 }
    );
  }
}