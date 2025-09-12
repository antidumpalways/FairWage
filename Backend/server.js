const express = require("express");
const cors = require("cors");
const StellarSdk = require("@stellar/stellar-sdk");
const { Keypair, TransactionBuilder, Networks, Asset, BASE_FEE } = StellarSdk;
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ================================
// Network / RPC / Horizon config
// ================================
const serverUrl = "https://soroban-testnet.stellar.org";
const networkPassphrase = Networks.TESTNET;
const server = new StellarSdk.rpc.Server(serverUrl);

const horizonUrl = "https://horizon-testnet.stellar.org";
const horizonServer = new StellarSdk.Horizon.Server(horizonUrl);

// Simulation fallback account (untuk simulateTransaction read-only)
const SIMULATION_ACCOUNT =
  "GBIFUPL4MOPI5XHPFKYO4SWTKKLSK63GZVMQ5A2FX3TLCS74NJ55QAZD";

console.log("🌐 Network Passphrase:", networkPassphrase);
console.log("🔗 RPC URL:", serverUrl);
console.log("🔗 Horizon URL:", horizonUrl);
console.log("👤 Simulation account (fallback):", SIMULATION_ACCOUNT);

// ================================
// WASM Hash (contoh)
// ================================
const TOKEN_WASM_HASH =
  "0e3264fc7e36890543b75d7ae0625607d1f22d8eceaf4f1a91429af194d05e63";
const FAIRWAGE_WASM_HASH =
  "bcadbb1b80a30c4d46e4b512d6586a028f45b77afe47557c46c49621fb485bc7";

// ================================
// Helpers
// ================================
async function getSimulationAccount(req) {
  const pubkey = req.body.userPublicKey || SIMULATION_ACCOUNT;
  return horizonServer.loadAccount(pubkey);
}

function sanitizeForJson(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(sanitizeForJson);
  if (value && typeof value === "object") {
    const entries =
      value instanceof Map
        ? Array.from(value.entries())
        : Object.entries(value);
    const out = {};
    for (const [k, v] of entries) out[k] = sanitizeForJson(v);
    return out;
  }
  return value;
}

// ================================
// Current contracts (TOKEN & FAIRWAGE)
// ================================
let currentFairWageContractId = null;
let currentTokenContractId = null;

function setCurrentContractId(contractId, type) {
  if (!contractId) return;
  if (type === "fairwage") {
    currentFairWageContractId = contractId;
    console.log("📌 FairWage contract set:", contractId);
  } else if (type === "token") {
    currentTokenContractId = contractId;
    console.log("📌 Token (SAC) contract set:", contractId);
  } else {
    console.log(
      "ℹ️ Unknown contract type. Not setting current contract automatically.",
    );
  }
}

function getFairWageContractId() {
  if (currentFairWageContractId) return currentFairWageContractId;
  if (process.env.FAIRWAGE_CONTRACT_ID) return process.env.FAIRWAGE_CONTRACT_ID;
  return null;
}

function getTokenContractId() {
  if (currentTokenContractId) return currentTokenContractId;
  if (process.env.TOKEN_CONTRACT_ID) return process.env.TOKEN_CONTRACT_ID;
  return null;
}

