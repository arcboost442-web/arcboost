"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { createPublicClient, http, formatEther, defineChain } from "viem";
import Link from "next/link";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.io"] } },
  testnet: true,
});

function getIdenticonColor(addr: string): string {
  let hash = 0;
  for (let i = 0; i < addr.length; i++) {
    hash = addr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.io", { retryCount: 3, retryDelay: 2000, timeout: 30000 }),
});

const FACTORY_ADDRESS = "0x8e3137f42CC0C4448ce8e5839595787fe16511C9" as const;
const FACTORY_ABI = [
  { name: "getAllTokens", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address[]" }] },
  { name: "tokenInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [
    { name: "tokenAddress", type: "address" }, { name: "name", type: "string" },
    { name: "symbol", type: "string" }, { name: "imageURI", type: "string" },
    { name: "description", type: "string" }, { name: "twitter", type: "string" },
    { name: "telegram", type: "string" }, { name: "website", type: "string" },
    { name: "creator", type: "address" }, { name: "createdAt", type: "uint256" },
]},,
] as const;

const TOKEN_ABI = [
  { name: "ethCollected", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "graduated", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
] as const;

// Arc Design System — vivid & professional
const BG       = "#08090F";
const CARD     = "#0E1118";
const CARD2    = "#111622";
const BORDER   = "#1C2235";
const BORDER2  = "#232B42";
const BLUE     = "#2563EB";
const BLUE_LT  = "#3B82F6";
const BLUE_DIM = "#0F1A35";
const BLUE_B   = "rgba(59,130,246,0.15)";
const CYAN     = "#06B6D4";
const TEXT     = "#F1F5FF";
const SUB      = "#94A3B8";
const DIM      = "#374151";
const GRAD     = "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";
const GRAD2    = "linear-gradient(135deg, #1E3A8A 0%, #0E7490 100%)";


type Token = { tokenAddress: string; name: string; symbol: string; imageURI: string; description: string; twitter: string; telegram: string; website: string; creator: string; ethCollected: number; graduated: boolean; };
export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
const [showHowItWorks, setShowHowItWorks] = useState(false); // ← tambah di sini
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMounted(true); loadTokens(); }, []);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadTokens = async () => {
  try {
    const addrs = await publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "getAllTokens" }) as `0x${string}`[];
    const data = await Promise.all(addrs.map(async (addr: `0x${string}`) => {
      const info = await publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "tokenInfo", args: [addr] }) as readonly [string, string, string, string, string, string, string, string, string, bigint];
      let ethCollected = 0, graduated = false;
      try {
        const [eth, grad] = await Promise.all([
          publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "ethCollected" }),
          publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "graduated" }),
        ]);
        ethCollected = parseFloat(formatEther(eth));
        graduated = grad as boolean;
      } catch {}
      return { tokenAddress: info[0], name: info[1], symbol: info[2], imageURI: info[3], description: info[4], twitter: info[5], telegram: info[6], website: info[7], creator: info[8], ethCollected, graduated };
    }));
    setTokens(data.reverse());
  } catch (err) { console.error(err); }
  finally { setLoading(false); }
};

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try { await window.ethereum.request({ method: "eth_requestAccounts" }); window.location.reload(); }
      catch (err) { console.error(err); }
    }
  };

  const getBadge = (t: Token) => {
    const pct = (t.ethCollected / 1) * 100;
    if (t.graduated) return { label: "Graduated", bg: BLUE_DIM, color: BLUE_LT, border: BLUE_B };
    if (pct >= 80) return { label: "Near Grad", bg: "#0E2420", color: "#34D399", border: "rgba(52,211,153,0.15)" };
    if (pct > 40) return { label: "Trending", bg: "#1A1200", color: "#FBBF24", border: "rgba(251,191,36,0.15)" };
    return { label: "New", bg: "#0F172A", color: SUB, border: BORDER2 };
  };

  const filtered = tokens.filter(t => {
    const q = search.toLowerCase();
    const match = t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q);
    const pct = (t.ethCollected / 1) * 100;
    if (tab === "Trending") return match && pct > 40 && !t.graduated;
    if (tab === "New") return match && pct < 20;
    if (tab === "Near Grad") return match && pct >= 80 && !t.graduated;
    if (tab === "Graduated") return match && t.graduated;
    return match;
  });

  const topToken = tokens[0];
  const totalVol = tokens.reduce((a, t) => a + t.ethCollected, 0);

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif" }}>
{/* HOW IT WORKS MODAL */}
{showHowItWorks && (
  <div onClick={() => setShowHowItWorks(false)}
    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
    <div onClick={e => e.stopPropagation()}
      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "32px", maxWidth: "520px", width: "100%", position: "relative" }}>

      {/* CLOSE */}
      <button onClick={() => setShowHowItWorks(false)}
        style={{ position: "absolute", top: "16px", right: "16px", background: CARD2, border: `1px solid ${BORDER2}`, borderRadius: "7px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: DIM }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      {/* TITLE */}
      <div style={{ fontSize: "20px", fontWeight: 700, color: TEXT, letterSpacing: "-.4px", marginBottom: "6px" }}>How ArcBoost works</div>
      <div style={{ fontSize: "13px", color: SUB, marginBottom: "28px" }}>Launch and trade tokens on Arc in three simple steps.</div>

      {/* STEPS */}
      {[
        {
          n: "1",
          title: "Create a token",
          desc: "Fill in your token name, symbol, and image. Pay a small deploy fee (0.001 USDC) and your token is live on Arc instantly — no code required.",
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
        },
        {
          n: "2",
          title: "Trade on bonding curve",
          desc: "Anyone can buy or sell the token immediately. Price increases automatically as more people buy — early buyers get the best price.",
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
        },
        {
          n: "3",
          title: "Graduate to DEX",
          desc: "When the bonding curve reaches 100%, the token automatically graduates. Liquidity moves to a DEX and trading continues there.",
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
        },
      ].map((step, i) => (
        <div key={i} style={{ display: "flex", gap: "16px", marginBottom: i < 2 ? "20px" : "28px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: BLUE_LT }}>
            {step.icon}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: TEXT, marginBottom: "4px" }}>{step.title}</div>
            <div style={{ fontSize: "13px", color: SUB, lineHeight: "1.65" }}>{step.desc}</div>
          </div>
        </div>
      ))}

      {/* CTA */}
      <Link href="/create" onClick={() => setShowHowItWorks(false)}>
        <button style={{ width: "100%", background: GRAD, color: "#fff", border: "none", borderRadius: "10px", padding: "13px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
          Launch a Token
        </button>
      </Link>
    </div>
  </div>
)}
      {/* AMBIENT GLOW */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* NAVBAR */}
        <nav style={{ borderBottom: scrolled ? `1px solid ${BORDER2}` : `1px solid ${BORDER}`, padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", background: scrolled ? "rgba(8,9,15,0.96)" : "rgba(8,9,15,0.85)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100, boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.3)" : "none", transition: "all .25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {/* LOGO */}
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-.3px", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span>
            </div>
                        {/* NAV LINKS */}
            <div style={{ display: "flex", gap: "4px" }}>
              {[{label:"Markets",href:"/",external:false},{label:"Docs",href:"https://docs.arcboost.fun",external:true},{label:"Portfolio",href:"/portfolio",external:false}].filter(l => !isMobile || l.label !== "Docs").map((l,i) => (
                l.external ? (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                    <button style={{ padding: "6px 14px", borderRadius: "7px", fontSize: "13px", color: SUB, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit", fontWeight: 400 }}>
                      {l.label}
                    </button>
                  </a>
                ) : (
                  <Link key={l.label} href={l.href} style={{textDecoration:"none"}}>
                    <button style={{ padding: "6px 14px", borderRadius: "7px", fontSize: "13px", color: i === 0 ? TEXT : SUB, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit", fontWeight: i === 0 ? 500 : 400, position: "relative" }}>
                      {l.label}
                      {i === 0 && <div style={{ position: "absolute", bottom: "-8px", left: "14px", right: "14px", height: "2px", background: GRAD, borderRadius: "2px" }} />}
                    </button>
                  </Link>
                )
              ))}
            </div>
            <div style={{ display: isMobile ? "none" : "flex", alignItems: "center", gap: "6px", padding: "5px 10px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "20px" }}>
              <div style={{ width: "6px", height: "6px", background: "#34D399", borderRadius: "50%", boxShadow: "0 0 6px #34D399", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: "11px", color: "#34D399", fontWeight: 500 }}>Arc Testnet</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {mounted && isConnected ? (
              <>
                <div style={{ background: CARD, border: `1px solid ${BORDER2}`, borderRadius: "8px", padding: "7px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: address ? getIdenticonColor(address) : "#34D399", flexShrink: 0 }} />
                  <span style={{ color: SUB, fontFamily: "monospace", fontSize: "12px" }}>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
                <button onClick={() => disconnect()} style={{ background: "transparent", color: DIM, border: `1px solid ${BORDER}`, padding: "7px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                </button>
              </>
            ) : (
              <button onClick={connectWallet} style={{ background: CARD, border: `1px solid ${BORDER2}`, color: TEXT, borderRadius: "8px", padding: "7px 16px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/></svg>
                {!isMobile && "Connect Wallet"}
              </button>
            )}
            <Link href="/create">
              <button style={{ background: GRAD, color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.35)", fontFamily: "inherit" }}>
                {isMobile ? "Launch" : "Launch Token"}
              </button>
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <div style={{ padding: "80px 32px 64px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, borderRadius: "20px", padding: "5px 14px", fontSize: "11px", fontWeight: 600, color: BLUE_LT, marginBottom: "28px", letterSpacing: ".04em", textTransform: "uppercase" }}>
            <div style={{ width: "6px", height: "6px", background: CYAN, borderRadius: "50%", boxShadow: `0 0 8px ${CYAN}` }} />
            Live on Arc Testnet
          </div>
          <h1 style={{ fontSize: "60px", fontWeight: 800, lineHeight: 1.08, color: TEXT, margin: "0 0 20px", letterSpacing: "-2px" }}>
  Launch your token.<br />
  <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Own the curve.</span>
</h1>
          <p style={{ color: SUB, fontSize: "16px", maxWidth: "560px", margin: "0 auto 36px", lineHeight: "1.7" }}>
No code. No gatekeepers. Deploy a token in seconds, trade instantly on a bonding curve, and graduate to DEX when the market decides.          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/create">
              <button style={{ background: GRAD, color: "#fff", border: "none", borderRadius: "11px", padding: "16px 34px", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 32px rgba(37,99,235,0.4)", fontFamily: "inherit" }}>
                Launch a Token
              </button>
            </Link>
            <button onClick={() => setShowHowItWorks(true)} style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER2}`, borderRadius: "11px", padding: "16px 34px", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}>
  How it works
</button>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: "12px", padding: isMobile ? "0 16px" : "0 32px", maxWidth: "1100px", margin: "0 auto 32px" }}>
          {[
            { label: "Tokens Launched", value: tokens.length.toString(), sub: "On Arc Testnet" },
            { label: "Total Volume", value: `${totalVol.toFixed(3)} USDC`, sub: "All-time" },
            { label: "Avg. Weekly Tx Cost", value: "$0.004", sub: "Predictable fees" },
            { label: "Network", value: "Arc", sub: "Stablecoin-native L1" },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", background: "radial-gradient(circle at 100% 0%, rgba(37,99,235,0.08) 0%, transparent 70%)" }} />
              <div style={{ fontSize: "11px", color: SUB, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "9px" }}>{s.label}</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: TEXT, letterSpacing: "-.5px", marginBottom: "5px" }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: DIM }}>{s.sub}</div>
            </div>
          ))}
        </div>


        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 32px 60px" }}>

          {/* KING OF THE HILL */}
          {topToken && (
            <div style={{ background: `linear-gradient(135deg, ${BLUE_DIM} 0%, #0A1A2E 100%)`, border: `1px solid ${BLUE_B}`, borderRadius: "16px", padding: "28px 32px", marginBottom: "32px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "16px" : "24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: 0, top: 0, width: "300px", height: "100%", background: "radial-gradient(ellipse at 100% 50%, rgba(6,182,212,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ width: "60px", height: "60px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER2}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {topToken.imageURI ? <img src={topToken.imageURI} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontWeight: 700, fontSize: "22px", color: BLUE_LT }}>{topToken.symbol?.slice(0, 1)}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "11px", color: BLUE_LT, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: "5px" }}>Leading Market</div>
                <div style={{ fontSize: "21px", fontWeight: 700, color: TEXT }}>{topToken.name} <span style={{ fontSize: "15px", color: BLUE_LT, fontWeight: 500 }}>{topToken.symbol}</span></div>
              </div>
              <div style={{ display: "flex", gap: isMobile ? "20px" : "32px", flexWrap: "wrap" }}>
                {[
                  { label: "Volume", value: `${topToken.ethCollected.toFixed(4)} USDC` },
                  { label: "Progress", value: `${((topToken.ethCollected / 1) * 100).toFixed(1)}%`, blue: true },
                  { label: "Status", value: topToken.graduated ? "Graduated" : "Active" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: "10px", color: SUB, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "4px" }}>{s.label}</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: s.blue ? CYAN : TEXT }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => window.location.href = `/token/${topToken.tokenAddress}`} style={{ background: GRAD, color: "#fff", border: "none", borderRadius: "9px", padding: "13px 26px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                Trade
              </button>
            </div>
          )}

          {/* FILTER */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "4px", gap: "2px" }}>
              {["All", "Trending", "New", "Near Grad", "Graduated"].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", color: tab === t ? TEXT : SUB, border: "none", background: tab === t ? CARD2 : "none", fontFamily: "inherit", fontWeight: tab === t ? 500 : 400, whiteSpace: "nowrap", transition: "all .15s" }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
              <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search tokens..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "14px", padding: "11px 14px 11px 38px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <button onClick={loadTokens} style={{ background: CARD, color: SUB, border: `1px solid ${BORDER}`, padding: "11px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "7px", fontFamily: "inherit" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              Refresh
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "12px", color: DIM }}>{loading ? "Loading..." : `${filtered.length} tokens`}</span>
          </div>

          {/* TOKEN GRID */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "14px" }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", height: "200px", opacity: 0.4 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ width: "48px", height: "48px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </div>
              <div style={{ color: SUB, fontSize: "14px", marginBottom: "16px" }}>No tokens found.</div>
              <Link href="/create">
                <button style={{ background: GRAD, color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Launch the first one</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "14px", marginBottom: "32px" }}>
              {filtered.map((token) => {
  const pct = Math.min((token.ethCollected / 1) * 100, 100);
  const badge = getBadge(token);
  const isTop = token.tokenAddress === topToken?.tokenAddress;
  const isGrad = token.graduated;
  return (
    <div key={token.tokenAddress}
      onClick={() => window.location.href = `/token/${token.tokenAddress}`}
      style={{
        background: isGrad
          ? "linear-gradient(135deg, #0A1A0E 0%, #0A1625 100%)"
          : isTop ? `linear-gradient(135deg, ${BLUE_DIM}, #0A1625)` : CARD,
        border: `1px solid ${isGrad ? "rgba(52,211,153,0.3)" : isTop ? BLUE_B : BORDER}`,
        borderRadius: "14px", padding: "18px", cursor: "pointer",
        transition: "all .2s", position: "relative", overflow: "hidden",
        boxShadow: isGrad ? "0 0 24px rgba(52,211,153,0.06)" : "none",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = `1px solid ${isGrad ? "rgba(52,211,153,0.5)" : BLUE_B}`;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = isGrad ? "0 12px 40px rgba(52,211,153,0.1)" : "0 12px 40px rgba(37,99,235,0.12)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = `1px solid ${isGrad ? "rgba(52,211,153,0.3)" : isTop ? BLUE_B : BORDER}`;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = isGrad ? "0 0 24px rgba(52,211,153,0.06)" : "none";
      }}
    >
      {/* GLOW */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px",
        background: isGrad
          ? "radial-gradient(circle at 100% 0%, rgba(52,211,153,0.08) 0%, transparent 70%)"
          : "radial-gradient(circle at 100% 0%, rgba(37,99,235,0.06) 0%, transparent 70%)" }} />

      {/* GRADUATED RIBBON */}
      {isGrad && (
        <div style={{ position: "absolute", top: "12px", right: "-22px", background: "linear-gradient(90deg, #065F46, #047857)", color: "#34D399", fontSize: "9px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 28px", transform: "rotate(35deg)", boxShadow: "0 2px 8px rgba(52,211,153,0.2)" }}>
          Graduated
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "11px",
          background: isGrad ? "#0A2018" : BLUE_DIM,
          border: `1px solid ${isGrad ? "rgba(52,211,153,0.2)" : BORDER2}`,
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
          boxShadow: isGrad ? "0 0 12px rgba(52,211,153,0.1)" : "none" }}>
          {token.imageURI
            ? <img src={token.imageURI} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontWeight: 700, fontSize: "16px", color: isGrad ? "#34D399" : BLUE_LT }}>{token.symbol?.slice(0, 1)}</span>
          }
        </div>
        {!isGrad && (
          <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "4px", background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
            {badge.label}
          </span>
        )}
      </div>

      <div style={{ fontSize: "15px", fontWeight: 700, color: TEXT, marginBottom: "2px", letterSpacing: "-.2px" }}>{token.name}</div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: isGrad ? "#34D399" : BLUE_LT, marginBottom: "6px" }}>{token.symbol}</div>
      <div style={{ fontSize: "12px", color: SUB, lineHeight: "1.5", marginBottom: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {token.description || "No description"}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: DIM, marginBottom: "5px" }}>
          <span style={{ textTransform: "uppercase", letterSpacing: ".05em" }}>Bonding Curve</span>
          <span style={{ color: isGrad ? "#34D399" : pct >= 80 ? CYAN : BLUE_LT, fontWeight: 600 }}>
            {isGrad ? "100% — Graduated" : `${pct.toFixed(1)}%`}
          </span>
        </div>
        <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "4px", height: "4px", overflow: "hidden" }}>
          <div style={{ height: "4px", borderRadius: "4px",
            background: isGrad
              ? "linear-gradient(90deg, #34D399, #06B6D4)"
              : pct >= 80 ? `linear-gradient(90deg, ${BLUE_LT}, ${CYAN})` : BLUE_LT,
            width: isGrad ? "100%" : `${pct}%`,
            transition: "width .4s",
            boxShadow: isGrad ? "0 0 8px rgba(52,211,153,0.4)" : "none" }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "11px", color: DIM }}>
          Vol: <span style={{ color: isGrad ? "#34D399" : SUB }}>{token.ethCollected.toFixed(4)} USDC</span>
        </div>
        <div style={{ fontSize: "11px", fontWeight: 600, color: isGrad ? "#34D399" : BLUE_LT, display: "flex", alignItems: "center", gap: "4px" }}>
          {isGrad ? "View on DEX" : "Trade"}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  );
})}
            </div>
          )}

          {/* LEADERBOARD */}
          {tokens.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: TEXT }}>Volume Leaderboard</div>
                <div style={{ fontSize: "11px", color: DIM }}>Top {Math.min(tokens.length, 5)} tokens</div>
              </div>
              {tokens.slice(0, 5).map((t, i) => (
                <div key={t.tokenAddress} onClick={() => window.location.href = `/token/${t.tokenAddress}`}
                  style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 20px", borderBottom: i < 4 && i < tokens.length - 1 ? `1px solid ${BORDER}` : "none", cursor: "pointer", transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = CARD2}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "none"}>
                  <div style={{ width: "22px", fontSize: "13px", fontWeight: 700, color: i === 0 ? "#F59E0B" : i === 1 ? SUB : i === 2 ? "#CD7F32" : DIM, textAlign: "center" }}>{i + 1}</div>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: BLUE_DIM, border: `1px solid ${BORDER2}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {t.imageURI ? <img src={t.imageURI} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontWeight: 700, fontSize: "13px", color: BLUE_LT }}>{t.symbol?.slice(0, 1)}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: TEXT }}>{t.name} <span style={{ fontSize: "11px", color: BLUE_LT }}>{t.symbol}</span></div>
                  </div>
                  <div style={{ fontSize: "13px", color: SUB }}>{t.ethCollected.toFixed(4)} USDC</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: CYAN }}>+{((t.ethCollected / 1) * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</div>
          <div style={{ display: "flex", gap: "20px" }}>
            {[
  { label: "Docs",   href: "https://docs.arcboost.fun" },
  { label: "Twitter", href: "https://x.com/BOOSTARCC" },
  { label: "GitHub", href: "https://github.com/arcboost442-web/arcboost" },
].map(l => (
  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: DIM, textDecoration: "none" }}>{l.label}</a>
))}
          </div>
          <div style={{ fontSize: "11px", color: DIM }}>Built on Arc · {new Date().getFullYear()}</div>
        </div>
      </div>

      <style>{`* { box-sizing: border-box; } input::placeholder { color: #374151; } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </main>
  );
}