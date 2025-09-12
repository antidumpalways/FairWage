// File: frontend/lib/soroban.ts
// Rabet-based Soroban helpers (TESTNET) untuk Employer & Employee Dashboard
// - Tanpa ENV (semua fetch -> api('...') dengan base http://localhost:3001)
// - Auto-detect contract saat employee connect wallet
// - Konsisten pakai Stellar Official SDK

// ==============================
// Rabet Types
// ==============================
declare global {
  interface Window {
    rabet?: {
      connect(): Promise<{ publicKey: string; error?: string }>;
      sign(xdr: string, network: string): Promise<{ xdr: string; error?: string }>;
      disconnect(): Promise<void>;
      isUnlocked(): Promise<boolean>;
      close(): Promise<void>;
      on(event: string, handler: Function): void;
    };
  }
}

// ==============================
// Single import (Official SDK)
// ==============================
import * as StellarSdk from "@stellar/stellar-sdk";

// ==============================
// Config (TESTNET)
// ==============================
const serverUrl = "https://soroban-testnet.stellar.org";
const networkPassphrase = StellarSdk.Networks.TESTNET;
const networkType: "TESTNET" | "PUBLIC" = "TESTNET";
const horizonUrl = "https://horizon-testnet.stellar.org";

// ==============================
// Backend base (tanpa ENV)
// ==============================
const BACKEND = "http://localhost:3001";
const api = (path: string) => `${BACKEND}${path}`;

// ==============================
// Server init (safe)
// ==============================
let server: any = null;
let horizon: StellarSdk.Horizon.Server | null = null;

const initializeServers = () => {
  try {
    if (!server) {
      console.log("🔧 Initializing Soroban Server...");
      server = new (StellarSdk as any).SorobanRpc.Server(serverUrl);
      console.log("✅ Soroban Server initialized");
    }
    if (!horizon && typeof window !== "undefined") {
      console.log("🔧 Initializing Horizon Server...");
      horizon = new StellarSdk.Horizon.Server(horizonUrl);
      console.log("✅ Horizon Server initialized");
    }
  } catch (error) {
    console.error("❌ Server initialization error:", error);
  }
};
if (typeof window !== "undefined") initializeServers();

console.log("✅ Stellar SDK loaded (TESTNET)");

// ==============================
// Wallet
// ==============================
export const connectWallet = async (): Promise<string> => {
  if (typeof window === "undefined") throw new Error("Rabet not available");
  if (!window.rabet) throw new Error("Rabet wallet is not installed!");
  const res = await window.rabet.connect();
  if (res.error) throw new Error(res.error);
  console.log("🎉 Rabet connected:", res.publicKey);
  return res.publicKey;
};

// ==============================
// Helpers: Contracts
// ==============================
type CurrentContracts = {
  success: boolean;
  contractId?: string | null;
  fairWageContractId?: string | null;
  tokenContractId?: string | null;
};

export const getBothContractIds = async (): Promise<{
  fairWageContractId: string | null;
  tokenContractId: string | null;
}> => {
  try {
    const r = await fetch(api("/api/get-current-contract"));
    const j: CurrentContracts = await r.json();
    if (j.success) {
      return {
        fairWageContractId: j.fairWageContractId || j.contractId || null,
        tokenContractId: j.tokenContractId || null,
      };
    }
    return { fairWageContractId: null, tokenContractId: j.tokenContractId || null };
  } catch (e) {
    console.warn("getBothContractIds error:", e);
    return { fairWageContractId: null, tokenContractId: null };
  }
};

// Sumber kebenaran = backend get-current-contract
const getContractId = async (): Promise<string> => {
  const { fairWageContractId } = await getBothContractIds();
  if (fairWageContractId) return fairWageContractId;
  throw new Error("No contract ID found! Please deploy & initialize first.");
};

export const setContractId = (contractId: string): void => {
  if (typeof window !== "undefined") localStorage.setItem("fairWageContractId", contractId);
};

export const getStoredContractIds = (): { tokenContractId?: string; fairWageContractId?: string } => {
  if (typeof window === "undefined") return {};
  return {
    tokenContractId: localStorage.getItem("tokenContractId") || undefined,
    fairWageContractId: localStorage.getItem("fairWageContractId") || undefined,
  };
};

