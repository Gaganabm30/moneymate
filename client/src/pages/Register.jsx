import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters"
      );
      return;
    }

    try {
      setLoading(true);

      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create account"
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
            ✦ BUILD YOUR MONEY STORY
          </div>

          <h1>
            Less worrying.
            <br />
            More <span>knowing.</span>
          </h1>

          <p className="auth-caption">
            Every financial goal starts with
            understanding where you are today.
          </p>

          <div className="register-stats">
            <div>
              <strong>01</strong>
              <span>Track</span>
              <p>Know where your money goes.</p>
            </div>

            <div>
              <strong>02</strong>
              <span>Understand</span>
              <p>See the patterns behind spending.</p>
            </div>

            <div>
              <strong>03</strong>
              <span>Grow</span>
              <p>Turn insights into better habits.</p>
            </div>
          </div>
        </div>

        <p className="auth-quote">
          “A budget isn't a restriction. It's a
          plan for what matters.”
        </p>
      </section>

      <section className="money-auth-form-side">
        <form
          className="money-auth-card register-card"
          onSubmit={handleSubmit}
        >
          <span className="form-overline">
            YOUR JOURNEY STARTS HERE
          </span>

          <h2>Meet your money.</h2>

          <p className="form-caption">
            Create your account and start making
            every rupee more intentional.
          </p>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="modern-field">
            <label>What should we call you?</label>

            <input
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

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

          <div className="register-passwords">
            <div className="modern-field">
              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="6+ characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="modern-field">
              <label>Confirm</label>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            className="auth-submit"
            disabled={loading}
          >
            <span>
              {loading
                ? "Creating your space..."
                : "Start my journey"}
            </span>

            {!loading && <span>→</span>}
          </button>

          <p className="existing-account">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>

          <p className="auth-security">
            🔒 Private by design. Your data belongs
            to you.
          </p>
        </form>
      </section>
    </main>
  );
}

export default Register;