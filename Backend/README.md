# FairWage Backend Server

A Node.js Express server that provides API endpoints for the FairWage blockchain payroll system.

## Configuration

The server can be configured in two ways:

### 1. Environment Variables (Recommended)

Create a `.env` file in the Backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Stellar Network Configuration
RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contract IDs (replace with your deployed contract IDs)
FAIRWAGE_CONTRACT_ID=YOUR_FAIRWAGE_CONTRACT_ID_HERE
TOKEN_CONTRACT_ID=YOUR_TOKEN_CONTRACT_ID_HERE

# Optional Configuration
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

### 2. Configuration File

Copy `config.example.js` to `config.js` and update the values:

```javascript
module.exports = {
  port: 3001,
  nodeEnv: 'development',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  fairwageContractId: 'YOUR_FAIRWAGE_CONTRACT_ID_HERE',
  tokenContractId: 'YOUR_TOKEN_CONTRACT_ID_HERE',
  logLevel: 'info',
  corsOrigin: 'http://localhost:3000'
};
```

## Getting Contract IDs

To get your contract IDs, follow the deployment process in the main README:

1. Deploy your FairWage contract to testnet
2. Deploy your token contract to testnet
3. Copy the contract IDs to your configuration

## Running the Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/contracts` - Get contract information
- `GET /api/balance/:address` - Get account balance
- `GET /api/contract/:contractId/state` - Get contract state

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `RPC_URL` | Stellar RPC endpoint | https://soroban-testnet.stellar.org |
| `NETWORK_PASSPHRASE` | Stellar network passphrase | Test SDF Network ; September 2015 |
| `FAIRWAGE_CONTRACT_ID` | Deployed FairWage contract ID | Required |
| `TOKEN_CONTRACT_ID` | Deployed token contract ID | Required |
| `LOG_LEVEL` | Logging level | info |
| `CORS_ORIGIN` | CORS origin | http://localhost:3000 |
