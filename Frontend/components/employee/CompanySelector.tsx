"use client";

import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet } from '@/contexts/WalletContext';

interface Contract {
  contractId: string;
  companyName: string;
  tokenSymbol: string;
  tokenContract: string;
  lastChecked?: string;
  network?: string;
}

interface CompanySelectorProps {
  onContractSelected: (contract: Contract) => void;
  selectedContract?: Contract | null;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ 
  onContractSelected, 
  selectedContract 
}) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, isWalletConnected } = useWallet();

  const discoverContracts = async () => {
    if (!publicKey || !isWalletConnected) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Discovering contracts for employee:', publicKey);
      
      const response = await fetch('/api/discover-employee-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeAddress: publicKey })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to discover contracts');
      }

      const result = await response.json();
      console.log('✅ Discovered contracts:', result);

      if (result.success && result.contracts) {
        setContracts(result.contracts);
        
        // Auto-select if only one contract found
        if (result.contracts.length === 1 && !selectedContract) {
          console.log('🎯 Auto-selecting single contract:', result.contracts[0]);
          onContractSelected(result.contracts[0]);
        }
      } else {
        setContracts([]);
      }

    } catch (error) {
      console.error('❌ Failed to discover contracts:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    discoverContracts();
  }, [publicKey, isWalletConnected]);

  const handleContractSelect = (contractId: string) => {
    const contract = contracts.find(c => c.contractId === contractId);
    if (contract) {
      console.log('📋 Contract selected:', contract);
      onContractSelected(contract);
    }
  };

  if (!isWalletConnected) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-400">
            Connect your wallet to view available employers
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <div className="text-white">Discovering your employers...</div>
          <div className="text-gray-400 text-sm mt-2">
            Checking blockchain for contracts where you are registered
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-red-400 mb-2">Error discovering contracts</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <Button 
            onClick={discoverContracts}
            variant="outline" 
            size="sm"
            className="bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-white mb-2">No Employers Found</div>
          <div className="text-gray-400 text-sm mb-4">
            Your wallet is not registered with any FairWage contracts yet.
          </div>
          <Button 
            onClick={discoverContracts}
            variant="outline" 
            size="sm"
            className="bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card card-hover bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-indigo-900/30 border-purple-500/30 animate-slide-up">
      <CardHeader className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 animate-shimmer"></div>
        <CardTitle className="text-white flex items-center relative z-10">
          <Building2 className="w-7 h-7 mr-3 text-purple-400 animate-float" />
          <span className="text-gradient-purple text-2xl font-bold">Select Your Employer</span>
        </CardTitle>
        <p className="text-gray-300 text-sm relative z-10">
          🏢 Choose which company's wages you want to view and manage
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Available Employers ({contracts.length})
            </label>
            <Select
              value={selectedContract?.contractId || ""}
              onValueChange={handleContractSelect}
            >
              <SelectTrigger className="w-full glass-card bg-slate-700/50 border-purple-500/30 text-white hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 py-3">
                <SelectValue placeholder="🏢 Choose an employer..." />
              </SelectTrigger>
              <SelectContent className="glass-card bg-slate-700/95 border-purple-500/30 backdrop-blur-xl">
                {contracts.map((contract) => (
                  <SelectItem 
                    key={contract.contractId} 
                    value={contract.contractId}
                    className="text-white hover:bg-purple-600/20 hover:text-purple-200 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full py-2">
                      <span className="font-bold text-lg">🏢 {contract.companyName}</span>
                      <span className="text-sm text-purple-300 ml-2 font-semibold px-2 py-1 bg-purple-500/20 rounded-full">
                        {contract.tokenSymbol}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContract && (
            <div className="glass-card bg-gradient-to-br from-purple-800/20 to-blue-800/20 p-5 rounded-xl border border-purple-500/30 animate-fade-in">
              <div className="text-white font-bold mb-4 flex items-center">
                <span className="text-emerald-400 mr-2">✅</span>
                <span className="text-gradient-purple text-lg">Selected: {selectedContract.companyName}</span>
              </div>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="text-purple-300 font-medium">💎 Token Symbol</div>
                  <div className="text-white font-bold text-lg bg-purple-500/20 px-3 py-2 rounded-lg">
                    {selectedContract.tokenSymbol}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-blue-300 font-medium">🌐 Network</div>
                  <div className="text-white font-bold text-lg bg-blue-500/20 px-3 py-2 rounded-lg capitalize">
                    {selectedContract.network || 'testnet'}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-gray-300 text-sm font-medium">📋 Contract ID</div>
                <div className="text-purple-200 text-sm font-mono bg-slate-800/50 px-3 py-2 rounded-lg border border-purple-500/20">
                  {selectedContract.contractId.slice(0, 8)}...{selectedContract.contractId.slice(-6)}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-sm text-gray-300 pt-4 border-t border-purple-500/20">
            <span className="flex items-center">
              <span className="text-green-400 mr-2">🕐</span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <Button 
              onClick={discoverContracts}
              variant="ghost" 
              size="sm"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-3 py-2 rounded-lg transition-all duration-300 font-semibold"
            >
              🔄 Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanySelector;