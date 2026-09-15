import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
function ForgotPasswordPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/chat" replace />;
  return <ForgotPasswordForm />;
}
export {
  ForgotPasswordPage
};
