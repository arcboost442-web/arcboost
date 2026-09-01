"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseEther, defineChain } from "viem";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.io"] } },
  testnet: true,
});

const FACTORY_ADDRESS = "0xe14e152E67252CD98EE153a5c1DE8E90997aE802" as const;
const FACTORY_ABI = [
  { name: "createToken", type: "function", stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" }, { name: "symbol", type: "string" },
      { name: "imageURI", type: "string" }, { name: "description", type: "string" },
      { name: "twitter", type: "string" }, { name: "telegram", type: "string" },
      { name: "website", type: "string" },
    ], outputs: [{ name: "", type: "address" }] },
] as const;

const BG      = "#08090F";
const CARD    = "#0E1118";
const CARD2   = "#111622";
const BORDER  = "#1C2235";
const BORDER2 = "#232B42";
const BLUE    = "#2563EB";
const BLUE_LT = "#3B82F6";
const BLUE_DIM= "#0F1A35";
const BLUE_B  = "rgba(59,130,246,0.15)";
const CYAN    = "#06B6D4";
const TEXT    = "#F1F5FF";
const SUB     = "#94A3B8";
const DIM     = "#374151";
const GRAD    = "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";

export default function CreateToken() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [focusField, setFocusField] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
  name: "", symbol: "", description: "", imageURI: "",
  twitter: "", telegram: "", website: "",
});

  useEffect(() => { setMounted(true); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const MAX = 512;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = (h / w) * MAX; w = MAX; }
        else { w = (w / h) * MAX; h = MAX; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        resolve(new File([blob!], file.name, { type: "image/jpeg" }));
      }, "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
};

