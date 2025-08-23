"use client";

import React from 'react';
import Link from 'next/link';
import { Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

const Header: React.FC = () => {
  const { isWalletConnected, publicKey, connectWallet, disconnectWallet } = useWallet();

  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FairWage</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/employer" className="text-gray-300 hover:text-white transition-colors">
              For Employers
            </Link>
            <Link href="/employee" className="text-gray-300 hover:text-white transition-colors">
              For Employees
            </Link>
          </nav>

          <div className="flex items-center">
            {isWalletConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-300">
                  {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-gray-300 hover:bg-slate-800"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;