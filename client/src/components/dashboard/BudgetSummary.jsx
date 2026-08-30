import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { getBudgets } from "../../services/budgetService";

export default function BudgetSummary() {
  const [budgets, setBudgets] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const data = await getBudgets(now.getMonth() + 1, now.getFullYear());
      setBudgets(data);
    } catch (err) {
      console.error("BudgetSummary load error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Backend already returns spent + percentage
  const budgetItems = useMemo(() => {
    return budgets.slice(0, 4).map((b) => {
      const spent = b.spent || 0;
      const pct = b.percentage || 0;
      const displayPercentage = Math.min(pct, 100);
      let status = "safe";
      if (pct >= 100) status = "exceeded";
      else if (pct >= 80) status = "warning";

      return {
        id: b._id || b.id,
        category: b.name || b.category,
        spent,
        total: b.limit || 0,
        percentage: displayPercentage,
        status,
      };
    });
  }, [budgets]);

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
        {budgetItems.length === 0 ? (
          <p style={{ color: "#8c98a9", fontSize: "13px", padding: "12px 0" }}>
            No budgets created yet.
          </p>
        ) : (
          budgetItems.map((b) => (
            <div key={b.id} className="budget-item-row">
              <div className="budget-item-info">
                <span className="budget-category">{b.category}</span>
                <span className="budget-amounts">
                  <strong>₹{b.spent.toLocaleString("en-IN")}</strong> / ₹
                  {b.total.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="budget-progress-track">
                <div
                  className={`budget-progress-fill ${b.status}`}
                  style={{ width: `${b.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
