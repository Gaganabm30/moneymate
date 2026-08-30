import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiTarget, FiPlus } from "react-icons/fi";
import { getGoals } from "../../services/goalService";

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "No deadline";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr).slice(0, 10);
  }
};

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      console.error("SavingsGoals load error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayedGoals = useMemo(() => {
    return goals.slice(0, 3).map((g) => {
      const target = Number(g.target) || 0;
      const saved = Number(g.saved) || 0;
      const percentage = target > 0 ? Math.round((saved / target) * 100) : 0;
      const displayPercentage = Math.min(percentage, 100);
      const isCompleted = saved >= target && target > 0;

      const color =
        (g.category || "").toLowerCase().includes("tech")
          ? "#5B67F1"
          : (g.category || "").toLowerCase().includes("travel")
          ? "#F59E0B"
          : "#8B5CF6";

      return {
        id: g._id || g.id,
        name: g.title,
        saved,
        target,
        deadline: formatDisplayDate(g.deadline),
        pct: percentage,
        displayPct: displayPercentage,
        isCompleted,
        color,
      };
    });
  }, [goals]);

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
        {displayedGoals.length === 0 ? (
          <p style={{ color: "#8c98a9", fontSize: "13px", padding: "12px 0" }}>
            No savings goals created yet.
          </p>
        ) : (
          displayedGoals.map((g) => (
            <div key={g.id} className="goal-item-box">
              <div className="goal-item-header">
                <div className="goal-title-group">
                  <div
                    className="goal-icon-badge"
                    style={{
                      backgroundColor: `${g.color}15`,
                      color: g.color,
                    }}
                  >
                    <FiTarget />
                  </div>
                  <div>
                    <h4>{g.name}</h4>
                    <span className="goal-deadline">Deadline: {g.deadline}</span>
                  </div>
                </div>
                <span className="goal-pct">{g.pct}%</span>
              </div>

              <div className="goal-progress-track">
                <div
                  className="goal-progress-fill"
                  style={{
                    width: `${g.displayPct}%`,
                    backgroundColor: g.isCompleted ? "#10B981" : g.color,
                  }}
                />
              </div>

              <div className="goal-amounts-footer">
                <span>
                  Saved:{" "}
                  <strong>₹{g.saved.toLocaleString("en-IN")}</strong>
                </span>
                <span>Target: ₹{g.target.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
