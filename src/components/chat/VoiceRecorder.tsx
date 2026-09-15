import { useEffect, useRef, useState } from "react";
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function VoiceRecorder({
  onSend,
  onRecordingChange
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const secondsRef = useRef(0);
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const duration = secondsRef.current;
        stream.getTracks().forEach((t) => t.stop());
        if (duration > 0) {
          onSend({ type: "voice", id: `voice-${Date.now()}`, name: "Voice message", url, duration });
        }
        secondsRef.current = 0;
        setSeconds(0);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      onRecordingChange?.(true);
      secondsRef.current = 0;
      setSeconds(0);
      intervalRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1e3);
    } catch {
      setError("Microphone access was denied. Enable it in your browser to send voice messages.");
    }
  }
  function stopRecording(send) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
    onRecordingChange?.(false);
    if (mediaRecorderRef.current) {
      if (!send) {
        chunksRef.current = [];
      }
      mediaRecorderRef.current.stop();
    }
  }
  if (recording) {
    return <div className="flex flex-1 items-center gap-3 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 dark:border-rose-500/30 dark:bg-rose-500/10"><span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" /><span className="text-sm font-medium text-rose-600 dark:text-rose-300">Recording… {formatTime(seconds)}</span><div className="ml-auto flex items-center gap-2"><button
      type="button"
      onClick={() => stopRecording(false)}
      className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200/50 dark:text-slate-400"
    >
            Cancel
          </button><button
      type="button"
      onClick={() => stopRecording(true)}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600"
      aria-label="Send voice message"
    ><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg></button></div></div>;
  }
  return <div className="relative"><button
    type="button"
    onClick={startRecording}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    aria-label="Record voice message"
    title="Record voice message"
  ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg></button>{error && <div className="absolute bottom-12 left-1/2 w-52 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-center text-xs text-white shadow-lg">{error}</div>}</div>;
}
export {
  VoiceRecorder
};
