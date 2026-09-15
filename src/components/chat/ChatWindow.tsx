import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/context/ChatContext";
import { useSettings } from "@/context/SettingsContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { searchMessages } from "@/services/api";
import { CURRENT_USER_ID } from "@/mock/data";
import { Avatar, GroupAvatar, EmptyState, Spinner, ConnectionBanner } from "@/components/common/Common";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { CallScreen } from "@/components/chat/CallScreen";
import {
  ForwardPicker,
  GroupInfoPanel,
  StarredMessagesPanel,
  ContactInfoPanel,
  DisappearingMessagesPicker,
  ReportUserModal,
  SharedMediaPanel,
  ChatWallpaperPicker,
  AddToListModal
} from "@/components/chat/ChatManagementModals";
function formatLastSeen(ts) {
  if (!ts) return "offline";
  const mins = Math.round((Date.now() - ts) / 6e4);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
function dateHeading(ts) {
  const d = new Date(ts);
  const today = /* @__PURE__ */ new Date();
  const yesterday = /* @__PURE__ */ new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}
function ChatWindow({ chat, onBack }) {
  const navigate = useNavigate();
  const {
    chats,
    messagesByChat,
    pagination,
    users,
    typingByChat,
    connectionStatus,
    loadMoreMessages,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    votePoll,
    startTyping,
    stopTyping,
    simulateConnectionDrop,
    toggleStarMessage,
    forwardMessage,
    addGroupMember,
    removeGroupMember,
    toggleGroupAdmin,
    setOnlyAdminsCanSend,
    logCallMessage,
    setDisappearingDuration,
    openViewOnce,
    setGroupDescription,
    resetGroupInviteLink,
    sendBroadcastMessage,
    toggleMuteChat,
    setChatWallpaper,
    clearChat,
    lists,
    createList,
    toggleChatList,
    startDirectChat
  } = useChat();
  const { settings, isBlocked, blockUser, unblockUser } = useSettings();
  const lastSeenHidden = settings.privacy.lastSeenAndOnline === "nobody";
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [contactInfoOpen, setContactInfoOpen] = useState(false);
  const [disappearingPickerOpen, setDisappearingPickerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [starredOpen, setStarredOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sharedMediaOpen, setSharedMediaOpen] = useState(false);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [clearChatConfirmOpen, setClearChatConfirmOpen] = useState(false);
  const [shortcutCopied, setShortcutCopied] = useState(false);
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1e4);
    return () => clearInterval(interval);
  }, []);
  const messages = (messagesByChat[chat.id] ?? []).filter((m) => !m.expiresAt || m.expiresAt > Date.now());
  const pag = pagination[chat.id];
  const typingUserIds = (typingByChat[chat.id] ?? []).filter((id) => id !== CURRENT_USER_ID);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [highlightedId, setHighlightedId] = useState(null);
  const [remoteResults, setRemoteResults] = useState([]);
  const [remoteSearching, setRemoteSearching] = useState(false);
  const [jumping, setJumping] = useState(false);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const initialLoadDone = useRef(false);
  const messagesByChatRef = useRef(messagesByChat);
  messagesByChatRef.current = messagesByChat;
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q) {
      setRemoteResults([]);
      return;
    }
    let cancelled = false;
    setRemoteSearching(true);
    searchMessages(q, chat.id).then((results) => {
      if (cancelled) return;
      setRemoteResults(results);
      setRemoteSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, chat.id]);
  useEffect(() => {
    initialLoadDone.current = false;
    setSearchOpen(false);
    setSearchQuery("");
    setReplyTo(null);
    setEditingMessage(null);
    if (!pagination[chat.id]?.loaded) {
      loadMoreMessages(chat.id);
    }
  }, [chat.id]);
  useEffect(() => {
    if (!initialLoadDone.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      initialLoadDone.current = true;
    }
  }, [messages.length]);
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 200) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId]);
  function handleLoadMore() {
    const el = scrollRef.current;
    if (el) prevScrollHeight.current = el.scrollHeight;
    loadMoreMessages(chat.id).then(() => {
      requestAnimationFrame(() => {
        const el2 = scrollRef.current;
        if (el2) el2.scrollTop = el2.scrollHeight - prevScrollHeight.current;
      });
    });
  }
  const sentinelRef = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    enabled: !!pag?.hasMore && !pag?.loading
  });
  const messagesById = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);
  const visibleMessages = messages;
  const searchResults = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return [];
    const map = /* @__PURE__ */ new Map();
    messages.forEach((m) => {
      if (!m.deletedAt && m.text.toLowerCase().includes(q)) {
        map.set(m.id, { id: m.id, text: m.text, senderId: m.senderId, createdAt: m.createdAt, loaded: true });
      }
    });
    remoteResults.forEach((r) => {
      if (!map.has(r.messageId)) {
        map.set(r.messageId, { id: r.messageId, text: r.snippet, senderId: r.senderId, createdAt: r.createdAt, loaded: false });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [messages, remoteResults, debouncedSearch]);
  async function jumpToMessage(messageId) {
    if (messagesByChatRef.current[chat.id]?.some((m) => m.id === messageId)) {
      scrollToMessage(messageId);
      setSearchOpen(false);
      setSearchQuery("");
      return;
    }
    setJumping(true);
    for (let i = 0; i < 30; i++) {
      await loadMoreMessages(chat.id);
      if (messagesByChatRef.current[chat.id]?.some((m) => m.id === messageId)) {
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToMessage(messageId)));
        break;
      }
      if (!paginationRef.current[chat.id]?.hasMore) break;
    }
    setJumping(false);
    setSearchOpen(false);
    setSearchQuery("");
  }
  const partner = chat.type === "direct" ? users[chat.memberIds.find((id) => id !== CURRENT_USER_ID) ?? ""] : void 0;
  const isBroadcast = chat.type === "broadcast";
  const partnerBlocked = partner ? isBlocked(partner.id) : false;
  const isAdmin = chat.type === "group" ? (chat.adminIds ?? []).includes(CURRENT_USER_ID) : true;
  const inputDisabledReason = chat.type === "group" && chat.onlyAdminsCanSend && !isAdmin ? "Only admins can send messages in this group" : partnerBlocked ? null : null;
  const starredMessages = useMemo(() => {
    const out = [];
    Object.entries(messagesByChat).forEach(([chatId, msgs]) => {
      msgs.forEach((m) => {
        if (m.starredBy?.includes(CURRENT_USER_ID)) out.push({ message: m, chatId });
      });
    });
    return out.sort((a, b) => b.message.createdAt - a.message.createdAt);
  }, [messagesByChat]);
  function scrollToMessage(id) {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 1500);
    }
  }
  function exportChatAsText() {
    const lines = messages.filter((m) => !m.deletedAt).map((m) => {
      const sender = m.senderId === CURRENT_USER_ID ? "You" : users[m.senderId]?.name ?? "Unknown";
      const time = new Date(m.createdAt).toLocaleString();
      const body = m.text || (m.attachments[0] ? `[${m.attachments[0].type}]` : "");
      return `[${time}] ${sender}: ${body}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chat.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-chat-export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function copyShortcutLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/chat/${chat.id}`);
      setShortcutCopied(true);
      setTimeout(() => setShortcutCopied(false), 1500);
    } catch {
    }
  }
  function handleSend(text, attachments) {
    if (isBroadcast) {
      sendBroadcastMessage(chat.id, text, attachments);
    } else {
      sendMessage(chat.id, text, { replyToId: replyTo?.id ?? null, attachments });
    }
    setReplyTo(null);
  }
  const headerSubtitle = chat.type === "direct" ? partner ? partnerBlocked ? "Blocked" : lastSeenHidden ? "" : partner.status === "online" ? "Online" : `Last seen ${formatLastSeen(partner.lastSeen)}` : "" : isBroadcast ? `Broadcast \xB7 ${chat.memberIds.length - 1} recipients` : `${chat.memberIds.length} members`;
  const wallpaperClass = {
    default: "bg-slate-50 dark:bg-surface-dark",
    "solid-teal": "bg-teal-50 dark:bg-teal-950/40",
    "solid-navy": "bg-indigo-50 dark:bg-indigo-950/40",
    "solid-blush": "bg-pink-50 dark:bg-pink-950/30",
    none: "bg-white dark:bg-surface-dark"
  };
  const fontSizeClass = { small: "text-[13px]", medium: "text-sm", large: "text-base" }[settings.fontSize];
  return <div className={`flex h-full flex-1 flex-col ${wallpaperClass[chat.wallpaper ?? settings.wallpaper]} ${fontSizeClass}`}><ConnectionBanner status={connectionStatus} />{
    /* Header */
  }<div className="flex items-center justify-between gap-2 border-b border-black/10 bg-brand-700 px-4 py-3 dark:border-white/10 dark:bg-brand-900"><div
    onClick={() => {
      if (chat.type === "group") setGroupInfoOpen(true);
      else if (chat.type === "direct" && partner) setContactInfoOpen(true);
    }}
    className={`flex min-w-0 items-center gap-3 text-left ${chat.type !== "broadcast" ? "cursor-pointer" : ""}`}
  >{onBack && <button
    onClick={(e) => {
      e.stopPropagation();
      onBack();
    }}
    className="shrink-0 rounded-full p-1.5 text-white/90 hover:bg-white/10"
    aria-label="Back to chats"
    title="Back to chats"
  ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>}{chat.type === "direct" && partner ? <Avatar user={partner} showStatus={!lastSeenHidden} size={38} /> : isBroadcast ? <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-500 text-sm text-white">
              📢
            </div> : <GroupAvatar chat={chat} size={38} />}<div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{chat.name}</p><p className="truncate text-xs text-white/70">{headerSubtitle}</p></div></div><div className="flex items-center gap-0.5">{chat.type === "direct" && partner && !partnerBlocked && <><button
    onClick={() => setActiveCall("voice")}
    className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
    title="Voice call"
    aria-label="Voice call"
  ><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg></button><button
    onClick={() => setActiveCall("video")}
    className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
    title="Video call"
    aria-label="Video call"
  ><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg></button></>}<button
    onClick={() => setStarredOpen(true)}
    className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
    title="Starred messages"
    aria-label="Starred messages"
  >
            ⭐
          </button><button
    onClick={() => {
      setSearchOpen((s) => {
        if (s) setSearchQuery("");
        return !s;
      });
    }}
    className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
    title="Search in conversation"
  ><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></button><div className="relative"><button
    onClick={() => {
      setChatMenuOpen((o) => !o);
      setMoreOpen(false);
    }}
    className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
    title="More options"
    aria-label="More options"
  ><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>{chatMenuOpen && <><div className="fixed inset-0 z-40" onClick={() => {
    setChatMenuOpen(false);
    setMoreOpen(false);
  }} /><div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">{!moreOpen ? <>{!isBroadcast && <button
    onClick={() => {
      setChatMenuOpen(false);
      if (chat.type === "group") setGroupInfoOpen(true);
      else setContactInfoOpen(true);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >{chat.type === "group" ? "\u{1F465} Group info" : "\u{1F464} View contact"}</button>}<button
    onClick={() => {
      setChatMenuOpen(false);
      setSharedMediaOpen(true);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                        🖼️ Media, links and docs
                      </button><button
    onClick={() => {
      toggleMuteChat(chat.id);
      setChatMenuOpen(false);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >{chat.muted ? "\u{1F514} Unmute notifications" : "\u{1F507} Mute notifications"}</button>{!isBroadcast && <button
    onClick={() => {
      setChatMenuOpen(false);
      setDisappearingPickerOpen(true);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                          ⏳ Disappearing messages
                        </button>}<button
    onClick={() => {
      setChatMenuOpen(false);
      setWallpaperPickerOpen(true);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                        🎨 Chat wallpaper
                      </button><div className="my-1 border-t border-slate-100 dark:border-slate-700" /><button
    onClick={() => setMoreOpen(true)}
    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  ><span>More</span><span className="text-slate-300">›</span></button></> : <><button
    onClick={() => setMoreOpen(false)}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
  >
                        ← Back
                      </button><div className="my-1 border-t border-slate-100 dark:border-slate-700" />{chat.type === "direct" && partner && !partnerBlocked && <button
    onClick={() => {
      setChatMenuOpen(false);
      setMoreOpen(false);
      setReportOpen(true);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
  >
                          ⚠️ Report {partner.name}</button>}{chat.type === "direct" && partner && <button
    onClick={() => {
      if (partnerBlocked) unblockUser(partner.id);
      else blockUser(partner.id);
      setChatMenuOpen(false);
      setMoreOpen(false);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
  >
                          🚫 {partnerBlocked ? `Unblock ${partner.name}` : `Block ${partner.name}`}</button>}<button
    onClick={() => {
      setChatMenuOpen(false);
      setMoreOpen(false);
      setClearChatConfirmOpen(true);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                        🧹 Clear chat
                      </button><button
    onClick={() => {
      exportChatAsText();
      setChatMenuOpen(false);
      setMoreOpen(false);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                        ⬇️ Export chat
                      </button><button
    onClick={copyShortcutLink}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                        🔗 {shortcutCopied ? "Link copied!" : "Add shortcut"}</button><button
    onClick={() => {
      setChatMenuOpen(false);
      setMoreOpen(false);
      setAddToListOpen(true);
    }}
    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
  >
                        📋 Add to list
                      </button></>}</div></>}</div><button
    onClick={simulateConnectionDrop}
    className="hidden rounded-full px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 lg:block"
    title="Demo: simulate a dropped connection"
  >
            Simulate drop
          </button></div></div>{searchOpen && <div className="border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900"><input
    autoFocus
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search messages in this conversation…"
    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
  />{debouncedSearch && <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">{remoteSearching && <Spinner size={11} />}{searchResults.length} result{searchResults.length === 1 ? "" : "s"}</p>}</div>}{
    /* Message list */
  }<div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto py-3">{debouncedSearch.trim() ? searchResults.length === 0 ? <EmptyState title="No messages found" description={remoteSearching ? "Searching\u2026" : "Try a different search term."} /> : <div className="px-2">{searchResults.map((r) => {
    const sender = users[r.senderId];
    const idx = r.text.toLowerCase().indexOf(debouncedSearch.trim().toLowerCase());
    return <button
      key={r.id}
      onClick={() => jumpToMessage(r.id)}
      disabled={jumping}
      className="mb-1 flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
    >{sender && <Avatar user={sender} size={32} />}<div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{sender?.id === CURRENT_USER_ID ? "You" : sender?.name ?? "Unknown"}</p><span className="shrink-0 text-[11px] text-slate-400">{dateHeading(r.createdAt)}</span></div><p className="truncate text-xs text-slate-500 dark:text-slate-400">{idx === -1 ? r.text : <>{r.text.slice(0, idx)}<mark className="rounded bg-amber-200 px-0.5 dark:bg-amber-500/40">{r.text.slice(idx, idx + debouncedSearch.trim().length)}</mark>{r.text.slice(idx + debouncedSearch.trim().length)}</>}</p></div></button>;
  })}</div> : pag?.loaded && messages.length === 0 ? <EmptyState
    title="No messages yet"
    description="Say hello and start the conversation."
    icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>}
  /> : <><div ref={sentinelRef} className="flex justify-center py-2">{pag?.loading && <Spinner size={18} />}{!pag?.hasMore && pag?.loaded && messages.length > 0 && <span className="text-xs text-slate-300 dark:text-slate-600">Beginning of conversation</span>}</div>{visibleMessages.map((m, i) => {
    const prev = visibleMessages[i - 1];
    const showDateHeading = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
    const sender = users[m.senderId];
    const isOwn = m.senderId === CURRENT_USER_ID;
    const replyToMessage = m.replyToId ? messagesById.get(m.replyToId) ?? null : null;
    return <React.Fragment key={m.id}>{showDateHeading && <div className="my-3 flex justify-center"><span className="rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{dateHeading(m.createdAt)}</span></div>}<div id={`msg-${m.id}`} className={highlightedId === m.id ? "rounded-xl bg-amber-100/60 dark:bg-amber-500/10" : ""}><MessageBubble
      message={m}
      sender={sender}
      isOwn={isOwn}
      replyToMessage={replyToMessage}
      highlight={debouncedSearch || void 0}
      onReply={setReplyTo}
      onEdit={setEditingMessage}
      onDelete={(msg) => deleteMessage(chat.id, msg.id)}
      onReact={(msg, emoji) => reactToMessage(chat.id, msg.id, emoji)}
      onRetry={(msg) => retryMessage(chat.id, msg.id)}
      onJumpTo={scrollToMessage}
      onVotePoll={(msg, optionId) => votePoll(chat.id, msg.id, optionId)}
      onStar={(msg) => toggleStarMessage(chat.id, msg.id)}
      onForward={(msg) => setForwardingMessage(msg)}
      onOpenViewOnce={(msg) => openViewOnce(chat.id, msg.id)}
    /></div></React.Fragment>;
  })}{typingUserIds.length > 0 && <TypingIndicator
    label={typingUserIds.length === 1 ? `${users[typingUserIds[0]]?.name ?? "Someone"} is typing\u2026` : `${typingUserIds.length} people are typing\u2026`}
  />}<div ref={bottomRef} /></>}</div><MessageInput
    onSend={handleSend}
    onTypingStart={() => startTyping(chat.id)}
    onTypingStop={() => stopTyping(chat.id)}
    replyTo={replyTo}
    onCancelReply={() => setReplyTo(null)}
    editingMessage={editingMessage}
    onSubmitEdit={(text) => {
      if (editingMessage) editMessage(chat.id, editingMessage.id, text);
      setEditingMessage(null);
    }}
    onCancelEdit={() => setEditingMessage(null)}
    users={Object.values(users)}
    disabledReason={partnerBlocked ? `You blocked ${partner?.name}. Unblock to send messages.` : inputDisabledReason}
  />{forwardingMessage && <ForwardPicker
    chats={Object.values(chats).filter((c) => c.id !== chat.id)}
    onForward={(targetChatIds) => {
      forwardMessage(forwardingMessage, targetChatIds);
      setForwardingMessage(null);
    }}
    onClose={() => setForwardingMessage(null)}
  />}{groupInfoOpen && chat.type === "group" && <GroupInfoPanel
    chat={chat}
    users={users}
    contacts={Object.values(users).filter((u) => u.id !== CURRENT_USER_ID)}
    messages={messages}
    onClose={() => setGroupInfoOpen(false)}
    onAddMember={(userId) => addGroupMember(chat.id, userId)}
    onRemoveMember={(userId) => removeGroupMember(chat.id, userId)}
    onToggleAdmin={(userId) => toggleGroupAdmin(chat.id, userId)}
    onToggleOnlyAdmins={(value) => setOnlyAdminsCanSend(chat.id, value)}
    onSetDescription={(description) => setGroupDescription(chat.id, description)}
    onResetInviteLink={() => resetGroupInviteLink(chat.id)}
    onOpenDisappearing={() => {
      setGroupInfoOpen(false);
      setDisappearingPickerOpen(true);
    }}
    onMessageMember={(userId) => {
      const id = startDirectChat(userId);
      setGroupInfoOpen(false);
      navigate(`/chat/${id}`);
    }}
  />}{contactInfoOpen && partner && <ContactInfoPanel
    user={partner}
    chat={chat}
    messages={messages}
    isBlocked={partnerBlocked}
    onClose={() => setContactInfoOpen(false)}
    onBlock={() => {
      blockUser(partner.id);
      setContactInfoOpen(false);
    }}
    onUnblock={() => unblockUser(partner.id)}
    onReport={() => {
      setContactInfoOpen(false);
      setReportOpen(true);
    }}
    onOpenDisappearing={() => {
      setContactInfoOpen(false);
      setDisappearingPickerOpen(true);
    }}
  />}{disappearingPickerOpen && <DisappearingMessagesPicker
    current={chat.disappearingMessagesDuration}
    onSelect={(ms) => setDisappearingDuration(chat.id, ms)}
    onClose={() => setDisappearingPickerOpen(false)}
  />}{reportOpen && partner && <ReportUserModal userName={partner.name} onSubmit={() => {
  }} onClose={() => setReportOpen(false)} />}{sharedMediaOpen && <SharedMediaPanel messages={messages} initialTab="media" onClose={() => setSharedMediaOpen(false)} />}{wallpaperPickerOpen && <ChatWallpaperPicker
    current={chat.wallpaper ?? null}
    onSelect={(w) => {
      setChatWallpaper(chat.id, w);
      setWallpaperPickerOpen(false);
    }}
    onClose={() => setWallpaperPickerOpen(false)}
  />}{addToListOpen && <AddToListModal
    lists={lists}
    currentListIds={chat.listIds ?? []}
    onToggle={(listId) => toggleChatList(chat.id, listId)}
    onCreateList={(name) => {
      const id = createList(name);
      toggleChatList(chat.id, id);
    }}
    onClose={() => setAddToListOpen(false)}
  />}{clearChatConfirmOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setClearChatConfirmOpen(false)}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800"><h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Clear this chat?</h2><p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              All messages in this chat will be deleted. This can't be undone.
            </p><div className="flex gap-2"><button
    onClick={() => setClearChatConfirmOpen(false)}
    className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
  >
                Cancel
              </button><button
    onClick={() => {
      clearChat(chat.id);
      setClearChatConfirmOpen(false);
    }}
    className="flex-1 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-600"
  >
                Clear chat
              </button></div></div></div>}{starredOpen && <StarredMessagesPanel
    starred={starredMessages}
    chats={chats}
    users={users}
    onClose={() => setStarredOpen(false)}
    onJump={(chatId, messageId) => {
      setStarredOpen(false);
      if (chatId === chat.id) {
        scrollToMessage(messageId);
      } else {
        navigate(`/chat/${chatId}`);
      }
    }}
    onUnstar={(chatId, messageId) => toggleStarMessage(chatId, messageId)}
  />}{activeCall && partner && <CallScreen
    user={partner}
    kind={activeCall}
    onEnd={(result) => {
      logCallMessage(chat.id, activeCall, result.status, result.duration);
      setActiveCall(null);
    }}
  />}</div>;
}
export {
  ChatWindow
};
