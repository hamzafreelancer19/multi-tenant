import { useState, useEffect } from "react";
import { loginUser, getUserProfile } from "../auth/authService";
import { setToken, setRefreshToken, setUser, isAuthenticated } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { School, Eye, EyeOff, Loader } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await loginUser({ username, password });
      setToken(data.access);
      setRefreshToken(data.refresh);
      
      // GET REAL USER INFO FROM BACKEND
      const userProfile = await getUserProfile();
      setUser(userProfile);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login flow error:", err);
      const errorMsg = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.message 
        || "Invalid username or password. Please try again.";
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Animated blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <School size={28} />
          </div>
          <h1 className="login-brand">EduSaaS</h1>
          <p className="login-brand-sub">School Management Platform</p>
        </div>

        <h2 className="login-heading">Sign in to your account</h2>
        <p className="login-sub">Enter your credentials to access the dashboard</p>

        {error && (
          <div className="error-alert">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="login-username" className="input-label">Username</label>
            <input
              id="login-username"
              className="input-field"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password" className="input-label">Password</label>
            <div className="input-wrapper">
              <input
                id="login-password"
                className="input-field"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <><Loader size={18} className="spin" /> Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem" }}>
          Don't have a school account?{" "}
          <Link to="/signup" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            Register your school
          </Link>
        </div>

        <p className="login-footer">
          © 2026 EduSaaS · All rights reserved
        </p>
      </div>
    </div>
  );
}
