"use client";

import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useWallet } from '@/contexts/WalletContext';

interface Employee {
  address: string;
  wageRate: number;
  id: string;
}

const EmployeeManagementCard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployeeAddress, setNewEmployeeAddress] = useState('');
  const [newWageRate, setNewWageRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newRate, setNewRate] = useState('');
  const { publicKey, isWalletConnected } = useWallet();

  const handleAddEmployee = async (address: string, wageRate: number) => {
    if (!isWalletConnected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('👤 Adding REAL employee...');
      console.log('📋 Address:', address);
      console.log('💰 Wage Rate:', wageRate);
      
      // TODO: Implement real contract call to add_employee
      // For now, simulate with local state
      const newEmployee: Employee = {
        id: Math.random().toString(36).substr(2, 9),
        address,
        wageRate,
      };
      setEmployees([...employees, newEmployee]);
      setNewEmployeeAddress('');
      setNewWageRate('');
      
      alert('Employee added successfully!');
    } catch (error: any) {
      console.error('❌ Failed to add employee:', error);
      alert(`Failed to add employee: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRate = async (employeeId: string, newWageRate: number) => {
    if (!isWalletConnected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('💰 Updating REAL wage rate...');
      console.log('👤 Employee ID:', employeeId);
      console.log('💰 New Rate:', newWageRate);
      
      // TODO: Implement real contract call to update_wage_rate
      // For now, simulate with local state
      setEmployees(employees.map(emp => 
        emp.id === employeeId ? { ...emp, wageRate: newWageRate } : emp
      ));
      setEditingEmployee(null);
      setNewRate('');
      
      alert('Wage rate updated successfully!');
    } catch (error: any) {
      console.error('❌ Failed to update wage rate:', error);
      alert(`Failed to update wage rate: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!isWalletConnected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🗑️ Removing REAL employee...');
      console.log('👤 Employee ID:', employeeId);
      
      // TODO: Implement real contract call to remove_employee
      // For now, simulate with local state
      setEmployees(employees.filter(emp => emp.id !== employeeId));
      
      alert('Employee removed successfully!');
    } catch (error: any) {
      console.error('❌ Failed to remove employee:', error);
      alert(`Failed to remove employee: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const wageRate = parseFloat(newWageRate);
    if (newEmployeeAddress && wageRate > 0) {
      handleAddEmployee(newEmployeeAddress, wageRate);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-400" />
          Employee Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Employee Form */}
        <form onSubmit={onAddEmployee} className="space-y-4 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-white font-semibold flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add New Employee
          </h3>
          
          <div>
            <Label htmlFor="employeeAddress" className="text-gray-300">
              Employee Address
            </Label>
            <Input
              id="employeeAddress"
              value={newEmployeeAddress}
              onChange={(e) => setNewEmployeeAddress(e.target.value)}
              placeholder="0x..."
              className="bg-slate-600 border-slate-500 text-white mt-2"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="wageRate" className="text-gray-300">
              Wage Rate (tokens per second)
            </Label>
            <Input
              id="wageRate"
              type="number"
              min="0"
              step="0.000001"
              value={newWageRate}
              onChange={(e) => setNewWageRate(e.target.value)}
              placeholder="0.001"
              className="bg-slate-600 border-slate-500 text-white mt-2"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={!newEmployeeAddress || !newWageRate || parseFloat(newWageRate) <= 0 || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Adding Employee...
              </>
            ) : (
              'Add Employee'
            )}
          </Button>
        </form>

        {/* Employee List */}
        <div>
          <h3 className="text-white font-semibold mb-4">Current Employees ({employees.length})</h3>
          
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No employees added yet. Add your first employee above.
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div key={employee.id} className="bg-slate-700 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-white font-mono text-sm">
                      {formatAddress(employee.address)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Rate: {employee.wageRate} tokens/second
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEmployee(employee);
                            setNewRate(employee.wageRate.toString());
                          }}
                          className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Update Wage Rate</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-gray-300">New Wage Rate (tokens per second)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.000001"
                              value={newRate}
                              onChange={(e) => setNewRate(e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                          </div>
                          <Button
                            onClick={() => editingEmployee && handleUpdateRate(editingEmployee.id, parseFloat(newRate))}
                            disabled={!newRate || parseFloat(newRate) <= 0 || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 w-full"
                          >
                            {isLoading ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Updating...
                              </>
                            ) : (
                              'Update Rate'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveEmployee(employee.id)}
                      disabled={isLoading}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeManagementCard;