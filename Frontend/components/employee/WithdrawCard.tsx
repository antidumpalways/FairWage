"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchAccruedBalance, withdrawFunds, connectWallet } from '@/lib/soroban';
import { useWallet } from '@/contexts/WalletContext';

const WithdrawCard: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastWithdrawal, setLastWithdrawal] = useState<{ amount: number; timestamp: Date } | null>(null);
  const [availableBalance, setAvailableBalance] = useState<bigint>(BigInt(0));
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const { publicKey, isWalletConnected } = useWallet();

  const handleWithdraw = async (withdrawAmount: number) => {
    if (!isWalletConnected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Convert amount to bigint (assuming 6 decimal places)
      const amountBigInt = BigInt(Math.floor(withdrawAmount * 1000000));
      
      // Call Soroban contract
      await withdrawFunds(publicKey, amountBigInt);
      
      setLastWithdrawal({
        amount: withdrawAmount,
        timestamp: new Date()
      });
      setAmount('');
      
      // Reload balance after successful withdrawal
      await loadAvailableBalance();
      
      alert('Withdrawal successful!');
    } catch (error) {
      console.error('Failed to withdraw funds:', error);
      alert(`Withdrawal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > 0) {
      handleWithdraw(withdrawAmount);
    }
  };

  const loadAvailableBalance = async () => {
    if (!isWalletConnected || !publicKey) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await fetchAccruedBalance(publicKey);
      setAvailableBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setAvailableBalance(BigInt(0));
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const setMaxAmount = () => {
    // Convert bigint to display format (assuming 6 decimal places)
    const maxAmount = Number(availableBalance) / 1000000;
    setAmount(maxAmount.toString());
  };

  // Load balance when component mounts or wallet changes
  useEffect(() => {
    if (isWalletConnected && publicKey) {
      loadAvailableBalance();
    }
  }, [isWalletConnected, publicKey]);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <ArrowUpCircle className="w-5 h-5 mr-2 text-blue-400" />
          Withdraw Wages
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Instantly withdraw your earned wages to your wallet
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="withdrawAmount" className="text-gray-300">
                Amount (Tokens)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setMaxAmount}
                disabled={!isWalletConnected || isLoadingBalance}
                className="text-blue-400 hover:text-blue-300 p-0 h-auto"
              >
                Use Max
              </Button>
            </div>
            <Input
              id="withdrawAmount"
              type="number"
              min="0"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to withdraw"
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div className="text-sm text-gray-400 bg-slate-700 p-3 rounded-lg">
            <div className="flex justify-between mb-1">
              <span>Available Balance:</span>
              <span className="text-white">
                {isLoadingBalance ? (
                  <LoadingSpinner size="sm" className="inline" />
                ) : (
                  `${(Number(availableBalance) / 1000000).toFixed(6)} tokens`
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Gas Fee:</span>
              <span className="text-white">~0.001 tokens</span>
            </div>
            {!isWalletConnected && (
              <div className="text-yellow-400 text-xs mt-2">
                ⚠️ Please connect your wallet to view balance and withdraw
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={!isWalletConnected || !amount || parseFloat(amount) <= 0 || isLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing Withdrawal...
              </>
            ) : (
              'Withdraw Funds'
            )}
          </Button>
        </form>

        {lastWithdrawal && (
          <div className="bg-green-900/20 border border-green-700/50 p-4 rounded-lg">
            <div className="text-green-400 font-semibold mb-1">Withdrawal Successful!</div>
            <div className="text-sm text-gray-300">
              <div>Amount: {lastWithdrawal.amount} tokens</div>
              <div>Time: {lastWithdrawal.timestamp.toLocaleString()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WithdrawCard;