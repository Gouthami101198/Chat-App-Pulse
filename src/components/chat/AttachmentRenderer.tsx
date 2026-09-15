import { useEffect, useRef, useState } from "react";
import { CURRENT_USER_ID } from "@/mock/data";
import { MapPreview } from "@/components/chat/ComposerModals";
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatEventDate(date, time) {
  const d = new Date(time ? `${date}T${time}` : date);
  const dateStr = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const timeStr = time ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
  return timeStr ? `${dateStr} \xB7 ${timeStr}` : dateStr;
}
function AttachmentRenderer({
  attachment,
  isOwn,
  onVotePoll,
  onOpenViewOnce
}) {
  const surface = isOwn ? "bg-black/5 dark:bg-white/15" : "bg-white dark:bg-slate-700";
  const [locallyRevealed, setLocallyRevealed] = useState(false);
  switch (attachment.type) {
    case "image": {
      if (!attachment.viewOnce) {
        return <a href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.name} className="max-h-64 w-full object-cover" /></a>;
      }
      const alreadyOpened = !!attachment.viewOnceOpenedBy?.includes(CURRENT_USER_ID);
      if (isOwn) {
        return <div className="relative overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.name} className="max-h-64 w-full object-cover" /><span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
              1️⃣ View once
            </span></div>;
      }
      if (alreadyOpened && !locallyRevealed) {
        return <div className={`flex items-center gap-2 rounded-lg px-3 py-3 text-xs opacity-70 ${surface}`}><span className="text-base">🔒</span><span>Opened</span></div>;
      }
      if (locallyRevealed) {
        return <div className="overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.name} className="max-h-64 w-full object-cover" /><p className="px-1 pt-1 text-[11px] italic text-slate-400">Photo will show as "Opened" from now on</p></div>;
      }
      return <button
        onClick={() => {
          setLocallyRevealed(true);
          onOpenViewOnce?.();
        }}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-3 text-left text-xs ${surface}`}
      ><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-base">
            1️⃣
          </span><span><span className="block font-medium">Photo</span><span className="block opacity-70">Tap to view once</span></span></button>;
    }
    case "gif":
      return <div className="overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.name} className="max-h-52 w-40 object-cover" /></div>;
    case "ai-image":
      return <div className="overflow-hidden rounded-lg"><img src={attachment.url} alt={attachment.prompt} className="max-h-64 w-full object-cover" /><p className={`px-1 pt-1 text-[11px] italic ${isOwn ? "text-slate-500 dark:text-white/70" : "text-slate-400"}`}>
            "{attachment.prompt}"
          </p></div>;
    case "document":
      return <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs ${surface}`}
      ><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500/15 text-base">
            📄
          </span><span className="min-w-0"><span className="block truncate font-medium">{attachment.name}</span><span className="block text-[10px] opacity-70">{formatBytes(attachment.size)}</span></span></a>;
    case "location": {
      const mapsUrl = `https://www.google.com/maps?q=${attachment.latitude},${attachment.longitude}`;
      return <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className={`block overflow-hidden rounded-lg ${surface}`}
      ><MapPreview lat={attachment.latitude} lng={attachment.longitude} compact /><div className="px-2.5 py-1.5 text-xs"><p className="font-medium">{attachment.address || "Shared location"}</p><p className="opacity-70">{attachment.latitude.toFixed(4)}, {attachment.longitude.toFixed(4)}</p></div></a>;
    }
    case "contact":
      return <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${surface}`}><span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: attachment.contactAvatarColor }}
      >{attachment.contactName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span><div className="min-w-0 text-xs"><p className="truncate font-medium">{attachment.contactName}</p><p className="opacity-70">{attachment.phone}</p></div><span className="ml-auto shrink-0 text-[11px] font-semibold text-brand-300">Contact</span></div>;
    case "poll": {
      const totalVotes = attachment.options.reduce((sum, o) => sum + o.votes.length, 0);
      return <div className={`min-w-[220px] rounded-lg px-3 py-2.5 ${surface}`}><p className="mb-2 flex items-center gap-1.5 text-sm font-medium">📊 {attachment.question}</p><div className="space-y-1.5">{attachment.options.map((opt) => {
        const pct = totalVotes > 0 ? Math.round(opt.votes.length / totalVotes * 100) : 0;
        const voted = opt.votes.includes(CURRENT_USER_ID);
        return <button
          key={opt.id}
          onClick={() => onVotePoll?.(opt.id)}
          className="relative block w-full overflow-hidden rounded-md border border-current/10 px-2.5 py-1.5 text-left text-xs"
        ><div
          className={`absolute inset-y-0 left-0 ${voted ? "bg-brand-400/30" : "bg-current/5"}`}
          style={{ width: `${pct}%` }}
        /><div className="relative flex items-center justify-between gap-2"><span className={voted ? "font-semibold" : ""}>{voted && "\u2713 "}{opt.text}</span><span className="opacity-60">{pct}%</span></div></button>;
      })}</div><p className="mt-1.5 text-[10px] opacity-60">{totalVotes} vote{totalVotes === 1 ? "" : "s"} · {attachment.allowMultiple ? "Multiple answers" : "Single answer"}</p></div>;
    }
    case "event":
      return <div className={`min-w-[200px] overflow-hidden rounded-lg ${surface}`}><div className="flex items-center gap-2 bg-rose-500/90 px-3 py-1.5 text-xs font-semibold text-white">
            📅 Event
          </div><div className="px-3 py-2 text-xs"><p className="mb-0.5 font-medium">{attachment.title}</p><p className="opacity-70">{formatEventDate(attachment.date, attachment.time)}</p>{attachment.location && <p className="opacity-70">📍 {attachment.location}</p>}</div></div>;
    case "voice":
      return <VoiceMessagePlayer url={attachment.url} duration={attachment.duration} isOwn={isOwn} />;
    case "call": {
      const icon = attachment.callKind === "video" ? "\u{1F4F9}" : "\u{1F4DE}";
      const label = attachment.callStatus === "missed" ? `Missed ${attachment.callKind} call` : attachment.callStatus === "declined" ? `Declined ${attachment.callKind} call` : attachment.callStatus === "outgoing" ? `Outgoing ${attachment.callKind} call` : `${attachment.callKind === "video" ? "Video" : "Voice"} call`;
      return <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs ${surface}`}><span className="text-base">{icon}</span><div><p className={`font-medium ${attachment.callStatus === "missed" ? "text-rose-400" : ""}`}>{label}</p>{attachment.duration !== void 0 && <p className="opacity-70">{Math.floor(attachment.duration / 60)}:{String(attachment.duration % 60).padStart(2, "0")}</p>}</div></div>;
    }
    case "payment": {
      const isCompleted = attachment.status === "completed";
      return <div
        className={`min-w-[200px] overflow-hidden rounded-lg ${isOwn ? "bg-black/5 dark:bg-white/15" : "bg-emerald-50 dark:bg-emerald-500/10"}`}
      ><div className="flex items-center gap-2 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
            💳 {attachment.kind === "requested" ? "Payment request" : "Payment"}</div><div className="px-3 py-2.5"><p className={`text-lg font-bold ${isOwn ? "text-slate-900 dark:text-white" : "text-emerald-700 dark:text-emerald-300"}`}>{attachment.currency}{attachment.amount.toFixed(2)}</p>{attachment.note && <p className={`text-xs ${isOwn ? "text-slate-600 dark:text-white/80" : "text-slate-500 dark:text-slate-400"}`}>{attachment.note}</p>}<p className={`mt-1 text-[10px] font-medium ${isCompleted ? "text-emerald-500" : "text-amber-500"}`}>{isCompleted ? "\u2713 Completed" : "\u23F3 Pending"}</p></div></div>;
    }
    default:
      return null;
  }
}
function formatAudioTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function VoiceMessagePlayer({ url, duration, isOwn }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);
  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {
      });
      setPlaying(true);
    }
  }
  const barCount = 24;
  const bars = Array.from({ length: barCount }, (_, i) => 6 + i * 37 % 14);
  const activeBars = Math.round(progress * barCount);
  return <div className={`flex w-56 items-center gap-2 rounded-lg px-2 py-1.5 ${isOwn ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-100"}`}><audio ref={audioRef} src={url} preload="metadata" className="hidden" /><button
    onClick={toggle}
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isOwn ? "bg-black/10 dark:bg-white/20" : "bg-brand-500/15"}`}
    aria-label={playing ? "Pause voice message" : "Play voice message"}
  >{playing ? "\u23F8" : "\u25B6\uFE0F"}</button><div className="flex h-6 flex-1 items-center gap-[2px] overflow-hidden">{bars.map((h, i) => <span
    key={i}
    className={`w-[2px] shrink-0 rounded-full ${i < activeBars ? isOwn ? "bg-slate-700 dark:bg-white" : "bg-brand-500" : isOwn ? "bg-black/20 dark:bg-white/35" : "bg-slate-300 dark:bg-slate-600"}`}
    style={{ height: h }}
  />)}</div><span className="shrink-0 text-[10px] opacity-80">{formatAudioTime(duration)}</span></div>;
}
export {
  AttachmentRenderer
};
