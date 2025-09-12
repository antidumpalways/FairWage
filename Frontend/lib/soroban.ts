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

// Get contract ID from localStorage or environment - NOT THROWING ERROR
const getContractId = (): string | null => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('fairWageContractId');
        if (stored) return stored;
    }
    return process.env.NEXT_PUBLIC_FAIRWAGE_CONTRACT_ID || null;
};

// Force TESTNET network type
const networkType: 'TESTNET' | 'PUBLIC' = 'TESTNET';

// Function to generate realistic mock contract IDs
const generateRealisticContractId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 56; i++) {
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
        console.log("🎉 Rabet connected:", publicKey);
        
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
        
        // Check backend API health - Use API proxy
        const response = await fetch('/api/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend health:', data);
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
        console.log('🚀 Starting SAC token deployment...');
        console.log('📋 Token Name:', tokenName, 'Symbol:', tokenSymbol);
        
        if (!window.rabet) {
            throw new Error("Rabet wallet not found. Please install Rabet extension.");
        }
        
        const { publicKey } = await window.rabet.connect();
        console.log('🎉 Rabet connected:', publicKey);
        
        // Get REAL transaction from backend
        const response = await fetch('/api/prepare-token-deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                tokenName,
                tokenSymbol
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Token deployment failed: ${errorData.error}`);
        }
        
        const result = await response.json();
        console.log('✅ Got transaction XDR from backend');
        
        // Sign the transaction with Rabet
        console.log('🔐 Signing transaction with Rabet...');
        const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
        
        if (signResult.error) {
            throw new Error(`Failed to sign with Rabet: ${signResult.error}`);
        }
        
        console.log('✅ Transaction signed successfully');
        
        // Submit the signed transaction
        const submitResponse = await fetch('/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signResult.xdr,
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
        
        console.log('✅ SAC Token deployed successfully:', contractId);
        console.log('ℹ️ SAC tokens have unlimited supply and ready to use immediately');
        
        // Store the contract ID
        if (typeof window !== 'undefined') {
            localStorage.setItem('tokenContractId', contractId);
        }
        
        return contractId;
        
    } catch (error) {
        console.error("❌ Token Contract deployment failed!", error);
        throw error;
    }
};

// Simplified FairWage Contract Deployment
export const deployFairWageContract = async (tokenContractId: string): Promise<string> => {
    try {
        console.log('🚀 Starting FairWage deployment...');
        console.log('📋 Token Contract ID:', tokenContractId);
        
        if (!window.rabet) {
            throw new Error("Rabet wallet not found.");
        }
        
        const { publicKey } = await window.rabet.connect();
        console.log('🎉 Rabet connected:', publicKey);
        
        // Use backend API for FairWage deployment
        const response = await fetch('/api/prepare-fairwage-deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                tokenContractId: tokenContractId,
                companyName: 'FairWage Company'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`FairWage deployment failed: ${errorData.error}`);
        }
        
        const result = await response.json();
        console.log('✅ Got FairWage transaction XDR from backend');
        
        // Sign the FairWage transaction with Rabet
        console.log('🔐 Signing FairWage transaction with Rabet...');
        const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
        
        if (signResult.error) {
            throw new Error(`Failed to sign with Rabet: ${signResult.error}`);
        }
        
        console.log('✅ FairWage transaction signed successfully');
        
        // Submit the signed transaction
        const submitResponse = await fetch('/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signResult.xdr,
                contractType: 'fairwage'
            })
        });
        
        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`FairWage transaction submission failed: ${errorData.error}`);
        }
        
        const submitResult = await submitResponse.json();
        const contractId = submitResult.contractId;
        
        console.log('✅ FairWage deployed successfully:', contractId);
        
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

// Initialize FairWage Contract
export const initializeFairWageContract = async (fairWageContractId: string, tokenContractId: string): Promise<string> => {
    try {
        console.log('🔧 Starting FairWage initialization...');
        
        if (!window.rabet) {
            throw new Error("Rabet wallet not found.");
        }
        
        const { publicKey } = await window.rabet.connect();
        console.log('🎉 Rabet connected:', publicKey);
        
        // Prepare initialization transaction
        const response = await fetch('/api/prepare-fairwage-initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId,
                tokenContractId,
                companyName: 'FairWage Company'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`FairWage initialization failed: ${errorData.error}`);
        }
        
        const result = await response.json();
        console.log('✅ Got initialization transaction XDR from backend');
        
        // Sign the transaction with Rabet
        const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
        
        if (signResult.error) {
            throw new Error(`Failed to sign with Rabet: ${signResult.error}`);
        }
        
        console.log('✅ Initialization transaction signed successfully');
        
        // Submit the signed transaction
        const submitResponse = await fetch('/api/submit-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signResult.xdr,
                contractType: 'fairwage-init'
            })
        });
        
        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Initialization submission failed: ${errorData.error}`);
        }
        
        const submitResult = await submitResponse.json();
        
        console.log('✅ FairWage initialized successfully!');
        
        return submitResult.transactionHash;
        
    } catch (error) {
        console.error("❌ Failed to initialize FairWage!", error);
        console.log('🔍 Error details:', error);
        throw error;
    }
};

// Get stored contract IDs - NO ERRORS
export const getStoredContractIds = (): { tokenContractId?: string, fairWageContractId?: string } => {
    if (typeof window === 'undefined') return {};
    
    return {
        tokenContractId: localStorage.getItem('tokenContractId') || undefined,
        fairWageContractId: localStorage.getItem('fairWageContractId') || undefined
    };
};

// Get current contract ID safely - NO ERRORS
export const getCurrentContractId = async (): Promise<string | null> => {
    try {
        const contractId = getContractId();
        if (contractId) return contractId;
        
        // Try to get from backend if not in localStorage
        const response = await fetch('/api/get-both-contract-ids');
        if (response.ok) {
            const data = await response.json();
            if (data.fairWageContractId) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('fairWageContractId', data.fairWageContractId);
                }
                return data.fairWageContractId;
            }
        }
        
        return null; // No error, just return null
    } catch (error) {
        console.log('⚠️ No contract ID available yet');
        return null; // No error, just return null
    }
};

// Set contract ID
export const setContractId = (contractId: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('fairWageContractId', contractId);
    }
};

// Employee management functions (simplified)
export const addEmployee = async (
    fairWageContractId: string,
    employeeAddress: string,
    employeeName: string,
    wageRate: number,
    wagePeriod: number = 3600 // default to hourly (3600 seconds)
): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();

    const response = await fetch('/api/add-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userPublicKey: publicKey,
            fairWageContractId,
            employeeAddress,
            employeeName,
            wageRate: wageRate * 10000000, // Convert display units to raw units
            wagePeriod
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to add employee: ${errorData.error}`);
    }

    const result = await response.json();

    const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch('/api/submit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransactionXdr: signResult.xdr })
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Submit failed: ${errorData.error}`);
    }

    const submitResult = await submitResponse.json();
    return submitResult.transactionHash;
};

// Pay all wages function
export const payAllWages = async (
    fairWageContractId: string,
    employeeAddress: string
): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();

    const response = await fetch('/api/pay-all-wages', {
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
        throw new Error(`Failed to pay wages: ${errorData.error}`);
    }

    const result = await response.json();

    const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch('/api/submit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransactionXdr: signResult.xdr })
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Submit failed: ${errorData.error}`);
    }

    const submitResult = await submitResponse.json();
    return submitResult.transactionHash;
};

// Export alias for EmployeeManagementCard
export const payAllEmployees = payAllWages;

// Add alias for compatibility
export const initializeContract = initializeFairWageContract;

// Missing functions for EmployeeManagementCard compatibility
export const getEmployeeInfo = async (fairWageContractId: string, employeeAddress: string): Promise<any> => {
    try {
        const response = await fetch('/api/get-employee-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fairWageContractId, employeeAddress })
        });

        if (!response.ok) {
            console.warn('⚠️ Failed to get employee info');
            return null;
        }

        const result = await response.json();
        return result.employeeInfo || null;
    } catch (error) {
        console.warn('⚠️ Failed to get employee info:', error);
        return null;
    }
};

export const getAccruedBalance = async (employeeAddress: string): Promise<number> => {
    return getEmployeeBalance(employeeAddress);
};

export const removeEmployee = async (fairWageContractId: string, employeeAddress: string): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();

    const response = await fetch('/api/remove-employee', {
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
        throw new Error(`Failed to remove employee: ${errorData.error}`);
    }

    const result = await response.json();

    const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch('/api/submit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransactionXdr: signResult.xdr })
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Submit failed: ${errorData.error}`);
    }

    const submitResult = await submitResponse.json();
    return submitResult.transactionHash;
};

