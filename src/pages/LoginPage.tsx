import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();
  if (user) {
    const fromPath = location.state?.from?.pathname;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const isDeepChatLink = fromPath ? /^\/chat\/.+/.test(fromPath) : false;
    const target = isMobile && isDeepChatLink ? "/chat" : fromPath ?? "/chat";
    return <Navigate to={target} replace />;
  }
  return <LoginForm />;
}
export {
  LoginPage
};
