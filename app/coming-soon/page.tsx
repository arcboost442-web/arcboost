"use client";
import { getSupabase } from "../lib/supabase";
import { useState, useEffect } from "react";

const BG     = "#08090F";
const CARD   = "#0E1118";
const CARD2  = "#111622";
const BORDER = "#1C2235";
const BORDER2= "#232B42";
const BLUE   = "#2563EB";
const BLUE_LT= "#3B82F6";
const BLUE_DIM="#0F1A35";
const BLUE_B = "rgba(59,130,246,0.15)";
const CYAN   = "#06B6D4";
const TEXT   = "#F1F5FF";
const SUB    = "#94A3B8";
const DIM    = "#374151";
const GRAD   = "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)";
const GREEN  = "#22C55E";
const GREEN_DIM = "#052010";
const GREEN_B= "rgba(34,197,94,0.15)";

const LAUNCH_DATE = new Date("2026-09-16T00:00:00Z");

const TASKS = [
  {
    id: 1,
    title: "Follow @BOOSTARCC",
    desc: "Follow the official ArcBoost account on X.",
    action: "Open profile",
    url: "https://x.com/BOOSTARCC",
    cta: "I followed",
  },
  {
    id: 2,
    title: "Like the launch post",
    desc: "Find and like the pinned announcement post.",
    action: "Open post",
    url: "https://x.com/BOOSTARCC/status/2094723528461304120/status/2094723528461304120/status/2094723528461304120",
    cta: "I liked it",
  },
  {
    id: 3,
    title: "Repost it",
    desc: "Repost the announcement to your followers.",
    action: "Open post",
    url: "https://x.com/BOOSTARCC/status/2094723528461304120/status/2094723528461304120/status/2094723528461304120",
    cta: "I reposted",
  },
  {
    id: 4,
    title: 'Comment "Don’t fade the BOOST ⚡️
#arcBOOST #arc"',
    desc: 'Leave a comment saying "ArcBoost" on the post.',
    action: "Open post",
    url: "https://x.com/BOOSTARCC/status/2094723528461304120/status/2094723528461304120/status/2094723528461304120",
    cta: "I commented",
  },
  {
    id: 5,
    title: "Submit your details",
    desc: "Enter your X handle and Arc wallet address to secure your spot.",
    action: null,
    url: null,
    cta: "Join waitlist",
  },
];

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [activeTask, setActiveTask] = useState(1);
  const [handle, setHandle] = useState("");
  const [wallet, setWallet] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openedUrl, setOpenedUrl] = useState<number|null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load dari localStorage
    const saved = localStorage.getItem("arcboost_waitlist_tasks");
    if (saved) {
      const data = JSON.parse(saved);
      setCompletedTasks(data.completed || []);
      setActiveTask(data.active || 1);
      setSubmitted(data.submitted || false);
    }

    const tick = () => {
      const now = new Date();
      const diff = LAUNCH_DATE.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const saveProgress = (completed: number[], active: number, isSubmitted: boolean) => {
    localStorage.setItem("arcboost_waitlist_tasks", JSON.stringify({
      completed, active, submitted: isSubmitted,
    }));
  };

  const handleOpenUrl = (taskId: number, url: string) => {
    window.open(url, "_blank");
    setOpenedUrl(taskId);
  };

  const handleComplete = (taskId: number) => {
    if (taskId !== activeTask) return;
    if (taskId < 5 && !openedUrl) return; // harus buka link dulu

    const newCompleted = [...completedTasks, taskId];
    const newActive = taskId + 1;
    setCompletedTasks(newCompleted);
    setActiveTask(newActive);
    setOpenedUrl(null);
    saveProgress(newCompleted, newActive, submitted);
  };

  const handleSubmit = async () => {
  if (!handle.trim()) return setError("Please enter your X handle.");
  if (!wallet.trim()) return setError("Please enter your Arc wallet address.");
  if (!wallet.startsWith("0x") || wallet.length !== 42) return setError("Invalid wallet address. Must start with 0x and be 42 characters.");

  setSubmitting(true);
  setError("");
    const supabase = getSupabase();

  try {
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert([{
        handle: handle.trim().replace("@", "").toLowerCase(),
        wallet: wallet.trim().toLowerCase(),
      }]);

    if (dbError) {
      if (dbError.code === "23505") {
        return setError("This wallet address is already on the waitlist.");
      }
      throw dbError;
    }

    // Simpan juga ke localStorage sebagai backup
    localStorage.setItem("arcboost_waitlist_entry", JSON.stringify({
      handle: handle.trim(),
      wallet: wallet.trim(),
      timestamp: new Date().toISOString(),
    }));

    const newCompleted = [...completedTasks, 5];
    setCompletedTasks(newCompleted);
    setSubmitted(true);
    saveProgress(newCompleted, 6, true);

  } catch (err: any) {
    setError(err.message || "Something went wrong. Try again.");
  } finally {
    setSubmitting(false);
  }
};

  const pad = (n: number) => String(n).padStart(2, "0");

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px", minWidth: "72px", textAlign: "center" }}>
        <span style={{ fontSize: "36px", fontWeight: 800, color: TEXT, fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>{pad(value)}</span>
      </div>
      <span style={{ fontSize: "10px", color: DIM, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</span>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      {/* Ambient */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.1) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "520px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "48px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: "20px", background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ArcBoost</span>
        </div>

        {/* Launch badge */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: BLUE_DIM, border: `1px solid ${BLUE_B}`, borderRadius: "20px", padding: "5px 14px", fontSize: "11px", fontWeight: 600, color: BLUE_LT, letterSpacing: ".05em", textTransform: "uppercase" }}>
            <div style={{ width: "6px", height: "6px", background: CYAN, borderRadius: "50%", boxShadow: `0 0 8px ${CYAN}` }} />
            Launching 16 September 2026
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "38px", fontWeight: 800, lineHeight: 1.1, color: TEXT, margin: "0 0 12px", letterSpacing: "-1.5px" }}>
            The waitlist<br/>
            <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>is open.</span>
          </h1>
          <p style={{ color: SUB, fontSize: "14px", lineHeight: "1.65", margin: 0 }}>
            Complete four quick tasks on X, then drop your wallet. Early supporters get priority access on launch day.
          </p>
        </div>

        {/* Countdown */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "flex-start", marginBottom: "48px" }}>
          <TimeBox value={timeLeft.days} label="Days" />
          <div style={{ fontSize: "28px", fontWeight: 700, color: DIM, marginTop: "14px" }}>:</div>
          <TimeBox value={timeLeft.hours} label="Hours" />
          <div style={{ fontSize: "28px", fontWeight: 700, color: DIM, marginTop: "14px" }}>:</div>
          <TimeBox value={timeLeft.minutes} label="Minutes" />
          <div style={{ fontSize: "28px", fontWeight: 700, color: DIM, marginTop: "14px" }}>:</div>
          <TimeBox value={timeLeft.seconds} label="Seconds" />
        </div>

        {/* Submitted state */}
        {submitted ? (
          <div style={{ background: GREEN_DIM, border: `1px solid ${GREEN_B}`, borderRadius: "16px", padding: "32px 24px", textAlign: "center" }}>
            <div style={{ width: "52px", height: "52px", background: "rgba(34,197,94,0.1)", border: `1px solid ${GREEN_B}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: TEXT, marginBottom: "8px" }}>You are on the list.</div>
            <div style={{ fontSize: "13px", color: SUB, lineHeight: "1.6" }}>
              We have your wallet address saved. You will get priority access when ArcBoost launches on 16 September 2026.
            </div>
            <div style={{ marginTop: "20px", padding: "12px 16px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "8px", fontSize: "12px", color: DIM }}>
              We store your X handle, wallet address, and a hashed timestamp. Nothing on this page touches a contract or asks you to sign anything.
            </div>
          </div>
        ) : (

          /* TASKS */
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

            {/* Step indicator */}
            <div style={{ fontSize: "11px", color: DIM, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "16px" }}>
              step {Math.min(activeTask, 5)} of 5
            </div>

            {TASKS.map((task, idx) => {
              const isCompleted = completedTasks.includes(task.id);
              const isActive = task.id === activeTask;
              const isLocked = task.id > activeTask;

              return (
                <div key={task.id} style={{ position: "relative" }}>
                  {/* Connector line */}
                  {idx < TASKS.length - 1 && (
                    <div style={{ position: "absolute", left: "19px", top: "52px", width: "2px", height: "calc(100% - 16px)", background: isCompleted ? `linear-gradient(${BLUE_LT}, ${BORDER})` : BORDER, zIndex: 0 }} />
                  )}

                  <div style={{ display: "flex", gap: "14px", marginBottom: "12px", position: "relative", zIndex: 1 }}>
                    {/* Step circle */}
                    <div style={{ flexShrink: 0, width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700,
                      background: isCompleted ? GRAD : isActive ? BLUE_DIM : CARD,
                      border: `2px solid ${isCompleted ? "transparent" : isActive ? BLUE_LT : BORDER}`,
                      color: isCompleted ? "#fff" : isActive ? BLUE_LT : DIM,
                      transition: "all .3s",
                    }}>
                      {isCompleted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      ) : task.id}
                    </div>

                    {/* Task card */}
                    <div style={{ flex: 1, background: isActive ? CARD : isCompleted ? "transparent" : "transparent", border: `1px solid ${isActive ? BORDER2 : isCompleted ? "transparent" : "transparent"}`, borderRadius: "12px", padding: isActive ? "16px" : "10px 0", opacity: isLocked ? 0.35 : 1, transition: "all .3s" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: isCompleted ? SUB : isLocked ? DIM : TEXT, marginBottom: isActive ? "6px" : "0", textDecoration: isCompleted ? "line-through" : "none" }}>
                        {task.title}
                      </div>

                      {isActive && (
                        <>
                          <div style={{ fontSize: "13px", color: SUB, lineHeight: "1.5", marginBottom: "14px" }}>{task.desc}</div>

                          {/* Task 5 — form */}
                          {task.id === 5 ? (
                            <div>
                              <div style={{ marginBottom: "10px" }}>
                                <div style={{ fontSize: "11px", color: DIM, marginBottom: "5px", textTransform: "uppercase", letterSpacing: ".05em" }}>X Handle</div>
                                <div style={{ display: "flex", alignItems: "center", background: "#050A14", border: `1px solid ${BORDER2}`, borderRadius: "8px", overflow: "hidden" }}>
                                  <span style={{ padding: "0 10px", color: DIM, fontSize: "14px", fontWeight: 600 }}>@</span>
                                  <input type="text" value={handle} onChange={e => { setHandle(e.target.value); setError(""); }}
                                    placeholder="yourhandle"
                                    style={{ flex: 1, background: "none", border: "none", color: TEXT, fontSize: "14px", padding: "10px 10px 10px 0", outline: "none", fontFamily: "inherit" }} />
                                </div>
                              </div>
                              <div style={{ marginBottom: "14px" }}>
                                <div style={{ fontSize: "11px", color: DIM, marginBottom: "5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Arc Wallet Address</div>
                                <input type="text" value={wallet} onChange={e => { setWallet(e.target.value); setError(""); }}
                                  placeholder="0x..."
                                  style={{ width: "100%", background: "#050A14", border: `1px solid ${BORDER2}`, borderRadius: "8px", color: TEXT, fontSize: "13px", padding: "10px 12px", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                              </div>
                              {error && (
                                <div style={{ fontSize: "12px", color: "#EF4444", marginBottom: "10px" }}>{error}</div>
                              )}
                              <button onClick={handleSubmit} disabled={submitting}
                                style={{ width: "100%", background: submitting ? BORDER2 : GRAD, color: submitting ? DIM : "#fff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: submitting ? "none" : "0 4px 20px rgba(37,99,235,0.3)", transition: "all .15s" }}>
                                {submitting ? (
                                  <>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                    Submitting...
                                  </>
                                ) : task.cta}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "8px" }}>
                              {task.url && (
                                <button onClick={() => handleOpenUrl(task.id, task.url!)}
                                  style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER2}`, color: BLUE_LT, borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                  {task.action}
                                </button>
                              )}
                              <button onClick={() => handleComplete(task.id)}
                                disabled={!openedUrl}
                                style={{ flex: 1, background: openedUrl ? GRAD : BORDER2, color: openedUrl ? "#fff" : DIM, border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 700, cursor: openedUrl ? "pointer" : "not-allowed", fontFamily: "inherit", boxShadow: openedUrl ? "0 4px 16px rgba(37,99,235,0.25)" : "none", transition: "all .15s" }}>
                                {task.cta}
                              </button>
                            </div>
                          )}

                          {!openedUrl && task.id < 5 && (
                            <div style={{ fontSize: "11px", color: DIM, marginTop: "8px" }}>Open the link first.</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Privacy note */}
        <div style={{ marginTop: "40px", padding: "14px 16px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", fontSize: "11px", color: DIM, lineHeight: "1.6", textAlign: "center" }}>
          We store your X handle, wallet address, and a hashed timestamp. The list is never published. Nothing on this page touches a contract or asks you to sign anything.
        </div>

        {/* Footer */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px" }}>ArcBoost</div>
          <div style={{ fontSize: "11px", color: DIM }}>Permissionless token launchpad on Arc · Launching 16 Sep 2026</div>
          <a href="https://x.com/BOOSTARCC" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "12px", fontSize: "11px", color: SUB, textDecoration: "none" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.402 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63z"/></svg>
            @BOOSTARCC
          </a>
        </div>

      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}*{box-sizing:border-box;}input::placeholder{color:#2A3A5C;}`}</style>
    </main>
  );
}