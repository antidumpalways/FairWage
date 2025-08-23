"use client";

import React, { useState, useEffect } from 'react';
import { Building2, Plus, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import AddCompanyModal from './AddCompanyModal';

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

  // Mock data for demonstration - in real implementation this would come from blockchain
  useEffect(() => {
    if (isWalletConnected && publicKey) {
      // Load existing companies from localStorage or blockchain
      const savedCompanies = localStorage.getItem('companyContracts');
      if (savedCompanies) {
        setCompanies(JSON.parse(savedCompanies));
      } else {
        // Default company if none exists
        const defaultCompany: CompanyContract = {
          id: '1',
          name: 'Acme Corporation',
          tokenSymbol: 'ACM',
          totalFunds: 50000,
          employeeCount: 12,
          contractId: 'CD1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          isActive: true
        };
        setCompanies([defaultCompany]);
        localStorage.setItem('companyContracts', JSON.stringify([defaultCompany]));
      }
    }
  }, [isWalletConnected, publicKey]);

  const addNewCompany = () => {
    setIsModalOpen(true);
  };

  const handleAddCompany = (newCompany: CompanyContract) => {
    const updatedCompanies = [...companies, newCompany];
    setCompanies(updatedCompanies);
    localStorage.setItem('companyContracts', JSON.stringify(updatedCompanies));
  };

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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Funds</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(getTotalFunds())}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Companies</p>
                <p className="text-2xl font-bold text-blue-400">
                  {companies.length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold text-purple-400">
                  {getTotalEmployees()}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Contracts List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Company Contracts</CardTitle>
          <Button
            onClick={addNewCompany}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-slate-700 p-4 rounded-lg border border-slate-600"
              >
                <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-white font-semibold">{company.name}</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {company.tokenSymbol}
                  </Badge>
                  <Badge 
                    variant={company.isActive ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {company.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {company.industry && (
                    <Badge variant="outline" className="text-xs text-gray-300">
                      {company.industry}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(company.totalFunds)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {company.employeeCount} employees
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Contract ID</p>
                    <p className="text-white font-mono">{formatAddress(company.contractId)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Token Symbol</p>
                    <p className="text-white">{company.tokenSymbol}</p>
                  </div>
                </div>
                
                {company.description && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <p className="text-gray-400 text-sm mb-1">Description</p>
                    <p className="text-gray-300 text-sm">{company.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCompany={handleAddCompany}
      />
    </div>
  );
};

export default CompanyFundsCard;
