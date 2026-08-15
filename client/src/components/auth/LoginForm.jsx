import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMail, FiArrowRight, FiAlertCircle } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";
import SocialLogin from "./SocialLogin";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1>Welcome Back 👋</h1>
        <p>Login to your account to continue managing your finances.</p>
      </div>

      {error && (
        <div className="auth-alert alert-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-field">
          <label className="form-label" htmlFor="login-email">Email Address</label>
          <div className="input-wrapper">
            <FiMail className="field-icon" />
            <input
              id="login-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="login-password">Password</label>
          <PasswordInput
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="login-options">
          <label className="remember-checkbox">
            <input type="checkbox" defaultChecked />
            <span>Remember me</span>
          </label>

          <Link to="/forgot-password" className="forgot-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? (
            <div className="spinner-sm" />
          ) : (
            <>
              <span>Sign In</span>
              <FiArrowRight className="btn-icon" />
            </>
          )}
        </button>
      </form>

      <SocialLogin />

      <div className="auth-footer-link">
        <span>Don't have an account?</span>
        <Link to="/register" className="accent-link">Get Started</Link>
      </div>
    </div>
  );
}