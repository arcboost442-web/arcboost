"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { createPublicClient, http, formatEther, defineChain, parseEther } from "viem";
import Link from "next/link";
import { useRouter } from "next/navigation";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.io"] } },
  testnet: true,
});

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.io", { retryCount: 3, retryDelay: 2000, timeout: 30000 }),
});

const FACTORY_ADDRESS = "0xe14e152E67252CD98EE153a5c1DE8E90997aE802" as const;
const OWNER_ADDRESS   = "0xF113960dDaBA8F45014Ef43177b1DC27f1f4E78a" as `0x${string}`;

const FACTORY_ABI = [
  { name: "getAllTokens",    type: "function", stateMutability: "view",     inputs: [],                                              outputs: [{ name: "", type: "address[]" }] },
  { name: "deployFee",      type: "function", stateMutability: "view",     inputs: [],                                              outputs: [{ type: "uint256" }] },
  { name: "treasury",       type: "function", stateMutability: "view",     inputs: [],                                              outputs: [{ type: "address" }] },
    { name: "owner",          type: "function", stateMutability: "view",     inputs: [],                                              outputs: [{ type: "address" }] },
  { name: "withdrawTokenFunds", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenAddr", type: "address" }], outputs: [] },
  { name: "setDeployFee",   type: "function", stateMutability: "nonpayable", inputs: [{ name: "newFee",      type: "uint256" }],   outputs: [] },
  { name: "setTreasury",    type: "function", stateMutability: "nonpayable", inputs: [{ name: "newTreasury", type: "address" }],   outputs: [] },
  { name: "setTokenGradTarget", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenAddr", type: "address" }, { name: "newTarget", type: "uint256" }], outputs: [] },
] as const;

const TOKEN_ABI = [
    { name: "withdrawFunds", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "ethCollected", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "graduated",    type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool"    }] },
] as const;

// Design system
const BG       = "#08090F";
const CARD     = "#0E1118";
const CARD2    = "#111622";
const BORDER   = "#1C2235";
const BORDER2  = "#232B42";
const BLUE_LT  = "#3B82F6";
const BLUE_DIM = "#0F1A35";
const BLUE_B   = "rgba(59,130,246,0.15)";
const CYAN     = "#06B6D4";
const TEXT     = "#F1F5FF";
const SUB      = "#94A3B8";
const DIM      = "#374151";
const GREEN    = "#34D399";
const GREEN_DIM= "#0A2018";
const GREEN_B  = "rgba(52,211,153,0.15)";
const RED      = "#EF4444";
const RED_DIM  = "#1A0A0A";
const GRAD     = "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [treasuryAddress, setTreasuryAddress] = useState("");
  const [deployFee, setDeployFee] = useState("0");
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [graduatedCount, setGraduatedCount] = useState(0);
  const [graduatedWithFunds, setGraduatedWithFunds] = useState(0); // ← tambah di sini

  // Form state
  const [newTreasury, setNewTreasury] = useState("");
  const [newDeployFee, setNewDeployFee] = useState("");
  const [newGradTarget, setNewGradTarget] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [txSuccess, setTxSuccess] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && isConnected && address) {
      if (address.toLowerCase() !== OWNER_ADDRESS.toLowerCase()) {
        router.push("/");
      } else {
        loadStats();
      }
    }
  }, [mounted, isConnected, address]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [addrs, fee, treasury] = await Promise.all([
        publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "getAllTokens" }),
        publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "deployFee" }),
        publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "treasury" }),
      ]);

      setTotalTokens(addrs.length);
      setDeployFee(formatEther(fee));
      setTreasuryAddress(treasury);

      // Cek balance treasury
      const balance = await publicClient.getBalance({ address: treasury as `0x${string}` });
      setTreasuryBalance(parseFloat(formatEther(balance)).toFixed(6));

      // Hitung total volume & graduated
      let vol = 0, grad = 0;
      await Promise.all(addrs.map(async (addr) => {
        try {
          const [eth, graduated] = await Promise.all([
            publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "ethCollected" }),
            publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "graduated" }),
          ]);
          vol += parseFloat(formatEther(eth));
          if (graduated) {
  grad++;
  const bal = await publicClient.getBalance({ address: addr });
  if (bal > BigInt(0)) setGraduatedWithFunds(prev => prev + 1);
}
        } catch {}
      }));

      setTotalVolume(vol);
      setGraduatedCount(grad);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const execTx = async (fn: () => Promise<void>) => {
    setTxLoading(true); setTxError(""); setTxSuccess("");
    try {
      await fn();
      setTxSuccess("Transaction submitted successfully.");
      setTimeout(() => { setTxSuccess(""); loadStats(); }, 3000);
    } catch (err: any) {
      setTxError(err.message?.slice(0, 120) || "Transaction failed.");
    } finally { setTxLoading(false); }
  };

  const handleSetTreasury = () => execTx(async () => {
    if (!newTreasury.startsWith("0x")) throw new Error("Invalid address format.");
    const { createWalletClient, custom } = await import("viem");
    const wc = createWalletClient({ chain: arcTestnet, transport: custom((window as any).ethereum) });
    await wc.writeContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "setTreasury", args: [newTreasury as `0x${string}`], account: address! });
    setNewTreasury("");
  });

  const handleSetDeployFee = () => execTx(async () => {
    if (!newDeployFee || isNaN(Number(newDeployFee))) throw new Error("Invalid fee amount.");
    const { createWalletClient, custom } = await import("viem");
    const wc = createWalletClient({ chain: arcTestnet, transport: custom((window as any).ethereum) });
    await wc.writeContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "setDeployFee", args: [parseEther(newDeployFee)], account: address! });
    setNewDeployFee("");
  });
