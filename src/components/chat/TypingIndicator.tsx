function TypingIndicator({ label }) {
  return <div className="flex items-center gap-2 px-4 py-1 text-xs text-slate-400"><div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">{[0, 1, 2].map((i) => <span
    key={i}
    className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-slate-400 dark:bg-slate-500"
    style={{ animationDelay: `${i * 0.15}s` }}
  />)}</div><span>{label}</span></div>;
}
export {
  TypingIndicator
};
