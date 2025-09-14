import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy request to backend server
    const backendResponse = await fetch(`${BACKEND_URL}/api/partial-withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const result = await backendResponse.json();
    
    return NextResponse.json(result, { 
      status: backendResponse.ok ? 200 : backendResponse.status 
    });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Proxy server error' }, 
      { status: 500 }
    );
  }
}