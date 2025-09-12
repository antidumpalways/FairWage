const express = require('express');
const cors = require('cors');
const { Horizon } = require('@stellar/stellar-sdk');
require('dotenv').config();

// Try to load config file, fallback to environment variables
let config;
try {
  config = require('./config.js');
    } catch (error) {
  // Fallback to environment variables if config.js doesn't exist
  config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    rpcUrl: process.env.RPC_URL || 'https://soroban-testnet.stellar.org',
    networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    fairwageContractId: process.env.FAIRWAGE_CONTRACT_ID,
    tokenContractId: process.env.TOKEN_CONTRACT_ID,
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN || process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'
  };
}

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());

// Stellar configuration
const RPC_URL = config.rpcUrl;
const NETWORK_PASSPHRASE = config.networkPassphrase;
const FAIRWAGE_CONTRACT_ID = config.fairwageContractId;
const TOKEN_CONTRACT_ID = config.tokenContractId;

// Initialize Stellar Horizon server
const server = new Horizon.Server(RPC_URL, {
  allowHttp: true
});

// Health check endpoint
app.get('/health', (req, res) => {
        res.json({
    status: 'OK', 
    timestamp: new Date().toISOString(),
    network: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL
  });
});

// Get contract information
app.get('/api/contracts', (req, res) => {
        res.json({
    fairwageContractId: FAIRWAGE_CONTRACT_ID,
    tokenContractId: TOKEN_CONTRACT_ID,
    network: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL
  });
});

// Get account balance
app.get('/api/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const account = await server.loadAccount(address);
            res.json({
      address,
      balance: account.balances,
      sequence: account.sequenceNumber()
    });
    } catch (error) {
    console.error('Error fetching balance:', error);
        res.status(500).json({ 
      error: 'Failed to fetch balance',
      message: error.message 
        });
    }
});

// Get contract state
app.get('/api/contract/:contractId/state', async (req, res) => {
  try {
    const { contractId } = req.params;
        
        if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // This would need to be implemented based on your contract's state structure
    // For now, return basic contract info
        res.json({
      contractId,
      network: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      message: 'Contract state endpoint - implement based on your contract structure'
    });
    } catch (error) {
    console.error('Error fetching contract state:', error);
        res.status(500).json({ 
      error: 'Failed to fetch contract state',
      message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
        res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server on localhost (backend requirement)
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 FairWage Backend Server running on localhost:${PORT}`);
  console.log(`📡 RPC URL: ${RPC_URL}`);
  console.log(`🌐 Network: ${NETWORK_PASSPHRASE}`);
  console.log(`📋 FairWage Contract ID: ${FAIRWAGE_CONTRACT_ID || 'Not configured'}`);
  console.log(`🪙 Token Contract ID: ${TOKEN_CONTRACT_ID || 'Not configured'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Configuration: ${config.fairwageContractId ? 'config.js' : 'environment variables'}`);
});

module.exports = app;