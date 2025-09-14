"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import BalanceCard from '@/components/employee/BalanceCard';
import WithdrawCard from '@/components/employee/WithdrawCard';
import TransactionHistoryCard from '@/components/employee/TransactionHistoryCard';
import CompanySelector from '@/components/employee/CompanySelector';
import { Button } from '@/components/ui/button';
import { Wallet, Users, AlertCircle } from 'lucide-react';
import { getCurrentContractId } from '@/lib/soroban';

interface Contract {
  contractId: string;
  companyName: string;
  tokenSymbol: string;
  tokenContract: string;
  lastChecked?: string;
  network?: string;
}

export default function EmployeePage() {
  const { isWalletConnected, publicKey, connectWallet } = useWallet();
  const [hasContractId, setHasContractId] = useState<boolean | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    // Check if contract ID is available
    const checkContractId = async () => {
      try {
        await getCurrentContractId();
        setHasContractId(true);
      } catch (error) {
        console.log('No contract ID available:', error);
        setHasContractId(false);
      }
    };
    
    checkContractId();
  }, []);

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-soft">
            <Users className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Employee Access</h1>
          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
            Access your earned wage balance and manage instant withdrawals through our secure blockchain-powered platform.
          </p>
          
          <Button
            onClick={connectWallet}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 hover:shadow-soft-lg text-white px-10 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Wallet className="w-5 h-5 mr-3" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Show message if no contract ID is available
  if (hasContractId === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-soft">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-6">No Active Contract</h1>
          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
            No payroll contract is currently available. Please contact your employer to deploy the FairWage system or verify your employment registration.
          </p>
          
          <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">
              Connected as: <span className="text-slate-900 font-mono">{publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking contract ID
  if (hasContractId === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-soft">
            <Users className="h-10 w-10 text-white animate-spin" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-6">Initializing...</h1>
          <p className="text-slate-600 text-lg">
            Connecting to payroll system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mr-4 shadow-soft">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900">
              Employee <span className="text-slate-600">Access</span>
            </h1>
          </div>
          <p className="text-xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Access your earned wage balance and manage instant withdrawals through our secure blockchain-powered platform.
          </p>
          <div className="inline-flex items-center bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-medium">Connected as: </span>
            <span className="text-slate-900 font-mono ml-2">
              {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
            </span>
          </div>
        </div>

        {/* Company Selection */}
        <div className="mb-8">
          <CompanySelector 
            onContractSelected={setSelectedContract}
            selectedContract={selectedContract}
          />
        </div>

        {/* Main Dashboard Grid - Only show if contract selected */}
        {selectedContract && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <BalanceCard selectedContract={selectedContract} />
            <WithdrawCard selectedContract={selectedContract} />
          </div>
        )}


        {/* Transaction History - Only show if contract selected */}
        {selectedContract && (
          <div className="mb-8">
            <TransactionHistoryCard selectedContract={selectedContract} />
          </div>
        )}

        {/* Professional Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200 hover:shadow-soft-lg transition-all duration-300 p-8 rounded-2xl text-center shadow-soft">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <div className="text-white text-2xl font-bold">RT</div>
            </div>
            <div className="text-blue-600 text-2xl font-bold mb-4">Real-Time Accrual</div>
            <div className="text-slate-600 leading-relaxed">Wages accumulate by the second with blockchain precision and transparency</div>
          </div>
          
          <div className="bg-white border border-slate-200 hover:shadow-soft-lg transition-all duration-300 p-8 rounded-2xl text-center shadow-soft">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <div className="text-white text-2xl font-bold">IW</div>
            </div>
            <div className="text-emerald-600 text-2xl font-bold mb-4">Instant Withdrawals</div>
            <div className="text-slate-600 leading-relaxed">Access earned wages 24/7 without delays or waiting periods</div>
          </div>
          
          <div className="bg-white border border-slate-200 hover:shadow-soft-lg transition-all duration-300 p-8 rounded-2xl text-center shadow-soft">
            <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <div className="text-white text-2xl font-bold">SS</div>
            </div>
            <div className="text-slate-700 text-2xl font-bold mb-4">Stellar Security</div>
            <div className="text-slate-600 leading-relaxed">Enterprise-grade security with immutable blockchain records</div>
          </div>
        </div>
      </div>
    </div>
  );
}