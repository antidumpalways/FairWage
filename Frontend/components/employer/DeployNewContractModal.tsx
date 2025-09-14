'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2 } from 'lucide-react';
import { deployTokenContract, deployFairWageContract, initializeContract } from '@/lib/soroban';

interface DeployNewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tokenContractId: string, fairWageContractId: string, companyName: string, tokenSymbol: string) => void;
}

const DeployNewContractModal: React.FC<DeployNewContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState('');
  const [tokenContractId, setTokenContractId] = useState('');
  const [fairWageContractId, setFairWageContractId] = useState('');

  const handleDeployToken = async () => {
    if (!companyName.trim() || !tokenName.trim() || !tokenSymbol.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsDeploying(true);
    setError('');

    try {
      console.log('🚀 Deploying new token contract...');
      const newTokenContractId = await deployTokenContract(tokenName, tokenSymbol);
      setTokenContractId(newTokenContractId);
      setStep(2);
    } catch (error: any) {
      console.error('❌ Token deployment failed:', error);
      setError(`Token deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeployFairWage = async () => {
    setIsDeploying(true);
    setError('');

    try {
      console.log('🚀 Deploying new FairWage contract...');
      const newFairWageContractId = await deployFairWageContract(tokenContractId, companyName, tokenSymbol);
      setFairWageContractId(newFairWageContractId);
      setStep(3);
    } catch (error: any) {
      console.error('❌ FairWage deployment failed:', error);
      setError(`FairWage deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleInitialize = async () => {
    setIsDeploying(true);
    setError('');

    try {
      console.log('🚀 Initializing new contract...');
      await initializeContract(fairWageContractId, tokenContractId);
      
      // Don't overwrite existing localStorage, just return the new contract info
      onSuccess(tokenContractId, fairWageContractId, companyName, tokenSymbol);
      onClose();
      
      // Reset form
      setStep(1);
      setCompanyName('');
      setTokenName('');
      setTokenSymbol('');
      setTokenContractId('');
      setFairWageContractId('');
    } catch (error: any) {
      console.error('❌ Initialization failed:', error);
      setError(`Initialization failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setStep(1);
    setCompanyName('');
    setTokenName('');
    setTokenSymbol('');
    setTokenContractId('');
    setFairWageContractId('');
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Deploy New Contract
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Company & Token Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-800 font-semibold mb-2">Step 1: Company Information</h3>
                <p className="text-blue-700 text-sm">Enter your company details and token information</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName" className="text-slate-700 font-medium">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Acme Corporation"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tokenName" className="text-slate-700 font-medium">Token Name</Label>
                  <Input
                    id="tokenName"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g., Acme Token"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tokenSymbol" className="text-slate-700 font-medium">Token Symbol</Label>
                <Input
                  id="tokenSymbol"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  placeholder="e.g., ACME"
                  className="mt-1"
                  maxLength={10}
                />
                <p className="text-xs text-slate-500 mt-1">Maximum 10 characters</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleDeployToken}
                disabled={isDeploying}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying Token...
                  </>
                ) : (
                  'Deploy Token Contract'
                )}
              </Button>
            </div>
          )}

          {/* Step 2: FairWage Deployment */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold mb-2">✅ Token Contract Deployed</h3>
                <p className="text-green-700 text-sm">Token: {tokenName} ({tokenSymbol})</p>
                <p className="text-green-700 text-sm font-mono break-all">{tokenContractId}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-800 font-semibold mb-2">Step 2: Deploy FairWage Contract</h3>
                <p className="text-blue-700 text-sm">Deploy the payroll management contract</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleDeployFairWage}
                  disabled={isDeploying}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    'Deploy FairWage Contract'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Initialize */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold mb-2">✅ FairWage Contract Deployed</h3>
                <p className="text-green-700 text-sm">Company: {companyName}</p>
                <p className="text-green-700 text-sm font-mono break-all">{fairWageContractId}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-800 font-semibold mb-2">Step 3: Initialize Contract</h3>
                <p className="text-blue-700 text-sm">Initialize the contract to start managing payroll</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleInitialize}
                  disabled={isDeploying}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    'Initialize & Complete'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeployNewContractModal;
