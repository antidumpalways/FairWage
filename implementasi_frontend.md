# Dokumentasi Implementasi Frontend - FairWage Smart Contract

## Daftar Isi
1. [Overview](#overview)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Smart Contract Functions](#smart-contract-functions)
4. [Frontend Integration](#frontend-integration)
5. [Error Handling](#error-handling)
6. [Contoh Implementasi](#contoh-implementasi)
7. [Testing](#testing)
8. [Deployment](#deployment)

## Overview

FairWage adalah smart contract yang dibangun di atas Stellar network menggunakan Soroban SDK. Contract ini memungkinkan majikan untuk mengelola karyawan dengan sistem upah berbasis waktu real-time. Frontend dibangun menggunakan Next.js dengan TypeScript dan Tailwind CSS.

## Arsitektur Sistem

```
Frontend (Next.js) ←→ Stellar Network ←→ Smart Contract (Soroban)
     ↓
Wallet Integration (Stellar Wallet)
     ↓
Smart Contract Functions
```

### Tech Stack
- **Backend**: Rust + Soroban SDK
- **Frontend**: Next.js 13 + TypeScript + Tailwind CSS
- **Blockchain**: Stellar Network
- **Smart Contract**: Soroban WASM

## Smart Contract Functions

### 1. Contract Initialization

#### `initialize(employer: Address, token_address: Address)`
**Deskripsi**: Inisialisasi contract dengan alamat majikan dan token yang akan digunakan.

**Parameter**:
- `employer`: Alamat wallet majikan (Address)
- `token_address`: Alamat token contract (Address)

**Response**:
- `Ok(())` - Berhasil diinisialisasi
- `Err(Error::AlreadyInitialized)` - Contract sudah diinisialisasi
- `Err(Error::NotAuthorized)` - Tidak memiliki otorisasi

**Frontend Implementation**:
```typescript
const initializeContract = async (employerAddress: string, tokenAddress: string) => {
  try {
    const result = await contract.initialize(employerAddress, tokenAddress);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 2. Employee Management

#### `add_employee(employee_address: Address, wage_rate: i128)`
**Deskripsi**: Menambahkan karyawan baru dengan rate upah tertentu.

**Parameter**:
- `employee_address`: Alamat wallet karyawan (Address)
- `wage_rate`: Rate upah per detik (i128)

**Response**:
- `Ok(())` - Karyawan berhasil ditambahkan
- `Err(Error::NotAuthorized)` - Hanya majikan yang bisa menambah karyawan
- `Err(Error::InvalidWageRate)` - Rate upah tidak valid (≤ 0)
- `Err(Error::EmployeeAlreadyExists)` - Karyawan sudah ada

**Frontend Implementation**:
```typescript
const addEmployee = async (employeeAddress: string, wageRate: number) => {
  try {
    const result = await contract.add_employee(employeeAddress, wageRate);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### `update_wage_rate(employee_address: Address, new_wage_rate: i128)`
**Deskripsi**: Memperbarui rate upah karyawan.

**Parameter**:
- `employee_address`: Alamat wallet karyawan (Address)
- `new_wage_rate`: Rate upah baru per detik (i128)

**Response**:
- `Ok(())` - Rate upah berhasil diperbarui
- `Err(Error::NotAuthorized)` - Hanya majikan yang bisa mengubah rate
- `Err(Error::InvalidWageRate)` - Rate upah tidak valid (< 0)
- `Err(Error::EmployeeNotFound)` - Karyawan tidak ditemukan

**Frontend Implementation**:
```typescript
const updateWageRate = async (employeeAddress: string, newWageRate: number) => {
  try {
    const result = await contract.update_wage_rate(employeeAddress, newWageRate);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### `remove_employee(employee_address: Address)`
**Deskripsi**: Menghapus karyawan dari sistem.

**Parameter**:
- `employee_address`: Alamat wallet karyawan (Address)

**Response**:
- `Ok(())` - Karyawan berhasil dihapus
- `Err(Error::NotAuthorized)` - Hanya majikan yang bisa menghapus karyawan
- `Err(Error::EmployeeNotFound)` - Karyawan tidak ditemukan
- `Err(Error::CannotRemoveActiveEmployee)` - Tidak bisa menghapus karyawan aktif

**Frontend Implementation**:
```typescript
const removeEmployee = async (employeeAddress: string) => {
  try {
    const result = await contract.remove_employee(employeeAddress);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 3. Fund Management

#### `deposit(amount: i128)`
**Deskripsi**: Majikan melakukan deposit dana ke contract.

**Parameter**:
- `amount`: Jumlah token yang akan di-deposit (i128)

**Response**:
- `Ok(())` - Deposit berhasil
- `Err(Error::NotAuthorized)` - Hanya majikan yang bisa deposit
- `Err(Error::InvalidAmount)` - Jumlah tidak valid (≤ 0)
- `Err(Error::TokenNotConfigured)` - Token belum dikonfigurasi

**Frontend Implementation**:
```typescript
const depositFunds = async (amount: number) => {
  try {
    const result = await contract.deposit(amount);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### `withdraw_surplus(amount: i128)`
**Deskripsi**: Majikan menarik dana surplus dari contract.

**Parameter**:
- `amount`: Jumlah token yang akan ditarik (i128)

**Response**:
- `Ok(())` - Penarikan berhasil
- `Err(Error::NotAuthorized)` - Hanya majikan yang bisa menarik surplus
- `Err(Error::InvalidAmount)` - Jumlah tidak valid (≤ 0)
- `Err(Error::TokenNotConfigured)` - Token belum dikonfigurasi

**Frontend Implementation**:
```typescript
const withdrawSurplus = async (amount: number) => {
  try {
    const result = await contract.withdraw_surplus(amount);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 4. Employee Operations

#### `withdraw(employee_address: Address, amount: i128)`
**Deskripsi**: Karyawan menarik upah yang sudah diakumulasi.

**Parameter**:
- `employee_address`: Alamat wallet karyawan (Address)
- `amount`: Jumlah token yang akan ditarik (i128)

**Response**:
- `Ok(())` - Penarikan berhasil
- `Err(Error::NotAuthorized)` - Hanya karyawan yang bisa menarik upahnya
- `Err(Error::InvalidAmount)` - Jumlah tidak valid (≤ 0)
- `Err(Error::EmployeeNotFound)` - Karyawan tidak ditemukan
- `Err(Error::WithdrawalExceedsAccrued)` - Jumlah melebihi upah yang diakumulasi

**Frontend Implementation**:
```typescript
const withdrawWages = async (amount: number) => {
  try {
    const result = await contract.withdraw(employeeAddress, amount);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### `get_accrued_balance(employee_address: Address)`
**Deskripsi**: Mendapatkan saldo upah yang sudah diakumulasi karyawan.

**Parameter**:
- `employee_address`: Alamat wallet karyawan (Address)

**Response**:
- `Ok(i128)` - Saldo upah yang diakumulasi
- `Err(Error::EmployeeNotFound)` - Karyawan tidak ditemukan

**Frontend Implementation**:
```typescript
const getAccruedBalance = async (employeeAddress: string) => {
  try {
    const balance = await contract.get_accrued_balance(employeeAddress);
    return { success: true, data: balance };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### `payday_sweep(employee_address: Address)`
**Deskripsi**: Majikan melakukan pembayaran upah penuh kepada karyawan.

**Parameter**:
- `employee_address`: Alamat wallet karyawan (Address)

**Response**:
- `Ok(())` - Pembayaran berhasil
- `Err(Error::NotAuthorized)` - Hanya majikan yang bisa melakukan payday sweep
- `Err(Error::EmployeeNotFound)` - Karyawan tidak ditemukan
- `Err(Error::NothingToWithdraw)` - Tidak ada upah yang bisa ditarik

**Frontend Implementation**:
```typescript
const paydaySweep = async (employeeAddress: string) => {
  try {
    const result = await contract.payday_sweep(employeeAddress);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Frontend Integration

### 1. Wallet Connection

Frontend menggunakan context untuk mengelola koneksi wallet:

```typescript
// contexts/WalletContext.tsx
interface WalletContextType {
  isWalletConnected: boolean;
  publicKey: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}
```

### 2. Contract Integration

Setiap komponen frontend mengintegrasikan dengan smart contract melalui fungsi-fungsi yang telah didefinisikan:

#### Employer Components
- **DepositFundsCard**: Untuk deposit dana ke contract
- **EmployeeManagementCard**: Untuk mengelola karyawan
- **ContractInfoCard**: Untuk melihat informasi contract

#### Employee Components
- **BalanceCard**: Untuk melihat saldo upah
- **WithdrawCard**: Untuk menarik upah

### 3. State Management

Frontend menggunakan React hooks untuk mengelola state:
- `useState` untuk state lokal komponen
- `useContext` untuk state global (wallet)
- Custom hooks untuk operasi contract

## Error Handling

### Error Types

```rust
#[contracterror]
pub enum Error {
    AlreadyInitialized = 1,
    InvalidWageRate = 2,
    WithdrawalExceedsAccrued = 3,
    EmployeeNotFound = 4,
    NotAuthorized = 5,
    InvalidAmount = 6,
    EmployeeAlreadyExists = 7,
    TokenNotConfigured = 8,
    NothingToWithdraw = 9,
    CannotRemoveActiveEmployee = 10,
}
```

### Frontend Error Handling

```typescript
const handleContractCall = async (contractFunction: Function, ...args: any[]) => {
  try {
    const result = await contractFunction(...args);
    return { success: true, data: result };
  } catch (error) {
    console.error('Contract call failed:', error);
    
    // Parse error message
    let errorMessage = 'Unknown error occurred';
    if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      error: errorMessage,
      errorCode: extractErrorCode(errorMessage)
    };
  }
};

const extractErrorCode = (errorMessage: string): number => {
  // Extract error code from Soroban error message
  const match = errorMessage.match(/Error\((\d+)\)/);
  return match ? parseInt(match[1]) : -1;
};
```

## Contoh Implementasi

### 1. Complete Employee Management

```typescript
// components/employer/EmployeeManagementCard.tsx
const EmployeeManagementCard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddEmployee = async (address: string, wageRate: number) => {
    setIsLoading(true);
    try {
      const result = await addEmployee(address, wageRate);
      if (result.success) {
        // Update local state
        const newEmployee = { address, wageRate, id: Date.now().toString() };
        setEmployees([...employees, newEmployee]);
        // Show success message
        toast.success('Employee added successfully');
      } else {
        toast.error(`Failed to add employee: ${result.error}`);
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRate = async (employeeId: string, newWageRate: number) => {
    setIsLoading(true);
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      const result = await updateWageRate(employee.address, newWageRate);
      if (result.success) {
        // Update local state
        setEmployees(employees.map(emp => 
          emp.id === employeeId ? { ...emp, wageRate: newWageRate } : emp
        ));
        toast.success('Wage rate updated successfully');
      } else {
        toast.error(`Failed to update wage rate: ${result.error}`);
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of component
};
```

### 2. Complete Withdrawal Process

```typescript
// components/employee/WithdrawCard.tsx
const WithdrawCard: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    // Load available balance on component mount
    loadAvailableBalance();
  }, []);

  const loadAvailableBalance = async () => {
    try {
      const result = await getAccruedBalance(userAddress);
      if (result.success) {
        setAvailableBalance(result.data);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleWithdraw = async (withdrawAmount: number) => {
    if (withdrawAmount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      const result = await withdrawWages(withdrawAmount);
      if (result.success) {
        toast.success('Withdrawal successful!');
        setAmount('');
        // Reload balance
        await loadAvailableBalance();
      } else {
        toast.error(`Withdrawal failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of component
};
```

## Testing

### 1. Contract Testing

```bash
# Run contract tests
cd Backend
cargo test

# Run specific test
cargo test test_fair_wage_full_scenario
```

### 2. Frontend Testing

```bash
# Install dependencies
cd Frontend
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### 3. Integration Testing

```typescript
// Test contract integration
describe('Contract Integration', () => {
  it('should initialize contract successfully', async () => {
    const result = await initializeContract(employerAddress, tokenAddress);
    expect(result.success).toBe(true);
  });

  it('should add employee successfully', async () => {
    const result = await addEmployee(employeeAddress, 100);
    expect(result.success).toBe(true);
  });

  it('should calculate accrued balance correctly', async () => {
    const balance = await getAccruedBalance(employeeAddress);
    expect(balance.success).toBe(true);
    expect(balance.data).toBeGreaterThan(0);
  });
});
```

## Deployment

### 1. Contract Deployment

```bash
# Build contracts
cd Backend
cargo build --target wasm32-unknown-unknown --release

# Deploy using Scaffold
stellar scaffold watch --build-clients
```

### 2. Frontend Deployment

```bash
# Build frontend
cd Frontend
npm run build

# Start production server
npm start

# Or deploy to Vercel/Netlify
npm run deploy
```

### 3. Environment Configuration

```typescript
// lib/config.ts
export const CONFIG = {
  NETWORK: process.env.NEXT_PUBLIC_NETWORK || 'testnet',
  CONTRACT_ID: process.env.NEXT_PUBLIC_CONTRACT_ID || '',
  TOKEN_ID: process.env.NEXT_PUBLIC_TOKEN_ID || '',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
};
```

## Kesimpulan

Dokumentasi ini memberikan panduan lengkap untuk mengintegrasikan frontend Next.js dengan smart contract FairWage di Stellar network. Setiap fungsi contract memiliki implementasi frontend yang sesuai dengan error handling yang robust.

### Best Practices

1. **Error Handling**: Selalu handle error dari contract calls
2. **Loading States**: Tampilkan loading state untuk operasi async
3. **User Feedback**: Berikan feedback yang jelas untuk setiap operasi
4. **State Management**: Gunakan React hooks untuk state management yang efisien
5. **Type Safety**: Manfaatkan TypeScript untuk type safety

### Next Steps

1. Implementasi real wallet integration dengan Stellar wallet
2. Tambahkan unit tests untuk setiap komponen
3. Implementasi caching untuk data contract
4. Tambahkan monitoring dan analytics
5. Optimasi gas usage untuk operasi contract
