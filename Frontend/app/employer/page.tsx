"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import OnboardingWizard from '@/components/employer/OnboardingWizard';
import ContractInfoCard from '@/components/employer/ContractInfoCard';
import DepositFundsCard from '@/components/employer/DepositFundsCard';
import EmployeeManagementCard from '@/components/employer/EmployeeManagementCard';
import CompanyFundsCard from '@/components/employer/CompanyFundsCard';
import { Button } from '@/components/ui/button';
import { Wallet, Building2 } from 'lucide-react';

export default function EmployerPage() {
  const { isWalletConnected, publicKey, connectWallet } = useWallet();
  const [tokenContractId, setTokenContractId] = useState<string | null>(null);
  const [fairWageContractId, setFairWageContractId] = useState<string | null>(null);

  useEffect(() => {
    // Load saved contract IDs from localStorage
    const savedTokenId = localStorage.getItem('tokenContractId');
    const savedFairWageId = localStorage.getItem('fairWageContractId');
    
    if (savedTokenId) setTokenContractId(savedTokenId);
    if (savedFairWageId) setFairWageContractId(savedFairWageId);
  }, []);

  const handleOnboardingComplete = (tokenId: string, fairWageId: string) => {
    setTokenContractId(tokenId);
    setFairWageContractId(fairWageId);
    
    // Save to localStorage
    localStorage.setItem('tokenContractId', tokenId);
    localStorage.setItem('fairWageContractId', fairWageId);
  };

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Employer Dashboard</h1>
          <p className="text-gray-400 mb-8">
            Connect your wallet to access the employer dashboard and manage your payroll system.
          </p>
          
          <Button
            onClick={connectWallet}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Employer Dashboard</h1>
          <p className="text-gray-400">Manage your payroll system and employee wages</p>
        </div>

        {!fairWageContractId ? (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        ) : (
          <div className="space-y-8">
            {/* Company Funds Overview */}
            <CompanyFundsCard />
            
            {/* Contract Management */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <ContractInfoCard />
                <DepositFundsCard />
              </div>
              
              <div>
                <EmployeeManagementCard />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}