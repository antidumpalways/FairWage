// File: frontend/lib/soroban.ts
// Updated to use Rabet Wallet (NO npm package needed)

// Declare Rabet types
declare global {
  interface Window {
    rabet?: {
      connect(): Promise<{ publicKey: string; error?: string }>;
      sign(xdr: string, network: string): Promise<{ xdr: string; error?: string }>;
      disconnect(): Promise<void>;
      isUnlocked(): Promise<boolean>;
      close(): Promise<void>;
      on(event: string, handler: Function): void;
    };
  }
}

// HANYA SATU import statement - hapus yang duplikat
import * as StellarSdk from "@stellar/stellar-sdk";

// Configuration - Using Official Stellar SDK
const serverUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = StellarSdk.Networks.TESTNET;
const FRIENDBOT_URL = 'https://friendbot.stellar.org';

// Get contract ID from backend or localStorage
const getContractId = async (): Promise<string | null> => {
    try {
        // First try to get from backend - use dynamic backend URL for Replit
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
          (typeof window !== 'undefined' && window.location.hostname.includes('replit.dev') 
            ? '/api/contracts' // Use Next.js proxy to avoid CORS
            : 'http://localhost:3001/api/contracts');
        const response = await fetch(backendUrl);
        if (response.ok) {
            const data = await response.json();
            if (data.contractId) {
                console.log('📋 Using contract ID from backend:', data.contractId);
                // Save to localStorage for future use
                if (typeof window !== 'undefined') {
                    localStorage.setItem('fairWageContractId', data.contractId);
                }
                return data.contractId;
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not fetch contract ID from backend:', error);
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('fairWageContractId');
        if (stored) {
            console.log('📋 Using contract ID from localStorage:', stored);
            return stored;
    }
    }

    // Return null instead of throwing error - contracts can be deployed later
    console.log('ℹ️ No contract ID found - app will work in deployment mode');
    return null;
};

// Force TESTNET network type
const networkType: 'TESTNET' | 'PUBLIC' = 'TESTNET';

// Function to generate realistic mock contract IDs
const generateRealisticContractId = (): string => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Initialize servers with proper error handling
let server: any = null;
let horizon: StellarSdk.Horizon.Server | null = null;

// Initialize servers safely
const initializeServers = () => {
    try {
        if (!server) {
            console.log('🔧 Initializing Soroban Server...');
            server = new (StellarSdk as any).SorobanRpc.Server(serverUrl);
            console.log('✅ Soroban Server initialized');
        }
        
        if (!horizon && typeof window !== 'undefined') {
            console.log('🔧 Initializing Horizon Server...');
            horizon = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
            console.log('✅ Horizon Server initialized');
        }
} catch (error) {
        console.error('❌ Server initialization error:', error);
    }
};

// Initialize on module load (only in browser)
if (typeof window !== 'undefined') {
    initializeServers();
}

console.log('✅ Stellar SDK module loaded');
console.log('🌐 Network: TESTNET');

// Wallet connection function
export const connectWallet = async (): Promise<string> => {
    try {
        console.log('🔍 Checking Rabet wallet...');
        
        if (typeof window === 'undefined') {
            throw new Error("Rabet wallet is not available in this environment");
        }
        
        // Check if Rabet extension is installed
        if (!window.rabet) {
            throw new Error("Rabet wallet is not installed! Please install Rabet extension first.");
        }
        
        console.log('✅ Rabet is installed');

        // Connect to Rabet
        const result = await window.rabet.connect();
        
        if (result.error) {
            throw new Error(`Failed to connect to Rabet: ${result.error}`);
        }
        
        const publicKey = result.publicKey;
        console.log("🎉 Address received:", publicKey);
        
            return publicKey;
        
    } catch (error) {
        console.error("❌ Error connecting to Rabet wallet:", error);
        throw error;
    }
};

// Health check function
export const healthCheck = async (): Promise<{ success: boolean; message?: string }> => {
    try {
        console.log('🏥 Checking backend health...');
        
        // Initialize servers if not already done
        if (!server) {
            initializeServers();
        }
        
        // Check Soroban network health
        if (server) {
            const latestLedger = await server.getLatestLedger();
            console.log('✅ Soroban network healthy, ledger:', latestLedger.sequence);
        }
        
        // Check backend API health via Next.js proxy
        const response = await fetch('/api/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend health check passed:', data);
            return { success: true, message: 'Backend is healthy' };
        } else {
            console.warn('⚠️ Backend health check failed with status:', response.status);
            return { success: false, message: `Backend returned status ${response.status}` };
        }
    } catch (error) {
        console.error('❌ Backend health check error:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
};

// Generate keypair from Rabet (UPDATED - no more Freighter)
export const generateKeypairFromRabet = async () => {
    try {
        const publicKey = await connectWallet(); // Uses Rabet now
        
        console.log('✅ Using Rabet signing API for deployment');
        console.log('🔐 Rabet will handle transaction signing securely');
        
        return {
            publicKey: publicKey,
            useRabetSigning: true
        };
    } catch (error) {
        console.error('Failed to generate keypair:', error);
        throw error;
    }
};

// Simplified Token Contract Deployment
export const deployTokenContract = async (tokenName: string, tokenSymbol: string): Promise<string> => {
    try {
        console.log('🚀 REAL Token Contract Deployment Starting...');
        console.log('📋 Token Name:', tokenName);
        console.log('📋 Token Symbol:', tokenSymbol);
        
        const publicKey = await connectWallet();
        
        // Get REAL transaction from backend
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/prepare-token-deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userPublicKey: publicKey,
                tokenName,
                tokenSymbol
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`REAL deployment failed: ${errorData.error}`);
        }
        
        const result = await response.json();
        console.log('✅ Got transaction XDR from backend');
        
        // TAMBAHAN: Log XDR untuk validasi di Stellar Labs
        console.log('📋 Transaction XDR:', result.transactionXdr);
        console.log('🔗 Validate at: https://laboratory.stellar.org/#xdr-viewer');
        
        // Sign the REAL transaction with Rabet (instead of Freighter)
        console.log('🔐 Signing transaction with Rabet...');
        
        if (!window.rabet) {
            throw new Error("Rabet wallet not available");
        }
        
        const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
        
        if (signResult.error) {
            throw new Error(`Failed to sign with Rabet: ${signResult.error}`);
        }
        
        const signedXdr = signResult.xdr;
        console.log('✅ Transaction signed successfully');
        
        // Submit the REAL signed transaction to Stellar network
        console.log('📡 Submitting to Stellar network...');
        const submitResponse = await fetch(`${backendUrl}/api/submit-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr,  // GANTI dari signedXdr ke signedTransactionXdr
                tokenName,
                tokenSymbol
            })
        });
        
        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Transaction submission failed: ${errorData.error}`);
        }
        
        const submitResult = await submitResponse.json();
        const contractId = submitResult.contractId;
        
        console.log('🎉 REAL Token Contract deployed successfully!');
        console.log('📋 Contract ID:', contractId);
        
        // Validate contract ID before proceeding
        if (!contractId) {
            throw new Error('Contract ID not returned from backend - deployment may have failed');
        }
        
        // Store the REAL contract ID
        if (typeof window !== 'undefined') {
            localStorage.setItem('tokenContractId', contractId);
        }
        
        return contractId;
        
    } catch (error) {
        console.error("❌ REAL Token Contract deployment failed!", error);
        throw error;
    }
};

