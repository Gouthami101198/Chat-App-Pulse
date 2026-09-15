import { useState } from "react";
import { useCommunities } from "@/context/CommunitiesContext";
import { useChat } from "@/context/ChatContext";
import { EmptyState, Badge } from "@/components/common/Common";
function CommunityAvatar({ color, size = 48 }) {
  return <div
    className="flex shrink-0 items-center justify-center rounded-2xl text-white"
    style={{ backgroundColor: color, width: size, height: size }}
  ><svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg></div>;
}
function CreateCommunityModal({
  groupChats,
  onCreate,
  onClose
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div
    onClick={(e) => e.stopPropagation()}
    className="max-h-[85vh] w-full max-w-sm overflow-y-auto scrollbar-thin rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800"
  ><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900 dark:text-white">New community</h2><button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            ✕
          </button></div><input
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Community name"
    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="What's this community about?"
    rows={2}
    className="mb-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Add existing groups</p><div className="mb-4 space-y-1">{groupChats.map((g) => <button
    key={g.id}
    onClick={() => toggle(g.id)}
    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
  ><span
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] text-white ${selected.has(g.id) ? "border-brand-500 bg-brand-500" : "border-slate-300 dark:border-slate-500"}`}
  >{selected.has(g.id) && "\u2713"}</span><span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{g.name}</span></button>)}{groupChats.length === 0 && <p className="text-sm text-slate-400">No groups available to add yet.</p>}</div><button
    onClick={() => {
      onCreate(name, description, Array.from(selected));
      onClose();
    }}
    disabled={!name.trim()}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
  >
          Create community
        </button></div></div>;
}
function CommunityDetail({
  community,
  onOpenChat,
  onClose
}) {
  const { chats } = useChat();
  const groups = community.groupChatIds.map((id) => chats[id]).filter(Boolean);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div
    onClick={(e) => e.stopPropagation()}
    className="max-h-[85vh] w-full max-w-sm overflow-y-auto scrollbar-thin rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800"
  ><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900 dark:text-white">Community info</h2><button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            ✕
          </button></div><div className="mb-4 flex flex-col items-center text-center"><CommunityAvatar color={community.avatarColor} size={72} /><p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{community.name}</p><p className="mt-1 text-xs text-slate-400">{community.description}</p><p className="mt-1 text-xs text-slate-400">{community.memberIds.length} members</p></div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Groups</p><div className="space-y-1">{groups.map((g) => <button
    key={g.id}
    onClick={() => {
      onOpenChat(g.id);
      onClose();
    }}
    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
  ><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{g.memberIds.length}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{g.name}</p><p className="text-xs text-slate-400">{g.memberIds.length} members</p></div><Badge count={g.unreadCount} /></button>)}{groups.length === 0 && <p className="text-sm text-slate-400">No groups in this community yet.</p>}</div></div></div>;
}
function CommunitiesTab({ onOpenChat }) {
  const { communities, createCommunity } = useCommunities();
  const { chats } = useChat();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const allGroupChats = Object.values(chats).filter((c) => c.type === "group").map((c) => ({ id: c.id, name: c.name }));
  return <div className="flex h-full flex-col"><div className="flex items-center justify-between px-4 py-3"><h2 className="text-base font-semibold text-slate-900 dark:text-white">Communities</h2><button
    onClick={() => setCreateOpen(true)}
    className="flex h-8 w-8 items-center justify-center rounded-full bg-insta-gradient text-white"
    aria-label="New community"
    title="New community"
  >
          +
        </button></div><div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2">{communities.length === 0 ? <EmptyState title="No communities yet" description="Create one to bundle related groups together." /> : communities.map((c) => <button
    key={c.id}
    onClick={() => setSelectedCommunity(c)}
    className="mb-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
  ><CommunityAvatar color={c.avatarColor} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900 dark:text-white">{c.name}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.groupChatIds.length} group{c.groupChatIds.length === 1 ? "" : "s"} · {c.memberIds.length} members
                </p></div></button>)}</div>{createOpen && <CreateCommunityModal
    groupChats={allGroupChats}
    onCreate={(name, description, groupChatIds) => createCommunity(name, description, groupChatIds)}
    onClose={() => setCreateOpen(false)}
  />}{selectedCommunity && <CommunityDetail community={selectedCommunity} onOpenChat={onOpenChat} onClose={() => setSelectedCommunity(null)} />}</div>;
}
export {
  CommunitiesTab
};
