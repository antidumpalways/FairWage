"use client";

import React, { useState, useEffect } from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';

interface Transaction {
  id: string;
  type: 'withdrawal' | 'deposit' | 'wage_accrual';
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  hash: string;
  description: string;
  gasFee: number;
}

const TransactionHistoryCard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, isWalletConnected } = useWallet();

  // Mock transaction data generator
  useEffect(() => {
    if (isWalletConnected && publicKey) {
      // Generate realistic mock transaction data
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'withdrawal',
          amount: 150.00,
          timestamp: '2024-01-15T14:30:00Z',
          status: 'completed',
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          description: 'Withdrawal to wallet',
          gasFee: 0.001
        },
        {
          id: '2',
          type: 'wage_accrual',
          amount: 45.25,
          timestamp: '2024-01-15T12:00:00Z',
          status: 'completed',
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          description: 'Wage accrual for 10.5 hours',
          gasFee: 0.0005
        },
        {
          id: '3',
          type: 'withdrawal',
          amount: 75.50,
          timestamp: '2024-01-14T16:45:00Z',
          status: 'completed',
          hash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
          description: 'Partial withdrawal',
          gasFee: 0.001
        },
        {
          id: '4',
          type: 'wage_accrual',
          amount: 38.75,
          timestamp: '2024-01-14T08:00:00Z',
          status: 'completed',
          hash: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567',
          description: 'Wage accrual for 9 hours',
          gasFee: 0.0005
        },
        {
          id: '5',
          type: 'withdrawal',
          amount: 200.00,
          timestamp: '2024-01-13T11:20:00Z',
          status: 'completed',
          hash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
          description: 'Monthly withdrawal',
          gasFee: 0.001
        },
        {
          id: '6',
          type: 'wage_accrual',
          amount: 42.10,
          timestamp: '2024-01-13T00:00:00Z',
          status: 'completed',
          hash: '0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          description: 'Wage accrual for 9.75 hours',
          gasFee: 0.0005
        }
      ];
      
      setTransactions(mockTransactions);
      setIsLoading(false);
    }
  }, [isWalletConnected, publicKey]);

  const formatTokens = (amount: number) => {
    return `${amount.toFixed(6)} tokens`;
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'wage_accrual':
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="text-xs">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  if (!isWalletConnected) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">
            Connect your wallet to view transaction history
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

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-purple-400" />
          Transaction History
        </CardTitle>
        <p className="text-gray-400 text-sm">
          View all your wage transactions and withdrawals
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-slate-700 p-4 rounded-lg border border-slate-600"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <h4 className="text-white font-semibold capitalize">
                      {tx.type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-400">{tx.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {tx.type === 'withdrawal' ? '-' : '+'}{formatTokens(tx.amount)}
                  </div>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Time</p>
                  <p className="text-white">{formatDateTime(tx.timestamp)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <div className="flex items-center">
                    {getStatusIcon(tx.status)}
                    <span className="text-white ml-1 capitalize">{tx.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400">Gas Fee</p>
                  <p className="text-white">{formatTokens(tx.gasFee)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Transaction Hash</p>
                  <p className="text-white font-mono text-xs">{formatHash(tx.hash)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No transactions found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistoryCard;
