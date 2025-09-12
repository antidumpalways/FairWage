"use client";

import React from 'react';
import Link from 'next/link';
import { Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

const Header: React.FC = () => {
  const { isWalletConnected, publicKey, connectWallet, disconnectWallet } = useWallet();

  return (
    <header className="bg-slate-950/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">FW</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">FairWage</span>
              <span className="text-xs text-slate-400 -mt-1">Powered by Stellar</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/employer" className="text-slate-300 hover:text-white transition-colors font-medium">
              Employer Portal
            </Link>
            <Link href="/employee" className="text-slate-300 hover:text-white transition-colors font-medium">
              Employee Access
            </Link>
          </nav>

          <div className="flex items-center">
            {isWalletConnected ? (
              <div className="flex items-center space-x-4">
                <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-600">
                  <div className="text-sm text-slate-300 font-mono">
                    {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                  </div>
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all"
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