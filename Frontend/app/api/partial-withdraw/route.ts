import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy request to backend server
    const backendResponse = await fetch('http://localhost:3001/api/partial-withdraw', {
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