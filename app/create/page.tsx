"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { defineChain } from "viem";

const hyperEvmTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.io"] } },
  testnet: true,
});

const FACTORY_ADDRESS = "0xeF7d51a1b3a2501C6247C4F6f29b558c7F23a115";
const FACTORY_ABI = [
  {
    name: "createToken",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "imageURI", type: "string" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

type SocialKey = "twitter" | "telegram" | "website";

export default function CreateToken() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoError, setLogoError] = useState("");

  const [form, setForm] = useState({
    name: "",
    symbol: "",
    description: "",
    imageURI: "",
    twitter: "",
    telegram: "",
    website: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError("");
    if (!file) return;
    if (file.size > 7 * 1024 * 1024) {
      setLogoError("File too large. Max 7MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, imageURI: (ev.target?.result as string) || "" }));
    };
    reader.readAsDataURL(file);
  };

  const clearField = (name: SocialKey) => {
    setForm(f => ({ ...f, [name]: "" }));
  };

  const handleLaunch = async () => {
    if (!isConnected) return setError("Connect your wallet first!");
    if (!form.name) return setError("Token name is required!");
    if (!form.symbol) return setError("Ticker symbol is required!");

    try {
      setLoading(true);
      setError("");
      setSuccess("");

     const { createWalletClient, custom } = await import("viem");
      const walletClient = createWalletClient({
  chain: hyperEvmTestnet,
  transport: custom(window.ethereum),
});

      await walletClient.writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createToken",
        args: [form.name, form.symbol, form.imageURI, form.description],
        value: parseEther("0.001"),
        account: address!,
      });

      setSuccess("✅ Token deployed successfully!");
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setError(err.message?.slice(0, 120) || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const socials: { key: SocialKey; icon: string; placeholder: string }[] = [
    { key: "twitter", icon: "🐦", placeholder: "@username on Twitter" },
    { key: "telegram", icon: "✈️", placeholder: "@username on Telegram" },
    { key: "website", icon: "🌐", placeholder: "https://your-website.com" },
  ];

  return (
    <div className="page">
      <div className="wrap">

        {/* Breadcrumb */}
        <div className="topbar">
          <span className="link" onClick={() => router.push("/")}>Explore</span>
          <span className="sep">›</span>
          <span style={{ color: "#aaa" }}>Launch token</span>
        </div>

        {/* Header */}
        <div className="page-title">Launch a new token</div>
        <div className="page-sub">Your token will be immediately tradeable after deployment on HyperEVM.</div>

        <div className="layout">
          <div className="form-card">

            {/* Identity */}
            <div className="form-section">
              <div className="sec-label">Token identity</div>
              <div className="logo-row">
                <div>
                  <div className="flbl">
                    <span>Logo <span className="req">*</span></span>
                  </div>
                  <div
                    className={`upload-zone ${form.imageURI ? "has-img" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {form.imageURI ? (
                      <>
                        <img className="upload-preview" src={form.imageURI} alt="Logo" />
                        <div className="change-overlay">
                          <div className="change-label">↻ Change</div>
                        </div>
                      </>
                    ) : (
                      <div className="upload-inner">
                        <div className="upload-icon-wrap">🖼</div>
                        <div className="upload-hint">JPG, PNG, GIF<br />Max 7MB</div>
                        <div className="upload-btn-sm">⬆ Choose file</div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="file-input"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </div>
                  {logoError && <div className="err">{logoError}</div>}
                </div>

                <div>
                  <div className="mb12">
                    <div className="flbl">
                      <span>Ticker symbol <span className="req">*</span></span>
                      <span className="hint">Max 10 chars</span>
                    </div>
                    <div className="input-wrap">
                      <span className="fpre">$</span>
                      <input
                        name="symbol"
                        value={form.symbol}
                        onChange={handleChange}
                        maxLength={10}
                        placeholder=""
                        className="finput has-pre"
                      />
                      <span className="fsuf">{form.symbol.length}/10</span>
                    </div>
                  </div>
                  <div>
                    <div className="flbl">
                      <span>Token name <span className="req">*</span></span>
                      <span className="hint">Max 20 chars</span>
                    </div>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      maxLength={20}
                      placeholder=""
                      className="finput"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-section">
              <div className="sec-label">Description</div>
              <div className="flbl">
                <span>About this token</span>
                <span className="opt-tag">optional</span>
              </div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={1000}
                placeholder="Tell traders about this token — your vision, community, or why they should care..."
                className="textarea"
              />
              <div className="fchar">{form.description.length} / 1000 characters</div>
            </div>

            {/* Social links */}
            <div className="form-section" style={{ borderBottom: "none" }}>
              <div className="sec-label">
                Social links
                <span className="opt-tag" style={{ marginLeft: 4, textTransform: "none", letterSpacing: 0 }}>
                  all optional
                </span>
              </div>
              {socials.map(s => (
                <div className="social-item" key={s.key}>
                  <div className="social-ico">{s.icon}</div>
                  <input
                    className="social-input"
                    value={form[s.key]}
                    onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
                    placeholder={s.placeholder}
                  />
                  {form[s.key] && (
                    <button className="social-clear" onClick={() => clearField(s.key)}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="form-footer">
              <div className="fee-info">
                <span style={{ color: "#22d47e" }}>⚡</span>
                <span>Deploy fee:</span>
                <span className="fee-badge">0.001 ETH</span>
              </div>
              <div className="footer-actions">
                <button className="btn-back" onClick={() => router.push("/")}>
                  ← Back
                </button>
                <button className="btn-deploy" onClick={handleLaunch} disabled={loading}>
                  {loading ? "⏳ Deploying..." : "🚀 Deploy token"}
                </button>
              </div>
            </div>

            {error && <div className="msg msg-err">❌ {error}</div>}
            {success && <div className="msg msg-ok">{success}</div>}
          </div>

          {/* Right column */}
          <div className="right-col">
            <div className="preview-card">
              <div className="preview-lbl">Card preview</div>
              <div className="preview-token">
                <div className="prev-avatar">
                  {form.imageURI ? (
                    <img
                      src={form.imageURI}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                      alt=""
                    />
                  ) : (
                    <span style={{ fontSize: 22, color: "#22d47e" }}>🖼</span>
                  )}
                </div>
                <div className="prev-name" style={{ color: form.name ? "#e8e8e8" : "#2a2a2a" }}>
                  {form.name || "Token Name"}
                </div>
                <div className="prev-sym" style={{ color: form.symbol ? "#22d47e" : "#1a4a2e" }}>
                  {form.symbol ? `$${form.symbol.toUpperCase()}` : "$TICKER"}
                </div>
                <div className="prev-desc" style={{ color: form.description ? "#555" : "#2a2a2a" }}>
                  {form.description || "Description will appear here..."}
                </div>
                <div className="prev-bar-lbl">
                  <span>Bonding curve</span>
                  <span>0%</span>
                </div>
                <div className="prev-bar-bg">
                  <div className="prev-bar-fill" />
                </div>
                <div className="prev-meta">
                  <span>Vol: <span style={{ color: "#666" }}>0 ETH</span></span>
                  <span>Holders: <span style={{ color: "#666" }}>0</span></span>
                </div>
                {(form.twitter || form.telegram || form.website) && (
                  <div className="prev-socials">
                    {form.twitter && <div className="prev-social-chip">🐦 {form.twitter}</div>}
                    {form.telegram && <div className="prev-social-chip">✈️ {form.telegram}</div>}
                    {form.website && <div className="prev-social-chip">🌐 Website</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="info-card">
              <div className="info-lbl">What happens on deploy</div>
              <div className="info-item">
                <div className="info-ico">🪙</div>
                <div className="info-txt">
                  <strong>1 billion tokens minted</strong>
                  Full supply enters the bonding curve
                </div>
              </div>
              <div className="info-item">
                <div className="info-ico">📈</div>
                <div className="info-txt">
                  <strong>Immediately tradeable</strong>
                  Anyone can buy right after deploy
                </div>
              </div>
              <div className="info-item">
                <div className="info-ico">🏆</div>
                <div className="info-txt">
                  <strong>Auto graduation</strong>
                  At 100% bonding curve, LP moves to the DEX
                </div>
              </div>
            </div>

            <div className="warn-card">
              <div className="warn-ico">⚠️</div>
              <div className="warn-txt">
                <strong>Warning</strong>
                Deployed tokens cannot be deleted. Double-check all info before clicking deploy.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .page { background:#0d0d0d; padding:24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color:#e8e8e8; min-height:100vh; }
        .wrap { max-width:900px; margin:0 auto; }

        .topbar { display:flex; align-items:center; gap:8px; margin-bottom:24px; font-size:13px; color:#555; }
        .topbar .link { color:#22d47e; cursor:pointer; }
        .topbar .sep { color:#2a2a2a; }

        .page-title { font-size:22px; font-weight:600; color:#fff; margin-bottom:4px; }
        .page-sub { font-size:13px; color:#555; margin-bottom:28px; }

        .layout { display:grid; grid-template-columns:1fr 272px; gap:16px; align-items:start; }
        .form-card { background:#141414; border:1px solid #1e1e1e; border-radius:14px; overflow:hidden; }
        .form-section { padding:20px 22px; border-bottom:1px solid #111; }
        .sec-label { font-size:11px; font-weight:600; color:#444; text-transform:uppercase; letter-spacing:.07em; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .sec-label::after { content:''; flex:1; height:1px; background:#1e1e1e; }

        .logo-row { display:grid; grid-template-columns:112px 1fr; gap:16px; align-items:start; }
        .upload-zone { border:1.5px dashed #252525; border-radius:12px; cursor:pointer; transition:border-color .15s; background:#111; overflow:hidden; position:relative; aspect-ratio:1; }
        .upload-zone:hover { border-color:#22d47e66; }
        .upload-zone.has-img { border-color:#22d47e44; }
        .upload-inner { padding:16px; text-align:center; }
        .upload-preview { width:100%; height:100%; object-fit:cover; display:block; border-radius:10px; }
        .upload-icon-wrap { width:44px; height:44px; background:#1a1a1a; border-radius:10px; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; color:#444; font-size:20px; }
        .upload-hint { font-size:11px; color:#444; line-height:1.5; margin-bottom:10px; }
        .upload-btn-sm { display:inline-flex; align-items:center; gap:5px; background:#1a2e22; color:#22d47e; border:1px solid #22d47e33; border-radius:6px; padding:5px 12px; font-size:11px; font-weight:500; }
        .file-input { display:none; }
        .change-overlay { position:absolute; inset:0; background:rgba(0,0,0,.6); display:none; align-items:center; justify-content:center; border-radius:10px; cursor:pointer; }
        .upload-zone.has-img:hover .change-overlay { display:flex; }
        .change-label { background:#1a2e22; color:#22d47e; border:1px solid #22d47e44; border-radius:6px; padding:6px 14px; font-size:12px; font-weight:500; }

        .mb12 { margin-bottom:12px; }
        .flbl { font-size:12px; font-weight:500; color:#888; margin-bottom:6px; display:flex; align-items:center; justify-content:space-between; }
        .flbl .req { color:#22d47e; font-size:10px; }
        .flbl .hint { font-size:10px; color:#444; font-weight:400; }
        .opt-tag { font-size:10px; color:#444; background:#1a1a1a; border:1px solid #1e1e1e; border-radius:4px; padding:1px 6px; font-weight:400; }

        .input-wrap { position:relative; }
        .finput { width:100%; background:#111; border:1px solid #252525; border-radius:8px; color:#e8e8e8; font-size:14px; padding:9px 12px; outline:none; transition:border-color .15s; }
        .finput:focus { border-color:#22d47e55; }
        .finput::placeholder { color:#2e2e2e; }
        .finput.has-pre { padding-left:22px; }
        .fpre { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#444; font-size:14px; pointer-events:none; }
        .fsuf { position:absolute; right:10px; top:50%; transform:translateY(-50%); font-size:10px; color:#333; }
        .fchar { text-align:right; font-size:10px; color:#2e2e2e; margin-top:3px; }

        .textarea { width:100%; background:#111; border:1px solid #252525; border-radius:8px; color:#e8e8e8; font-size:13px; padding:10px 12px; outline:none; resize:none; line-height:1.5; transition:border-color .15s; min-height:80px; }
        .textarea:focus { border-color:#22d47e55; }
        .textarea::placeholder { color:#2e2e2e; }

        .social-item { display:flex; align-items:center; background:#111; border:1px solid #252525; border-radius:8px; overflow:hidden; margin-bottom:10px; transition:border-color .15s; }
        .social-item:last-child { margin-bottom:0; }
        .social-item:focus-within { border-color:#22d47e55; }
        .social-ico { width:38px; height:38px; display:flex; align-items:center; justify-content:center; background:#1a1a1a; border-right:1px solid #1e1e1e; flex-shrink:0; font-size:16px; }
        .social-input { flex:1; background:none; border:none; color:#e8e8e8; font-size:13px; padding:0 12px; outline:none; height:38px; }
        .social-input::placeholder { color:#2e2e2e; }
        .social-clear { background:none; border:none; color:#333; padding:0 10px; cursor:pointer; font-size:14px; height:38px; display:flex; align-items:center; }
        .social-clear:hover { color:#666; }

        .form-footer { padding:16px 22px; display:flex; align-items:center; justify-content:space-between; background:#111; border-top:1px solid #1e1e1e; flex-wrap:wrap; gap:12px; }
        .fee-info { display:flex; align-items:center; gap:8px; font-size:12px; color:#555; }
        .fee-badge { background:#1a2e22; color:#22d47e; border:1px solid #22d47e33; border-radius:6px; padding:3px 10px; font-size:12px; font-weight:600; }

        /* Back & Deploy buttons: same height, same visual weight, aligned in one row */
        .footer-actions { display:flex; gap:10px; align-items:stretch; }
        .btn-back, .btn-deploy {
          height:40px;
          border-radius:8px;
          font-size:13px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          transition:all .15s;
          white-space:nowrap;
        }
        .btn-back { background:#1a1a1a; border:1px solid #2a2a2a; color:#aaa; padding:0 18px; }
        .btn-back:hover { border-color:#3a3a3a; color:#e8e8e8; }
        .btn-deploy { background:#22d47e; color:#0d0d0d; border:none; padding:0 26px; font-size:14px; font-weight:700; min-width:172px; box-shadow: 0 0 0 1px #22d47e33; }
        .btn-deploy:hover { opacity:.92; }
        .btn-deploy:disabled { background:#2a2a2a; color:#666; cursor:not-allowed; box-shadow:none; }

        .msg { margin:0 22px 18px; border-radius:8px; padding:10px 14px; font-size:13px; }
        .msg-err { background:#1a0000; border:1px solid #440000; color:#f04a4a; }
        .msg-ok { background:#001a00; border:1px solid #004400; color:#22d47e; }

        .right-col { display:flex; flex-direction:column; gap:12px; position:sticky; top:16px; }
        .preview-card { background:#141414; border:1px solid #1e1e1e; border-radius:14px; padding:16px; }
        .preview-lbl { font-size:11px; font-weight:600; color:#444; text-transform:uppercase; letter-spacing:.07em; margin-bottom:14px; }
        .preview-token { background:#111; border:1px solid #1e1e1e; border-radius:10px; padding:14px; }
        .prev-avatar { width:48px; height:48px; border-radius:12px; background:#1a2e22; display:flex; align-items:center; justify-content:center; margin-bottom:10px; overflow:hidden; }
        .prev-name { font-size:15px; font-weight:600; }
        .prev-sym { font-size:12px; font-weight:600; margin-bottom:6px; }
        .prev-desc { font-size:11px; line-height:1.5; margin-bottom:10px; min-height:32px; }
        .prev-bar-lbl { display:flex; justify-content:space-between; font-size:10px; color:#444; margin-bottom:4px; }
        .prev-bar-bg { background:#1e1e1e; border-radius:3px; height:3px; }
        .prev-bar-fill { height:3px; border-radius:3px; background:#22d47e; width:0%; }
        .prev-meta { display:flex; justify-content:space-between; font-size:11px; color:#444; margin-top:8px; }
        .prev-socials { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
        .prev-social-chip { display:flex; align-items:center; gap:4px; background:#1a1a1a; border:1px solid #252525; border-radius:6px; padding:3px 8px; font-size:11px; color:#666; }

        .info-card { background:#141414; border:1px solid #1e1e1e; border-radius:14px; padding:16px; }
        .info-lbl { font-size:11px; font-weight:600; color:#444; text-transform:uppercase; letter-spacing:.07em; margin-bottom:12px; }
        .info-item { display:flex; align-items:flex-start; gap:10px; margin-bottom:12px; font-size:12px; }
        .info-item:last-child { margin-bottom:0; }
        .info-ico { width:26px; height:26px; border-radius:6px; background:#1a2e22; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
        .info-txt { color:#555; line-height:1.5; }
        .info-txt strong { color:#888; display:block; margin-bottom:1px; font-weight:500; }

        .warn-card { background:#1e140a; border:1px solid #f07a2a22; border-radius:14px; padding:14px; display:flex; gap:10px; }
        .warn-ico { color:#f07a2a; font-size:15px; flex-shrink:0; margin-top:1px; }
        .warn-txt { font-size:11px; color:#7a5030; line-height:1.5; }
        .warn-txt strong { color:#f07a2a; display:block; margin-bottom:2px; font-weight:500; }

        .err { font-size:11px; color:#f04a4a; margin-top:5px; }

        @media (max-width: 720px) {
          .layout { grid-template-columns: 1fr; }
          .right-col { position:static; }
          .form-footer { flex-direction:column; align-items:stretch; }
          .footer-actions { width:100%; }
          .btn-back, .btn-deploy { flex:1; }
        }
      `}</style>
    </div>
  );
}