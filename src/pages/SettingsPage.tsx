import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { useChat } from "@/context/ChatContext";
import { Avatar } from "@/components/common/Common";
import { AvatarEditModal } from "@/components/chat/ComposerModals";
import { BlockedUsersPanel } from "@/components/chat/ChatManagementModals";
import { MOCK_USERS } from "@/mock/data";
function IconBadge({ color, children }) {
  return <span
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
    style={{ backgroundColor: color }}
  >{children}</span>;
}
const ICONS = {
  key: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
  lock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>,
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>,
  laptop: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="1" /><path d="M2 20h20" /></svg>,
  storage: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z" /></svg>,
  help: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
};
const SECTIONS = [
  { id: "account", label: "Account", blurb: "Security notifications, change number", color: "#5b8def", icon: ICONS.key },
  { id: "privacy", label: "Privacy", blurb: "Last seen, read receipts, blocked contacts", color: "#3fb0e0", icon: ICONS.lock },
  { id: "chats", label: "Chats", blurb: "Theme, wallpaper, chat display", color: "#3fa85f", icon: ICONS.chat },
  { id: "notifications", label: "Notifications", blurb: "Message, group & call tones", color: "#e0546b", icon: ICONS.bell },
  { id: "linked-devices", label: "Linked devices", blurb: "Manage devices signed in to your account", color: "#5b6bde", icon: ICONS.laptop },
  { id: "storage", label: "Storage and data", blurb: "Network usage, auto-download", color: "#3fa88a", icon: ICONS.storage },
  { id: "language", label: "App language", blurb: "English (device language)", color: "#8a5cf0", icon: ICONS.globe },
  { id: "help", label: "Help", blurb: "Help center, contact us, privacy policy", color: "#3f9be0", icon: ICONS.help },
  { id: "invite", label: "Invite a friend", blurb: "", color: "#e0546b", icon: ICONS.heart }
];
function Row({
  label,
  description,
  right,
  onClick
}: {
  label: string;
  description?: string;
  right?: ReactNode;
  onClick?: () => void;
}) {
  const Comp: any = onClick ? "button" : "div";
  return <Comp
    onClick={onClick}
    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${onClick ? "hover:bg-slate-50 dark:hover:bg-slate-800" : ""}`}
  ><div className="min-w-0"><p className="text-sm text-slate-800 dark:text-slate-100">{label}</p>{description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}</div>{right}</Comp>;
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return <button
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
    role="switch"
    aria-checked={checked}
  ><span
    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
  /></button>;
}
function SegmentedPref({
  value,
  onChange
}) {
  const options = [
    { id: "everyone", label: "Everyone" },
    { id: "contacts", label: "Contacts" },
    { id: "nobody", label: "Nobody" }
  ];
  return <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">{options.map((o) => <button
    key={o.id}
    onClick={() => onChange(o.id)}
    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${value === o.id ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
  >{o.label}</button>)}</div>;
}
const WALLPAPER_SWATCHES = [
  { id: "default", label: "Default", className: "bg-slate-100 dark:bg-slate-800" },
  { id: "solid-teal", label: "Teal", className: "bg-teal-100 dark:bg-teal-900/40" },
  { id: "solid-navy", label: "Navy", className: "bg-indigo-100 dark:bg-indigo-900/40" },
  { id: "solid-blush", label: "Blush", className: "bg-pink-100 dark:bg-pink-900/40" },
  { id: "none", label: "None", className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" }
];
const DEVICE_ICON = { desktop: "\u{1F5A5}\uFE0F", web: "\u{1F310}", tablet: "\u{1F4F1}" };
function formatDeviceTime(ts) {
  const mins = Math.round((Date.now() - ts) / 6e4);
  if (mins < 1) return "Active now";
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  return `Active ${Math.round(hrs / 24)}d ago`;
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function fakeQrPattern(seed) {
  const cells = [];
  let h = seed;
  for (let i = 0; i < 121; i++) {
    h = (h * 9301 + 49297) % 233280;
    cells.push(h / 233280 > 0.45);
  }
  return cells;
}
function LinkDeviceModal({ onLink, onClose }) {
  const [linking, setLinking] = useState(false);
  const cells = fakeQrPattern(42);
  function simulateScan() {
    setLinking(true);
    setTimeout(() => {
      onLink();
      onClose();
    }, 1600);
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl dark:bg-slate-800"><h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Link a device</h2><p className="mb-4 text-xs text-slate-400">Scan this code from Settings → Linked devices on the new device.</p><div className="mx-auto mb-4 grid w-fit grid-cols-11 gap-[2px] rounded-lg bg-white p-2 shadow-inner dark:bg-slate-100">{cells.map((on, i) => <span key={i} className={`h-2 w-2 ${on ? "bg-slate-900" : "bg-transparent"}`} />)}</div><button
    onClick={simulateScan}
    disabled={linking}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
  >{linking ? "Linking\u2026" : "Simulate scan (demo)"}</button></div></div>;
}
function InviteModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const link = "https://pulse.chat/invite/join";
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl dark:bg-slate-800"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white">{ICONS.heart}</div><h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Invite a friend</h2><p className="mb-4 text-xs text-slate-400">Share this link to invite friends to Pulse.</p><div className="mb-3 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{link}</div><button
    onClick={copy}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
  >{copied ? "\u2713 Copied" : "Copy invite link"}</button></div></div>;
}
function SmallModalShell({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2><button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            ✕
          </button></div>{children}</div></div>;
}
function TwoStepModal({
  currentPin,
  onSave,
  onClose
}) {
  const [enabled, setEnabled] = useState(!!currentPin);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState(null);
  function submit() {
    if (!enabled) {
      onSave(null);
      onClose();
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("Enter a 6-digit PIN.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    onSave(pin);
    onClose();
  }
  return <SmallModalShell title="Two-step verification" onClose={onClose}><Row label="Require a PIN to re-register this account" right={<Toggle checked={enabled} onChange={setEnabled} />} />{enabled && <div className="mt-3 space-y-2"><input
    value={pin}
    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
    placeholder="6-digit PIN"
    inputMode="numeric"
    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm tracking-widest outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><input
    value={confirmPin}
    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
    placeholder="Confirm PIN"
    inputMode="numeric"
    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm tracking-widest outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  />{error && <p className="text-xs text-rose-500">{error}</p>}</div>}<button
    onClick={submit}
    className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
  >
        Save
      </button></SmallModalShell>;
}
function ChangeNumberModal({
  currentPhone,
  onSave,
  onClose
}) {
  const [phone, setPhone] = useState(currentPhone);
  return <SmallModalShell title="Change number" onClose={onClose}><p className="mb-3 text-xs text-slate-400">Enter your new phone number to update your account.</p><input
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    placeholder="+91 98765 43210"
    className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><button
    onClick={() => {
      onSave(phone.trim());
      onClose();
    }}
    disabled={!phone.trim()}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
  >
        Save number
      </button></SmallModalShell>;
}
function AccountInfoModal({
  userName,
  stats,
  onClose
}) {
  const [ready, setReady] = useState(false);
  function generate() {
    setReady(true);
  }
  function download() {
    const payload = {
      account: userName,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      summary: stats
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pulse-account-info.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return <SmallModalShell title="Request account info" onClose={onClose}>{!ready ? <><p className="mb-4 text-xs text-slate-400">
            We'll prepare a report of your account activity — message counts, shared media, and chat summaries.
          </p><button
    onClick={generate}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
  >
            Request report
          </button></> : <><p className="mb-3 text-xs text-emerald-600 dark:text-emerald-400">✓ Your report is ready.</p><div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"><p>{stats.totalMessages} messages across {stats.chatCount} chats</p><p>{stats.photoCount} photos · {stats.docCount} documents</p></div><button
    onClick={download}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
  >
            Download report (.json)
          </button></>}</SmallModalShell>;
}
function DeleteAccountModal({ onConfirm, onClose }) {
  const [confirmText, setConfirmText] = useState("");
  return <SmallModalShell title="Delete my account" onClose={onClose}><p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        This will sign you out of this demo session. Type <strong>DELETE</strong> to confirm.
      </p><input
    value={confirmText}
    onChange={(e) => setConfirmText(e.target.value)}
    placeholder="DELETE"
    className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><button
    onClick={onConfirm}
    disabled={confirmText !== "DELETE"}
    className="w-full rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
  >
        Delete account
      </button></SmallModalShell>;
}
function StorageDetailModal({
  stats,
  onClose
}) {
  return <SmallModalShell title="Storage and network" onClose={onClose}><div className="space-y-2 text-sm text-slate-700 dark:text-slate-200"><div className="flex justify-between"><span className="text-slate-400">Chats</span><span>{stats.chatCount}</span></div><div className="flex justify-between"><span className="text-slate-400">Total messages</span><span>{stats.totalMessages}</span></div><div className="flex justify-between"><span className="text-slate-400">Photos</span><span>{stats.photoCount}</span></div><div className="flex justify-between"><span className="text-slate-400">Voice messages</span><span>{stats.voiceCount}</span></div><div className="flex justify-between"><span className="text-slate-400">Documents</span><span>{stats.docCount} ({formatBytes(stats.docBytes)})</span></div></div><p className="mt-4 text-xs text-slate-400">Stats reflect this demo session only — nothing is persisted server-side.</p></SmallModalShell>;
}
function AutoDownloadModal({
  value,
  onChange,
  onClose
}) {
  return <SmallModalShell title="Auto-download media" onClose={onClose}><div className="space-y-1"><Row label="Photos" right={<Toggle checked={value.photos} onChange={(v) => onChange({ photos: v })} />} /><Row label="Videos" right={<Toggle checked={value.videos} onChange={(v) => onChange({ videos: v })} />} /><Row label="Documents" right={<Toggle checked={value.documents} onChange={(v) => onChange({ documents: v })} />} /><Row
    label="Auto-download on mobile data"
    description="Otherwise, only download over Wi-Fi"
    right={<Toggle checked={value.onMobileData} onChange={(v) => onChange({ onMobileData: v })} />}
  /></div></SmallModalShell>;
}
const HELP_CONTENT = {
  help: {
    title: "Help center",
    body: "Pulse is a demo real-time messaging app. Most features run entirely in your browser against mock data \u2014 there is no real backend, so messages and settings reset when you refresh unless noted otherwise. Explore Chats, Updates, Communities, and Calls from the tabs above the chat list."
  },
  contact: {
    title: "Contact us",
    body: "This is a demo build with no real support channel. In a production app, this screen would let you reach the support team, attach diagnostic logs, and track your ticket status."
  },
  terms: {
    title: "Terms and privacy policy",
    body: "Demo terms: all data in this app is stored locally in your browser (localStorage/session state) or generated from mock seed data. Nothing is transmitted to a real server. This screen exists to demonstrate the settings flow WhatsApp-style apps typically include."
  }
};
function HelpContentModal({ kind, onClose }) {
  const content = HELP_CONTENT[kind];
  return <SmallModalShell title={content.title} onClose={onClose}><p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{content.body}</p></SmallModalShell>;
}
function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    settings,
    updatePrivacy,
    updateNotifications,
    setWallpaper,
    setFontSize,
    unblockUser,
    addLinkedDevice,
    removeLinkedDevice,
    setTwoStepPin,
    setPhoneOverride,
    updateAutoDownload
  } = useSettings();
  const { messagesByChat, chats } = useChat();
  const [section, setSection] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [blockedPanelOpen, setBlockedPanelOpen] = useState(false);
  const [linkDeviceOpen, setLinkDeviceOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [twoStepOpen, setTwoStepOpen] = useState(false);
  const [changeNumberOpen, setChangeNumberOpen] = useState(false);
  const [accountInfoOpen, setAccountInfoOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [helpModal, setHelpModal] = useState(null);
  const [storageDetailOpen, setStorageDetailOpen] = useState(false);
  const [autoDownloadOpen, setAutoDownloadOpen] = useState(false);
  const [query, setQuery] = useState("");
  const storageStats = useMemo(() => {
    let totalMessages = 0;
    let photoCount = 0;
    let videoCount = 0;
    let voiceCount = 0;
    let docCount = 0;
    let docBytes = 0;
    Object.values(messagesByChat).forEach((msgs) => {
      totalMessages += msgs.length;
      msgs.forEach((m) => {
        m.attachments.forEach((a) => {
          if (a.type === "image" || a.type === "ai-image" || a.type === "gif") photoCount++;
          else if (a.type === "voice") voiceCount++;
          else if (a.type === "document") {
            docCount++;
            docBytes += a.size;
          }
        });
      });
    });
    return { totalMessages, photoCount, videoCount, voiceCount, docCount, docBytes, chatCount: Object.keys(chats).length };
  }, [messagesByChat, chats]);
  const blockedUsers = MOCK_USERS.filter((u) => settings.blockedUserIds.includes(u.id));
  const filteredSections = useMemo(
    () => SECTIONS.filter((s) => s.label.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const showDetail = section !== null;
  function openSection(id) {
    if (id === "linked-devices") return setSection("linked-devices");
    if (id === "invite") return setInviteOpen(true);
    setSection(id);
  }
  return <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-surface-dark">{
    /* List pane */
  }<div className={`h-full w-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex md:w-80 ${showDetail ? "hidden md:flex" : "flex"}`}><div className="flex items-center gap-3 bg-brand-700 px-4 py-3 dark:bg-brand-900"><button
    onClick={() => navigate("/chat")}
    className="rounded-full p-1.5 text-white/90 hover:bg-white/10"
    aria-label="Back to chats"
  >
            ←
          </button><h1 className="text-lg font-semibold text-white">Settings</h1></div><div className="px-4 pb-2"><div className="relative"><svg
    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  ><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search settings"
    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
  /></div></div>{user && <button
    onClick={() => setProfileModalOpen(true)}
    className="flex items-center gap-3 border-y border-slate-100 px-4 py-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
  ><Avatar user={user} size={58} /><div className="min-w-0"><p className="truncate text-base font-semibold text-slate-900 dark:text-white">{user.name}</p><p className="truncate text-xs text-slate-400">{user.about || "Tap to edit profile"}</p></div></button>}<nav className="flex-1 overflow-y-auto scrollbar-thin py-1">{filteredSections.map((s) => <button
    key={s.id}
    onClick={() => openSection(s.id)}
    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${section === s.id ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}
  ><IconBadge color={s.color}>{s.icon}</IconBadge><div className="min-w-0"><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.label}</p>{s.blurb && <p className="truncate text-xs text-slate-400">{s.blurb}</p>}</div></button>)}{filteredSections.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">No settings match "{query}"</p>}</nav><div className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-300 dark:border-slate-800 dark:text-slate-600">
          Pulse messenger · from the Pulse team, with 💙
        </div></div>{
    /* Detail pane */
  }<div className={`h-full flex-1 flex-col overflow-y-auto scrollbar-thin md:flex ${showDetail ? "flex" : "hidden"}`}>{section && <div className="flex items-center gap-3 bg-brand-700 px-4 py-3 dark:bg-brand-900 md:hidden"><button onClick={() => setSection(null)} className="rounded-full p-1.5 text-white/90 hover:bg-white/10">
              ←
            </button><h2 className="text-base font-semibold text-white">{SECTIONS.find((s) => s.id === section)?.label}</h2></div>}{section === "account" && <div className="divide-y divide-slate-100 dark:divide-slate-800"><Row label="Security notifications" description="Get notified when a security code changes" right={<Toggle checked onChange={() => {
  }} />} /><Row
    label="Two-step verification"
    description={settings.twoStepPin ? "Enabled" : "Not enabled"}
    onClick={() => setTwoStepOpen(true)}
    right={<span className="text-slate-300">›</span>}
  /><Row
    label="Change number"
    description={settings.phoneOverride ?? void 0}
    onClick={() => setChangeNumberOpen(true)}
    right={<span className="text-slate-300">›</span>}
  /><Row label="Request account info" onClick={() => setAccountInfoOpen(true)} right={<span className="text-slate-300">›</span>} /><Row
    label="Delete my account"
    description="This is a demo — deleting will sign you out"
    onClick={() => setDeleteAccountOpen(true)}
    right={<span className="text-rose-400">›</span>}
  /></div>}{section === "privacy" && <div className="divide-y divide-slate-100 dark:divide-slate-800"><div className="px-4 py-3"><p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Last seen and online</p><SegmentedPref
    value={settings.privacy.lastSeenAndOnline}
    onChange={(v) => updatePrivacy({ lastSeenAndOnline: v })}
  /><p className="mt-2 text-xs text-slate-400">
                If you don't share last seen, you also won't see other people's last seen or online status.
              </p></div><div className="px-4 py-3"><p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Profile photo</p><SegmentedPref value={settings.privacy.profilePhoto} onChange={(v) => updatePrivacy({ profilePhoto: v })} /></div><div className="px-4 py-3"><p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">About</p><SegmentedPref value={settings.privacy.about} onChange={(v) => updatePrivacy({ about: v })} /></div><Row
    label="Read receipts"
    description="If turned off, you won't send or receive blue read ticks. Applies to direct chats only."
    right={<Toggle checked={settings.privacy.readReceipts} onChange={(v) => updatePrivacy({ readReceipts: v })} />}
  /><Row
    label="Blocked contacts"
    description={`${blockedUsers.length} contact${blockedUsers.length === 1 ? "" : "s"}`}
    onClick={() => setBlockedPanelOpen(true)}
    right={<span className="text-slate-300">›</span>}
  /></div>}{section === "chats" && <div className="divide-y divide-slate-100 dark:divide-slate-800"><Row
    label="Dark mode"
    description="Switch between light and dark theme"
    right={<Toggle checked={theme === "dark"} onChange={toggleTheme} />}
  /><div className="px-4 py-3"><p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Chat wallpaper</p><div className="flex flex-wrap gap-2">{WALLPAPER_SWATCHES.map((w) => <button
    key={w.id}
    onClick={() => setWallpaper(w.id)}
    className={`flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] ${w.className} ${settings.wallpaper === w.id ? "ring-2 ring-brand-500" : ""}`}
  >{settings.wallpaper === w.id && "\u2713"}</button>)}</div></div><div className="px-4 py-3"><p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Font size</p><div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">{["small", "medium", "large"].map((f) => <button
    key={f}
    onClick={() => setFontSize(f)}
    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition ${settings.fontSize === f ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
  >{f}</button>)}</div></div></div>}{section === "notifications" && <div className="divide-y divide-slate-100 dark:divide-slate-800"><Row
    label="Message notifications"
    description="Show notifications for new messages"
    right={<Toggle checked={settings.notifications.messageNotifications} onChange={(v) => updateNotifications({ messageNotifications: v })} />}
  /><Row
    label="Sound"
    description="Play a sound for incoming messages"
    right={<Toggle checked={settings.notifications.sound} onChange={(v) => updateNotifications({ sound: v })} />}
  /><Row
    label="Show preview"
    description="Show message text in notifications"
    right={<Toggle checked={settings.notifications.showPreview} onChange={(v) => updateNotifications({ showPreview: v })} />}
  /></div>}{section === "storage" && <div className="divide-y divide-slate-100 dark:divide-slate-800"><Row
    label="Manage storage"
    description={`${storageStats.totalMessages} messages \xB7 ${storageStats.photoCount} photos \xB7 ${storageStats.docCount} documents \xB7 ${formatBytes(storageStats.docBytes)}`}
    onClick={() => setStorageDetailOpen(true)}
    right={<span className="text-slate-300">›</span>}
  /><Row
    label="Network usage"
    description={`${storageStats.totalMessages} messages across ${storageStats.chatCount} chats this session`}
    onClick={() => setStorageDetailOpen(true)}
    right={<span className="text-slate-300">›</span>}
  /><Row
    label="Auto-download media"
    description="Wi-Fi, mobile data settings"
    onClick={() => setAutoDownloadOpen(true)}
    right={<span className="text-slate-300">›</span>}
  /></div>}{section === "linked-devices" && <div><div className="divide-y divide-slate-100 dark:divide-slate-800">{settings.linkedDevices.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No other devices linked.</p> : settings.linkedDevices.map((d) => <div key={d.id} className="flex items-center gap-3 px-4 py-3"><span className="text-xl">{DEVICE_ICON[d.platform]}</span><div className="min-w-0 flex-1"><p className="text-sm text-slate-800 dark:text-slate-100">{d.name}</p><p className="text-xs text-slate-400">{formatDeviceTime(d.lastActive)}</p></div><button
    onClick={() => removeLinkedDevice(d.id)}
    className="rounded-md px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
  >
                      Log out
                    </button></div>)}</div><div className="px-4 py-4"><button
    onClick={() => setLinkDeviceOpen(true)}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
  >
                + Link a device
              </button></div></div>}{section === "language" && <div className="divide-y divide-slate-100 dark:divide-slate-800">{["English (device language)", "Espa\xF1ol", "Fran\xE7ais", "\u0939\u093F\u0928\u094D\u0926\u0940", "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD", "\u4E2D\u6587"].map((lang, i) => <Row key={lang} label={lang} onClick={() => {
  }} right={i === 0 ? <span className="text-brand-500">✓</span> : void 0} />)}</div>}{section === "help" && <div className="divide-y divide-slate-100 dark:divide-slate-800"><Row label="Help center" onClick={() => setHelpModal("help")} right={<span className="text-slate-300">›</span>} /><Row label="Contact us" onClick={() => setHelpModal("contact")} right={<span className="text-slate-300">›</span>} /><Row label="Terms and privacy policy" onClick={() => setHelpModal("terms")} right={<span className="text-slate-300">›</span>} /><Row label="App version" description="Pulse demo build 1.0.0" /></div>}{!section && <div className="hidden h-full flex-col items-center justify-center gap-2 px-6 text-center md:flex"><p className="text-sm text-slate-400">Select a settings section</p></div>}</div>{profileModalOpen && user && <AvatarEditModal user={user} onSave={updateProfile} onClose={() => setProfileModalOpen(false)} />}{blockedPanelOpen && <BlockedUsersPanel
    blockedUsers={blockedUsers}
    onUnblock={unblockUser}
    onClose={() => setBlockedPanelOpen(false)}
  />}{linkDeviceOpen && <LinkDeviceModal
    onLink={() => addLinkedDevice({ name: "New device", platform: "web" })}
    onClose={() => setLinkDeviceOpen(false)}
  />}{inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}{twoStepOpen && <TwoStepModal
    currentPin={settings.twoStepPin}
    onSave={setTwoStepPin}
    onClose={() => setTwoStepOpen(false)}
  />}{changeNumberOpen && <ChangeNumberModal
    currentPhone={settings.phoneOverride ?? "+91 98765 43210"}
    onSave={setPhoneOverride}
    onClose={() => setChangeNumberOpen(false)}
  />}{accountInfoOpen && user && <AccountInfoModal userName={user.name} stats={storageStats} onClose={() => setAccountInfoOpen(false)} />}{deleteAccountOpen && <DeleteAccountModal
    onConfirm={() => {
      setDeleteAccountOpen(false);
      signOut();
      navigate("/login");
    }}
    onClose={() => setDeleteAccountOpen(false)}
  />}{storageDetailOpen && <StorageDetailModal stats={storageStats} onClose={() => setStorageDetailOpen(false)} />}{autoDownloadOpen && <AutoDownloadModal
    value={settings.autoDownload}
    onChange={updateAutoDownload}
    onClose={() => setAutoDownloadOpen(false)}
  />}{helpModal && <HelpContentModal kind={helpModal} onClose={() => setHelpModal(null)} />}</div>;
}
export {
  SettingsPage
};