// ================================
// API: Set / Get current contracts
// ================================
app.post("/api/set-contract-id", (req, res) => {
  try {
    const { contractId, type } = req.body; // 'fairwage' | 'token'
    if (!contractId || !type) {
      return res
        .status(400)
        .json({ success: false, error: "Missing contractId or type" });
    }
    setCurrentContractId(contractId, type);
    res.json({
      success: true,
      contractId,
      type,
      message: "Contract ID set successfully",
    });
  } catch (error) {
    console.error("❌ Error setting contract ID:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/get-current-contract", (req, res) => {
  try {
    const fair = getFairWageContractId();
    const token = getTokenContractId();

    if (!fair) {
      return res.json({
        success: false,
        error: "No FairWage contract configured yet",
        contractId: null,
        fairWageContractId: null,
        tokenContractId: token || null,
      });
    }

    res.json({
      success: true,
      // kompatibilitas lama
      contractId: fair,
      fairWageContractId: fair,
      tokenContractId: token || null,
      message: "Current contracts retrieved",
    });
  } catch (error) {
    console.log("📋 No contract ID available:", error.message);
    res.json({
      success: false,
      error: error.message,
      message: "No contract ID available",
    });
  }
});

// ================================
// Misc endpoints
// ================================
app.get("/api/wasm-hash", (req, res) => {
  res.json({ success: true, wasmHash: TOKEN_WASM_HASH });
});

// ================================
// Deploy SAC Token (createStellarAssetContract)
// ================================
app.post("/api/prepare-token-deploy", async (req, res) => {
  try {
    const { userPublicKey, tokenName, tokenSymbol } = req.body;
    console.log(
      "🚀 Preparing REAL token deployment for:",
      userPublicKey,
      "Name:",
      tokenName,
      "Symbol:",
      tokenSymbol,
    );
    
    // Debug: Check available operations
    console.log('🔍 Available Stellar SDK operations:', typeof StellarSdk.Operation.createStellarAssetContract);

    if (!userPublicKey || !tokenName || !tokenSymbol) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: userPublicKey, tokenName, tokenSymbol",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);
    console.log("✅ User account loaded from Horizon");

    // SAC: asset code = tokenSymbol, issuer = userPublicKey
    const asset = new StellarSdk.Asset(tokenSymbol, userPublicKey);
    const deployOp = StellarSdk.Operation.createStellarAssetContract({ asset });

    const tx = new TransactionBuilder(sourceAccount, {
      fee: "1000000",
      networkPassphrase,
    })
      .addOperation(deployOp)
      .setTimeout(30)
      .build();

    let preparedTx;
    try {
      preparedTx = await server.prepareTransaction(tx);
    } catch (prepareError) {
      console.error("❌ Prepare failed:", prepareError);
      throw new Error(
        "Cannot submit unprepared Soroban transaction: " + prepareError.message,
      );
    }

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      wasmHash: TOKEN_WASM_HASH,
      tokenName,
      tokenSymbol,
      message: "SAC Token deployment ready",
    });
  } catch (error) {
    console.error("❌ REAL deployment preparation failed:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message,
        details: "Soroban deployment error",
      });
  }
});

