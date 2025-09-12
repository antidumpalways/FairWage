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

  const ensureContractDetected = async (): Promise<boolean> => {
    try {
      const r = await fetch(`/api/autodetect-employee-contract?employee=${publicKey}`);
      const j = await r.json();
      if (r.ok && j?.success && j?.contractId) {
        try { localStorage.setItem("fairWageContractId", j.contractId); } catch {}
        return true;
      }
      const r2 = await fetch(`/api/get-current-contract`);
      const j2 = await r2.json();
      if (r2.ok && j2?.success && j2?.contractId) {
        try { localStorage.setItem("fairWageContractId", j2.contractId); } catch {}
        return true;
      }
      return false;
    } catch { return false; }
  };

  const loadAvailableBalance = async () => {
    if (!isWalletConnected || !publicKey || !selectedContract) return;
    setIsLoadingBalance(true);
    setErrorMsg(null);
    try {
      const ok = await ensureContractDetected();
      if (!ok) {
        setErrorMsg("No FairWage contract found for your wallet.");
        setAvailableBalance(0n);
      } else {
        const balance = await fetchAccruedBalance(publicKey);
        setAvailableBalance(balance);
      }
    } catch (error) {
      console.error(error);
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
        transactionHash = await withdrawEmployeeFunds();
        withdrawnAmount = availableBalance;
      } else {
        transactionHash = await partialWithdraw(customAmount);
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
    if (isWalletConnected && publicKey) loadAvailableBalance();
    else { setAvailableBalance(0n); setErrorMsg(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWalletConnected, publicKey]);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <ArrowUpCircle className="w-5 h-5 mr-2 text-blue-400" />
          Withdraw Wages
        </CardTitle>
        <p className="text-gray-400 text-sm">Instantly withdraw your earned wages to your wallet</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Withdrawal Mode Selection */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={withdrawMode === 'full' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWithdrawMode('full')}
              className="flex-1"
            >
              Withdraw All
            </Button>
            <Button
              variant={withdrawMode === 'partial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWithdrawMode('partial')}
              className="flex-1"
            >
              Custom Amount
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

          <div className="text-sm text-gray-400 bg-slate-700 p-3 rounded-lg">
            <div className="flex justify-between mb-1">
              <span>Available Balance:</span>
              <span className="text-white">
                {isLoadingBalance ? <LoadingSpinner size="sm" className="inline" /> : formatBigintTokens(availableBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Gas Fee:</span>
              <span className="text-white">~0.001 tokens</span>
            </div>
            {!isWalletConnected && <div className="text-yellow-400 text-xs mt-2">⚠️ Please connect your wallet to view balance and withdraw</div>}
            {errorMsg && <div className="text-red-400 text-xs mt-2">⚠️ {errorMsg}</div>}
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={!isWalletConnected || isLoading || availableBalance === 0n || !!errorMsg || (withdrawMode === 'partial' && !customAmount)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
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