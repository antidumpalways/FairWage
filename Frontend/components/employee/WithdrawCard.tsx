"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchAccruedBalance, withdrawEmployeeFunds } from "@/lib/soroban";
import { useWallet } from "@/contexts/WalletContext";

const formatBigintTokens = (bi: bigint) => {
  const s = bi.toString();
  if (s.length <= 7) return `0.${s.padStart(7, "0")} tokens`;
  return `${s.slice(0, -7)}.${s.slice(-7)} tokens`;
};

const WithdrawCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastWithdrawal, setLastWithdrawal] = useState<{ amount: string; timestamp: Date } | null>(null);
  const [availableBalance, setAvailableBalance] = useState<bigint>(0n);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    if (!isWalletConnected || !publicKey) return;
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
    setIsLoading(true); setErrorMsg(null);
    try {
      const pre = availableBalance;
      await withdrawEmployeeFunds();
      setLastWithdrawal({ amount: formatBigintTokens(pre).replace(" tokens",""), timestamp: new Date() });
      await loadAvailableBalance();
      alert(`Withdrawal successful! ${formatBigintTokens(pre)}`);
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
          <div className="text-center mb-1">
            <div className="text-lg text-white mb-2">Withdraw All Accrued Wages</div>
            <div className="text-sm text-gray-400">Withdraw all your earned wages at once</div>
          </div>

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
            disabled={!isWalletConnected || isLoading || availableBalance === 0n || !!errorMsg}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {isLoading ? (<><LoadingSpinner size="sm" className="mr-2" />Processing Withdrawal...</>) : (<><ArrowUpCircle className="w-5 h-5 mr-2" />Withdraw All Wages</>)}
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