// ================================
// Deploy FairWage (createCustomContract)
// ================================
app.post("/api/prepare-fairwage-deploy", async (req, res) => {
  try {
    const { userPublicKey, tokenContractId, companyName } = req.body;
    console.log(
      "🏢 Preparing FairWage DEPLOYMENT for:",
      userPublicKey,
      "Token:",
      tokenContractId,
      "Company:",
      companyName,
    );

    if (!userPublicKey || !tokenContractId || !companyName) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: userPublicKey, tokenContractId, companyName",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const salt = crypto.randomBytes(32);
    const deployOp = StellarSdk.Operation.createCustomContract({
      address: StellarSdk.Address.fromString(userPublicKey),
      wasmHash: Buffer.from(FAIRWAGE_WASM_HASH, "hex"),
      salt,
    });

    const tx = new TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(deployOp)
      .setTimeout(30)
      .build();

    let preparedTx;
    try {
      preparedTx = await server.prepareTransaction(tx);
    } catch (prepareError) {
      console.error("❌ FairWage deployment prepare failed:", prepareError);
      throw new Error(
        "Cannot submit unprepared Soroban transaction: " + prepareError.message,
      );
    }

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      wasmHash: FAIRWAGE_WASM_HASH,
      metadata: { companyName, tokenContractId },
      message: "FairWage deployment transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error preparing FairWage deployment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// Initialize FairWage (invoke initialize)
// ================================
app.post("/api/prepare-fairwage-initialize", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, tokenContractId, companyName } =
      req.body;

    if (
      !userPublicKey ||
      !fairWageContractId ||
      !tokenContractId ||
      !companyName
    ) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: userPublicKey, fairWageContractId, tokenContractId, companyName",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "initialize",
      args: [
        StellarSdk.Address.fromString(userPublicKey).toScVal(),
        StellarSdk.Address.fromString(tokenContractId).toScVal(),
      ],
    });

    const tx = new TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    let preparedTx;
    try {
      preparedTx = await server.prepareTransaction(tx);
    } catch (prepareError) {
      console.error("❌ FairWage prepare failed:", prepareError);
      throw new Error(
        "Cannot submit unprepared Soroban transaction: " + prepareError.message,
      );
    }

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      tokenContractId,
      metadata: { companyName, fairWageContractId, tokenContractId },
      message:
        "FairWage initialization transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error preparing FairWage initialization:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// Initialize (frontend helper)
// ================================
app.post("/api/initialize-contract", async (req, res) => {
  try {
    const {
      contractId,
      contractType,
      userPublicKey,
      tokenContractId,
      companyName,
    } = req.body;
    console.log("🔧 Initializing contract:", {
      contractId,
      contractType,
      userPublicKey,
      tokenContractId,
      companyName,
    });

    if (!contractId || !contractType || !userPublicKey) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: contractId, contractType, userPublicKey",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    if (contractType === "token") {
      // SAC tidak butuh init
      return res.json({
        success: true,
        message: "SAC Token is ready - no initialization needed",
        contractId,
        type: "SAC",
        ready: true,
      });
    }

    if (contractType !== "fairwage") {
      return res
        .status(400)
        .json({
          error: 'Invalid contract type. Must be "token" or "fairwage"',
        });
    }
    if (!tokenContractId) {
      return res
        .status(400)
        .json({
          error: "tokenContractId required for FairWage initialization",
        });
    }

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: contractId,
      function: "initialize",
      args: [
        StellarSdk.Address.fromString(userPublicKey).toScVal(),
        StellarSdk.Address.fromString(tokenContractId).toScVal(),
      ],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      contractId,
      contractType,
      message: "FairWage initialization ready",
    });
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
/** Submit signed transaction (Rabet signed XDR) */
// ================================
app.post("/api/submit-transaction", async (req, res) => {
  try {
    const { signedTransactionXdr, contractType } = req.body; // <- IMPORTANT: kirim 'fairwage' atau 'token' saat deploy
    console.log("📤 Submitting signed transaction...");

    if (!signedTransactionXdr) {
      return res.status(400).json({ error: "Missing signedTransactionXdr" });
    }

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      signedTransactionXdr,
      networkPassphrase,
    );

    if (transaction.signatures.length === 0) {
      return res
        .status(400)
        .json({
          error: "Transaction not signed! Please sign with your wallet first.",
        });
    }

    const sendResult = await server.sendTransaction(transaction);
    console.log("✅ Transaction submitted:", sendResult.hash);
    console.log(
      "🔗 Verify at: https://stellar.expert/explorer/testnet/tx/" +
        sendResult.hash,
    );

    // Poll confirmation
    let getResponse = await server.getTransaction(sendResult.hash);
    let attempts = 0;
    while (
      (getResponse.status === "NOT_FOUND" ||
        getResponse.status === "PENDING") &&
      attempts < 60
    ) {
      await new Promise((r) => setTimeout(r, 1000));
      getResponse = await server.getTransaction(sendResult.hash);
      attempts++;
      console.log(`⏳ Attempt ${attempts}/60 - Status: ${getResponse.status}`);
    }
    if (getResponse.status !== "SUCCESS") {
      throw new Error("Transaction not confirmed on blockchain");
    }

    // Extract contractId (kalau ada return address)
    let contractId = null;
    const finalResult = await server.getTransaction(sendResult.hash);

    if (finalResult.status === "SUCCESS") {
      try {
        if (finalResult.returnValue) {
          // coba parse Address dari returnValue
          const addr = StellarSdk.Address.fromScVal(finalResult.returnValue);
          if (addr) {
            contractId = addr.toString();
            console.log("✅ Contract ID from returnValue:", contractId);
          }
        }
        // fallback: parse meta
        if (!contractId && finalResult.resultMetaXdr) {
          const meta = StellarSdk.xdr.TransactionMeta.fromXDR(
            finalResult.resultMetaXdr,
            "base64",
          );
          if (meta.v3 && meta.v3() && meta.v3().sorobanMeta()) {
            const rv = meta.v3().sorobanMeta().returnValue();
            if (rv) {
              const addr2 = StellarSdk.Address.fromScVal(rv);
              contractId = addr2.toString();
              console.log("✅ Contract ID from meta:", contractId);
            }
          }
        }
      } catch (e) {
        console.log("ℹ️ No contractId could be extracted from tx result.");
      }
    }

    // Auto-set current contract by type (if provided)
    if (
      contractId &&
      (contractType === "fairwage" || contractType === "token")
    ) {
      setCurrentContractId(contractId, contractType);
    }

    res.json({
      success: true,
      transactionHash: sendResult.hash,
      contractId,
      feeCharged: sendResult.fee_charged,
      verifyUrl: `https://stellar.expert/explorer/testnet/tx/${sendResult.hash}`,
      result: sendResult,
    });
  } catch (error) {
    console.error("❌ Error submitting transaction:", error);
    if (error.response && error.response.data) {
      return res.status(400).json({
        success: false,
        error: error.response.data.title || error.message,
        details: error.response.data.detail,
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// Contract info (debug)
// ================================
app.get("/api/contract-info", async (req, res) => {
  try {
    const { contractId } = req.query;
    if (!contractId)
      return res.status(400).json({ error: "Missing contractId parameter" });

    console.log("🔍 Getting contract info for:", contractId);

    let contractInfo = null;
    try {
      // Not all RPCs support getContractData; fallback below if fails
      contractInfo = await server.getContractData(contractId);
      console.log("✅ Contract data retrieved via getContractData");
    } catch (error1) {
      console.log("❌ getContractData failed:", error1.message);
      try {
        const contractAddress = StellarSdk.Address.fromString(contractId);
        const contractDataKey = StellarSdk.xdr.LedgerKey.contractData(
          new StellarSdk.xdr.LedgerKeyContractData({
            contract: contractAddress.toScAddress(),
            key: StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance(),
            durability: StellarSdk.xdr.ContractDataDurability.persistent(),
          }),
        );
        const ledgerEntries = await server.getLedgerEntries(contractDataKey);
        contractInfo = ledgerEntries;
        console.log("✅ Contract data retrieved via getLedgerEntries");
      } catch (error2) {
        console.log("❌ getLedgerEntries failed:", error2.message);
        throw new Error(
          `Both methods failed: getContractData (${error1.message}), getLedgerEntries (${error2.message})`,
        );
      }
    }

    let parsed = {
      contractId,
      latestLedger: contractInfo.latestLedger,
      entries: [],
    };
    if (contractInfo.entries && contractInfo.entries.length > 0) {
      contractInfo.entries.forEach((entry, idx) => {
        try {
          parsed.entries.push({
            lastModifiedLedgerSeq: entry.lastModifiedLedgerSeq,
            liveUntilLedgerSeq: entry.liveUntilLedgerSeq,
            key: entry.key ? entry.key.toString() : "N/A",
            val: entry.val ? entry.val.toString() : "N/A",
          });
        } catch (e) {
          parsed.entries.push({
            lastModifiedLedgerSeq: entry.lastModifiedLedgerSeq,
            liveUntilLedgerSeq: entry.liveUntilLedgerSeq,
            key: "Parse Error",
            val: "Parse Error",
          });
        }
      });
    }

    res.json({
      success: true,
      contractId,
      contractInfo: parsed,
      message: "Contract info retrieved and parsed successfully",
    });
  } catch (error) {
    console.error("❌ Error getting contract info:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// EMPLOYEE MANAGEMENT
// ================================
app.post("/api/add-employee", async (req, res) => {
  try {
    const {
      userPublicKey,
      fairWageContractId,
      employeeAddress,
      employeeName,
      wageRate,
      wagePeriod,
    } = req.body;

    console.log("👤 Adding employee:", {
      userPublicKey,
      fairWageContractId,
      employeeAddress,
      employeeName,
      wageRate,
      wagePeriod,
    });

    if (
      !userPublicKey ||
      !fairWageContractId ||
      !employeeAddress ||
      !employeeName ||
      !wageRate
    ) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress, employeeName, wageRate",
        });
    }

    // wagePeriod normalization (0=Hour, 1=Day, 2=Week, 3=Month). Default = Day(1)
    let wagePeriodInt = 1;
    const parsed = parseInt(wagePeriod);
    if (!Number.isNaN(parsed)) wagePeriodInt = parsed;
    if (wagePeriodInt < 0 || wagePeriodInt > 3) wagePeriodInt = 1;

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "add_employee",
      args: [
        StellarSdk.Address.fromString(employeeAddress).toScVal(),
        StellarSdk.xdr.ScVal.scvI128(
          new StellarSdk.xdr.Int128Parts({
            lo: StellarSdk.xdr.Uint64.fromString(String(wageRate)),
            hi: StellarSdk.xdr.Int64.fromString("0"),
          }),
        ),
        StellarSdk.xdr.ScVal.scvU32(wagePeriodInt),
      ],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      employeeAddress,
      message: "Add employee transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error adding employee:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/set-salary", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress, wageRate } =
      req.body;

    if (
      !userPublicKey ||
      !fairWageContractId ||
      !employeeAddress ||
      !wageRate
    ) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress, wageRate",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "set_salary",
      args: [
        StellarSdk.Address.fromString(employeeAddress).toScVal(),
        StellarSdk.xdr.ScVal.scvI128(
          new StellarSdk.xdr.Int128Parts({
            lo: StellarSdk.xdr.Uint64.fromString(String(wageRate)),
            hi: StellarSdk.xdr.Int64.fromString("0"),
          }),
        ),
      ],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      employeeAddress,
      message: "Set salary transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error setting salary:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/update-wage-rate", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress, newWageRate } =
      req.body;

    if (
      !userPublicKey ||
      !fairWageContractId ||
      !employeeAddress ||
      !newWageRate
    ) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress, newWageRate",
        });
    }
    if (newWageRate <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Wage rate must be greater than 0" });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "update_wage_rate",
      args: [
        StellarSdk.Address.fromString(employeeAddress).toScVal(),
        StellarSdk.xdr.ScVal.scvI128(
          new StellarSdk.xdr.Int128Parts({
            lo: StellarSdk.xdr.Uint64.fromString(String(newWageRate)),
            hi: StellarSdk.xdr.Int64.fromString("0"),
          }),
        ),
      ],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      employeeAddress,
      newWageRate,
      message: "Update wage rate transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error updating wage rate:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/pay-employee", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress } =
      req.body;

    if (!userPublicKey || !fairWageContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "payday_sweep",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      employeeAddress,
      message: "Employee withdrawal transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error paying employee:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/remove-employee", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress } = req.body;

    if (!userPublicKey || !fairWageContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "remove_employee",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      employeeAddress,
      message: "Remove employee transaction prepared - ready for signing",
    });
  } catch (error) {
    // mapping error message contoh
    let errorMessage = error.message;
    if (error.message.includes("Error(Contract, #10)")) {
      errorMessage =
        "Cannot remove employee: Employee has unpaid wages. Please pay all outstanding wages first.";
    } else if (error.message.includes("Error(Contract, #4)")) {
      errorMessage = "Employee not found in the contract.";
    }
    console.error("❌ Error removing employee:", errorMessage);
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.post("/api/pay-all-wages", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress } = req.body;

    if (!userPublicKey || !fairWageContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "payday_sweep",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      employeeAddress,
      message: "Pay all wages transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error paying all wages:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/fund-contract", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, tokenContractId, amount } =
      req.body;

    if (!userPublicKey || !fairWageContractId || !tokenContractId || !amount) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, tokenContractId, amount",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    // convert to raw units (1e7)
    const amountRaw = Math.floor(amount * 10000000);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: tokenContractId,
      function: "transfer",
      args: [
        StellarSdk.Address.fromString(userPublicKey).toScVal(),
        StellarSdk.Address.fromString(fairWageContractId).toScVal(),
        StellarSdk.xdr.ScVal.scvI128(
          new StellarSdk.xdr.Int128Parts({
            lo: StellarSdk.xdr.Uint64.fromString(String(amountRaw)),
            hi: StellarSdk.xdr.Int64.fromString("0"),
          }),
        ),
      ],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      tokenContractId,
      amount,
      message: "Fund contract transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error funding contract:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/fix-employee-timestamp", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress } = req.body;

    if (!userPublicKey || !fairWageContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "fix_employee_timestamp",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      employeeAddress,
      message:
        "Fix employee timestamp transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error fixing employee timestamp:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/check-contract-balance", async (req, res) => {
  try {
    const { fairWageContractId, tokenContractId } = req.body;

    if (!fairWageContractId || !tokenContractId) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Missing required parameters: fairWageContractId, tokenContractId",
        });
    }

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: tokenContractId,
      function: "balance",
      args: [StellarSdk.Address.fromString(fairWageContractId).toScVal()],
    });

    const sourceAccount = await getSimulationAccount(req);
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    if (simulation.error)
      throw new Error(`Simulation failed: ${simulation.error.message}`);

    let balance = 0;
    if (simulation.result && simulation.result.retval) {
      try {
        const bi = StellarSdk.scValToNative(simulation.result.retval);
        balance = parseInt(bi.toString());
      } catch (e) {
        console.error("❌ Error parsing ScVal:", e);
      }
    }

    res.json({
      success: true,
      balance,
      fairWageContractId,
      tokenContractId,
      message: "Contract balance retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error checking contract balance:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/create-trustline", async (req, res) => {
  try {
    const { userPublicKey, tokenContractId, employeeAddress } = req.body;

    if (!userPublicKey || !tokenContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Missing required parameters: userPublicKey, tokenContractId, employeeAddress",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.changeTrust({
      asset: StellarSdk.Asset.fromContract(tokenContractId),
      limit: "922337203685.4775807",
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      tokenContractId,
      employeeAddress,
      message: "Create trustline transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error creating trustline:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/pay-partial-employer", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress, amount } =
      req.body;

    if (!userPublicKey || !fairWageContractId || !employeeAddress || !amount) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress, amount",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "pay_partial_by_employer",
      args: [
        StellarSdk.Address.fromString(employeeAddress).toScVal(),
        StellarSdk.xdr.ScVal.scvI128(
          new StellarSdk.xdr.Int128Parts({
            lo: StellarSdk.xdr.Uint64.fromString(String(amount)),
            hi: StellarSdk.xdr.Int64.fromString("0"),
          }),
        ),
      ],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      message: "Pay partial by employer transaction prepared successfully",
    });
  } catch (error) {
    console.error("❌ Error paying partial by employer:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to pay partial by employer",
        details: error.message,
      });
  }
});