export const getCurrentContractId = async (): Promise<string> => {
  return await getContractId();
};

// ==============================
// Employee context (auto-detect)
// ==============================
export const ensureEmployeeContext = async () => {
  const employeeAddress = await connectWallet();
  const { fairWageContractId, tokenContractId } = await getBothContractIds();
  if (!fairWageContractId) {
    return {
      ok: false,
      reason: "NO_CONTRACT",
      message: "FairWage contract is not configured yet.",
      employeeAddress,
      fairWageContractId: null,
      tokenContractId: tokenContractId || null,
      isRegistered: false,
    };
  }

  // Cek apakah wallet adalah employee di kontrak
  const list = await listEmployees(fairWageContractId).catch(() => []);
  const isRegistered = list.includes(employeeAddress);

  let employeeInfo: any = null;
  let accruedBalance: bigint = BigInt(0);

  if (isRegistered) {
    try {
      employeeInfo = await getEmployeeInfo(fairWageContractId, employeeAddress);
    } catch {}
    try {
      const b = await fetchAccruedBalance(employeeAddress);
      accruedBalance = BigInt(b);
    } catch {}
  }

  return {
    ok: true,
    employeeAddress,
    fairWageContractId,
    tokenContractId: tokenContractId || null,
    isRegistered,
    employeeInfo,
    accruedBalance,
  };
};

// ==============================
// Health
// ==============================
export const healthCheck = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    if (!server) initializeServers();
    if (server) {
      const latestLedger = await server.getLatestLedger();
      console.log("✅ Soroban healthy, ledger:", latestLedger.sequence);
    }
    const r = await fetch(api("/health"));
    if (r.ok) {
      const j = await r.json();
      console.log("✅ Backend health:", j);
      return { success: true, message: "Backend is healthy" };
    }
    return { success: false, message: `Backend returned ${r.status}` };
  } catch (e: any) {
    return { success: false, message: e?.message || "Unknown error" };
  }
};

// ==============================
// Keypair (via Rabet)
// ==============================
export const generateKeypairFromRabet = async () => {
  const publicKey = await connectWallet();
  return { publicKey, useRabetSigning: true };
};

// ==============================
// Deploy / Initialize
// ==============================
export const deployTokenContract = async (tokenName: string, tokenSymbol: string): Promise<string> => {
  const publicKey = await connectWallet();
  const r = await fetch(api("/api/prepare-token-deploy"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, tokenName, tokenSymbol }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "prepare-token-deploy failed");
  const j = await r.json();

  if (!window.rabet) throw new Error("Rabet wallet not available");
  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (sign.error) throw new Error(sign.error);

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr, contractType: "token" }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  const contractId = s.contractId;
  if (!contractId) throw new Error("No token contractId returned");
  if (typeof window !== "undefined") localStorage.setItem("tokenContractId", contractId);
  return contractId;
};

export const deployFairWageContract = async (tokenContractId: string): Promise<string> => {
  const publicKey = await connectWallet();
  const r = await fetch(api("/api/prepare-fairwage-deploy"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, tokenContractId, companyName: "FairWage Company" }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "prepare-fairwage-deploy failed");
  const j = await r.json();

  if (!window.rabet) throw new Error("Rabet wallet not available");
  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (sign.error) throw new Error(sign.error);

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr, contractType: "fairwage" }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  const contractId = s.contractId;
  if (!contractId) throw new Error("No fairwage contractId returned");
  if (typeof window !== "undefined") localStorage.setItem("fairWageContractId", contractId);
  return contractId;
};

export const initializeContract = async (
  contractId: string,
  contractType: "token" | "fairwage",
  companyName: string,
  tokenName?: string,
  tokenSymbol?: string,
  tokenContractId?: string
): Promise<string> => {
  const publicKey = await connectWallet();
  const r = await fetch(api("/api/initialize-contract"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractId, contractType, userPublicKey: publicKey, tokenContractId, companyName, tokenName, tokenSymbol }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "initialize-contract failed");
  const j = await r.json();

  if (contractType === "token") return contractId; // SAC no init needed

  if (!window.rabet) throw new Error("Rabet wallet not available");
  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (sign.error) throw new Error(sign.error);

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr, contractType }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  return contractId;
};

