// Test script untuk debug freeze employee
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:3001';

async function testFreezeEmployee() {
  console.log('🧪 Testing Freeze Employee Debug...\n');

  try {
    // Data dari log sebelumnya
    const testData = {
      userPublicKey: 'GCUNUCNRBGFZFIZOZJTE7AXQRZB3LMVISTYCE6YKE6HOYFO2R3LNUQMM', // Employer
      fairWageContractId: 'CC44UURKD3SGZP6NIPTU7JIY3QANNOTUHW45N2RUOMDGZMBTQUQC6YES', // Contract ID
      employeeAddress: 'GC7SXQW775NLNXQBFBLXTJBLZNDL6IL6LT3SEUOHBALTL4OBN5FCTJUY' // Employee
    };

    console.log('📋 Test data:');
    console.log('   Employer:', testData.userPublicKey);
    console.log('   Contract:', testData.fairWageContractId);
    console.log('   Employee:', testData.employeeAddress);
    console.log('');

    // Test debug endpoint
    console.log('🔍 Testing debug freeze endpoint...');
    const response = await fetch(`${BACKEND_URL}/api/debug/test-freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Debug test successful:', result.message);
      if (result.simulationResult) {
        console.log('📊 Simulation result:', JSON.stringify(result.simulationResult, null, 2));
      }
    } else {
      console.log('❌ Debug test failed:', result.error);
      if (result.details) {
        console.log('📋 Details:', result.details);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFreezeEmployee();
