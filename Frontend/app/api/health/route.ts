import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Backend health proxy error:', error);
    return NextResponse.json(
      { error: 'Backend not available', status: 'ERROR' }, 
      { status: 503 }
    );
  }
}