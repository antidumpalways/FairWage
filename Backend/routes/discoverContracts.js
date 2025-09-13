const express = require('express');
const StellarSdk = require('@stellar/stellar-sdk');

const router = express.Router();

// Initialize Horizon server
const horizonUrl = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const server = new StellarSdk.Horizon.Server(horizonUrl);

/**
 * Discover FairWage contracts deployed by a wallet address
 * Uses Stellar transaction history to find contract deployments
 */
router.post('/discover-contracts', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        
        if (!walletAddress) {
            return res.status(400).json({ 
                error: 'Wallet address is required',
                success: false 
            });
        }

        console.log(`🔍 Discovering contracts for wallet: ${walletAddress}`);

        // Get account transactions from Stellar Horizon
        const accountTransactions = await server.transactions()
            .forAccount(walletAddress)
            .order('desc')
            .limit(200) // Check last 200 transactions
            .call();

        console.log(`📊 Found ${accountTransactions.records.length} transactions for wallet`);

        const discoveredContracts = [];

        // Analyze each transaction for contract deployments
        for (const tx of accountTransactions.records) {
            try {
                // Check if transaction was successful
                if (!tx.successful) continue;

                // Get transaction operations to find contract deployments
                const operations = await server.operations()
                    .forTransaction(tx.hash)
                    .call();

                for (const op of operations.records) {
                    // Look for invoke_host_function operations (smart contract calls)
                    if (op.type === 'invoke_host_function') {
                        
                        // Extract contract details from transaction result
                        const contractInfo = await extractContractInfoFromTransaction(tx, op);
                        
                        if (contractInfo && contractInfo.contractId) {
                            // Add to discovered contracts (assume FairWage for now)
                            discoveredContracts.push({
                                contractId: contractInfo.contractId,
                                tokenContractId: contractInfo.tokenContractId,
                                companyName: contractInfo.companyName || `Contract ${contractInfo.contractId.slice(0, 8)}...`,
                                tokenSymbol: contractInfo.tokenSymbol || 'TBU',
                                deploymentDate: tx.created_at,
                                transactionHash: tx.hash,
                                deployerAddress: walletAddress,
                                contractType: contractInfo.contractType || 'fairwage'
                            });
                        }
                    }
                }

            } catch (opError) {
                // Skip failed transaction analysis
                console.warn(`⚠️ Failed to analyze transaction ${tx.hash}:`, opError.message);
                continue;
            }
        }

        console.log(`✅ Discovered ${discoveredContracts.length} FairWage contracts`);

        res.json({
            success: true,
            contracts: discoveredContracts,
            totalFound: discoveredContracts.length,
            walletAddress: walletAddress
        });

    } catch (error) {
        console.error('❌ Contract discovery failed:', error);
        res.status(500).json({
            error: 'Failed to discover contracts',
            details: error.message,
            success: false
        });
    }
});

/**
 * Extract contract information from Stellar transaction
 * This is a simplified version - in production, you'd want more robust parsing
 */
async function extractContractInfoFromTransaction(transaction, operation) {
    try {
        // Check transaction memo for contract metadata (if any)
        const memo = transaction.memo;
        const memoText = transaction.memo_type === 'text' ? transaction.memo : null;
        
        // Try multiple methods to extract contract ID
        let contractId = extractContractIdFromResult(transaction);
        
        // If not found in result, try extracting from operation
        if (!contractId) {
            contractId = extractContractAddressFromOperation(operation);
        }
        
        // Additional method: Look for contract addresses in the transaction envelope
        if (!contractId && transaction.envelope_xdr) {
            contractId = extractContractFromEnvelope(transaction.envelope_xdr);
        }
        
        if (contractId) {
            // Determine contract type based on memo or operation patterns
            const contractType = determineContractType(memoText, operation, transaction);
            
            return {
                contractId: contractId,
                contractType: contractType,
                tokenContractId: extractTokenContractId(transaction, operation),
                companyName: memoText || extractCompanyNameFromTransaction(transaction),
                tokenSymbol: extractTokenSymbol(transaction, operation) || 'TBU'
            };
        }
        
        return null;
        
    } catch (error) {
        console.warn('⚠️ Failed to extract contract info:', error.message);
        return null;
    }
}

/**
 * Extract contract ID from transaction result
 * Parses the transaction result XDR to find contract deployment
 */
