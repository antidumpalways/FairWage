"use client";

import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { depositFunds } from '@/lib/soroban';
import { useWallet } from '@/contexts/WalletContext';

const DepositFundsCard: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, isWalletConnected } = useWallet();

  const handleDeposit = async (depositAmount: number) => {
    if (!isWalletConnected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('💰 Starting REAL deposit...');
      
      // Convert to BigInt (with 6 decimal places)
      const amountInSmallestUnit = BigInt(Math.floor(depositAmount * 1000000));
      
      // REAL deposit to Soroban contract
      await depositFunds(amountInSmallestUnit);
      console.log('✅ Deposit successful!');
      
      setAmount('');
      alert('Deposit successful!');
    } catch (error: any) {
      console.error('❌ Failed to deposit funds:', error);
      alert(`Deposit failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    if (depositAmount > 0) {
      handleDeposit(depositAmount);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-400" />
          Deposit Funds
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Add funds to your contract to pay employee wages
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-gray-300">
              Amount (Tokens)
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to deposit"
              className="bg-slate-700 border-slate-600 text-white mt-2"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || isLoading}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white w-full"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Depositing...
              </>
            ) : (
              'Deposit Funds'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DepositFundsCard;