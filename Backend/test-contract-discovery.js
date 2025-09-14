// Test script untuk contract discovery
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:3001';

async function testContractDiscovery() {
  console.log('🧪 Testing Contract Discovery System...\n');

  try {
    // 1. Add the existing contract to registry
    console.log('1️⃣ Adding existing contract to registry...');
    const addResponse = await fetch(`${BACKEND_URL}/api/debug/add-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId: 'CC44UURKD3SGZP6NIPTU7JIY3QANNOTUHW45N2RUOMDGZMBTQUQC6YES',
        companyName: 'FairWage Company',
        tokenSymbol: 'FAIRWAGE',
        tokenContract: 'CCYEUDEIHQSAPOG34VICLHNBR2TNNRRTLM6JXYOG32IGJAUAQ4J4JSHV'
      })
    });

    if (addResponse.ok) {
      const addResult = await addResponse.json();
      console.log('✅ Contract added:', addResult.message);
    } else {
      console.log('❌ Failed to add contract');
    }

    // 2. Check registry
    console.log('\n2️⃣ Checking contract registry...');
    const registryResponse = await fetch(`${BACKEND_URL}/api/debug/contract-registry`);
    if (registryResponse.ok) {
      const registry = await registryResponse.json();
      console.log(`📋 Registry contains ${registry.count} contracts:`);
      registry.contracts.forEach(contract => {
        console.log(`   - ${contract.name} (${contract.id})`);
      });
    }

    // 3. Test employee discovery
    console.log('\n3️⃣ Testing employee discovery...');
    const employeeAddress = 'GC7SXQW775NLNXQBFBLXTJBLZNDL6IL6LT3SEUOHBALTL4OBN5FCTJUY';
    const discoveryResponse = await fetch(`${BACKEND_URL}/api/discover-employee-contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeAddress })
    });

    if (discoveryResponse.ok) {
      const discovery = await discoveryResponse.json();
      console.log(`🔍 Discovery result: Found ${discovery.contracts.length} contracts for employee ${employeeAddress}`);
      discovery.contracts.forEach(contract => {
        console.log(`   - ${contract.companyName} (${contract.contractId})`);
      });
    } else {
      console.log('❌ Discovery failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testContractDiscovery();
