import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiPieChart, FiArrowRight } from "react-icons/fi";

const budgets = [
  { id: 1, category: "Food & Dining", spent: 6500, total: 10000, color: "#5B67F1", status: "safe" },
  { id: 2, category: "Shopping", spent: 6800, total: 8000, color: "#F59E0B", status: "warning" },
  { id: 3, category: "Transport", spent: 2100, total: 4000, color: "#16A36A", status: "safe" },
  { id: 4, category: "Bills & Utilities", spent: 7200, total: 7000, color: "#EF4444", status: "exceeded" },
];

export default function BudgetSummary() {
  return (
    <motion.div
      className="dashboard-card budget-summary-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <div className="card-header-clean">
        <div>
          <span className="section-label">MONEY MANAGEMENT</span>
          <h3>Budget Summary</h3>
        </div>
        <Link to="/budgets" className="card-header-link">
          View All <FiArrowRight />
        </Link>
      </div>

      <div className="budget-items-list">
        {budgets.map((b) => {
          const percentage = Math.min(Math.round((b.spent / b.total) * 100), 100);
          return (
            <div key={b.id} className="budget-item-row">
              <div className="budget-item-info">
                <span className="budget-category">{b.category}</span>
                <span className="budget-amounts">
                  <strong>₹{b.spent.toLocaleString("en-IN")}</strong> / ₹{b.total.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="budget-progress-track">
                <div
                  className={`budget-progress-fill ${b.status}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
