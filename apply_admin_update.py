import sys

path = "app/admin/page.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

changes = 0

# 1. Tambah emergencyWithdraw ke TOKEN_ABI
old_abi = '''const TOKEN_ABI = [
    { name: "withdrawFunds", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "ethCollected", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "graduated",    type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool"    }] },
] as const;'''

new_abi = '''const TOKEN_ABI = [
    { name: "withdrawFunds", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "emergencyWithdraw", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "ethCollected", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "graduated",    type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool"    }] },
] as const;'''

if content.count(old_abi) == 1:
    content = content.replace(old_abi, new_abi)
    changes += 1
    print("[1/4] OK: emergencyWithdraw ditambahkan ke TOKEN_ABI")
else:
    print(f"[1/4] SKIP: pattern ABI tidak cocok (ditemukan {content.count(old_abi)}x)")

# 2. Update loadStats: reset + hitung activeWithFunds
old_stats = '''      // Hitung total volume & graduated
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
      }));'''

new_stats = '''      // Hitung total volume & graduated
      let vol = 0, grad = 0;
      setActiveWithFunds(0);
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
} else {
  if ((eth as bigint) > BigInt(0)) setActiveWithFunds(prev => prev + 1);
}
        } catch {}
      }));'''

if content.count(old_stats) == 1:
    content = content.replace(old_stats, new_stats)
    changes += 1
    print("[2/4] OK: loadStats() diupdate untuk hitung activeWithFunds")
else:
    print(f"[2/4] SKIP: pattern loadStats tidak cocok (ditemukan {content.count(old_stats)}x)")

# 3. Tambah handleEmergencyWithdraw setelah handleWithdraw
old_handler = '''const handleWithdraw = () => execTx(async () => {
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
});'''

new_handler = old_handler + '''

const handleEmergencyWithdraw = () => execTx(async () => {
  const { createWalletClient, custom } = await import("viem");
  const wc = createWalletClient({ chain: arcTestnet, transport: custom((window as any).ethereum) });
  const addrs = await publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "getAllTokens" });
  let withdrawn = 0;
  for (const addr of addrs) {
    try {
      const graduated = await publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "graduated" });
      if (!graduated) {
        const eth = await publicClient.readContract({ address: addr, abi: TOKEN_ABI, functionName: "ethCollected" });
        if ((eth as bigint) > BigInt(0)) {
          await wc.writeContract({ address: addr, abi: [{ name: "emergencyWithdraw", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }], functionName: "emergencyWithdraw", account: address! });
          withdrawn++;
        }
      }
    } catch {}
  }
  if (withdrawn === 0) throw new Error("No active tokens with funds to withdraw.");
});'''

if content.count(old_handler) == 1:
    content = content.replace(old_handler, new_handler)
    changes += 1
    print("[3/4] OK: handleEmergencyWithdraw ditambahkan")
else:
    print(f"[3/4] SKIP: pattern handleWithdraw tidak cocok (ditemukan {content.count(old_handler)}x)")

# 4. Tambah UI card Emergency Withdraw setelah card Withdraw Graduated Funds
old_ui = '''    {txLoading ? "Processing..." : "Withdraw All Graduated Funds"}
  </button>
</div>

{/* TX FEEDBACK */}'''

new_ui = '''    {txLoading ? "Processing..." : "Withdraw All Graduated Funds"}
  </button>
</div>

{/* EMERGENCY WITHDRAW */}
<div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 20px", marginBottom: "16px" }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
    <div>
      <div style={{ fontSize: "10px", fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "4px" }}>Emergency Withdraw</div>
      <div style={{ fontSize: "12px", color: SUB }}>Tarik dana dari token yang BELUM mencapai grad target. Refund ke buyer harus dilakukan manual.</div>
    </div>
    <div style={{ background: "#3A1D0A", border: "1px solid rgba(251,146,60,0.2)", borderRadius: "8px", padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#FB923C" }}>{loading ? "..." : activeWithFunds}</div>
      <div style={{ fontSize: "10px", color: DIM }}>tokens active</div>
    </div>
  </div>
  <button onClick={handleEmergencyWithdraw} disabled={txLoading || activeWithFunds === 0}
    style={{ width: "100%", background: activeWithFunds > 0 ? "linear-gradient(135deg, #9A3412, #C2410C)" : BORDER2, color: activeWithFunds > 0 ? "#FDBA74" : DIM, border: `1px solid ${activeWithFunds > 0 ? "rgba(251,146,60,0.3)" : "transparent"}`, borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: activeWithFunds > 0 ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
    {txLoading ? "Processing..." : "Emergency Withdraw All Active Tokens"}
  </button>
</div>

{/* TX FEEDBACK */}'''

if content.count(old_ui) == 1:
    content = content.replace(old_ui, new_ui)
    changes += 1
    print("[4/4] OK: UI card Emergency Withdraw ditambahkan")
else:
    print(f"[4/4] SKIP: pattern UI card tidak cocok (ditemukan {content.count(old_ui)}x)")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nTotal: {changes}/4 perubahan berhasil diterapkan.")
if changes < 4:
    print("PERHATIAN: ada perubahan yang di-SKIP — file mungkin sudah berbeda dari yang diharapkan. Cek manual bagian yang di-SKIP.")
    sys.exit(1)
else:
    print("Semua perubahan berhasil diterapkan dengan sempurna.")
