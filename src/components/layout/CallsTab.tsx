import { useMemo, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { CURRENT_USER_ID } from "@/mock/data";
import { Avatar, EmptyState } from "@/components/common/Common";
import { CallScreen } from "@/components/chat/CallScreen";
function formatCallTime(ts) {
  const d = new Date(ts);
  const now = /* @__PURE__ */ new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = /* @__PURE__ */ new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
function CallsTab({ onOpenChat }) {
  const { chats, messagesByChat, users, logCallMessage } = useChat();
  const [activeCall, setActiveCall] = useState(null);
  const [newCallOpen, setNewCallOpen] = useState(false);
  const callLog = useMemo(() => {
    const entries = [];
    Object.entries(messagesByChat).forEach(([chatId, msgs]) => {
      const chat = chats[chatId];
      if (!chat || chat.type !== "direct") return;
      msgs.forEach((m) => {
        m.attachments.forEach((a) => {
          if (a.type === "call") {
            const partnerId = chat.memberIds.find((id) => id !== CURRENT_USER_ID);
            if (!partnerId) return;
            entries.push({
              id: a.id,
              chatId,
              userId: partnerId,
              kind: a.callKind,
              status: a.callStatus === "outgoing" ? "completed" : a.callStatus,
              duration: a.duration,
              createdAt: m.createdAt
            });
          }
        });
      });
    });
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  }, [messagesByChat, chats]);
  const directContacts = Object.values(users).filter((u) => u.id !== CURRENT_USER_ID);
  return <div className="flex h-full flex-col"><div className="flex items-center justify-between px-4 py-3"><h2 className="text-base font-semibold text-slate-900 dark:text-white">Calls</h2><button
    onClick={() => setNewCallOpen(true)}
    className="flex h-8 w-8 items-center justify-center rounded-full bg-insta-gradient text-white"
    aria-label="New call"
    title="New call"
  ><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg></button></div><div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2">{callLog.length === 0 ? <EmptyState
    title="No call history yet"
    description="Calls you make or receive will show up here."
    icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>}
  /> : callLog.map((entry) => {
    const user = users[entry.userId];
    if (!user) return null;
    const missed = entry.status === "missed";
    return <div
      key={entry.id}
      role="button"
      tabIndex={0}
      onClick={() => onOpenChat(entry.chatId)}
      onKeyDown={(e) => e.key === "Enter" && onOpenChat(entry.chatId)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
    ><Avatar user={user} size={44} /><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${missed ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>{user.name}</p><div className="flex items-center gap-1 text-xs text-slate-400"><svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={missed ? "text-rose-500" : "text-emerald-500"}
    >{entry.status === "completed" && entry.duration !== void 0 ? <path d="M17 7L7 17M7 7v10h10" /> : <path d="M7 17L17 7M17 17V7H7" />}</svg><span>{entry.kind === "video" ? "Video" : "Voice"}</span><span>·</span><span>{formatCallTime(entry.createdAt)}</span></div></div><button
      onClick={(e) => {
        e.stopPropagation();
        setActiveCall({ user, kind: entry.kind });
      }}
      className="rounded-full p-2 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
      aria-label={`Call ${user.name}`}
    >{entry.kind === "video" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>}</button></div>;
  })}</div>{newCallOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNewCallOpen(false)}><div
    onClick={(e) => e.stopPropagation()}
    className="max-h-[70vh] w-full max-w-sm overflow-y-auto scrollbar-thin rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800"
  ><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900 dark:text-white">New call</h2><button onClick={() => setNewCallOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                ✕
              </button></div><div className="space-y-1">{directContacts.map((u) => <button
    key={u.id}
    onClick={() => {
      setActiveCall({ user: u, kind: "voice" });
      setNewCallOpen(false);
    }}
    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
  ><Avatar user={u} size={36} /><span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{u.name}</span></button>)}</div></div></div>}{activeCall && <CallScreen
    user={activeCall.user}
    kind={activeCall.kind}
    onEnd={(result) => {
      const directChat = Object.values(chats).find(
        (c) => c.type === "direct" && c.memberIds.includes(activeCall.user.id)
      );
      if (directChat) logCallMessage(directChat.id, activeCall.kind, result.status, result.duration);
      setActiveCall(null);
    }}
  />}</div>;
}
export {
  CallsTab
};