app.post("/api/payday-sweep-many", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddresses } = req.body;

    if (
      !userPublicKey ||
      !fairWageContractId ||
      !employeeAddresses ||
      !Array.isArray(employeeAddresses)
    ) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddresses (array)",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const addressArray = employeeAddresses.map((addr) =>
      StellarSdk.Address.fromString(addr).toScVal(),
    );

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "payday_sweep_many",
      args: [StellarSdk.xdr.ScVal.scvVec(addressArray)],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      message: "Payday sweep many transaction prepared successfully",
    });
  } catch (error) {
    console.error("❌ Error paying all employees:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to pay all employees",
        details: error.message,
      });
  }
});

// ================================
// READ-ONLY helpers for employee dashboard
// ================================
app.post("/api/accrued-balance", async (req, res) => {
  try {
    const { employeeAddress, contractId } = req.body;

    if (!employeeAddress)
      return res
        .status(400)
        .json({ error: "Missing required parameters: employeeAddress" });

    const useContractId = contractId || getFairWageContractId();
    if (!useContractId)
      return res
        .status(400)
        .json({ error: "FairWage contract not configured" });

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: useContractId,
      function: "get_accrued_balance",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const sourceAccount = await getSimulationAccount(req);
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    if (simulation.error)
      throw new Error(`Simulation failed: ${simulation.error.message}`);

    let balance = 0;
    if (simulation.result && simulation.result.retval) {
      try {
        const bi = StellarSdk.scValToNative(simulation.result.retval);
        balance = parseInt(bi.toString());
      } catch (e) {
        console.error("Error parsing balance:", e);
      }
    }

    res.json({
      success: true,
      balance,
      message: "Accrued balance retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error getting accrued balance:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to get accrued balance",
        details: error.message,
      });
  }
});