function extractContractIdFromResult(transaction) {
    try {
        if (!transaction.result_xdr) {
            return null;
        }

        // Parse the transaction result XDR
        const resultXdr = StellarSdk.xdr.TransactionResult.fromXDR(transaction.result_xdr, 'base64');
        
        if (!resultXdr.result().results()) {
            return null;
        }

        // Look through operation results for contract creation
        for (const opResult of resultXdr.result().results()) {
            if (opResult.value() && opResult.value().invokeHostFunctionResult) {
                const invokeResult = opResult.value().invokeHostFunctionResult();
                
                if (invokeResult.success && invokeResult.success().length > 0) {
                    // Extract contract address from the result
                    const contractAddress = invokeResult.success()[0].value();
                    if (contractAddress && contractAddress.address) {
                        return contractAddress.address().contractId().toString('hex');
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        console.warn('Failed to extract contract ID from result:', error.message);
        return null;
    }
}

/**
 * Alternative approach: Discovery by scanning known contract patterns
 * This method looks for common FairWage contract initialization patterns
 */
router.post('/scan-fairwage-contracts', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        
        if (!walletAddress) {
            return res.status(400).json({ 
                error: 'Wallet address is required',
                success: false 
            });
        }

        console.log(`🔍 Scanning for FairWage patterns from wallet: ${walletAddress}`);

        // This is a more targeted approach - scan for specific contract interactions
        // Look for transactions where the wallet interacted with FairWage-like contracts
        
        const accountTransactions = await server.transactions()
            .forAccount(walletAddress)
            .order('desc')
            .limit(100)
            .call();

        const potentialContracts = new Set();

        // Analyze transactions for contract interactions
        for (const tx of accountTransactions.records) {
            if (!tx.successful) continue;

            try {
                const operations = await server.operations()
                    .forTransaction(tx.hash)
                    .call();

                for (const op of operations.records) {
                    // Look for contract invocations
                    if (op.type === 'invoke_host_function') {
                        // Extract contract address from operation
                        // This would need proper XDR parsing in production
                        const contractAddress = extractContractAddressFromOperation(op);
                        if (contractAddress && contractAddress.startsWith('C')) {
                            potentialContracts.add({
                                contractId: contractAddress,
                                lastInteraction: tx.created_at,
                                transactionHash: tx.hash
                            });
                        }
                    }
                }
            } catch (opError) {
                continue;
            }
        }

        const contractList = Array.from(potentialContracts);
        
        console.log(`🔍 Found ${contractList.length} potential FairWage contracts`);

        res.json({
            success: true,
            contracts: contractList,
            totalFound: contractList.length,
            walletAddress: walletAddress,
            note: "These are potential contracts based on interaction patterns. Manual verification recommended."
        });

    } catch (error) {
        console.error('❌ Contract scan failed:', error);
        res.status(500).json({
            error: 'Failed to scan for contracts',
            details: error.message,
            success: false
        });
    }
});

/**
 * Helper function to extract contract address from operation
 */
function extractContractAddressFromOperation(operation) {
    try {
        // Check if operation has contract address in source_account or other fields
        if (operation.source_account && operation.source_account.startsWith('C')) {
            return operation.source_account;
        }
        
        // For invoke_host_function operations, look in the operation details
        if (operation.type === 'invoke_host_function') {
            // Check if there's a contract address in the operation parameters
            if (operation.parameters) {
                for (const param of operation.parameters) {
                    if (param.value && typeof param.value === 'string' && param.value.startsWith('C')) {
                        return param.value;
                    }
                }
            }
            
            // Try to extract from function name or other operation data
            if (operation.function_parameters_xdr) {
                try {
                    // This would require more complex XDR parsing
                    // For now, return a pattern-based extraction
                    const xdrData = operation.function_parameters_xdr;
                    // Look for contract-like addresses in the XDR data
                    const contractPattern = /C[A-Z0-9]{55}/g;
                    const match = xdrData.match(contractPattern);
                    if (match && match.length > 0) {
                        return match[0];
                    }
                } catch (xdrError) {
                    // Continue with other methods
                }
            }
        }
        
        return null;
    } catch (error) {
        console.warn('Failed to extract contract address from operation:', error.message);
        return null;
    }
}

/**
 * Helper functions for enhanced contract discovery
 */

/**
 * Extract contract address from transaction envelope XDR
 */
function extractContractFromEnvelope(envelopeXdr) {
    try {
        // Look for contract-like addresses in the envelope XDR string
        const contractPattern = /C[A-Z0-9]{55}/g;
        const matches = envelopeXdr.match(contractPattern);
        return matches && matches.length > 0 ? matches[0] : null;
    } catch (error) {
        return null;
    }
}

/**
 * Determine contract type based on transaction patterns
 */
function determineContractType(memoText, operation, transaction) {
    // Check memo for FairWage indicators
    if (memoText) {
        const lowerMemo = memoText.toLowerCase();
        if (lowerMemo.includes('fairwage') || lowerMemo.includes('wage') || lowerMemo.includes('payroll')) {
            return 'fairwage';
        }
    }
    
    // Check operation patterns
    if (operation.function === 'HostFunctionTypeCreateContract') {
        return 'fairwage'; // Assume new contract deployments are FairWage
    }
    
    // Default assumption for contract interactions
    return 'fairwage';
}

/**
 * Extract token contract ID from transaction
 */
function extractTokenContractId(transaction, operation) {
    try {
        // Look for multiple contract addresses in the transaction
        const contractPattern = /C[A-Z0-9]{55}/g;
        let matches = [];
        
        if (transaction.envelope_xdr) {
            const envelopeMatches = transaction.envelope_xdr.match(contractPattern);
            if (envelopeMatches) matches = matches.concat(envelopeMatches);
        }
        
        if (transaction.result_xdr) {
            const resultMatches = transaction.result_xdr.match(contractPattern);
            if (resultMatches) matches = matches.concat(resultMatches);
        }
        
        // If we found multiple contracts, the second one might be the token contract
        const uniqueMatches = [...new Set(matches)];
        return uniqueMatches.length > 1 ? uniqueMatches[1] : null;
        
    } catch (error) {
        return null;
    }
}

/**
 * Extract company name from transaction details
 */
function extractCompanyNameFromTransaction(transaction) {
    try {
        // Try to extract from memo
        if (transaction.memo_type === 'text' && transaction.memo) {
            // Look for company-like patterns in memo
            const memo = transaction.memo;
            if (memo.length > 3 && memo.length < 50) {
                return memo;
            }
        }
        
        // Could also check source account for known company mappings
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Extract token symbol from transaction
 */
function extractTokenSymbol(transaction, operation) {
    try {
        // Look for token symbol patterns in memo or operation data
        if (transaction.memo_type === 'text' && transaction.memo) {
            // Look for 3-4 character uppercase tokens
            const tokenPattern = /\b[A-Z]{3,4}\b/g;
            const matches = transaction.memo.match(tokenPattern);
            if (matches && matches.length > 0) {
                return matches[0];
            }
        }
        
        // Default token symbol
        return 'TBU';
    } catch (error) {
        return 'TBU';
    }
}

module.exports = router;