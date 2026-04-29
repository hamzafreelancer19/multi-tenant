import { Navigate } from "react-router-dom";
import { getRole, isAuthenticated } from "../store/authStore";

/**
 * A guard component that restricts access to routes based on user roles.
 */
export default function RoleRoute({ children, allowedRoles }) {
  const role = getRole();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="access-denied">
        <div className="access-denied-card">
          <h1>🚫</h1>
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
          <button onClick={() => window.history.back()} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
}
