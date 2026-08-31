"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const BG       = "#08090F";
const CARD     = "#0E1118";
const BORDER   = "#1C2235";
const BORDER2  = "#232B42";
const BLUE_LT  = "#3B82F6";
const BLUE_DIM = "#0F1A35";
const BLUE_B   = "rgba(59,130,246,0.15)";
const CYAN     = "#06B6D4";
const TEXT     = "#F1F5FF";
const SUB      = "#94A3B8";
const DIM      = "#374151";
const GRAD     = "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";

const LAUNCH_DATE = new Date("2025-09-16T00:00:00+07:00");

function useCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = LAUNCH_DATE.getTime() - now.getTime();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTime({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

export default function ComingSoon() {
  const { days, hours, minutes, seconds } = useCountdown();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    if (!email.includes("@")) return;
    setSubmitted(true);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <main style={{
      minHeight: "100vh",
      background: BG,
      color: TEXT,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "40px 24px",
    }}>

      {/* AMBIENT GLOW */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "900px", height: "500px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: 0, left: "20%", width: "400px", height: "300px", background: "radial-gradient(ellipse at 50% 100%, rgba(6,182,212,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "56px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(37,99,235,0.4)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: "20px", letterSpacing: "-.4px", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span>
      </div>

      {/* BADGE */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, borderRadius: "20px", padding: "5px 14px", fontSize: "11px", fontWeight: 600, color: BLUE_LT, marginBottom: "28px", letterSpacing: ".04em", textTransform: "uppercase" }}>
        <div style={{ width: "6px", height: "6px", background: CYAN, borderRadius: "50%", boxShadow: `0 0 8px ${CYAN}`, animation: "pulse 2s ease-in-out infinite" }} />
        Launching 16 September 2026
      </div>

      {/* HEADLINE */}
      <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.08, color: TEXT, margin: "0 0 16px", letterSpacing: "-1.5px", textAlign: "center", maxWidth: "640px" }}>
  <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span> Launchpad
</h1>

      <p style={{ color: SUB, fontSize: "15px", maxWidth: "420px", margin: "0 0 52px", lineHeight: "1.65", textAlign: "center" }}>
        Deploy tokens on Arc instantly. Trade on bonding curves. Graduate to DEX automatically.
      </p>

      {/* COUNTDOWN */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "52px", flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { value: pad(days),    label: "Days" },
          { value: pad(hours),   label: "Hours" },
          { value: pad(minutes), label: "Minutes" },
          { value: pad(seconds), label: "Seconds" },
        ].map((unit, i) => (
          <div key={unit.label} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: "14px",
                padding: "20px 24px",
                minWidth: "88px",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: TEXT, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {unit.value}
                </div>
              </div>
              <div style={{ fontSize: "11px", color: DIM, marginTop: "8px", textTransform: "uppercase", letterSpacing: ".08em" }}>{unit.label}</div>
            </div>
            {i < 3 && (
              <div style={{ fontSize: "28px", fontWeight: 700, color: BORDER2, marginBottom: "22px" }}>:</div>
            )}
          </div>
        ))}
      </div>

      

      {/* HOW IT WORKS */}
      <div style={{ width: "100%", maxWidth: "480px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "28px", marginBottom: "32px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: TEXT, marginBottom: "24px", textAlign: "center" }}>How ArcBoost works</div>
        {[
          {
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
            title: "Create a token",
            desc: "Fill in your token name, symbol, and image. Pay a small deploy fee (0.001 USDC) and your token is live on Arc instantly — no code required.",
          },
          {
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
            title: "Trade on bonding curve",
            desc: "Anyone can buy or sell the token immediately. Price increases automatically as more people buy — early buyers get the best price.",
          },
          {
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
            title: "Graduate to DEX",
            desc: "When the bonding curve reaches 100%, the token automatically graduates. Liquidity moves to a DEX and trading continues there.",
          },
        ].map((step, i, arr) => (
          <div key={i} style={{ display: "flex", gap: "14px", marginBottom: i < arr.length - 1 ? "20px" : "0" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: BLUE_LT, marginTop: "1px" }}>
              {step.icon}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: TEXT, marginBottom: "4px" }}>{step.title}</div>
              <div style={{ fontSize: "12px", color: SUB, lineHeight: "1.65" }}>{step.desc}</div>
            </div>
          </div>
        ))}

        {/* CTA — disabled */}
        <button disabled style={{ width: "100%", background: BORDER, color: DIM, border: "none", borderRadius: "10px", padding: "13px", fontSize: "14px", fontWeight: 700, cursor: "not-allowed", fontFamily: "inherit", marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Opens 16 September 2026
        </button>
      </div>

      {/* FOOTER */}
      <div style={{ fontSize: "12px", color: DIM, textAlign: "center" }}>
        Built on Arc · {new Date().getFullYear()}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #374151; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}