// Simple alias (compat)
export const initializeContractSimple = async (fairWageContractId: string, tokenContractId: string) =>
  initializeContract(fairWageContractId, "fairwage", "FairWage Company", undefined, undefined, tokenContractId);

// ==============================
// Read-only helpers
// ==============================
export const getContractInfo = async (): Promise<any> => {
  const contractId = await getContractId();
  const r = await fetch(api(`/api/contract-info?contractId=${contractId}`));
  if (!r.ok) throw new Error(`Failed to get contract info: ${r.status}`);
  return r.json();
};

export const fetchAccruedBalance = async (employeeAddress: string): Promise<bigint> => {
  const r = await fetch(api("/api/accrued-balance"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeAddress, contractId: await getContractId() }),
  });
  if (!r.ok) throw new Error(`Failed to fetch balance: ${r.status}`);
  const j = await r.json();
  return BigInt(j.balance || 0);
};

export async function getAccruedBalance(fairWageContractId: string, employeeAddress: string): Promise<number> {
  const r = await fetch(api("/api/get-accrued-balance"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fairWageContractId, employeeAddress }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "get-accrued-balance failed");
  const j = await r.json();
  return j.balance || 0;
}

export async function listEmployees(fairWageContractId: string): Promise<string[]> {
  const r = await fetch(api("/api/list-employees"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fairWageContractId }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "list-employees failed");
  const j = await r.json();
  return j.employees || [];
}

export async function getEmployeeInfo(fairWageContractId: string, employeeAddress: string): Promise<any> {
  const r = await fetch(api("/api/get-employee-info"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fairWageContractId, employeeAddress }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "get-employee-info failed");
  const j = await r.json();
  return j.employeeInfo || {};
}

// ==============================
// Employee actions
// ==============================
export const withdrawEmployeeFunds = async (): Promise<void> => {
  const fairWageContractId = await getContractId();
  const publicKey = await connectWallet();

  const r = await fetch(api("/api/employee-withdraw"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, amount: 0 }),
  });
  if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "Failed to prepare withdrawal");

  if (!window.rabet) throw new Error("Rabet not available");
  const signed = await window.rabet.sign(j.transactionXdr, networkPassphrase);
  if (signed.error) throw new Error(signed.error);

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: signed.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || `Submit failed ${submit.status}`);
  const s = await submit.json();
  if (!s.success) throw new Error(s.error || "Withdrawal submission failed");
  console.log("🎉 Withdrawal tx:", s.transactionHash);
};

// ==============================
// Employer actions
// ==============================
export async function addEmployee(
  fairWageContractId: string,
  employeeAddress: string,
  name: string,
  wageRate: number,
  wagePeriod: string
): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();
  const periodMap: Record<string, number> = { hour: 0, day: 1, week: 2, month: 3 };
  const wagePeriodInt = periodMap[wagePeriod] ?? 1;
  const wageRateRaw = Math.floor(wageRate * 1_0000_000); // 1e6 or 1e7? gunakan sama seperti backend (1e7)
  const wageRateRaw_1e7 = Math.floor(wageRate * 10_000_000);

  const r = await fetch(api("/api/add-employee")), // backend expect raw int (I128 parts)
    body = {
      userPublicKey: publicKey,
      fairWageContractId,
      employeeAddress,
      employeeName: name,
      wageRate: wageRateRaw_1e7,
      wagePeriod: wagePeriodInt,
    };

  // fix POST body: TS trick for editor highlighting
  await 0;

  const rr = await fetch(api("/api/add-employee"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!rr.ok) throw new Error((await rr.json()).error || "add-employee failed");
  const j = await rr.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Transaction signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

export async function removeEmployee(fairWageContractId: string, employeeAddress: string): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/remove-employee"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddress }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "remove-employee failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

export async function updateWageRate(fairWageContractId: string, employeeAddress: string, newWageRate: number): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/update-wage-rate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddress, newWageRate }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "update-wage-rate failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const send = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!send.ok) throw new Error((await send.json()).error || "submit failed");
  const s = await send.json();
  return s.transactionHash;
}

