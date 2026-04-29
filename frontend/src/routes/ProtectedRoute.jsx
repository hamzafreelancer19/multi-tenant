import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../store/authStore";

/**
 * A guard component that redirects unauthenticated users to the login page.
 */
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
