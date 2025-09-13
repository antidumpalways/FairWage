"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Clock, DollarSign, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import {
  addEmployee,
  // setEmployeeSalary, // (unused)
  payEmployee,
  removeEmployee,
  payAllWages,
  fundContract,
  checkContractBalance,
  // createTrustline, // (unused)
  getAccruedBalance,
  getEmployeeInfo,
  // getContractBalance, // (unused)
  // payPartialByEmployer, // (unused)
  payAllEmployees as payAllEmployeesOnChain,
  listEmployees,
  freezeEmployee,
  activateEmployee,
  updateWageRate,
  deployTokenContract,
  deployFairWageContract,
  initializeContract,
} from "@/lib/soroban";

interface Employee {
  id: string;
  address: string;
  name: string;
  wageRate: number;
  wagePeriod: "hour" | "day" | "week" | "month";
  active: boolean; // on-chain active status
  accruedWages: number;
}

const EmployeeManagementCard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [contractBalance, setContractBalance] = useState<number | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    address: "",
    name: "",
    wageRate: 0,
    wagePeriod: "hour" as "hour" | "day" | "week" | "month",
  });
  const [isUpdatingWage, setIsUpdatingWage] = useState(false);
  const [updatingEmployeeId, setUpdatingEmployeeId] = useState<string | null>(null);
  const [newWageRate, setNewWageRate] = useState("");
  // Removed newWagePeriod - contract doesn't support period updates after creation
  const [isSyncing, setIsSyncing] = useState(false);
  const { publicKey, isWalletConnected } = useWallet();

  // Convert period string to number (smart contract expects 0-3)
  const periodToNumber = (period: "hour" | "day" | "week" | "month"): number => {
    switch (period) {
      case "hour": return 0;
      case "day": return 1;
      case "week": return 2;
      case "month": return 3;
      default: return 1; // default to day
    }
  };

  useEffect(() => {
    if (isWalletConnected && publicKey) {
      // Load employees from localStorage first to preserve names, then sync with blockchain
      loadEmployeesFromStorage();
      setTimeout(() => void syncEmployeesFromContract(), 100); // Small delay to let localStorage load first
      void checkBalance();
    }
  }, [isWalletConnected, publicKey]);

  // Load employees from localStorage to preserve names
  const loadEmployeesFromStorage = () => {
    try {
      const savedEmployees = localStorage.getItem("employees");
      if (savedEmployees) {
        const parsedEmployees = JSON.parse(savedEmployees) as Employee[];
        console.log("💾 Loading employees from localStorage:", parsedEmployees);
        setEmployees(parsedEmployees);
      }
    } catch (error) {
      console.error("❌ Failed to load employees from localStorage:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const fairWageContractId = localStorage.getItem("fairWageContractId");
        const tokenContractId = localStorage.getItem("tokenContractId");
        console.log("📋 FairWage:", fairWageContractId, "Token:", tokenContractId);
      } catch (error) {
        console.error("❌ Error loading contract IDs from localStorage:", error);
      }
    }
  }, []);

  const syncEmployeesFromContract = async () => {
    setIsSyncing(true);
    try {
      const fairWageContractId = localStorage.getItem("fairWageContractId");
      if (!fairWageContractId) {
        console.error("❌ No fairWageContractId found");
        return;
      }

      console.log("🔄 Syncing employees from blockchain...");
      
      // Try to get employees from blockchain
      let employeeAddresses: string[] = [];
      try {
        employeeAddresses = await listEmployees(fairWageContractId);
        console.log("✅ Got employees from blockchain:", employeeAddresses);
      } catch (error) {
        console.error("❌ Failed to list employees from blockchain:", error);
        
        // Fallback: try to load from localStorage if blockchain fails
        const savedEmployees = localStorage.getItem("employees");
        if (savedEmployees) {
          try {
            const parsedEmployees = JSON.parse(savedEmployees) as Employee[];
            console.log("📋 Fallback: Loading from localStorage:", parsedEmployees);
            setEmployees(parsedEmployees);
            return;
          } catch (e) {
            console.error("❌ Failed to parse localStorage employees:", e);
          }
        }
        return;
      }

      if (employeeAddresses.length === 0) {
        console.log("📋 No employees found in blockchain");
        setEmployees([]);
        return;
      }

      // Also check localStorage for names if not found in current state
      let savedEmployees: Employee[] = [];
      try {
        const saved = localStorage.getItem("employees");
        if (saved) {
          savedEmployees = JSON.parse(saved) as Employee[];
        }
      } catch (error) {
        console.error("❌ Failed to load saved employees for sync:", error);
      }

      const syncedEmployees = await Promise.all(
        employeeAddresses.map(async (address: string) => {
          try {
            const info: any = await getEmployeeInfo(fairWageContractId, address);
            const accrued = await getAccruedBalance(address);
            
            // Try to find existing employee in current state OR localStorage
            const existingInState = employees.find((e) => e.address === address);
            const existingInStorage = savedEmployees.find((e) => e.address === address);
            const existing = existingInState || existingInStorage;
            
            console.log(`🔍 Employee ${address.slice(0, 8)}... - State: ${existingInState?.name || 'none'}, Storage: ${existingInStorage?.name || 'none'}`);
            
            return {
              id:
                existing?.id ||
                `${Date.now().toString()}_${Math.random().toString(36).slice(2, 9)}`,
              address,
              name: existing?.name || `Employee ${address.slice(0, 8)}...`,
              wageRate: Number(info.wage_rate || info.wageRate || 0),
              wagePeriod:
                (info.wage_period ?? info.wagePeriod ?? 0) === 0
                  ? "hour"
                  : (info.wage_period ?? info.wagePeriod ?? 0) === 1
                  ? "day"
                  : (info.wage_period ?? info.wagePeriod ?? 0) === 2
                  ? "week"
                  : "month",
              active: Boolean(info.active),
              accruedWages: accrued,
            } as Employee;
          } catch (e) {
            console.error(`❌ Failed to sync employee ${address}:`, e);
            return null;
          }
        })
      );

      const valid = syncedEmployees.filter((e): e is Employee => Boolean(e));
      setEmployees(valid);
      console.log("✅ Employees synced from blockchain:", valid);
    } catch (error) {
      console.error("❌ Failed to sync employees from contract:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (employees.length > 0) {
      try {
        localStorage.setItem("employees", JSON.stringify(employees));
      } catch (error) {
        console.error("❌ Failed to save employees to localStorage:", error);
        alert("Failed to save employees data. Please try again.");
      }
    }
  }, [employees]);

  useEffect(() => {
    if (employees.length === 0) return;
    const interval = setInterval(() => void refreshAccruedBalances(), 30000);
    return () => clearInterval(interval);
  }, [employees.length]);

  const validateStellarAddress = (address: string) => address.startsWith("G") && address.length === 56;

  const handleAddEmployee = async () => {
    if (!newEmployee.address || !newEmployee.name || newEmployee.wageRate <= 0) {
      alert("Please fill in all fields with valid values");
      return;
    }
    if (!validateStellarAddress(newEmployee.address)) {
      alert("Please enter a valid Stellar address (starts with G, 56 characters)");
      return;
    }
    if (employees.some((emp) => emp.address === newEmployee.address)) {
      alert("Employee with this address already exists");
      return;
    }
    
    setIsLoading(true);
    try {
      const fairWageContractId = localStorage.getItem("fairWageContractId");
      if (!fairWageContractId) throw new Error("FairWage contract not found. Please complete setup first.");

      await addEmployee(
        fairWageContractId,
        newEmployee.address,
        newEmployee.name,
        newEmployee.wageRate,
        periodToNumber(newEmployee.wagePeriod)
      );

      const employee: Employee = {
        id: Date.now().toString(),
        address: newEmployee.address,
        name: newEmployee.name,
        wageRate: newEmployee.wageRate,
        wagePeriod: newEmployee.wagePeriod,
        active: true,
        accruedWages: 0,
      };

      setEmployees((prev) => [...prev, employee]);
      setNewEmployee({ address: "", name: "", wageRate: 0, wagePeriod: "hour" });
      setIsAddingEmployee(false);
      alert(
        `Employee ${employee.name} added successfully!\n\nNote: Employee must create trustline for this token to receive payments.`
      );
    } catch (error: any) {
      console.error("❌ Failed to add employee:", error);
      alert(`Failed to add employee: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetEmployee = async (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return;

    if (
      confirm(
        `Reset ${employee.name}? This will remove them from blockchain and add them back with fresh data.`
      )
    ) {
      setIsLoading(true);
      try {
        const fairWageContractId = localStorage.getItem("fairWageContractId");
        if (!fairWageContractId) throw new Error("FairWage contract not found. Please complete setup first.");

        await removeEmployee(fairWageContractId, employee.address);
        await addEmployee(
          fairWageContractId,
          employee.address,
          employee.name,
          employee.wageRate,
          periodToNumber(employee.wagePeriod)
        );

        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === employeeId ? { ...emp } : emp
          )
        );
        alert(`Employee ${employee.name} reset successfully!`);
      } catch (error: any) {
        console.error("Reset failed:", error);
        alert(`Reset failed: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFreezeEmployee = async (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return;

    if (
      confirm(
        `Are you sure you want to freeze ${employee.name}? This will pay all accrued wages and set them as inactive.`
      )
    ) {
      setIsLoading(true);
      try {
        const fairWageContractId = localStorage.getItem("fairWageContractId");
        if (!fairWageContractId) throw new Error("FairWage Contract ID not found. Please complete setup first.");

        await freezeEmployee(fairWageContractId, employee.address);

        setEmployees((prev) =>
          prev.map((emp) => (emp.id === employeeId ? { ...emp, active: false, accruedWages: 0 } : emp))
        );
        alert(
          `Employee ${employee.name} frozen successfully! All accrued wages have been paid.`
        );
      } catch (error: any) {
        console.error("Freeze failed:", error);
        if (error.message?.includes("trustline entry is missing")) {
          alert(`❌ Cannot freeze ${employee.name}: Employee needs to create a trustline first to receive their final payment.`);
        } else {
          alert(`Freeze failed: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return;

    if (
      confirm(`Are you sure you want to remove ${employee.name}? This will remove them from the blockchain.`)
    ) {
      setIsLoading(true);
      try {
        const fairWageContractId = localStorage.getItem("fairWageContractId");
        if (!fairWageContractId) throw new Error("FairWage contract not found. Please complete setup first.");

        try {
          await removeEmployee(fairWageContractId, employee.address);
          setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
          alert(`Employee ${employee.name} removed successfully from blockchain!`);
        } catch (removeError: any) {
          if (removeError.message?.includes("unpaid wages")) {
            const payAll = confirm(
              `${employee.name} has unpaid wages. Would you like to pay all outstanding wages first, then remove them?`
            );
            if (payAll) {
              await payAllWages(fairWageContractId, employee.address);
              await removeEmployee(fairWageContractId, employee.address);
              setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
              alert(`All wages paid and ${employee.name} removed successfully from blockchain!`);
            } else {
              alert("Employee removal cancelled. Please pay outstanding wages first.");
            }
          } else {
            throw removeError;
          }
        }
      } catch (error: any) {
        console.error("❌ Failed to remove employee:", error);
        alert(`Failed to remove employee: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleActivateEmployee = async (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return;

    if (
      confirm(
        `Are you sure you want to activate ${employee.name}? This will make them active again and they can start accruing wages.`
      )
    ) {
      setIsLoading(true);
      try {
        const fairWageContractId = localStorage.getItem("fairWageContractId");
        if (!fairWageContractId) throw new Error("FairWage Contract ID not found. Please complete setup first.");

        await activateEmployee(fairWageContractId, employee.address);

        setEmployees((prev) =>
          prev.map((emp) => (emp.id === employeeId ? { ...emp, active: true } : emp))
        );
        alert(`Employee ${employee.name} activated successfully!`);
      } catch (error: any) {
        console.error("❌ Failed to activate employee:", error);
        alert(`Failed to activate employee: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleEmployee = (employeeId: string) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === employeeId ? { ...emp, active: !emp.active } : emp)));
  };

  const handleUpdateWageRate = async (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return;

    const wageRate = parseFloat(newWageRate);
    if (isNaN(wageRate) || wageRate <= 0) {
      alert("Please enter a valid wage rate");
      return;
    }

    if (confirm(`Update ${employee.name}'s wage rate to ${formatTokenAmount(wageRate * 10000000)} per ${employee.wagePeriod}?`)) {
      setIsUpdatingWage(true);
      try {
        const fairWageContractId = localStorage.getItem("fairWageContractId");
        if (!fairWageContractId) throw new Error("FairWage Contract ID not found. Please complete setup first.");

        await updateWageRate(fairWageContractId, employee.address, wageRate);

        // Don't update local state - let blockchain sync handle it
        alert(`Wage rate updated successfully for ${employee.name}!`);
        setNewWageRate("");
        // Sync from blockchain to get updated values
        void syncEmployeesFromContract();
        setUpdatingEmployeeId(null);
      } catch (error: any) {
        console.error("❌ Failed to update wage rate:", error);
        alert(`Failed to update wage rate: ${error.message}`);
      } finally {
        setIsUpdatingWage(false);
      }
    }
  };

  const handleDeployToken = async () => {
    setIsLoading(true);
    try {
      const tokenName = "FairWage Token";
      const tokenSymbol = "FAIRWAGE";
      
      const tokenContractId = await deployTokenContract(tokenName, tokenSymbol);
      localStorage.setItem("tokenContractId", tokenContractId);
      localStorage.setItem("tokenSymbol", tokenSymbol);
      
      alert(`Token contract deployed successfully! Contract ID: ${tokenContractId}`);
    } catch (error: any) {
      console.error("❌ Failed to deploy token:", error);
      alert(`Failed to deploy token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployFairWage = async () => {
    setIsLoading(true);
    try {
      const tokenContractId = localStorage.getItem("tokenContractId");
      if (!tokenContractId) throw new Error("Please deploy token contract first");

      const fairWageContractId = await deployFairWageContract(tokenContractId);
      localStorage.setItem("fairWageContractId", fairWageContractId);
      
      alert(`FairWage contract deployed successfully! Contract ID: ${fairWageContractId}`);
    } catch (error: any) {
      console.error("❌ Failed to deploy FairWage contract:", error);
      alert(`Failed to deploy FairWage contract: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeContract = async () => {
    setIsLoading(true);
    try {
      const fairWageContractId = localStorage.getItem("fairWageContractId");
      const tokenContractId = localStorage.getItem("tokenContractId");
      
      if (!fairWageContractId || !tokenContractId) {
        throw new Error("Please deploy both contracts first");
      }

      await initializeContract(fairWageContractId, tokenContractId);
      
      alert("Contract initialized successfully! You can now add employees.");
    } catch (error: any) {
      console.error("❌ Failed to initialize contract:", error);
      alert(`Failed to initialize contract: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayEmployee = async (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return;
    setIsLoading(true);
    try {
      const fairWageContractId = localStorage.getItem("fairWageContractId");
      let tokenContractId = localStorage.getItem("tokenContractId");
      if (!tokenContractId) tokenContractId = "CCDS5X5VBZ3RVEFSHAR2SA3LP6RPR4HHHM5PIJ2IHUQMMIOJHGBVQLZ2";
      if (!fairWageContractId) throw new Error("FairWage Contract ID not found. Please complete setup first.");

      try {
        await payEmployee(fairWageContractId, employee.address);
        const paidAmount = employee.accruedWages || 0;
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === employeeId
              ? { ...emp, accruedWages: 0 }
              : emp
          )
        );
        alert(`Paid ${employee.name} ${formatTokenAmount(employee.accruedWages || 0)} successfully!`);
      } catch (payError: any) {
        if (payError.message?.includes("trustline entry is missing")) {
          alert(`❌ Payment failed: ${employee.name} needs to create a trustline first.`);
        } else {
          throw payError;
        }
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayAllEmployees = async () => {
    if (employees.length === 0) {
      alert("No employees to pay");
      return;
    }
    
    if (confirm(`Pay all ${employees.length} employees?`)) {
      setIsLoading(true);
      try {
        const fairWageContractId = localStorage.getItem("fairWageContractId");
        if (!fairWageContractId) throw new Error("FairWage contract not found. Please complete setup first.");

        // Prefer on-chain batch if available
        try {
          const activeEmployeeAddresses = employees.filter((e) => e.active).map((e) => e.address);
          if (activeEmployeeAddresses.length === 1) {
            await payAllEmployeesOnChain(fairWageContractId, activeEmployeeAddresses[0]);
          } else {
            // Pay each employee individually
            for (const employee of employees.filter((e) => e.active)) {
              await payAllEmployeesOnChain(fairWageContractId, employee.address);
            }
          }
        } catch (e) {
          // Fallback: pay one by one
          const now = new Date().toISOString();
          for (const employee of employees) {
            if (employee.active) {
              try {
                await payEmployee(fairWageContractId, employee.address);
              } catch (err) {
                console.error(`❌ Failed to pay ${employee.name}:`, err);
              }
            }
          }
        }

        alert(`Paid all ${employees.length} employees successfully!`);
      } catch (error: any) {
        console.error("Batch payment failed:", error);
        alert(`Batch payment failed: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFundContract = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setIsLoading(true);
    try {
      const fairWageContractId = localStorage.getItem("fairWageContractId");
      let tokenContractId = localStorage.getItem("tokenContractId");
      if (!tokenContractId) tokenContractId = "CCDS5X5VBZ3RVEFSHAR2SA3LP6RPR4HHHM5PIJ2IHUQMMIOJHGBVQLZ2";
      if (!fairWageContractId) throw new Error("FairWage Contract ID not found. Please complete setup first.");

      await fundContract(fairWageContractId, tokenContractId, parseFloat(fundAmount));
      alert(`Contract funded with ${fundAmount} tokens successfully!`);
      setFundAmount("");
      await checkBalance();
    } catch (error: any) {
      console.error("Funding failed:", error);
      alert(`Funding failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBalance = async () => {
    try {
      const fairWageContractId = localStorage.getItem("fairWageContractId");
      let tokenContractId = localStorage.getItem("tokenContractId");
      if (!tokenContractId) tokenContractId = "CCDS5X5VBZ3RVEFSHAR2SA3LP6RPR4HHHM5PIJ2IHUQMMIOJHGBVQLZ2";
      if (!fairWageContractId) return;

      const balance = await checkContractBalance(fairWageContractId, tokenContractId);
      setContractBalance(balance);
    } catch (error) {
      console.error("❌ Failed to check balance:", error);
    }
  };


  const refreshAccruedBalances = async () => {
    if (employees.length === 0) return;
    try {
      const fairWageContractId = localStorage.getItem("fairWageContractId");
      if (!fairWageContractId) return;

      const updated = await Promise.all(
        employees.map(async (employee) => {
          try {
            const accrued = await getAccruedBalance(employee.address);
            return { ...employee, accruedWages: accrued };
          } catch (error) {
            console.error(`❌ Failed to get accrued for ${employee.name}:`, error);
            return employee;
          }
        })
      );
      setEmployees(updated);
    } catch (error) {
      console.error("❌ Failed to refresh accrued balances:", error);
    }
  };

  const addSelfAsEmployee = async () => {
    if (!publicKey) {
      alert("Please connect wallet first");
      return;
    }
    setNewEmployee({ address: publicKey, name: "Test Employee (Self)", wageRate: 100, wagePeriod: "hour" });
    setIsAddingEmployee(true);
  };

  const formatAddress = (address: string) => `${address.slice(0, 8)}...${address.slice(-6)}`;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const formatTokenAmount = (amount: number) => {
    const tokenSymbol = localStorage.getItem("tokenSymbol") || "YUP";
    // Always convert raw units to tokens (7 decimal places for Stellar tokens)
    const tokenAmount = amount / 10_000_000;
    const formatted = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      tokenAmount
    );
    return `${formatted} ${tokenSymbol}`;
  };

  const formatWageRate = (wageRateRawUnits: number) => {
    const tokenSymbol = localStorage.getItem("tokenSymbol") || "YUP";
    // Always convert raw units to tokens (7 decimal places for Stellar tokens)
    const wageRateTokens = wageRateRawUnits / 10_000_000;
    const formatted = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
      wageRateTokens
    );
    return `${formatted} ${tokenSymbol}`;
  };

  if (!isWalletConnected) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">Connect your wallet to manage employees</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Employees Card */}
        <Card className="bg-gradient-to-br from-slate-800 via-slate-800 to-blue-900/30 border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Total Employees</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                  {employees.length}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all duration-300"></div>
                <div className="relative bg-blue-500/10 p-3 rounded-full border border-blue-500/20 group-hover:bg-blue-500/20 transition-all duration-300">
                  <Users className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Employees Card */}
        <Card className="bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-900/30 border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Active Employees</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                  {employees.filter((e) => e.active).length}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all duration-300"></div>
                <div className="relative bg-emerald-500/10 p-3 rounded-full border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <Clock className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Balance Card */}
        <Card className="bg-gradient-to-br from-slate-800 via-slate-800 to-purple-900/30 border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Contract Balance</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                  {contractBalance !== null ? formatTokenAmount(contractBalance) : (
                    <span className="text-slate-500 text-xl animate-pulse">Loading...</span>
                  )}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all duration-300"></div>
                <div className="relative bg-purple-500/10 p-3 rounded-full border border-purple-500/20 group-hover:bg-purple-500/20 transition-all duration-300">
                  <DollarSign className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Section */}
    <Card className="bg-slate-800/50 border border-slate-600 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-white text-2xl font-bold">Employee Management</CardTitle>
            {isSyncing && (
              <div className="flex items-center space-x-2 text-sm text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>Syncing...</span>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setIsAddingEmployee((v) => !v)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAddingEmployee ? "Cancel" : "Add Employee"}
            </Button>
            {employees.length > 0 && (
              <Button
                onClick={() => void handlePayAllEmployees()}
                disabled={isLoading}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Pay All
              </Button>
            )}
          </div>
      </CardHeader>
        <CardContent>
          {isAddingEmployee && (
            <div className="bg-slate-700/50 p-6 rounded-xl mb-6 border border-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                  <Label htmlFor="employee-address" className="text-white font-semibold mb-2 block">
              Employee Address
            </Label>
            <Input
                    id="employee-address"
                    placeholder="G... (56 characters)"
                    value={newEmployee.address}
                    onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                    className="bg-slate-600/50 border-slate-500 text-white focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
                <div>
                  <Label htmlFor="employee-name" className="text-white font-semibold mb-2 block">
                    Employee Name
                  </Label>
                  <Input
                    id="employee-name"
                    placeholder="John Doe"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="bg-slate-600/50 border-slate-500 text-white focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
          <div>
                  <Label htmlFor="wage-rate" className="text-white font-semibold mb-2 block">
                    Wage Rate
            </Label>
            <Input
                    id="wage-rate"
              type="number"
                    step="0.001"
              placeholder="0.001"
                    value={newEmployee.wageRate}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, wageRate: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-slate-600/50 border-slate-500 text-white focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
                <div>
                  <Label htmlFor="wage-period" className="text-white font-semibold mb-2 block">
                    Wage Period
                  </Label>
                  <select
                    id="wage-period"
                    value={newEmployee.wagePeriod}
                    onChange={(e) => setNewEmployee({ ...newEmployee, wagePeriod: e.target.value as any })}
                    className="w-full p-3 bg-slate-600/50 border border-slate-500 rounded-lg text-white focus:border-blue-400 focus:ring-blue-400/20"
                  >
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                    <option value="week">Per Week</option>
                    <option value="month">Per Month</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => void handleAddEmployee()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Add Employee
                </Button>
              </div>
            </div>
          )}

          {/* Fund Contract Section */}
          <div className="bg-slate-700/50 p-6 rounded-xl mb-6 border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Fund Contract</h3>
              <Button
                onClick={() => setIsFunding((v) => !v)}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {isFunding ? "Cancel" : "Fund Contract"}
              </Button>
            </div>
            {isFunding && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="fund-amount" className="text-white font-semibold mb-2 block">
                    Amount to Fund (Tokens)
                  </Label>
                  <Input
                    id="fund-amount"
                    type="number"
                    placeholder="1000"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="bg-slate-600/50 border-slate-500 text-white focus:border-blue-400 focus:ring-blue-400/20"
                  />
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Transfer tokens from your account to the contract for payroll operations
                  </p>
                </div>
                <Button
                  onClick={() => void handleFundContract()}
                  disabled={isLoading || !fundAmount}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? "Funding..." : "Fund Contract"}
                </Button>
              </div>
            )}
          </div>


          {/* Employees List */}
          <div className="space-y-4">
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
                No employees added yet. Click "Add Employee" to get started.
            </div>
          ) : (
              employees.map((employee) => (
                <div key={employee.id} className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                  <div>
                        <h3 className="text-white font-semibold">{employee.name}</h3>
                        <p className="text-sm text-gray-400 font-mono">{formatAddress(employee.address)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => void handlePayEmployee(employee.id)}
                          disabled={isLoading || !employee.active}
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 border-0 font-medium"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pay Now
                        </Button>
                        <Button
                          onClick={() => setUpdatingEmployeeId(employee.id)}
                          size="sm"
                          variant="outline"
                          className="border-2 border-blue-400 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300 shadow-md hover:shadow-blue-400/20 backdrop-blur-sm"
                          disabled={isUpdatingWage}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Rate
                        </Button>
                        {employee.active && (
                          <Button
                            onClick={() => void handleFreezeEmployee(employee.id)}
                            size="sm"
                            variant="outline"
                            className="border-2 border-amber-400 text-amber-400 hover:bg-amber-500 hover:text-amber-900 hover:border-amber-500 transition-all duration-300 shadow-md hover:shadow-amber-400/20 backdrop-blur-sm font-medium"
                            disabled={isLoading}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                            Pause
                          </Button>
                        )}
                        {!employee.active && (
                          <>
                            <Button
                              onClick={() => void handleActivateEmployee(employee.id)}
                              size="sm"
                              variant="outline"
                              className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-md hover:shadow-emerald-400/20 backdrop-blur-sm font-medium"
                              disabled={isLoading}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 100-5H9v5zm0 0H7.5a2.5 2.5 0 100 5H9v-5zm0 0v5" />
                              </svg>
                              Resume
                            </Button>
                    <Button
                              onClick={() => void handleRemoveEmployee(employee.id)}
                      size="sm"
                      variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-900"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Update Wage Rate Section */}
                  {updatingEmployeeId === employee.id && (
                    <div className="bg-slate-600 p-3 rounded-lg mb-3">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-300 mb-1">New Wage Rate</label>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Enter new wage rate"
                          value={newWageRate}
                          onChange={(e) => setNewWageRate(e.target.value)}
                          className="bg-slate-500 border-slate-400 text-white"
                        />
                        <div className="bg-yellow-900/30 border border-yellow-400/30 rounded p-2 mt-2">
                          <p className="text-xs text-yellow-300">
                            ⚠️ <strong>Pay period cannot be changed after creation</strong>
                          </p>
                          <p className="text-xs text-yellow-400 mt-1">
                            Current period: <strong>{employee.wagePeriod}</strong>. To change period, remove and re-add the employee.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => void handleUpdateWageRate(employee.id)}
                          disabled={isUpdatingWage || !newWageRate}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                        >
                          {isUpdatingWage ? "Updating..." : "Update Wage Rate"}
                        </Button>
                        <Button
                          onClick={() => {
                            setUpdatingEmployeeId(null);
                            setNewWageRate("");
                          }}
                          size="sm"
                          variant="outline"
                          className="border-slate-400 text-slate-300 hover:bg-slate-500"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Wage Rate</p>
                      <p className="text-white">{formatWageRate(employee.wageRate)} / {employee.wagePeriod}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Accrued Balance</p>
                      <p className="text-green-400 font-bold">{formatTokenAmount(employee.accruedWages || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Status</p>
                      <Badge variant={employee.active ? "default" : "destructive"}>
                        {employee.active ? "🟢 Active" : "🔴 Frozen"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default EmployeeManagementCard;
