const express = require('express');
const cors = require('cors');
const { Horizon, rpc } = require('@stellar/stellar-sdk');
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
    horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
    rpcUrl: process.env.RPC_URL || 'https://soroban-testnet.stellar.org',
    networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    fairwageContractId: process.env.FAIRWAGE_CONTRACT_ID,
    tokenContractId: process.env.TOKEN_CONTRACT_ID,
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000')
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
const HORIZON_URL = config.horizonUrl;
const RPC_URL = config.rpcUrl;
const NETWORK_PASSPHRASE = config.networkPassphrase;
const FAIRWAGE_CONTRACT_ID = config.fairwageContractId;
const TOKEN_CONTRACT_ID = config.tokenContractId;

// Initialize Stellar servers
const horizonServer = new Horizon.Server(HORIZON_URL);
const sorobanRpcServer = new rpc.Server(RPC_URL);

// Health check endpoint
app.get('/health', (req, res) => {
        res.json({
    status: 'OK', 
    timestamp: new Date().toISOString(),
    network: NETWORK_PASSPHRASE,
    horizonUrl: HORIZON_URL,
    rpcUrl: RPC_URL
  });
});

// Get contract information
app.get('/api/contracts', (req, res) => {
        res.json({
    fairwageContractId: FAIRWAGE_CONTRACT_ID,
    tokenContractId: TOKEN_CONTRACT_ID,
    network: NETWORK_PASSPHRASE,
    horizonUrl: HORIZON_URL,
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

    const account = await horizonServer.loadAccount(address);
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

// Start server on all interfaces (required for Replit environment)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FairWage Backend Server running on 0.0.0.0:${PORT}`);
  console.log(`📡 Horizon URL: ${HORIZON_URL}`);
  console.log(`🔗 Soroban RPC URL: ${RPC_URL}`);
  console.log(`🌐 Network: ${NETWORK_PASSPHRASE}`);
  console.log(`📋 FairWage Contract ID: ${FAIRWAGE_CONTRACT_ID || 'Not configured'}`);
  console.log(`🪙 Token Contract ID: ${TOKEN_CONTRACT_ID || 'Not configured'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📝 Configuration: ${config.fairwageContractId ? 'config.js' : 'environment variables'}`);
});

module.exports = app;