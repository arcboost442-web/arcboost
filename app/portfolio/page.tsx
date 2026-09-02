"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { createPublicClient, http, formatEther, defineChain } from "viem";
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

const FACTORY_ADDRESS = "0xE1b2edf7183c4D2bB2D159593d65F4507FA02B2B" as const;

const FACTORY_ABI = [
  { name: "getAllTokens", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address[]" }] },
  { name: "tokenInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [
    { name: "tokenAddress", type: "address" }, { name: "name", type: "string" },
    { name: "symbol", type: "string" }, { name: "imageURI", type: "string" },
    { name: "description", type: "string" }, { name: "twitter", type: "string" },
    { name: "telegram", type: "string" }, { name: "website", type: "string" },
    { name: "creator", type: "address" }, { name: "createdAt", type: "uint256" },
]},
] as const;

const TOKEN_ABI = [
  { name: "ethCollected", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "graduated", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

// Arc Design System
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
const GRAD     = "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";

type TokenHolding = {
  tokenAddress: string;
  name: string;
  symbol: string;
  imageURI: string;
  description: string;
  creator: string;
  ethCollected: number;
  graduated: boolean;
  totalSupply: number;
  balance: number;
  balancePct: number;
  valueUsdc: number;
  isCreator: boolean;
};

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"holdings" | "created">("holdings");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (address) loadPortfolio(); }, [address]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        window.location.reload();
      } catch (err) { console.error(err); }
    }
  };

  const loadPortfolio = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const addrs = await publicClient.readContract({
        address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "getAllTokens",
      });

      const results = await Promise.all(addrs.map(async (addr) => {
        try {
          const info = await publicClient.readContract({
            address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "tokenInfo", args: [addr],
          });

          const [ethRaw, grad, supplyRaw, balRaw] = await Promise.all([
            publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "ethCollected" }),
            publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "graduated" }),
            publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "totalSupply" }),
            publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "balanceOf", args: [address] }),
          ]);

          const ethCollected = parseFloat(formatEther(ethRaw));
          const totalSupply  = parseFloat(formatEther(supplyRaw));
          const balance      = parseFloat(formatEther(balRaw));
          const price        = totalSupply > 0 ? ethCollected / totalSupply : 0;
          const valueUsdc    = balance * price;
          const balancePct   = totalSupply > 0 ? (balance / totalSupply) * 100 : 0;
          const isCreator    = info[5].toLowerCase() === address.toLowerCase();

          return {
            tokenAddress: info[0],
            name: info[1],
            symbol: info[2],
            imageURI: info[3],
            description: info[4],
            creator: info[5],
            ethCollected,
            graduated: grad as boolean,
            totalSupply,
            balance,
            balancePct,
            valueUsdc,
            isCreator,
          } as TokenHolding;
        } catch { return null; }
      }));

      setHoldings(results.filter(Boolean) as TokenHolding[]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const myHoldings = holdings.filter(t => t.balance > 0);
  const myCreated  = holdings.filter(t => t.isCreator);
  const displayed  = tab === "holdings" ? myHoldings : myCreated;

  const totalValue = myHoldings.reduce((a, t) => a + t.valueUsdc, 0);
  const totalTokens = myHoldings.length;
  const totalCreated = myCreated.length;

  const pct = (t: TokenHolding) => Math.min((t.ethCollected / 1) * 100, 100);

  // Not connected state
  if (mounted && !isConnected) return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "-apple-system,BlinkMacSystemFont,'Inter','SF Pro Display',sans-serif" }}>
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.1) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* NAVBAR */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", background: "rgba(8,9,15,0.85)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-.3px", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span>
          </Link>
          <div style={{ display: "flex", gap: "4px" }}>
            {[{label:"Markets",href:"/"},{label:"Launch",href:"/create"},{label:"Portfolio",href:"/portfolio"}].map((l,i) => (
              <Link key={l.label} href={l.href} style={{ textDecoration: "none" }}>
                <button style={{ padding: "6px 14px", borderRadius: "7px", fontSize: "13px", color: i === 2 ? TEXT : SUB, cursor: "pointer", border: "none", background: i === 2 ? CARD2 : "none", fontFamily: "inherit", fontWeight: i === 2 ? 500 : 400 }}>{l.label}</button>
              </Link>
            ))}
          </div>
        </div>
        <button onClick={connectWallet} style={{ background: GRAD, color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>
          Connect Wallet
        </button>
      </nav>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", textAlign: "center", padding: "40px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BLUE_LT} strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/></svg>
        </div>
        <div style={{ fontSize: "24px", fontWeight: 700, color: TEXT, marginBottom: "10px", letterSpacing: "-.4px" }}>Connect your wallet</div>
        <div style={{ fontSize: "14px", color: SUB, maxWidth: "360px", lineHeight: "1.65", marginBottom: "28px" }}>
          Connect your wallet to view your token holdings and tokens you have created on ArcBoost.
        </div>
        <button onClick={connectWallet} style={{ background: GRAD, color: "#fff", border: "none", borderRadius: "10px", padding: "13px 32px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 32px rgba(37,99,235,0.4)" }}>
          Connect Wallet
        </button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "-apple-system,BlinkMacSystemFont,'Inter','SF Pro Display',sans-serif" }}>
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.08) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* NAVBAR */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", background: "rgba(8,9,15,0.85)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-.3px", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span>
          </Link>
          <div style={{ display: "flex", gap: "4px" }}>
            {[{label:"Markets",href:"/"},{label:"Launch",href:"/create"},{label:"Portfolio",href:"/portfolio"}].map((l,i) => (
              <Link key={l.label} href={l.href} style={{ textDecoration: "none" }}>
                <button style={{ padding: "6px 14px", borderRadius: "7px", fontSize: "13px", color: i === 2 ? TEXT : SUB, cursor: "pointer", border: "none", background: i === 2 ? CARD2 : "none", fontFamily: "inherit", fontWeight: i === 2 ? 500 : 400 }}>{l.label}</button>
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {mounted && isConnected && (
            <>
              <div style={{ background: CARD, border: `1px solid ${BORDER2}`, borderRadius: "8px", padding: "7px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ width: "7px", height: "7px", background: GREEN, borderRadius: "50%", boxShadow: `0 0 6px ${GREEN}` }} />
                <span style={{ color: SUB, fontFamily: "monospace", fontSize: "12px" }}>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
              <button onClick={() => disconnect()} style={{ background: "transparent", color: DIM, border: `1px solid ${BORDER}`, padding: "7px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              </button>
            </>
          )}
          <Link href="/create">
            <button style={{ background: GRAD, color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.35)", fontFamily: "inherit" }}>
              Launch Token
            </button>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "36px 32px 60px", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: TEXT, letterSpacing: "-.5px", marginBottom: "5px" }}>Portfolio</div>
          <div style={{ fontSize: "13px", color: SUB, fontFamily: "monospace" }}>{address}</div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Portfolio Value", value: loading ? "..." : `${totalValue.toFixed(6)} USDC`, sub: "Estimated at current price", accent: true },
            { label: "Tokens Held", value: loading ? "..." : totalTokens.toString(), sub: "Unique token holdings" },
            { label: "Tokens Created", value: loading ? "..." : totalCreated.toString(), sub: "Launched via ArcBoost" },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", background: "radial-gradient(circle at 100% 0%,rgba(37,99,235,0.07) 0%,transparent 70%)" }} />
              <div style={{ fontSize: "10px", color: SUB, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: s.accent ? CYAN : TEXT, letterSpacing: "-.4px", marginBottom: "3px" }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: DIM }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "3px", gap: "3px", marginBottom: "20px", width: "fit-content" }}>
          {([
            { key: "holdings", label: "Holdings", count: myHoldings.length },
            { key: "created",  label: "Created",  count: myCreated.length },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "7px 20px", borderRadius: "7px", fontSize: "13px", cursor: "pointer", border: "none", fontFamily: "inherit", fontWeight: tab === t.key ? 600 : 400, transition: "all .15s",
                background: tab === t.key ? CARD2 : "none",
                color: tab === t.key ? TEXT : SUB,
                display: "flex", alignItems: "center", gap: "7px" }}>
              {t.label}
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "10px",
                background: tab === t.key ? BLUE_DIM : "transparent",
                color: tab === t.key ? BLUE_LT : DIM,
                border: `1px solid ${tab === t.key ? BLUE_B : "transparent"}` }}>
                {loading ? "..." : t.count}
              </span>
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", height: "90px", opacity: 0.4 }} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: "52px", height: "52px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              {tab === "holdings"
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
              }
            </div>
            <div style={{ color: TEXT, fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
              {tab === "holdings" ? "No token holdings" : "No tokens created"}
            </div>
            <div style={{ color: SUB, fontSize: "13px", maxWidth: "300px", margin: "0 auto 24px", lineHeight: "1.6" }}>
              {tab === "holdings"
                ? "Buy tokens on the markets page to see them here."
                : "Launch your first token and it will appear here."}
            </div>
            <Link href={tab === "holdings" ? "/" : "/create"}>
              <button style={{ background: GRAD, color: "#fff", border: "none", borderRadius: "9px", padding: "11px 24px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
                {tab === "holdings" ? "Browse Markets" : "Launch a Token"}
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayed.map((token) => {
              const progress = pct(token);
              return (
                <div key={token.tokenAddress}
                  onClick={() => router.push(`/token/${token.tokenAddress}`)}
                  style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", transition: "all .15s", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.border = `1px solid ${BLUE_B}`; el.style.background = CARD2; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.border = `1px solid ${BORDER}`; el.style.background = CARD; }}>

                  <div style={{ position: "absolute", top: 0, right: 0, width: "100px", height: "100%", background: "radial-gradient(circle at 100% 50%,rgba(37,99,235,0.04) 0%,transparent 70%)", pointerEvents: "none" }} />

                  {/* TOKEN IMAGE */}
                  <div style={{ width: "44px", height: "44px", borderRadius: "11px", background: BLUE_DIM, border: `1px solid ${BORDER2}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {token.imageURI
                      ? <img src={token.imageURI} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontWeight: 700, fontSize: "16px", color: BLUE_LT }}>{token.symbol?.slice(0,1)}</span>
                    }
                  </div>

                  {/* NAME + SYMBOL */}
                  <div style={{ minWidth: "140px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: TEXT, marginBottom: "2px" }}>{token.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: BLUE_LT }}>{token.symbol}</span>
                      {token.isCreator && (
                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "3px", background: GREEN_DIM, color: GREEN, border: `1px solid ${GREEN_B}` }}>Creator</span>
                      )}
                      {token.graduated && (
                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "3px", background: BLUE_DIM, color: BLUE_LT, border: `1px solid ${BLUE_B}` }}>Graduated</span>
                      )}
                    </div>
                  </div>

                  {/* BALANCE — only for holdings tab */}
                  {tab === "holdings" && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "10px", color: DIM, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "3px" }}>Balance</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: TEXT }}>{token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span style={{ fontSize: "11px", color: SUB, fontWeight: 400 }}>{token.symbol}</span></div>
                      <div style={{ fontSize: "11px", color: DIM, marginTop: "1px" }}>{token.balancePct.toFixed(4)}% of supply</div>
                    </div>
                  )}

                  {/* VALUE / VOLUME */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", color: DIM, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "3px" }}>
                      {tab === "holdings" ? "Est. Value" : "Volume"}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: CYAN }}>
                      {tab === "holdings"
                        ? `${token.valueUsdc.toFixed(6)} USDC`
                        : `${token.ethCollected.toFixed(4)} USDC`}
                    </div>
                  </div>

                  {/* BONDING CURVE PROGRESS */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: DIM, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "5px" }}>
                      <span>Bonding Curve</span>
                      <span style={{ color: progress >= 80 ? CYAN : BLUE_LT, fontWeight: 600 }}>
                        {token.graduated ? "100%" : `${progress.toFixed(1)}%`}
                      </span>
                    </div>
                    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                      <div style={{ height: "5px", borderRadius: "4px", background: progress >= 80 ? `linear-gradient(90deg, ${BLUE_LT}, ${CYAN})` : BLUE_LT, width: `${progress}%`, transition: "width .4s" }} />
                    </div>
                  </div>

                  {/* ARROW */}
                  <div style={{ color: DIM, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* REFRESH */}
        {!loading && mounted && isConnected && (
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
            <button onClick={loadPortfolio}
              style={{ background: CARD, color: SUB, border: `1px solid ${BORDER}`, padding: "9px 20px", borderRadius: "9px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              Refresh portfolio
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</div>
        <div style={{ display: "flex", gap: "20px" }}>
          {["Docs","Twitter","Discord","GitHub"].map(l => (
            <a key={l} href="#" style={{ fontSize: "12px", color: DIM, textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize: "11px", color: DIM }}>Built on Arc · {new Date().getFullYear()}</div>
      </div>

      <style>{`* { box-sizing: border-box; }`}</style>
    </main>
  );
}