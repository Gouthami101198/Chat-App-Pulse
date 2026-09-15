import { useRef, useState } from "react";
import { CURRENT_USER_ID } from "@/mock/data";
import { Avatar, Spinner } from "@/components/common/Common";
function ModalShell({
  title,
  onClose,
  children,
  wide = false
}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div
    onClick={(e) => e.stopPropagation()}
    className={`w-full ${wide ? "max-w-lg" : "max-w-sm"} max-h-[85vh] overflow-y-auto scrollbar-thin rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800`}
  ><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2><button
    onClick={onClose}
    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
    aria-label="Close"
  >
            ✕
          </button></div>{children}</div></div>;
}
function PrimaryButton({ children, ...props }) {
  return <button
    {...props}
    className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
  >{children}</button>;
}
function TextField({
  label,
  ...props
}) {
  return <label className="mb-3 block"><span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span><input
    {...props}
    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /></label>;
}
function PollComposer({
  onCreate,
  onClose
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const canSubmit = question.trim().length > 0 && options.filter((o) => o.trim()).length >= 2;
  function updateOption(i, value) {
    setOptions((prev) => prev.map((o, idx) => idx === i ? value : o));
  }
  function addOption() {
    if (options.length < 6) setOptions((prev) => [...prev, ""]);
  }
  function removeOption(i) {
    if (options.length > 2) setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }
  function submit() {
    if (!canSubmit) return;
    const attachment = {
      type: "poll",
      id: `poll-${Date.now()}`,
      name: "Poll",
      question: question.trim(),
      allowMultiple,
      options: options.filter((o) => o.trim()).map((text, i) => ({ id: `opt-${i}`, text: text.trim(), votes: [] }))
    };
    onCreate(attachment);
  }
  return <ModalShell title="Create poll" onClose={onClose}><TextField label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What should we do?" autoFocus /><p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Options</p>{options.map((opt, i) => <div key={i} className="mb-2 flex items-center gap-2"><input
    value={opt}
    onChange={(e) => updateOption(i, e.target.value)}
    placeholder={`Option ${i + 1}`}
    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  />{options.length > 2 && <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-rose-500">
              ✕
            </button>}</div>)}{options.length < 6 && <button onClick={addOption} className="mb-3 text-sm font-medium text-brand-500 hover:underline">
          + Add option
        </button>}<label className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} />
        Allow multiple answers
      </label><PrimaryButton onClick={submit} disabled={!canSubmit}>
        Send poll
      </PrimaryButton></ModalShell>;
}
function EventComposer({
  onCreate,
  onClose
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const canSubmit = title.trim().length > 0 && date.length > 0;
  function submit() {
    if (!canSubmit) return;
    const attachment = {
      type: "event",
      id: `event-${Date.now()}`,
      name: "Event",
      title: title.trim(),
      date,
      time: time || void 0,
      location: location.trim() || void 0
    };
    onCreate(attachment);
  }
  return <ModalShell title="Create event" onClose={onClose}><TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team standup" autoFocus /><div className="grid grid-cols-2 gap-3"><TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><TextField label="Time (optional)" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div><TextField label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Conference room / link" /><PrimaryButton onClick={submit} disabled={!canSubmit}>
        Send event
      </PrimaryButton></ModalShell>;
}
function PaymentComposer({
  onCreate,
  onClose
}) {
  const [mode, setMode] = useState("sent");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const parsedAmount = parseFloat(amount);
  const canSubmit = !isNaN(parsedAmount) && parsedAmount > 0;
  function submit() {
    if (!canSubmit) return;
    const attachment = {
      type: "payment",
      id: `payment-${Date.now()}`,
      name: "Payment",
      amount: parsedAmount,
      currency: "\u20B9",
      note: note.trim() || void 0,
      kind: mode,
      status: mode === "sent" ? "completed" : "pending"
    };
    onCreate(attachment);
  }
  return <ModalShell title="Send or request payment" onClose={onClose}><div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">{["sent", "requested"].map((m) => <button
    key={m}
    onClick={() => setMode(m)}
    className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition ${mode === m ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
  >{m === "sent" ? "Send money" : "Request money"}</button>)}</div><label className="mb-3 block"><span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</span><div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 dark:border-slate-600 dark:bg-slate-700"><span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">₹</span><input
    value={amount}
    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
    placeholder="0.00"
    inputMode="decimal"
    autoFocus
    className="w-full bg-transparent text-sm outline-none dark:text-white"
  /></div></label><TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's this for?" /><p className="mb-3 text-xs text-slate-400">This is a demo — no real money moves. It just posts a payment card to the chat.</p><PrimaryButton onClick={submit} disabled={!canSubmit}>{mode === "sent" ? "Send" : "Request"} ₹{amount || "0.00"}</PrimaryButton></ModalShell>;
}
function ContactPicker({
  users,
  onPick,
  onClose
}) {
  const [query, setQuery] = useState("");
  const filtered = users.filter((u) => u.id !== CURRENT_USER_ID).filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));
  function pick(user) {
    const attachment = {
      type: "contact",
      id: `contact-${Date.now()}`,
      name: "Contact",
      contactUserId: user.id,
      contactName: user.name,
      contactAvatarColor: user.avatarColor,
      phone: `+91 ${String(Math.abs(hashCode(user.id))).padStart(10, "9").slice(0, 10)}`
    };
    onPick(attachment);
    onClose();
  }
  return <ModalShell title="Share a contact" onClose={onClose}><input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search contacts"
    autoFocus
    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  /><div className="space-y-1">{filtered.map((u) => <button
    key={u.id}
    onClick={() => pick(u)}
    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
  ><Avatar user={u} size={36} /><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{u.name}</p><p className="truncate text-xs text-slate-400">{u.about}</p></div></button>)}{filtered.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No contacts found</p>}</div></ModalShell>;
}
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
function LocationShare({
  onShare,
  onClose
}) {
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Could not access your location. You can still send a place by name.");
        setLocating(false);
      },
      { timeout: 6e3 }
    );
  }
  function submit() {
    const attachment = {
      type: "location",
      id: `loc-${Date.now()}`,
      name: "Location",
      latitude: coords?.lat ?? 11.0168 + (Math.random() - 0.5) * 0.05,
      longitude: coords?.lng ?? 76.9558 + (Math.random() - 0.5) * 0.05,
      address: address.trim() || void 0
    };
    onShare(attachment);
  }
  return <ModalShell title="Share location" onClose={onClose}><MapPreview lat={coords?.lat} lng={coords?.lng} /><button
    onClick={useCurrentLocation}
    disabled={locating}
    className="mb-3 mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:bg-brand-100 disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
  >{locating && <Spinner size={14} />}{locating ? "Locating\u2026" : "\u{1F4CD} Use current location"}</button>{error && <p className="mb-3 text-xs text-rose-500">{error}</p>}<TextField label="Label (optional)" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Office, Home, Cafe" /><PrimaryButton onClick={submit}>Send location</PrimaryButton></ModalShell>;
}
function MapPreview({ lat, lng, compact = false }) {
  const seed = Math.abs(hashCode(`${lat ?? 0}-${lng ?? 0}`));
  const roads = Array.from({ length: 5 }, (_, i) => (seed >> i * 3) % 100);
  return <div
    className={`relative overflow-hidden rounded-xl bg-emerald-50 dark:bg-emerald-500/10 ${compact ? "h-24" : "h-40"}`}
  ><svg viewBox="0 0 300 150" className="h-full w-full" preserveAspectRatio="none"><rect width="300" height="150" fill="#e7f5ee" />{roads.map((r, i) => <line key={i} x1={0} y1={r % 150} x2={300} y2={r * 2 % 150} stroke="#c7e6d3" strokeWidth="6" />)}{roads.map((r, i) => <line key={`v${i}`} x1={r % 300} y1={0} x2={r * 3 % 300} y2={150} stroke="#c7e6d3" strokeWidth="6" />)}</svg><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-2xl">📍</div></div>;
}
const AI_PALETTES = [
  ["#f472b6", "#818cf8"],
  ["#fbbf24", "#fb7185"],
  ["#34d399", "#60a5fa"],
  ["#a78bfa", "#f472b6"],
  ["#38bdf8", "#6366f1"]
];
function AIImageComposer({
  onCreate,
  onClose
}) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setPreviewUrl(null);
    setTimeout(() => {
      const [from, to] = AI_PALETTES[Math.abs(hashCode(prompt)) % AI_PALETTES.length];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${from}"/>
            <stop offset="100%" stop-color="${to}"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" fill="url(#g)"/>
        <text x="256" y="240" font-size="28" font-family="sans-serif" font-weight="700" fill="white" text-anchor="middle" opacity="0.9">\u2728 AI generated</text>
        <foreignObject x="40" y="270" width="432" height="180">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color:white;font-family:sans-serif;font-size:20px;text-align:center;line-height:1.4;">${escapeHtml(
        prompt
      )}</div>
        </foreignObject>
      </svg>`;
      setPreviewUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
      setGenerating(false);
    }, 1100);
  }
  function send() {
    if (!previewUrl) return;
    const attachment = {
      type: "ai-image",
      id: `ai-${Date.now()}`,
      name: `AI image: ${prompt.slice(0, 30)}`,
      url: previewUrl,
      prompt: prompt.trim()
    };
    onCreate(attachment);
  }
  return <ModalShell title="Create AI image" onClose={onClose}><TextField
    label="Describe the image"
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    placeholder="A sunset over the mountains, watercolor style"
    autoFocus
  /><button
    onClick={generate}
    disabled={!prompt.trim() || generating}
    className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:bg-brand-100 disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
  >{generating && <Spinner size={14} />}{generating ? "Generating\u2026" : "\u2728 Generate"}</button>{previewUrl && <div className="mb-3 overflow-hidden rounded-xl"><img src={previewUrl} alt={prompt} className="w-full" /></div>}<p className="mb-3 text-xs text-slate-400">
        Demo generator — produces a stylized placeholder. Swap in a real image API to generate actual artwork.
      </p><PrimaryButton onClick={send} disabled={!previewUrl}>
        Send image
      </PrimaryButton></ModalShell>;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const AVATAR_COLORS = ["#4a63f0", "#e0678a", "#2fa88a", "#e0a83f", "#7a5cf0", "#3fb0e0", "#c94f4f", "#5b8def"];
const ABOUT_PRESETS = [
  "Available",
  "Busy",
  "At work",
  "At the movies",
  "In a meeting",
  "Battery about to die \u{1F50B}",
  "Urgent calls only",
  "Sleeping \u{1F634}"
];
function AvatarEditModal({
  user,
  onSave,
  onClose
}) {
  const [name, setName] = useState(user.name);
  const [about, setAbout] = useState(user.about ?? "");
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [showAboutPresets, setShowAboutPresets] = useState(false);
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const aboutInputRef = useRef(null);
  const fakePhone = `+91 ${String(Math.abs(hashCode(user.id))).padStart(10, "9").slice(0, 10)}`;
  const NAME_LIMIT = 25;
  const ABOUT_LIMIT = 139;
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result);
    reader.readAsDataURL(file);
  }
  function submit() {
    onSave({ name: name.trim() || user.name, about: about.trim(), avatarColor, avatarUrl });
    onClose();
  }
  return <ModalShell title="Profile" onClose={onClose}><div className="mb-2 flex flex-col items-center"><div className="relative"><button onClick={() => fileInputRef.current?.click()} className="block"><Avatar user={{ name, avatarColor, status: user.status, avatarUrl }} size={128} /></button><button
    onClick={() => fileInputRef.current?.click()}
    className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-md ring-2 ring-white dark:ring-slate-800"
    title="Change photo"
    aria-label="Change photo"
  ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg></button><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} /></div>{avatarUrl ? <button onClick={() => setAvatarUrl(null)} className="mt-3 text-xs font-medium text-rose-500 hover:underline">
            Remove photo
          </button> : <div className="mt-3 flex gap-2">{AVATAR_COLORS.map((c) => <button
    key={c}
    onClick={() => setAvatarColor(c)}
    className={`h-6 w-6 rounded-full ring-offset-2 dark:ring-offset-slate-800 ${avatarColor === c ? "ring-2 ring-brand-500" : ""}`}
    style={{ backgroundColor: c }}
    aria-label={`Choose color ${c}`}
  />)}</div>}</div>{
    /* Name */
  }<div className="mt-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-brand-500">Your name</span>{editingName ? <span className="text-[11px] text-slate-400">{name.length}/{NAME_LIMIT}</span> : <button
    onClick={() => {
      setEditingName(true);
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }}
    className="text-slate-400 hover:text-brand-500"
    aria-label="Edit name"
  ><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" /></svg></button>}</div><input
    ref={nameInputRef}
    value={name}
    onChange={(e) => setName(e.target.value.slice(0, NAME_LIMIT))}
    onFocus={() => setEditingName(true)}
    onBlur={() => setEditingName(false)}
    className="mt-1 w-full border-b border-slate-200 bg-transparent py-1.5 text-sm text-slate-800 outline-none focus:border-brand-500 dark:border-slate-600 dark:text-white"
  /></div><p className="mb-5 mt-1.5 text-xs text-slate-400">
        This is not your username or PIN. This name will be visible to your Pulse contacts.
      </p>{
    /* About */
  }<div><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-brand-500">About</span>{editingAbout ? <span className="text-[11px] text-slate-400">{about.length}/{ABOUT_LIMIT}</span> : <button
    onClick={() => {
      setEditingAbout(true);
      setShowAboutPresets(true);
      setTimeout(() => aboutInputRef.current?.focus(), 0);
    }}
    className="text-slate-400 hover:text-brand-500"
    aria-label="Edit about"
  ><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" /></svg></button>}</div><input
    ref={aboutInputRef}
    value={about}
    onChange={(e) => setAbout(e.target.value.slice(0, ABOUT_LIMIT))}
    onFocus={() => {
      setEditingAbout(true);
      setShowAboutPresets(true);
    }}
    placeholder="Hey there! I am using Pulse."
    className="mt-1 w-full border-b border-slate-200 bg-transparent py-1.5 text-sm text-slate-800 outline-none focus:border-brand-500 dark:border-slate-600 dark:text-white"
  />{showAboutPresets && <div className="mt-2 flex flex-wrap gap-1.5">{ABOUT_PRESETS.map((preset) => <button
    key={preset}
    onClick={() => setAbout(preset)}
    className={`rounded-full border px-2.5 py-1 text-xs transition ${about === preset ? "border-brand-400 bg-brand-50 text-brand-600 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300" : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"}`}
  >{preset}</button>)}</div>}</div>{
    /* Phone (read-only, matches WhatsApp's profile screen) */
  }<div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700"><span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</span><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{fakePhone}</p></div><div className="mt-6"><PrimaryButton onClick={submit}>Save</PrimaryButton></div></ModalShell>;
}
export {
  AIImageComposer,
  AvatarEditModal,
  ContactPicker,
  EventComposer,
  LocationShare,
  MapPreview,
  PaymentComposer,
  PollComposer
};