// Simplified FairWage Contract Deployment
export const deployFairWageContract = async (tokenContractId: string): Promise<string> => {
    try {
        console.log('🚀 Deploying FairWage Contract...');
        console.log('📋 Token Contract ID:', tokenContractId);
        
        // Use backend API for FairWage deployment
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/prepare-fairwage-deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userPublicKey: await connectWallet(),
                tokenContractId: tokenContractId,
                companyName: 'FairWage Company' // Default company name
            })
        });
        
        if (!response.ok) {
            throw new Error(`Deployment failed with status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Got FairWage transaction XDR from backend');
        
        // Sign the FairWage transaction with Rabet
        console.log('🔐 Signing FairWage transaction with Rabet...');
        
        if (!window.rabet) {
            throw new Error("Rabet wallet not available");
        }
        
        const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
        
        if (signResult.error) {
            throw new Error(`Failed to sign with Rabet: ${signResult.error}`);
        }
        
        const signedXdr = signResult.xdr;
        console.log('✅ FairWage transaction signed successfully');
        
        // Submit the signed transaction to backend
        console.log('📡 Submitting FairWage transaction to backend...');
        const submitResponse = await fetch(`${backendUrl}/api/submit-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr,
                contractType: 'fairwage'
            })
        });
        
        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`FairWage transaction submission failed: ${errorData.error}`);
        }
        
        const submitResult = await submitResponse.json();
        const contractId = submitResult.contractId;
        
        console.log('✅ FairWage Contract deployed successfully!');
        console.log('📋 Contract ID:', contractId);
        
        // Validate contract ID before proceeding
        if (!contractId) {
            throw new Error('FairWage Contract ID not returned from backend - deployment may have failed');
        }
        
        // Store contract ID in local storage
        if (typeof window !== 'undefined') {
            localStorage.setItem('fairWageContractId', contractId);
        }
        
        return contractId;
        
    } catch (error) {
        console.error("❌ FairWage Contract deployment failed!", error);
        throw error;
    }
};