export async function payEmployee(fairWageContractId: string, employeeAddress: string, amount: number): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/pay-employee"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddress, amount }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "pay-employee failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

export async function payAllWages(fairWageContractId: string, employeeAddress: string): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/pay-all-wages"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddress }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "pay-all-wages failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

export async function payAllEmployeesBatch(fairWageContractId: string, employeeAddresses: string[]): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/payday-sweep-many"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddresses }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "payday-sweep-many failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

export async function fundContract(fairWageContractId: string, tokenContractId: string, amount: number): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/fund-contract"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, tokenContractId, amount }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "fund-contract failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

// ==============================
// Trustline (classic-asset compat)
// ==============================
export async function checkTrustlineExists(accountAddress: string): Promise<boolean> {
  try {
    const { assetCode, issuer } = getClassicAssetFromStorage();
    if (!horizon) initializeServers();
    if (!horizon) throw new Error("Horizon not initialized");
    const account = await horizon.accounts().accountId(accountAddress).call();
    const trustline = account.balances.find((b: any) => b.asset_code === assetCode && b.asset_issuer === issuer);
    return !!trustline;
  } catch (e) {
    console.error("checkTrustlineExists error:", e);
    return false;
  }
}

export async function createTrustlineForEmployee(tokenContractId: string, tokenSymbol: string): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  if (!horizon) initializeServers();
  if (!horizon) throw new Error("Horizon not initialized");
  const { publicKey } = await window.rabet.connect();
  const source = await horizon.loadAccount(publicKey);

  const op = StellarSdk.Operation.changeTrust({
    asset: new StellarSdk.Asset(tokenSymbol, tokenContractId),
    limit: "922337203685.4775807",
  });

  const tx = new StellarSdk.TransactionBuilder(source, { fee: "100000", networkPassphrase })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sign = await window.rabet.sign(tx.toXDR(), StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const result = await horizon.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(sign.xdr, networkPassphrase));
  return result.hash;
}

export async function ensureTrustlineExists(employeeAddress: string, tokenContractId: string, tokenSymbol: string): Promise<void> {
  const has = await checkTrustlineExists(employeeAddress);
  if (!has) {
    throw new Error(
      `Employee ${employeeAddress} needs to create trustline for token ${tokenSymbol}. Connect wallet & create trustline first.`
    );
  }
}

export async function createTrustlineForCurrentUser(): Promise<string> {
  const { assetCode, issuer } = getClassicAssetFromStorage();
  return createTrustlineForEmployee(issuer, assetCode);
}

export function getClassicAssetFromStorage() {
  if (typeof window === "undefined") throw new Error("No window");
  const issuer = localStorage.getItem("employerPublicKey");
  if (!issuer) throw new Error("Missing employerPublicKey in localStorage. Please connect employer wallet first.");
  const assetCode = localStorage.getItem("tokenSymbol") || "FAIRWAGE";
  return { assetCode, issuer };
}

// ==============================
// Misc read ops
// ==============================
export const getNetworkHealth = async () => {
  try {
    if (!server) initializeServers();
    if (!server) throw new Error("Server not initialized");
    const latestLedger = await server.getLatestLedger();
    return { healthy: true, latestLedger: latestLedger.sequence, timestamp: new Date().toISOString() };
  } catch (e: any) {
    return { healthy: false, error: e?.message || "Unknown", timestamp: new Date().toISOString() };
  }
};

export const getAccountInfo = async (accountId: string) => {
  if (!horizon) initializeServers();
  if (!horizon) throw new Error("Horizon server not initialized");
  return horizon.accounts().accountId(accountId).call();
};

export const getAccountTransactions = async (accountId: string, limit: number = 20) => {
  if (!horizon) throw new Error("Horizon server not initialized");
  const txs = await horizon.transactions().forAccount(accountId).limit(limit).order("desc").call();
  return txs.records;
};

