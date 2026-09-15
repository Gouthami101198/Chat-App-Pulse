import { useMemo } from "react";
const EMOJI_CATEGORIES = [
  {
    label: "Smileys",
    emojis: ["\u{1F600}", "\u{1F601}", "\u{1F602}", "\u{1F923}", "\u{1F60A}", "\u{1F60D}", "\u{1F618}", "\u{1F61C}", "\u{1F914}", "\u{1F60E}", "\u{1F973}", "\u{1F634}", "\u{1F62D}", "\u{1F621}", "\u{1F970}", "\u{1F917}"]
  },
  {
    label: "Gestures",
    emojis: ["\u{1F44D}", "\u{1F44E}", "\u{1F44F}", "\u{1F64C}", "\u{1F64F}", "\u{1F44B}", "\u{1F4AA}", "\u270C\uFE0F", "\u{1F91D}", "\u{1F44C}", "\u270B", "\u{1F91E}"]
  },
  {
    label: "Hearts",
    emojis: ["\u2764\uFE0F", "\u{1F9E1}", "\u{1F49B}", "\u{1F49A}", "\u{1F499}", "\u{1F49C}", "\u{1F5A4}", "\u{1F495}", "\u{1F496}", "\u{1F494}"]
  },
  {
    label: "Objects",
    emojis: ["\u{1F525}", "\u{1F389}", "\u2728", "\u{1F382}", "\u{1F381}", "\u2615", "\u{1F4C5}", "\u{1F4CD}", "\u{1F4F7}", "\u{1F4C4}", "\u23F0", "\u2705"]
  }
];
function EmojiPicker({ onPick, onClose }) {
  return <div
    className="absolute bottom-14 left-0 z-30 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800"
    onMouseLeave={onClose}
  ><div className="max-h-64 overflow-y-auto scrollbar-thin">{EMOJI_CATEGORIES.map((cat) => <div key={cat.label} className="mb-2"><p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{cat.label}</p><div className="grid grid-cols-8 gap-1">{cat.emojis.map((e) => <button
    key={e}
    onClick={() => onPick(e)}
    className="rounded-md p-1 text-lg leading-none transition hover:scale-125 hover:bg-slate-50 dark:hover:bg-slate-700"
  >{e}</button>)}</div></div>)}</div></div>;
}
const STICKERS = [
  { id: "lol", label: "LOL", emoji: "\u{1F602}", from: "#fbbf24", to: "#f87171" },
  { id: "nice", label: "Nice!", emoji: "\u{1F44D}", from: "#60a5fa", to: "#34d399" },
  { id: "yay", label: "Yay!", emoji: "\u{1F389}", from: "#a78bfa", to: "#f472b6" },
  { id: "love", label: "Love it", emoji: "\u{1F60D}", from: "#f472b6", to: "#fb7185" },
  { id: "fire", label: "Fire", emoji: "\u{1F525}", from: "#fb923c", to: "#ef4444" },
  { id: "sad", label: "Aww", emoji: "\u{1F97A}", from: "#93c5fd", to: "#818cf8" },
  { id: "bravo", label: "Bravo", emoji: "\u{1F44F}", from: "#34d399", to: "#22d3ee" },
  { id: "yasss", label: "Yasss", emoji: "\u{1F64C}", from: "#fcd34d", to: "#f472b6" }
];
function stickerDataUrl(s) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${s.from}"/>
        <stop offset="100%" stop-color="${s.to}"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="24" fill="url(#g)"/>
    <text x="100" y="105" font-size="70" text-anchor="middle" dominant-baseline="middle">${s.emoji}</text>
    <text x="100" y="172" font-size="20" font-family="sans-serif" font-weight="700" fill="white" text-anchor="middle">${s.label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function GifPicker({
  onPick,
  onClose
}) {
  const stickers = useMemo(() => STICKERS.map((s) => ({ ...s, url: stickerDataUrl(s) })), []);
  return <div
    className="absolute bottom-14 left-0 z-30 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800"
    onMouseLeave={onClose}
  ><p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Stickers</p><div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto scrollbar-thin">{stickers.map((s) => <button
    key={s.id}
    onClick={() => {
      onPick({ id: `sticker-${s.id}-${Date.now()}`, name: s.label, url: s.url });
      onClose();
    }}
    className="overflow-hidden rounded-xl transition hover:scale-105"
    title={s.label}
  ><img src={s.url} alt={s.label} className="h-full w-full object-cover" /></button>)}</div></div>;
}
export {
  EmojiPicker,
  GifPicker
};
