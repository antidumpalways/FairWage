"use client";

import React from 'react';
import Link from 'next/link';
import { Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

const Header: React.FC = () => {
  const { isWalletConnected, publicKey, connectWallet, disconnectWallet } = useWallet();

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-soft">
              <img src="/fairwage-logo.png" alt="FairWage" className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-jakarta text-slate-900">FairWage</span>
              <span className="text-xs text-slate-500 -mt-1">Powered by Stellar</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/employer" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
              Employer Portal
            </Link>
            <Link href="/employee" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
              Employee Access
            </Link>
          </nav>

          <div className="flex items-center">
            {isWalletConnected ? (
              <div className="flex items-center space-x-4">
                <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-600 font-mono font-medium">
                    {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                  </div>
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 rounded-xl"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                className="bg-gradient-primary hover:shadow-soft-lg text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
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