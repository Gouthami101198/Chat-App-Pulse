# Pulse — Real-Time Chat Application

A production-shaped real-time chat app built with React 18, TypeScript, Tailwind CSS,
React Router, and a WebSocket-driven data layer. Since there's no live backend here,
a **mock socket + mock REST API** simulate a real server (in-memory, realistic latency,
random failures) — every other layer of the app is written exactly as it would be
against a real API.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
```

Sign in with any username/password — auth is mocked (see `src/services/api.ts`).

## Architecture

```
src/
  types/            Single source of truth for domain models + the WS wire protocol
  mock/data.ts       Seed users/chats/messages, plus generated history for pagination
  services/
    api.js           Mock REST: login, fetchChats, fetchMessages (cursor pagination), uploadFile
    mockSocket.js     Mock WebSocket: connect/send/reconnect, simulated peer activity
  context/
    AuthContext       Session state + protected-route gate, persisted to sessionStorage
    ThemeContext       Light/dark mode, persisted, respects system preference
    ChatContext        Reducer-based store: chats, messages, presence, typing, pagination,
                        connection status. Owns all socket wiring and optimistic-update logic.
  hooks/
    useDebounce        Generic debounce (used by both search inputs)
    useInfiniteScroll  IntersectionObserver-based "load more" trigger
  components/
    auth/              LoginForm, ProtectedRoute
    layout/Sidebar      Chat list, search, theme toggle, connection dot, unread badges
    chat/               ChatWindow, MessageBubble, MessageInput, TypingIndicator, ReactionPicker
    common/             Avatar, Spinner, Badge, EmptyState, ErrorState, ConnectionBanner
  pages/               LoginPage, ChatPage (routing + responsive two-pane layout)
