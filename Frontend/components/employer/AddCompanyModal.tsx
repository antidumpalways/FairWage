"use client";

import React, { useState } from 'react';
import { X, Building2, Coins, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (company: any) => void;
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ isOpen, onClose, onAddCompany }) => {
  const [formData, setFormData] = useState({
    name: '',
    tokenSymbol: '',
    description: '',
    industry: '',
    initialFunds: '',
    employeeCount: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Education',
    'Consulting',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.tokenSymbol) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate realistic contract ID
      const contractId = `CD${Math.random().toString(36).substr(2, 64)}`;
      
      const newCompany = {
        id: Date.now().toString(),
        name: formData.name,
        tokenSymbol: formData.tokenSymbol.toUpperCase(),
        description: formData.description,
        industry: formData.industry,
        totalFunds: parseFloat(formData.initialFunds) || 0,
        employeeCount: parseInt(formData.employeeCount) || 0,
        contractId: contractId,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      onAddCompany(newCompany);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        tokenSymbol: '',
        description: '',
        industry: '',
        initialFunds: '',
        employeeCount: ''
      });
      
    } catch (error) {
      console.error('Failed to add company:', error);
      alert('Failed to add company. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-400" />
            Add New Company
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <Label htmlFor="name" className="text-gray-300">
                Company Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
                className="bg-slate-700 border-slate-600 text-white mt-2"
                required
              />
            </div>

            {/* Token Symbol */}
            <div>
              <Label htmlFor="tokenSymbol" className="text-gray-300">
                Token Symbol *
              </Label>
              <Input
                id="tokenSymbol"
                value={formData.tokenSymbol}
                onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                placeholder="e.g., ACM, TECH, FIN"
                maxLength={6}
                className="bg-slate-700 border-slate-600 text-white mt-2 uppercase"
                required
              />
            </div>

            {/* Industry */}
            <div>
              <Label htmlFor="industry" className="text-gray-300">
                Industry
              </Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-2">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Initial Funds */}
            <div>
              <Label htmlFor="initialFunds" className="text-gray-300">
                Initial Funds (USD)
              </Label>
              <Input
                id="initialFunds"
                type="number"
                min="0"
                step="1000"
                value={formData.initialFunds}
                onChange={(e) => setFormData({ ...formData, initialFunds: e.target.value })}
                placeholder="Enter initial funding amount"
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>

            {/* Employee Count */}
            <div>
              <Label htmlFor="employeeCount" className="text-gray-300">
                Initial Employee Count
              </Label>
              <Input
                id="employeeCount"
                type="number"
                min="0"
                value={formData.employeeCount}
                onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                placeholder="Enter number of employees"
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-gray-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the company"
                className="bg-slate-700 border-slate-600 text-white mt-2"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.name || !formData.tokenSymbol}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? 'Adding Company...' : 'Add Company'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCompanyModal;
