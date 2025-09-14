"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Users, ArrowRight, DollarSign, Clock, Shield, Check, Star, Zap } from 'lucide-react';
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600 font-medium">Loading...</div>
      </div>
    );
  }

  if (!hasContract) {
    return <CompanySelector onCompanySelected={handleCompanySelected} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="text-left">
              <div className="mb-8">
                <h1 className="text-5xl md:text-7xl font-bold font-jakarta text-slate-900 mb-4">
                  Payroll.<br/>
                  <span className="text-brand-600">Reimagined.</span>
                </h1>
                <p className="text-xl text-slate-500 font-medium italic">
                  "Where every second of work counts, instantly"
                </p>
              </div>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Professional earned wage access platform powered by Stellar blockchain. 
                Streamline payroll operations with real-time wage accrual and instant withdrawals.
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 mb-10">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-slate-600 font-medium">Enterprise Security</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-slate-600 font-medium">Instant Settlements</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <span className="text-slate-600 font-medium">Powered by Stellar</span>
                </div>
              </div>
            
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/employer">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-soft-lg text-white px-8 py-4 text-lg font-semibold w-full sm:w-auto rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <Building2 className="w-5 h-5 mr-2" />
                    Employer Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                
                <Link href="/employee">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 hover:shadow-soft-lg text-white px-8 py-4 text-lg font-semibold w-full sm:w-auto rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Employee Access
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right Column - Hero Image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-soft-xl">
                <Image 
                  src="/hero-team.png" 
                  alt="Professional team collaborating in modern office" 
                  width={600} 
                  height={400} 
                  priority
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-soft-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Real-time earnings</p>
                    <p className="text-lg font-bold text-slate-900">$2,847.92</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-700 text-base font-medium mb-8">Trusted by forward-thinking companies worldwide</p>
          <div className="flex justify-center items-center space-x-8">
            <div className="text-slate-600 font-bold text-sm tracking-wider">STELLAR</div>
            <div className="w-px h-6 bg-slate-400"></div>
            <div className="text-slate-600 font-bold text-sm tracking-wider">BLOCKCHAIN</div>
            <div className="w-px h-6 bg-slate-400"></div>
            <div className="text-slate-600 font-bold text-sm tracking-wider">ENTERPRISE</div>
            <div className="w-px h-6 bg-slate-400"></div>
            <div className="text-slate-600 font-bold text-sm tracking-wider">SECURE</div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-jakarta text-slate-900 mb-6">Enterprise-Grade Payroll Solution</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Built on Stellar blockchain for secure, transparent, and efficient payroll management
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="card-elevated-lg card-hover-subtle bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold font-jakarta text-slate-900 mb-4">Real-Time Accrual</h3>
              <p className="text-slate-600 leading-relaxed">
                Wages accumulate by the second with blockchain precision, providing employees immediate access to earned compensation
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated-lg card-hover-subtle bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold font-jakarta text-slate-900 mb-4">Instant Withdrawals</h3>
              <p className="text-slate-600 leading-relaxed">
                24/7 access to earned wages without waiting periods, improving employee financial wellness and satisfaction
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated-lg card-hover-subtle bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold font-jakarta text-slate-900 mb-4">Stellar Security</h3>
              <p className="text-slate-600 leading-relaxed">
                Enterprise-grade security with immutable blockchain records and transparent smart contract operations
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-subtle py-24 mt-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-jakarta text-slate-900 mb-6">Built for Modern Workforces</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Enhance your payroll operations with cutting-edge blockchain technology
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold font-jakarta text-slate-900 mb-6 flex items-center">
                  <Building2 className="w-8 h-8 text-brand-600 mr-3" />
                  For Employers
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-brand-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">Reduce Operational Costs</h4>
                      <p className="text-slate-600">Automate payroll processes and eliminate manual administration overhead</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-brand-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">Enhance Employee Retention</h4>
                      <p className="text-slate-600">Offer competitive benefits with instant wage access capabilities</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-brand-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">Complete Transparency</h4>
                      <p className="text-slate-600">Immutable blockchain records provide full audit trails and compliance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold font-jakarta text-slate-900 mb-6 flex items-center">
                  <Users className="w-8 h-8 text-slate-600 mr-3" />
                  For Employees
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">Financial Flexibility</h4>
                      <p className="text-slate-600">Access earned wages anytime without payday constraints or borrowing</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">Real-Time Earnings</h4>
                      <p className="text-slate-600">Watch your wages grow in real-time with second-by-second accrual</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">Secure Platform</h4>
                      <p className="text-slate-600">Enterprise-grade security with blockchain-powered wage protection</p>
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