app.post("/api/get-accrued-balance", async (req, res) => {
  try {
    const { fairWageContractId, employeeAddress } = req.body;

    if (!fairWageContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: fairWageContractId, employeeAddress",
        });
    }

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "get_accrued_balance",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const sourceAccount = await getSimulationAccount(req);
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    if (simulation.error)
      throw new Error(`Simulation failed: ${simulation.error.message}`);

    let balance = 0;
    if (simulation.result && simulation.result.retval) {
      try {
        const bi = StellarSdk.scValToNative(simulation.result.retval);
        balance = parseInt(bi.toString());
      } catch (e) {
        console.error("Error parsing balance:", e);
      }
    }

    res.json({
      success: true,
      balance,
      message: "Accrued balance retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error getting accrued balance (original):", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to get accrued balance",
        details: error.message,
      });
  }
});

app.post("/api/get-employee-info", async (req, res) => {
  try {
    const { fairWageContractId, employeeAddress } = req.body;

    if (!fairWageContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: fairWageContractId, employeeAddress",
        });
    }

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "get_employee_info",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const sourceAccount = await getSimulationAccount(req);
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    if (simulation.error)
      throw new Error(`Simulation failed: ${simulation.error.message}`);

    let employeeInfo = null;

    if (simulation.result && simulation.result.retval) {
      try {
        const native = StellarSdk.scValToNative(simulation.result.retval);
        employeeInfo = {
          wage_rate: Number(native.wage_rate || 0),
          accrued_balance:
            native.accrued_balance?.toString?.() ??
            String(native.accrued_balance || "0"),
          last_accrual_timestamp: Number(
            (native.last_accrual_timestamp?.toString?.() ??
              native.last_accrual_timestamp) ||
              0,
          ),
          wage_period: Number(native.wage_period || 0),
          active: Boolean(native.active),
        };
      } catch (e) {
        console.error("Error parsing employee info:", e);
        throw new Error("Failed to parse employee info");
      }
    }

    res.json({
      success: true,
      employeeInfo,
      message: "Employee info retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error getting employee info:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to get employee info",
        details: error.message,
      });
  }
});

