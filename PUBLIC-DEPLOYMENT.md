# Public Deployment Guide

## ✅ REAL PUBLIC DEPLOYMENT

Sistem FairWage sudah dikonfigurasi untuk **PUBLIC DEPLOYMENT** menggunakan **REAL WALLET ADDRESS**, bukan test-key.

### 🔐 Security Features

1. **Real Wallet Integration**: Menggunakan Freighter wallet yang sudah connect
2. **No Test Keys**: Tidak menggunakan test-key untuk public deployment
3. **Wallet Validation**: Validasi wallet address sebelum deployment
4. **Real Transaction Fees**: Menggunakan XLM balance yang real

### 🚀 Deployment Flow

```
User Wallet (Freighter) → Frontend → Backend Script → Soroban CLI → Blockchain
```

### 📋 Requirements for Public Deployment

1. **Freighter Wallet**: Harus sudah install dan connect
2. **XLM Balance**: Minimal 1 XLM untuk deployment fees
3. **Soroban CLI**: Harus sudah terinstall dan updated
4. **WASM Files**: Sudah compiled di Backend directory

### 🔧 Commands Used

```bash
# Upload contract (menggunakan real wallet)
soroban contract upload --source-account [REAL_WALLET_ADDRESS] --wasm target/wasm32-unknown-unknown/release/fair_wage_contract.optimized.wasm --network testnet

# Deploy contract (menggunakan real wallet)
soroban contract deploy --source-account [REAL_WALLET_ADDRESS] --wasm-hash [WASM_HASH] --network testnet

# Initialize contract (menggunakan real wallet)
soroban contract invoke --id [CONTRACT_ID] --source-account [REAL_WALLET_ADDRESS] --network testnet -- initialize --token_address [REAL_WALLET_ADDRESS] --employer [REAL_WALLET_ADDRESS]
```

### ⚠️ Important Notes

- **TIDAK MENGGUNAKAN test-key** untuk public deployment
- **Menggunakan wallet address yang real** dari Freighter
- **Real transaction fees** akan dikenakan
- **Real contract ID** akan dihasilkan dari blockchain
- **Real deployment** ke Soroban testnet

### 🧪 Testing

Untuk test deployment:
1. Connect Freighter wallet
2. Pastikan ada XLM balance
3. Klik "Create Company" di frontend
4. Masukkan company details
5. Klik "Deploy Contract"

Sistem akan menggunakan **REAL DEPLOYMENT** dengan wallet address yang sudah connect.

### 🔒 Security

- Wallet private key tetap aman di Freighter
- Tidak ada hardcoded keys di kode
- Semua transaksi menggunakan wallet yang sudah connect
- Real blockchain deployment dengan real fees




