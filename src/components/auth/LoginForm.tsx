import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/common/Common";
function LoginForm() {
  const { signIn, status, error } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const nameError = touched && !name.trim() ? "Username is required." : null;
  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!name.trim()) return;
    try {
      await signIn(name, password);
    } catch {
    }
  }
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-surface-dark"><div className="w-full max-w-sm"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-insta-gradient text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg></div><h1 className="text-xl font-semibold text-slate-900 dark:text-white">Sign in to Pulse</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real-time messaging, demo workspace</p></div><form onSubmit={handleSubmit} className="space-y-4" noValidate><div><label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Username
            </label><input
    id="name"
    type="text"
    autoComplete="username"
    value={name}
    onChange={(e) => setName(e.target.value)}
    onBlur={() => setTouched(true)}
    placeholder="e.g. Alex Rivera"
    className={`w-full rounded-full border px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-slate-800 dark:text-white ${nameError ? "border-rose-400" : "border-slate-300 dark:border-slate-700"}`}
  />{nameError && <p className="mt-1 text-xs text-rose-500">{nameError}</p>}</div><div><div className="mb-1 flex items-center justify-between"><label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label><Link to="/forgot-password" className="text-xs font-medium text-brand-500 hover:underline">
                Forgot password?
              </Link></div><input
    id="password"
    type="password"
    autoComplete="current-password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Anything works in this demo"
    className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
  /></div>{error && <p className="text-sm text-rose-500">{error}</p>}<button
    type="submit"
    disabled={status === "loading"}
    className="flex w-full items-center justify-center gap-2 rounded-full bg-insta-gradient px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
  >{status === "loading" && <Spinner size={16} className="text-white" />}{status === "loading" ? "Signing in\u2026" : "Sign in"}</button></form><p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}<Link to="/signup" className="font-medium text-brand-500 hover:underline">
            Sign up
          </Link></p><p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          Demo auth — any username/password combination signs you in.
        </p></div></div>;
}
export {
  LoginForm
};
