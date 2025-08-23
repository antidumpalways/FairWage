"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  isWalletConnected: boolean;
  publicKey: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      // REAL FREIGHTER WALLET CONNECTION - NO MORE MOCK!
      const { connectWallet: connectRealWallet } = await import('@/lib/soroban');
      const realPublicKey = await connectRealWallet();
      
      setPublicKey(realPublicKey);
      setIsWalletConnected(true);
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('publicKey', realPublicKey);
      
      console.log('🎉 REAL WALLET CONNECTED:', realPublicKey);
    } catch (error: any) {
      console.error('Failed to connect REAL wallet:', error);
      alert(`Wallet connection failed: ${error.message || 'Unknown error'}`);
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setPublicKey(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('publicKey');
  };

  useEffect(() => {
    const connected = localStorage.getItem('walletConnected');
    const savedPublicKey = localStorage.getItem('publicKey');
    if (connected && savedPublicKey) {
      setIsWalletConnected(true);
      setPublicKey(savedPublicKey);
    }
  }, []);

  return (
    <WalletContext.Provider value={{
      isWalletConnected,
      publicKey,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};