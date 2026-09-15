import React, { useRef, useState } from "react";
import type { Attachment, UploadProgress } from "@/types";
import { uploadFile } from "@/services/api";
import { Spinner } from "@/components/common/Common";
import { AttachmentMenu } from "@/components/chat/AttachmentMenu";
import { EmojiPicker, GifPicker } from "@/components/chat/Pickers";
import { PollComposer, EventComposer, ContactPicker, LocationShare, AIImageComposer, PaymentComposer } from "@/components/chat/ComposerModals";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  editingMessage,
  onSubmitEdit,
  onCancelEdit,
  users,
  disabledReason
}) {
  const [text, setText] = useState("");
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [readyAttachments, setReadyAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [recording, setRecording] = useState(false);
  React.useEffect(() => {
    if (editingMessage) setText(editingMessage.text);
  }, [editingMessage]);
  function handleChange(e) {
    setText(e.target.value);
    if (e.target.value.trim()) onTypingStart();
    else onTypingStop();
  }
  function insertEmoji(emoji) {
    setText((t) => t + emoji);
    textareaRef.current?.focus();
  }
  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setUploads((prev) => ({ ...prev, [id]: { id, fileName: file.name, progress: 0, done: false } }));
      const { promise } = uploadFile(file, (pct) => {
        setUploads((prev) => prev[id] ? { ...prev, [id]: { ...prev[id], progress: pct } } : prev);
      });
      promise.then((res) => {
        const attachment: Attachment = file.type.startsWith("image/") ? { type: "image", id: res.id, name: file.name, url: res.url, size: file.size } : { type: "document", id: res.id, name: file.name, url: res.url, size: file.size };
        setUploads((prev) => ({ ...prev, [id]: { ...prev[id], done: true, progress: 100, attachment } }));
      }).catch((err) => {
        setUploads((prev) => ({ ...prev, [id]: { ...prev[id], error: err.message, done: true } }));
      });
    });
  }
  function removeUpload(id) {
    setUploads((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }
  function toggleViewOnce(id) {
    setUploads((prev) => {
      const u = prev[id];
      if (!u?.attachment || u.attachment.type !== "image") return prev;
      return { ...prev, [id]: { ...u, attachment: { ...u.attachment, viewOnce: !u.attachment.viewOnce } } };
    });
  }
  function removeReadyAttachment(id) {
    setReadyAttachments((prev) => prev.filter((a) => a.id !== id));
  }
  function addReadyAttachmentAndSend(attachment) {
    onSend("", [attachment]);
  }
  function handleAttachmentMenuSelect(kind) {
    switch (kind) {
      case "gallery":
        galleryInputRef.current?.click();
        break;
      case "camera":
        cameraInputRef.current?.click();
        break;
      case "document":
        fileInputRef.current?.click();
        break;
      case "location":
        setActiveModal("location");
        break;
      case "contact":
        setActiveModal("contact");
        break;
      case "poll":
        setActiveModal("poll");
        break;
      case "event":
        setActiveModal("event");
        break;
      case "ai-image":
        setActiveModal("ai-image");
        break;
      case "payment":
        setActiveModal("payment");
        break;
    }
  }
  function handleSubmit(e) {
    e.preventDefault();
    const attachments = [
      ...readyAttachments,
      ...Object.values(uploads).filter((u) => u.done && u.attachment).map((u) => u.attachment)
    ];
    if (editingMessage) {
      if (!text.trim()) return;
      onSubmitEdit(text.trim());
      setText("");
      return;
    }
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments);
    setText("");
    setUploads({});
    setReadyAttachments([]);
    onTypingStop();
  }
  const pendingUploads = Object.values(uploads);
  const stillUploading = pendingUploads.some((u) => !u.done);
  const hasContent = text.trim().length > 0 || readyAttachments.length > 0 || pendingUploads.length > 0;
  if (disabledReason) {
    return <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>{disabledReason}</div>;
  }
  return <div className="relative border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">{replyTo && <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs dark:bg-slate-800"><span className="truncate text-slate-500 dark:text-slate-400">
            Replying to: <span className="text-slate-700 dark:text-slate-200">{replyTo.text}</span></span><button onClick={onCancelReply} className="ml-2 shrink-0 text-slate-400 hover:text-slate-600">
            ✕
          </button></div>}{editingMessage && <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-1.5 text-xs dark:bg-amber-500/10"><span className="text-amber-700 dark:text-amber-400">Editing message</span><button onClick={onCancelEdit} className="text-amber-600 hover:text-amber-800">
            Cancel
          </button></div>}{(pendingUploads.length > 0 || readyAttachments.length > 0) && <div className="mb-2 flex flex-wrap gap-2">{readyAttachments.map((a) => <div
    key={a.id}
    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
  ><span>📎</span><span className="max-w-[140px] truncate">{a.name}</span><button onClick={() => removeReadyAttachment(a.id)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button></div>)}{pendingUploads.map((u) => <div
    key={u.id}
    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
  >{!u.done && <Spinner size={12} />}<span className="max-w-[140px] truncate">{u.fileName}</span>{!u.done && <span className="text-slate-400">{u.progress}%</span>}{u.error && <span className="text-rose-500">Failed</span>}{u.done && u.attachment?.type === "image" && <button
    onClick={() => toggleViewOnce(u.id)}
    title="Send as view-once photo"
    className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${u.attachment.viewOnce ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300"}`}
  >
                  1️⃣
                </button>}<button onClick={() => removeUpload(u.id)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button></div>)}</div>}<form onSubmit={handleSubmit} className="flex items-end gap-1.5"><input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  }} /><input
    ref={galleryInputRef}
    type="file"
    accept="image/*"
    multiple
    className="hidden"
    onChange={(e) => {
      handleFiles(e.target.files);
      e.target.value = "";
    }}
  /><input
    ref={cameraInputRef}
    type="file"
    accept="image/*"
    capture="environment"
    className="hidden"
    onChange={(e) => {
      handleFiles(e.target.files);
      e.target.value = "";
    }}
  /><div className={`flex min-w-0 flex-1 items-end gap-1.5 ${recording ? "hidden" : ""}`}><div className="relative"><button
    type="button"
    onClick={() => {
      setAttachMenuOpen((o) => !o);
      setEmojiOpen(false);
      setGifOpen(false);
    }}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    aria-label="Attach"
    title="Attach"
  ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.2-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.48" /></svg></button>{attachMenuOpen && <AttachmentMenu onSelect={handleAttachmentMenuSelect} onClose={() => setAttachMenuOpen(false)} />}</div><div className="relative"><button
    type="button"
    onClick={() => {
      setEmojiOpen((o) => !o);
      setAttachMenuOpen(false);
      setGifOpen(false);
    }}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    aria-label="Emoji"
    title="Emoji"
  ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg></button>{emojiOpen && <EmojiPicker onPick={insertEmoji} onClose={() => setEmojiOpen(false)} />}</div><div className="relative"><button
    type="button"
    onClick={() => {
      setGifOpen((o) => !o);
      setAttachMenuOpen(false);
      setEmojiOpen(false);
    }}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    aria-label="GIF"
    title="GIF / stickers"
  >
              GIF
            </button>{gifOpen && <GifPicker onPick={(gif) => addReadyAttachmentAndSend({ type: "gif", ...gif })} onClose={() => setGifOpen(false)} />}</div><textarea
    ref={textareaRef}
    value={text}
    onChange={handleChange}
    onBlur={onTypingStop}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    }}
    rows={1}
    placeholder="Type a message…"
    className="max-h-32 min-w-0 flex-1 resize-none rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
  />{hasContent && <button
    type="submit"
    disabled={stillUploading}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-insta-gradient text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
    aria-label="Send message"
  ><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg></button>}</div>{
    /* Single persistent VoiceRecorder instance — must never be conditionally
       unmounted/remounted while it might be mid-recording, or the active
       MediaRecorder session (held in its internal refs) would be lost. */
  }<div className={hasContent && !recording ? "hidden" : "contents"}><VoiceRecorder onSend={(attachment) => onSend("", [attachment])} onRecordingChange={setRecording} /></div></form>{activeModal === "poll" && <PollComposer onCreate={(a) => {
    addReadyAttachmentAndSend(a);
    setActiveModal(null);
  }} onClose={() => setActiveModal(null)} />}{activeModal === "event" && <EventComposer onCreate={(a) => {
    addReadyAttachmentAndSend(a);
    setActiveModal(null);
  }} onClose={() => setActiveModal(null)} />}{activeModal === "contact" && <ContactPicker users={users} onPick={(a) => {
    addReadyAttachmentAndSend(a);
    setActiveModal(null);
  }} onClose={() => setActiveModal(null)} />}{activeModal === "location" && <LocationShare onShare={(a) => {
    addReadyAttachmentAndSend(a);
    setActiveModal(null);
  }} onClose={() => setActiveModal(null)} />}{activeModal === "ai-image" && <AIImageComposer onCreate={(a) => {
    addReadyAttachmentAndSend(a);
    setActiveModal(null);
  }} onClose={() => setActiveModal(null)} />}{activeModal === "payment" && <PaymentComposer onCreate={(a) => {
    addReadyAttachmentAndSend(a);
    setActiveModal(null);
  }} onClose={() => setActiveModal(null)} />}</div>;
}
export {
  MessageInput
};
