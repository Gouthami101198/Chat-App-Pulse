import { CURRENT_USER_ID, MOCK_CHATS, MOCK_MESSAGES, MOCK_USERS, generateHistoricalMessages } from "@/mock/data";
import type { MessageSearchResult } from "@/types";
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const historyCache = /* @__PURE__ */ new Map();
function getFullHistory(chatId) {
  if (!historyCache.has(chatId)) {
    const chat = MOCK_CHATS.find((c) => c.id === chatId);
    const seed = MOCK_MESSAGES.filter((m) => m.chatId === chatId);
    const hist = chat ? generateHistoricalMessages(chatId, chat.memberIds) : [];
    historyCache.set(
      chatId,
      [...hist, ...seed].sort((a, b) => a.createdAt - b.createdAt)
    );
  }
  return historyCache.get(chatId);
}
async function login(name, _password) {
  await delay(600);
  if (!name.trim()) {
    throw new Error("Please enter a username.");
  }
  const user = MOCK_USERS.find((u) => u.id === CURRENT_USER_ID);
  return { user: { ...user, name: name.trim() }, token: "mock-jwt-token" };
}
async function signUp(name, _email, _password) {
  await delay(700);
  if (!name.trim()) {
    throw new Error("Please enter your name.");
  }
  const user = MOCK_USERS.find((u) => u.id === CURRENT_USER_ID);
  return { user: { ...user, name: name.trim(), about: "Hey there! I am using Pulse." }, token: "mock-jwt-token" };
}
async function requestPasswordReset(_emailOrPhone) {
  await delay(700);
  return { ok: true };
}
async function fetchChats() {
  await delay(500);
  return MOCK_CHATS.map((c) => {
    const history = getFullHistory(c.id);
    const last = history[history.length - 1];
    return {
      ...c,
      lastMessagePreview: last ? {
        text: last.deletedAt ? "This message was deleted" : last.text,
        senderId: last.senderId,
        createdAt: last.createdAt,
        isDeleted: !!last.deletedAt,
        attachmentType: last.attachments[0]?.type
      } : null
    };
  });
}
async function fetchUsers() {
  await delay(300);
  return MOCK_USERS.map((u) => ({ ...u }));
}
async function fetchMessages(chatId, cursor, pageSize = 25) {
  await delay(450 + Math.random() * 300);
  const all = getFullHistory(chatId);
  const end = cursor ?? all.length;
  const start = Math.max(0, end - pageSize);
  const page = all.slice(start, end);
  return {
    messages: page,
    hasMore: start > 0,
    nextCursor: start > 0 ? start : null
  };
}
async function searchMessages(query: string, chatId?: string): Promise<MessageSearchResult[]> {
  await delay(200);
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: MessageSearchResult[] = [];
  const chats = chatId ? MOCK_CHATS.filter((c) => c.id === chatId) : MOCK_CHATS;
  for (const chat of chats) {
    const history = getFullHistory(chat.id);
    for (const m of history) {
      if (!m.deletedAt && m.text.toLowerCase().includes(q)) {
        results.push({ chatId: chat.id, messageId: m.id, senderId: m.senderId, snippet: m.text, createdAt: m.createdAt });
      }
    }
  }
  return results;
}
function uploadFile(file: File, onProgress: (pct: number) => void): { promise: Promise<{ id: string; url: string }>; cancel: () => void } {
  let cancelled = false;
  const promise = new Promise<{ id: string; url: string }>((resolve, reject) => {
    let progress = 0;
    const tick = () => {
      if (cancelled) return reject(new Error("Upload cancelled"));
      progress += 8 + Math.random() * 15;
      if (progress >= 100) {
        onProgress(100);
        if (Math.random() < 0.08) {
          reject(new Error("Network error during upload"));
        } else {
          resolve({ id: `file-${Date.now()}`, url: URL.createObjectURL(file) });
        }
        return;
      }
      onProgress(Math.min(99, Math.round(progress)));
      setTimeout(tick, 150 + Math.random() * 150);
    };
    tick();
  });
  return { promise, cancel: () => cancelled = true };
}
export {
  fetchChats,
  fetchMessages,
  fetchUsers,
  login,
  requestPasswordReset,
  searchMessages,
  signUp,
  uploadFile
};
