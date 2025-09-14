"use client";

import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import DeployNewContractModal from './DeployNewContractModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { publicKey, isWalletConnected } = useWallet();

  const handleDeployContract = () => {
    setIsModalOpen(true);
  };

  const handleDeploySuccess = (tokenContractId: string, fairWageContractId: string, companyName: string, tokenSymbol: string) => {
    // Add new contract to the list
    const newContract: CompanyContract = {
      id: fairWageContractId,
      name: companyName,
      tokenSymbol: tokenSymbol,
      totalFunds: 0,
      employeeCount: 0,
      contractId: fairWageContractId,
      isActive: true
    };
    
    setCompanies(prev => [...prev, newContract]);
    setIsModalOpen(false);
    
    // Show success message
    alert(`New contract deployed successfully!\nCompany: ${companyName}\nContract ID: ${fairWageContractId}`);
  };

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
      <Card className="bg-white border border-slate-200 shadow-soft">
        <CardContent className="p-6 text-center">
          <div className="text-slate-600">
            Connect your wallet to view company funds
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add New Contract */}
      <Card className="bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 border-4 border-slate-300 hover:border-slate-400 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-2xl backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-100/80 to-slate-50 border-b-2 border-slate-200 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-slate-900 text-xl font-bold tracking-wide">Add New Contract</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="bg-gradient-to-b from-white to-slate-50/30 rounded-b-xl">
          <p className="text-sm text-slate-700 mb-6 leading-relaxed font-medium">
            Deploy additional payroll contracts for multiple business entities or departments
          </p>
          <Button 
            onClick={handleDeployContract}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-500/30 rounded-xl"
          >
            <Building2 className="w-5 h-5 mr-3" />
            Deploy Contract
          </Button>
        </CardContent>
      </Card>

      {/* Deploy New Contract Modal */}
      <DeployNewContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleDeploySuccess}
      />
    </div>
  );
};

export default CompanyFundsCard;
