import { useState } from "react";
import { CURRENT_USER_ID } from "@/mock/data";
import { Avatar, Spinner } from "@/components/common/Common";
import { ReactionPicker } from "@/components/chat/ReactionPicker";
import { AttachmentRenderer } from "@/components/chat/AttachmentRenderer";
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function StatusTicks({ status }) {
  if (status === "sending") return <Spinner size={12} className="text-slate-400 dark:text-white/70" />;
  if (status === "failed")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500 dark:text-rose-300"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
  const color = status === "read" ? "text-sky-600 dark:text-sky-300" : "text-slate-500 dark:text-white/70";
  const double = status === "delivered" || status === "read";
  return <svg width="16" height="14" viewBox="0 0 16 14" fill="none" className={color}><path d="M1 7l3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />{double && <path
    d="M6 7l3 3 6-7"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  />}</svg>;
}
function MessageBubble({
  message,
  sender,
  isOwn,
  replyToMessage,
  highlight,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRetry,
  onJumpTo,
  onVotePoll,
  onStar,
  onForward,
  onOpenViewOnce
}) {
  const [showActions, setShowActions] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDeleted = !!message.deletedAt;
  const isStarred = !!message.starredBy?.includes(CURRENT_USER_ID);
  function highlightText(text) {
    if (!highlight) return text;
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark className="rounded bg-amber-200 px-0.5 dark:bg-amber-500/40">{text.slice(idx, idx + highlight.length)}</mark>{text.slice(idx + highlight.length)}</>;
  }
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
    }
  }
  return <div
    className={`group flex gap-2 px-4 py-1 ${isOwn ? "flex-row-reverse" : ""}`}
    onMouseEnter={() => setShowActions(true)}
    onMouseLeave={() => {
      setShowActions(false);
      setShowPicker(false);
    }}
  >{!isOwn && sender && <Avatar user={sender} size={28} />}{!isOwn && !sender && <div className="w-7" />}<div className={`relative flex max-w-[70%] flex-col ${isOwn ? "items-end" : "items-start"}`}>{!isOwn && sender && <span className="mb-0.5 px-1 text-xs font-medium text-slate-500 dark:text-slate-400">{sender.name}</span>}{message.forwarded && !isDeleted && <span className="mb-0.5 flex items-center gap-1 px-1 text-[11px] italic text-slate-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l5 5-5 5M4 4v7a4 4 0 004 4h12" /></svg>
            Forwarded
          </span>}{replyToMessage && <button
    onClick={() => onJumpTo?.(replyToMessage.id)}
    className={`mb-1 max-w-full truncate rounded-lg border-l-2 border-brand-400 bg-slate-100 px-2 py-1 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400`}
  >{replyToMessage.deletedAt ? "Original message deleted" : replyToMessage.text}</button>}<div className="relative">{showActions && !isDeleted && <div
    className={`absolute -top-8 z-20 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-md dark:border-slate-700 dark:bg-slate-800 ${isOwn ? "right-0" : "left-0"}`}
  ><ActionButton label="React" onClick={() => setShowPicker((s) => !s)}>
                🙂
              </ActionButton><ActionButton label="Reply" onClick={() => onReply(message)}>
                ↩
              </ActionButton><ActionButton label="Copy" onClick={handleCopy}>{copied ? "\u2713" : "\u29C9"}</ActionButton>{onForward && <ActionButton label="Forward" onClick={() => onForward(message)}>
                  ➦
                </ActionButton>}{onStar && <ActionButton label={isStarred ? "Unstar" : "Star"} onClick={() => onStar(message)}>{isStarred ? "\u2B50" : "\u2606"}</ActionButton>}{isOwn && <><ActionButton label="Edit" onClick={() => onEdit(message)}>
                    ✎
                  </ActionButton><ActionButton label="Delete" onClick={() => onDelete(message)}>
                    🗑
                  </ActionButton></>}</div>}{showPicker && <ReactionPicker onPick={(emoji) => onReact(message, emoji)} onClose={() => setShowPicker(false)} />}<div
    className={`animate-pop-in rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${isOwn ? "rounded-br-md" : "rounded-bl-md"} ${isDeleted ? "bg-transparent italic text-slate-400 dark:text-slate-500" : isOwn ? "bg-[#d9fdd3] text-slate-900 dark:bg-[#005c4b] dark:text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"} ${message.status === "failed" ? "ring-2 ring-rose-400" : ""}`}
  >{isDeleted ? "This message was deleted" : <>{message.attachments.length > 0 && <div className="mb-1.5 flex flex-col gap-1.5">{message.attachments.map((a) => <AttachmentRenderer
    key={a.id}
    attachment={a}
    isOwn={isOwn}
    onVotePoll={onVotePoll ? (optionId) => onVotePoll(message, optionId) : void 0}
    onOpenViewOnce={onOpenViewOnce ? () => onOpenViewOnce(message) : void 0}
  />)}</div>}{message.text && <span>{highlightText(message.text)}</span>}</>}<div
    className={`mt-1 flex items-center gap-1 text-[10px] ${isOwn ? "justify-end text-slate-500 dark:text-white/70" : "justify-start text-slate-400"}`}
  >{message.editedAt && !isDeleted && <span>edited</span>}{isStarred && !isDeleted && <span title="Starred">⭐</span>}<span>{formatTime(message.createdAt)}</span>{isOwn && !isDeleted && <StatusTicks status={message.status} />}</div></div>{message.status === "failed" && <button
    onClick={() => onRetry(message)}
    className="mt-1 flex items-center gap-1 text-xs font-medium text-rose-500 hover:underline"
  >
              ⟲ Retry sending
            </button>}{message.reactions.length > 0 && <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>{message.reactions.map((r) => <button
    key={r.emoji}
    onClick={() => onReact(message, r.emoji)}
    className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs ${r.userIds.includes(CURRENT_USER_ID) ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"}`}
  ><span>{r.emoji}</span><span className="text-slate-500 dark:text-slate-400">{r.userIds.length}</span></button>)}</div>}</div></div></div>;
}
function ActionButton({ children, label, onClick }) {
  return <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className="flex h-7 w-7 items-center justify-center rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
  >{children}</button>;
}
export {
  MessageBubble
};
