const OPTIONS = [
  {
    kind: "gallery",
    label: "Gallery",
    color: "#c04fc7",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
  },
  {
    kind: "camera",
    label: "Camera",
    color: "#e0546b",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
  },
  {
    kind: "document",
    label: "Document",
    color: "#6a5cf0",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
  },
  {
    kind: "location",
    label: "Location",
    color: "#3fb06a",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
  },
  {
    kind: "contact",
    label: "Contact",
    color: "#3f9be0",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  },
  {
    kind: "poll",
    label: "Poll",
    color: "#e0a83f",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
  },
  {
    kind: "event",
    label: "Event",
    color: "#e0546b",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  },
  {
    kind: "ai-image",
    label: "AI Image",
    color: "#4a63f0",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6L12 3z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" /></svg>
  },
  {
    kind: "payment",
    label: "Payment",
    color: "#3fa85f",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
  }
];
function AttachmentMenu({ onSelect, onClose }) {
  return <div
    className="absolute bottom-14 left-0 z-30 grid w-64 grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800"
    role="menu"
  >{OPTIONS.map((opt) => <button
    key={opt.kind}
    role="menuitem"
    onClick={() => {
      onSelect(opt.kind);
      onClose();
    }}
    className="flex flex-col items-center gap-1.5 rounded-lg p-1 text-center transition hover:bg-slate-50 dark:hover:bg-slate-700"
  ><span
    className="flex h-11 w-11 items-center justify-center rounded-full shadow-sm"
    style={{ backgroundColor: opt.color }}
  >{opt.icon}</span><span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{opt.label}</span></button>)}</div>;
}
export {
  AttachmentMenu
};
