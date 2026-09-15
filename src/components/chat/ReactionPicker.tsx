const QUICK_REACTIONS = ["\u{1F44D}", "\u2764\uFE0F", "\u{1F602}", "\u{1F62E}", "\u{1F622}", "\u{1F64F}"];
function ReactionPicker({ onPick, onClose }) {
  return <div
    className="absolute z-30 flex -translate-y-full gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
    onMouseLeave={onClose}
  >{QUICK_REACTIONS.map((emoji) => <button
    key={emoji}
    onClick={() => {
      onPick(emoji);
      onClose();
    }}
    className="rounded-full p-1 text-lg transition hover:scale-125"
    aria-label={`React with ${emoji}`}
  >{emoji}</button>)}</div>;
}
export {
  ReactionPicker
};
