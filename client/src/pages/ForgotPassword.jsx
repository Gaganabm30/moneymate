import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowRight, FiArrowLeft, FiKey } from "react-icons/fi";
import AuthIllustration from "../components/auth/AuthIllustration";

import "../styles/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <AuthIllustration />
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <div className="reset-icon-badge">
              <FiKey />
            </div>
            <h1>Forgot Password?</h1>
            <p>
              {submitted
                ? "Check your inbox! We've sent password reset instructions to your email."
                : "No worries! Enter your registered email address to receive a password reset link."}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-field">
                <label className="form-label" htmlFor="forgot-email">Email Address</label>
                <div className="input-wrapper">
                  <FiMail className="field-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Send Reset Link</span>
                <FiArrowRight className="btn-icon" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="auth-submit-btn secondary"
              onClick={() => setSubmitted(false)}
            >
              <span>Resend Email</span>
            </button>
          )}

          <div className="auth-footer-link">
            <Link to="/login" className="back-link">
              <FiArrowLeft className="btn-icon" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}