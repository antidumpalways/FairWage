# FairWage - Blockchain Payroll System

## Project Overview
A decentralized payroll system built on Stellar Soroban enabling real-time wage accrual and instant withdrawals.

## Current State
- **Status**: Successfully imported and configured for Replit environment
- **Frontend**: Next.js 13 running on port 5000 with proper host configuration (0.0.0.0)
- **Backend**: Node.js Express server on localhost:3001 with Stellar SDK integration
- **Smart Contracts**: Rust/Soroban contracts with precompiled WASM files available
- **Database**: Uses Stellar blockchain (no traditional database required)

## Architecture
- **Frontend**: Next.js with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express API server with Stellar blockchain integration
- **Blockchain**: Stellar Soroban smart contracts for payroll management
- **Wallet**: Freighter wallet integration for user authentication

## Recent Changes 
### Import Setup
- Configured Next.js for Replit proxy environment (removed invalid config properties)
- Fixed Stellar SDK imports in backend (changed from Server to Horizon.Server)
- Set up CORS configuration for cross-origin requests
- Configured deployment for autoscale target
- Established proper port configuration (frontend: 5000, backend: 3001)

### Deployment Configuration Fix (Sep 12, 2025)
- Fixed deployment failure caused by missing `wasm32-unknown-unknown` Rust target
- Updated deployment build command to only build frontend (avoiding contract compilation)
- Updated deployment run command to explicitly serve on port 5000
- Modified root package.json build scripts to prevent accidental contract builds
- Changed default "build" to frontend-only, added "build:all" for full pipeline
- Successfully tested deployment configuration with working frontend/backend workflows

## User Preferences
- None recorded yet

## Key Features
- Real-time wage accrual per second
- Instant withdrawals with minimal fees
- Multi-company support
- Employer dashboard for employee management
- Employee dashboard for balance monitoring
- Blockchain-based audit trail

## Development Notes
- Frontend runs on 0.0.0.0:5000 (required for Replit proxy)
- Backend runs on localhost:3001 (backend requirement)
- Smart contracts use precompiled WASM files (Backend/fungible.wasm)
- Uses Stellar testnet by default