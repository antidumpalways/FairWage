"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Users, ArrowRight, DollarSign, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CompanySelector from '@/components/CompanySelector';
import { getCurrentContractId } from '@/lib/soroban';

export default function HomePage() {
  const [hasContract, setHasContract] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const contractId = getCurrentContractId();
    setHasContract(!!contractId);
    setIsLoading(false);
  }, []);

  const handleCompanySelected = (contractId: string) => {
    setHasContract(true);
    // Redirect to appropriate dashboard based on user role
    // For now, redirect to employee dashboard
    window.location.href = '/employee';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!hasContract) {
    return <CompanySelector onCompanySelected={handleCompanySelected} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-slate-900/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-2xl font-bold">FW</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                Fair<span className="text-blue-400">Wage</span>
              </h1>
            </div>
            <p className="text-xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Professional earned wage access platform powered by Stellar blockchain. 
              Streamline payroll operations with real-time wage accrual and instant withdrawals.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <Link href="/employer">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 text-lg font-semibold w-full sm:w-auto shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Building2 className="w-5 h-5 mr-3" />
                  Employer Portal
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
              </Link>
              
              <Link href="/employee">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-slate-400 text-slate-300 hover:bg-slate-700 hover:text-white px-10 py-5 text-lg font-semibold w-full sm:w-auto hover:border-slate-300 transition-all duration-300"
                >
                  <Users className="w-5 h-5 mr-3" />
                  Employee Access
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">Enterprise-Grade Payroll Solution</h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Built on Stellar blockchain for secure, transparent, and efficient payroll management
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-600 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Real-Time Accrual</h3>
              <p className="text-slate-400 leading-relaxed">
                Wages accumulate by the second with blockchain precision, providing employees immediate access to earned compensation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-600 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Instant Withdrawals</h3>
              <p className="text-slate-400 leading-relaxed">
                24/7 access to earned wages without waiting periods, improving employee financial wellness and satisfaction
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-600 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Stellar Security</h3>
              <p className="text-slate-400 leading-relaxed">
                Enterprise-grade security with immutable blockchain records and transparent smart contract operations
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-slate-900/80 py-20 mt-20 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Built for Modern Workforces</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Enhance your payroll operations with cutting-edge blockchain technology
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Building2 className="w-8 h-8 text-blue-500 mr-3" />
                  For Employers
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Reduce Operational Costs</h4>
                      <p className="text-slate-400">Automate payroll processes and eliminate manual administration overhead</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Enhance Employee Retention</h4>
                      <p className="text-slate-400">Offer competitive benefits with instant wage access capabilities</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Complete Transparency</h4>
                      <p className="text-slate-400">Immutable blockchain records provide full audit trails and compliance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Users className="w-8 h-8 text-slate-500 mr-3" />
                  For Employees
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-slate-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Financial Flexibility</h4>
                      <p className="text-slate-400">Access earned wages anytime without payday constraints or borrowing</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-slate-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Real-Time Earnings</h4>
                      <p className="text-slate-400">Watch your wages grow in real-time with second-by-second accrual</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-slate-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Secure Platform</h4>
                      <p className="text-slate-400">Enterprise-grade security with blockchain-powered wage protection</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}