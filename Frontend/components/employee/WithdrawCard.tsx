"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchAccruedBalance, withdrawEmployeeFunds, partialWithdraw } from "@/lib/soroban";
import { useWallet } from "@/contexts/WalletContext";

const formatBigintTokens = (bi: bigint) => {
  const s = bi.toString();
  if (s.length <= 7) return `0.${s.padStart(7, "0")} tokens`;
  return `${s.slice(0, -7)}.${s.slice(-7)} tokens`;
};

interface Contract {
  contractId: string;
  companyName: string;
  tokenSymbol: string;
  tokenContract: string;
}

interface WithdrawCardProps {
  selectedContract?: Contract;
}

const WithdrawCard: React.FC<WithdrawCardProps> = ({ selectedContract }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastWithdrawal, setLastWithdrawal] = useState<{ amount: string; timestamp: Date } | null>(null);
  const [availableBalance, setAvailableBalance] = useState<bigint>(0n);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [withdrawMode, setWithdrawMode] = useState<'full' | 'partial'>('full');
  const [customAmount, setCustomAmount] = useState<string>('');
  const { publicKey, isWalletConnected } = useWallet();

  // Removed ensureContractDetected - now using selectedContract prop

  const loadAvailableBalance = async () => {
    if (!isWalletConnected || !publicKey || !selectedContract) return;
    setIsLoadingBalance(true);
    setErrorMsg(null);
    try {
      console.log('🔍 Loading withdrawal balance for:', publicKey, 'from contract:', selectedContract.contractId);
      const balance = await fetchAccruedBalance(publicKey, selectedContract.contractId);
      setAvailableBalance(balance);
      console.log('✅ Withdrawal balance loaded:', balance);
    } catch (error) {
      console.error('❌ Failed to load withdrawal balance:', error);
      setErrorMsg(error instanceof Error ? error.message : "Failed to load balance");
      setAvailableBalance(0n);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isWalletConnected || !publicKey) return alert("Please connect your wallet first");
    
    // Validate partial withdrawal amount
    if (withdrawMode === 'partial') {
      const amount = parseFloat(customAmount);
      if (!customAmount || isNaN(amount) || amount <= 0) {
        setErrorMsg("Please enter a valid withdrawal amount");
        return;
      }
      const maxAmount = Number(availableBalance) / 10000000; // Convert to display units
      if (amount > maxAmount) {
        setErrorMsg(`Amount exceeds available balance (${maxAmount.toFixed(7)} TBU)`);
        return;
      }
    }
    
    setIsLoading(true); setErrorMsg(null);
    try {
      let transactionHash: string;
      let withdrawnAmount: bigint;
      
      if (withdrawMode === 'full') {
        transactionHash = await withdrawEmployeeFunds(selectedContract?.contractId);
        withdrawnAmount = availableBalance;
      } else {
        transactionHash = await partialWithdraw(customAmount, selectedContract?.contractId);
        withdrawnAmount = BigInt(Math.floor(parseFloat(customAmount) * 10000000));
        setCustomAmount(''); // Clear input after withdrawal
      }
      
      const withdrawalRecord = {
        amount: formatBigintTokens(withdrawnAmount).replace(" tokens",""), 
        timestamp: new Date()
      };
      setLastWithdrawal(withdrawalRecord);

      // Save transaction to localStorage for history
      if (publicKey) {
        try {
          const newTransaction = {
            id: `withdrawal-${Date.now()}`,
            type: withdrawMode === 'full' ? 'withdrawal' : 'withdrawal',
            amount: Number(withdrawnAmount) / 10000000, // Convert to display units
            timestamp: new Date().toISOString(),
            status: 'completed',
            hash: transactionHash,
            description: withdrawMode === 'full' ? 'Full withdrawal of accrued wages' : `Partial withdrawal of ${customAmount} TBU`,
            gasFee: 0.001 // Estimated gas fee
          };
          
          const storageKey = `fairWage_transactions_${publicKey}`;
          const existingTransactions = localStorage.getItem(storageKey);
          const transactions = existingTransactions ? JSON.parse(existingTransactions) : [];
          transactions.unshift(newTransaction); // Add to beginning
          transactions.splice(10); // Keep only last 10 transactions
          localStorage.setItem(storageKey, JSON.stringify(transactions));
          console.log('✅ Transaction saved to history:', newTransaction);
        } catch (error) {
          console.warn('⚠️ Failed to save transaction to history:', error);
        }
      }

      await loadAvailableBalance();
      alert(`Withdrawal successful! ${formatBigintTokens(withdrawnAmount)} - Hash: ${transactionHash.substring(0, 10)}...`);
    } catch (e: any) {
      console.error(e); setErrorMsg(e?.message || "Unknown error");
      alert(`Withdrawal failed: ${e?.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isWalletConnected && publicKey && selectedContract) loadAvailableBalance();
    else { setAvailableBalance(0n); setErrorMsg(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWalletConnected, publicKey, selectedContract]);

  return (
    <Card className="glass-card card-hover bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-600/50 animate-slide-up">
      <CardHeader className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-shimmer"></div>
        <CardTitle className="text-white flex items-center relative z-10">
          <ArrowUpCircle className="w-6 h-6 mr-3 text-emerald-400 animate-bounce-subtle" />
          <span className="text-gradient-blue text-xl font-bold">Withdraw Wages</span>
        </CardTitle>
        <p className="text-gray-300 text-sm relative z-10">Instantly withdraw your earned wages to your wallet with zero delays</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Withdrawal Mode Selection */}
          <div className="flex gap-3 mb-6">
            <Button
              variant={withdrawMode === 'full' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWithdrawMode('full')}
              className={`flex-1 transition-all duration-300 transform hover:scale-105 ${
                withdrawMode === 'full' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-600/50 hover:border-emerald-400/50'
              }`}
            >
              💰 Withdraw All
            </Button>
            <Button
              variant={withdrawMode === 'partial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWithdrawMode('partial')}
              className={`flex-1 transition-all duration-300 transform hover:scale-105 ${
                withdrawMode === 'partial' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                  : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-600/50 hover:border-purple-400/50'
              }`}
            >
              🎯 Custom Amount
            </Button>
          </div>
          
          <div className="text-center mb-1">
            <div className="text-lg text-white mb-2">
              {withdrawMode === 'full' ? 'Withdraw All Accrued Wages' : 'Withdraw Custom Amount'}
            </div>
            <div className="text-sm text-gray-400">
              {withdrawMode === 'full' ? 'Withdraw all your earned wages at once' : 'Enter the amount you want to withdraw'}
            </div>
          </div>
          
          {/* Custom Amount Input */}
          {withdrawMode === 'partial' && (
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Amount to withdraw (TBU):</label>
              <Input
                type="number"
                step="0.0000001"
                min="0"
                max={Number(availableBalance) / 10000000}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount..."
                className="bg-slate-700 border-slate-600 text-white"
              />
              <div className="text-xs text-gray-400">
                Max: {(Number(availableBalance) / 10000000).toFixed(7)} TBU
              </div>
            </div>
          )}

          <div className="glass-card bg-gradient-to-br from-slate-700/30 to-slate-800/30 p-4 rounded-xl border border-slate-600/30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300 font-medium">💎 Available Balance:</span>
              <span className="text-emerald-400 font-bold text-lg">
                {isLoadingBalance ? <LoadingSpinner size="sm" className="inline" /> : formatBigintTokens(availableBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">⚡ Estimated Gas Fee:</span>
              <span className="text-blue-400 font-semibold">~0.001 tokens</span>
            </div>
            {!isWalletConnected && <div className="text-yellow-400 text-sm mt-3 p-2 bg-yellow-400/10 rounded-lg border border-yellow-400/20">🔗 Please connect your wallet to view balance and withdraw</div>}
            {errorMsg && <div className="text-red-400 text-sm mt-3 p-2 bg-red-400/10 rounded-lg border border-red-400/20">⚠️ {errorMsg}</div>}
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={!isWalletConnected || isLoading || availableBalance === 0n || !!errorMsg || (withdrawMode === 'partial' && !customAmount)}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-lg py-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {withdrawMode === 'full' ? 'Processing Full Withdrawal...' : 'Processing Partial Withdrawal...'}
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-5 h-5 mr-2" />
                {withdrawMode === 'full' 
                  ? 'Withdraw All Wages' 
                  : `Withdraw ${customAmount || '0'} TBU`
                }
              </>
            )}
          </Button>
        </div>

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