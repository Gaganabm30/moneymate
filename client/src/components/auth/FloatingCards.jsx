import { motion } from "framer-motion";
import { FiTrendingUp, FiShield } from "react-icons/fi";

export default function FloatingCards() {
  return (
    <div className="hero-preview-container">
      {/* Main Glass Dashboard Preview Card */}
      <motion.div
        className="preview-glass-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="preview-header">
          <div className="preview-user">
            <div className="user-avatar-mini">
              <FiShield />
            </div>
            <div>
              <span className="preview-label">Monthly Overview</span>
              <h4 className="preview-amount">₹4,85,200</h4>
            </div>
          </div>
          <span className="growth-pill">
            <FiTrendingUp /> +14.8%
          </span>
        </div>

        {/* Budget Progress Bar */}
        <div className="preview-budget-section">
          <div className="budget-info">
            <span>Budget Spent</span>
            <strong>₹48,500 / ₹65,000</strong>
          </div>
          <div className="budget-bar-track">
            <div className="budget-bar-fill" style={{ width: "75%" }} />
          </div>
        </div>

        {/* Live AI Recommendation Banner */}
        <div className="preview-ai-banner">
          <div className="ai-banner-icon">🤖</div>
          <div className="ai-banner-text">
            <strong>AI Optimization</strong>
            <p>Saved ₹3,400 on recurring subscriptions this month!</p>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="preview-tx-list">
          <div className="tx-item">
            <div className="tx-icon grocery">🛒</div>
            <div className="tx-details">
              <span className="tx-title">Supermarket & Grocery</span>
              <span className="tx-date">Today, 2:45 PM</span>
            </div>
            <span className="tx-amount negative">-₹2,450</span>
          </div>

          <div className="tx-item">
            <div className="tx-icon salary">💼</div>
            <div className="tx-details">
              <span className="tx-title">Salary Credit</span>
              <span className="tx-date">Yesterday</span>
            </div>
            <span className="tx-amount positive">+₹85,000</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Pill 1 - Income */}
      <motion.div
        className="floating-pill pill-income"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="pill-icon income">💰</div>
        <div>
          <span className="pill-title">Monthly Income</span>
          <span className="pill-value">₹85,000</span>
        </div>
      </motion.div>

      {/* Floating Pill 2 - Savings */}
      <motion.div
        className="floating-pill pill-savings"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="pill-icon savings">📈</div>
        <div>
          <span className="pill-title">Savings Rate</span>
          <span className="pill-value">+24% / Mo</span>
        </div>
      </motion.div>

      {/* Floating Pill 3 - AI Score */}
      <motion.div
        className="floating-pill pill-score"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, delay: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="pill-icon score">⚡</div>
        <div>
          <span className="pill-title">AI Financial Score</span>
          <span className="pill-value score-text">94 / 100</span>
        </div>
      </motion.div>
    </div>
  );
}