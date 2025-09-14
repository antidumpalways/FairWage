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
  const [availableBalance, setAvailableBalance] = useState<bigint>(BigInt(0));
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
      setAvailableBalance(BigInt(0));
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
    else { setAvailableBalance(BigInt(0)); setErrorMsg(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWalletConnected, publicKey, selectedContract]);

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 border-4 border-slate-300 hover:border-slate-400 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-2xl backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-100/80 to-slate-50 border-b-2 border-slate-200 rounded-t-xl">
        <CardTitle className="text-slate-900 flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <ArrowUpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wide">Withdraw Wages</span>
            <p className="text-slate-600 text-sm font-medium mt-1">Access your earned wages instantly with secure blockchain transactions</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-gradient-to-b from-white to-slate-50/30 rounded-b-xl">
        <div className="space-y-6">
          {/* Withdrawal Mode Selection */}
          <div className="flex gap-4 mb-6">
            <Button
              variant={withdrawMode === 'full' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setWithdrawMode('full')}
              className={`flex-1 font-semibold py-3 transition-all duration-300 ${
                withdrawMode === 'full' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-blue-50 hover:border-blue-400'
              }`}
            >
              Withdraw All
            </Button>
            <Button
              variant={withdrawMode === 'partial' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setWithdrawMode('partial')}
              className={`flex-1 font-semibold py-3 transition-all duration-300 ${
                withdrawMode === 'partial' 
                  ? 'bg-slate-600 hover:bg-slate-700 text-white shadow-lg' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              Custom Amount
            </Button>
          </div>
          
          <div className="text-center mb-1">
            <div className="text-lg text-slate-900 mb-2">
              {withdrawMode === 'full' ? 'Withdraw All Accrued Wages' : 'Withdraw Custom Amount'}
            </div>
            <div className="text-sm text-slate-600">
              {withdrawMode === 'full' ? 'Withdraw all your earned wages at once' : 'Enter the amount you want to withdraw'}
            </div>
          </div>
          
          {/* Custom Amount Input */}
          {withdrawMode === 'partial' && (
            <div className="space-y-3">
              <label className="text-sm text-slate-900 font-semibold">Amount to withdraw (TBU):</label>
              <Input
                type="number"
                step="0.0000001"
                min="0"
                max={Number(availableBalance) / 10000000}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount..."
                className="bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500 py-3 text-lg font-medium shadow-sm"
              />
              <div className="text-sm text-slate-700 font-medium bg-slate-100 p-2 rounded-lg border border-slate-200">
                Max: {(Number(availableBalance) / 10000000).toFixed(7)} TBU
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-slate-100/60 to-emerald-50/40 p-4 rounded-xl border-2 border-slate-300/60 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-700 font-medium">💎 Available Balance:</span>
              <span className="text-emerald-700 font-bold text-lg">
                {isLoadingBalance ? <LoadingSpinner size="sm" className="inline" /> : formatBigintTokens(availableBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">⚡ Estimated Gas Fee:</span>
              <span className="text-blue-700 font-semibold">~0.001 tokens</span>
            </div>
            {!isWalletConnected && <div className="text-amber-800 text-sm mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">🔗 Please connect your wallet to view balance and withdraw</div>}
            {errorMsg && <div className="text-red-800 text-sm mt-3 p-2 bg-red-50 rounded-lg border border-red-200">⚠️ {errorMsg}</div>}
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={!isWalletConnected || isLoading || availableBalance === BigInt(0) || !!errorMsg || (withdrawMode === 'partial' && !customAmount)}
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