import { useEffect, useRef, useState } from "react";
import { useStories } from "@/context/StoriesContext";
import { useAuth } from "@/context/AuthContext";
import { CURRENT_USER_ID } from "@/mock/data";
import { Avatar } from "@/components/common/Common";
function StoriesBar({ users }) {
  const { storiesByUser, hasUnviewed } = useStories();
  const { user: me } = useAuth();
  const [viewerUserId, setViewerUserId] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const otherUserIds = Object.keys(storiesByUser).filter((id) => id !== CURRENT_USER_ID);
  const myStories = storiesByUser[CURRENT_USER_ID] ?? [];
  return <div className="scrollbar-thin flex items-center gap-3 overflow-x-auto border-b border-slate-100 px-4 py-3 dark:border-slate-800">{
    /* Your status */
  }<div className="flex shrink-0 flex-col items-center gap-1"><div className="relative h-[52px] w-[52px]"><button
    onClick={() => myStories.length > 0 ? setViewerUserId(CURRENT_USER_ID) : setComposerOpen(true)}
    className="block h-full w-full"
  >{me && <Avatar user={me} size={52} showStatus={false} />}</button><button
    onClick={() => setComposerOpen(true)}
    aria-label="Add status"
    className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-insta-gradient text-xs text-white ring-2 ring-white dark:ring-slate-900"
  >
            +
          </button></div><button
    onClick={() => myStories.length > 0 ? setViewerUserId(CURRENT_USER_ID) : setComposerOpen(true)}
    className="max-w-[56px] truncate text-[11px] text-slate-500 dark:text-slate-400"
  >
          Your status
        </button></div>{otherUserIds.map((uid) => {
    const u = users[uid];
    if (!u) return null;
    const unviewed = hasUnviewed(uid);
    return <button key={uid} onClick={() => setViewerUserId(uid)} className="flex shrink-0 flex-col items-center gap-1"><div className={`rounded-full p-[2px] ${unviewed ? "bg-insta-gradient-soft" : "bg-slate-200 dark:bg-slate-700"}`}><div className="rounded-full bg-white p-[2px] dark:bg-slate-900"><Avatar user={u} size={48} /></div></div><span className="max-w-[56px] truncate text-[11px] text-slate-500 dark:text-slate-400">{u.name.split(" ")[0]}</span></button>;
  })}{viewerUserId && <StoryViewer
    userIds={viewerUserId === CURRENT_USER_ID ? [CURRENT_USER_ID] : otherUserIds}
    startUserId={viewerUserId}
    users={users}
    onClose={() => setViewerUserId(null)}
  />}{composerOpen && <StoryComposer onClose={() => setComposerOpen(false)} />}</div>;
}
const STORY_DURATION_MS = 4500;
function StoryViewer({
  userIds,
  startUserId,
  users,
  onClose
}) {
  const { storiesByUser, markViewed } = useStories();
  const [userIdx, setUserIdx] = useState(Math.max(0, userIds.indexOf(startUserId)));
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(Date.now());
  const videoRef = useRef(null);
  const currentUserId = userIds[userIdx];
  const currentStories = storiesByUser[currentUserId] ?? [];
  const currentStory = currentStories[storyIdx];
  const user = users[currentUserId];
  const isVideo = currentStory?.type === "video";
  useEffect(() => {
    if (currentStory) markViewed(currentStory.id);
  }, [currentStory?.id]);
  useEffect(() => {
    setProgress(0);
    startRef.current = Date.now();
    if (paused) return;
    if (isVideo) return;
    function tick() {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, elapsed / STORY_DURATION_MS * 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [userIdx, storyIdx, paused, isVideo]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    if (paused) video.pause();
    else video.play().catch(() => {
    });
  }, [paused, isVideo, storyIdx, userIdx]);
  function goNext() {
    if (storyIdx < currentStories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (userIdx < userIds.length - 1) {
      setUserIdx((i) => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }
  function goPrev() {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
    } else if (userIdx > 0) {
      const prevUserId = userIds[userIdx - 1];
      setUserIdx((i) => i - 1);
      setStoryIdx((storiesByUser[prevUserId]?.length ?? 1) - 1);
    }
  }
  if (!user || !currentStory) {
    return null;
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 sm:p-4" onClick={onClose}><div
    className="relative flex h-full w-full flex-col overflow-hidden bg-slate-900 sm:h-[85vh] sm:max-w-sm sm:rounded-2xl"
    style={{ backgroundColor: currentStory.type === "text" ? currentStory.bgColor || "#1e293b" : void 0 }}
    onClick={(e) => e.stopPropagation()}
    onMouseDown={() => setPaused(true)}
    onMouseUp={() => setPaused(false)}
    onTouchStart={() => setPaused(true)}
    onTouchEnd={() => setPaused(false)}
  >{
    /* Progress bars */
  }<div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">{currentStories.map((_, i) => <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"><div
    className="h-full bg-white transition-[width] duration-100 ease-linear"
    style={{ width: `${i < storyIdx ? 100 : i === storyIdx ? progress : 0}%` }}
  /></div>)}</div>{
    /* Header */
  }<div className="absolute left-0 right-0 top-6 z-10 flex items-center justify-between px-3"><div className="flex items-center gap-2"><Avatar user={user} size={32} /><span className="text-sm font-medium text-white drop-shadow">{user.name}</span><span className="text-xs text-white/70">{timeAgo(currentStory.createdAt)}</span></div><button onClick={onClose} className="rounded-full p-1 text-white/90 hover:bg-white/10">
            ✕
          </button></div>{
    /* Content */
  }<div className="flex flex-1 items-center justify-center p-0 sm:p-8">{currentStory.type === "image" && currentStory.mediaUrl ? <img src={currentStory.mediaUrl} alt="" className="max-h-full max-w-full object-contain sm:rounded-lg" /> : currentStory.type === "video" && currentStory.mediaUrl ? <video
    ref={videoRef}
    src={currentStory.mediaUrl}
    autoPlay
    muted
    playsInline
    onEnded={goNext}
    onTimeUpdate={(e) => {
      const v = e.currentTarget;
      if (v.duration) setProgress(v.currentTime / v.duration * 100);
    }}
    className="max-h-full max-w-full object-contain sm:rounded-lg"
  /> : <p className="text-center text-2xl font-semibold leading-snug text-white drop-shadow px-8">{currentStory.text}</p>}</div>{
    /* Tap zones */
  }<button className="absolute bottom-0 left-0 top-0 w-1/3" onClick={goPrev} aria-label="Previous story" /><button className="absolute bottom-0 right-0 top-0 w-1/3" onClick={goNext} aria-label="Next story" /></div></div>;
}
function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 6e4);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
}
const BG_COLORS = ["#4a63f0", "#e0678a", "#2fa88a", "#e0a83f", "#7a5cf0", "#c94f4f", "#1e293b"];
function StoryComposer({ onClose }) {
  const { addStory } = useStories();
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [mediaFile, setMediaFile] = useState(null);
  const fileInputRef = useRef(null);
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const kind = file.type.startsWith("video/") ? "video" : "image";
    setMediaFile({ url, kind });
    setMode("media");
  }
  function post() {
    if (mode === "text") {
      if (!text.trim()) return;
      addStory({ userId: CURRENT_USER_ID, type: "text", text: text.trim(), bgColor });
    } else {
      if (!mediaFile) return;
      addStory({ userId: CURRENT_USER_ID, type: mediaFile.kind, mediaUrl: mediaFile.url });
    }
    onClose();
  }
  const canPost = mode === "text" ? text.trim().length > 0 : !!mediaFile;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}><div
    className="flex h-full w-full flex-col overflow-hidden bg-slate-900 sm:h-[70vh] sm:max-w-sm sm:rounded-2xl"
    style={{ backgroundColor: mode === "text" ? bgColor : "#0f172a" }}
    onClick={(e) => e.stopPropagation()}
  ><div className="flex items-center justify-between p-3"><span className="text-sm font-medium text-white">New status</span><button onClick={onClose} className="rounded-full p-1 text-white/90 hover:bg-white/10">
            ✕
          </button></div><div className="flex items-center justify-center gap-2 px-3 pb-2"><button
    onClick={() => setMode("text")}
    className={`rounded-full px-3 py-1 text-xs font-medium ${mode === "text" ? "bg-white text-slate-900" : "bg-white/10 text-white"}`}
  >
            Aa Text
          </button><button
    onClick={() => fileInputRef.current?.click()}
    className={`rounded-full px-3 py-1 text-xs font-medium ${mode === "media" ? "bg-white text-slate-900" : "bg-white/10 text-white"}`}
  >
            📷 Photo / Video
          </button><input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} /></div><div className="flex flex-1 items-center justify-center overflow-hidden p-6">{mode === "text" ? <textarea
    value={text}
    onChange={(e) => setText(e.target.value)}
    placeholder="Type a status…"
    autoFocus
    rows={4}
    className="w-full resize-none bg-transparent text-center text-2xl font-semibold text-white placeholder-white/50 outline-none"
  /> : mediaFile ? mediaFile.kind === "image" ? <img src={mediaFile.url} alt="" className="max-h-full max-w-full rounded-lg object-contain" /> : <video src={mediaFile.url} controls muted className="max-h-full max-w-full rounded-lg object-contain" /> : <button
    onClick={() => fileInputRef.current?.click()}
    className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/30 px-8 py-10 text-white/70 hover:border-white/50 hover:text-white"
  ><span className="text-3xl">📷</span><span className="text-sm">Choose a photo or video</span></button>}</div>{mode === "text" && <div className="flex items-center justify-center gap-2 p-4">{BG_COLORS.map((c) => <button
    key={c}
    onClick={() => setBgColor(c)}
    className={`h-7 w-7 rounded-full ${bgColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-black/30" : ""}`}
    style={{ backgroundColor: c }}
    aria-label={`Background ${c}`}
  />)}</div>}<button
    onClick={post}
    disabled={!canPost}
    className="m-4 rounded-full bg-white py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
  >
          Post status
        </button></div></div>;
}
export {
  StoriesBar,
  StoryComposer,
  StoryViewer
};
