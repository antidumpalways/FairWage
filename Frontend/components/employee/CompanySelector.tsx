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
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-purple-400" />
          Select Your Employer
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Choose which company's wages you want to view and manage
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
              <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Choose an employer..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {contracts.map((contract) => (
                  <SelectItem 
                    key={contract.contractId} 
                    value={contract.contractId}
                    className="text-white hover:bg-slate-600"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">{contract.companyName}</span>
                      <span className="text-sm text-gray-400 ml-2">
                        {contract.tokenSymbol}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContract && (
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <div className="text-white font-semibold mb-2">
                Selected: {selectedContract.companyName}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Token Symbol</div>
                  <div className="text-white">{selectedContract.tokenSymbol}</div>
                </div>
                <div>
                  <div className="text-gray-400">Network</div>
                  <div className="text-white capitalize">{selectedContract.network || 'testnet'}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-gray-400 text-xs">Contract ID</div>
                <div className="text-white text-xs font-mono">
                  {selectedContract.contractId.slice(0, 8)}...{selectedContract.contractId.slice(-6)}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <Button 
              onClick={discoverContracts}
              variant="ghost" 
              size="sm"
              className="text-purple-400 hover:text-purple-300 p-0"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanySelector;