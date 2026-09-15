import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "@/services/api";
import { Spinner } from "@/components/common/Common";
function ForgotPasswordForm() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("idle");
  const [touched, setTouched] = useState(false);
  const isValid = value.trim().length > 3;
  const inputError = touched && !isValid ? "Enter your email or phone number." : null;
  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    setStatus("loading");
    try {
      await requestPasswordReset(value.trim());
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-surface-dark"><div className="w-full max-w-sm"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-insta-gradient text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg></div><h1 className="text-xl font-semibold text-slate-900 dark:text-white">Reset your password</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{status === "sent" ? "We've sent reset instructions." : "Enter your email or phone and we'll send you reset instructions."}</p></div>{status === "sent" ? <div className="space-y-4 text-center"><div className="rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              ✓ If an account exists for <strong>{value}</strong>, a reset link is on its way.
              <br /><span className="text-xs opacity-80">(This is a demo — no real email or SMS was sent.)</span></div><Link
    to="/login"
    className="flex w-full items-center justify-center gap-2 rounded-full bg-insta-gradient px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
  >
              Back to sign in
            </Link></div> : <form onSubmit={handleSubmit} className="space-y-4" noValidate><div><label htmlFor="reset-value" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email or phone number
              </label><input
    id="reset-value"
    type="text"
    autoComplete="email"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    onBlur={() => setTouched(true)}
    placeholder="you@example.com"
    autoFocus
    className={`w-full rounded-full border px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-800 dark:text-white ${inputError ? "border-rose-400" : "border-slate-300 dark:border-slate-700"}`}
  />{inputError && <p className="mt-1 text-xs text-rose-500">{inputError}</p>}</div>{status === "error" && <p className="text-sm text-rose-500">Something went wrong. Please try again.</p>}<button
    type="submit"
    disabled={status === "loading"}
    className="flex w-full items-center justify-center gap-2 rounded-full bg-insta-gradient px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
  >{status === "loading" && <Spinner size={16} className="text-white" />}{status === "loading" ? "Sending\u2026" : "Send reset link"}</button><p className="text-center text-sm text-slate-500 dark:text-slate-400"><Link to="/login" className="font-medium text-brand-500 hover:underline">
                ← Back to sign in
              </Link></p></form>}</div></div>;
}
export {
  ForgotPasswordForm
};