export const getRecentTransactions = async (limit: number = 20) => {
  const publicKey = await connectWallet();
  return getAccountTransactions(publicKey, limit);
};

export const getContractEvents = async (startLedger?: number, limit: number = 100) => {
  const contractId = await getContractId();
  const events = await server.getEvents({
    startLedger,
    filters: [{ type: "contract", contractIds: [contractId] }],
    limit,
  });
  return events;
};

// ==============================
// Debug helpers
// ==============================
export async function debugEmployeeAccount(employeeAddress: string): Promise<any> {
  if (!horizon) initializeServers();
  if (!horizon) throw new Error("Horizon not initialized");
  const account = await horizon.accounts().accountId(employeeAddress).call();
  const { assetCode, issuer } = getClassicAssetFromStorage();
  const trustlines = account.balances.filter((b: any) => b.asset_type !== "native");
  const our = trustlines.find((b: any) => b.asset_code === assetCode && b.asset_issuer === issuer);
  const has = !!our;
  const verify = await checkTrustlineExists(employeeAddress);
  return { account, trustlines, ourTrustline: our, hasOurTrustline: has, checkTrustlineExistsResult: verify };
}

// ==============================
// Extra helpers & aliases
// ==============================
export async function addEmployeeSimple(
  fairWageContractId: string,
  employeeAddress: string,
  name: string,
  wageRate: number,
  wagePeriod: string = "hour"
): Promise<string> {
  // alias ke addEmployee dengan mapping period
  return addEmployee(fairWageContractId, employeeAddress, name, wageRate, wagePeriod);
}

export async function freezeEmployee(fairWageContractId: string, employeeAddress: string): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/freeze-employee"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddress }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "freeze-employee failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

export async function activateEmployee(fairWageContractId: string, employeeAddress: string): Promise<string> {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/activate-employee"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddress }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "activate-employee failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

// Old name kept for compatibility with your code
export const updateEmployeeWageRate = updateWageRate;

export const fixEmployeeTimestamp = async (fairWageContractId: string, employeeAddress: string): Promise<string> => {
  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const { publicKey } = await window.rabet.connect();

  const r = await fetch(api("/api/fix-employee-timestamp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddress }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "fix-employee-timestamp failed");
  const j = await r.json();

  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  if (!sign.xdr) throw new Error("Signing cancelled");

  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
};

export async function payPartialByEmployer(fairWageContractId: string, employeeAddress: string, amount: number): Promise<string> {
  const publicKey = await connectWallet();
  const r = await fetch(api("/api/pay-partial-employer"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey, fairWageContractId, employeeAddress, amount }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "pay-partial-employer failed");
  const j = await r.json();

  if (!window.rabet) throw new Error("Rabet wallet not found.");
  const sign = await window.rabet.sign(j.transactionXdr, StellarSdk.Networks.TESTNET);
  const submit = await fetch(api("/api/submit-transaction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTransactionXdr: sign.xdr }),
  });
  if (!submit.ok) throw new Error((await submit.json()).error || "submit failed");
  const s = await submit.json();
  return s.transactionHash;
}

export async function loadEmployeesFromContract(_: string): Promise<any[]> {
  // Belum ada fungsi kontrak spesifik selain list_employees (sudah ada di atas)
  return [];
}

// ==============================
// Deposit (alias ke fundContract untuk employer -> kontrak)
// ==============================
export const depositFunds = async (amount: bigint): Promise<void> => {
  const fairWageContractId = await getContractId();
  const { tokenContractId } = await getBothContractIds();
  if (!tokenContractId) throw new Error("Token contract not configured.");
  const tx = await fundContract(fairWageContractId, tokenContractId, Number(amount));
  console.log("Deposit submitted:", tx);
};

// ==============================
// Contract balance (token balance milik kontrak)
// ==============================
export async function checkContractBalance(fairWageContractId: string, tokenContractId: string): Promise<number> {
  const r = await fetch(api("/api/check-contract-balance"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fairWageContractId, tokenContractId }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "check-contract-balance failed");
  const j = await r.json();
  return j.balance || 0;
}

// ==============================
// Exports (servers & network)
// ==============================
export { server, horizon, networkType };
