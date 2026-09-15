// ---------------------------------------------------------------------------
// Core identifiers & users
// ---------------------------------------------------------------------------

export type UserId = string;
export type ChatId = string;
export type MessageId = string;

export interface User {
  id: UserId;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: number;
  about: string;
}

// ---------------------------------------------------------------------------
// Messages & attachments
// ---------------------------------------------------------------------------

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type Attachment =
  | {
      type: 'image';
      id: string;
      name: string;
      url: string;
      size: number;
      viewOnce?: boolean;
      viewOnceOpenedBy?: UserId[];
    }
  | {
      type: 'document';
      id: string;
      name: string;
      url: string;
      size: number;
    }
  | {
      type: 'gif';
      id: string;
      name: string;
      url: string;
    }
  | {
      type: 'ai-image';
      id: string;
      name: string;
      url: string;
      prompt: string;
    }
  | {
      type: 'audio';
      id: string;
      name: string;
      url: string;
      duration: number;
    }
  | {
      type: 'voice';
      id: string;
      name: string;
      url: string;
      duration: number;
    }
  | {
      type: 'location';
      id: string;
      name: string;
      lat: number;
      lng: number;
      address?: string;
    }
  | {
      type: 'contact';
      id: string;
      name: string;
      contactName: string;
      phone: string;
    }
  | {
      type: 'poll';
      id: string;
      name: string;
      question: string;
      options: { id: string; label: string; votes: UserId[] }[];
      allowMultiple?: boolean;
    }
  | {
      type: 'event';
      id: string;
      name: string;
      title: string;
      date: string;
      time?: string;
      location?: string;
    }
  | {
      type: 'call';
      id: string;
      name: string;
      callKind: 'voice' | 'video';
      callStatus: 'completed' | 'missed' | 'declined' | 'outgoing';
      duration?: number; // seconds, present when completed
    }
  | {
      type: 'payment';
      id: string;
      name: string;
      amount: number;
      currency: string;
      note?: string;
      kind: 'sent' | 'requested';
      status: 'completed' | 'pending';
    };

export interface Reaction {
  emoji: string;
  userIds: UserId[];
}

export interface ChatMessage {
  id: MessageId;
  chatId: ChatId;
  senderId: UserId;
  text: string;
  createdAt: number;
  status: MessageStatus;
  replyToId?: MessageId | null;
  editedAt?: number | null;
  deletedAt?: number | null;
  reactions: Reaction[];
  attachments: Attachment[];
  starredBy?: UserId[];
  forwarded?: boolean;
  /** Set when the chat has disappearing messages enabled; the message is
   *  hidden (client-side) once Date.now() passes this timestamp. */
  expiresAt?: number | null;
  /** Only present on messages this client just sent, before server ack */
  clientTempId?: string;
}

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

export type ChatType = 'direct' | 'group' | 'broadcast';

export interface Chat {
  id: ChatId;
  type: ChatType;
  name: string; // for group chats; derived for direct chats
  /** Group/community photo. Direct chats use the other member's own avatar instead. */
  avatarUrl?: string;
  memberIds: UserId[];
  adminIds?: UserId[]; // group admins; unused for direct/broadcast chats
  onlyAdminsCanSend?: boolean; // "announcement" style group
  createdAt: number;
  archived?: boolean;
  /** Denormalized for quick sidebar rendering; kept in sync by ChatContext */
  lastMessageId?: MessageId | null;
  /** Lightweight preview so the sidebar can render a snippet before the full
   *  message history for that chat has been paginated in. */
  lastMessagePreview?: {
    text: string;
    senderId: UserId;
    createdAt: number;
    isDeleted?: boolean;
    attachmentType?: string;
  } | null;
  unreadCount: number;
  pinned?: boolean;
  muted?: boolean;
  /** Per-chat wallpaper override; null/undefined falls back to the global setting. */
  wallpaper?: ChatWallpaper | null;
  /** Custom "Lists" this chat has been added to (WhatsApp-style organizing lists). */
  listIds?: string[];
  /** ms; new messages sent while this is set auto-hide after the duration. null/undefined = off. */
  disappearingMessagesDuration?: number | null;
  /** Group-only metadata. */
  description?: string;
  inviteCode?: string;
}

