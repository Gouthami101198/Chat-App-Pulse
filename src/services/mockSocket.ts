import { CURRENT_USER_ID, MOCK_CHATS, MOCK_USERS } from "@/mock/data";
import type { ChatId, ClientEvent, ConnectionStatus, ServerEvent, UserId } from "@/types";

/**
 * Wire protocol this mock socket speaks (documented here since there's no
 * TypeScript contract file anymore — a real backend team would implement
 * against this same shape).
 *
 * Client -> server (`send`):
 *   { type: 'message:send', message: ChatMessage }
 *   { type: 'message:edit', chatId, messageId, text }
 *   { type: 'message:delete', chatId, messageId }
 *   { type: 'typing:start' | 'typing:stop', chatId, userId }
 *
 * Server -> client (`onEvent`):
 *   { type: 'message:ack', clientTempId, message }
 *   { type: 'message:status', chatId, messageId, status }
 *   { type: 'message:new', message }
 *   { type: 'message:edited', chatId, messageId, text, editedAt }
 *   { type: 'message:deleted', chatId, messageId }
 *   { type: 'typing:update', chatId, userId, isTyping }
 *   { type: 'presence:update', userId, status, lastSeen? }
 */
const RANDOM_LATENCY = () => 250 + Math.random() * 500;
class MockSocket {
  listeners: Set<(event: ServerEvent) => void> = new Set();
  statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  status: ConnectionStatus = "disconnected";
  reconnectAttempts = 0;
  simulatedTypers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  ambientInterval: ReturnType<typeof setInterval> | null = null;
  manuallyClosed = false;
  get connectionStatus() {
    return this.status;
  }
  onEvent(listener: (event: ServerEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  onStatusChange(listener: (status: ConnectionStatus) => void) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }
  connect() {
    this.manuallyClosed = false;
    this.setStatus(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");
    const delay = this.reconnectAttempts > 0 ? Math.min(1e3 * 2 ** this.reconnectAttempts, 1e4) : 400;
    setTimeout(() => {
      if (this.manuallyClosed) return;
      this.reconnectAttempts = 0;
      this.setStatus("connected");
      this.startAmbientActivity();
    }, delay);
  }
  disconnect() {
    this.manuallyClosed = true;
    this.stopAmbientActivity();
    this.setStatus("disconnected");
  }
  /** Simulates losing the connection unexpectedly (e.g. wifi drop). */
  simulateDrop() {
    if (this.manuallyClosed) return;
    this.stopAmbientActivity();
    this.setStatus("reconnecting");
    this.reconnectAttempts += 1;
    this.connect();
  }
  send(event: ClientEvent) {
    if (this.status !== "connected") {
      setTimeout(() => this.emitFailureFor(event), 300);
      return;
    }
    switch (event.type) {
      case "message:send":
        this.handleMessageSend(event.message);
        break;
      case "message:edit":
        setTimeout(
          () => this.emit({
            type: "message:edited",
            message: {
              id: event.messageId,
              chatId: event.chatId,
              text: event.text
            }
          }),
          RANDOM_LATENCY()
        );
        break;
      case "message:delete":
        setTimeout(
          () => this.emit({ type: "message:deleted", messageId: event.messageId, chatId: event.chatId }),
          RANDOM_LATENCY()
        );
        break;
      case "message:react":
        break;
      case "message:read":
        setTimeout(
          () => this.emit({
            type: "message:status",
            messageId: event.messageId,
            chatId: event.chatId,
            status: "read"
          }),
          RANDOM_LATENCY()
        );
        break;
      case "typing:start":
      case "typing:stop":
        break;
    }
  }
  emitFailureFor(event) {
    if (event.type === "message:send") {
      this.emit({
        type: "message:status",
        messageId: event.message.id,
        chatId: event.message.chatId,
        status: "failed"
      });
    }
  }
  handleMessageSend(message) {
    const tempId = message.clientTempId;
    setTimeout(() => {
      const acked = { ...message, status: "sent" };
      if (tempId) {
        this.emit({ type: "message:ack", clientTempId: tempId, message: acked });
      }
    }, 200 + Math.random() * 200);
    setTimeout(
      () => this.emit({
        type: "message:status",
        messageId: message.id,
        chatId: message.chatId,
        status: "delivered"
      }),
      RANDOM_LATENCY() + 400
    );
    setTimeout(
      () => this.emit({
        type: "message:status",
        messageId: message.id,
        chatId: message.chatId,
        status: "read"
      }),
      RANDOM_LATENCY() + 1800 + Math.random() * 1200
    );
    if (Math.random() < 0.35) {
      const chat = MOCK_CHATS.find((c) => c.id === message.chatId);
      const otherMembers = chat?.memberIds.filter((id) => id !== CURRENT_USER_ID) ?? [];
      const responder = otherMembers[Math.floor(Math.random() * otherMembers.length)];
      if (responder) {
        this.simulateTyping(message.chatId, responder);
      }
    }
  }
  simulateTyping(chatId, userId) {
    this.emit({ type: "typing:update", chatId, userId, isTyping: true });
    const replies = [
      "Got it, thanks!",
      "Sounds good.",
      "I'll take a look shortly.",
      "Makes sense to me.",
      "Can we discuss this at standup?",
      "Perfect, appreciate the update."
    ];
    const key = `${chatId}:${userId}`;
    const timer = setTimeout(() => {
      this.emit({ type: "typing:update", chatId, userId, isTyping: false });
      this.emit({
        type: "message:new",
        message: {
          id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          chatId,
          senderId: userId,
          text: replies[Math.floor(Math.random() * replies.length)],
          createdAt: Date.now(),
          status: "delivered",
          reactions: [],
          attachments: [],
          replyToId: null,
          editedAt: null,
          deletedAt: null
        }
      });
      this.simulatedTypers.delete(key);
    }, 1400 + Math.random() * 1600);
    this.simulatedTypers.set(key, timer);
  }
  /** Periodically flips presence + occasionally starts a peer typing, so the
   * app feels alive even with no user action. */
  startAmbientActivity() {
    this.stopAmbientActivity();
    this.ambientInterval = setInterval(() => {
      const candidates = MOCK_USERS.filter((u) => u.id !== CURRENT_USER_ID);
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      if (target && Math.random() < 0.4) {
        const next = target.status === "online" ? "away" : "online";
        this.emit({
          type: "presence:update",
          userId: target.id,
          status: next,
          lastSeen: next === "online" ? void 0 : Date.now()
        });
      }
    }, 8e3);
  }
  stopAmbientActivity() {
    if (this.ambientInterval) clearInterval(this.ambientInterval);
    this.ambientInterval = null;
    this.simulatedTypers.forEach((t) => clearTimeout(t));
    this.simulatedTypers.clear();
  }
  setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }
  emit(event: ServerEvent) {
    this.listeners.forEach((l) => l(event));
  }
}
const mockSocket = new MockSocket();
export {
  MockSocket,
  mockSocket
};
