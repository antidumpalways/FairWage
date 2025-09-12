"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import OnboardingWizard from '@/components/employer/OnboardingWizard';
import ContractInfoCard from '@/components/employer/ContractInfoCard';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-6">Employer Portal</h1>
          <p className="text-slate-400 mb-8 text-lg leading-relaxed">
            Connect your wallet to access enterprise payroll management tools and oversee real-time wage operations.
          </p>
          
          <Button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Wallet className="w-5 h-5 mr-3" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Employer <span className="text-blue-400">Portal</span>
            </h1>
          </div>
          <p className="text-xl text-slate-400 mb-8 max-w-4xl mx-auto leading-relaxed">
            Enterprise payroll management system powered by Stellar blockchain. 
            Manage employee wages, monitor real-time accruals, and oversee payroll operations with complete transparency.
          </p>
          <div className="inline-flex items-center bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-600">
            <span className="text-slate-300 font-medium">Connected as: </span>
            <span className="text-white font-mono ml-2 text-blue-400">
              {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
            </span>
          </div>
        </div>

        {!fairWageContractId ? (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        ) : (
          <div className="space-y-8">
            {/* Main Content - Employee Management First */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Employee Management - Main Focus (2/3 width) */}
              <div className="lg:col-span-2">
                <EmployeeManagementCard />
              </div>
              
              {/* Sidebar - Contract Info & Summary (1/3 width) */}
              <div className="space-y-6">
                <ContractInfoCard />
                <CompanyFundsCard />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}