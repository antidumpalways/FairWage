import { rpc } from '@stellar/stellar-sdk';

export interface DiscoveredContract {
  contractId: string;
  tokenContractId?: string;
  companyName: string;
  tokenSymbol: string;
  deploymentDate: string;
  transactionHash: string;
  deployerAddress: string;
}

export interface ContractDiscoveryResult {
  success: boolean;
  contracts: DiscoveredContract[];
  totalFound: number;
  walletAddress: string;
  error?: string;
}

/**
 * Discover FairWage contracts deployed by wallet address
 */
export const discoverContractsByWallet = async (walletAddress: string): Promise<ContractDiscoveryResult> => {
  try {
    console.log(`🔍 Discovering contracts for wallet: ${walletAddress}`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/discover-contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress
      })
    });

    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Discovery result:`, result);
    
    return result;

  } catch (error) {
    console.error('❌ Contract discovery failed:', error);
    return {
      success: false,
      contracts: [],
      totalFound: 0,
      walletAddress: walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Load and set contract from discovery result
 */
export const selectDiscoveredContract = (contract: DiscoveredContract): void => {
  try {
    // Save selected contract to localStorage
    localStorage.setItem('fairWageContractId', contract.contractId);
    
    if (contract.tokenContractId) {
      localStorage.setItem('tokenContractId', contract.tokenContractId);
    }
    
    localStorage.setItem('companyName', contract.companyName);
    localStorage.setItem('tokenSymbol', contract.tokenSymbol);
    
    // Store deployment info for reference
    localStorage.setItem('contractDeploymentDate', contract.deploymentDate);
    localStorage.setItem('contractTransactionHash', contract.transactionHash);
    
    console.log(`✅ Selected contract: ${contract.companyName} (${contract.contractId})`);
    
  } catch (error) {
    console.error('❌ Failed to select contract:', error);
    throw error;
  }
};

/**
 * Get current contract info from localStorage
 */
export const getCurrentContractInfo = () => {
  try {
    const fairWageContractId = localStorage.getItem('fairWageContractId');
    const tokenContractId = localStorage.getItem('tokenContractId');
    const companyName = localStorage.getItem('companyName');
    const tokenSymbol = localStorage.getItem('tokenSymbol');
    
    if (!fairWageContractId || !companyName) {
      return null;
    }
    
    return {
      contractId: fairWageContractId,
      tokenContractId: tokenContractId || undefined,
      companyName: companyName,
      tokenSymbol: tokenSymbol || 'TBU',
      deploymentDate: localStorage.getItem('contractDeploymentDate') || undefined,
      transactionHash: localStorage.getItem('contractTransactionHash') || undefined
    };
    
  } catch (error) {
    console.error('❌ Failed to get current contract info:', error);
    return null;
  }
};

/**
 * Clear current contract selection
 */
export const clearCurrentContract = (): void => {
  try {
    localStorage.removeItem('fairWageContractId');
    localStorage.removeItem('tokenContractId');
    localStorage.removeItem('companyName');
    localStorage.removeItem('tokenSymbol');
    localStorage.removeItem('contractDeploymentDate');
    localStorage.removeItem('contractTransactionHash');
    localStorage.removeItem('employees'); // Also clear employee data
    
    console.log('✅ Current contract selection cleared');
    
  } catch (error) {
    console.error('❌ Failed to clear contract:', error);
  }
};

/**
 * Validate if a contract is accessible and owned by current user
 */
const validateContract = async (contract: any): Promise<boolean> => {
  try {
    console.log(`🔍 Validating contract: ${contract.name} (${contract.id})`);
    
    // Check if contract has valid token contract ID
    if (!contract.tokenContract || contract.tokenContract === 'null') {
      console.log(`⚠️ Contract ${contract.name} has no valid token contract`);
      return false;
    }
    
    // Check if we have this contract in localStorage (indicates ownership)
    const currentFairWageId = localStorage.getItem('fairWageContractId');
    const currentTokenId = localStorage.getItem('tokenContractId');
    const currentCompanyName = localStorage.getItem('companyName');
    
    console.log(`🔍 Current localStorage:`, {
      fairWageId: currentFairWageId,
      tokenId: currentTokenId,
      companyName: currentCompanyName
    });
    
    // If this contract is already in localStorage, it's valid
    if (currentFairWageId === contract.id) {
      console.log(`✅ Contract ${contract.name} is current contract in localStorage`);
      return true;
    }
    
    // Try to check if we can access the contract (basic validation)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/list-employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fairWageContractId: contract.id
      })
    });
    
    if (!response.ok) {
      console.log(`⚠️ Contract ${contract.name} is not accessible (${response.status})`);
      return false;
    }
    
    const result = await response.json();
    if (!result.success) {
      console.log(`⚠️ Contract ${contract.name} validation failed:`, result.error);
      return false;
    }
    
    // Additional check: try to get contract info
    try {
      const infoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/get-employee-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fairWageContractId: contract.id,
          employeeAddress: 'GCUNUCNR...LNUQMM' // Current user's address
        })
      });
      
      if (!infoResponse.ok) {
        console.log(`⚠️ Contract ${contract.name} employee info check failed (${infoResponse.status})`);
        return false;
      }
    } catch (infoError) {
      console.log(`⚠️ Contract ${contract.name} employee info check error:`, infoError);
      return false;
    }
    
    console.log(`✅ Contract ${contract.name} is valid and accessible`);
    return true;
  } catch (error) {
    console.log(`⚠️ Contract ${contract.name} validation error:`, error);
    return false;
  }
};

/**
 * Get all contracts from registry (simple approach)
 */
export const getAllEmployerContracts = async (): Promise<ContractDiscoveryResult> => {
  try {
    console.log(`🔍 Getting all contracts from registry (simple approach)`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/debug/contract-registry`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get contracts: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Registry result:`, result);
    
    if (result.success && result.contracts) {
      // Convert registry format to DiscoveredContract format
      const contracts: DiscoveredContract[] = result.contracts.map((contract: any) => ({
        contractId: contract.id,
        tokenContractId: contract.tokenContract,
        companyName: contract.name,
        tokenSymbol: contract.tokenSymbol,
        deploymentDate: new Date().toISOString(), // Registry doesn't store dates
        transactionHash: 'registry', // Placeholder
        deployerAddress: 'current-user' // Placeholder
      }));

      console.log(`✅ Found ${contracts.length} contracts from registry`);

      return {
        success: true,
        contracts,
        totalFound: contracts.length,
        walletAddress: 'current-user'
      };
    } else {
      console.log(`⚠️ No contracts found in registry`);
      return {
        success: false,
        contracts: [],
        totalFound: 0,
        walletAddress: 'current-user',
        error: 'No contracts found in registry'
      };
    }

  } catch (error) {
    console.error('❌ Failed to get contracts from registry:', error);
    return {
      success: false,
      contracts: [],
      totalFound: 0,
      walletAddress: 'current-user',
      error: error instanceof Error ? error.message : 'Failed to get contracts'
    };
  }
};