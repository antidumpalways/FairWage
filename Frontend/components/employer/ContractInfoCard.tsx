import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

const ContractInfoCard: React.FC = () => {
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { publicKey, isWalletConnected } = useWallet();
  const [tokenContractId, setTokenContractId] = useState<string | null>(null);
  const [fairWageContractId, setFairWageContractId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const refreshContractData = async () => {
    try {
      console.log('🔄 Refreshing contract data from registry...');
      
      // Get contract registry
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/debug/contract-registry`);
      const result = await response.json();
      
      if (result.success && result.contracts.length > 0) {
        // Find the most recent contract (last in array)
        const latestContract = result.contracts[result.contracts.length - 1];
        
        console.log('✅ Found latest contract:', latestContract);
        
        // Update localStorage with correct data
        if (latestContract.id) {
          localStorage.setItem('fairWageContractId', latestContract.id);
        }
        if (latestContract.tokenContract) {
          localStorage.setItem('tokenContractId', latestContract.tokenContract);
        }
        if (latestContract.name) {
          localStorage.setItem('companyName', latestContract.name);
        }
        if (latestContract.tokenSymbol) {
          localStorage.setItem('tokenSymbol', latestContract.tokenSymbol);
          localStorage.setItem('tokenName', latestContract.tokenSymbol); // Use symbol as name
        }
        
        // Reload the component
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Failed to refresh contract data:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  // Monitor localStorage changes with polling
  useEffect(() => {
    let lastContractId = localStorage.getItem('fairWageContractId');
    let lastCompanyName = localStorage.getItem('companyName');
    
    const checkLocalStorageChanges = () => {
      const currentContractId = localStorage.getItem('fairWageContractId');
      const currentCompanyName = localStorage.getItem('companyName');
      
      if (currentContractId !== lastContractId || currentCompanyName !== lastCompanyName) {
        console.log('🔍 localStorage changed via polling:', { 
          contractId: { old: lastContractId, new: currentContractId },
          companyName: { old: lastCompanyName, new: currentCompanyName }
        });
        
        lastContractId = currentContractId;
        lastCompanyName = currentCompanyName;
        
        // Force reload contract info
        setTimeout(() => {
          console.log('🔄 Reloading contract info due to localStorage change');
          setRefreshTrigger(prev => prev + 1);
        }, 100);
      }
    };
    
    // Check every 500ms
    const interval = setInterval(checkLocalStorageChanges, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Load contract info from localStorage
  useEffect(() => {
    const loadContractInfo = () => {
      try {
        if (!isWalletConnected || !publicKey) {
          console.log('⚠️ Wallet not connected, skipping contract info load');
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 Loading contract info from localStorage...');
        console.log('🔍 Current localStorage values:', {
          fairWageContractId: localStorage.getItem('fairWageContractId'),
          tokenContractId: localStorage.getItem('tokenContractId'),
          companyName: localStorage.getItem('companyName'),
          tokenSymbol: localStorage.getItem('tokenSymbol')
        });
        
        // Load from localStorage
        const savedTokenId = localStorage.getItem('tokenContractId');
        const savedFairWageId = localStorage.getItem('fairWageContractId');
        const savedCompanyName = localStorage.getItem('companyName');
        const savedTokenName = localStorage.getItem('tokenName');
        const savedTokenSymbol = localStorage.getItem('tokenSymbol');
        
        setTokenContractId(savedTokenId);
        setFairWageContractId(savedFairWageId);
        setCompanyName(savedCompanyName);
        
        if (savedTokenId && savedFairWageId) {
          const contractInfo = {
            companyName: savedCompanyName || 'N/A',
            tokenName: savedTokenName || 'N/A',
            tokenSymbol: savedTokenSymbol || 'N/A',
            tokenContractId: savedTokenId,
            fairWageContractId: savedFairWageId,
            network: 'Stellar Testnet',
            networkType: 'testnet',
            rpcUrl: 'https://soroban-testnet.stellar.org'
          };
          setContractInfo(contractInfo);
          console.log('✅ Contract info loaded from localStorage:', contractInfo);
        } else {
          console.log('⚠️ No contract IDs found in localStorage');
          setContractInfo(null);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to load contract info:', error);
        setContractInfo(null);
        setIsLoading(false);
      }
    };

    loadContractInfo();
  }, [isWalletConnected, publicKey, refreshTrigger]);

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 border-4 border-slate-300 hover:border-slate-400 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-2xl backdrop-blur-sm">
      <CardHeader className="pb-4 bg-gradient-to-r from-slate-100/80 to-slate-50 border-b-2 border-slate-200 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <CardTitle className="text-slate-900 text-xl font-bold tracking-wide">Contract Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 bg-gradient-to-b from-white to-slate-50/30 rounded-b-xl">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        ) : contractInfo ? (
          <>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 text-sm">Company:</span>
              <span className="text-slate-900 text-sm font-semibold">{contractInfo.companyName}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 text-sm">Token:</span>
              <span className="text-slate-900 text-sm font-semibold">{contractInfo.tokenSymbol}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 text-sm">Token ID:</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 text-sm font-mono">{formatAddress(contractInfo.tokenContractId)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(contractInfo.tokenContractId)}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 h-auto rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 text-sm">FairWage ID:</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 text-sm font-mono">{formatAddress(contractInfo.fairWageContractId)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(contractInfo.fairWageContractId)}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 h-auto rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 text-sm">Network:</span>
              <span className="text-slate-900 text-sm font-semibold">{contractInfo.network}</span>
            </div>

            {/* Refresh Button */}
            <div className="pt-4 border-t border-slate-200">
              <Button
                onClick={refreshContractData}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                size="sm"
              >
                🔄 Refresh Contract Data
              </Button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Sync with latest contract from registry
              </p>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-4">
            <div className="text-sm">No contract info</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractInfoCard;