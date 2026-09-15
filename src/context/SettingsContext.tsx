import { createContext, useContext, useEffect, useMemo, useState } from "react";
const STORAGE_KEY = "chat-app:settings";
const DEFAULT_SETTINGS = {
  privacy: {
    lastSeenAndOnline: "everyone",
    profilePhoto: "everyone",
    about: "everyone",
    readReceipts: true
  },
  notifications: {
    messageNotifications: true,
    sound: true,
    showPreview: true
  },
  wallpaper: "default",
  fontSize: "medium",
  blockedUserIds: [],
  linkedDevices: [
    { id: "dev-1", name: "Chrome on Windows", platform: "desktop", lastActive: Date.now() - 1e3 * 60 * 12 },
    { id: "dev-2", name: "Safari on iPad", platform: "tablet", lastActive: Date.now() - 1e3 * 60 * 60 * 26 }
  ],
  twoStepPin: null,
  phoneOverride: null,
  autoDownload: {
    photos: true,
    videos: false,
    documents: false,
    onMobileData: false
  }
};
function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      privacy: { ...DEFAULT_SETTINGS.privacy, ...parsed.privacy },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
      blockedUserIds: parsed.blockedUserIds ?? DEFAULT_SETTINGS.blockedUserIds,
      linkedDevices: parsed.linkedDevices ?? DEFAULT_SETTINGS.linkedDevices,
      autoDownload: { ...DEFAULT_SETTINGS.autoDownload, ...parsed.autoDownload }
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
const SettingsContext = createContext<any>(null);
function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadInitial);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);
  const value = useMemo(
    () => ({
      settings,
      updatePrivacy: (patch) => setSettings((s) => ({ ...s, privacy: { ...s.privacy, ...patch } })),
      updateNotifications: (patch) => setSettings((s) => ({ ...s, notifications: { ...s.notifications, ...patch } })),
      setWallpaper: (wallpaper) => setSettings((s) => ({ ...s, wallpaper })),
      setFontSize: (fontSize) => setSettings((s) => ({ ...s, fontSize })),
      resetSettings: () => setSettings(DEFAULT_SETTINGS),
      blockUser: (userId) => setSettings((s) => s.blockedUserIds.includes(userId) ? s : { ...s, blockedUserIds: [...s.blockedUserIds, userId] }),
      unblockUser: (userId) => setSettings((s) => ({ ...s, blockedUserIds: s.blockedUserIds.filter((id) => id !== userId) })),
      isBlocked: (userId) => settings.blockedUserIds.includes(userId),
      addLinkedDevice: (device) => setSettings((s) => ({
        ...s,
        linkedDevices: [...s.linkedDevices, { ...device, id: `dev-${Date.now()}`, lastActive: Date.now() }]
      })),
      removeLinkedDevice: (deviceId) => setSettings((s) => ({ ...s, linkedDevices: s.linkedDevices.filter((d) => d.id !== deviceId) })),
      setTwoStepPin: (pin) => setSettings((s) => ({ ...s, twoStepPin: pin })),
      setPhoneOverride: (phone) => setSettings((s) => ({ ...s, phoneOverride: phone })),
      updateAutoDownload: (patch) => setSettings((s) => ({ ...s, autoDownload: { ...s.autoDownload, ...patch } }))
    }),
    [settings]
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
export {
  SettingsProvider,
  useSettings
};
