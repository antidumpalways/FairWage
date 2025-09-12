import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

const ContractInfoCard: React.FC = () => {
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, isWalletConnected } = useWallet();
  const [tokenContractId, setTokenContractId] = useState<string | null>(null);
  const [fairWageContractId, setFairWageContractId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

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
  }, [isWalletConnected, publicKey]);

  return (
    <Card className="bg-slate-800/50 border border-slate-600 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-xl font-semibold">Contract Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-slate-700 rounded"></div>
            <div className="h-8 bg-slate-700 rounded"></div>
            <div className="h-8 bg-slate-700 rounded"></div>
          </div>
        ) : contractInfo ? (
          <>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 text-sm">Company:</span>
              <span className="text-white text-sm font-semibold">{contractInfo.companyName}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 text-sm">Token:</span>
              <span className="text-white text-sm font-semibold">{contractInfo.tokenSymbol}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 text-sm">Token ID:</span>
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm font-mono">{formatAddress(contractInfo.tokenContractId)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(contractInfo.tokenContractId)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 h-auto rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 text-sm">FairWage ID:</span>
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm font-mono">{formatAddress(contractInfo.fairWageContractId)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(contractInfo.fairWageContractId)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 h-auto rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 text-sm">Network:</span>
              <span className="text-white text-sm font-semibold">{contractInfo.network}</span>
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