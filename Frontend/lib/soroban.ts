// File: frontend/lib/soroban.ts
// Updated to use Rabet Wallet (NO npm package needed)

// Declare Rabet types only
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
        
        // Check backend API health - Use Render backend by default
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://fairwage.onrender.com'}/health`, {
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
        
        // Get publicKey from localStorage (set by WalletContext)
        let publicKey = localStorage.getItem('publicKey');
        console.log('🔑 PublicKey from localStorage:', publicKey);
        
        if (!publicKey) {
            throw new Error("Wallet not connected. Please connect your wallet first.");
        }
        
        // Get REAL transaction from backend
        const requestData = {
            userPublicKey: publicKey,
            tokenName,
            tokenSymbol
        };
        console.log('📤 Sending request to backend:', requestData);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/prepare-token-deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        console.log('📥 Backend response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Backend error response:", errorData);
            throw new Error(`Token deployment failed: ${errorData.error || 'Unknown backend error'}`);
        }
        
        const result = await response.json();
        console.log('✅ Got transaction XDR from backend');
        
        // Validate XDR format before signing
        try {
            const StellarSdk = require('@stellar/stellar-sdk');
            const transaction = StellarSdk.TransactionBuilder.fromXDR(result.transactionXdr, 'TESTNET');
            console.log('✅ XDR validation successful');
            console.log('📋 Transaction source:', transaction.source);
            console.log('📋 Transaction sequence:', transaction.sequence);
            console.log('📋 Transaction operations count:', transaction.operations.length);
            console.log('📋 First operation type:', transaction.operations[0]?.type);
            
            // Check if this is a Soroban transaction (simplified for Vercel build)
            const hasSorobanOps = transaction.operations.length > 0;
            console.log('📋 Has operations:', hasSorobanOps);
            
        } catch (xdrError) {
            console.error('❌ XDR validation failed:', xdrError);
            throw new Error('Invalid transaction format received from backend');
        }
        
        // Check browser compatibility
        const userAgent = navigator.userAgent.toLowerCase();
        const isEdge = userAgent.includes('edg/') || userAgent.includes('edge/');
        const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg/');
        const isFirefox = userAgent.includes('firefox');
        const isOpera = userAgent.includes('opr/') || userAgent.includes('opera');
        
        console.log('🌐 Browser detection:');
        console.log('📋 User Agent:', navigator.userAgent);
        console.log('📋 Is Edge:', isEdge);
        console.log('📋 Is Chrome:', isChrome);
        console.log('📋 Is Firefox:', isFirefox);
        console.log('📋 Is Opera:', isOpera);
        
        if (isEdge) {
            console.warn('⚠️ Microsoft Edge detected - known issues with Stellar wallet integrations');
            console.warn('💡 Recommendation: Use Chrome, Firefox, or Opera for better compatibility');
        }
        
        // Sign the transaction - try Freighter first (better Soroban support), then Rabet
        console.log('🔐 Signing transaction...');
        console.log('📋 Transaction XDR length:', result.transactionXdr.length);
        console.log('📋 Transaction XDR preview:', result.transactionXdr.substring(0, 100) + '...');
        console.log('🔑 Using publicKey for signing:', publicKey);
        
        let signResult;
        let signingError = null;
        
        // Use Rabet wallet only
        if (window.rabet) {
            try {
                console.log('🔄 Signing with Rabet wallet...');
                signResult = await window.rabet.sign(result.transactionXdr, 'testnet');
                console.log('✅ Signed with Rabet wallet');
                signingError = null;
            } catch (rabetError: any) {
                console.log('⚠️ Rabet testnet failed:', rabetError?.message || rabetError);
                signingError = rabetError;
                
                // Try with 'TESTNET' (uppercase)
                try {
                    signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
                    console.log('✅ Signed with TESTNET (uppercase)');
                    signingError = null;
                } catch (error2: any) {
                    console.log('⚠️ TESTNET (uppercase) failed:', error2?.message || error2);
                    signingError = error2;
                    
                    // Try with 'public' network as fallback
                    try {
                        signResult = await window.rabet.sign(result.transactionXdr, 'public');
                        console.log('✅ Signed with public network');
                        signingError = null;
                    } catch (error3: any) {
                        console.log('⚠️ Public network failed:', error3?.message || error3);
                        signingError = error3;
                    }
                }
            }
        } else {
            signingError = new Error('Rabet wallet not found');
        }
        
        // Final check - if no signing method worked
        if (!signResult) {
            if (isEdge) {
                throw new Error('Microsoft Edge has known compatibility issues with Stellar wallet integrations. Please try using Chrome, Firefox, or Opera browser for better wallet support.');
            } else {
                throw new Error('All signing methods failed. Please check your wallet connection and try again.');
            }
        }
        
        console.log('📝 Sign result:', signResult);
        
        if (!signResult.xdr) {
            console.error('❌ Signing failed - no XDR returned');
            console.error('❌ Sign result details:', JSON.stringify(signResult, null, 2));
            throw new Error(`Signing failed: ${signResult.error || 'No XDR returned'}`);
        }
        
        console.log('✅ Transaction signed successfully');
        
        // Submit the signed transaction
        const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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
        
    } catch (error: any) {
        console.error("❌ Token Contract deployment failed!", error);
        console.error("🔍 Error details:", error);
        console.error("🔍 Error message:", error.message);
        console.error("🔍 Error cause:", error.cause);
        
        // Provide more specific error messages
        if (error.message?.includes("Rabet wallet not found")) {
            throw new Error("Please install and connect Rabet wallet extension");
        } else if (error.message?.includes("Failed to get public key")) {
            throw new Error("Wallet connection failed. Please reconnect your wallet.");
        } else if (error.message?.includes("Signing cancelled")) {
            throw new Error("Transaction signing was cancelled");
        } else if (error.message?.includes("Missing required fields")) {
            throw new Error("Token name and symbol are required");
        } else if (error.message?.includes("Cannot submit unprepared")) {
            throw new Error("Network error: Unable to prepare transaction");
        } else if (error.message?.includes("no-account")) {
            throw new Error("Account not found in wallet. Please make sure your Rabet wallet is properly connected and has a valid account with the correct public key.");
        } else if (error.message?.includes("Signing failed")) {
            throw new Error("Transaction signing failed. Please check if your wallet is unlocked and try again.");
        } else if (error.message?.includes("Invalid XDR")) {
            throw new Error("Invalid transaction format. Please try again or contact support if the issue persists.");
        } else {
            throw new Error(error.message || "Token deployment failed. Please try again.");
        }
    }
};

