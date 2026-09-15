import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/common/Common";
function SignupForm() {
  const { signUp, status, error } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const nameError = touched && !name.trim() ? "Name is required." : null;
  const emailError = touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Enter a valid email address." : null;
  const passwordError = touched && password.length < 6 ? "Password must be at least 6 characters." : null;
  const confirmError = touched && confirmPassword !== password ? "Passwords do not match." : null;
  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6 || confirmPassword !== password) {
      return;
    }
    try {
      await signUp(name, email, password);
      navigate("/chat");
    } catch {
    }
  }
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-surface-dark"><div className="w-full max-w-sm"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-insta-gradient text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg></div><h1 className="text-xl font-semibold text-slate-900 dark:text-white">Create your account</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Join Pulse — takes less than a minute</p></div><form onSubmit={handleSubmit} className="space-y-4" noValidate><div><label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full name
            </label><input
    id="signup-name"
    type="text"
    autoComplete="name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    onBlur={() => setTouched(true)}
    placeholder="e.g. Alex Rivera"
    className={`w-full rounded-full border px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-800 dark:text-white ${nameError ? "border-rose-400" : "border-slate-300 dark:border-slate-700"}`}
  />{nameError && <p className="mt-1 text-xs text-rose-500">{nameError}</p>}</div><div><label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label><input
    id="signup-email"
    type="email"
    autoComplete="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    onBlur={() => setTouched(true)}
    placeholder="you@example.com"
    className={`w-full rounded-full border px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-800 dark:text-white ${emailError ? "border-rose-400" : "border-slate-300 dark:border-slate-700"}`}
  />{emailError && <p className="mt-1 text-xs text-rose-500">{emailError}</p>}</div><div><label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label><input
    id="signup-password"
    type="password"
    autoComplete="new-password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    onBlur={() => setTouched(true)}
    placeholder="At least 6 characters"
    className={`w-full rounded-full border px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-800 dark:text-white ${passwordError ? "border-rose-400" : "border-slate-300 dark:border-slate-700"}`}
  />{passwordError && <p className="mt-1 text-xs text-rose-500">{passwordError}</p>}</div><div><label htmlFor="signup-confirm" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm password
            </label><input
    id="signup-confirm"
    type="password"
    autoComplete="new-password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    onBlur={() => setTouched(true)}
    placeholder="Re-enter your password"
    className={`w-full rounded-full border px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-800 dark:text-white ${confirmError ? "border-rose-400" : "border-slate-300 dark:border-slate-700"}`}
  />{confirmError && <p className="mt-1 text-xs text-rose-500">{confirmError}</p>}</div>{error && <p className="text-sm text-rose-500">{error}</p>}<button
    type="submit"
    disabled={status === "loading"}
    className="flex w-full items-center justify-center gap-2 rounded-full bg-insta-gradient px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
  >{status === "loading" && <Spinner size={16} className="text-white" />}{status === "loading" ? "Creating account\u2026" : "Create account"}</button></form><p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}<Link to="/login" className="font-medium text-brand-500 hover:underline">
            Sign in
          </Link></p><p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          Demo auth — no real account is created; this just signs you into the demo workspace.
        </p></div></div>;
}
export {
  SignupForm
};
