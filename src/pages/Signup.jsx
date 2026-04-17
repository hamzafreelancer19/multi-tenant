import { useState, useEffect } from "react";
import { signupUser, loginUser, getUserProfile } from "../auth/authService";
import { setToken, setRefreshToken, setUser, isAuthenticated } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { School, Eye, EyeOff, Loader } from "lucide-react";

export default function Signup() {
  const [schoolName, setSchoolName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!schoolName || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. Register
      const signupRes = await signupUser({ school_name: schoolName, username, password });
      
      setSuccess(signupRes.data?.message || "Registration successful! Your school is pending approval.");
      setSchoolName("");
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error("Signup error:", err);
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.detail 
        || "Failed to register. School code might be taken or system is down.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-bg">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div className="login-logo-icon" style={{ margin: "0 auto 20px", background: "var(--green)" }}>
            <School size={28} />
          </div>
          <h2 className="login-heading">Registration Pending</h2>
          <p className="login-sub" style={{ color: "var(--text-primary)", fontWeight: 500, marginTop: 16 }}>
            {success}
          </p>
          <p className="login-sub" style={{ fontSize: "0.85rem", marginTop: 12 }}>
            Once the portal administrator approves your school, you will be able to sign in with your credentials.
          </p>
          <button className="login-btn" style={{ width: "100%", marginTop: 24 }} onClick={() => navigate("/")}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

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

        <h2 className="login-heading">Register your School</h2>
        <p className="login-sub">Create your multi-tenant school dashboard in seconds.</p>

        {error && (
          <div className="error-alert">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="login-form">
          <div className="input-group">
            <label htmlFor="signup-school" className="input-label">School Name</label>
            <input
              id="signup-school"
              className="input-field"
              placeholder="e.g. Greenway High"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="signup-username" className="input-label">Admin Username</label>
            <input
              id="signup-username"
              className="input-field"
              placeholder="Choose an admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="signup-password" className="input-label">Admin Password</label>
            <div className="input-wrapper">
              <input
                id="signup-password"
                className="input-field"
                type={showPass ? "text" : "password"}
                placeholder="Create a strong password"
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
            id="signup-submit"
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <><Loader size={18} className="spin" /> Creating Account...</>
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            Sign In
          </Link>
        </div>

        <p className="login-footer">
          © 2026 EduSaaS · All rights reserved
        </p>
      </div>
    </div>
  );
}
