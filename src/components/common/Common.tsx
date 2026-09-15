import { useState, type ReactNode } from "react";
import type { Chat, ConnectionStatus, User } from "@/types";

function Avatar({
  user,
  size = 40,
  showStatus = false
}: {
  user: Pick<User, "name" | "avatarColor" | "status" | "avatarUrl">;
  size?: number;
  showStatus?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const ringed = showStatus && user.status === "online";
  const ringPad = Math.max(2, Math.round(size * 0.06));
  const innerSize = ringed ? size - ringPad * 2 : size;
  const photo = user.avatarUrl && !imgFailed ? <img
    src={user.avatarUrl}
    alt={user.name}
    onError={() => setImgFailed(true)}
    className="rounded-full object-cover"
    style={{ width: innerSize, height: innerSize }}
  /> : <div
    className="flex items-center justify-center rounded-full font-medium text-white"
    style={{ width: innerSize, height: innerSize, backgroundColor: user.avatarColor, fontSize: innerSize * 0.38 }}
    aria-hidden
  >{initials}</div>;
  return <div className="relative shrink-0" style={{ width: size, height: size }}>{ringed ? <div
    className="flex items-center justify-center rounded-full bg-insta-gradient-soft"
    style={{ width: size, height: size, padding: ringPad }}
  ><div className="flex items-center justify-center rounded-full bg-white dark:bg-surface-dark" style={{ width: innerSize, height: innerSize }}>{photo}</div></div> : photo}{showStatus && <span
    className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-surface-dark ${user.status === "online" ? "bg-emerald-500" : user.status === "away" ? "bg-amber-400" : "bg-slate-400 dark:bg-slate-600"}`}
    style={{ width: size * 0.28, height: size * 0.28 }}
    title={user.status}
  />}</div>;
}
function GroupAvatar({
  chat,
  size = 40
}: {
  chat: Pick<Chat, "name" | "avatarUrl" | "memberIds">;
  size?: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  if (chat.avatarUrl && !imgFailed) {
    return <img
      src={chat.avatarUrl}
      alt={chat.name}
      onError={() => setImgFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />;
  }
  return <div
    className="flex shrink-0 items-center justify-center rounded-full bg-insta-gradient font-semibold text-white"
    style={{ width: size, height: size, fontSize: size * 0.35 }}
    aria-hidden
  >{chat.memberIds.length}</div>;
}
function Spinner({ size = 20, className = "" }) {
  return <svg
    className={`animate-spin text-slate-400 ${className}`}
    style={{ width: size, height: size }}
    viewBox="0 0 24 24"
    fill="none"
    role="status"
    aria-label="Loading"
  ><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
}
function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold text-white">{count > 99 ? "99+" : count}</span>;
}
function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">{icon && <div className="mb-1 text-slate-300 dark:text-slate-600">{icon}</div>}<p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>{description && <p className="max-w-xs text-sm text-slate-400 dark:text-slate-500">{description}</p>}{action}</div>;
}
function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center"><div className="rounded-full bg-rose-50 p-3 text-rose-500 dark:bg-rose-500/10"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Something went wrong</p><p className="max-w-xs text-sm text-slate-400 dark:text-slate-500">{message}</p>{onRetry && <button
    onClick={onRetry}
    className="mt-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
  >
          Try again
        </button>}</div>;
}
function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  if (status === "connected") return null;
  const copy = status === "connecting" ? "Connecting\u2026" : status === "reconnecting" ? "Connection lost. Reconnecting\u2026" : "Disconnected";
  return <div
    className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium ${status === "disconnected" ? "bg-rose-500 text-white" : "bg-amber-400 text-amber-950"}`}
    role="status"
  >{status !== "disconnected" && <Spinner size={12} className="text-current" />}{copy}</div>;
}
export {
  Avatar,
  Badge,
  ConnectionBanner,
  EmptyState,
  ErrorState,
  GroupAvatar,
  Spinner
};