const handleSetGradTarget = () => execTx(async () => {
  if (!newGradTarget || isNaN(Number(newGradTarget))) throw new Error("Invalid target amount.");
  const { createWalletClient, custom } = await import("viem");
  const wc = createWalletClient({ chain: arcTestnet, transport: custom((window as any).ethereum) });
  
  const addrs = await publicClient.readContract({ 
    address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "getAllTokens" 
  });
  
  let updated = 0;
  for (const addr of addrs) {
    try {
      const graduated = await publicClient.readContract({ 
        address: addr, abi: TOKEN_ABI, functionName: "graduated" 
      });
      if (!graduated) {
        await wc.writeContract({ 
          address: addr,
          abi: [{ 
            name: "setGradTarget", 
            type: "function", 
            stateMutability: "nonpayable", 
            inputs: [{ name: "newTarget", type: "uint256" }], 
            outputs: [] 
          }],
          functionName: "setGradTarget", 
          args: [parseEther(newGradTarget)], 
          account: address! 
        });
        updated++;
      }
    } catch(e) { console.error(e); }
  }
  
  if (updated === 0) throw new Error("No active tokens to update.");
  setNewGradTarget("");
});
const handleWithdraw = () => execTx(async () => {
  const { createWalletClient, custom } = await import("viem");
  const wc = createWalletClient({ chain: arcTestnet, transport: custom((window as any).ethereum) });
  const addrs = await publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "getAllTokens" });
  let withdrawn = 0;
  for (const addr of addrs) {
    try {
      const graduated = await publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "graduated" });
      if (graduated) {
        const balance = await publicClient.getBalance({ address: addr });
        if (balance > BigInt(0)) {
          await wc.writeContract({ address: addr, abi: [{ name: "withdrawFunds", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }], functionName: "withdrawFunds", account: address! });
          withdrawn++;
        }
      }
    } catch {}
  }
  if (withdrawn === 0) throw new Error("No graduated tokens with funds to withdraw.");
});
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try { await window.ethereum.request({ method: "eth_requestAccounts" }); window.location.reload(); }
      catch (err) { console.error(err); }
    }
  };

  // Not connected
  if (mounted && !isConnected) return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BLUE_LT} strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: TEXT, marginBottom: "8px" }}>Admin Access Required</div>
      <div style={{ fontSize: "13px", color: SUB, marginBottom: "24px" }}>Connect the owner wallet to access this panel.</div>
      <button onClick={connectWallet} style={{ background: GRAD, color: "#fff", border: "none", borderRadius: "10px", padding: "12px 28px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
        Connect Wallet
      </button>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "-apple-system,BlinkMacSystemFont,'Inter','SF Pro Display',sans-serif" }}>
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.08) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* NAVBAR */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", background: "rgba(8,9,15,0.85)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "16px", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span>
          </Link>
          <div style={{ width: "1px", height: "20px", background: BORDER2 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: SUB }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={BLUE_LT} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ color: TEXT, fontWeight: 500 }}>Admin Panel</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ background: GREEN_DIM, border: `1px solid ${GREEN_B}`, borderRadius: "8px", padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "6px", height: "6px", background: GREEN, borderRadius: "50%", boxShadow: `0 0 6px ${GREEN}` }} />
            <span style={{ color: GREEN, fontFamily: "monospace" }}>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <span style={{ color: DIM, fontSize: "10px" }}>Owner</span>
          </div>
          <button onClick={() => disconnect()} style={{ background: "transparent", color: DIM, border: `1px solid ${BORDER}`, padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
            Disconnect
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "36px 32px 60px", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: TEXT, letterSpacing: "-.5px", marginBottom: "5px" }}>Admin Panel</div>
          <div style={{ fontSize: "13px", color: SUB }}>Manage ArcBoost platform settings and monitor performance.</div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Treasury Balance", value: loading ? "..." : `${treasuryBalance} USDC`, sub: "Wallet balance", accent: true },
            { label: "Total Volume", value: loading ? "..." : `${totalVolume.toFixed(4)} USDC`, sub: "All-time buy/sell" },
            { label: "Tokens Launched", value: loading ? "..." : totalTokens.toString(), sub: "Via ArcBoost" },
            { label: "Graduated", value: loading ? "..." : graduatedCount.toString(), sub: "Tokens on DEX" },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 18px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "50px", height: "50px", background: "radial-gradient(circle at 100% 0%,rgba(37,99,235,0.07) 0%,transparent 70%)" }} />
              <div style={{ fontSize: "10px", color: SUB, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: s.accent ? CYAN : TEXT, letterSpacing: "-.3px", marginBottom: "3px" }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: DIM }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* CONTRACT INFO */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 20px", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "14px" }}>Contract Info</div>
          {[
            { label: "Factory Address", value: FACTORY_ADDRESS, mono: true },
            { label: "Treasury Address", value: loading ? "..." : treasuryAddress, mono: true },
            { label: "Deploy Fee", value: loading ? "..." : `${deployFee} USDC`, mono: false },
            { label: "Platform Fee", value: "1% per buy/sell", mono: false },
            { label: "Network", value: "Arc Testnet (Chain ID: 5042002)", mono: false },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none", fontSize: "13px" }}>
              <span style={{ color: DIM }}>{row.label}</span>
              <span style={{ color: SUB, fontFamily: row.mono ? "monospace" : "inherit", fontSize: row.mono ? "11px" : "13px" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* SETTINGS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          {/* GANTI TREASURY */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 20px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "4px" }}>Treasury Address</div>
            <div style={{ fontSize: "12px", color: SUB, marginBottom: "14px" }}>Fee dari buy/sell dan deploy akan dikirim ke alamat ini.</div>
            <input
              value={newTreasury}
              onChange={e => setNewTreasury(e.target.value)}
              placeholder="0x..."
              style={{ width: "100%", background: BG, border: `1px solid ${BORDER2}`, borderRadius: "8px", color: TEXT, fontSize: "12px", padding: "9px 12px", outline: "none", fontFamily: "monospace", boxSizing: "border-box", marginBottom: "10px" }}
            />
            <button onClick={handleSetTreasury} disabled={txLoading || !newTreasury}
              style={{ width: "100%", background: newTreasury ? GRAD : BORDER2, color: newTreasury ? "#fff" : DIM, border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: newTreasury ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}>
              {txLoading ? "Submitting..." : "Update Treasury"}
            </button>
          </div>

          {/* GANTI DEPLOY FEE */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 20px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "4px" }}>Deploy Fee</div>
            <div style={{ fontSize: "12px", color: SUB, marginBottom: "14px" }}>Biaya yang dibayar user saat membuat token baru. Sekarang: {loading ? "..." : `${deployFee} USDC`}</div>
            <input
              value={newDeployFee}
              onChange={e => setNewDeployFee(e.target.value)}
              placeholder="contoh: 0.001"
              type="number"
              step="0.001"
              style={{ width: "100%", background: BG, border: `1px solid ${BORDER2}`, borderRadius: "8px", color: TEXT, fontSize: "13px", padding: "9px 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "10px" }}
            />
            <button onClick={handleSetDeployFee} disabled={txLoading || !newDeployFee}
              style={{ width: "100%", background: newDeployFee ? GRAD : BORDER2, color: newDeployFee ? "#fff" : DIM, border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: newDeployFee ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}>
              {txLoading ? "Submitting..." : "Update Deploy Fee"}
            </button>
          </div>
          {/* GANTI GRAD TARGET */}
<div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 20px" }}>
  <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "4px" }}>Graduation Target</div>
  <div style={{ fontSize: "12px", color: SUB, marginBottom: "14px" }}>Target USDC yang harus terkumpul sebelum token graduate ke DEX. Berlaku untuk semua token aktif.</div>
  <input
    value={newGradTarget}
    onChange={e => setNewGradTarget(e.target.value)}
    placeholder="contoh: 1.0"
    type="number"
    step="0.1"
    style={{ width: "100%", background: BG, border: `1px solid ${BORDER2}`, borderRadius: "8px", color: TEXT, fontSize: "13px", padding: "9px 12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "10px" }}
  />
  <button onClick={handleSetGradTarget} disabled={txLoading || !newGradTarget}
    style={{ width: "100%", background: newGradTarget ? GRAD : BORDER2, color: newGradTarget ? "#fff" : DIM, border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: newGradTarget ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}>
    {txLoading ? "Submitting..." : "Update Grad Target"}
  </button>
</div>
        {/* WITHDRAW */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "4px" }}>Withdraw Graduated Funds</div>
              <div style={{ fontSize: "12px", color: SUB }}>Tarik USDC dari semua token yang sudah graduated ke wallet treasury.</div>
            </div>
            <div style={{ background: GREEN_DIM, border: `1px solid ${GREEN_B}`, borderRadius: "8px", padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: GREEN }}>{loading ? "..." : graduatedWithFunds}</div>
              <div style={{ fontSize: "10px", color: DIM }}>tokens ready</div>
            </div>
          </div>
          <button onClick={handleWithdraw} disabled={txLoading || graduatedWithFunds === 0}
            style={{ width: "100%", background: graduatedWithFunds > 0 ? "linear-gradient(135deg, #065F46, #047857)" : BORDER2, color: graduatedWithFunds > 0 ? GREEN : DIM, border: `1px solid ${graduatedWithFunds > 0 ? GREEN_B : "transparent"}`, borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: graduatedWithFunds > 0 ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 7l-5-5-5 5M17 17l-5 5-5-5"/></svg>
            {txLoading ? "Processing..." : "Withdraw All Graduated Funds"}
          </button>
        </div>

        {/* TX FEEDBACK */}
        </div>

        {/* TX FEEDBACK */}
        {txError && (
          <div style={{ background: RED_DIM, border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "12px 16px", color: RED, fontSize: "13px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            {txError}
          </div>
        )}
        {txSuccess && (
          <div style={{ background: GREEN_DIM, border: `1px solid ${GREEN_B}`, borderRadius: "10px", padding: "12px 16px", color: GREEN, fontSize: "13px", marginBottom: "16px", display: "flex", gap: "8px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            {txSuccess}
          </div>
        )}

        {/* REFRESH */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button onClick={loadStats} disabled={loading}
            style={{ background: CARD, color: SUB, border: `1px solid ${BORDER}`, padding: "9px 20px", borderRadius: "9px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <style>{`* { box-sizing: border-box; } input::placeholder { color: #374151; } input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }`}</style>
    </main>
  );
}