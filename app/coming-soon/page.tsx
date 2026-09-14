"use client";
import Link from "next/link";

const BG      = "#08090F";
const CARD    = "#0E1118";
const CARD2   = "#111622";
const BORDER  = "#1C2235";
const BORDER2 = "#232B42";
const BLUE_LT = "#3B82F6";
const BLUE_DIM= "#0F1A35";
const BLUE_B  = "rgba(59,130,246,0.15)";
const TEXT    = "#F1F5FF";
const SUB     = "#94A3B8";
const DIM     = "#374151";
const GRAD    = "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";

const STEPS = [
  {
    n: "1",
    title: "Create a token",
    desc: "Fill in your token name, symbol, and image. Pay a small deploy fee (0.001 USDC) and your token is live on Arc instantly — no code required.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
  },
  {
    n: "2",
    title: "Trade on bonding curve",
    desc: "Anyone can buy or sell the token immediately. Price increases automatically as more people buy — early buyers get the best price.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  {
    n: "3",
    title: "Graduate to DEX",
    desc: "When the bonding curve reaches 100%, the token automatically graduates. Liquidity moves to a DEX and trading continues there.",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  },
];

export default function ComingSoon() {
  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "560px", margin: "0 auto", padding: "64px 24px 80px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "40px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: "20px", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 800, lineHeight: 1.15, color: TEXT, margin: "0 0 14px", letterSpacing: "-1px" }}>
            How ArcBoost works
          </h1>
          <p style={{ color: SUB, fontSize: "14px", lineHeight: "1.65", margin: 0, maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
            Launch and trade tokens on Arc in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "32px" }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: "16px", marginBottom: i < STEPS.length - 1 ? "24px" : "0" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: BLUE_LT }}>
                {step.icon}
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: TEXT, marginBottom: "5px" }}>{step.title}</div>
                <div style={{ fontSize: "13px", color: SUB, lineHeight: "1.65" }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/create" style={{ textDecoration: "none" }}>
          <button style={{ width: "100%", background: GRAD, color: "#fff", border: "none", borderRadius: "12px", padding: "16px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 32px rgba(37,99,235,0.35)", marginTop: "24px" }}>
            Launch a Token
          </button>
        </Link>

        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: DIM, cursor: "pointer" }}>
            ← Back to Markets
          </div>
        </Link>

      </div>
    </main>
  );
}