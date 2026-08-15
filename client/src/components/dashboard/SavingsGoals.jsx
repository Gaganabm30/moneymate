import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiTarget, FiPlus, FiArrowRight } from "react-icons/fi";

const goals = [
  { id: 1, name: "New Laptop", saved: 42000, target: 60000, deadline: "Oct 2026", color: "#5B67F1" },
  { id: 2, name: "Emergency Fund", saved: 75000, target: 100000, deadline: "Dec 2026", color: "#8B5CF6" },
  { id: 3, name: "Vacation Trip", saved: 25000, target: 50000, deadline: "Nov 2026", color: "#16A36A" },
];

export default function SavingsGoals() {
  return (
    <motion.div
      className="dashboard-card savings-goals-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="card-header-clean">
        <div>
          <span className="section-label">PLANNING</span>
          <h3>Savings Goals</h3>
        </div>
        <Link to="/goals" className="card-header-link">
          Create Goal <FiPlus />
        </Link>
      </div>

      <div className="goals-items-list">
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <div key={g.id} className="goal-item-box">
              <div className="goal-item-header">
                <div className="goal-title-group">
                  <div className="goal-icon-badge" style={{ backgroundColor: `${g.color}15`, color: g.color }}>
                    <FiTarget />
                  </div>
                  <div>
                    <h4>{g.name}</h4>
                    <span className="goal-deadline">Deadline: {g.deadline}</span>
                  </div>
                </div>
                <span className="goal-pct">{pct}%</span>
              </div>

              <div className="goal-progress-track">
                <div
                  className="goal-progress-fill"
                  style={{ width: `${pct}%`, backgroundColor: g.color }}
                />
              </div>

              <div className="goal-amounts-footer">
                <span>Saved: <strong>₹{g.saved.toLocaleString("en-IN")}</strong></span>
                <span>Target: ₹{g.target.toLocaleString("en-IN")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
