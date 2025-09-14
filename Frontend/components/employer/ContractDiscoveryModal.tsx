'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  Building, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { 
  discoverContractsByWallet, 
  getAllEmployerContracts,
  selectDiscoveredContract, 
  DiscoveredContract,
  getCurrentContractInfo,
  clearCurrentContract
} from '@/lib/contractDiscovery';

interface ContractDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContractSelected: (contractId: string, tokenContractId?: string) => void;
  walletAddress?: string;
}

export const ContractDiscoveryModal: React.FC<ContractDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onContractSelected,
  walletAddress
}) => {
  const [discoveredContracts, setDiscoveredContracts] = useState<DiscoveredContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  // Auto-discover when modal opens
  useEffect(() => {
    console.log('🔍 ContractDiscoveryModal useEffect - isOpen changed:', isOpen);
    if (isOpen) {
      console.log('🔄 Modal opened, starting discovery...');
      handleDiscover();
    } else {
      console.log('🔒 Modal closed');
    }
  }, [isOpen]);

  const handleDiscover = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all contracts from registry instead of searching blockchain
      const result = await getAllEmployerContracts();
      
      if (result.success) {
        setDiscoveredContracts(result.contracts);
        if (result.contracts.length === 0) {
          setError('No contracts found in registry. You may need to deploy a new contract.');
        }
      } else {
        setError(result.error || 'Failed to get contracts from registry');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get contracts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectContract = async (contract: DiscoveredContract) => {
    // Prevent double-click
    if (selectedContract) {
      console.log('⚠️ Contract selection already in progress, ignoring click');
      return;
    }

    try {
      console.log('🔍 Starting contract selection:', contract.companyName);
      setSelectedContract(contract.contractId);
      
      // Save to localStorage and notify parent
      selectDiscoveredContract(contract);
      onContractSelected(contract.contractId, contract.tokenContractId);
      
      // Close modal immediately
      onClose();
      setSelectedContract(null);
      
    } catch (error) {
      console.error('Failed to select contract:', error);
      setError('Failed to select contract');
      setSelectedContract(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openStellarExpert = (transactionHash: string) => {
    window.open(`https://stellar.expert/explorer/testnet/tx/${transactionHash}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Search className="w-6 h-6" />
            Select Your FairWage Contract
          </DialogTitle>
          <p className="text-gray-400 mt-2">
            Choose from your deployed contracts to manage employees and payroll.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Discovery Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleDiscover}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Contracts
                </>
              )}
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Card className="bg-red-900/20 border-red-700/50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div className="text-red-300">
                  <p className="font-medium">Discovery Error</p>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-gray-400">Loading your contracts...</p>
              </div>
            </div>
          )}

          {/* Discovered Contracts */}
          {!isLoading && discoveredContracts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Your {discoveredContracts.length} Contract{discoveredContracts.length !== 1 ? 's' : ''}
                </h3>
                <Badge variant="secondary" className="bg-green-900/50 text-green-300 border-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready to Select
                </Badge>
              </div>

              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {discoveredContracts.map((contract) => (
                  <Card 
                    key={contract.contractId} 
                    className={`bg-slate-800 border transition-all duration-200 ${
                      selectedContract === contract.contractId 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white flex items-center gap-2 mb-2">
                            <Building className="w-5 h-5" />
                            {contract.companyName}
                            {selectedContract === contract.contractId && (
                              <Badge className="bg-green-600 text-white ml-2">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Selected
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(contract.deploymentDate)}
                            </div>
                            <Badge variant="outline" className="text-blue-300 border-blue-500">
                              {contract.tokenSymbol}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => openStellarExpert(contract.transactionHash)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Contract IDs */}
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              FairWage Contract
                            </label>
                            <div className="font-mono text-sm text-white bg-slate-700/50 rounded px-2 py-1 break-all">
                              {contract.contractId}
                            </div>
                          </div>
                          {contract.tokenContractId && (
                            <div>
                              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Token Contract
                              </label>
                              <div className="font-mono text-sm text-white bg-slate-700/50 rounded px-2 py-1 break-all">
                                {contract.tokenContractId}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleSelectContract(contract)}
                          disabled={selectedContract === contract.contractId}
                          className={`w-full ${
                            selectedContract === contract.contractId
                              ? 'bg-green-600 hover:bg-green-600 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white`}
                        >
                          {selectedContract === contract.contractId ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Selected - Switching...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Select This Contract
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Contracts Found */}
          {!isLoading && !error && discoveredContracts.length === 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <Search className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Contracts Found</h3>
                  <p className="text-gray-400 mb-4">
                    No contracts found in registry. Deploy your first contract to get started.
                  </p>
                </div>
                
                <Button
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Deploy New Contract
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};