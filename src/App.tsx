import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { StoriesProvider } from "@/context/StoriesContext";
import { CommunitiesProvider } from "@/context/CommunitiesContext";
import { ChatProvider } from "@/context/ChatContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ChatPage } from "@/pages/ChatPage";
import { SettingsPage } from "@/pages/SettingsPage";
function App() {
  return <ThemeProvider><AuthProvider><SettingsProvider><StoriesProvider><CommunitiesProvider><BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route path="/signup" element={<SignupPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} />{
    /* ChatProvider wraps both /chat and /settings as a shared layout
       route so the socket connection, message state, and unread
       counts persist while navigating between them — remounting it
       per-route would drop any messages only held in memory this
       session and reconnect the socket needlessly. */
  }<Route
    element={<ProtectedRoute><ChatProviderScope><Outlet /></ChatProviderScope></ProtectedRoute>}
  ><Route path="/chat/:chatId" element={<ChatPage />} /><Route path="/chat" element={<ChatPage />} /><Route path="/settings" element={<SettingsPage />} /></Route><Route path="/" element={<Navigate to="/chat" replace />} /><Route path="*" element={<Navigate to="/chat" replace />} /></Routes></BrowserRouter></CommunitiesProvider></StoriesProvider></SettingsProvider></AuthProvider></ThemeProvider>;
}
function ChatProviderScope({ children }) {
  return <ChatProvider>{children}</ChatProvider>;
}
export {
  App as default
};