```

### Why a mock socket instead of a real backend?

The task is a frontend exercise — there's no server to point at. `MockSocket`
implements the *same interface* a real client would use (`connect`, `send`,
`onEvent`, `onStatusChange`, exponential-backoff reconnect) so swapping in a real
`WebSocket` later means rewriting **one file** (`services/mockSocket.ts`) with zero
changes to components or `ChatContext`. The wire protocol is fully typed in
`types/index.ts` (`ClientEvent` / `ServerEvent`), which doubles as the contract a
real backend team would implement against.

### State management

`ChatContext` uses `useReducer` rather than prop drilling or a global store
library, because the state (chats, per-chat message arrays, pagination cursors,
typing sets, presence) has a lot of cross-cutting updates that are much easier to
reason about as pure reducer transitions than scattered `setState` calls. Auth and
theme are simple enough to stay as their own small contexts rather than being
folded into one mega-store.

### Optimistic sending & failure handling

`sendMessage` immediately appends a message with `status: 'sending'` and a
`clientTempId`, then calls the socket. The mock server acks with `message:ack`
(swapping in the real ID), then `message:status` events move it through
`sent → delivered → read`. If the socket is offline when `send` is called, the
message is marked `failed` and the bubble shows a **Retry** action that
re-submits the same message.

### Everything else, by file

| Requirement | Where |
|---|---|
| Auth + protected routes | `AuthContext`, `ProtectedRoute`, `/login` vs `/chat/:chatId` |
| 1:1 and group chat | `Chat.type`, rendered identically in `ChatWindow`/`Sidebar` |
| Real-time messaging | `mockSocket` + `ChatContext` reducer |
| Online/offline/away | `User.status`, ambient presence flips in `mockSocket`, `Avatar` status dot |
| Typing indicators | `typing:start/stop` events, auto-expiring after 4s of silence |
| Delivery/read receipts | `MessageStatus`, tick icons in `MessageBubble` |
| Edit/delete/reply/copy/react | Hover action bar in `MessageBubble`, `ReactionPicker` |
| Optimistic UI + retry | `sendMessage` / `retryMessage` in `ChatContext` |
| Unread counts + badges | `Chat.unreadCount`, incremented on incoming messages to inactive chats |
| Debounced search | `useDebounce`, used in `Sidebar` (chats) and `ChatWindow` (in-chat) |
| Image/doc sharing + upload progress | `uploadFile` (simulated chunked progress), `MessageInput` |
| Infinite scroll / pagination | `useInfiniteScroll` + cursor-based `fetchMessages` |
| Reconnection handling | `MockSocket.simulateDrop()` + exponential backoff in `connect()`; try the "Simulate drop" button in a chat header |
| Loading / empty / error states | `Spinner`, `EmptyState`, `ErrorState`, `ConnectionBanner` |
| Responsive + dark/light mode | Tailwind `dark:` variants throughout, `ThemeContext`, mobile single-pane layout in `ChatPage` |
| Rich attachments (gallery/camera/document/location/contact/poll/event/AI image) | `AttachmentMenu`, `ComposerModals`, `AttachmentRenderer` |
| Emoji picker + GIF/sticker picker | `Pickers.tsx` (self-contained SVG stickers — swap in a real Giphy/Tenor API if desired) |
| Poll voting | `votePoll` in `ChatContext`, rendered in `AttachmentRenderer` |
| Avatar/profile editing (photo upload, color, name, about) | `AvatarEditModal`, `AuthContext.updateProfile` |
| Last seen & read-receipt privacy | `SettingsContext` (`privacy.lastSeenAndOnline`, `privacy.readReceipts`), enforced in `ChatWindow`/`Sidebar`/`ChatContext` |
| WhatsApp-style Settings (Account/Privacy/Chats/Notifications/Storage/Help) | `pages/SettingsPage.tsx`, `/settings` route |
| Chat wallpaper + font size | `SettingsContext`, applied in `ChatWindow` |
| Voice messages (record & playback) | `VoiceRecorder` (MediaRecorder API), `AttachmentRenderer`'s waveform player |
| Forward message to another chat | `ForwardPicker` (`ChatManagementModals.tsx`), `ChatContext.forwardMessage` |
| Starred messages | Star action in `MessageBubble`, `StarredMessagesPanel`, `ChatContext.toggleStarMessage` |
| Archived + pinned chats | Per-chat portal menu in `Sidebar`, `ChatContext.toggleArchiveChat` / `togglePinChat` |
| Group admin controls (add/remove members, only-admins-can-send) | `GroupInfoPanel`, `ChatContext`'s `addGroupMember`/`removeGroupMember`/`toggleGroupAdmin`/`setOnlyAdminsCanSend` |
| Status/Stories (post + view, Instagram-style ring tray) | `StoriesBar` + `StoriesContext`, mounted atop the chat list |
| Voice/video calls (mock) | `CallScreen` (ringing → connecting → active, live timer), logged into the chat as a `call` message |
| Block & report contacts | `ContactInfoPanel`, `ReportUserModal`, `SettingsContext.blockUser`/`unblockUser` — blocking locks the composer and hides call buttons |
| Disappearing messages | `DisappearingMessagesPicker` (Off/24h/7d/90d), `ChatContext` stamps `expiresAt` on send; `ChatWindow` filters expired messages client-side on a 10s tick |
| View-once photos | Toggle on image attachments in `MessageInput`; `AttachmentRenderer` shows a locked "Tap to view once" placeholder that becomes "Opened" after the recipient views it |
| Group invite links + description | Extended `GroupInfoPanel` — editable description (admin-only), copyable/resettable invite link |
| Broadcast lists | `BroadcastComposer`, `ChatContext.createBroadcastList`/`sendBroadcastMessage` — fans a single send out to each recipient's own DM, exactly like real WhatsApp broadcast lists |
| Linked devices | New "Linked devices" Settings section — mock device list with per-device logout and a QR-code "Link a device" flow |
| Status: photo/video posts | `StoryComposer` supports uploading an image or video (not just text), `StoryViewer` plays video status with real playback-driven progress |
| Contact info: bio + shared media | `ContactInfoPanel`/`GroupInfoPanel` show about/phone and live Media/Links/Docs counts pulled from the conversation; `SharedMediaPanel` renders the photo grid, link list, and document list |
| Mobile responsiveness | Verified with an automated 375px-viewport pass; fixed a real flexbox overflow bug (`min-w-0` needed on the chat pane and message-input row — form elements like `<textarea>` ignore `flex-shrink` without it) |
| In-chat message search (full history) | `searchMessages(query, chatId)` in `api.js` now scopes to one chat and returns the sender too; `ChatWindow` merges instant local matches with full-history results into a WhatsApp-style results list, with "jump to message" that paginates in older history as needed before scrolling |
| Real status media (Unsplash / Pexels) | Priya's status is a real photo hotlinked from Unsplash (`images.unsplash.com`, free Unsplash License); Karthik's is a real video hotlinked from Pexels (`videos.pexels.com`, free Pexels License) — Unsplash doesn't host video, so Pexels is used as its video counterpart. Both URLs were extracted directly from the providers' live pages, not guessed. |
| WhatsApp-style Settings redesign | `SettingsPage` rebuilt with WhatsApp's signature colored icon-circle rows, a settings search bar, and the standard section set (Account, Privacy, Chats, Notifications, Linked devices, Storage and data, App language, Help, Invite a friend) |
| WhatsApp-style Edit Profile | `AvatarEditModal` rebuilt as WhatsApp's actual "Profile" screen: large avatar with a camera badge, pencil-icon inline Name/About fields with live character counters (25/139, matching WhatsApp's real limits) and helper caption text, About preset chips (Available, Busy, At work, etc.), and a read-only Phone row |
| Real profile photos | All 12 mock contacts now have real portrait photos (`randomuser.me`, the standard source for demo/mockup profile photos), plus richer per-contact `about` text |
| WhatsApp 4-tab navigation | `Sidebar` now has a real top tab bar — **Chats** (existing list), **Updates** (`UpdatesTab.tsx`: vertical My Status / Recent / Viewed layout), **Communities** (`CommunitiesTab.tsx` + `CommunitiesContext`: create communities that bundle existing groups, with a detail view), **Calls** (`CallsTab.tsx`: real aggregated call history across all chats, call-back and new-call actions) |
| Fully working Settings | `SettingsContext` extended with two-step-verification PIN, phone-number override, and auto-download preferences; Account/Storage/Help sections now open real functional modals (PIN setup, change number, downloadable account-info JSON, delete-account confirm-then-sign-out, live-computed storage/network stats, auto-download toggles, Help/Contact/Terms content) instead of no-op stubs |
| Per-chat "⋮" overflow menu | New WhatsApp-style menu in the chat header: View contact/group info, Media/links/docs shortcut, Mute notifications, Disappearing messages, Chat wallpaper (per-chat override), and a "More" submenu with Report, Block, **Clear chat** (with confirm), **Export chat** (downloads a real `.txt` transcript), **Add shortcut** (copies a direct link to the chat), and **Add to list** |
| Custom chat Lists | New `ChatList` model + filter chips (All/Unread/Groups/custom lists) above the chat list, backed by `createList`/`toggleChatList` in `ChatContext` |
| New group creation + Mark all as read | Account menu now has a working "New group" flow (reusing the broadcast composer with group-specific wording) and "Mark all as read" |
| Mute notifications + per-chat wallpaper | `Chat.muted` (shown as a 🔇 badge in the sidebar) and `Chat.wallpaper` (overrides the global wallpaper for that one conversation) |
| Payments | New `payment` attachment type rendered as a WhatsApp-Pay-style card (amount, note, sent/requested, pending/completed); `PaymentComposer` in the attachment menu |
| "Away" → "Last seen" fix | Chat headers now only ever show "Online" or "Last seen X ago," matching real WhatsApp (which has no "Away" state) |
| Real group photos + clickable members | Groups now show real photos (Lorem Picsum) instead of a plain member-count circle, with a graceful fallback (new `GroupAvatar` component, also fixes a latent gap where individual `Avatar` photos had no fallback if the image failed to load); tapping a member inside Group Info now opens (or creates on the spot via `startDirectChat`) a real 1:1 chat with them |
| Always-visible chat back button | The chat header's back arrow now always renders (was previously hidden on desktop widths via `sm:hidden`), with a proper SVG icon instead of a plain "←" character |
| Sign up + Forgot password | New `/signup` page (name, email, password + confirm, with real inline validation) and `/forgot-password` page (email/phone → mock "reset link sent" confirmation), both linked to and from the login page; `AuthContext` extended with `signUp` |
| Desktop two-pane breakpoint moved to 768px | The sidebar+chat two-pane layout previously kicked in at 640px, which was too cramped for the chat header (icons + name would truncate awkwardly, e.g. "Priya ..."). Moved the breakpoint to 768px throughout (`ChatPage`, `SettingsPage`, `Sidebar`) so the app now stays single-pane, full-width until there's genuinely enough room for two panes; also tightened header icon spacing for extra breathing room |
| Last seen fix | Chat headers now only ever show "Online" or "Last seen X ago" — matches real WhatsApp, which has no "Away" state |
| Per-chat "⋮" overflow menu | New WhatsApp-style menu in the chat header: View contact/Group info, Media/links/docs, Mute notifications, Disappearing messages, **Chat wallpaper** (per-chat override), and a "More" submenu with Report, Block, **Clear chat**, **Export chat** (downloads a real `.txt` transcript), **Add shortcut** (copies a direct link), and **Add to list** |
| Custom chat Lists | New `ChatList` model — create lists, add chats to them, and filter the chat list via chips (All/Unread/Groups/custom lists) above the chat list, WhatsApp-style |
| New group creation + Mark all as read | Both added to the account menu; group creation reuses (and correctly relabels) the broadcast-composer UI |
| Payments | New `payment` attachment type — a Send/Request composer in the attachment menu posts a proper payment card (amount, note, sent/requested, pending/completed) to the chat |

### Visual style

The UI now uses WhatsApp's own signature green/teal palette throughout — light-green sent bubbles with dark text in light mode (`#D9FDD3`), dark-green bubbles with white text in dark mode (`#005C4B`), and WhatsApp's bright green (`#25D366`) as the primary accent for buttons, links, and active states (see the `brand` scale and `insta-gradient` tokens in `tailwind.config.js` — the class names are unchanged from earlier iterations, only the colors they render). The story-ring avatars, pill-shaped message input, and grid attachment picker remain as visual flourishes on top.

