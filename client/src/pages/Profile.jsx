import { useState } from "react";
import Layout from "../components/common/Layout";
import { useAuth } from "../context/AuthContext";
import {
  FiUser,
  FiMail,
  FiShield,
  FiCheck,
  FiCreditCard,
  FiBell,
  FiLock,
  FiCalendar,
  FiSave
} from "react-icons/fi";

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "User");
  const [email, setEmail] = useState(user?.email || "user@moneymate.ai");
  const [currency, setCurrency] = useState("INR (₹)");
  const [monthlyBudget, setMonthlyBudget] = useState("45000");
  const [notifications, setNotifications] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "MM";

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACCOUNT SETTINGS</p>
          <h1>Profile & Preferences</h1>
        </div>
      </div>

      <div className="transaction-layout" style={{ gridTemplateColumns: "320px 1fr" }}>
        {/* Profile Card Summary */}
        <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "800",
              boxShadow: "0 8px 24px rgba(99, 91, 255, 0.35)",
              marginBottom: "16px"
            }}
          >
            {initials}
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>{name}</h3>
          <p className="muted" style={{ margin: "0 0 16px 0" }}>{email}</p>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              background: "var(--success-alpha)",
              color: "var(--success)",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "20px"
            }}
          >
            <FiShield /> Verified Pro Account
          </span>

          <div style={{ width: "100%", borderTop: "1px solid var(--border)", paddingTop: "16px", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 0" }}>
              <span className="muted">Member Since</span>
              <strong>August 2026</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 0" }}>
              <span className="muted">Security</span>
              <strong style={{ color: "var(--success)" }}>Active (2FA)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 0" }}>
              <span className="muted">Plan</span>
              <strong>MoneyMate AI Free</strong>
            </div>
          </div>
        </div>

        {/* Edit Details Form */}
        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>Personal Details</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <div>
                <label>Preferred Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                </select>
              </div>
              <div>
                <label>Monthly Target Budget (₹)</label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                />
              </div>
            </div>

            <h3 style={{ margin: "28px 0 16px 0", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
              Notifications & Security
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", margin: 0 }}>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                />
                <div>
                  <strong>AI Smart Alerts</strong>
                  <p className="muted" style={{ margin: 0, fontSize: "12px" }}>
                    Get notified when you are close to exceeding your budget limits.
                  </p>
                </div>
              </label>
            </div>

            <div style={{ marginTop: "28px", display: "flex", alignItems: "center", gap: "16px" }}>
              <button type="submit" className="primary-button">
                <FiSave /> Save Changes
              </button>

              {savedSuccess && (
                <span style={{ color: "var(--success)", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FiCheck /> Settings updated successfully!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
