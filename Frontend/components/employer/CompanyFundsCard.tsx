"use client";

import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';

interface CompanyContract {
  id: string;
  name: string;
  tokenSymbol: string;
  totalFunds: number;
  employeeCount: number;
  contractId: string;
  isActive: boolean;
}

const CompanyFundsCard: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, isWalletConnected } = useWallet();

  // Load real company data from localStorage
  useEffect(() => {
    if (isWalletConnected && publicKey) {
      const loadCompanyData = () => {
        // Load contract data from localStorage
        const tokenContractId = localStorage.getItem('tokenContractId');
        const fairWageContractId = localStorage.getItem('fairWageContractId');
        const companyName = localStorage.getItem('companyName');
        const tokenName = localStorage.getItem('tokenName');
        const tokenSymbol = localStorage.getItem('tokenSymbol');
        
        if (tokenContractId && fairWageContractId && companyName) {
          const realCompany: CompanyContract = {
            id: '1',
            name: companyName,
            tokenSymbol: tokenSymbol || 'TOK',
            totalFunds: 0, // SAC has unlimited supply
            employeeCount: 0, // Will be updated when employees are added
            contractId: fairWageContractId,
            isActive: true
          };
          
          setCompanies([realCompany]);
          console.log('✅ Real company data loaded:', realCompany);
        } else {
          console.log('⚠️ No contract data found in localStorage');
          setCompanies([]);
        }
      };
      
      loadCompanyData();
    }
  }, [isWalletConnected, publicKey]);

  const getTotalFunds = () => {
    return companies.reduce((total, company) => total + company.totalFunds, 0);
  };

  const getTotalEmployees = () => {
    return companies.reduce((total, company) => total + company.employeeCount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (!isWalletConnected) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">
            Connect your wallet to view company funds
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add New Contract */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Add New Contract</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-4">
            Add a new business contract for additional revenue streams
          </p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <Building2 className="w-4 h-4 mr-2" />
            $ Add Contract
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyFundsCard;