// Get stored contract IDs
export const getStoredContractIds = (): { tokenContractId?: string, fairWageContractId?: string } => {
    if (typeof window === 'undefined') return {};
    
    return {
        tokenContractId: localStorage.getItem('tokenContractId') || undefined,
        fairWageContractId: localStorage.getItem('fairWageContractId') || undefined
    };
};

// Get contract info
export const getContractInfo = async (): Promise<any> => {
    try {
        const contractId = await getContractId();
        console.log('📋 Getting contract info for:', contractId);
        
        // Use backend API to get contract info
        const response = await fetch(`http://localhost:3001/api/contract-info?contractId=${contractId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to get contract info: ${response.status}`);
        }
        
        const contractInfo = await response.json();
        console.log('✅ Contract info retrieved:', contractInfo);
        
        return contractInfo;
    } catch (error) {
        console.error('❌ Failed to get contract info:', error);
        throw error;
    }
};

// Set contract ID
export const setContractId = (contractId: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('fairWageContractId', contractId);
    }
};

export const getCurrentContractId = async (): Promise<string | null> => {
    return await getContractId();
};

// Fetch accrued balance
export const fetchAccruedBalance = async (employeeAddress: string): Promise<bigint> => {
    try {
        console.log('💰 Fetching accrued balance for:', employeeAddress);
        
        const contractId = await getContractId();
        const response = await fetch('/api/accrued-balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employeeAddress,
                fairWageContractId: contractId
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch balance: ${response.status}`);
        }
        
        const result = await response.json();
        const balance = BigInt(result.balance || 0);
        
            console.log('✅ Accrued balance:', balance.toString());
            return balance;
    } catch (error) {
        console.error('❌ Failed to fetch accrued balance:', error);
        throw error;
    }
};

// Get network health
export const getNetworkHealth = async () => {
    try {
        console.log('🌐 Checking network health...');
        
        // Initialize servers if needed
        if (!server) {
            initializeServers();
        }
        
        if (!server) {
            throw new Error('Server not initialized');
        }
        
        const latestLedger = await server.getLatestLedger();
        console.log('✅ Network is healthy, latest ledger:', latestLedger.sequence);
        
        return {
            healthy: true,
            latestLedger: latestLedger.sequence,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Network health check failed:', error);
        return {
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
};

// Get account info
export const getAccountInfo = async (accountId: string) => {
    try {
        console.log('👤 Getting account info for:', accountId);
        
        // Initialize servers if needed
        if (!horizon) {
            initializeServers();
        }
        
        if (!horizon) {
            throw new Error('Horizon server not initialized');
        }
        
        const account = await horizon.accounts().accountId(accountId).call();
        console.log('✅ Account info retrieved');
        
        return account;
    } catch (error) {
        console.error('❌ Failed to get account info:', error);
        throw error;
    }
};

// Get account transactions
export const getAccountTransactions = async (accountId: string, limit: number = 20) => {
    try {
        console.log('📊 Getting transactions for:', accountId);
        
        if (!horizon) {
            throw new Error('Horizon server not initialized');
        }
        
        const transactions = await horizon.transactions()
            .forAccount(accountId)
            .limit(limit)
            .order('desc')
            .call();
            
        console.log('✅ Transactions retrieved:', transactions.records.length);
        return transactions.records;
    } catch (error) {
        console.error('❌ Failed to get transactions:', error);
        throw error;
    }
};

// Get recent transactions
export const getRecentTransactions = async (limit: number = 20) => {
    try {
        const publicKey = await connectWallet();
        return await getAccountTransactions(publicKey, limit);
    } catch (error) {
        console.error('❌ Failed to get recent transactions:', error);
        throw error;
    }
};

// Get contract events
export const getContractEvents = async (startLedger?: number, limit: number = 100) => {
    try {
        console.log('📋 Getting contract events...');
        
        const contractId = getContractId();
        const events = await server.getEvents({
            startLedger,
            filters: [{
                type: 'contract',
                contractIds: [contractId]
            }],
            limit
        });
        
        console.log('✅ Contract events retrieved:', events.length);
        return events;
    } catch (error) {
        console.error('❌ Failed to get contract events:', error);
        throw error;
    }
};

// Deposit funds to contract
export const depositFunds = async (amount: bigint): Promise<void> => {
    try {
        console.log('💰 Depositing funds to contract...');
        console.log('💵 Amount:', amount.toString());
        
        const contractId = getContractId();
        const publicKey = await connectWallet();
        
        // Use backend API for deposit transaction
        const response = await fetch('http://localhost:3001/api/deposit-funds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contractId,
                employerAddress: publicKey,
                amount: amount.toString()
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Deposit failed with status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Funds deposited successfully:', result);
        
    } catch (error) {
        console.error('❌ Failed to deposit funds:', error);
        throw error;
    }
};

// Function untuk karyawan buat trustline
export async function createTrustlineForEmployee(tokenContractId: string, tokenSymbol: string): Promise<string> {
    try {
        console.log('🔗 Creating trustline for employee...', { tokenContractId, tokenSymbol });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Load user account
        if (!horizon) {
            throw new Error('Horizon server not initialized');
        }
        const sourceAccount = await horizon.loadAccount(publicKey);
        
        // Create trustline operation
        const operation = StellarSdk.Operation.changeTrust({
            asset: new StellarSdk.Asset(tokenSymbol, tokenContractId),
            limit: '922337203685.4775807' // Max limit
        });

        // Build transaction
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: '100000',
            networkPassphrase: networkPassphrase,
        })
        .addOperation(operation)
        .setTimeout(30)
        .build();

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(transaction.toXDR(), StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction
        const result = await horizon.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase));
        console.log('✅ Trustline created successfully:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error creating trustline:', error);
        throw error;
    }
}

// Function untuk get accrued balance
export async function getAccruedBalance(fairWageContractId: string, employeeAddress: string): Promise<number> {
    try {
        console.log('📊 Getting accrued balance...', { fairWageContractId, employeeAddress });

        // Use backend API instead of simulateTransaction
        const response = await fetch(`http://localhost:3001/api/accrued-balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fairWageContractId,
                employeeAddress
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        const balance = data.balance || 0;
        console.log('✅ Accrued balance retrieved:', balance);
        return balance;
    } catch (error) {
        console.error('❌ Error getting accrued balance:', error);
        throw error;
    }
}

// Function untuk list employees
export async function listEmployees(fairWageContractId: string): Promise<string[]> {
    try {
        console.log('📋 Listing employees...', { fairWageContractId });

        const response = await fetch('/api/list-employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fairWageContractId: fairWageContractId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Failed to list employees'}`);
        }

        const data = await response.json();
        console.log('✅ Got employees from blockchain:', data.employees);
        return data.employees || [];
    } catch (error) {
        console.error('❌ Failed to list employees from blockchain:', error);
        throw error;
    }
}

// Function untuk get employee info
export async function getEmployeeInfo(fairWageContractId: string, employeeAddress: string): Promise<any> {
    try {
        console.log('👤 Getting employee info...', { fairWageContractId, employeeAddress });

        const result = await server.simulateTransaction({
            transaction: StellarSdk.TransactionBuilder.fromXDR(
                new StellarSdk.TransactionBuilder(
                    new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
                    { fee: '100000', networkPassphrase: networkPassphrase }
                )
                .addOperation(
                    StellarSdk.Operation.invokeContractFunction({
                        contract: fairWageContractId,
                        function: 'get_employee_info',
                        args: [StellarSdk.Address.fromString(employeeAddress).toScVal()]
                    })
                )
                .setTimeout(30)
                .build()
                .toXDR(),
                networkPassphrase
            )
        });

        if (result.error) {
            throw new Error(`Simulation error: ${result.error.message}`);
        }

        const info = result.returnValue?.toScVal() || {};
        console.log('✅ Employee info retrieved:', info);
        return info;
    } catch (error) {
        console.error('❌ Error getting employee info:', error);
        throw error;
    }
}

// Function untuk add employee
export async function addEmployee(fairWageContractId: string, employeeAddress: string, name: string, wageRate: number, wagePeriod: string): Promise<string> {
    try {
        console.log('👤 Adding employee...', { fairWageContractId, employeeAddress, name, wageRate, wagePeriod });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Convert wage period to number
        const wagePeriodInt = wagePeriod === 'hour' ? 0 : wagePeriod === 'day' ? 1 : wagePeriod === 'week' ? 2 : 3;
        
        // Convert wage rate to raw units (multiply by 10^7)
        const wageRateRaw = Math.floor(wageRate * 10000000);

        // Prepare add employee transaction
        const response = await fetch(`http://localhost:3001/api/add-employee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddress,
                wageRate: wageRateRaw,
                wagePeriod: wagePeriodInt
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Add employee transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Add employee transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error adding employee:', error);
        throw error;
    }
}

// Function untuk remove employee
export async function removeEmployee(fairWageContractId: string, employeeAddress: string): Promise<string> {
    try {
        console.log('🗑️ Removing employee...', { fairWageContractId, employeeAddress });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Prepare remove employee transaction
        const response = await fetch(`http://localhost:3001/api/remove-employee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddress
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Remove employee transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Remove employee transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error removing employee:', error);
        throw error;
    }
}

// Function untuk pay employee
export async function payEmployee(fairWageContractId: string, employeeAddress: string, amount: number): Promise<string> {
    try {
        console.log('💰 Paying employee...', { fairWageContractId, employeeAddress, amount });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Prepare pay employee transaction
        const response = await fetch(`http://localhost:3001/api/pay-employee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddress,
                amount
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Pay employee transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Pay employee transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error paying employee:', error);
        throw error;
    }
}

// Function untuk pay all wages
export async function payAllWages(fairWageContractId: string, employeeAddress: string): Promise<string> {
    try {
        console.log('💰 Paying all wages...', { fairWageContractId, employeeAddress });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Prepare pay all wages transaction
        const response = await fetch(`http://localhost:3001/api/pay-all-wages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddress
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Pay all wages transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Pay all wages transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error paying all wages:', error);
        throw error;
    }
}

// Function untuk pay all employees
export async function payAllEmployees(fairWageContractId: string, employeeAddresses: string[]): Promise<string> {
    try {
        console.log('💰 Paying all employees...', { fairWageContractId, employeeAddresses });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Prepare pay all employees transaction
        const response = await fetch(`http://localhost:3001/api/pay-all-employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddresses
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Pay all employees transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Pay all employees transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error paying all employees:', error);
        throw error;
    }
}

// Function untuk fund contract
export async function fundContract(fairWageContractId: string, amount: number): Promise<string> {
    try {
        console.log('💰 Funding contract...', { fairWageContractId, amount });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Prepare fund contract transaction
        const response = await fetch(`http://localhost:3001/api/fund-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                amount
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Fund contract transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Fund contract transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error funding contract:', error);
        throw error;
    }
}

// Function untuk check contract balance
export async function checkContractBalance(fairWageContractId: string): Promise<number> {
    try {
        console.log('💰 Checking contract balance...', { fairWageContractId });

        // Get token contract ID from localStorage
        const tokenContractId = localStorage.getItem('tokenContractId');
        if (!tokenContractId) {
            throw new Error('Token contract ID not found in localStorage');
        }

        // Use backend API instead of simulateTransaction
        const response = await fetch('/api/check-contract-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fairWageContractId,
                tokenContractId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        const balance = data.balance || 0;
        console.log('✅ Contract balance retrieved:', balance);
        return balance;
    } catch (error) {
        console.error('❌ Error checking contract balance:', error);
        throw error;
    }
}

// Function untuk initialize contract
export async function initializeContract(fairWageContractId: string, tokenContractId: string): Promise<string> {
    try {
        console.log('🚀 Initializing contract...', { fairWageContractId, tokenContractId });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Prepare initialize contract transaction
        const response = await fetch(`http://localhost:3001/api/initialize-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                tokenContractId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Initialize contract transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Initialize contract transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error initializing contract:', error);
        throw error;
    }
}

// Function untuk freeze employee
export async function freezeEmployee(fairWageContractId: string, employeeAddress: string): Promise<string> {
    try {
        console.log(' Freezing employee...', { fairWageContractId, employeeAddress });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Prepare freeze employee transaction
        const response = await fetch(`http://localhost:3001/api/freeze-employee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddress
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Freeze employee transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Freeze employee transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error freezing employee:', error);
        throw error;
    }
}

// Function untuk activate employee
export async function activateEmployee(fairWageContractId: string, employeeAddress: string): Promise<string> {
    try {
        console.log('🟢 Activating employee...', { fairWageContractId, employeeAddress });

        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }

        console.log('✅ Got public key from Rabet:', publicKey);

        // Prepare activate employee transaction
        const response = await fetch(`http://localhost:3001/api/activate-employee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddress
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Activate employee transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Activate employee transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error activating employee:', error);
        throw error;
    }
}

// Function untuk update wage rate
export async function updateWageRate(fairWageContractId: string, employeeAddress: string, newWageRate: number): Promise<string> {
    try {
        console.log('💰 Updating wage rate...', { fairWageContractId, employeeAddress, newWageRate });
        
        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }
        
        console.log('✅ Got public key from Rabet:', publicKey);
        
        // Prepare update wage rate transaction
        const response = await fetch(`http://localhost:3001/api/update-wage-rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddress,
                newWageRate
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }
        
        const data = await response.json();
        console.log('✅ Update wage rate transaction prepared:', data.transactionXdr);
        
        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });
        
        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }
        
        const result = await submitResponse.json();
        console.log('✅ Update wage rate transaction submitted:', result.hash);
        
        return result.hash;
    } catch (error) {
        console.error('❌ Error updating wage rate:', error);
        throw error;
    }
}

// Function untuk employee withdraw funds
export async function withdrawEmployeeFunds(fairWageContractId: string, employeeAddress: string): Promise<string> {
    try {
        console.log('💰 Employee withdrawing funds...', { fairWageContractId, employeeAddress });
        
        // Get user public key from Rabet
        if (!window.rabet) {
            throw new Error('Rabet wallet not found. Please install Rabet extension.');
        }
        
        const { publicKey } = await window.rabet.connect();
        if (!publicKey) {
            throw new Error('Failed to get public key from Rabet');
        }
        
        console.log('✅ Got public key from Rabet:', publicKey);
        
        // Prepare employee withdraw transaction
        const response = await fetch(`http://localhost:3001/api/employee-withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                employeeAddress
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Employee withdraw transaction prepared:', data.transactionXdr);

        // Sign transaction with Rabet
        const signResult = await window.rabet.sign(data.transactionXdr, StellarSdk.Networks.TESTNET);
        const signedXdr = signResult.xdr;
        
        if (!signedXdr) {
            throw new Error('Transaction signing cancelled');
        }

        console.log('✅ Transaction signed by Rabet');

        // Submit transaction via backend
        const submitResponse = await fetch('http://localhost:3001/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signedXdr
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Backend error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await submitResponse.json();
        console.log('✅ Employee withdraw transaction submitted:', result.hash);

        return result.hash;
    } catch (error) {
        console.error('❌ Error withdrawing employee funds:', error);
        throw error;
    }
}


export { server, horizon, networkType };
