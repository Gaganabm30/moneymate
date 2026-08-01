import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      await login(form);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to sign in"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="money-auth">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <section className="money-auth-hero">
        <div className="auth-brand">
          <div className="auth-logo">M</div>

          <div>
            <strong>MoneyMate</strong>
            <span>Personal Finance</span>
          </div>
        </div>

        <div className="auth-hero-content">
          <div className="auth-badge">
            ✦ YOUR MONEY, MADE SIMPLE
          </div>

          <h1>
            Spend smarter.
            <br />
            Save <span>intentionally.</span>
            <br />
            Live freely.
          </h1>

          <p className="auth-caption">
            Your money has a story.
            MoneyMate helps you understand it.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <span>✓</span>
              Track every rupee
            </div>

            <div className="auth-feature">
              <span>✓</span>
              Discover spending patterns
            </div>

            <div className="auth-feature">
              <span>✓</span>
              Build better financial habits
            </div>
          </div>
        </div>

        <div className="finance-preview">
          <div className="preview-card preview-main">
            <div className="preview-top">
              <div>
                <small>MONTHLY BALANCE</small>
                <h3>₹18,450</h3>
              </div>

              <span className="positive-pill">
                +12.4%
              </span>
            </div>

            <div className="mini-chart">
              <span style={{ height: "35%" }} />
              <span style={{ height: "48%" }} />
              <span style={{ height: "43%" }} />
              <span style={{ height: "67%" }} />
              <span style={{ height: "58%" }} />
              <span style={{ height: "82%" }} />
              <span style={{ height: "100%" }} />
            </div>
          </div>

          <div className="floating-score">
            <div className="score-circle">82</div>

            <div>
              <small>FINANCIAL HEALTH</small>
              <strong>Looking good</strong>
            </div>
          </div>
        </div>

        <p className="auth-quote">
          “Small choices today create financial
          freedom tomorrow.”
        </p>
      </section>

      <section className="money-auth-form-side">
        <form
          className="money-auth-card"
          onSubmit={handleSubmit}
        >
          <div className="mobile-auth-brand">
            <div className="auth-logo">M</div>
            <strong>MoneyMate</strong>
          </div>

          <span className="form-overline">
            WELCOME BACK
          </span>

          <h2>Good to see you again.</h2>

          <p className="form-caption">
            Your financial journey continues here.
          </p>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="modern-field">
            <label>Email address</label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="modern-field">
            <div className="field-heading">
              <label>Password</label>
              <span>Keep it secure</span>
            </div>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            <span>
              {loading
                ? "Signing you in..."
                : "Enter MoneyMate"}
            </span>

            {!loading && <span>→</span>}
          </button>

          <div className="auth-divider">
            <span />
            <p>NEW HERE?</p>
            <span />
          </div>

          <p className="create-caption">
            Start understanding where your money
            goes and where it could take you.
          </p>

          <Link
            to="/register"
            className="create-account-button"
          >
            Create free account
          </Link>

          <p className="auth-security">
            🔒 Your financial data stays private
            and secure.
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;