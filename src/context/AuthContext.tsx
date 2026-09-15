import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, signUp as apiSignUp } from "@/services/api";
const AuthContext = createContext<any>(null);
const STORAGE_KEY = "chat-app:session";
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);
  const signIn = useCallback(async (name, password) => {
    setStatus("loading");
    setError(null);
    try {
      const res = await apiLogin(name, password);
      setUser(res.user);
      setToken(res.token);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res));
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to sign in.");
      throw e;
    }
  }, []);
  const signUp = useCallback(async (name, email, password) => {
    setStatus("loading");
    setError(null);
    try {
      const res = await apiSignUp(name, email, password);
      setUser(res.user);
      setToken(res.token);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res));
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to create account.");
      throw e;
    }
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);
  const clearError = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);
  const updateProfile = useCallback(
    (patch) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        setToken((t) => {
          if (t) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user: next, token: t }));
          return t;
        });
        return next;
      });
    },
    []
  );
  const value = useMemo(
    () => ({ user, token, status, error, signIn, signUp, signOut, updateProfile, clearError }),
    [user, token, status, error, signIn, signUp, signOut, updateProfile, clearError]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
export {
  AuthProvider,
  useAuth
};