app.post("/api/get-contract-balance", async (req, res) => {
  try {
    const { fairWageContractId } = req.body;

    if (!fairWageContractId)
      return res
        .status(400)
        .json({ error: "Missing required parameters: fairWageContractId" });

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "get_contract_balance",
      args: [],
    });

    const sourceAccount = await getSimulationAccount(req);
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    if (simulation.error)
      throw new Error(`Simulation failed: ${simulation.error.message}`);

    let balance = null;
    if (simulation.result && simulation.result.retval) {
      try {
        const rawBalance = StellarSdk.scValToNative(simulation.result.retval);
        balance = rawBalance?.toString?.() ?? String(rawBalance || "0");
      } catch (e) {
        console.error("Error parsing contract balance:", e);
        throw new Error("Failed to parse contract balance");
      }
    }

    res.json({
      success: true,
      balance,
      message: "Contract balance retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error getting contract balance:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to get contract balance",
        details: error.message,
      });
  }
});

app.post("/api/list-employees", async (req, res) => {
  try {
    const { fairWageContractId } = req.body;

    if (!fairWageContractId)
      return res
        .status(400)
        .json({ error: "Missing required parameters: fairWageContractId" });

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "list_employees",
      args: [],
    });

    const sourceAccount = await getSimulationAccount(req);
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    if (simulation.error)
      throw new Error(`Simulation failed: ${simulation.error.message}`);

    let employees = [];
    if (simulation.result && simulation.result.retval) {
      try {
        const addresses = StellarSdk.scValToNative(simulation.result.retval);
        employees = (addresses || []).map((addr) => {
          if (typeof addr === "string") return addr;
          if (addr && typeof addr.toString === "function")
            return addr.toString();
          try {
            return StellarSdk.Address.fromScVal(addr).toString();
          } catch {
            return String(addr);
          }
        });
      } catch (e) {
        console.error("Error parsing employees:", e);
        employees = [];
      }
    }

    res.json({
      success: true,
      employees,
      message: "Employees listed successfully",
    });
  } catch (error) {
    console.error("❌ Error listing employees:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to list employees",
        details: error.message,
      });
  }
});

