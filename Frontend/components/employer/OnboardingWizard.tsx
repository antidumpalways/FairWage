"use client";

import React, { useState } from 'react';
import { ChevronRight, Coins, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { deployTokenContract, deployFairWageContract, initializeContract } from '@/lib/soroban';

interface OnboardingWizardProps {
  onComplete: (tokenContractId: string, fairWageContractId: string) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenContractId, setTokenContractId] = useState('');
  const [fairWageContractId, setFairWageContractId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeployToken = async () => {
    if (!companyName || !tokenName || !tokenSymbol) return;
    
    setIsLoading(true);
    try {
      console.log('🚀 Starting SAC token deployment...');
      
      // Deploy SAC (Stellar Asset Contract) - no initialization needed
      const realTokenId = await deployTokenContract(tokenName, tokenSymbol);
      console.log('✅ SAC Token deployed successfully:', realTokenId);
      console.log('ℹ️ SAC tokens have unlimited supply and ready to use immediately');
      
      setTokenContractId(realTokenId);
      setCurrentStep(2); // Skip to FairWage deployment
    } catch (error: any) {
      console.error('❌ Failed to deploy SAC token!');
      console.error('🔍 Error details:', error);
      console.error('🔍 Error message:', error.message);
      console.error('🔍 Error cause:', error.cause);
      alert(`SAC Token deployment failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployFairWage = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting FairWage deployment...');
      
      // Deploy FairWage contract
      const realFairWageId = await deployFairWageContract(tokenContractId);
      console.log('✅ FairWage deployed successfully:', realFairWageId);
      
      setFairWageContractId(realFairWageId);
      setCurrentStep(3); // Updated step numbering
    } catch (error: any) {
      console.error('❌ Failed to deploy FairWage contract!');
      console.error('🔍 Error details:', error);
      alert(`FairWage deployment failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeFairWage = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Starting FairWage initialization...');
      
      // Initialize FairWage contract
      const initResult = await initializeContract(fairWageContractId, 'fairwage', companyName, tokenName, tokenSymbol, tokenContractId);
      console.log('✅ FairWage initialized successfully');
      
      setCurrentStep(4); // Updated step numbering
    } catch (error: any) {
      console.error('❌ Failed to initialize FairWage!');
      console.error('🔍 Error details:', error);
      alert(`FairWage initialization failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Deploy SAC Token', icon: Coins },
    { id: 2, title: 'Deploy FairWage', icon: FileText },
    { id: 3, title: 'Initialize FairWage', icon: FileText },
    { id: 4, title: 'Complete Setup', icon: CheckCircle }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                  : 'bg-slate-700'
              }`}>
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 text-sm text-gray-300">{step.title}</div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-600 ml-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Create SAC Token */}
      {currentStep === 1 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Create Your SAC Payroll Token</CardTitle>
            <p className="text-gray-400">
              We'll deploy a Stellar Asset Contract (SAC) with unlimited supply for payroll payments
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-900 border border-blue-700 p-4 rounded-lg">
              <h3 className="text-blue-300 font-semibold mb-2">ℹ️ About SAC Tokens:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Unlimited supply - create tokens when needed</li>
                <li>• No initialization required - ready immediately</li>
                <li>• Transfer tokens to employees for withdrawal</li>
              </ul>
            </div>
            
            <div>
              <Label htmlFor="companyName" className="text-gray-300">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="tokenName" className="text-gray-300">Token Name</Label>
              <Input
                id="tokenName"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g., Acme Corp Token"
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="tokenSymbol" className="text-gray-300">Token Symbol</Label>
              <Input
                id="tokenSymbol"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., ACM"
                maxLength={6}
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>

            <Button
              onClick={handleDeployToken}
              disabled={!companyName || !tokenName || !tokenSymbol || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deploying SAC Token... (1/3)
                </>
              ) : (
                'Deploy SAC Token (1/3)'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Deploy FairWage Contract */}
      {currentStep === 2 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Deploy FairWage Contract</CardTitle>
            <p className="text-gray-400">
              Now we'll deploy the smart contract that manages your payroll system
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-900 border border-green-700 p-4 rounded-lg">
              <h3 className="text-green-300 font-semibold mb-2">✅ SAC Token Deployed:</h3>
              <p className="text-gray-300">Company: {companyName}</p>
              <p className="text-gray-300">Token: {tokenName} ({tokenSymbol})</p>
              <p className="text-gray-300 font-mono text-sm break-all">{tokenContractId}</p>
              <p className="text-green-300 text-sm mt-2">Ready to use - unlimited supply available!</p>
            </div>
            
            <Button
              onClick={handleDeployFairWage}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deploying FairWage... (2/3)
                </>
              ) : (
                'Deploy FairWage (2/3)'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Initialize FairWage Contract */}
      {currentStep === 3 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Initialize FairWage Contract</CardTitle>
            <p className="text-gray-400">
              Finally, we'll initialize your FairWage contract to connect it with your token
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Contract Details:</h3>
              <p className="text-gray-300">Company: {companyName}</p>
              <p className="text-gray-300">Employer: You</p>
              <p className="text-gray-300">Token Contract: {tokenContractId}</p>
              <p className="text-gray-300">FairWage Contract: {fairWageContractId}</p>
            </div>
            
            <Button
              onClick={handleInitializeFairWage}
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Initializing FairWage... (3/3)
                </>
              ) : (
                'Initialize FairWage (3/3)'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete Setup */}
      {currentStep === 4 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Setup Complete! 🎉</CardTitle>
            <p className="text-gray-400">
              Your FairWage payroll system is now ready to use
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-900 border border-green-700 p-4 rounded-lg">
              <h3 className="text-green-300 font-semibold mb-2">✅ All Contracts Deployed & Initialized:</h3>
              <p className="text-gray-300">Company: {companyName}</p>
              <p className="text-gray-300">Token: {tokenName} ({tokenSymbol}) - SAC</p>
              <p className="text-gray-300">Token Contract: {tokenContractId}</p>
              <p className="text-gray-300">FairWage Contract: {fairWageContractId}</p>
            </div>
            
            <div className="bg-blue-900 border border-blue-700 p-4 rounded-lg">
              <h3 className="text-blue-300 font-semibold mb-2">📋 Next Steps:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Add employees to your payroll system</li>
                <li>• Set hourly rates and working hours</li>
                <li>• Transfer tokens to employees when they request withdrawal</li>
                <li>• Monitor payroll transactions and balances</li>
              </ul>
            </div>
            
            <Button
              onClick={() => {
                // Save all data to localStorage
                localStorage.setItem('tokenContractId', tokenContractId);
                localStorage.setItem('fairWageContractId', fairWageContractId);
                localStorage.setItem('companyName', companyName);
                localStorage.setItem('tokenName', tokenName);
                localStorage.setItem('tokenSymbol', tokenSymbol);
                
                console.log('✅ All data saved to localStorage');
                onComplete(tokenContractId, fairWageContractId);
              }}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white w-full"
            >
              Start Using FairWage
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OnboardingWizard;