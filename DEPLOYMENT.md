# 🚀 FairWage Deployment Guide

Complete guide to deploy FairWage to different environments.

## 📋 Prerequisites

### **Required Tools**
- [Git](https://git-scm.com/) - Version control
- [Node.js 18+](https://nodejs.org/) - Frontend runtime
- [Rust 1.70+](https://rustup.rs/) - Smart contract compilation
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) - Contract deployment
- [Freighter Wallet](https://www.freighter.app/) - Stellar wallet

### **Accounts & Networks**
- **Testnet**: Get test XLM from [Stellar Friendbot](https://friendbot.stellar.org/)
- **Mainnet**: Ensure sufficient XLM for deployment
- **GitHub**: Repository for code hosting

## 🏗️ Local Development Setup

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/FairWage.git
cd FairWage
```

### **2. Frontend Setup**
```bash
cd Frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### **3. Backend Setup**
```bash
cd ../Backend
cargo build --target wasm32-unknown-unknown --release
```

### **4. Environment Configuration**
Create `.env.local` in Frontend directory:

```env
# Development (Testnet)
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org

# Production (Mainnet)
# NEXT_PUBLIC_RPC_URL=https://soroban-mainnet.stellar.org
# NEXT_PUBLIC_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
# NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org
```

## 🔧 Smart Contract Deployment

### **Testnet Deployment**

#### **1. Build Contracts**
```bash
cd Backend
cargo build --target wasm32-unknown-unknown --release
```

#### **2. Install WASM to Network**
```bash
# Install FairWage contract
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/fair_wage_contract.wasm \
  --network testnet

# Save the WASM hash
export FAIRWAGE_WASM_HASH=<output_hash>
```

#### **3. Deploy FairWage Contract**
```bash
# Deploy the contract
soroban contract deploy \
  --wasm-hash $FAIRWAGE_WASM_HASH \
  --network testnet \
  --source <your_account>

# Save the contract ID
export FAIRWAGE_CONTRACT_ID=<output_contract_id>
```

#### **4. Initialize Contract**
```bash
# Initialize with your account as employer
soroban contract invoke \
  --id $FAIRWAGE_CONTRACT_ID \
  --network testnet \
  --source <your_account> \
  -- initialize \
  --employer <your_account> \
  --token <token_contract_id>
```

### **Mainnet Deployment**

#### **1. Switch to Mainnet**
```bash
export SOROBAN_NETWORK=mainnet
export SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
export SOROBAN_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
```

#### **2. Deploy Contracts**
```bash
# Same commands as testnet but with mainnet network
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/fair_wage_contract.wasm \
  --network mainnet
```

## 🌐 Frontend Deployment

### **Vercel Deployment (Recommended)**

#### **1. Connect to Vercel**
```bash
npm install -g vercel
vercel login
```

#### **2. Deploy**
```bash
cd Frontend
vercel --prod
```

#### **3. Environment Variables**
Set in Vercel dashboard:
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_NETWORK_PASSPHRASE`
- `NEXT_PUBLIC_FAIRWAGE_CONTRACT_ID`
- `NEXT_PUBLIC_TOKEN_WASM_HASH`
- `NEXT_PUBLIC_FAIRWAGE_WASM_HASH`

### **Netlify Deployment**

#### **1. Build Project**
```bash
cd Frontend
npm run build
```

#### **2. Deploy to Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=out
```

### **Self-Hosted Deployment**

#### **1. Build for Production**
```bash
cd Frontend
npm run build
npm run start
```

#### **2. Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔐 Security Considerations

### **Environment Variables**
- Never commit `.env` files
- Use secure secret management
- Rotate keys regularly

### **Network Security**
- Test thoroughly on testnet
- Use secure RPC endpoints
- Validate all inputs

### **Access Control**
- Implement proper authentication
- Use role-based permissions
- Audit access logs

## 📊 Monitoring & Maintenance

### **Health Checks**
```bash
# Check contract status
soroban contract invoke \
  --id $FAIRWAGE_CONTRACT_ID \
  --network testnet \
  -- get_contract_info

# Monitor transactions
soroban contract invoke \
  --id $FAIRWAGE_CONTRACT_ID \
  --network testnet \
  -- get_recent_transactions
```

### **Performance Monitoring**
- Transaction success rates
- Gas fee optimization
- User experience metrics

### **Regular Updates**
- Update dependencies monthly
- Monitor security advisories
- Test contract upgrades

## 🚨 Troubleshooting

### **Common Issues**

#### **Contract Deployment Fails**
```bash
# Check account balance
soroban account show <your_account> --network testnet

# Verify WASM compilation
file target/wasm32-unknown-unknown/release/fair_wage_contract.wasm
```

#### **Frontend Build Errors**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

#### **Network Connection Issues**
```bash
# Test RPC endpoint
curl -X POST $NEXT_PUBLIC_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getHealth","params":[],"id":1}'
```

### **Support Resources**
- [Soroban Documentation](https://soroban.stellar.org/)
- [Stellar Developer Portal](https://developers.stellar.org/)
- [GitHub Issues](https://github.com/yourusername/FairWage/issues)

## 📈 Production Checklist

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Backup strategy in place

### **Deployment Day**
- [ ] Testnet validation complete
- [ ] Team notified of deployment
- [ ] Monitoring tools active
- [ ] Rollback plan ready
- [ ] Support team available

### **Post-Deployment**
- [ ] Health checks passing
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Error tracking active
- [ ] Documentation updated

## 🔄 Continuous Deployment

### **GitHub Actions**
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### **Automated Testing**
- Unit tests on every commit
- Integration tests before deployment
- E2E tests in staging environment

---

**Happy Deploying! 🚀**

*For additional support, check our [GitHub Issues](https://github.com/yourusername/FairWage/issues) or [Discussions](https://github.com/yourusername/FairWage/discussions).*
