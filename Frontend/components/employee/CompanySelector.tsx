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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/discover-employee-contracts`, {
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
    <Card className="bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 border-4 border-slate-300 hover:border-slate-400 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-2xl backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-100/80 to-slate-50 border-b-2 border-slate-200 rounded-t-xl">
        <CardTitle className="text-slate-900 flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-wide">Select Your Employer</span>
            <p className="text-slate-600 text-sm font-medium mt-1">
              Choose which company's payroll contract you want to access
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-gradient-to-b from-white to-slate-50/30 rounded-b-xl">
        <div className="space-y-6">
          <div>
            <label className="text-sm text-slate-700 mb-3 block font-semibold">
              Available Employers ({contracts.length})
            </label>
            <Select
              value={selectedContract?.contractId || ""}
              onValueChange={handleContractSelect}
            >
              <SelectTrigger className="w-full bg-white border-2 border-slate-300 text-slate-900 hover:border-slate-400 transition-all duration-300 py-4 shadow-sm">
                <SelectValue placeholder="Choose an employer..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-slate-300 backdrop-blur-xl shadow-xl">
                {contracts.map((contract) => (
                  <SelectItem 
                    key={contract.contractId} 
                    value={contract.contractId}
                    className="text-slate-900 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full py-2">
                      <span className="font-bold text-lg">{contract.companyName}</span>
                      <span className="text-sm text-slate-600 ml-2 font-semibold px-3 py-1 bg-slate-200 rounded-full">
                        {contract.tokenSymbol}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContract && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50/80 p-6 rounded-xl border-2 border-emerald-200/60 shadow-lg">
              <div className="text-slate-900 font-bold mb-4 flex items-center">
                <span className="text-emerald-600 mr-2">✅</span>
                <span className="text-emerald-800 text-lg">Selected: {selectedContract.companyName}</span>
              </div>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="text-purple-700 font-medium">💎 Token Symbol</div>
                  <div className="text-slate-900 font-bold text-lg bg-purple-100 px-3 py-2 rounded-lg border border-purple-200 shadow-sm">
                    {selectedContract.tokenSymbol}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-blue-700 font-medium">🌐 Network</div>
                  <div className="text-slate-900 font-bold text-lg bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 shadow-sm capitalize">
                    {selectedContract.network || 'testnet'}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-slate-700 text-sm font-medium">📋 Contract ID</div>
                <div className="text-slate-900 text-sm font-mono bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                  {selectedContract.contractId.slice(0, 8)}...{selectedContract.contractId.slice(-6)}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-sm text-slate-600 pt-4 border-t border-slate-200">
            <span className="flex items-center">
              <span className="text-green-600 mr-2">🕐</span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <Button 
              onClick={discoverContracts}
              variant="ghost" 
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg transition-all duration-300 font-semibold"
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