export interface ChatList {
  id: string;
  name: string;
}

export type TypingState = Record<ChatId, UserId[]>;

// ---------------------------------------------------------------------------
// Mock socket wire protocol
// ---------------------------------------------------------------------------

export type ClientEvent =
  | { type: 'message:send'; message: ChatMessage }
  | { type: 'message:edit'; chatId: ChatId; messageId: MessageId; text: string }
  | { type: 'message:delete'; chatId: ChatId; messageId: MessageId }
  | { type: 'message:react'; chatId: ChatId; messageId: MessageId; emoji: string; userId: UserId }
  | { type: 'message:read'; chatId: ChatId; messageId: MessageId }
  | { type: 'typing:start' | 'typing:stop'; chatId: ChatId; userId: UserId };

export type ServerEvent =
  | { type: 'message:ack'; clientTempId: string; message: ChatMessage }
  | { type: 'message:status'; chatId: ChatId; messageId: MessageId; status: MessageStatus }
  | { type: 'message:new'; message: ChatMessage }
  | { type: 'message:edited'; message: { id: MessageId; chatId: ChatId; text: string } }
  | { type: 'message:deleted'; chatId: ChatId; messageId: MessageId }
  | { type: 'message:reaction'; chatId: ChatId; messageId: MessageId; emoji: string; userId: UserId }
  | { type: 'typing:update'; chatId: ChatId; userId: UserId; isTyping: boolean }
  | { type: 'presence:update'; userId: UserId; status: User['status']; lastSeen?: number }
  | { type: 'connection:status'; status: ConnectionStatus };

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

// ---------------------------------------------------------------------------
// Uploads / async helpers
// ---------------------------------------------------------------------------

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  done: boolean;
  error?: string;
  attachment?: Attachment;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type VisibilityPref = 'everyone' | 'contacts' | 'nobody';

export interface PrivacySettings {
  lastSeenAndOnline: VisibilityPref;
  profilePhoto: VisibilityPref;
  about: VisibilityPref;
  readReceipts: boolean;
}

export interface NotificationSettings {
  messageNotifications: boolean;
  sound: boolean;
  showPreview: boolean;
}

export type ChatWallpaper = 'default' | 'solid-teal' | 'solid-navy' | 'solid-blush' | 'none';

export interface LinkedDevice {
  id: string;
  name: string;
  platform: 'desktop' | 'web' | 'tablet';
  lastActive: number;
}

export interface AutoDownloadSettings {
  photos: boolean;
  videos: boolean;
  documents: boolean;
  onMobileData: boolean;
}

export interface AppSettings {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  wallpaper: ChatWallpaper;
  fontSize: 'small' | 'medium' | 'large';
  blockedUserIds: UserId[];
  linkedDevices: LinkedDevice[];
  twoStepPin: string | null;
  phoneOverride: string | null;
  autoDownload: AutoDownloadSettings;
}

// ---------------------------------------------------------------------------
// Status / Stories
// ---------------------------------------------------------------------------

export interface Story {
  id: string;
  userId: UserId;
  type: 'image' | 'video' | 'text';
  mediaUrl?: string; // for type 'image' | 'video'
  text?: string; // for type 'text'
  bgColor?: string; // for type 'text'
  createdAt: number;
  expiresAt: number;
  viewedBy: UserId[];
}

// ---------------------------------------------------------------------------
// Communities — a group of related group chats under one roof, WhatsApp-style
// ---------------------------------------------------------------------------

export interface Community {
  id: string;
  name: string;
  description: string;
  avatarColor: string;
  memberIds: UserId[];
  adminIds: UserId[];
  groupChatIds: ChatId[];
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface MessageSearchResult {
  chatId: ChatId;
  messageId: MessageId;
  senderId: UserId;
  snippet: string;
  createdAt: number;
}
