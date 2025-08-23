# 🚀 FairWage-Stellar Deployment Guide

Complete deployment guide for the FairWage blockchain payroll system.

## 📋 Quick Start Options

### **Option 1: Frontend Only (Quick Deploy) ⚡**
Deploy frontend ke Vercel dalam 5 menit:
```bash
cd Frontend
npm install -g vercel
vercel --prod
```

### **Option 2: Full Stack (Complete System) 🏗️**
Deploy frontend + smart contracts ke testnet:
```bash
# 1. Deploy Frontend
cd Frontend
vercel --prod

# 2. Deploy Smart Contracts
cd ../Backend
cargo build --target wasm32-unknown-unknown --release
soroban contract install --wasm target/wasm32-unknown-unknown/release/fair_wage_contract.wasm --network testnet
```

## 🌐 Frontend Deployment (Vercel)

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Login to Vercel**
```bash
vercel login
```

### **Step 3: Deploy Frontend**
```bash
cd Frontend
vercel --prod
```

### **Step 4: Set Environment Variables**
Di Vercel dashboard, set:
```env
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_FAIRWAGE_CONTRACT_ID=CD...
NEXT_PUBLIC_TOKEN_WASM_HASH=...
NEXT_PUBLIC_FAIRWAGE_WASM_HASH=...
```

## 🔧 Smart Contract Deployment

### **Prerequisites**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Soroban CLI
curl -sSfL https://soroban.stellar.org/install.sh | sh

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"
```

### **Build Contracts**
```bash
cd Backend
cargo build --target wasm32-unknown-unknown --release
```

### **Deploy to Testnet**
```bash
# Install WASM to network
WASM_HASH=$(soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/fair_wage_contract.wasm \
  --network testnet)

echo "WASM Hash: $WASM_HASH"

# Deploy contract
CONTRACT_ID=$(soroban contract deploy \
  --wasm-hash $WASM_HASH \
  --network testnet)

echo "Contract ID: $CONTRACT_ID"
```

### **Deploy to Mainnet**
```bash
# Switch to mainnet
export SOROBAN_NETWORK=mainnet
export SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org
export SOROBAN_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"

# Deploy (same commands as testnet)
soroban contract install --wasm target/wasm32-unknown-unknown/release/fair_wage_contract.wasm --network mainnet
```

## 📱 Alternative Frontend Hosting

### **Netlify**
```bash
cd Frontend
npm run build
npm install -g netlify-cli
netlify deploy --prod --dir=out
```

### **GitHub Pages**
```bash
cd Frontend
npm run build
npm run export
# Upload 'out' folder to GitHub Pages
```

### **Self-Hosted**
```bash
cd Frontend
npm run build
npm run start
# Access at http://localhost:3000
```

## 🔐 Environment Setup

### **Development (.env.local)**
```env
# Testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org

# Contract IDs (after deployment)
NEXT_PUBLIC_FAIRWAGE_CONTRACT_ID=CD...
NEXT_PUBLIC_TOKEN_WASM_HASH=...
NEXT_PUBLIC_FAIRWAGE_WASM_HASH=...
```

### **Production (Vercel)**
Set di Vercel dashboard dengan nilai yang sama.

## 🧪 Testing Before Deployment

### **Local Testing**
```bash
cd Frontend
npm run dev
# Test di http://localhost:3000
```

### **Build Testing**
```bash
cd Frontend
npm run build
npm run start
# Test production build
```

### **Contract Testing**
```bash
cd Backend
cargo test
cargo build --target wasm32-unknown-unknown --release
```

## 🚨 Common Issues & Solutions

### **Frontend Build Fails**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### **Contract Deployment Fails**
```bash
# Check account balance
soroban account show <your_account> --network testnet

# Get test XLM
curl "https://friendbot.stellar.org/?addr=<your_account>"
```

### **Environment Variables Not Working**
- Pastikan semua variables dimulai dengan `NEXT_PUBLIC_`
- Restart development server setelah update `.env.local`
- Check Vercel dashboard untuk production variables

## 📊 Monitoring & Maintenance

### **Health Checks**
```bash
# Check contract status
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_contract_info

# Monitor transactions
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_recent_transactions
```

### **Performance Monitoring**
- Vercel Analytics untuk frontend
- Stellar Explorer untuk blockchain transactions
- Custom logging untuk smart contract events

## 🔄 Automated Deployment

### **GitHub Actions (Already Setup)**
- Auto-deploy ke testnet saat push ke main
- Auto-deploy frontend ke Vercel
- Security checks dan testing

### **Manual Deployment**
```bash
# Update code
git add .
git commit -m "Update feature"
git push origin main

# GitHub Actions akan auto-deploy
```

## 📈 Production Checklist

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Frontend builds successfully
- [ ] Smart contracts compile without errors
- [ ] Environment variables configured
- [ ] Testnet testing completed

### **Deployment Day**
- [ ] Deploy smart contracts to testnet
- [ ] Update environment variables
- [ ] Deploy frontend to Vercel
- [ ] Test complete workflow
- [ ] Monitor for errors

### **Post-Deployment**
- [ ] Health checks passing
- [ ] User acceptance testing
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Documentation updated

## 🆘 Support & Resources

### **Official Documentation**
- [Soroban Docs](https://soroban.stellar.org/)
- [Stellar Developer Portal](https://developers.stellar.org/)
- [Next.js Documentation](https://nextjs.org/docs)

### **Community Support**
- [GitHub Issues](https://github.com/antidumpalways/FairWage-Stellar/issues)
- [Stellar Discord](https://discord.gg/stellarlabs)
- [Soroban Forum](https://forum.stellar.org/)

---

## 🎯 **Recommended Deployment Path**

1. **Start with Frontend Only** (5 minutes)
   - Deploy ke Vercel untuk demo
   - Test UI dan user experience

2. **Add Smart Contracts** (30 minutes)
   - Deploy ke testnet
   - Test blockchain functionality

3. **Go to Production** (1 hour)
   - Deploy ke mainnet
   - Configure production environment

**Happy Deploying! 🚀**

*Your FairWage system will be live and ready for users!*
