import { createContext, useContext, useEffect, useMemo, useState } from "react";
const ThemeContext = createContext<any>(null);
const STORAGE_KEY = "chat-app:theme";
function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);
  const value = useMemo(
    () => ({ theme, toggleTheme: () => setTheme((t) => t === "dark" ? "light" : "dark") }),
    [theme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
export {
  ThemeProvider,
  useTheme
};