// Simplified FairWage Contract Deployment
export const deployFairWageContract = async (tokenContractId: string, companyName: string = 'FairWage Company', tokenSymbol: string = 'FAIRWAGE'): Promise<string> => {
    try {
        console.log('🚀 Starting FairWage deployment...');
        console.log('📋 Token Contract ID:', tokenContractId);
        
        if (!window.rabet) {
            throw new Error("Rabet wallet not found.");
        }
        
        const { publicKey } = await window.rabet.connect();
        console.log('🎉 Rabet connected:', publicKey);
        
        // Use backend API for FairWage deployment
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/prepare-fairwage-deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                tokenContractId: tokenContractId,
                companyName: companyName
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
        const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
        if (!signResult.xdr) throw new Error("Signing cancelled");
        
        console.log('✅ FairWage transaction signed successfully');
        
        // Submit the signed transaction
        const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signResult.xdr,
                contractType: 'fairwage',
                companyName: companyName,
                tokenSymbol: tokenSymbol
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/prepare-fairwage-initialize`, {
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
        const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
        if (!signResult.xdr) throw new Error("Signing cancelled");
        
        console.log('✅ Initialization transaction signed successfully');
        
        // Submit the signed transaction
        const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/get-current-contract`);
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/add-employee`, {
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

    const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pay-all-wages`, {
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

    const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/get-employee-info`, {
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

// Alias for employee dashboard compatibility
export const fetchAccruedBalance = async (employeeAddress: string, contractId?: string): Promise<bigint> => {
    const balance = await getEmployeeBalance(employeeAddress, contractId);
    return BigInt(balance);
};

// Employee withdrawal function
export const withdrawEmployeeFunds = async (contractId?: string): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();
    
    const fairWageContractId = contractId || localStorage.getItem('fairWageContractId');
    if (!fairWageContractId) throw new Error('Contract not found. Please provide a contract ID.');

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pay-employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userPublicKey: publicKey,
            fairWageContractId,
            employeeAddress: publicKey
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to withdraw funds: ${errorData.error}`);
    }

    const result = await response.json();

    console.log('🔧 XDR to sign (withdraw all):', result.transactionXdr.substring(0, 50) + '...');
    
    // Validate XDR before signing
    try {
        const envelope = StellarSdk.xdr.TransactionEnvelope.fromXDR(result.transactionXdr, 'base64');
        const tx = new StellarSdk.Transaction(envelope, StellarSdk.Networks.TESTNET);
        console.log('🔧 XDR source account:', tx.source);
        console.log('🔧 Connected account:', publicKey);
        if (tx.source !== publicKey) {
            throw new Error(`XDR source mismatch: XDR source=${tx.source}, connected=${publicKey}`);
        }
    } catch (xdrError: any) {
        throw new Error(`Invalid XDR format: ${xdrError.message}`);
    }
    
    const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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

