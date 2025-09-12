import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee = searchParams.get('employee');
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee address required' }, { status: 400 });
    }

    // Check if employee exists in any contract by querying current contract
    const response = await fetch(`${BACKEND_URL}/api/get-current-contract`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    
    if (!response.ok || !data.success || !data.fairWageContractId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active FairWage contract found',
        contractId: null 
      });
    }

    // Return the current contract as the autodetected contract
    return NextResponse.json({
      success: true,
      contractId: data.fairWageContractId,
      message: 'Contract autodetected successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to autodetect contract',
      contractId: null 
    }, { status: 500 });
  }
}