"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Clock, TrendingUp, Award, Building2, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";

interface EmployeeStats {
  employeeId: string;
  companyName: string;
  position: string;
  startDate: string;
  wageRatePerSecond: number;
  totalEarned: number;
  totalWithdrawn: number;
  currentBalance: number;
  lastPayout: string;
  status: "active" | "inactive";
  performanceRating: number;
  workHours: number;
  overtimeHours: number;
  contractId?: string;
  wagePeriodLabel?: string;
}

const DECIMALS = 1e7;
const secsPerPeriod = (p: number) => (p===0?3600:p===1?86400:p===2?604800:30*86400);
const periodLabel = (p: number) => (p===0?'hour':p===1?'day':p===2?'week':'month');
const formatTokens = (n: number) => `${n.toFixed(7)} tokens`;
const formatDate = (d: string|number|Date) => new Date(d).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
const formatDateTime = (d: string|number|Date) => new Date(d).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});

const EmployeeStatsCard: React.FC = () => {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { publicKey, isWalletConnected } = useWallet();
  const empId = useMemo(() => (publicKey ? `EMP-${publicKey.slice(-8).toUpperCase()}` : ""), [publicKey]);

  useEffect(() => {
    let pollId: any;

    const load = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      setStats(null);
      if (!isWalletConnected || !publicKey) { setIsLoading(false); return; }

      try {
        // 1. Autodetect contract
        let contractId: string | null = null;
        try {
          const r = await fetch(`/api/autodetect-employee-contract?employee=${publicKey}`);
          const j = await r.json();
          if (r.ok && j?.success && j?.contractId) contractId = j.contractId;
        } catch {}

        if (!contractId) {
          const r2 = await fetch(`/api/get-current-contract`);
          const j2 = await r2.json();
          if (r2.ok && j2?.success && j2?.contractId) contractId = j2.contractId;
        }

        if (!contractId) {
          setErrorMsg("No FairWage contract found for your wallet.");
          setIsLoading(false);
          return;
        }

        try { localStorage.setItem("fairWageContractId", contractId); } catch {}

        // 2. Load info + balance
        const { getEmployeeInfo, fetchAccruedBalance } = await import("@/lib/soroban");
        const [info, accruedBig] = await Promise.all([
          getEmployeeInfo(contractId, publicKey),
          fetchAccruedBalance(publicKey),
        ]);

        const perPeriod = Number(info?.wage_rate ?? "0") / DECIMALS;
        const wp = Number(info?.wage_period ?? 0);
        const perSecond = perPeriod / secsPerPeriod(wp);
        const balTokens = Number(accruedBig.toString()) / DECIMALS;

        setStats({
          employeeId: empId,
          companyName: "FairWage",
          position: "Employee",
          startDate: new Date().toISOString(),
          wageRatePerSecond: perSecond,
          totalEarned: balTokens,
          totalWithdrawn: 0,
          currentBalance: balTokens,
          lastPayout:
            info?.last_accrual_timestamp && Number(info.last_accrual_timestamp) > 0
              ? new Date(Number(info.last_accrual_timestamp) * 1000).toISOString()
              : new Date().toISOString(),
          status: info?.active ? "active" : "inactive",
          performanceRating: 5,
          workHours: 0,
          overtimeHours: 0,
          contractId,
          wagePeriodLabel: periodLabel(wp),
        });

        // 3. Poll balance setiap 10 detik
        pollId = setInterval(async () => {
          try {
            const fresh = await fetchAccruedBalance(publicKey);
            const bal = Number(fresh.toString()) / DECIMALS;
            setStats(prev => (prev ? { ...prev, currentBalance: bal, totalEarned: bal } : prev));
          } catch {}
        }, 10_000);

        setIsLoading(false);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message || "Failed to load employee data");
        setIsLoading(false);
      }
    };

    load();
    return () => pollId && clearInterval(pollId);
  }, [isWalletConnected, publicKey, empId]);

  if (!isWalletConnected)
    return <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6 text-center"><div className="text-gray-400">Connect your wallet to view employee statistics</div></CardContent></Card>;

  if (isLoading)
    return <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><div className="animate-pulse space-y-4"><div className="h-6 bg-slate-700 rounded w-3/4"></div><div className="h-4 bg-slate-700 rounded w-1/2"></div><div className="h-4 bg-slate-700 rounded w-2/3"></div></div></CardContent></Card>;

  if (errorMsg || !stats)
    return <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6 text-center"><div className="text-gray-400">{errorMsg ?? "No employee data found"}</div></CardContent></Card>;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white flex items-center"><Building2 className="w-5 h-5 mr-2 text-blue-400"/>Employee Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-400">Employee ID</p><p className="text-white font-mono">{stats.employeeId}</p></div>
            <div><p className="text-sm text-gray-400">Company</p><p className="text-white">{stats.companyName}</p></div>
            <div><p className="text-sm text-gray-400">Position</p><p className="text-white">{stats.position}</p></div>
            <div><p className="text-sm text-gray-400">Start Date</p><p className="text-white">{formatDate(stats.startDate)}</p></div>
            <div><p className="text-sm text-gray-400">Status</p><Badge variant={stats.status === "active" ? "default" : "destructive"}>{stats.status[0].toUpperCase()+stats.status.slice(1)}</Badge></div>
            <div><p className="text-sm text-gray-400">Performance Rating</p><div className="flex items-center"><span className="text-white mr-2">{stats.performanceRating}/5.0</span><Award className="w-4 h-4 text-yellow-400"/></div></div>
            {stats.contractId && (<div className="md:col-span-2"><p className="text-sm text-gray-400">Contract</p><p className="text-white font-mono break-all">{stats.contractId}</p></div>)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white flex items-center"><Coins className="w-5 h-5 mr-2 text-green-400"/>Earnings Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg"><p className="text-sm text-gray-400 mb-1">Total Earned</p><p className="text-2xl font-bold text-green-400">{formatTokens(stats.totalEarned)}</p></div>
            <div className="text-center p-4 bg-slate-700 rounded-lg"><p className="text-sm text-gray-400 mb-1">Total Withdrawn</p><p className="text-2xl font-bold text-blue-400">{formatTokens(stats.totalWithdrawn)}</p></div>
            <div className="text-center p-4 bg-slate-700 rounded-lg"><p className="text-sm text-gray-400 mb-1">Current Balance</p><p className="text-2xl font-bold text-purple-400">{formatTokens(stats.currentBalance)}</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Wage Rate</p>
              <p className="text-white font-mono">
                {formatTokens(stats.wageRatePerSecond)} / second{" "}
                <span className="text-gray-400">
                  ({formatTokens(stats.wageRatePerSecond * secsPerPeriod(["hour","day","week","month"].indexOf(stats.wagePeriodLabel || "hour")))} per {stats.wagePeriodLabel})
                </span>
              </p>
            </div>
            <div><p className="text-sm text-gray-400">Last Accrual</p><p className="text-white">{formatDateTime(stats.lastPayout)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white flex items-center"><Clock className="w-5 h-5 mr-2 text-purple-400"/>Work Statistics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg"><p className="text-sm text-gray-400 mb-1">Work Hours (This Month)</p><p className="text-2xl font-bold text-blue-400">{stats.workHours}h</p></div>
            <div className="text-center p-4 bg-slate-700 rounded-lg"><p className="text-sm text-gray-400 mb-1">Overtime Hours</p><p className="text-2xl font-bold text-orange-400">{stats.overtimeHours}h</p></div>
            <div className="text-center p-4 bg-slate-700 rounded-lg"><p className="text-sm text-gray-400 mb-1">Efficiency</p><p className="text-2xl font-bold text-green-400">{Math.round((stats.workHours / 160) * 100)}%</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-green-400"/>Real-time Earnings Calculator</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Current Session Earnings</p>
              <div className="text-2xl font-bold text-green-400">{formatTokens(stats.currentBalance)}</div>
              <p className="text-xs text-gray-500 mt-1">Updated every 10 seconds from blockchain</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400">Per Second:</p><p className="text-white">{formatTokens(stats.wageRatePerSecond)}</p></div>
              <div><p className="text-gray-400">Per Hour:</p><p className="text-white">{formatTokens(stats.wageRatePerSecond * 3600)}</p></div>
              <div><p className="text-gray-400">Per Day:</p><p className="text-white">{formatTokens(stats.wageRatePerSecond * 86400)}</p></div>
              <div><p className="text-gray-400">Per Week:</p><p className="text-white">{formatTokens(stats.wageRatePerSecond * 604800)}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeStatsCard;