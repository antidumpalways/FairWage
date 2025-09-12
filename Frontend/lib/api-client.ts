// Frontend API Client untuk komunikasi dengan Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('replit.dev') 
    ? `${window.location.protocol}//${window.location.hostname.replace('-00-', '-01-')}:3001`
    : 'http://localhost:3001');

export interface PrepareTokenDeployRequest {
  userPublicKey: string;
  tokenName: string;
  tokenSymbol: string;
}

export interface PrepareFairWageDeployRequest {
  userPublicKey: string;
  tokenContractId: string;
  companyName: string;
}

export interface SubmitTransactionRequest {
  signedTransactionXdr: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class FairWageApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get WASM hash from backend
  async getWasmHash(): Promise<ApiResponse<{ wasmHash: string }>> {
    console.log('📦 Getting WASM hash from backend...');
    return this.request<{ wasmHash: string }>('/api/wasm-hash');
  }

  // Prepare token deployment transaction
  async prepareTokenDeploy(request: PrepareTokenDeployRequest): Promise<ApiResponse<{ transactionXdr: string; wasmHash: string }>> {
    console.log('🪙 Preparing token deployment...', request);
    return this.request<{ transactionXdr: string; wasmHash: string }>('/api/prepare-token-deploy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Prepare FairWage contract deployment transaction
  async prepareFairWageDeploy(request: PrepareFairWageDeployRequest): Promise<ApiResponse<{ transactionXdr: string; wasmHash: string; metadata: any }>> {
    console.log('🏢 Preparing FairWage deployment...', request);
    return this.request<{ transactionXdr: string; wasmHash: string; metadata: any }>('/api/prepare-fairwage-deploy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Submit signed transaction
  async submitTransaction(request: SubmitTransactionRequest): Promise<ApiResponse<{ transactionHash: string; result: any }>> {
    console.log('📤 Submitting signed transaction...');
    return this.request<{ transactionHash: string; result: any }>('/api/submit-transaction', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; wasmHash: string }>> {
    return this.request<{ status: string; timestamp: string; wasmHash: string }>('/health');
  }
}

// Export singleton instance
export const apiClient = new FairWageApiClient();
export default apiClient;