export const freezeEmployee = async (fairWageContractId: string, employeeAddress: string): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();

    const response = await fetch('/api/freeze-employee', {
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
        throw new Error(`Failed to freeze employee: ${errorData.error}`);
    }

    const result = await response.json();

    const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch('/api/submit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransactionXdr: signResult.xdr })
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Submit failed: ${errorData.error}`);
    }

    const submitResult = await submitResponse.json();
    return submitResult.transactionHash;
};

export const activateEmployee = async (fairWageContractId: string, employeeAddress: string): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();

    const response = await fetch('/api/activate-employee', {
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
        throw new Error(`Failed to activate employee: ${errorData.error}`);
    }

    const result = await response.json();

    const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch('/api/submit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransactionXdr: signResult.xdr })
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Submit failed: ${errorData.error}`);
    }

    const submitResult = await submitResponse.json();
    return submitResult.transactionHash;
};

export const updateWageRate = async (fairWageContractId: string, employeeAddress: string, newWageRate: number): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();

    const response = await fetch('/api/update-wage-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userPublicKey: publicKey,
            fairWageContractId,
            employeeAddress,
            newWageRate: newWageRate * 10000000 // Convert display units to raw units
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update wage rate: ${errorData.error}`);
    }

    const result = await response.json();

    const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch('/api/submit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransactionXdr: signResult.xdr })
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Submit failed: ${errorData.error}`);
    }

    const submitResult = await submitResponse.json();
    return submitResult.transactionHash;
};

export const payEmployee = async (fairWageContractId: string, employeeAddress: string): Promise<string> => {
    return payAllWages(fairWageContractId, employeeAddress);
};

export const fundContract = async (fairWageContractId: string, tokenContractId: string, amount: number): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();

    const response = await fetch('/api/fund-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userPublicKey: publicKey,
            fairWageContractId,
            tokenContractId,
            amount
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fund contract: ${errorData.error}`);
    }

    const result = await response.json();

    const signResult = await window.rabet.sign(result.transactionXdr, StellarSdk.Networks.TESTNET);
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch('/api/submit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransactionXdr: signResult.xdr })
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Submit failed: ${errorData.error}`);
    }

    const submitResult = await submitResponse.json();
    return submitResult.transactionHash;
};

export const checkContractBalance = async (fairWageContractId: string, tokenContractId: string): Promise<number> => {
    try {
        const response = await fetch('/api/check-contract-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fairWageContractId, tokenContractId })
        });

        if (!response.ok) {
            console.warn('⚠️ Failed to check contract balance');
            return 0;
        }

        const result = await response.json();
        return result.balance || 0;
    } catch (error) {
        console.warn('⚠️ Failed to check contract balance:', error);
        return 0;
    }
};

// Get employee balance
export const getEmployeeBalance = async (employeeAddress: string): Promise<number> => {
    try {
        const contractId = localStorage.getItem("fairWageContractId");
        const response = await fetch('/api/get-employee-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeAddress, contractId })
        });

        if (!response.ok) {
            console.warn('⚠️ Failed to get employee balance');
            return 0;
        }

        const result = await response.json();
        return result.balance || 0;
    } catch (error) {
        console.warn('⚠️ Failed to check balance:', error);
        return 0;
    }
};

// List employees function
export const listEmployees = async (fairWageContractId: string): Promise<any[]> => {
    try {
        const response = await fetch('/api/list-employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fairWageContractId })
        });

        if (!response.ok) {
            console.warn('⚠️ Failed to list employees');
            return [];
        }

        const result = await response.json();
        return result.employees || [];
    } catch (error) {
        console.warn('⚠️ Failed to list employees from blockchain:', error);
        return [];
    }
};

// Export default
export default {
    connectWallet,
    healthCheck,
    deployTokenContract,
    deployFairWageContract,
    initializeFairWageContract,
    getStoredContractIds,
    getCurrentContractId,
    setContractId,
    addEmployee,
    payAllWages,
    payAllEmployees,
    getEmployeeBalance,
    listEmployees
};