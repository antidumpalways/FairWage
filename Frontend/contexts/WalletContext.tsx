"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { connectWallet as connectPublicWallet, healthCheck } from '@/lib/soroban';

interface WalletContextType {
  isWalletConnected: boolean;
  publicKey: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isBackendHealthy: boolean;
  checkBackendHealth: () => Promise<void>;
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
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);

  const connectWallet = async () => {
    try {
      console.log('🔗 Connecting wallet...');
      
      const publicKey = await connectPublicWallet();
      
      if (!publicKey) {
        throw new Error('Failed to connect wallet');
      }
      
      setPublicKey(publicKey);
      setIsWalletConnected(true);
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('publicKey', publicKey);
      
      console.log('🎉 Wallet connected successfully:', publicKey);
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Wallet connection failed: ${errorMessage}`);
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setPublicKey(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('publicKey');
    console.log('👋 Wallet disconnected');
  };

  const checkBackendHealth = async () => {
    try {
      console.log('🏥 Checking backend health...');
      const result = await healthCheck();
      
      // Sesuaikan dengan format return healthCheck yang sebenarnya
      if (result && (result.success !== false)) {
        setIsBackendHealthy(true);
        console.log('✅ Backend is healthy');
      } else {
        setIsBackendHealthy(false);
        console.warn('⚠️ Backend health check failed');
      }
    } catch (error) {
      console.error('❌ Backend health check error:', error);
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    // Restore wallet connection from localStorage
    const connected = localStorage.getItem('walletConnected');
    const savedPublicKey = localStorage.getItem('publicKey');
    if (connected && savedPublicKey) {
      setIsWalletConnected(true);
      setPublicKey(savedPublicKey);
    }

    // Check backend health on mount
    checkBackendHealth();
  }, []);

  return (
    <WalletContext.Provider value={{
      isWalletConnected,
      publicKey,
      connectWallet,
      disconnectWallet,
      isBackendHealthy,
      checkBackendHealth
    }}>
      {children}
    </WalletContext.Provider>
  );
};