export const removeEmployee = async (fairWageContractId: string, employeeAddress: string): Promise<string> => {
    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();

    console.log('🗑️ Remove employee called with:', {
        fairWageContractId,
        employeeAddress,
        userPublicKey: publicKey
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/remove-employee`, {
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
        console.error('❌ Remove employee API error:', errorData);
        throw new Error(`Failed to remove employee: ${errorData.error}`);
    }

    const result = await response.json();
    console.log('✅ Remove employee transaction prepared:', result);

    const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
    if (!signResult.xdr) throw new Error("Signing cancelled");

    console.log('✅ Transaction signed, submitting...');
    const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransactionXdr: signResult.xdr })
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        console.error('❌ Submit transaction error:', errorData);
        throw new Error(`Submit failed: ${errorData.error}`);
    }

    const submitResult = await submitResponse.json();
    console.log('✅ Transaction submitted successfully:', submitResult);
    
    if (!submitResult.transactionHash) {
        console.error('❌ No transaction hash in response:', submitResult);
        throw new Error('Transaction submitted but no hash returned');
    }
    
    return submitResult.transactionHash;
};

export const freezeEmployee = async (fairWageContractId: string, employeeAddress: string): Promise<string> => {
    console.log('🧊 Freeze employee called with:', {
        fairWageContractId,
        employeeAddress,
        contractIdLength: fairWageContractId?.length,
        addressLength: employeeAddress?.length
    });

    if (!window.rabet) throw new Error("Rabet wallet not found.");
    const { publicKey } = await window.rabet.connect();
    console.log('🔑 Connected wallet:', publicKey);

    const requestBody = {
        userPublicKey: publicKey,
        fairWageContractId,
        employeeAddress
    };
    console.log('📤 Sending request body:', requestBody);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/freeze-employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to freeze employee: ${errorData.error}`);
    }

    const result = await response.json();

    const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/activate-employee`, {
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

    const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/update-wage-rate`, {
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

    const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/fund-contract`, {
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

    const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
    if (!signResult.xdr) throw new Error("Signing cancelled");

    const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/check-contract-balance`, {
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

// Get employee balance with better debugging
export const getEmployeeBalance = async (employeeAddress: string, contractId?: string): Promise<number> => {
    try {
        // Use provided contractId or get from localStorage
        const useContractId = contractId || localStorage.getItem("fairWageContractId");
        
        console.log('🔍 Getting employee balance:', { 
            employeeAddress, 
            contractId: useContractId,
            fromStorage: !contractId
        });

        if (!useContractId) {
            console.error('❌ No contract ID available for balance check');
            return 0;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/get-accrued-balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                fairWageContractId: useContractId, 
                employeeAddress 
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Employee balance API failed:', response.status, errorText);
            return 0;
        }

        const result = await response.json();
        console.log('✅ Employee balance result:', result);
        
        return result.balance || 0;
    } catch (error) {
        console.error('❌ Failed to check balance:', error);
        return 0;
    }
};

// List employees function
export const listEmployees = async (fairWageContractId: string): Promise<any[]> => {
    try {
        console.log('🔍 Frontend listEmployees request:', { fairWageContractId });
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/list-employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fairWageContractId })
        });

        console.log('🔍 listEmployees response status:', response.status);

        if (!response.ok) {
            console.warn('⚠️ Failed to list employees, status:', response.status);
            return [];
        }

        const result = await response.json();
        console.log('🔍 listEmployees result:', result);
        return result.employees || [];
    } catch (error) {
        console.warn('⚠️ Failed to list employees from blockchain:', error);
        return [];
    }
};

// Partial withdraw function for custom amount
export const partialWithdraw = async (amount: string, contractId?: string): Promise<string> => {
    const fairWageContractId = contractId || await getCurrentContractId();
    if (!fairWageContractId) throw new Error("Contract not found");

    if (!window.rabet) throw new Error("Rabet wallet not found");

    try {
        const { publicKey } = await window.rabet.connect();
        
        // Send original amount - backend will handle conversion to stroops  
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/partial-withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: publicKey,
                fairWageContractId: fairWageContractId,
                employeeAddress: publicKey,
                amount: amount  // Send original amount like "100"
            })
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to prepare partial withdrawal');
        }

        console.log('🔧 XDR to sign:', result.transactionXdr.substring(0, 50) + '...');
        
        // Validate XDR before signing
        try {
            const envelope = StellarSdk.xdr.TransactionEnvelope.fromXDR(result.transactionXdr, 'base64');
            const tx = new StellarSdk.Transaction(envelope, StellarSdk.Networks.TESTNET);
            console.log('🔧 XDR source account:', tx.source);
            console.log('🔧 Connected account:', publicKey);
            if (tx.source !== publicKey) {
                throw new Error(`XDR source mismatch: XDR source=${tx.source}, connected=${publicKey}`);
            }
        } catch (xdrError: any) {
            throw new Error(`Invalid XDR format: ${xdrError.message}`);
        }
        
        const signResult = await window.rabet.sign(result.transactionXdr, 'TESTNET');
        if (!signResult.xdr) throw new Error("Signing cancelled");
        
        const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/submit-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signedTransactionXdr: signResult.xdr
            })
        });

        const submitResult = await submitResponse.json();
        if (!submitResponse.ok || !submitResult.success) {
            throw new Error(submitResult.error || 'Failed to submit transaction');
        }

        return submitResult.transactionHash;
    } catch (error) {
        console.error('❌ Partial withdraw error:', error);
        throw error;
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
    listEmployees,
    fetchAccruedBalance,
    withdrawEmployeeFunds,
    partialWithdraw
};