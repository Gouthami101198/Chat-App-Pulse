import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SignupForm } from "@/components/auth/SignupForm";
function SignupPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/chat" replace />;
  return <SignupForm />;
}
export {
  SignupPage
};
