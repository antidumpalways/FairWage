"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import OnboardingWizard from '@/components/employer/OnboardingWizard';
import ContractInfoCard from '@/components/employer/ContractInfoCard';
import EmployeeManagementCard from '@/components/employer/EmployeeManagementCard';
import CompanyFundsCard from '@/components/employer/CompanyFundsCard';
import { ContractDiscoveryModal } from '@/components/employer/ContractDiscoveryModal';
import { Button } from '@/components/ui/button';
import { Wallet, Building2, Search, Plus } from 'lucide-react';

export default function EmployerPage() {
  const { isWalletConnected, publicKey, connectWallet } = useWallet();
  const [tokenContractId, setTokenContractId] = useState<string | null>(null);
  const [fairWageContractId, setFairWageContractId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);

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
    setShowOnboarding(false);
  };

  const handleContractSelected = (contractId: string, tokenId?: string) => {
    setFairWageContractId(contractId);
    if (tokenId) {
      setTokenContractId(tokenId);
    }
    setShowDiscoveryModal(false);
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleShowDiscovery = () => {
    setShowDiscoveryModal(true);
  };

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-soft">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Employer Portal</h1>
          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
            Enterprise payroll management system powered by Stellar blockchain. Manage employee wages, monitor real-time accruals, and oversee payroll operations with complete transparency.
          </p>
          
          <Button
            onClick={connectWallet}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-soft-lg text-white px-10 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Wallet className="w-5 h-5 mr-3" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-soft">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900">
              Employer <span className="text-blue-600">Portal</span>
            </h1>
          </div>
          <p className="text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Enterprise payroll management system powered by Stellar blockchain. 
            Manage employee wages, monitor real-time accruals, and oversee payroll operations with complete transparency.
          </p>
          <div className="inline-flex items-center bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-medium">Connected as: </span>
            <span className="text-slate-900 font-mono ml-2">
              {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
            </span>
          </div>
        </div>

        {!fairWageContractId ? (
          !showOnboarding ? (
            // Contract Selection Screen
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Get Started with FairWage</h2>
                <p className="text-slate-600 text-lg">
                  Choose an option to begin managing your payroll system
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-stretch">
                {/* Discover Existing Contracts */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-soft-lg transition-all duration-300 shadow-soft">
                  <div className="text-center flex flex-col h-full">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Find Existing Contracts</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed flex-grow">
                      Discover FairWage contracts previously deployed by your wallet across different browsers and devices. Access your existing payroll systems instantly with secure blockchain verification.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-700 font-medium">
                        🔍 Scan your wallet history to find deployed contracts
                      </p>
                    </div>
                    <Button
                      onClick={handleShowDiscovery}
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-soft-lg text-white w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Discover Contracts
                    </Button>
                  </div>
                </div>

                {/* Deploy New Contract */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-soft-lg transition-all duration-300 shadow-soft">
                  <div className="text-center flex flex-col h-full">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Plus className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Deploy New Contract</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed flex-grow">
                      Create a new FairWage payroll system with custom tokens and company settings. Set up your complete blockchain-based payroll infrastructure from scratch with enterprise-grade security.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-emerald-700 font-medium">
                        ⚡ Complete setup process takes 5-10 minutes
                      </p>
                    </div>
                    <Button
                      onClick={handleShowOnboarding}
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 hover:shadow-soft-lg text-white w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Deploy New Contract
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Onboarding Wizard
            <OnboardingWizard onComplete={handleOnboardingComplete} />
          )
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
        
        {/* Contract Discovery Modal */}
        <ContractDiscoveryModal
          isOpen={showDiscoveryModal}
          onClose={() => setShowDiscoveryModal(false)}
          onContractSelected={handleContractSelected}
          walletAddress={publicKey || undefined}
        />
      </div>
    </div>
  );
}