import { motion } from "framer-motion";
import { FiShield, FiTrendingUp, FiCheckCircle } from "react-icons/fi";

export default function FinancialHealth() {
  const score = 82;
  const status = "Excellent";

  const metrics = [
    { label: "Savings Rate", value: "72%", sub: "High Savings Rate", status: "good" },
    { label: "Budget Health", value: "Good", sub: "Within limits", status: "good" },
    { label: "Spending Trend", value: "Improving", sub: "-5.4% vs last mo", status: "good" },
    { label: "Emergency Fund", value: "4.2 mos", sub: "Target: 6 mos", status: "warning" },
  ];

  return (
    <motion.div
      className="dashboard-card health-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="card-header-clean">
        <div>
          <span className="section-label">INTELLIGENCE</span>
          <h3>Financial Health Score</h3>
        </div>
        <span className="status-badge-green">
          <FiCheckCircle /> {status}
        </span>
      </div>

      <div className="health-score-body">
        {/* Circle Progress Score */}
        <div className="health-score-circle">
          <div className="circle-inner">
            <span className="score-number">{score}</span>
            <span className="score-denom">/ 100</span>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="health-metrics-grid">
          {metrics.map((m, idx) => (
            <div key={idx} className="health-metric-item">
              <span className="metric-label">{m.label}</span>
              <strong className="metric-value">{m.value}</strong>
              <span className="metric-sub">{m.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
