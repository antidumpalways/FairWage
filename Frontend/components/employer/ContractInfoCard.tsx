import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContractInfo } from '@/lib/soroban';
import { useWallet } from '@/contexts/WalletContext';

const ContractInfoCard: React.FC = () => {
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, isWalletConnected } = useWallet();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  // Load real contract info
  useEffect(() => {
    const loadContractInfo = async () => {
      try {
        if (!isWalletConnected || !publicKey) {
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 Loading REAL contract info...');
        const info = await getContractInfo();
        setContractInfo(info);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to load REAL contract info:', error);
        setIsLoading(false);
      }
    };

    loadContractInfo();
  }, [isWalletConnected, publicKey]);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          Contract Information
          <ExternalLink className="w-5 h-5 ml-2 text-gray-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-slate-700 rounded"></div>
            <div className="h-16 bg-slate-700 rounded"></div>
            <div className="h-16 bg-slate-700 rounded"></div>
          </div>
        ) : contractInfo ? (
          <>
            <div>
              <div className="text-sm text-gray-400 mb-1">Employer Address</div>
              <div className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                <span className="text-white font-mono text-sm">{formatAddress(publicKey || '')}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(publicKey || '')}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Contract ID</div>
              <div className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                <span className="text-white font-mono text-sm">{formatAddress(contractInfo.contractId)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(contractInfo.contractId)}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Network</div>
              <div className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                <span className="text-white font-mono text-sm">{contractInfo.network}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(contractInfo.network)}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-8">
            {isWalletConnected ? 'Failed to load contract info' : 'Connect wallet to view contract info'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractInfoCard;