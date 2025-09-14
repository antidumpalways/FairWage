// Contract Discovery System for Multi-Company Support
// This helps employees find all contracts where they are registered

const StellarSdk = require("@stellar/stellar-sdk");

// Known contract registry (In production, this could be stored in database)
let knownContracts = [
  {
    id: "CDCSZPH46V3CL7HWMQO6JIZO5VKIZVG2LKOJ3WX2ZAUGVJ4RI5D43GPU",
    name: "Payko",
    tokenSymbol: "TBU",
    tokenContract: "CC4XK6RHDU6FW23WVWBSDTJFTTYASCF342LHA2JDTC32RJHNJIOTBN7R",
    active: true
  }
  // Additional contracts can be added here dynamically
];

// Persistent storage file path
const fs = require('fs');
const path = require('path');
const REGISTRY_FILE = path.join(__dirname, 'contract-registry.json');

// Load contracts from file on startup
function loadContractsFromFile() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = fs.readFileSync(REGISTRY_FILE, 'utf8');
      const loadedContracts = JSON.parse(data);
      knownContracts = loadedContracts;
      console.log(`✅ Loaded ${knownContracts.length} contracts from registry file`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to load contract registry file:', error.message);
  }
}

// Save contracts to file
function saveContractsToFile() {
  try {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(knownContracts, null, 2));
    console.log(`✅ Saved ${knownContracts.length} contracts to registry file`);
  } catch (error) {
    console.error('❌ Failed to save contract registry file:', error.message);
  }
}

// Load contracts on module initialization
loadContractsFromFile();

/**
 * Discover all contracts where an employee is registered
 * @param {string} employeeAddress - The employee's Stellar address
 * @param {object} server - Stellar RPC server instance
 * @param {string} networkPassphrase - Network passphrase for transactions
 * @returns {Array} List of contracts where employee is registered
 */
async function discoverEmployeeContracts(employeeAddress, rpcServer, horizonServer, networkPassphrase) {
  const employeeContracts = [];

  for (const contract of knownContracts) {
    if (!contract.active) continue;

    // Validate contract ID format (should start with 'C' and be 56 characters long)
    if (!contract.id || !contract.id.startsWith('C') || contract.id.length !== 56) {
      console.warn(`⚠️ Skipping invalid contract ID: ${contract.id}`);
      continue;
    }

    try {
      // Check if employee is registered in this contract
      const isRegistered = await checkEmployeeRegistration(
        employeeAddress, 
        contract.id, 
        rpcServer,
        horizonServer, 
        networkPassphrase
      );

      if (isRegistered) {
        // Get additional contract info
        const contractInfo = await getContractInfo(
          contract.id, 
          rpcServer,
          horizonServer, 
          networkPassphrase
        );

        employeeContracts.push({
          contractId: contract.id,
          companyName: contract.name,
          tokenSymbol: contract.tokenSymbol,
          tokenContract: contract.tokenContract,
          ...contractInfo
        });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to check contract ${contract.id}:`, error.message);
    }
  }

  return employeeContracts;
}

/**
 * Check if an employee is registered in a specific contract
 */
async function checkEmployeeRegistration(employeeAddress, contractId, rpcServer, horizonServer, networkPassphrase) {
  try {
    const SIMULATION_ACCOUNT = "GBIFUPL4MOPI5XHPFKYO4SWTKKLSK63GZVMQ5A2FX3TLCS74NJ55QAZD";
    const account = await horizonServer.loadAccount(SIMULATION_ACCOUNT);
    
    const op = StellarSdk.Operation.invokeContractFunction({
      contract: contractId,
      function: "get_employee_info",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await rpcServer.simulateTransaction(tx);
    
    // If simulation is successful and returns data, employee exists
    if (!simulation.error && simulation.result?.retval) {
      const employeeInfo = StellarSdk.scValToNative(simulation.result.retval);
      return employeeInfo && employeeInfo.active !== false;
    }
    
    return false;
  } catch (error) {
    // If error contains "not found" or similar, employee is not registered
    if (error.message?.includes("Employee not found") || 
        error.message?.includes("not_found")) {
      return false;
    }
    throw error;
  }
}

/**
 * Get additional contract information
 */
async function getContractInfo(contractId, rpcServer, horizonServer, networkPassphrase) {
  try {
    // This could fetch additional contract metadata in the future
    return {
      lastChecked: new Date().toISOString(),
      network: "testnet"
    };
  } catch (error) {
    console.warn(`⚠️ Failed to get contract info for ${contractId}:`, error.message);
    return {};
  }
}

/**
 * Add a new contract to the registry
 */
function addKnownContract(contractData) {
  if (!contractData.id || !contractData.name) {
    throw new Error("Contract must have id and name");
  }

  // Check if contract already exists
  const existingIndex = knownContracts.findIndex(c => c.id === contractData.id);
  
  if (existingIndex >= 0) {
    // Update existing contract
    knownContracts[existingIndex] = { ...knownContracts[existingIndex], ...contractData };
    console.log(`🔄 Contract registry updated: ${contractData.name} (${contractData.id})`);
  } else {
    // Add new contract
    knownContracts.push({
      active: true,
      ...contractData
    });
    console.log(`➕ Contract registry added: ${contractData.name} (${contractData.id})`);
  }

  // Save to file for persistence
  saveContractsToFile();
}

/**
 * Get all known contracts
 */
function getKnownContracts() {
  return knownContracts.filter(c => c.active);
}

/**
 * Manually add a contract for testing (bypasses normal flow)
 */
function addContractManually(contractId, companyName, tokenSymbol, tokenContract) {
  try {
    addKnownContract({
      id: contractId,
      name: companyName,
      tokenSymbol: tokenSymbol,
      tokenContract: tokenContract,
      active: true
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to add contract manually:', error.message);
    return false;
  }
}

module.exports = {
  discoverEmployeeContracts,
  checkEmployeeRegistration,
  getContractInfo,
  addKnownContract,
  getKnownContracts,
  addContractManually,
  loadContractsFromFile,
  saveContractsToFile
};