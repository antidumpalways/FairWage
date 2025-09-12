// FairWage Backend Configuration
// Copy this file to config.js and update with your actual values

module.exports = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Stellar Network Configuration
  rpcUrl: process.env.RPC_URL || 'https://soroban-testnet.stellar.org',
  networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',

  // Contract IDs (replace with your deployed contract IDs)
  // Get these from your deployment process
  fairwageContractId: process.env.FAIRWAGE_CONTRACT_ID || 'YOUR_FAIRWAGE_CONTRACT_ID_HERE',
  tokenContractId: process.env.TOKEN_CONTRACT_ID || 'YOUR_TOKEN_CONTRACT_ID_HERE',

  // Optional: Additional configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
