"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getCurrentContractInfo, selectDiscoveredContract, DiscoveredContract } from '@/lib/contractDiscovery';

interface CompanySelectorProps {
    onCompanySelected: (contractId: string) => void;
}

export default function CompanySelector({ onCompanySelected }: CompanySelectorProps) {
    const [contractId, setContractIdInput] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [currentCompanyInfo, setCurrentCompanyInfo] = useState<any>(null);

    // Load current contract info on component mount
    useEffect(() => {
        const loadCurrentContractInfo = () => {
            try {
                const current = getCurrentContractInfo();
                setCurrentCompanyInfo(current);
            } catch (error) {
                console.warn('Failed to load current contract info:', error);
                setCurrentCompanyInfo(null);
            }
        };
        loadCurrentContractInfo();
    }, []);

    const handleJoinCompany = async () => {
        if (!contractId.trim()) {
            setValidationError('Please enter a contract ID');
            return;
        }
        if (!companyName.trim()) {
            setValidationError('Please enter a company name');
            return;
        }

        setIsValidating(true);
        setValidationError('');

        try {
            // Create a contract object to store using the unified persistence layer
            const contractData: DiscoveredContract = {
                contractId: contractId.trim(),
                companyName: companyName.trim(),
                tokenSymbol: tokenSymbol.trim() || 'TBU',
                deploymentDate: new Date().toISOString(),
                transactionHash: 'manual-entry',
                deployerAddress: 'manual-entry'
            };
            
            // Use the unified persistence layer
            selectDiscoveredContract(contractData);
            
            // Update local state
            setCurrentCompanyInfo(contractData);
            
            // Notify parent component
            onCompanySelected(contractId.trim());
            
            console.log('✅ Company joined successfully:', contractData.companyName);
        } catch (error) {
            console.error('❌ Failed to join company:', error);
            setValidationError('Failed to join company. Please check your inputs and try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleCreateCompany = () => {
        // Redirect to company creation flow
        window.location.href = '/employer/onboard';
    };

    return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft-lg">
                            <span className="text-white font-bold text-xl">FW</span>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">FairWage</h1>
                    </div>
                    <p className="text-slate-600 text-lg">Choose your company access method</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Join Existing Company */}
                    <Card className="bg-white border-slate-200 shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-xl">
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Employee</Badge>
                                Join Company
                            </CardTitle>
                            <CardDescription className="text-slate-600">
                                Enter your company's contract ID to access your employee dashboard and view your earnings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="contractId" className="text-slate-700 font-medium">
                                    Company Contract ID
                                </Label>
                                <Input
                                    id="contractId"
                                    placeholder="e.g., CCP6QFKFVMCGZZBMKQL4WGJ5DL6APXQZXSRQK54XZJPDCLVMAYWLJBBE"
                                    value={contractId}
                                    onChange={(e) => setContractIdInput(e.target.value)}
                                    className="border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Get this from your employer or HR department
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="companyName" className="text-slate-700 font-medium">
                                    Company Name
                                </Label>
                                <Input
                                    id="companyName"
                                    placeholder="e.g., My Company Inc."
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Your company's official name
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="tokenSymbol" className="text-slate-700 font-medium">
                                    Token Symbol (Optional)
                                </Label>
                                <Input
                                    id="tokenSymbol"
                                    placeholder="e.g., TBU, USD, etc."
                                    value={tokenSymbol}
                                    onChange={(e) => setTokenSymbol(e.target.value)}
                                    className="border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Company's payment token symbol
                                </p>
                            </div>
                            {validationError && (
                                <p className="text-red-600 text-sm mt-1">{validationError}</p>
                            )}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                                <p className="text-xs text-blue-700 font-medium">
                                    🔒 Your data is secured with blockchain technology
                                </p>
                            </div>
                            <Button
                                onClick={handleJoinCompany}
                                disabled={isValidating || !contractId.trim() || !companyName.trim()}
                                className="w-full bg-gradient-primary hover:shadow-soft-lg text-white transition-all duration-300"
                            >
                                {isValidating ? 'Joining...' : 'Access Dashboard'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Create New Company */}
                    <Card className="bg-white border-slate-200 shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-slate-900 flex items-center gap-2 text-xl">
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Employer</Badge>
                                Create Company
                            </CardTitle>
                            <CardDescription className="text-slate-600">
                                Deploy a new FairWage contract for your company and start managing payroll on blockchain
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <p className="text-sm text-slate-700 font-medium">
                                    Setup Process:
                                </p>
                                <ul className="text-sm text-slate-600 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">1</span>
                                        <span>Deploy custom token contract for your company</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">2</span>
                                        <span>Deploy FairWage payroll contract with your settings</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">3</span>
                                        <span>Initialize both contracts and configure parameters</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">4</span>
                                        <span>Add employees and start managing payroll</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-4">
                                <p className="text-xs text-emerald-700 font-medium">
                                    💡 Complete setup takes approximately 5-10 minutes
                                </p>
                            </div>
                            <Button
                                onClick={handleCreateCompany}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white hover:shadow-soft-lg transition-all duration-300"
                            >
                                Start Setup Process
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Current Company Info */}
                {currentCompanyInfo && (
                    <Card className="bg-slate-50 border-slate-200 shadow-soft-lg">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-slate-600 mb-2 font-medium">Current Company:</p>
                                <div className="space-y-2">
                                    <div className="text-lg font-semibold text-slate-900">
                                        {currentCompanyInfo.companyName}
                                    </div>
                                    <div className="text-sm text-emerald-600 font-medium">
                                        Token: {currentCompanyInfo.tokenSymbol}
                                    </div>
                                    <code className="text-xs bg-slate-100 px-3 py-2 rounded-lg text-slate-600 font-mono border border-slate-200 block">
                                        {currentCompanyInfo.contractId}
                                    </code>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}




