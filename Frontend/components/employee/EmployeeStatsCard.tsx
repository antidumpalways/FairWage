"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, Award, Building2, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';

interface EmployeeStats {
  employeeId: string;
  companyName: string;
  position: string;
  startDate: string;
  wageRate: number;
  totalEarned: number;
  totalWithdrawn: number;
  currentBalance: number;
  lastPayout: string;
  status: 'active' | 'inactive';
  performanceRating: number;
  workHours: number;
  overtimeHours: number;
}

const EmployeeStatsCard: React.FC = () => {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, isWalletConnected } = useWallet();

  // Mock data generator
  useEffect(() => {
    if (isWalletConnected && publicKey) {
      // Generate realistic mock data
      const mockStats: EmployeeStats = {
        employeeId: `EMP-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        companyName: 'Acme Corporation',
        position: 'Senior Software Engineer',
        startDate: '2023-03-15',
        wageRate: 0.0012, // tokens per second
        totalEarned: 2847.65,
        totalWithdrawn: 2650.00,
        currentBalance: 197.65,
        lastPayout: '2024-01-15 14:30:00',
        status: 'active',
        performanceRating: 4.8,
        workHours: 168, // hours this month
        overtimeHours: 12
      };
      
      setStats(mockStats);
      setIsLoading(false);
    }
  }, [isWalletConnected, publicKey]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTokens = (amount: number) => {
    return `${amount.toFixed(6)} tokens`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isWalletConnected) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">
            Connect your wallet to view employee statistics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">
            No employee data found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Info Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-400" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Employee ID</p>
              <p className="text-white font-mono">{stats.employeeId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Company</p>
              <p className="text-white">{stats.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Position</p>
              <p className="text-white">{stats.position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Start Date</p>
              <p className="text-white">{formatDate(stats.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <Badge variant={stats.status === 'active' ? 'default' : 'destructive'}>
                {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-400">Performance Rating</p>
              <div className="flex items-center">
                <span className="text-white mr-2">{stats.performanceRating}/5.0</span>
                <Award className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Coins className="w-5 h-5 mr-2 text-green-400" />
            Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-green-400">
                {formatTokens(stats.totalEarned)}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Total Withdrawn</p>
              <p className="text-2xl font-bold text-blue-400">
                {formatTokens(stats.totalWithdrawn)}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-purple-400">
                {formatTokens(stats.currentBalance)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Wage Rate</p>
              <p className="text-white font-mono">{formatTokens(stats.wageRate)}/second</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Last Payout</p>
              <p className="text-white">{formatDateTime(stats.lastPayout)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Statistics */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-400" />
            Work Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Work Hours (This Month)</p>
              <p className="text-2xl font-bold text-blue-400">{stats.workHours}h</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Overtime Hours</p>
              <p className="text-2xl font-bold text-orange-400">{stats.overtimeHours}h</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Efficiency</p>
              <p className="text-2xl font-bold text-green-400">
                {Math.round((stats.workHours / 160) * 100)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Earnings Calculator */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Real-time Earnings Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Current Session Earnings</p>
              <div className="text-2xl font-bold text-green-400">
                {formatTokens(stats.currentBalance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Updated every 10 seconds from blockchain
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Per Second:</p>
                <p className="text-white">{formatTokens(stats.wageRate)}</p>
              </div>
              <div>
                <p className="text-gray-400">Per Hour:</p>
                <p className="text-white">{formatTokens(stats.wageRate * 3600)}</p>
              </div>
              <div>
                <p className="text-gray-400">Per Day:</p>
                <p className="text-white">{formatTokens(stats.wageRate * 86400)}</p>
              </div>
              <div>
                <p className="text-gray-400">Per Week:</p>
                <p className="text-white">{formatTokens(stats.wageRate * 604800)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeStatsCard;
