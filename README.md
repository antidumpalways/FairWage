# 🏢 FairWage - Blockchain-Powered Payroll System

A decentralized payroll system built on Stellar Soroban that enables real-time wage accrual and instant withdrawals for employees.

## ✨ Features

### 🏭 **Employer Dashboard**
- **Multi-Company Management** - Manage multiple companies with separate contracts
- **Real-Time Fund Tracking** - Monitor total funds and employee counts
- **Smart Contract Deployment** - Deploy custom token and FairWage contracts
- **Employee Management** - Add, update, and remove employees with wage rates
- **Fund Deposits** - Deposit funds to contracts for payroll

### 👷 **Employee Dashboard**
- **Real-Time Balance** - View wages that accrue by the second
- **Instant Withdrawals** - Withdraw earned wages anytime
- **Transaction History** - Complete history of all wage transactions
- **Performance Tracking** - Monitor work hours and efficiency
- **Earnings Calculator** - Real-time calculation of earnings

### 🔗 **Blockchain Integration**
- **Soroban Smart Contracts** - Built with Rust and Soroban SDK
- **Stellar Network** - Fast, secure, and low-cost transactions
- **Freighter Wallet** - Seamless wallet integration
- **Real-Time Updates** - Live blockchain data integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Rust 1.70+
- Freighter Wallet extension
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/FairWage.git
cd FairWage
```

2. **Install Frontend Dependencies**
```bash
cd Frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../Backend
cargo build
```

4. **Start Development Server**
```bash
cd ../Frontend
npm run dev
```

5. **Open in Browser**
```
http://localhost:3000
```

## 🏗️ Architecture

### **Frontend (Next.js 13)**
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context for wallet management
- **Blockchain SDK**: Sorobuild Stellar SDK integration

### **Backend (Rust + Soroban)**
- **Smart Contracts**: Rust-based Soroban contracts
- **Token System**: Custom fungible tokens for each company
- **Wage Logic**: Real-time wage accrual calculations
- **Security**: Role-based access control and validation

### **Blockchain (Stellar Soroban)**
- **Network**: Stellar Testnet/Mainnet
- **Consensus**: Stellar Consensus Protocol
- **Transactions**: Fast 3-5 second finality
- **Fees**: Ultra-low transaction costs

## 📱 Usage

### **For Employers**

1. **Connect Wallet**
   - Install Freighter wallet extension
   - Connect to Stellar network
   - Ensure sufficient XLM balance

2. **Deploy Contracts**
   - Create company profile
   - Deploy custom token contract
   - Deploy FairWage smart contract
   - Add employees with wage rates

3. **Manage Payroll**
   - Deposit funds to contracts
   - Monitor employee balances
   - View transaction history

### **For Employees**

1. **Connect Wallet**
   - Install Freighter wallet extension
   - Connect to Stellar network
   - View real-time wage balance

2. **Monitor Earnings**
   - Real-time wage accrual display
   - Work statistics and performance
   - Transaction history tracking

3. **Withdraw Wages**
   - Instant withdrawals anytime
   - No waiting periods
   - Minimal gas fees

## 🔧 Development

### **Project Structure**
```
FairWage/
├── Frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utility functions and SDK
│   └── public/              # Static assets
├── Backend/                 # Rust smart contracts
│   ├── contracts/           # Soroban smart contracts
│   │   └── fungible/        # FairWage contract
│   └── target/              # Compiled contracts
└── README.md                # This file
```

### **Smart Contract Functions**

#### **FairWage Contract**
- `initialize()` - Initialize contract with employer and token
- `add_employee()` - Add new employee with wage rate
- `update_wage_rate()` - Update employee wage rate
- `remove_employee()` - Remove employee from system
- `deposit()` - Employer deposits funds
- `withdraw()` - Employee withdraws wages
- `get_accrued_balance()` - Get current wage balance

#### **Token Contract**
- Custom fungible tokens for each company
- Configurable token name and symbol
- Standard Stellar token functionality

### **Environment Variables**

Create `.env.local` in Frontend directory:

```env
# Network Configuration
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contract IDs (after deployment)
NEXT_PUBLIC_FAIRWAGE_CONTRACT_ID=CD...
NEXT_PUBLIC_TOKEN_WASM_HASH=...
NEXT_PUBLIC_FAIRWAGE_WASM_HASH=...
```

## 🧪 Testing

### **Frontend Testing**
```bash
cd Frontend
npm run test
npm run lint
```

### **Smart Contract Testing**
```bash
cd Backend
cargo test
```

### **Manual Testing**
1. Deploy contracts to testnet
2. Test employer workflow
3. Test employee workflow
4. Verify blockchain transactions

## 🚀 Deployment

### **Smart Contracts to Testnet**
```bash
cd Backend
cargo build --target wasm32-unknown-unknown --release
soroban contract install --wasm target/wasm32-unknown-unknown/release/fair_wage_contract.wasm
```

### **Frontend to Production**
```bash
cd Frontend
npm run build
npm run start
```

### **Environment Setup**
1. Update environment variables for production
2. Configure mainnet network settings
3. Deploy contracts to mainnet
4. Update contract IDs in environment

## 🔒 Security Features

- **Role-Based Access Control** - Only employers can manage employees
- **Input Validation** - Comprehensive parameter validation
- **Secure Withdrawals** - Employees can only withdraw their own wages
- **Audit Trail** - Complete transaction history on blockchain
- **No Central Authority** - Fully decentralized system

## 📊 Performance

- **Real-Time Updates** - Balance updates every 10 seconds
- **Fast Transactions** - 3-5 second finality on Stellar
- **Low Fees** - Minimal transaction costs
- **Scalable** - Handles multiple companies and employees

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For the amazing Soroban platform
- **Sorobuild Team** - For the excellent SDK and tools
- **OpenZeppelin** - For smart contract best practices
- **shadcn/ui** - For the beautiful UI components

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/FairWage/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/FairWage/discussions)
- **Documentation**: [Project Wiki](https://github.com/yourusername/FairWage/wiki)

## 🔮 Roadmap

### **Phase 1 (Current)**
- ✅ Basic employer/employee functionality
- ✅ Real-time wage accrual
- ✅ Instant withdrawals
- ✅ Multi-company support

### **Phase 2 (Next)**
- 🔄 Advanced analytics dashboard
- 🔄 Automated payroll scheduling
- 🔄 Tax calculation integration
- 🔄 Mobile app development

### **Phase 3 (Future)**
- 📋 Cross-chain compatibility
- 📋 DeFi integration
- 📋 AI-powered insights
- 📋 Enterprise features

---

**Built with ❤️ on Stellar Soroban**

*Empowering the future of decentralized payroll*