const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 7 * 1024 * 1024) return setError("File too large. Max 7MB.");

  // Preview lokal dulu
  const reader = new FileReader();
  reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
  reader.readAsDataURL(file);

  // Upload ke Pinata
  try {
    setUploading(true);
        const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressed);

    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.url) {
      setLogoPreview(data.url); // ganti preview ke IPFS URL
      setForm(prev => ({ ...prev, imageURI: data.url }));
    } else {
      setError("Upload gagal. Coba lagi.");
    }
  } catch {
    setError("Upload gagal. Coba lagi.");
  } finally {
    setUploading(false);
  }
};

  const handleLaunch = async () => {
    if (!isConnected) return setError("Connect wallet first.");
    if (!form.name.trim()) return setError("Token name is required.");
    if (!form.symbol.trim()) return setError("Ticker symbol is required.");
    try {
      setUploading(true); setError(""); setSuccess("");
      await new Promise(r => setTimeout(r, 800));
      const { createWalletClient, custom } = await import("viem");
      const walletClient = createWalletClient({ chain: arcTestnet, transport: custom((window as any).ethereum) });
      await walletClient.writeContract({
        address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "createToken",
args: [form.name, form.symbol, form.imageURI || logoPreview, form.description, form.twitter, form.telegram, form.website],        value: parseEther("0.001"), account: address!,
      });
      setSuccess("Token deployed successfully. Redirecting...");
      setTimeout(() => router.push("/"), 2500);
    } catch (err: any) {
      setError(err.message?.slice(0, 140) || "An error occurred.");
    } finally { setUploading(false); }
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%", background: "#050A14", border: `1px solid ${focusField === name ? "rgba(59,130,246,0.4)" : BORDER}`,
    borderRadius: "8px", color: TEXT, fontSize: "14px", padding: "10px 13px",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    boxShadow: focusField === name ? "0 0 0 3px rgba(59,130,246,0.06)" : "none",
    transition: "all .15s",
  });

  return (
    <main style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif", padding: "0 0 60px" }}>

      {/* AMBIENT */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "600px", height: "300px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* NAVBAR */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 24px", display: "flex", alignItems: "center", height: "56px", background: "rgba(8,9,15,0.9)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100, gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginRight: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "15px", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
          <span onClick={() => router.push("/")} style={{ color: BLUE_LT, cursor: "pointer", fontWeight: 500 }}>Markets</span>
          <span style={{ color: DIM }}>/</span>
          <span style={{ color: TEXT, fontWeight: 500 }}>Launch Token</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          {mounted && isConnected ? (
            <div style={{ background: CARD, border: `1px solid ${BORDER2}`, borderRadius: "8px", padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", background: "#34D399", borderRadius: "50%", boxShadow: "0 0 6px #34D399" }} />
              <span style={{ color: SUB, fontFamily: "monospace" }}>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "#EF4444", background: "#1A0A0A", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "7px", padding: "6px 12px" }}>
              Wallet not connected
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "28px 24px", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: TEXT, marginBottom: "5px", letterSpacing: "-.4px" }}>Launch a new token</div>
          <div style={{ fontSize: "13px", color: SUB }}>Your token will be immediately tradeable on Arc after deployment.</div>
        </div>

        {/* STEPS */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}>
          {[
            { n: "1", label: "Token identity", state: "done" },
            { n: "2", label: "Social & details", state: "active" },
            { n: "3", label: "Review & deploy", state: "idle" },
          ].map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, flexShrink: 0,
                  background: s.state === "done" ? GRAD : s.state === "active" ? BLUE_DIM : "#161616",
                  color: s.state === "done" ? "#fff" : s.state === "active" ? BLUE_LT : DIM,
                  border: s.state === "idle" ? `1px solid ${BORDER2}` : "none",
                }}>
                  {s.state === "done" ? (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : s.n}
                </div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: s.state === "idle" ? DIM : s.state === "done" ? BLUE_LT : TEXT, whiteSpace: "nowrap" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: "1px", background: BORDER, margin: "0 10px" }} />}
            </div>
          ))}
        </div>

        {/* LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 272px", gap: "16px", alignItems: "start" }}>

          {/* FORM */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>

            {/* SECTION: Identity */}
            <div style={{ padding: "22px", borderBottom: `1px solid #0D1120` }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
                Token identity <div style={{ flex: 1, height: "1px", background: BORDER }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "112px 1fr", gap: "16px", alignItems: "start" }}>

                {/* Upload */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 500, color: SUB, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    Logo <span style={{ color: BLUE_LT }}>*</span>
                  </div>
                  <div onClick={() => !uploading && fileRef.current?.click()}
  style={{ border: `1.5px dashed ${logoPreview ? BLUE_B : BORDER2}`, borderRadius: "12px", background: "#050A14", cursor: uploading ? "wait" : "pointer", overflow: "hidden", transition: "border-color .15s" }}
  onMouseEnter={e => !uploading && ((e.currentTarget as HTMLDivElement).style.borderColor = BLUE_B)}
  onMouseLeave={e => !uploading && ((e.currentTarget as HTMLDivElement).style.borderColor = logoPreview ? BLUE_B : BORDER2)}>
  {uploading ? (
    <div style={{ padding: "24px 16px", textAlign: "center" }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BLUE_LT} strokeWidth="2" style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px", display: "block" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <div style={{ fontSize: "10px", color: SUB }}>Uploading to IPFS...</div>
    </div>
  ) : logoPreview ? (
    <img src={logoPreview} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", borderRadius: "10px" }} />
  ) : (
    <div style={{ padding: "16px", textAlign: "center" }}>
      <div style={{ width: "40px", height: "40px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BLUE_LT} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      </div>
      <div style={{ fontSize: "10px", color: DIM, lineHeight: "1.5", marginBottom: "8px" }}>JPG, PNG, GIF<br/>Max 7MB</div>
      <div style={{ background: BLUE_DIM, color: BLUE_LT, border: `1px solid ${BLUE_B}`, borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: 500, display: "inline-block" }}>Choose file</div>
    </div>
  )}
  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
</div>
                </div>

                {/* Symbol + Name */}
                <div>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 500, color: SUB }}>Ticker symbol <span style={{ color: BLUE_LT }}>*</span></span>
                      <span style={{ fontSize: "10px", color: DIM }}>{form.symbol.length}/10</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: DIM, fontSize: "14px", fontWeight: 600 }}>$</span>
                      <input name="symbol" value={form.symbol} onChange={handleChange} maxLength={10} placeholder=""
                        onFocus={() => setFocusField("symbol")} onBlur={() => setFocusField("")}
                        style={{ ...inputStyle("symbol"), paddingLeft: "24px", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 500, color: SUB }}>Token name <span style={{ color: BLUE_LT }}>*</span></span>
                      <span style={{ fontSize: "10px", color: DIM }}>{form.name.length}/20</span>
                    </div>
                    <input name="name" value={form.name} onChange={handleChange} maxLength={20} placeholder=""
                      onFocus={() => setFocusField("name")} onBlur={() => setFocusField("")}
                      style={inputStyle("name")} />
                  </div>
                </div>
              </div>

    

            {/* SECTION: Description */}
            <div style={{ padding: "22px", borderBottom: `1px solid #0D1120` }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
                Description <div style={{ flex: 1, height: "1px", background: BORDER }} />
              </div>
              <div style={{ fontSize: "11px", fontWeight: 500, color: SUB, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                About this token
                <span style={{ fontSize: "10px", color: DIM, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "1px 6px", fontWeight: 400 }}>optional</span>
              </div>
              <textarea name="description" value={form.description} onChange={handleChange} maxLength={1000}
                placeholder="Tell traders about this token — your vision, community, or why they should care..."
                onFocus={() => setFocusField("desc")} onBlur={() => setFocusField("")}
                style={{ ...inputStyle("desc"), resize: "none", minHeight: "88px", lineHeight: "1.6", fontSize: "13px" } as React.CSSProperties} />
              <div style={{ textAlign: "right", fontSize: "10px", color: BORDER2, marginTop: "4px" }}>{form.description.length} / 1000</div>
            </div>

            {/* SECTION: Social */}
            <div style={{ padding: "22px", borderBottom: `1px solid #0D1120` }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
                Social links
                <span style={{ fontSize: "10px", color: DIM, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "1px 6px", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>all optional</span>
                <div style={{ flex: 1, height: "1px", background: BORDER }} />
              </div>
              {[
                { name: "twitter", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill={SUB}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.402 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63z"/></svg>, placeholder: "@username on X / Twitter" },
                { name: "telegram", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.8"><path d="M21 5L2 12.5l7 1M21 5l-5 15-5.5-5M21 5L9 13.5"/></svg>, placeholder: "@username on Telegram" },
                { name: "website", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, placeholder: "https://your-website.com" },
              ].map(s => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", background: "#050A14", border: `1px solid ${focusField === s.name ? "rgba(59,130,246,0.3)" : BORDER}`, borderRadius: "8px", overflow: "hidden", marginBottom: "10px", transition: "border-color .15s" }}>
                  <div style={{ width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", background: CARD2, borderRight: `1px solid ${BORDER}`, flexShrink: 0 }}>{s.icon}</div>
                  <input name={s.name} value={(form as any)[s.name]} onChange={handleChange} placeholder={s.placeholder}
                    onFocus={() => setFocusField(s.name)} onBlur={() => setFocusField("")}
                    style={{ flex: 1, background: "none", border: "none", color: TEXT, fontSize: "13px", padding: "0 12px", outline: "none", height: "38px", fontFamily: "inherit" }} />
                  {(form as any)[s.name] && (
                    <button onClick={() => setForm({ ...form, [s.name]: "" })} style={{ background: "none", border: "none", color: DIM, padding: "0 10px", cursor: "pointer", height: "38px", display: "flex", alignItems: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#050A14", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: SUB }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Deploy fee:
                <span style={{ background: BLUE_DIM, color: CYAN, border: `1px solid rgba(6,182,212,0.2)`, borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>0.001 USDC</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => router.push("/")}
                  style={{ height: "38px", background: CARD2, border: `1px solid ${BORDER2}`, color: SUB, borderRadius: "8px", padding: "0 18px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  Back
                </button>
                <button onClick={handleLaunch} disabled={uploading}
                  style={{ height: "38px", background: uploading ? BORDER2 : GRAD, color: uploading ? DIM : "#fff", border: "none", borderRadius: "8px", padding: "0 24px", fontSize: "13px", fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "inherit", minWidth: "140px", justifyContent: "center", boxShadow: uploading ? "none" : "0 4px 20px rgba(37,99,235,0.35)", transition: "all .15s" }}>
                  {uploading ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Deploying...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                      Deploy token
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && <div style={{ margin: "0 22px 18px", background: "#1A0A0A", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "11px 14px", color: "#EF4444", fontSize: "12px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              {error}
            </div>}
            {success && <div style={{ margin: "0 22px 18px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, borderRadius: "8px", padding: "11px 14px", color: CYAN, fontSize: "12px", display: "flex", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              {success}
            </div>}
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "64px" }}>

            {/* PREVIEW */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "14px" }}>Card preview</div>
              <div style={{ background: "#050A14", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "11px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px", overflow: "hidden" }}>
                  {logoPreview || form.imageURI
                    ? <img src={logoPreview || form.imageURI} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontWeight: 800, fontSize: "18px", color: BLUE_LT }}>{form.symbol?.slice(0, 1) || "?"}</span>
                  }
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: form.name ? TEXT : BORDER2, letterSpacing: "-.2px" }}>{form.name || "Token Name"}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: form.symbol ? BLUE_LT : BORDER2, marginBottom: "6px" }}>{form.symbol ? `$${form.symbol.toUpperCase()}` : "$TICKER"}</div>
                <div style={{ fontSize: "11px", color: form.description ? SUB : BORDER2, lineHeight: "1.5", marginBottom: "10px", minHeight: "30px" }}>
                  {form.description || "Description will appear here..."}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: DIM, marginBottom: "4px" }}>
                  <span style={{ textTransform: "uppercase", letterSpacing: ".05em" }}>Bonding curve</span><span>0%</span>
                </div>
                <div style={{ background: "#0A0F1E", border: `1px solid ${BORDER}`, borderRadius: "3px", height: "3px", marginBottom: "8px" }}>
                  <div style={{ height: "3px", borderRadius: "3px", background: BLUE_LT, width: "0%" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: DIM }}>
                  <span>Vol: 0 USDC</span><span>Holders: 0</span>
                </div>
                {(form.twitter || form.telegram || form.website) && (
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                    {form.twitter && <span style={{ fontSize: "10px", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "5px", padding: "2px 7px", color: SUB }}>X</span>}
                    {form.telegram && <span style={{ fontSize: "10px", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "5px", padding: "2px 7px", color: SUB }}>TG</span>}
                    {form.website && <span style={{ fontSize: "10px", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "5px", padding: "2px 7px", color: SUB }}>Web</span>}
                  </div>
                )}
              </div>
            </div>

            {/* INFO */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "14px" }}>What happens on deploy</div>
              {[
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, title: "1 billion tokens minted", desc: "Full supply enters the bonding curve" },
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title: "Immediately tradeable", desc: "Anyone can buy right after deploy" },
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>, title: "Auto graduation", desc: "LP moves to DEX at 100%" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: i < 2 ? "12px" : "0" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{item.icon}</div>
                  <div style={{ fontSize: "12px", color: SUB, lineHeight: "1.5" }}>
                    <strong style={{ color: TEXT, display: "block", marginBottom: "1px", fontWeight: 500, fontSize: "12px" }}>{item.title}</strong>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* WARNING */}
            <div style={{ background: "#100D00", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "14px", padding: "14px", display: "flex", gap: "10px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div style={{ fontSize: "11px", color: "#92400E", lineHeight: "1.6" }}>
                <strong style={{ color: "#FBBF24", display: "block", marginBottom: "2px", fontWeight: 600 }}></strong>
                Deployed tokens cannot be deleted. Double-check all information before clicking deploy.
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}*{box-sizing:border-box;}input::placeholder,textarea::placeholder{color:#2A3A5C;}`}</style>
      </div>
    </main>
  );
}
