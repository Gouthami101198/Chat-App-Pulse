import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { useDebounce } from "@/hooks/useDebounce";
import { searchMessages } from "@/services/api";
import { Avatar, GroupAvatar, Badge, EmptyState, Spinner } from "@/components/common/Common";
import { AvatarEditModal } from "@/components/chat/ComposerModals";
import { BroadcastComposer } from "@/components/chat/ChatManagementModals";
import { StoriesBar } from "@/components/chat/Stories";
import { UpdatesTab } from "@/components/layout/UpdatesTab";
import { CommunitiesTab } from "@/components/layout/CommunitiesTab";
import { CallsTab } from "@/components/layout/CallsTab";
import { useStories } from "@/context/StoriesContext";
import { CURRENT_USER_ID } from "@/mock/data";
function describeAttachment(type) {
  switch (type) {
    case "image":
      return "\u{1F4F7} Photo";
    case "document":
      return "\u{1F4C4} Document";
    case "gif":
      return "\u{1F3AC} GIF";
    case "ai-image":
      return "\u2728 AI image";
    case "voice":
      return "\u{1F3A4} Voice message";
    case "call":
      return "\u{1F4DE} Call";
    case "location":
      return "\u{1F4CD} Location";
    case "contact":
      return "\u{1F464} Contact";
    case "poll":
      return "\u{1F4CA} Poll";
    case "event":
      return "\u{1F4C5} Event";
    case "payment":
      return "\u{1F4B3} Payment";
    default:
      return "Attachment";
  }
}
function chatSubtitle(chat, messagesByChat) {
  const list = messagesByChat[chat.id];
  const last = list && list.length > 0 ? list[list.length - 1] : null;
  if (last) {
    if (last.deletedAt) return "This message was deleted";
    const prefix = last.senderId === CURRENT_USER_ID ? "You: " : "";
    const body = last.text || describeAttachment(last.attachments[0]?.type ?? "");
    return `${prefix}${body}`.slice(0, 60);
  }
  if (chat.lastMessagePreview) {
    const prefix = chat.lastMessagePreview.senderId === CURRENT_USER_ID ? "You: " : "";
    if (chat.lastMessagePreview.isDeleted) return "This message was deleted";
    const body = chat.lastMessagePreview.text || describeAttachment(chat.lastMessagePreview.attachmentType ?? "");
    return `${prefix}${body}`.slice(0, 60);
  }
  return "No messages yet";
}
function otherMember(chat, users) {
  const otherId = chat.memberIds.find((id) => id !== CURRENT_USER_ID);
  return otherId ? users[otherId] : void 0;
}
function Sidebar({ onSelectChat, activeChatId }) {
  const { chats, chatOrder, messagesByChat, users, connectionStatus, togglePinChat, toggleArchiveChat, createBroadcastList, createGroup, markAllRead, lists } = useChat();
  const { user, signOut, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const lastSeenHidden = settings.privacy.lastSeenAndOnline === "nobody";
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [broadcastComposerOpen, setBroadcastComposerOpen] = useState(false);
  const [groupComposerOpen, setGroupComposerOpen] = useState(false);
  const [rowMenuChatId, setRowMenuChatId] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [tab, setTab] = useState("chats");
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [matchingChatIds, setMatchingChatIds] = useState(null);
  const { storiesByUser, hasUnviewed } = useStories();
  const hasAnyUnviewedStory = Object.keys(storiesByUser).some((uid) => uid !== CURRENT_USER_ID && hasUnviewed(uid));
  const totalUnread = chatOrder.reduce((sum, id) => sum + (chats[id]?.unreadCount ?? 0), 0);
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setMatchingChatIds(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchMessages(q).then((results) => {
      if (cancelled) return;
      setMatchingChatIds(new Set(results.map((r) => r.chatId)));
      setSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);
  const searchFilteredIds = useMemo(() => {
    if (!debouncedQuery.trim()) return chatOrder;
    const q = debouncedQuery.toLowerCase();
    return chatOrder.filter((id) => {
      const chat = chats[id];
      if (!chat) return false;
      if (chat.name.toLowerCase().includes(q)) return true;
      return matchingChatIds?.has(id) ?? false;
    });
  }, [chatOrder, chats, debouncedQuery, matchingChatIds]);
  const archivedCount = chatOrder.filter((id) => chats[id]?.archived).length;
  const [chatFilter, setChatFilter] = useState("all");
  const visibleChatIds = (showArchived ? searchFilteredIds.filter((id) => chats[id]?.archived) : searchFilteredIds.filter((id) => !chats[id]?.archived)).filter((id) => {
    if (chatFilter === "all") return true;
    const c = chats[id];
    if (!c) return false;
    if (chatFilter === "unread") return c.unreadCount > 0;
    if (chatFilter === "groups") return c.type === "group";
    return c.listIds?.includes(chatFilter) ?? false;
  });
  return <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:w-80">{
    /* Header */
  }<div className="flex items-center justify-between gap-2 bg-brand-700 px-4 py-3 dark:bg-brand-900"><div className="flex items-center gap-2"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg><span className="font-semibold text-white">Pulse</span><span
    className={`h-2 w-2 rounded-full ring-2 ring-white/40 ${connectionStatus === "connected" ? "bg-emerald-300" : connectionStatus === "disconnected" ? "bg-rose-300" : "bg-amber-300"}`}
    title={`Connection: ${connectionStatus}`}
  /></div><div className="relative"><button
    onClick={() => setMenuOpen((o) => !o)}
    aria-label="Account menu"
    className="rounded-full ring-2 ring-white/70 ring-offset-2 ring-offset-brand-700 focus:ring-white dark:ring-offset-brand-900"
  >{user && <Avatar user={user} size={32} />}</button>{menuOpen && <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"><div className="px-3 py-2 text-sm"><p className="font-medium text-slate-800 dark:text-slate-100">{user?.name}</p><p className="text-xs text-slate-400">Signed in</p></div><button
    onClick={() => {
      setProfileModalOpen(true);
      setMenuOpen(false);
    }}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                👤 Edit profile
              </button><button
    onClick={() => {
      navigate("/settings");
      setMenuOpen(false);
    }}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                ⚙️ Settings
              </button><button
    onClick={() => {
      setGroupComposerOpen(true);
      setMenuOpen(false);
    }}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                👥 New group
              </button><button
    onClick={() => {
      setBroadcastComposerOpen(true);
      setMenuOpen(false);
    }}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                📢 New broadcast list
              </button><button
    onClick={() => {
      markAllRead();
      setMenuOpen(false);
    }}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                ✓✓ Mark all as read
              </button><button
    onClick={toggleTheme}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >{theme === "dark" ? "\u2600\uFE0F Light mode" : "\u{1F319} Dark mode"}</button><button
    onClick={signOut}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
  >
                Sign out
              </button></div>}</div></div>{profileModalOpen && user && <AvatarEditModal user={user} onSave={updateProfile} onClose={() => setProfileModalOpen(false)} />}{groupComposerOpen && <BroadcastComposer
    contacts={Object.values(users).filter((u) => u.id !== CURRENT_USER_ID)}
    mode="group"
    onCreate={(name, memberIds) => {
      const id = createGroup(name, memberIds);
      setGroupComposerOpen(false);
      navigate(`/chat/${id}`);
    }}
    onClose={() => setGroupComposerOpen(false)}
  />}{broadcastComposerOpen && <BroadcastComposer
    contacts={Object.values(users).filter((u) => u.id !== CURRENT_USER_ID)}
    onCreate={(name, memberIds) => {
      const id = createBroadcastList(name, memberIds);
      setBroadcastComposerOpen(false);
      navigate(`/chat/${id}`);
    }}
    onClose={() => setBroadcastComposerOpen(false)}
  />}{
    /* WhatsApp-style top tab bar: Chats / Updates / Communities / Calls */
  }<div className="flex border-b border-slate-100 px-2 dark:border-slate-800">{[
    { id: "chats", label: "Chats", badge: totalUnread > 0 },
    { id: "updates", label: "Updates", badge: hasAnyUnviewedStory },
    { id: "communities", label: "Communities", badge: false },
    { id: "calls", label: "Calls", badge: false }
  ].map((t) => <button
    key={t.id}
    onClick={() => setTab(t.id)}
    className={`relative flex-1 px-2 py-2.5 text-center text-xs font-medium transition ${tab === t.id ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400"}`}
  ><span className="relative inline-block">{t.label}{t.badge && <span className="absolute -right-2 -top-1 h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />}</span>{tab === t.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500" />}</button>)}</div>{tab === "updates" && <UpdatesTab users={users} />}{tab === "communities" && <CommunitiesTab onOpenChat={onSelectChat} />}{tab === "calls" && <CallsTab onOpenChat={onSelectChat} />}{tab === "chats" && <>{!showArchived && <StoriesBar users={users} />}{
    /* Search */
  }<div className="px-4 py-2"><div className="relative"><svg
    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  ><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search chats or messages"
    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
  />{searching && <Spinner size={14} className="absolute right-3 top-1/2 -translate-y-1/2" />}</div></div>{!showArchived && <div className="scrollbar-thin flex gap-1.5 overflow-x-auto px-4 pb-2">{[
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "groups", label: "Groups" },
    ...lists.map((l) => ({ id: l.id, label: l.name }))
  ].map((f) => <button
    key={f.id}
    onClick={() => setChatFilter(f.id)}
    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${chatFilter === f.id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
  >{f.label}</button>)}</div>}{showArchived && <button
    onClick={() => setShowArchived(false)}
    className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
  >
          ← Back to chats
        </button>}{
    /* Chat list */
  }<div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2">{!showArchived && archivedCount > 0 && <button
    onClick={() => setShowArchived(true)}
    className="mb-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
  ><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg dark:bg-slate-700">
              🗄️
            </div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-900 dark:text-white">Archived</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{archivedCount} chats</p></div></button>}{visibleChatIds.length === 0 ? <EmptyState
    title={showArchived ? "No archived chats" : "No chats found"}
    description={showArchived ? "Chats you archive will show up here." : "Try a different search term."}
  /> : visibleChatIds.map((id) => {
    const chat = chats[id];
    if (!chat) return null;
    const partner = chat.type === "direct" ? otherMember(chat, users) : void 0;
    const isActive = id === activeChatId;
    return <div
      key={id}
      role="button"
      tabIndex={0}
      onClick={() => onSelectChat(id)}
      onKeyDown={(e) => e.key === "Enter" && onSelectChat(id)}
      className={`group relative mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${isActive ? "bg-gradient-to-r from-brand-50 to-fuchsia-50 dark:from-brand-500/10 dark:to-fuchsia-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
    >{chat.type === "direct" && partner ? <Avatar user={partner} showStatus={!lastSeenHidden} size={44} /> : chat.type === "broadcast" ? <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-500 text-base text-white"
      aria-hidden
    >
                    📢
                  </div> : <GroupAvatar chat={chat} size={44} />}<div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-slate-900 dark:text-white">{chat.name}</p>{chat.pinned && <span className="text-xs text-slate-400">📌</span>}{chat.muted && <span className="text-xs text-slate-400">🔇</span>}</div><p className="truncate text-xs text-slate-500 dark:text-slate-400">{chatSubtitle(chat, messagesByChat)}</p></div><Badge count={chat.unreadCount} />{
      /* Per-chat menu (pin/archive) — rendered via portal so it can't
         be clipped by this list's overflow-y-auto container. */
    }<div className="relative shrink-0"><button
      onClick={(e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        if (rowMenuChatId === id) {
          setRowMenuChatId(null);
        } else {
          const menuHeight = 76;
          const spaceBelow = window.innerHeight - rect.bottom;
          const top = spaceBelow >= menuHeight + 8 ? rect.bottom + 4 : Math.max(8, rect.top - menuHeight - 4);
          setMenuPos({ top, left: rect.right - 160 });
          setRowMenuChatId(id);
        }
      }}
      className="rounded-full p-1 text-slate-400 opacity-0 hover:bg-slate-200/60 group-hover:opacity-100 dark:hover:bg-slate-700"
      aria-label="Chat options"
      title="Chat options"
    >
                    ⋮
                  </button>{rowMenuChatId === id && menuPos && createPortal(
      <><div className="fixed inset-0 z-40" onClick={() => setRowMenuChatId(null)} /><div
        onClick={(e) => e.stopPropagation()}
        style={{ top: menuPos.top, left: menuPos.left }}
        className="fixed z-50 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
      ><button
        onClick={() => {
          togglePinChat(id);
          setRowMenuChatId(null);
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
      >{chat.pinned ? "\u{1F4CC} Unpin chat" : "\u{1F4CC} Pin chat"}</button><button
        onClick={() => {
          toggleArchiveChat(id);
          setRowMenuChatId(null);
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
      >{chat.archived ? "\u{1F5C4}\uFE0F Unarchive chat" : "\u{1F5C4}\uFE0F Archive chat"}</button></div></>,
      document.body
    )}</div></div>;
  })}</div></>}</aside>;
}
export {
  Sidebar
};
