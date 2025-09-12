import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/get-both-contract-ids`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend not available' }, 
      { status: 503 }
    );
  }
}