app.post("/api/freeze-employee", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress } = req.body;

    if (!userPublicKey || !fairWageContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "freeze_employee",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      message: "Freeze employee transaction prepared successfully",
    });
  } catch (error) {
    console.error("❌ Error preparing freeze employee transaction:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to prepare freeze employee transaction",
        details: error.message,
      });
  }
});

app.post("/api/activate-employee", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, employeeAddress } = req.body;

    if (!userPublicKey || !fairWageContractId || !employeeAddress) {
      return res
        .status(400)
        .json({
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, employeeAddress",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "activate_employee",
      args: [StellarSdk.Address.fromString(employeeAddress).toScVal()],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      message: "Activate employee transaction prepared successfully",
    });
  } catch (error) {
    console.error("❌ Error preparing activate employee transaction:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to prepare activate employee transaction",
        details: error.message,
      });
  }
});

// Employee withdraw (employee memicu payday_sweep utk dirinya)
app.post("/api/employee-withdraw", async (req, res) => {
  try {
    const { userPublicKey, fairWageContractId, amount } = req.body;

    if (!userPublicKey || !fairWageContractId || amount === undefined) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Missing required parameters: userPublicKey, fairWageContractId, amount",
        });
    }

    const sourceAccount = await horizonServer.loadAccount(userPublicKey);

    const op = StellarSdk.Operation.invokeContractFunction({
      contract: fairWageContractId,
      function: "payday_sweep",
      args: [StellarSdk.Address.fromString(userPublicKey).toScVal()],
    });

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);

    res.json({
      success: true,
      transactionXdr: preparedTx.toXDR(),
      fairWageContractId,
      employeeAddress: userPublicKey,
      message: "Withdraw transaction prepared - ready for signing",
    });
  } catch (error) {
    console.error("❌ Error preparing employee withdrawal:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================
// Health
// ================================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    tokenWasmHash: TOKEN_WASM_HASH,
    fairWageWasmHash: FAIRWAGE_WASM_HASH,
  });
});

// ================================
// Start server
// ================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 FairWage Backend API Server running on 0.0.0.0:${PORT}`);
  console.log(`📦 Token WASM Hash: ${TOKEN_WASM_HASH}`);
  console.log(`📦 FairWage WASM Hash: ${FAIRWAGE_WASM_HASH}`);
  console.log(`🌐 Network: ${networkPassphrase}`);
  console.log(`🔗 RPC URL: ${serverUrl}`);
});

module.exports = app;
