import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { Attachment, Chat, ChatId, ChatList, ChatMessage, ChatWallpaper, ConnectionStatus, MessageId, User, UserId } from "@/types";
import { mockSocket } from "@/services/mockSocket";
import { fetchChats, fetchMessages, fetchUsers } from "@/services/api";
import { CURRENT_USER_ID } from "@/mock/data";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

interface PaginationState {
  cursor?: string | null;
  hasMore: boolean;
  loading: boolean;
  loaded: boolean;
}

interface ChatState {
  chats: Record<ChatId, Chat>;
  chatOrder: ChatId[];
  messagesByChat: Record<ChatId, ChatMessage[]>;
  pagination: Record<ChatId, PaginationState>;
  users: Record<UserId, User>;
  typingByChat: Record<ChatId, UserId[]>;
  connectionStatus: ConnectionStatus;
  activeChatId: ChatId | null;
  chatsLoaded: boolean;
  lists: ChatList[];
}

const initialState: ChatState = {
  chats: {},
  chatOrder: [],
  messagesByChat: {},
  pagination: {},
  users: {},
  typingByChat: {},
  connectionStatus: "connecting",
  activeChatId: null,
  chatsLoaded: false,
  lists: [{ id: "list-favorites", name: "Favorites" }]
};
function upsertMessage(list: ChatMessage[], message: ChatMessage) {
  const idx = list.findIndex((m) => m.id === message.id);
  if (idx === -1) return [...list, message].sort((a, b) => a.createdAt - b.createdAt);
  const next = [...list];
  next[idx] = message;
  return next;
}
function reducer(state: ChatState, action: any): ChatState {
  switch (action.type) {
    case "HYDRATE_CHATS": {
      const chats: Record<ChatId, Chat> = {};
      action.chats.forEach((c: Chat) => {
        chats[c.id] = c.id === state.activeChatId ? { ...c, unreadCount: 0 } : c;
      });
      const order = action.chats.slice().sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || (b.lastMessagePreview?.createdAt ?? b.createdAt) - (a.lastMessagePreview?.createdAt ?? a.createdAt)
      ).map((c) => c.id);
      return { ...state, chats, chatOrder: order, chatsLoaded: true };
    }
    case "HYDRATE_USERS": {
      const users = {};
      action.users.forEach((u) => users[u.id] = u);
      return { ...state, users };
    }
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChatId: action.chatId };
    case "MESSAGES_PAGE_LOADING":
      return {
        ...state,
        pagination: {
          ...state.pagination,
          [action.chatId]: {
            ...state.pagination[action.chatId] ?? { cursor: null, hasMore: true, loaded: false },
            loading: true
          }
        }
      };
    case "MESSAGES_PAGE_LOADED": {
      const existing = state.messagesByChat[action.chatId] ?? [];
      const merged = [...action.messages, ...existing].filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i).sort((a, b) => a.createdAt - b.createdAt);
      return {
        ...state,
        messagesByChat: { ...state.messagesByChat, [action.chatId]: merged },
        pagination: {
          ...state.pagination,
          [action.chatId]: { cursor: action.cursor, hasMore: action.hasMore, loading: false, loaded: true }
        }
      };
    }
    case "MESSAGE_SEND_OPTIMISTIC": {
      const list = state.messagesByChat[action.message.chatId] ?? [];
      return {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [action.message.chatId]: [...list, action.message]
        },
        chats: {
          ...state.chats,
          [action.message.chatId]: {
            ...state.chats[action.message.chatId],
            lastMessageId: action.message.id
          }
        }
      };
    }
    case "MESSAGE_ACK": {
      const chatId = action.message.chatId;
      const list = (state.messagesByChat[chatId] ?? []).map(
        (m) => m.clientTempId === action.clientTempId ? { ...action.message } : m
      );
      return { ...state, messagesByChat: { ...state.messagesByChat, [chatId]: list } };
    }
    case "MESSAGE_STATUS": {
      const list = (state.messagesByChat[action.chatId] ?? []).map(
        (m) => m.id === action.messageId ? { ...m, status: action.status } : m
      );
      return { ...state, messagesByChat: { ...state.messagesByChat, [action.chatId]: list } };
    }
    case "MESSAGE_RETRY": {
      const list = (state.messagesByChat[action.chatId] ?? []).map(
        (m) => m.id === action.messageId ? { ...m, status: "sending" } : m
      );
      return { ...state, messagesByChat: { ...state.messagesByChat, [action.chatId]: list } };
    }
    case "MESSAGE_NEW": {
      const { chatId } = action.message;
      const list = upsertMessage(state.messagesByChat[chatId] ?? [], action.message);
      const isActive = state.activeChatId === chatId;
      const chat = state.chats[chatId];
      return {
        ...state,
        messagesByChat: { ...state.messagesByChat, [chatId]: list },
        chats: chat ? {
          ...state.chats,
          [chatId]: {
            ...chat,
            lastMessageId: action.message.id,
            unreadCount: isActive ? chat.unreadCount : chat.unreadCount + 1
          }
        } : state.chats
      };
    }
    case "MESSAGE_EDITED_LOCAL": {
      const list = (state.messagesByChat[action.chatId] ?? []).map(
        (m) => m.id === action.messageId ? { ...m, text: action.text, editedAt: Date.now() } : m
      );
      return { ...state, messagesByChat: { ...state.messagesByChat, [action.chatId]: list } };
    }
    case "MESSAGE_DELETED_LOCAL": {
      const list = (state.messagesByChat[action.chatId] ?? []).map(
        (m) => m.id === action.messageId ? { ...m, deletedAt: Date.now(), text: "" } : m
      );
      return { ...state, messagesByChat: { ...state.messagesByChat, [action.chatId]: list } };
    }
    case "MESSAGE_REACT_LOCAL": {
      const list = (state.messagesByChat[action.chatId] ?? []).map((m) => {
        if (m.id !== action.messageId) return m;
        const reactions = m.reactions.map((r) => ({ ...r, userIds: [...r.userIds] }));
        const existing = reactions.find((r) => r.emoji === action.emoji);
        if (existing) {
          const has = existing.userIds.includes(action.userId);
          existing.userIds = has ? existing.userIds.filter((id) => id !== action.userId) : [...existing.userIds, action.userId];
          return { ...m, reactions: reactions.filter((r) => r.userIds.length > 0) };
        }
        return { ...m, reactions: [...reactions, { emoji: action.emoji, userIds: [action.userId] }] };
      });
      return { ...state, messagesByChat: { ...state.messagesByChat, [action.chatId]: list } };
    }
    case "MESSAGE_POLL_VOTE": {
      const list = (state.messagesByChat[action.chatId] ?? []).map((m) => {
        if (m.id !== action.messageId) return m;
        const attachments = m.attachments.map((a) => {
          if (a.type !== "poll") return a;
          const alreadyVoted = a.options.find((o) => o.id === action.optionId)?.votes.includes(action.userId);
          const options = a.options.map((o) => {
            let votes = o.votes;
            if (o.id === action.optionId) {
              votes = alreadyVoted ? votes.filter((id) => id !== action.userId) : [...votes, action.userId];
            } else if (!a.allowMultiple) {
              votes = votes.filter((id) => id !== action.userId);
            }
            return { ...o, votes };
          });
          return { ...a, options };
        });
        return { ...m, attachments };
      });
      return { ...state, messagesByChat: { ...state.messagesByChat, [action.chatId]: list } };
    }
    case "TYPING_UPDATE": {
      const current = state.typingByChat[action.chatId] ?? [];
      const next = action.isTyping ? Array.from(/* @__PURE__ */ new Set([...current, action.userId])) : current.filter((id) => id !== action.userId);
      return { ...state, typingByChat: { ...state.typingByChat, [action.chatId]: next } };
    }
    case "PRESENCE_UPDATE": {
      const user = state.users[action.userId];
      if (!user) return state;
      return {
        ...state,
        users: {
          ...state.users,
          [action.userId]: { ...user, status: action.status, lastSeen: action.lastSeen ?? user.lastSeen }
        }
      };
    }
    case "CONNECTION_STATUS":
      return { ...state, connectionStatus: action.status };
    case "MARK_CHAT_READ": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, unreadCount: 0 } } };
    }
    case "USER_SELF_UPDATE": {
      const existing = state.users[CURRENT_USER_ID];
      if (!existing) return state;
      return { ...state, users: { ...state.users, [CURRENT_USER_ID]: { ...existing, ...action.patch } } };
    }
    case "MESSAGE_TOGGLE_STAR": {
      const list = (state.messagesByChat[action.chatId] ?? []).map((m) => {
        if (m.id !== action.messageId) return m;
        const starredBy = m.starredBy ?? [];
        const has = starredBy.includes(action.userId);
        return { ...m, starredBy: has ? starredBy.filter((id) => id !== action.userId) : [...starredBy, action.userId] };
      });
      return { ...state, messagesByChat: { ...state.messagesByChat, [action.chatId]: list } };
    }
    case "CHAT_TOGGLE_ARCHIVE": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, archived: !chat.archived } } };
    }
    case "CHAT_TOGGLE_PIN": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, pinned: !chat.pinned } } };
    }
    case "GROUP_ADD_MEMBER": {
      const chat = state.chats[action.chatId];
      if (!chat || chat.memberIds.includes(action.userId)) return state;
      return {
        ...state,
        chats: { ...state.chats, [action.chatId]: { ...chat, memberIds: [...chat.memberIds, action.userId] } }
      };
    }
    case "GROUP_REMOVE_MEMBER": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.chatId]: {
            ...chat,
            memberIds: chat.memberIds.filter((id) => id !== action.userId),
            adminIds: (chat.adminIds ?? []).filter((id) => id !== action.userId)
          }
        }
      };
    }
    case "GROUP_TOGGLE_ADMIN": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      const adminIds = chat.adminIds ?? [];
      const isAdmin = adminIds.includes(action.userId);
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.chatId]: {
            ...chat,
            adminIds: isAdmin ? adminIds.filter((id) => id !== action.userId) : [...adminIds, action.userId]
          }
        }
      };
    }
    case "GROUP_SET_ONLY_ADMINS": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, onlyAdminsCanSend: action.value } } };
    }
    case "CHAT_SET_DISAPPEARING": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return {
        ...state,
        chats: { ...state.chats, [action.chatId]: { ...chat, disappearingMessagesDuration: action.duration } }
      };
    }
    case "MESSAGE_VIEW_ONCE_OPEN": {
      const list = (state.messagesByChat[action.chatId] ?? []).map((m) => {
        if (m.id !== action.messageId) return m;
        const attachments = m.attachments.map((a) => {
          if (a.type !== "image" || !a.viewOnce) return a;
          const opened = a.viewOnceOpenedBy ?? [];
          if (opened.includes(action.userId)) return a;
          return { ...a, viewOnceOpenedBy: [...opened, action.userId] };
        });
        return { ...m, attachments };
      });
      return { ...state, messagesByChat: { ...state.messagesByChat, [action.chatId]: list } };
    }
    case "GROUP_SET_DESCRIPTION": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, description: action.description } } };
    }
    case "GROUP_RESET_INVITE_CODE": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, inviteCode: action.code } } };
    }
    case "CHAT_CREATE": {
      return {
        ...state,
        chats: { ...state.chats, [action.chat.id]: action.chat },
        chatOrder: [action.chat.id, ...state.chatOrder]
      };
    }
    case "CHAT_TOGGLE_MUTE": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, muted: !chat.muted } } };
    }
    case "CHAT_SET_WALLPAPER": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, wallpaper: action.wallpaper } } };
    }
    case "CHAT_CLEAR_MESSAGES": {
      const chat = state.chats[action.chatId];
      return {
        ...state,
        messagesByChat: { ...state.messagesByChat, [action.chatId]: [] },
        chats: chat ? { ...state.chats, [action.chatId]: { ...chat, lastMessagePreview: null, lastMessageId: null } } : state.chats
      };
    }
    case "CHATS_MARK_ALL_READ": {
      const chats = { ...state.chats };
      Object.keys(chats).forEach((id) => {
        if (chats[id].unreadCount > 0) chats[id] = { ...chats[id], unreadCount: 0 };
      });
      return { ...state, chats };
    }
    case "LIST_CREATE": {
      return { ...state, lists: [...state.lists, action.list] };
    }
    case "CHAT_TOGGLE_LIST": {
      const chat = state.chats[action.chatId];
      if (!chat) return state;
      const listIds = chat.listIds ?? [];
      const next = listIds.includes(action.listId) ? listIds.filter((id) => id !== action.listId) : [...listIds, action.listId];
      return { ...state, chats: { ...state.chats, [action.chatId]: { ...chat, listIds: next } } };
    }
    default:
      return state;
  }
}
interface ChatContextValue extends ChatState {
  setActiveChat: (chatId: ChatId | null) => void;
  loadMoreMessages: (chatId: ChatId) => Promise<void>;
  sendMessage: (chatId: ChatId, text: string, opts?: { replyToId?: MessageId | null; attachments?: Attachment[] }) => void;
  retryMessage: (chatId: ChatId, messageId: MessageId) => void;
  editMessage: (chatId: ChatId, messageId: MessageId, text: string) => void;
  deleteMessage: (chatId: ChatId, messageId: MessageId) => void;
  reactToMessage: (chatId: ChatId, messageId: MessageId, emoji: string) => void;
  votePoll: (chatId: ChatId, messageId: MessageId, optionId: string) => void;
  startTyping: (chatId: ChatId) => void;
  stopTyping: (chatId: ChatId) => void;
  simulateConnectionDrop: () => void;
  toggleStarMessage: (chatId: ChatId, messageId: MessageId) => void;
  forwardMessage: (message: ChatMessage, targetChatIds: ChatId[]) => void;
  toggleArchiveChat: (chatId: ChatId) => void;
  togglePinChat: (chatId: ChatId) => void;
  addGroupMember: (chatId: ChatId, userId: UserId) => void;
  removeGroupMember: (chatId: ChatId, userId: UserId) => void;
  toggleGroupAdmin: (chatId: ChatId, userId: UserId) => void;
  setOnlyAdminsCanSend: (chatId: ChatId, value: boolean) => void;
  logCallMessage: (chatId: ChatId, kind: "voice" | "video", status: "completed" | "missed" | "declined", duration: number) => void;
  setDisappearingDuration: (chatId: ChatId, duration: number | null) => void;
  openViewOnce: (chatId: ChatId, messageId: MessageId) => void;
  setGroupDescription: (chatId: ChatId, description: string) => void;
  resetGroupInviteLink: (chatId: ChatId) => void;
  createBroadcastList: (name: string, memberIds: UserId[]) => ChatId;
  sendBroadcastMessage: (broadcastChatId: ChatId, text: string, attachments: Attachment[]) => void;
  createGroup: (name: string, memberIds: UserId[]) => ChatId;
  startDirectChat: (userId: UserId) => ChatId;
  markAllRead: () => void;
  toggleMuteChat: (chatId: ChatId) => void;
  setChatWallpaper: (chatId: ChatId, wallpaper: ChatWallpaper | null) => void;
  clearChat: (chatId: ChatId) => void;
  createList: (name: string) => string;
  toggleChatList: (chatId: ChatId, listId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);
function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const typingTimers = useRef(/* @__PURE__ */ new Map());
  const ownTypingTimer = useRef(null);
  const { settings } = useSettings();
  const readReceiptsRef = useRef(settings.privacy.readReceipts);
  readReceiptsRef.current = settings.privacy.readReceipts;
  const chatsRef = useRef(state.chats);
  chatsRef.current = state.chats;
  const usersRef = useRef(state.users);
  usersRef.current = state.users;
  const { user: authUser } = useAuth();
  const usersHydratedCount = Object.keys(state.users).length;
  useEffect(() => {
    if (!authUser) return;
    dispatch({
      type: "USER_SELF_UPDATE",
      patch: {
        name: authUser.name,
        about: authUser.about,
        avatarColor: authUser.avatarColor,
        avatarUrl: authUser.avatarUrl
      }
    });
  }, [authUser, usersHydratedCount]);
  useEffect(() => {
    fetchChats().then((chats) => dispatch({ type: "HYDRATE_CHATS", chats }));
    fetchUsers().then((users) => dispatch({ type: "HYDRATE_USERS", users }));
  }, []);
  useEffect(() => {
    const unsubEvent = mockSocket.onEvent((event) => {
      switch (event.type) {
        case "message:new":
          dispatch({ type: "MESSAGE_NEW", message: event.message });
          break;
        case "message:ack":
          dispatch({ type: "MESSAGE_ACK", clientTempId: event.clientTempId, message: event.message });
          break;
        case "message:status": {
          const status = event.status === "read" && !readReceiptsRef.current ? "delivered" : event.status;
          dispatch({ type: "MESSAGE_STATUS", messageId: event.messageId, chatId: event.chatId, status });
          break;
        }
        case "message:edited":
          dispatch({
            type: "MESSAGE_EDITED_LOCAL",
            chatId: event.message.chatId,
            messageId: event.message.id,
            text: event.message.text
          });
          break;
        case "message:deleted":
          dispatch({ type: "MESSAGE_DELETED_LOCAL", chatId: event.chatId, messageId: event.messageId });
          break;
        case "message:reaction":
          break;
        case "typing:update": {
          dispatch({ type: "TYPING_UPDATE", chatId: event.chatId, userId: event.userId, isTyping: event.isTyping });
          const key = `${event.chatId}:${event.userId}`;
          const existing = typingTimers.current.get(key);
          if (existing) clearTimeout(existing);
          if (event.isTyping) {
            const t = setTimeout(() => {
              dispatch({ type: "TYPING_UPDATE", chatId: event.chatId, userId: event.userId, isTyping: false });
            }, 4e3);
            typingTimers.current.set(key, t);
          }
          break;
        }
        case "presence:update":
          dispatch({ type: "PRESENCE_UPDATE", userId: event.userId, status: event.status, lastSeen: event.lastSeen });
          break;
        case "connection:status":
          dispatch({ type: "CONNECTION_STATUS", status: event.status });
          break;
      }
    });
    const unsubStatus = mockSocket.onStatusChange((status) => dispatch({ type: "CONNECTION_STATUS", status }));
    mockSocket.connect();
    return () => {
      unsubEvent();
      unsubStatus();
      mockSocket.disconnect();
    };
  }, []);
  const setActiveChat = useCallback((chatId) => {
    dispatch({ type: "SET_ACTIVE_CHAT", chatId });
    if (chatId) dispatch({ type: "MARK_CHAT_READ", chatId });
  }, []);
  const loadMoreMessages = useCallback(
    async (chatId) => {
      const pag = state.pagination[chatId];
      if (pag?.loading || pag?.loaded && !pag.hasMore) return;
      dispatch({ type: "MESSAGES_PAGE_LOADING", chatId });
      const page = await fetchMessages(chatId, pag?.cursor ?? null);
      dispatch({
        type: "MESSAGES_PAGE_LOADED",
        chatId,
        messages: page.messages,
        hasMore: page.hasMore,
        cursor: page.nextCursor
      });
    },
    [state.pagination]
  );
  const sendMessage = useCallback((chatId, text, opts) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const duration = chatsRef.current[chatId]?.disappearingMessagesDuration;
    const message: ChatMessage = {
      id: tempId,
      chatId,
      senderId: CURRENT_USER_ID,
      text,
      createdAt: Date.now(),
      status: "sending",
      reactions: [],
      attachments: opts?.attachments ?? [],
      replyToId: opts?.replyToId ?? null,
      editedAt: null,
      deletedAt: null,
      clientTempId: tempId,
      expiresAt: duration ? Date.now() + duration : null
    };
    dispatch({ type: "MESSAGE_SEND_OPTIMISTIC", message });
    mockSocket.send({ type: "message:send", message });
  }, []);
  const forwardMessage = useCallback((sourceMessage, targetChatIds) => {
    targetChatIds.forEach((chatId) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${chatId}`;
      const message: ChatMessage = {
        id: tempId,
        chatId,
        senderId: CURRENT_USER_ID,
        text: sourceMessage.text,
        createdAt: Date.now(),
        status: "sending",
        reactions: [],
        attachments: sourceMessage.attachments,
        replyToId: null,
        editedAt: null,
        deletedAt: null,
        clientTempId: tempId,
        forwarded: true
      };
      dispatch({ type: "MESSAGE_SEND_OPTIMISTIC", message });
      mockSocket.send({ type: "message:send", message });
    });
  }, []);
  const logCallMessage = useCallback((chatId, kind, status, duration) => {
    const tempId = `temp-call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const message = {
      id: tempId,
      chatId,
      senderId: CURRENT_USER_ID,
      text: "",
      createdAt: Date.now(),
      status: "sent",
      reactions: [],
      attachments: [
        {
          type: "call",
          id: `call-${Date.now()}`,
          name: "Call",
          callKind: kind,
          callStatus: status,
          duration: status === "completed" ? duration : void 0
        }
      ],
      replyToId: null,
      editedAt: null,
      deletedAt: null,
      clientTempId: tempId
    };
    dispatch({ type: "MESSAGE_SEND_OPTIMISTIC", message });
  }, []);
  const setDisappearingDuration = useCallback((chatId, duration) => {
    dispatch({ type: "CHAT_SET_DISAPPEARING", chatId, duration });
  }, []);
  const openViewOnce = useCallback((chatId, messageId) => {
    dispatch({ type: "MESSAGE_VIEW_ONCE_OPEN", chatId, messageId, userId: CURRENT_USER_ID });
  }, []);
  const setGroupDescription = useCallback((chatId, description) => {
    dispatch({ type: "GROUP_SET_DESCRIPTION", chatId, description });
  }, []);
  const resetGroupInviteLink = useCallback((chatId) => {
    dispatch({ type: "GROUP_RESET_INVITE_CODE", chatId, code: Math.random().toString(36).slice(2, 10) });
  }, []);
  const createBroadcastList = useCallback((name, memberIds) => {
    const id = `bcast-${Date.now()}`;
    const chat = {
      id,
      type: "broadcast",
      name: name.trim() || "Broadcast list",
      memberIds: [CURRENT_USER_ID, ...memberIds],
      createdAt: Date.now(),
      unreadCount: 0
    };
    dispatch({ type: "CHAT_CREATE", chat });
    return id;
  }, []);
  const createGroup = useCallback((name, memberIds) => {
    const id = `group-${Date.now()}`;
    const chat = {
      id,
      type: "group",
      name: name.trim() || "New group",
      memberIds: [CURRENT_USER_ID, ...memberIds],
      adminIds: [CURRENT_USER_ID],
      createdAt: Date.now(),
      unreadCount: 0
    };
    dispatch({ type: "CHAT_CREATE", chat });
    return id;
  }, []);
  const startDirectChat = useCallback((userId) => {
    const existing = Object.values(chatsRef.current).find(
      (c) => c.type === "direct" && c.memberIds.includes(userId) && c.memberIds.includes(CURRENT_USER_ID)
    );
    if (existing) return existing.id;
    const id = `dm-${userId}-${Date.now()}`;
    const chat = {
      id,
      type: "direct",
      name: usersRef.current[userId]?.name ?? "New chat",
      memberIds: [CURRENT_USER_ID, userId],
      createdAt: Date.now(),
      unreadCount: 0
    };
    dispatch({ type: "CHAT_CREATE", chat });
    return id;
  }, []);
  const markAllRead = useCallback(() => {
    dispatch({ type: "CHATS_MARK_ALL_READ" });
  }, []);
  const toggleMuteChat = useCallback((chatId) => {
    dispatch({ type: "CHAT_TOGGLE_MUTE", chatId });
  }, []);
  const setChatWallpaper = useCallback((chatId, wallpaper) => {
    dispatch({ type: "CHAT_SET_WALLPAPER", chatId, wallpaper });
  }, []);
  const clearChat = useCallback((chatId) => {
    dispatch({ type: "CHAT_CLEAR_MESSAGES", chatId });
  }, []);
  const createList = useCallback((name) => {
    const id = `list-${Date.now()}`;
    dispatch({ type: "LIST_CREATE", list: { id, name: name.trim() || "New list" } });
    return id;
  }, []);
  const toggleChatList = useCallback((chatId, listId) => {
    dispatch({ type: "CHAT_TOGGLE_LIST", chatId, listId });
  }, []);
  const sendBroadcastMessage = useCallback(
    (broadcastChatId, text, attachments) => {
      const broadcast = chatsRef.current[broadcastChatId];
      if (!broadcast) return;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const message = {
        id: tempId,
        chatId: broadcastChatId,
        senderId: CURRENT_USER_ID,
        text,
        createdAt: Date.now(),
        status: "sent",
        reactions: [],
        attachments,
        replyToId: null,
        editedAt: null,
        deletedAt: null,
        clientTempId: tempId
      };
      dispatch({ type: "MESSAGE_SEND_OPTIMISTIC", message });
      const recipientIds = broadcast.memberIds.filter((id) => id !== CURRENT_USER_ID);
      recipientIds.forEach((userId) => {
        const directChat = Object.values(chatsRef.current).find(
          (c) => c.type === "direct" && c.memberIds.includes(userId) && c.memberIds.includes(CURRENT_USER_ID)
        );
        if (!directChat) return;
        const dmTempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${userId}`;
        const dmMessage: ChatMessage = {
          id: dmTempId,
          chatId: directChat.id,
          senderId: CURRENT_USER_ID,
          text,
          createdAt: Date.now(),
          status: "sending",
          reactions: [],
          attachments,
          replyToId: null,
          editedAt: null,
          deletedAt: null,
          clientTempId: dmTempId
        };
        dispatch({ type: "MESSAGE_SEND_OPTIMISTIC", message: dmMessage });
        mockSocket.send({ type: "message:send", message: dmMessage });
      });
    },
    []
  );
  const toggleStarMessage = useCallback((chatId, messageId) => {
    dispatch({ type: "MESSAGE_TOGGLE_STAR", chatId, messageId, userId: CURRENT_USER_ID });
  }, []);
  const toggleArchiveChat = useCallback((chatId) => {
    dispatch({ type: "CHAT_TOGGLE_ARCHIVE", chatId });
  }, []);
  const togglePinChat = useCallback((chatId) => {
    dispatch({ type: "CHAT_TOGGLE_PIN", chatId });
  }, []);
  const addGroupMember = useCallback((chatId, userId) => {
    dispatch({ type: "GROUP_ADD_MEMBER", chatId, userId });
  }, []);
  const removeGroupMember = useCallback((chatId, userId) => {
    dispatch({ type: "GROUP_REMOVE_MEMBER", chatId, userId });
  }, []);
  const toggleGroupAdmin = useCallback((chatId, userId) => {
    dispatch({ type: "GROUP_TOGGLE_ADMIN", chatId, userId });
  }, []);
  const setOnlyAdminsCanSend = useCallback((chatId, value2) => {
    dispatch({ type: "GROUP_SET_ONLY_ADMINS", chatId, value: value2 });
  }, []);
  const retryMessage = useCallback((chatId, messageId) => {
    dispatch({ type: "MESSAGE_RETRY", chatId, messageId });
    const msg = state.messagesByChat[chatId]?.find((m) => m.id === messageId);
    if (msg) mockSocket.send({ type: "message:send", message: { ...msg, status: "sending" } });
  }, [state.messagesByChat]);
  const editMessage = useCallback((chatId, messageId, text) => {
    dispatch({ type: "MESSAGE_EDITED_LOCAL", chatId, messageId, text });
    mockSocket.send({ type: "message:edit", chatId, messageId, text });
  }, []);
  const deleteMessage = useCallback((chatId, messageId) => {
    dispatch({ type: "MESSAGE_DELETED_LOCAL", chatId, messageId });
    mockSocket.send({ type: "message:delete", chatId, messageId });
  }, []);
  const reactToMessage = useCallback((chatId, messageId, emoji) => {
    dispatch({ type: "MESSAGE_REACT_LOCAL", chatId, messageId, emoji, userId: CURRENT_USER_ID });
    mockSocket.send({ type: "message:react", chatId, messageId, emoji, userId: CURRENT_USER_ID });
  }, []);
  const votePoll = useCallback((chatId, messageId, optionId) => {
    dispatch({ type: "MESSAGE_POLL_VOTE", chatId, messageId, optionId, userId: CURRENT_USER_ID });
  }, []);
  const startTyping = useCallback((chatId) => {
    mockSocket.send({ type: "typing:start", chatId, userId: CURRENT_USER_ID });
    if (ownTypingTimer.current) clearTimeout(ownTypingTimer.current);
    ownTypingTimer.current = setTimeout(() => {
      mockSocket.send({ type: "typing:stop", chatId, userId: CURRENT_USER_ID });
    }, 2500);
  }, []);
  const stopTyping = useCallback((chatId) => {
    if (ownTypingTimer.current) clearTimeout(ownTypingTimer.current);
    mockSocket.send({ type: "typing:stop", chatId, userId: CURRENT_USER_ID });
  }, []);
  const simulateConnectionDrop = useCallback(() => mockSocket.simulateDrop(), []);
  const value = useMemo(
    () => ({
      ...state,
      setActiveChat,
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
      toggleArchiveChat,
      togglePinChat,
      addGroupMember,
      removeGroupMember,
      toggleGroupAdmin,
      setOnlyAdminsCanSend,
      logCallMessage,
      setDisappearingDuration,
      openViewOnce,
      setGroupDescription,
      resetGroupInviteLink,
      createBroadcastList,
      sendBroadcastMessage,
      createGroup,
      startDirectChat,
      markAllRead,
      toggleMuteChat,
      setChatWallpaper,
      clearChat,
      createList,
      toggleChatList
    }),
    [
      state,
      setActiveChat,
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
      toggleArchiveChat,
      togglePinChat,
      addGroupMember,
      removeGroupMember,
      toggleGroupAdmin,
      setOnlyAdminsCanSend,
      logCallMessage,
      setDisappearingDuration,
      openViewOnce,
      setGroupDescription,
      resetGroupInviteLink,
      createBroadcastList,
      sendBroadcastMessage,
      createGroup,
      startDirectChat,
      markAllRead,
      toggleMuteChat,
      setChatWallpaper,
      clearChat,
      createList,
      toggleChatList
    ]
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
export {
  ChatProvider,
  useChat
};
