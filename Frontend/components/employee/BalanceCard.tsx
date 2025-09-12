"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAccruedBalance } from '@/lib/soroban';
import { useWallet } from '@/contexts/WalletContext';

const BalanceCard: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, isWalletConnected } = useWallet();

  const loadRealBalance = async (): Promise<number> => {
    if (!publicKey || !isWalletConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log('🔍 Loading real balance for:', publicKey);
      // Call REAL contract function
      const realBalance = await fetchAccruedBalance(publicKey);
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
        if (!publicKey || !isWalletConnected) {
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
  }, [publicKey, isWalletConnected]);

  return (
    <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-green-400" />
            Current Balance
          </span>
          <TrendingUp className="w-5 h-5 text-green-400" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-slate-700 rounded w-3/4"></div>
              </div>
            ) : (
              <div className="text-4xl font-bold text-green-400">
                {balance.toFixed(6)} <span className="text-lg text-gray-400">tokens</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-400">
            <div className="flex justify-between items-center">
              <span>Wage Rate:</span>
              <span className="text-white">0.001 tokens/second</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span>Status:</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-green-400">
                  {isWalletConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Balance updates every 10 seconds</div>
            <div className="text-sm text-gray-300">
              {isWalletConnected 
                ? 'Real-time balance from Soroban contract'
                : 'Connect wallet to see real balance'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;