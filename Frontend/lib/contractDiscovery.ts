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
    
    const response = await fetch('/api/discover-contracts', {
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