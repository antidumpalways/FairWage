"use client";

import React, { useState } from 'react';
import { ChevronRight, Coins, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { deployTokenContract, deployFairWageContract } from '@/lib/soroban';

interface OnboardingWizardProps {
  onComplete: (tokenContractId: string, fairWageContractId: string) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenContractId, setTokenContractId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeployToken = async () => {
    if (!tokenName || !tokenSymbol) return;
    
    setIsLoading(true);
    try {
      console.log('🚀 Starting REAL token deployment...');
      
      // REAL deployment to Soroban
      const realTokenId = await deployTokenContract(tokenName, tokenSymbol);
      console.log('✅ Token deployed successfully:', realTokenId);
      
      setTokenContractId(realTokenId);
      setCurrentStep(2);
                    } catch (error: any) {
                  console.error('❌ Failed to deploy token!');
                  console.error('🔍 Error details:', error);
                  console.error('🔍 Error message:', error.message);
                  console.error('🔍 Error cause:', error.cause);
                  alert(`Token deployment failed: ${error.message || 'Unknown error'}`);
                } finally {
      setIsLoading(false);
    }
  };

  const handleDeployFairWage = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting REAL FairWage deployment...');
      
      // REAL deployment to Soroban
      const realFairWageId = await deployFairWageContract(tokenContractId);
      console.log('✅ FairWage deployed successfully:', realFairWageId);
      
      onComplete(tokenContractId, realFairWageId);
                    } catch (error: any) {
                  console.error('❌ Failed to deploy FairWage contract!');
                  console.error('🔍 Error details:', error);
                  console.error('🔍 Error message:', error.message);
                  console.error('🔍 Error cause:', error.cause);
                  alert(`FairWage deployment failed: ${error.message || 'Unknown error'}`);
                } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Create Payroll Token', icon: Coins },
    { id: 2, title: 'Deploy FairWage Contract', icon: FileText },
    { id: 3, title: 'Complete Setup', icon: CheckCircle }
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

      {/* Step 1: Create Token */}
      {currentStep === 1 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Create Your Payroll Token</CardTitle>
            <p className="text-gray-400">
              First, we'll create a custom token that will be used for payroll payments
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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
              disabled={!tokenName || !tokenSymbol || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating & Deploying Token...
                </>
              ) : (
                'Create & Deploy Token'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Deploy FairWage Contract */}
      {currentStep === 2 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Deploy Your FairWage Contract</CardTitle>
            <p className="text-gray-400">
              Now we'll deploy the smart contract that manages your payroll system
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Token Contract ID</div>
              <div className="text-white font-mono text-sm break-all">{tokenContractId}</div>
            </div>

            <div className="text-gray-300">
              <p>Your token has been successfully created! Now we'll deploy the FairWage contract that will:</p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li>Manage employee wage rates and accruals</li>
                <li>Handle automatic wage calculations</li>
                <li>Enable instant wage withdrawals</li>
                <li>Provide transparent payroll tracking</li>
              </ul>
            </div>

            <Button
              onClick={handleDeployFairWage}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deploying & Initializing...
                </>
              ) : (
                'Deploy & Initialize'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OnboardingWizard;