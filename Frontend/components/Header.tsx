"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, Zap, Building2, ChevronDown, Search, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ContractDiscoveryModal } from '@/components/employer/ContractDiscoveryModal';
import { getCurrentContractInfo, clearCurrentContract } from '@/lib/contractDiscovery';

const Header: React.FC = () => {
  const { isWalletConnected, publicKey, connectWallet, disconnectWallet } = useWallet();
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);

  // Load current contract info on mount and refresh periodically
  useEffect(() => {
    const loadCurrentCompany = () => {
      const contractInfo = getCurrentContractInfo();
      setCurrentCompany(contractInfo);
    };
    
    loadCurrentCompany();
    
    // Set up interval to refresh company info (in case it changes in other tabs)
    const interval = setInterval(loadCurrentCompany, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCompanySwitch = (contractId: string) => {
    // Refresh company info after selection
    const contractInfo = getCurrentContractInfo();
    setCurrentCompany(contractInfo);
    setShowDiscoveryModal(false);
  };

  const handleClearCompany = () => {
    clearCurrentContract();
    setCurrentCompany(null);
    // Refresh current page to reflect changes
    window.location.reload();
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/fairwage-logo.png" alt="FairWage" className="w-10 h-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-jakarta text-slate-900">FairWage</span>
              <span className="text-xs text-slate-500 -mt-1">Powered by Stellar</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {/* Company Switcher */}
            {isWalletConnected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-xl flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span className="text-slate-700 font-medium">
                      {currentCompany ? currentCompany.companyName : 'Select Company'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel className="text-slate-600">Company Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {currentCompany && (
                    <>
                      <div className="px-2 py-2 text-sm">
                        <div className="font-medium text-slate-900">{currentCompany.companyName}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {currentCompany.contractId.slice(0, 8)}...{currentCompany.contractId.slice(-8)}
                        </div>
                        <div className="text-xs text-emerald-600 mt-1">
                          Token: {currentCompany.tokenSymbol}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={() => setShowDiscoveryModal(true)}>
                    <Search className="w-4 h-4 mr-2" />
                    Discover Companies
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/employer/onboard" className="cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Company
                    </Link>
                  </DropdownMenuItem>
                  
                  {currentCompany && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleClearCompany}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Clear Selection
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
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
      
      {/* Contract Discovery Modal */}
      <ContractDiscoveryModal
        isOpen={showDiscoveryModal}
        onClose={() => setShowDiscoveryModal(false)}
        onContractSelected={handleCompanySwitch}
        walletAddress={publicKey || undefined}
      />
    </header>
  );
};

export default Header;