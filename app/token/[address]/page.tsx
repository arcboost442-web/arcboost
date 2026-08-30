"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPublicClient, http, parseEther, formatEther, defineChain } from "viem";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";

const PriceChart = dynamic(() => import("../../components/PriceChart"), { ssr: false });

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

const TOKEN_ABI = [
  { name: "twitter", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "telegram", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "website", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "description", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "imageURI", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "creator", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "ethCollected", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "graduated", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "buy", type: "function", stateMutability: "payable", inputs: [], outputs: [] },
  { name: "sell", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenAmount", type: "uint256" }], outputs: [] },
  { name: "Buy", type: "event", inputs: [
    { name: "buyer", type: "address", indexed: true },
    { name: "ethIn", type: "uint256", indexed: false },
    { name: "tokensOut", type: "uint256", indexed: false },
  ]},
  { name: "Sell", type: "event", inputs: [
    { name: "seller", type: "address", indexed: true },
    { name: "tokensIn", type: "uint256", indexed: false },
    { name: "ethOut", type: "uint256", indexed: false },
  ]},
] as const;

const BG      = "#08090F";
const CARD    = "#0E1118";
const CARD2   = "#111622";
const BORDER  = "#1C2235";
const BORDER2 = "#232B42";
const BLUE_LT = "#3B82F6";
const BLUE_DIM= "#0F1A35";
const BLUE_B  = "rgba(59,130,246,0.15)";
const CYAN    = "#06B6D4";
const TEXT    = "#F1F5FF";
const SUB     = "#94A3B8";
const DIM     = "#374151";
const RED     = "#EF4444";
const RED_DIM = "#1A0A0A";
const GRAD    = "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";

type TxItem = { type: "BUY"|"SELL"; amount: string; tokens: string; addr: string; };

export default function TokenPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const tokenAddress = params.address as `0x${string}`;

  const [token, setToken]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [bsMode, setBsMode]       = useState<"buy"|"sell">("buy");
  const [buyAmt, setBuyAmt]       = useState("0.1");
  const [sellAmt, setSellAmt]     = useState("1000");
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [myBalance, setMyBal]     = useState("0");
  const [chartData, setChart]     = useState<{time:number;value:number}[]>([]);
  const [txs, setTxs]             = useState<TxItem[]>([]);
  const [slippage, setSlippage]   = useState("1%");
  const [timeframe, setTimeframe] = useState("ALL");
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    loadToken();
    setTimeout(() => loadChartData(), 1500);
    setTimeout(() => loadTxs(), 3000);
  }, []);

  const loadToken = async () => {
    try {
      const [name,symbol,description,imageURI,creator,totalSupply,ethCollected,graduated,twitter,telegram,website] = await Promise.all([
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "name" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "symbol" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "description" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "imageURI" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "creator" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "totalSupply" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "ethCollected" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "graduated" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "twitter" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "telegram" }),
        publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "website" }),
      ]);
      setToken({name,symbol,description,imageURI,creator,totalSupply,ethCollected,graduated,twitter,telegram,website});
      if (address) {
        const bal = await publicClient.readContract({ address: tokenAddress, abi: TOKEN_ABI, functionName: "balanceOf", args: [address] });
        setMyBal(formatEther(bal));
      }
    } catch(e){ console.error(e); }
    finally{ setLoading(false); }
  };

  const loadChartData = async () => {
    try {
      const latest = await publicClient.getBlockNumber();
      const from = latest > BigInt(1000) ? latest - BigInt(1000) : BigInt(0);
      const logs = await publicClient.getLogs({ address: tokenAddress,
        event:{name:"Buy",type:"event",inputs:[{name:"buyer",type:"address",indexed:true},{name:"ethIn",type:"uint256",indexed:false},{name:"tokensOut",type:"uint256",indexed:false}]},
        fromBlock:from, toBlock:latest });
      const pts:{time:number;value:number}[]=[]; let cumE=0,cumT=0;
      for(const l of logs){
        const e=Number(formatEther(l.args.ethIn||BigInt(0)));
        const t=Number(formatEther(l.args.tokensOut||BigInt(0)));
        cumE+=e; cumT+=t;
        const price=cumT>0?cumE/cumT:0;
        const blk=await publicClient.getBlock({blockNumber:l.blockNumber});
        pts.push({time:Number(blk.timestamp),value:price});
      }
      setChart(pts.filter((p,i,a)=>a.findIndex(x=>x.time===p.time)===i));
    } catch{}
  };

  const loadTxs = async () => {
    try {
      const latest = await publicClient.getBlockNumber();
      const from = latest > BigInt(1000) ? latest - BigInt(1000) : BigInt(0);
      const [bl,sl] = await Promise.all([
        publicClient.getLogs({address:tokenAddress,event:{name:"Buy",type:"event",inputs:[{name:"buyer",type:"address",indexed:true},{name:"ethIn",type:"uint256",indexed:false},{name:"tokensOut",type:"uint256",indexed:false}]},fromBlock:from,toBlock:latest}),
        publicClient.getLogs({address:tokenAddress,event:{name:"Sell",type:"event",inputs:[{name:"seller",type:"address",indexed:true},{name:"tokensIn",type:"uint256",indexed:false},{name:"ethOut",type:"uint256",indexed:false}]},fromBlock:from,toBlock:latest}),
      ]);
      setTxs([
        ...bl.map(l=>({type:"BUY" as const, amount:Number(formatEther(l.args.ethIn||BigInt(0))).toFixed(4), tokens:Number(formatEther(l.args.tokensOut||BigInt(0))).toFixed(0), addr:`${l.args.buyer?.slice(0,6)}...${l.args.buyer?.slice(-4)}`})),
        ...sl.map(l=>({type:"SELL" as const, amount:Number(formatEther(l.args.ethOut||BigInt(0))).toFixed(4), tokens:Number(formatEther(l.args.tokensIn||BigInt(0))).toFixed(0), addr:`${l.args.seller?.slice(0,6)}...${l.args.seller?.slice(-4)}`})),
      ].reverse());
    } catch{}
  };

  const exec = async (fn: () => Promise<void>) => {
    if (!isConnected) return setError("Connect wallet first.");
    try {
      setTxLoading(true); setError(""); setSuccess("");
      await new Promise(r => setTimeout(r, 3000));
      await fn();
      await new Promise(r => setTimeout(r, 2000));
      loadToken(); loadChartData(); loadTxs();
    } catch(err:any){ setError(err.message?.slice(0,100)||"Transaction failed."); }
    finally{ setTxLoading(false); }
  };

  const handleBuy = () => exec(async () => {
    const {createWalletClient,custom} = await import("viem");
    const wc = createWalletClient({chain:arcTestnet, transport:custom(window.ethereum)});
    await wc.writeContract({address:tokenAddress, abi:TOKEN_ABI, functionName:"buy", value:parseEther(buyAmt), account:address!});
    setSuccess(`Order filled — ${buyAmt} USDC spent.`);
  });

  const handleSell = () => exec(async () => {
    const {createWalletClient,custom} = await import("viem");
    const wc = createWalletClient({chain:arcTestnet, transport:custom(window.ethereum)});
    await wc.writeContract({address:tokenAddress, abi:TOKEN_ABI, functionName:"sell", args:[parseEther(sellAmt)], account:address!});
    setSuccess(`Order filled — ${sellAmt} ${token?.symbol} sold.`);
  });

  if (loading) return (
    <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}>
      <div style={{color:SUB,fontSize:"13px",letterSpacing:".06em",textTransform:"uppercase"}}>Loading market data...</div>
    </div>
  );
  if (!token) return (
    <div style={{background:BG,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}>
      <div style={{color:SUB,fontSize:"13px"}}>Token not found.</div>
    </div>
  );

  const ethC  = Number(formatEther(token.ethCollected));
  const totSup= Number(formatEther(token.totalSupply));
  const pct   = Math.min((ethC/1)*100,100);
  const price = totSup>0?ethC/totSup:0;

  return (
    <main style={{background:BG,minHeight:"100vh",color:TEXT,fontFamily:"-apple-system,BlinkMacSystemFont,'Inter','SF Pro Display',sans-serif"}}>

      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"600px",height:"300px",background:"radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.08) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {/* TOP NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,borderBottom:`1px solid ${BORDER}`,padding:"0 24px",display:"flex",alignItems:"center",height:"56px",background:"rgba(8,9,15,0.9)",backdropFilter:"blur(16px)",gap:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"9px",marginRight:"8px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"7px",background:GRAD,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{fontWeight:700,fontSize:"15px",background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ArcBoost</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",color:SUB}}>
          <span onClick={()=>router.push("/")} style={{color:BLUE_LT,cursor:"pointer",fontWeight:500}}>Markets</span>
          <span style={{color:DIM}}>/</span>
          <span style={{color:TEXT,fontWeight:500}}>{token.name}</span>
          <span style={{color:DIM}}>/</span>
          <span style={{color:DIM,fontFamily:"monospace",fontSize:"11px"}}>{tokenAddress.slice(0,6)}...{tokenAddress.slice(-4)}</span>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>
          <button onClick={() => {
            navigator.clipboard.writeText(tokenAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }} style={{background:CARD,border:`1px solid ${BORDER2}`,color:copied?BLUE_LT:SUB,borderRadius:"7px",padding:"6px 12px",fontSize:"11px",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px",fontFamily:"inherit"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={() => {
            const url = `${window.location.origin}/token/${tokenAddress}`;
            if (navigator.share) {
              navigator.share({ title: token.name, text: `Check out ${token.name} (${token.symbol}) on ArcBoost!`, url });
            } else {
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }} style={{background:CARD,border:`1px solid ${BORDER2}`,color:SUB,borderRadius:"7px",padding:"6px 12px",fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>
            Share
          </button>
        </div>
      </nav>

      <div style={{maxWidth:"1100px",margin:"0 auto",padding:"24px",position:"relative",zIndex:1}}>

        {/* TOKEN HEADER */}
        <div style={{display:"flex",alignItems:"flex-start",gap:"16px",marginBottom:"20px"}}>
          <div style={{width:"54px",height:"54px",borderRadius:"13px",background:BLUE_DIM,border:`1px solid ${BLUE_B}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
            {token.imageURI
              ? <img src={token.imageURI} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : <span style={{fontSize:"22px",fontWeight:800,color:BLUE_LT}}>{token.symbol?.slice(0,1)}</span>
            }
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",marginBottom:"4px"}}>
              <span style={{fontSize:"22px",fontWeight:700,color:TEXT,letterSpacing:"-.4px"}}>{token.name}</span>
              <span style={{fontSize:"13px",fontWeight:600,color:BLUE_LT,background:BLUE_DIM,border:`1px solid ${BLUE_B}`,borderRadius:"5px",padding:"2px 9px"}}>{token.symbol}</span>
              <span style={{fontSize:"10px",fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",padding:"3px 8px",borderRadius:"4px",
                background:token.graduated?BLUE_DIM:pct>=80?"#0E2420":CARD2,
                color:token.graduated?BLUE_LT:pct>=80?"#34D399":SUB,
                border:`1px solid ${token.graduated?BLUE_B:pct>=80?"rgba(52,211,153,0.15)":BORDER2}`}}>
                {token.graduated?"Graduated":pct>=80?"Near Grad":"Active"}
              </span>
            </div>
            <div style={{fontSize:"11px",color:DIM,fontFamily:"monospace"}}>{tokenAddress}</div>
            {token.description&&<div style={{fontSize:"13px",color:SUB,marginTop:"6px",maxWidth:"560px",lineHeight:"1.6"}}>{token.description}</div>}
          </div>
        </div>

        {/* STATS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"20px"}}>
          {[
            {label:"Price",value:`${price.toFixed(8)} USDC`,sub:"Current",accent:true},
            {label:"Volume",value:`${ethC.toFixed(4)} USDC`,sub:"Total collected"},
            {label:"Circulating",value:Number(totSup.toFixed(0)).toLocaleString(),sub:"Token supply"},
            {label:"Progress",value:`${pct.toFixed(1)}%`,sub:token.graduated?"On DEX":"To graduation",accent:true},
          ].map(s=>(
            <div key={s.label} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"14px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,right:0,width:"50px",height:"50px",background:"radial-gradient(circle at 100% 0%,rgba(37,99,235,0.06) 0%,transparent 70%)"}}/>
              <div style={{fontSize:"10px",color:SUB,textTransform:"uppercase",letterSpacing:".07em",marginBottom:"5px"}}>{s.label}</div>
              <div style={{fontSize:"17px",fontWeight:700,color:s.accent?BLUE_LT:TEXT,letterSpacing:"-.3px"}}>{s.value}</div>
              <div style={{fontSize:"11px",color:DIM,marginTop:"2px"}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* LAYOUT */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 296px",gap:"16px",alignItems:"start"}}>

          {/* LEFT */}
          <div>

            {/* CHART */}
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:"12px",padding:"18px 20px",marginBottom:"14px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:600,color:TEXT}}>Price Chart</div>
                  <div style={{fontSize:"11px",color:DIM,marginTop:"2px"}}>Arc Testnet · USDC pair</div>
                </div>
                <div style={{display:"flex",gap:"2px",background:BG,border:`1px solid ${BORDER}`,borderRadius:"7px",padding:"3px"}}>
                  {["1H","4H","1D","ALL"].map((tf)=>(
                    <button key={tf} onClick={() => setTimeframe(tf)}
                      style={{padding:"4px 10px",borderRadius:"5px",fontSize:"11px",color:timeframe===tf?TEXT:SUB,cursor:"pointer",border:"none",background:timeframe===tf?BORDER2:"none",fontFamily:"inherit"}}>
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              {chartData.length>0
                ? <PriceChart data={chartData}/>
                : <div style={{height:"260px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    <div style={{color:DIM,fontSize:"12px"}}>No price data yet</div>
                    <div style={{color:DIM,fontSize:"11px",opacity:.6}}>Make a trade to generate chart</div>
                  </div>
              }
            </div>

            {/* BONDING CURVE */}
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:"12px",padding:"18px 20px",marginBottom:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:600,color:TEXT}}>Bonding Curve</div>
                  <div style={{fontSize:"11px",color:DIM,marginTop:"2px"}}>Graduates to DEX automatically at 100%</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"20px",fontWeight:800,color:BLUE_LT,letterSpacing:"-.5px"}}>{pct.toFixed(1)}%</div>
                  <div style={{fontSize:"10px",color:DIM}}>filled</div>
                </div>
              </div>
              <div style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:"6px",height:"8px",marginBottom:"14px",overflow:"hidden"}}>
                <div style={{height:"8px",borderRadius:"6px",background:pct>=80?GRAD:BLUE_LT,width:`${pct}%`,transition:"width .5s ease",boxShadow:pct>0?`0 0 12px rgba(37,99,235,0.4)`:undefined}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                {[
                  {label:"Collected",value:`${ethC.toFixed(4)} USDC`},
                  {label:"Target",value:"1.0000 USDC"},
                  {label:"Remaining",value:`${Math.max(1-ethC,0).toFixed(4)} USDC`},
                ].map(s=>(
                  <div key={s.label} style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:"8px",padding:"10px 12px"}}>
                    <div style={{fontSize:"10px",color:DIM,textTransform:"uppercase",letterSpacing:".05em",marginBottom:"4px"}}>{s.label}</div>
                    <div style={{fontSize:"13px",fontWeight:500,color:TEXT}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRANSACTIONS */}
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:"12px",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"center"}}>
                <span style={{fontSize:"12px",fontWeight:600,color:TEXT}}>Transactions</span>
              </div>
              <div style={{padding:"16px"}}>
                <table style={{width:"100%",fontSize:"12px",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>{["Type","Amount","Tokens","Address"].map(h=>(
                      <th key={h} style={{color:DIM,textAlign:"left",padding:"6px 8px",borderBottom:`1px solid ${BORDER}`,fontWeight:500,fontSize:"10px",textTransform:"uppercase",letterSpacing:".05em"}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {txs.length===0
                      ? <tr><td colSpan={4} style={{padding:"24px 8px",color:DIM,textAlign:"center",fontSize:"12px"}}>No transactions in the last 1000 blocks.</td></tr>
                      : txs.map((tx,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${BORDER}`}}>
                          <td style={{padding:"10px 8px"}}>
                            <span style={{fontSize:"10px",fontWeight:600,letterSpacing:".05em",padding:"3px 8px",borderRadius:"4px",
                              background:tx.type==="BUY"?BLUE_DIM:RED_DIM,
                              color:tx.type==="BUY"?BLUE_LT:RED,
                              border:`1px solid ${tx.type==="BUY"?BLUE_B:"rgba(239,68,68,0.15)"}`}}>
                              {tx.type}
                            </span>
                          </td>
                          <td style={{padding:"10px 8px",color:tx.type==="BUY"?BLUE_LT:RED,fontWeight:500}}>{tx.amount} USDC</td>
                          <td style={{padding:"10px 8px",color:SUB}}>{Number(tx.tokens).toLocaleString()}</td>
                          <td style={{padding:"10px 8px",color:DIM,fontFamily:"monospace",fontSize:"11px"}}>{tx.addr}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{position:"sticky",top:"64px",display:"flex",flexDirection:"column",gap:"12px"}}>

            {/* BUY / SELL */}
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:"12px",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${BORDER}`}}>
                {(["buy","sell"] as const).map(m=>(
                  <button key={m} onClick={()=>{setBsMode(m);setError("");setSuccess("");}}
                    style={{flex:1,padding:"13px",fontSize:"13px",fontWeight:600,textTransform:"capitalize",cursor:"pointer",border:"none",fontFamily:"inherit",transition:"all .15s",
                      background:bsMode===m?(m==="buy"?BLUE_DIM:RED_DIM):"none",
                      color:bsMode===m?(m==="buy"?BLUE_LT:RED):SUB,
                      borderBottom:`2px solid ${bsMode===m?(m==="buy"?BLUE_LT:RED):"transparent"}`}}>
                    {m==="buy"?"Buy":"Sell"}
                  </button>
                ))}
              </div>
              <div style={{padding:"16px"}}>
                <div style={{fontSize:"10px",color:SUB,textTransform:"uppercase",letterSpacing:".07em",marginBottom:"6px"}}>
                  {bsMode==="buy"?"Amount (USDC)":`Amount (${token.symbol})`}
                </div>
                <div style={{background:BG,border:`1px solid ${BORDER2}`,borderRadius:"8px",display:"flex",alignItems:"center",padding:"10px 13px",marginBottom:"10px"}}>
                  <input type="number" value={bsMode==="buy"?buyAmt:sellAmt}
                    onChange={e=>bsMode==="buy"?setBuyAmt(e.target.value):setSellAmt(e.target.value)}
                    style={{flex:1,background:"none",border:"none",color:TEXT,fontSize:"18px",fontWeight:700,outline:"none",fontFamily:"inherit",width:"100%"}}/>
                  <span style={{color:SUB,fontSize:"12px",fontWeight:500}}>{bsMode==="buy"?"USDC":token.symbol}</span>
                </div>

                {bsMode==="buy"&&(
                  <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
                    {["0.01","0.1","0.5","1.0"].map(p=>(
                      <button key={p} onClick={()=>setBuyAmt(p)}
                        style={{flex:1,background:buyAmt===p?BLUE_DIM:BG,border:`1px solid ${buyAmt===p?BLUE_B:BORDER2}`,borderRadius:"6px",padding:"6px 0",fontSize:"11px",color:buyAmt===p?BLUE_LT:DIM,cursor:"pointer",fontFamily:"inherit",fontWeight:buyAmt===p?600:400,transition:"all .15s"}}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:"8px",padding:"12px",marginBottom:"12px"}}>
                  {[
                    {label:"You receive",value:bsMode==="buy"?`~${(Number(buyAmt)/(price||0.000001)).toFixed(0)} ${token.symbol}`:`~${(Number(sellAmt)*price).toFixed(6)} USDC`,blue:true},
                    {label:"Price per token",value:`${price.toFixed(8)} USDC`},
                    {label:"Platform fee",value:"1.0%"},
                    {label:"Your balance",value:`${Number(myBalance).toFixed(2)} ${token.symbol}`},
                  ].map(row=>(
                    <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:"12px"}}>
                      <span style={{color:DIM}}>{row.label}</span>
                      <span style={{color:row.blue?CYAN:SUB,fontWeight:row.blue?600:400}}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {error&&<div style={{background:RED_DIM,border:"1px solid rgba(239,68,68,0.15)",borderRadius:"7px",padding:"10px 12px",color:RED,fontSize:"12px",marginBottom:"10px",lineHeight:"1.5"}}>{error}</div>}
                {success&&<div style={{background:BLUE_DIM,border:`1px solid ${BLUE_B}`,borderRadius:"7px",padding:"10px 12px",color:CYAN,fontSize:"12px",marginBottom:"10px"}}>{success}</div>}

                <button onClick={bsMode==="buy"?handleBuy:handleSell} disabled={txLoading||token.graduated}
                  style={{width:"100%",background:txLoading?BORDER2:bsMode==="buy"?GRAD:"linear-gradient(135deg,#EF4444,#DC2626)",
                    color:txLoading?DIM:"#fff",border:"none",borderRadius:"9px",padding:"14px",fontSize:"14px",fontWeight:700,
                    cursor:txLoading?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
                    boxShadow:txLoading?"none":bsMode==="buy"?"0 4px 20px rgba(37,99,235,0.3)":"0 4px 20px rgba(239,68,68,0.25)",
                    transition:"all .15s",marginBottom:"12px"}}>
                  {txLoading?(
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Processing...
                    </>
                  ):token.graduated?"Trade on DEX":bsMode==="buy"?`Buy ${token.symbol}`:`Sell ${token.symbol}`}
                </button>

                <div style={{background:BG,border:`1px solid ${BORDER}`,borderRadius:"10px",padding:"12px",marginTop:"8px"}}>
  <div style={{fontSize:"12px",fontWeight:600,color:TEXT,marginBottom:"10px"}}>Slippage Tolerance</div>
  <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
    {["1%","5%","10%","20%","49%"].map((s)=>(
      <button key={s} onClick={() => { setSlippage(s); }}
        style={{flex:1,padding:"7px 0",borderRadius:"7px",fontSize:"11px",fontWeight:600,cursor:"pointer",border:"none",fontFamily:"inherit",transition:"all .15s",
          background:slippage===s?"#D97706":CARD2,
          color:slippage===s?"#fff":SUB}}>
        {s}
      </button>
    ))}
  </div>
  <div style={{display:"flex",alignItems:"center",background:CARD2,border:`1px solid ${BORDER2}`,borderRadius:"7px",overflow:"hidden"}}>
    <input
      type="number"
      value={slippage.replace("%","")}
      onChange={e => setSlippage(e.target.value + "%")}
      min="0.1" max="100" step="0.1"
      style={{flex:1,background:"none",border:"none",color:TEXT,fontSize:"14px",padding:"8px 12px",outline:"none",fontFamily:"inherit"}}
    />
    <span style={{padding:"0 12px",color:SUB,fontSize:"13px",fontWeight:500}}>%</span>
  </div>
  <div style={{fontSize:"10px",color:DIM,marginTop:"7px"}}>Higher slippage = better chance of success, but worse price</div>
</div>
              </div>
            </div>

            {/* TOKEN INFO */}
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:"12px",padding:"14px 16px"}}>
              <div style={{fontSize:"10px",fontWeight:600,color:DIM,textTransform:"uppercase",letterSpacing:".07em",marginBottom:"12px"}}>Token Info</div>
              {[
                {label:"Creator",value:`${token.creator.slice(0,6)}...${token.creator.slice(-4)}`,mono:true},
                {label:"Contract",value:`${tokenAddress.slice(0,6)}...${tokenAddress.slice(-4)}`,mono:true},
                {label:"Max Supply",value:"1,000,000,000"},
                {label:"Network",value:"Arc Testnet",blue:true},
                {label:"Status",value:token.graduated?"Graduated":"Bonding Curve",blue:true},
              ].map((row,i,arr)=>(
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none",fontSize:"12px"}}>
                  <span style={{color:DIM}}>{row.label}</span>
                  <span style={{color:row.blue?BLUE_LT:SUB,fontFamily:row.mono?"monospace":"inherit",fontSize:row.mono?"11px":"12px",fontWeight:row.blue?500:400}}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* LINKS */}
            <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:"12px",padding:"14px 16px"}}>
              <div style={{fontSize:"10px",fontWeight:600,color:DIM,textTransform:"uppercase",letterSpacing:".07em",marginBottom:"12px"}}>Links</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                {[
                  { label: "Explorer", url: `https://testnet.arcscan.app/address/${tokenAddress}`, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
                  { label: "Twitter", url: token.twitter || null, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.402 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63z"/></svg> },
                  { label: "Telegram", url: token.telegram || null, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 5L2 12.5l7 1M21 5l-5 15-5.5-5M21 5L9 13.5"/></svg> },
                ].map(l => (
                  l.url ? (
                    <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      <button style={{ background: BG, border: `1px solid ${BORDER2}`, borderRadius: "7px", padding: "9px", fontSize: "11px", color: SUB, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", fontFamily: "inherit", transition: "all .15s", width: "100%" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BLUE_B; (e.currentTarget as HTMLButtonElement).style.color = BLUE_LT; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER2; (e.currentTarget as HTMLButtonElement).style.color = SUB; }}>
                        {l.icon}{l.label}
                      </button>
                    </a>
                  ) : (
                    <button key={l.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "7px", padding: "9px", fontSize: "11px", color: DIM, cursor: "not-allowed", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", fontFamily: "inherit", opacity: 0.4, width: "100%" }}>
                      {l.icon}{l.label}
                    </button>
                  )
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}*{box-sizing:border-box;}input::placeholder{color:#374151;}`}</style>
    </main>
  );
}