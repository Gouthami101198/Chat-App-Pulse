import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/common/Common";
function formatDuration(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function CallScreen({
  user,
  kind,
  onEnd
}) {
  const [phase, setPhase] = useState("ringing");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(kind === "video");
  const [videoOn, setVideoOn] = useState(kind === "video");
  const intervalRef = useRef(null);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("connecting"), 1400);
    const t2 = setTimeout(() => setPhase("active"), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  useEffect(() => {
    if (phase !== "active") return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1e3);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);
  function endCall() {
    onEnd({ status: phase === "active" ? "completed" : "declined", duration: seconds });
  }
  const statusLabel = phase === "ringing" ? "Ringing\u2026" : phase === "connecting" ? "Connecting\u2026" : formatDuration(seconds);
  return <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">{
    /* Remote "video" surface */
  }<div className="relative flex flex-1 flex-col items-center justify-center">{kind === "video" && phase === "active" && videoOn ? <div className="absolute inset-0 bg-insta-gradient-soft opacity-90" /> : null}<div className="relative z-10 flex flex-col items-center gap-3"><div className={phase !== "active" ? "animate-pulse" : ""}><Avatar user={user} size={120} /></div><p className="text-xl font-semibold">{user.name}</p><p className="text-sm text-white/70">{kind === "video" ? "Video call" : "Voice call"} · {statusLabel}</p></div>{
    /* Self-view thumbnail for video calls */
  }{kind === "video" && phase === "active" && <div className="absolute bottom-6 right-6 flex h-28 w-20 items-center justify-center overflow-hidden rounded-xl bg-slate-800 shadow-lg ring-1 ring-white/10">{videoOn ? <div className="h-full w-full bg-insta-gradient" /> : <span className="text-[10px] text-white/60">Camera off</span>}</div>}</div>{
    /* Controls */
  }<div className="flex items-center justify-center gap-4 pb-10 pt-4"><CallButton active={muted} onClick={() => setMuted((m) => !m)} label={muted ? "Unmute" : "Mute"}>{muted ? "\u{1F507}" : "\u{1F399}\uFE0F"}</CallButton><CallButton active={speakerOn} onClick={() => setSpeakerOn((s) => !s)} label="Speaker">
          🔊
        </CallButton>{kind === "video" && <CallButton active={!videoOn} onClick={() => setVideoOn((v) => !v)} label={videoOn ? "Stop video" : "Start video"}>{videoOn ? "\u{1F4F7}" : "\u{1F6AB}"}</CallButton>}<button
    onClick={endCall}
    className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-2xl shadow-lg transition hover:bg-rose-600"
    aria-label="End call"
    title="End call"
  >
          📞
        </button></div></div>;
}
function CallButton({
  children,
  active,
  onClick,
  label
}) {
  return <button
    onClick={onClick}
    title={label}
    aria-pressed={active}
    className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition ${active ? "bg-white text-slate-900" : "bg-white/15 text-white hover:bg-white/25"}`}
  >{children}</button>;
}
export {
  CallScreen
};
