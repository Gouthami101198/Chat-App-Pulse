import { useMemo, useState } from "react";
import { CURRENT_USER_ID } from "@/mock/data";
import { Avatar, GroupAvatar } from "@/components/common/Common";
function ModalShell({
  title,
  onClose,
  children,
  wide = false
}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div
    onClick={(e) => e.stopPropagation()}
    className={`max-h-[85vh] w-full ${wide ? "max-w-lg" : "max-w-sm"} overflow-y-auto scrollbar-thin rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800`}
  ><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2><button
    onClick={onClose}
    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
    aria-label="Close"
  >
            ✕
          </button></div>{children}</div></div>;
}
function ForwardPicker({
  chats,
  onForward,
  onClose
}) {
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [query, setQuery] = useState("");
  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const filtered = chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  return <ModalShell title="Forward message" onClose={onClose}><input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search chats"
    autoFocus
    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><div className="mb-3 max-h-72 space-y-1 overflow-y-auto scrollbar-thin">{filtered.map((c) => <button
    key={c.id}
    onClick={() => toggle(c.id)}
    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
  ><span
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] text-white ${selected.has(c.id) ? "border-brand-500 bg-brand-500" : "border-slate-300 dark:border-slate-500"}`}
  >{selected.has(c.id) && "\u2713"}</span><span
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
    style={{ backgroundColor: "#4a63f0" }}
  >{c.type === "group" ? c.memberIds.length : c.name[0]}</span><span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{c.name}</span></button>)}{filtered.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No chats found</p>}</div><button
    onClick={() => onForward(Array.from(selected))}
    disabled={selected.size === 0}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
  >
        Forward{selected.size > 0 ? ` (${selected.size})` : ""}</button></ModalShell>;
}
function GroupInfoPanel({
  chat,
  users,
  contacts,
  messages,
  onClose,
  onAddMember,
  onRemoveMember,
  onToggleAdmin,
  onToggleOnlyAdmins,
  onSetDescription,
  onResetInviteLink,
  onOpenDisappearing,
  onMessageMember
}) {
  const [addingMember, setAddingMember] = useState(false);
  const [mediaTab, setMediaTab] = useState(null);
  const { media, docs, links } = useMemo(() => extractSharedMedia(messages), [messages]);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(chat.description ?? "");
  const [linkCopied, setLinkCopied] = useState(false);
  const isAdmin = (chat.adminIds ?? []).includes(CURRENT_USER_ID);
  const nonMembers = contacts.filter((c) => !chat.memberIds.includes(c.id));
  const inviteUrl = `https://pulse.chat/invite/${chat.inviteCode ?? "xxxxxxxx"}`;
  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
    }
  }
  return <><ModalShell title="Group info" onClose={onClose}><div className="mb-4 flex flex-col items-center text-center"><div className="mb-2"><GroupAvatar chat={chat} size={64} /></div><p className="text-base font-semibold text-slate-900 dark:text-white">{chat.name}</p><p className="text-xs text-slate-400">{chat.memberIds.length} members</p></div><div className="mb-4"><p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Shared content</p><div className="grid grid-cols-3 gap-1.5">{[
    { key: "media", label: "Media", count: media.length, icon: "\u{1F5BC}\uFE0F" },
    { key: "links", label: "Links", count: links.length, icon: "\u{1F517}" },
    { key: "docs", label: "Docs", count: docs.length, icon: "\u{1F4C4}" }
  ].map((s) => <button
    key={s.key}
    onClick={() => setMediaTab(s.key)}
    className="flex flex-col items-center gap-0.5 rounded-lg bg-slate-50 py-2.5 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600"
  ><span className="text-base">{s.icon}</span><span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.count}</span><span className="text-[10px] text-slate-400">{s.label}</span></button>)}</div></div><div className="mb-4 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-700"><div className="mb-1 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>{isAdmin && !editingDescription && <button
    onClick={() => {
      setDescriptionDraft(chat.description ?? "");
      setEditingDescription(true);
    }}
    className="text-xs font-medium text-brand-500 hover:underline"
  >
              Edit
            </button>}</div>{editingDescription ? <div><textarea
    value={descriptionDraft}
    onChange={(e) => setDescriptionDraft(e.target.value)}
    rows={2}
    placeholder="What's this group about?"
    className="w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
  /><div className="mt-1.5 flex justify-end gap-2"><button onClick={() => setEditingDescription(false)} className="text-xs text-slate-500 hover:underline">
                Cancel
              </button><button
    onClick={() => {
      onSetDescription(descriptionDraft.trim());
      setEditingDescription(false);
    }}
    className="text-xs font-medium text-brand-500 hover:underline"
  >
                Save
              </button></div></div> : <p className="text-sm text-slate-600 dark:text-slate-300">{chat.description || "No description yet."}</p>}</div><div className="mb-4 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-700"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Invite link</p><p className="mb-2 truncate text-sm text-brand-600 dark:text-brand-400">{inviteUrl}</p><div className="flex gap-2"><button
    onClick={copyInviteLink}
    className="rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-600"
  >{linkCopied ? "\u2713 Copied" : "Copy link"}</button>{isAdmin && <button
    onClick={onResetInviteLink}
    className="rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-600"
  >
              Reset link
            </button>}</div></div><button
    onClick={onOpenDisappearing}
    className="mb-4 flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-left dark:bg-slate-700"
  ><div><p className="text-sm font-medium text-slate-800 dark:text-slate-100">Disappearing messages</p><p className="text-xs text-slate-400">{chat.disappearingMessagesDuration ? "On" : "Off"} · applies to new messages
          </p></div><span className="text-slate-300">›</span></button>{isAdmin && <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-700"><div><p className="text-sm font-medium text-slate-800 dark:text-slate-100">Only admins can send</p><p className="text-xs text-slate-400">Turn this group into an announcement channel</p></div><button
    onClick={() => onToggleOnlyAdmins(!chat.onlyAdminsCanSend)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition ${chat.onlyAdminsCanSend ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
    role="switch"
    aria-checked={!!chat.onlyAdminsCanSend}
  ><span
    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${chat.onlyAdminsCanSend ? "translate-x-5" : "translate-x-0.5"}`}
  /></button></div>}<div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium text-slate-700 dark:text-slate-300">{chat.memberIds.length} participants
        </p>{isAdmin && <button onClick={() => setAddingMember((v) => !v)} className="text-sm font-medium text-brand-500 hover:underline">{addingMember ? "Cancel" : "+ Add"}</button>}</div>{addingMember && <div className="mb-3 max-h-40 space-y-1 overflow-y-auto scrollbar-thin rounded-lg border border-slate-100 p-1 dark:border-slate-700">{nonMembers.length === 0 && <p className="px-2 py-2 text-xs text-slate-400">Everyone is already in this group</p>}{nonMembers.map((u) => <button
    key={u.id}
    onClick={() => {
      onAddMember(u.id);
      setAddingMember(false);
    }}
    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
  ><Avatar user={u} size={28} /><span className="text-sm text-slate-700 dark:text-slate-200">{u.name}</span></button>)}</div>}<div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">{chat.memberIds.map((uid) => {
    const u = users[uid];
    if (!u) return null;
    const memberIsAdmin = (chat.adminIds ?? []).includes(uid);
    const isSelf = uid === CURRENT_USER_ID;
    return <div key={uid} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"><button
      onClick={() => !isSelf && onMessageMember(uid)}
      disabled={isSelf}
      className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
    ><Avatar user={u} size={36} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{u.name} {isSelf && <span className="text-slate-400">(You)</span>}</p>{memberIsAdmin && <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Group admin</p>}{!isSelf && !memberIsAdmin && <p className="truncate text-[11px] text-slate-400">{u.about}</p>}</div></button>{isAdmin && !isSelf && <div className="flex shrink-0 items-center gap-1"><button
      onClick={() => onToggleAdmin(uid)}
      className="rounded-md px-1.5 py-1 text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
      title={memberIsAdmin ? "Remove as admin" : "Make admin"}
    >{memberIsAdmin ? "\u{1F451}" : "\u2795\u{1F451}"}</button><button
      onClick={() => onRemoveMember(uid)}
      className="rounded-md px-1.5 py-1 text-[11px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
      title="Remove from group"
    >
                    Remove
                  </button></div>}</div>;
  })}</div></ModalShell>{mediaTab && <SharedMediaPanel messages={messages} initialTab={mediaTab} onClose={() => setMediaTab(null)} />}</>;
}
function StarredMessagesPanel({
  starred,
  chats,
  users,
  onClose,
  onJump,
  onUnstar
}) {
  return <ModalShell title="Starred messages" onClose={onClose}>{starred.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No starred messages yet</p> : <div className="space-y-2">{starred.map(({ message, chatId }) => {
    const chat = chats[chatId];
    const sender = users[message.senderId];
    return <div key={message.id} className="rounded-lg border border-slate-100 p-2.5 dark:border-slate-700"><div className="mb-1 flex items-center justify-between"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">{chat?.name}</p><button onClick={() => onUnstar(chatId, message.id)} className="text-amber-500" title="Unstar">
                    ⭐
                  </button></div><button onClick={() => onJump(chatId, message.id)} className="block w-full text-left"><p className="text-sm text-slate-800 dark:text-slate-100"><span className="font-medium">{sender?.name ?? "Unknown"}: </span>{message.text || "(attachment)"}</p></button></div>;
  })}</div>}</ModalShell>;
}
const DISAPPEARING_OPTIONS = [
  { label: "Off", ms: null },
  { label: "24 hours", ms: 24 * 60 * 60 * 1e3 },
  { label: "7 days", ms: 7 * 24 * 60 * 60 * 1e3 },
  { label: "90 days", ms: 90 * 24 * 60 * 60 * 1e3 }
];
function DisappearingMessagesPicker({
  current,
  onSelect,
  onClose
}) {
  return <ModalShell title="Disappearing messages" onClose={onClose}><p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        New messages sent to this chat will disappear from the conversation after the selected time. This applies
        client-side in this demo.
      </p><div className="space-y-1">{DISAPPEARING_OPTIONS.map((opt) => <button
    key={opt.label}
    onClick={() => {
      onSelect(opt.ms);
      onClose();
    }}
    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
  ><span className="text-slate-700 dark:text-slate-200">{opt.label}</span>{(current ?? null) === opt.ms && <span className="text-brand-500">✓</span>}</button>)}</div></ModalShell>;
}
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
function fakePhone(userId) {
  return `+91 ${String(Math.abs(hashCode(userId))).padStart(10, "9").slice(0, 10)}`;
}
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
function extractSharedMedia(messages) {
  const media = [];
  const docs = [];
  const links = [];
  messages.forEach((m) => {
    if (m.deletedAt) return;
    m.attachments.forEach((a) => {
      if (a.type === "image" || a.type === "ai-image" || a.type === "gif") {
        media.push({ id: a.id, url: a.url, name: a.name, createdAt: m.createdAt });
      } else if (a.type === "document") {
        docs.push({ id: a.id, name: a.name, size: a.size, url: a.url, createdAt: m.createdAt });
      }
    });
    const matches = m.text.match(URL_REGEX);
    if (matches) {
      matches.forEach((url, i) => links.push({ id: `${m.id}-link-${i}`, url, context: m.text, createdAt: m.createdAt }));
    }
  });
  return {
    media: media.sort((a, b) => b.createdAt - a.createdAt),
    docs: docs.sort((a, b) => b.createdAt - a.createdAt),
    links: links.sort((a, b) => b.createdAt - a.createdAt)
  };
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function SharedMediaPanel({
  messages,
  initialTab,
  onClose
}) {
  const [tab, setTab] = useState(initialTab);
  const { media, docs, links } = useMemo(() => extractSharedMedia(messages), [messages]);
  return <ModalShell title="Shared media" onClose={onClose} wide><div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">{["media", "links", "docs"].map((t) => <button
    key={t}
    onClick={() => setTab(t)}
    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition ${tab === t ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
  >{t} ({t === "media" ? media.length : t === "links" ? links.length : docs.length})
          </button>)}</div>{tab === "media" && (media.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No shared photos yet.</p> : <div className="grid grid-cols-3 gap-1.5">{media.map((m) => <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700"><img src={m.url} alt={m.name} className="h-full w-full object-cover" /></a>)}</div>)}{tab === "links" && (links.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No shared links yet.</p> : <div className="space-y-1">{links.map((l) => <a
    key={l.id}
    href={l.url}
    target="_blank"
    rel="noreferrer"
    className="block rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"
  ><p className="truncate text-sm font-medium text-brand-600 dark:text-brand-400">{l.url}</p><p className="truncate text-xs text-slate-400">{l.context}</p></a>)}</div>)}{tab === "docs" && (docs.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No shared documents yet.</p> : <div className="space-y-1">{docs.map((d) => <a
    key={d.id}
    href={d.url}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"
  ><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-500/15 text-base">📄</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{d.name}</span><span className="block text-xs text-slate-400">{formatBytes(d.size)}</span></span></a>)}</div>)}</ModalShell>;
}
function ContactInfoPanel({
  user,
  chat,
  messages,
  isBlocked,
  onClose,
  onBlock,
  onUnblock,
  onReport,
  onOpenDisappearing
}) {
  const [mediaTab, setMediaTab] = useState(null);
  const { media, docs, links } = useMemo(() => extractSharedMedia(messages), [messages]);
  return <><ModalShell title="Contact info" onClose={onClose}><div className="mb-4 flex flex-col items-center text-center"><div className="mb-2"><Avatar user={user} size={72} /></div><p className="text-base font-semibold text-slate-900 dark:text-white">{user.name}</p><p className="text-xs text-slate-400">{user.about}</p></div><div className="mb-4 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-700"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">About</p><p className="text-sm text-slate-700 dark:text-slate-200">{user.about || "No about info"}</p></div><div className="mb-4 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-700"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</p><p className="text-sm text-slate-700 dark:text-slate-200">{fakePhone(user.id)}</p></div><div className="mb-4"><p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Shared content</p><div className="grid grid-cols-3 gap-1.5">{[
    { key: "media", label: "Media", count: media.length, icon: "\u{1F5BC}\uFE0F" },
    { key: "links", label: "Links", count: links.length, icon: "\u{1F517}" },
    { key: "docs", label: "Docs", count: docs.length, icon: "\u{1F4C4}" }
  ].map((s) => <button
    key={s.key}
    onClick={() => setMediaTab(s.key)}
    className="flex flex-col items-center gap-0.5 rounded-lg bg-slate-50 py-2.5 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600"
  ><span className="text-base">{s.icon}</span><span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.count}</span><span className="text-[10px] text-slate-400">{s.label}</span></button>)}</div></div><button
    onClick={onOpenDisappearing}
    className="mb-4 flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-left dark:bg-slate-700"
  ><div><p className="text-sm font-medium text-slate-800 dark:text-slate-100">Disappearing messages</p><p className="text-xs text-slate-400">{chat.disappearingMessagesDuration ? "On" : "Off"}</p></div><span className="text-slate-300">›</span></button><div className="space-y-1"><button
    onClick={isBlocked ? onUnblock : onBlock}
    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
  >
            🚫 {isBlocked ? `Unblock ${user.name}` : `Block ${user.name}`}</button><button
    onClick={onReport}
    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
  >
            ⚠️ Report {user.name}</button></div></ModalShell>{mediaTab && <SharedMediaPanel messages={messages} initialTab={mediaTab} onClose={() => setMediaTab(null)} />}</>;
}
const REPORT_REASONS = ["Spam", "Inappropriate content", "Harassment", "Impersonation", "Other"];
function ReportUserModal({
  userName,
  onSubmit,
  onClose
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [submitted, setSubmitted] = useState(false);
  if (submitted) {
    return <ModalShell title="Report submitted" onClose={onClose}><p className="py-4 text-center text-sm text-slate-600 dark:text-slate-300">
          Thanks — your report about {userName} has been recorded. This is a demo, so no real report was sent.
        </p><button
      onClick={onClose}
      className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
    >
          Done
        </button></ModalShell>;
  }
  return <ModalShell title={`Report ${userName}`} onClose={onClose}><p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Why are you reporting this contact?</p><div className="mb-4 space-y-1">{REPORT_REASONS.map((r) => <label
    key={r}
    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
  ><input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} /><span className="text-slate-700 dark:text-slate-200">{r}</span></label>)}</div><button
    onClick={() => {
      onSubmit(reason);
      setSubmitted(true);
    }}
    className="w-full rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-600"
  >
        Submit report
      </button></ModalShell>;
}
function BlockedUsersPanel({
  blockedUsers,
  onUnblock,
  onClose
}) {
  return <ModalShell title="Blocked contacts" onClose={onClose}>{blockedUsers.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No blocked contacts.</p> : <div className="space-y-1">{blockedUsers.map((u) => <div key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-2"><Avatar user={u} size={36} /><p className="flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{u.name}</p><button
    onClick={() => onUnblock(u.id)}
    className="rounded-md px-2.5 py-1 text-xs font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
  >
                Unblock
              </button></div>)}</div>}</ModalShell>;
}
function BroadcastComposer({
  contacts,
  mode = "broadcast",
  onCreate,
  onClose
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [query, setQuery] = useState("");
  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const isGroup = mode === "group";
  return <ModalShell title={isGroup ? "New group" : "New broadcast list"} onClose={onClose}><input
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder={isGroup ? "Group name" : "Broadcast list name (optional)"}
    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search recipients"
    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><p className="mb-2 text-xs text-slate-400">{isGroup ? "Everyone you add will be able to see and send messages in this group." : "Messages you send to this list go out individually to each recipient \u2014 they'll see it as a normal message from you, not a group."}</p><div className="mb-3 max-h-56 space-y-1 overflow-y-auto scrollbar-thin">{filtered.map((u) => <button
    key={u.id}
    onClick={() => toggle(u.id)}
    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
  ><span
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] text-white ${selected.has(u.id) ? "border-brand-500 bg-brand-500" : "border-slate-300 dark:border-slate-500"}`}
  >{selected.has(u.id) && "\u2713"}</span><Avatar user={u} size={32} /><span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{u.name}</span></button>)}{filtered.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No contacts found</p>}</div><button
    onClick={() => onCreate(name, Array.from(selected))}
    disabled={selected.size === 0 || isGroup && !name.trim()}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
  >
        Create{selected.size > 0 ? ` (${selected.size} ${isGroup ? "members" : "recipients"})` : ""}</button></ModalShell>;
}
const WALLPAPER_OPTIONS = [
  { id: null, label: "Default (use app theme)", className: "bg-slate-100 dark:bg-slate-800" },
  { id: "default", label: "Default", className: "bg-slate-100 dark:bg-slate-800" },
  { id: "solid-teal", label: "Teal", className: "bg-teal-100 dark:bg-teal-900/40" },
  { id: "solid-navy", label: "Navy", className: "bg-indigo-100 dark:bg-indigo-900/40" },
  { id: "solid-blush", label: "Blush", className: "bg-pink-100 dark:bg-pink-900/40" },
  { id: "none", label: "None", className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" }
];
function ChatWallpaperPicker({
  current,
  onSelect,
  onClose
}) {
  return <ModalShell title="Chat wallpaper" onClose={onClose}><div className="space-y-1">{WALLPAPER_OPTIONS.map((opt) => <button
    key={opt.label}
    onClick={() => onSelect(opt.id)}
    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
  ><span className={`h-9 w-9 shrink-0 rounded-lg ${opt.className}`} /><span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{opt.label}</span>{current === opt.id && <span className="text-brand-500">✓</span>}</button>)}</div></ModalShell>;
}
function AddToListModal({
  lists,
  currentListIds,
  onToggle,
  onCreateList,
  onClose
}) {
  const [newListName, setNewListName] = useState("");
  return <ModalShell title="Add to list" onClose={onClose}><div className="mb-4 space-y-1">{lists.map((list) => {
    const active = currentListIds.includes(list.id);
    return <button
      key={list.id}
      onClick={() => onToggle(list.id)}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
    ><span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] text-white ${active ? "border-brand-500 bg-brand-500" : "border-slate-300 dark:border-slate-500"}`}
    >{active && "\u2713"}</span><span className="text-sm font-medium text-slate-800 dark:text-slate-100">{list.name}</span></button>;
  })}{lists.length === 0 && <p className="text-sm text-slate-400">No lists yet — create one below.</p>}</div><div className="flex gap-2"><input
    value={newListName}
    onChange={(e) => setNewListName(e.target.value)}
    placeholder="New list name"
    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><button
    onClick={() => {
      if (!newListName.trim()) return;
      onCreateList(newListName.trim());
      setNewListName("");
    }}
    disabled={!newListName.trim()}
    className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
  >
          Create
        </button></div></ModalShell>;
}
export {
  AddToListModal,
  BlockedUsersPanel,
  BroadcastComposer,
  ChatWallpaperPicker,
  ContactInfoPanel,
  DisappearingMessagesPicker,
  ForwardPicker,
  GroupInfoPanel,
  ReportUserModal,
  SharedMediaPanel,
  StarredMessagesPanel
};
