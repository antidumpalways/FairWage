"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { setContractId, getCurrentContractId } from '@/lib/soroban';

interface CompanySelectorProps {
    onCompanySelected: (contractId: string) => void;
}

export default function CompanySelector({ onCompanySelected }: CompanySelectorProps) {
    const [contractId, setContractIdInput] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [currentContractId, setCurrentContractId] = useState<string | null>(null);

    // Load current contract ID on component mount
    useEffect(() => {
        const loadCurrentContractId = async () => {
            try {
                const current = await getCurrentContractId();
                setCurrentContractId(current);
            } catch (error) {
                console.warn('Failed to load current contract ID:', error);
                setCurrentContractId(null);
            }
        };
        loadCurrentContractId();
    }, []);

    const handleJoinCompany = async () => {
        if (!contractId.trim()) {
            setValidationError('Please enter a contract ID');
            return;
        }

        setIsValidating(true);
        setValidationError('');

        try {
            // TODO: Validate contract exists on blockchain
            // For now, just save the contract ID
            setContractId(contractId.trim());
            onCompanySelected(contractId.trim());
        } catch (error) {
            setValidationError('Invalid contract ID. Please check and try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleCreateCompany = () => {
        // Redirect to company creation flow
        window.location.href = '/employer/onboard';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-6">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">FairWage</h1>
                    <p className="text-gray-300">Choose your role to get started</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Join Existing Company */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Badge variant="secondary">Employee</Badge>
                                Join Company
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                                Enter your company's contract ID to access your dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="contractId" className="text-white">
                                    Company Contract ID
                                </Label>
                                <Input
                                    id="contractId"
                                    placeholder="e.g., CCP6QFKFVMCGZZBMKQL4WGJ5DL6APXQZXSRQK54XZJPDCLVMAYWLJBBE"
                                    value={contractId}
                                    onChange={(e) => setContractIdInput(e.target.value)}
                                    className="bg-slate-700 border-slate-600 text-white"
                                />
                                {validationError && (
                                    <p className="text-red-400 text-sm mt-1">{validationError}</p>
                                )}
                            </div>
                            <Button
                                onClick={handleJoinCompany}
                                disabled={isValidating || !contractId.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {isValidating ? 'Validating...' : 'Join Company'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Create New Company */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Badge variant="outline">Employer</Badge>
                                Create Company
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                                Deploy a new FairWage contract for your company
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-300">
                                    You'll need to:
                                </p>
                                <ul className="text-sm text-gray-400 space-y-1 ml-4">
                                    <li>• Deploy token contract</li>
                                    <li>• Deploy FairWage contract</li>
                                    <li>• Initialize both contracts</li>
                                    <li>• Add employees</li>
                                </ul>
                            </div>
                            <Button
                                onClick={handleCreateCompany}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                Create Company
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Current Contract Info */}
                {currentContractId && (
                    <Card className="bg-slate-800/30 border-slate-600">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-300 mb-2">Current Company:</p>
                                <code className="text-xs bg-slate-700 px-2 py-1 rounded text-green-400">
                                    {currentContractId}
                                </code>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}