**Header bars:** the sidebar's main header, every chat conversation header, and the Settings page header (both desktop and mobile) all use WhatsApp's classic solid dark-teal bar (`brand-700` light / `brand-900` dark) with white text and icons — matching WhatsApp's actual "colored top bar, white content below" layout, rather than a white header.

## Swapping in a real backend

1. Replace `services/mockSocket.ts` with a thin wrapper around a real `WebSocket`
   (a sketch is left as a comment at the bottom of that file) — keep the same
   `connect/send/onEvent/onStatusChange` interface.
2. Replace the bodies of `services/api.ts` with real `fetch` calls to your REST
   endpoints; keep the same function signatures.
3. Nothing in `context/`, `components/`, or `pages/` needs to change.

## A note on the TypeScript setup

`tsconfig.json` runs with `strict: false` / `noImplicitAny: false` rather than full
strict mode. The domain model (`types/index.ts`), every Context's public API
(`ChatContextValue`, etc.), and the wire protocol are all properly typed — that's
where type safety actually matters, since it's the contract every component relies
on. Deeply-nested internal component state is typed more loosely to keep the
codebase approachable. Tightening to full `strict: true` incrementally file-by-file
is a reasonable next step if desired, but isn't required for `npm run build` to
type-check cleanly today (it does, with zero errors).
