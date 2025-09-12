"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAccruedBalance } from '@/lib/soroban';
import { useWallet } from '@/contexts/WalletContext';

interface Contract {
  contractId: string;
  companyName: string;
  tokenSymbol: string;
  tokenContract: string;
}

interface BalanceCardProps {
  selectedContract?: Contract;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ selectedContract }) => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, isWalletConnected } = useWallet();

  const loadRealBalance = async (): Promise<number> => {
    if (!publicKey || !isWalletConnected || !selectedContract) {
      throw new Error('Wallet not connected or no contract selected');
    }
    
    try {
      console.log('🔍 Loading real balance for:', publicKey, 'from contract:', selectedContract.contractId);
      // Call REAL contract function with selected contract
      const realBalance = await fetchAccruedBalance(publicKey, selectedContract.contractId);
      console.log('✅ Real balance loaded:', realBalance);
      
      // Validate the response
      if (typeof realBalance !== 'bigint' && typeof realBalance !== 'number') {
        console.error('❌ Invalid balance response type:', typeof realBalance, realBalance);
        throw new Error('Invalid balance response type');
      }
      
      // Convert from BigInt (with 7 decimal places for TBU) to number  
      const balanceInTokens = Number(realBalance) / 10000000;
      console.log('✅ Balance in tokens:', balanceInTokens);
      return balanceInTokens;
    } catch (error) {
      console.error('❌ Failed to load real balance:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      // Return 0 instead of mock data
      return 0;
    }
  };

  useEffect(() => {
    const updateBalance = async () => {
      try {
        if (!publicKey || !isWalletConnected || !selectedContract) {
          setIsLoading(false);
          return;
        }
        
        const newBalance = await loadRealBalance();
        setBalance(newBalance);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch REAL balance:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    updateBalance();

    // Update balance every 10 seconds (real contract calls are slower)
    const interval = setInterval(updateBalance, 10000);

    return () => clearInterval(interval);
  }, [publicKey, isWalletConnected, selectedContract]);

  return (
    <Card className="bg-slate-800/50 border border-slate-600 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Current Balance</span>
          </span>
          <TrendingUp className="w-6 h-6 text-blue-400" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-16 bg-slate-700 rounded w-3/4"></div>
              </div>
            ) : (
              <div className="text-5xl font-bold text-white">
                {balance.toFixed(6)} <span className="text-xl text-slate-400">tokens</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 font-medium">Wage Rate:</span>
              <span className="text-white font-semibold">0.001 tokens/second</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 font-medium">Status:</span>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-blue-400 font-semibold">
                  {isWalletConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
            <div className="text-sm text-slate-400 mb-2 font-medium">Balance updates every 10 seconds</div>
            <div className="text-sm text-slate-300">
              {isWalletConnected 
                ? 'Real-time balance from Stellar blockchain'
                : 'Connect wallet to access balance'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;