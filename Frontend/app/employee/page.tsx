"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import BalanceCard from '@/components/employee/BalanceCard';
import WithdrawCard from '@/components/employee/WithdrawCard';
import EmployeeStatsCard from '@/components/employee/EmployeeStatsCard';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Employee Dashboard</h1>
          <p className="text-gray-400 mb-8">
            Connect your wallet to view your real-time wage balance and withdraw earned funds.
          </p>
          
          <Button
            onClick={connectWallet}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Show message if no contract ID is available
  if (hasContractId === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">No Contract Found</h1>
          <p className="text-gray-400 mb-8">
            No FairWage contract has been deployed yet. Please ask your employer to deploy the contract first, or check if you're using the correct application.
          </p>
          
          <div className="text-sm text-gray-500">
            Connected as: {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking contract ID
  if (hasContractId === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-white animate-spin" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Loading...</h1>
          <p className="text-gray-400">
            Checking for available contracts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 text-center animate-slide-up">
          <h1 className="text-6xl font-bold text-gradient-purple mb-4 animate-fade-in">
            Employee Dashboard
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
            🎉 Welcome back! View your real-time earnings and withdraw your wages instantly with our blockchain-powered system.
          </p>
          <div className="inline-flex items-center glass-card bg-slate-800/40 px-6 py-3 rounded-full border border-purple-500/30">
            <span className="text-emerald-400 mr-2">🔗</span>
            <span className="text-gray-300 font-medium">Connected as: </span>
            <span className="text-white font-bold ml-2 text-gradient-blue">
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

        {/* Employee Statistics - Only show if contract selected */}
        {selectedContract && (
          <div className="mb-8">
            <EmployeeStatsCard selectedContract={selectedContract} />
          </div>
        )}

        {/* Transaction History - Only show if contract selected */}
        {selectedContract && (
          <div className="mb-8">
            <TransactionHistoryCard selectedContract={selectedContract} />
          </div>
        )}

        {/* Modern Feature Highlights */}
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <div className="glass-card card-hover bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-500/30 p-8 rounded-2xl text-center animate-slide-up">
            <div className="text-4xl mb-4 animate-pulse-glow">⚡</div>
            <div className="text-gradient-blue text-3xl font-bold mb-3">Real-Time</div>
            <div className="text-gray-300 font-medium">Wages accrue by the second with blockchain precision</div>
          </div>
          
          <div className="glass-card card-hover bg-gradient-to-br from-emerald-900/30 to-green-900/30 border-emerald-500/30 p-8 rounded-2xl text-center animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="text-4xl mb-4 animate-bounce-subtle">🚀</div>
            <div className="text-gradient text-3xl font-bold mb-3">Instant</div>
            <div className="text-gray-300 font-medium">Withdraw anytime, no delays or waiting periods</div>
          </div>
          
          <div className="glass-card card-hover bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 p-8 rounded-2xl text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="text-4xl mb-4 animate-scale-pulse">🛡️</div>
            <div className="text-gradient-purple text-3xl font-bold mb-3">Secure</div>
            <div className="text-gray-300 font-medium">Blockchain-powered payroll with cryptographic security</div>
          </div>
        </div>
      </div>
    </div>
  );
}