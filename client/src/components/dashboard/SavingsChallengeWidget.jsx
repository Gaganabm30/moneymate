import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiZap, FiChevronRight, FiPlus, FiAward } from "react-icons/fi";
import { getChallengeWidget } from "../../services/challengeService";

const INR = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

export default function SavingsChallengeWidget() {
  const [widgetData, setWidgetData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadWidget = useCallback(async () => {
    try {
      const data = await getChallengeWidget();
      setWidgetData(data);
    } catch (err) {
      console.error("Challenge widget load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidget();
  }, [loadWidget]);

  if (loading) {
    return (
      <motion.div
        className="dashboard-card challenge-widget-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="challenge-widget-header">
          <h3><FiZap style={{ verticalAlign: "middle", marginRight: 5 }} />Active Challenge</h3>
        </div>
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#8b9ab0", fontSize: "0.85rem" }}>
          Loading...
        </div>
      </motion.div>
    );
  }

  const challenge = widgetData?.activeChallenge;
  const hasActive = widgetData?.hasActive;
  const completedCount = widgetData?.completedCount || 0;

  return (
    <motion.div
      className="dashboard-card challenge-widget-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="challenge-widget-header">
        <h3>
          <FiZap style={{ verticalAlign: "middle", marginRight: 5 }} />
          Savings Challenge
        </h3>
        <Link to="/challenges" style={{ fontSize: "0.78rem", color: "#7c3aed", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
          View All <FiChevronRight />
        </Link>
      </div>

      {!hasActive ? (
        <div className="challenge-widget-empty">
          {completedCount > 0 ? (
            <p>
              🏆 {completedCount} challenge{completedCount !== 1 ? "s" : ""} completed!{" "}
              <Link to="/challenges">Start a new one</Link>
            </p>
          ) : (
            <p>
              No active challenges.{" "}
              <Link to="/challenges">Create your first challenge →</Link>
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="challenge-widget-title">{challenge.title}</div>

          <div className="challenge-widget-progress-track">
            <div
              className="challenge-widget-progress-fill"
              style={{ width: `${Math.min(100, challenge.percentage || 0)}%` }}
            />
          </div>

          <div className="challenge-widget-amounts">
            <span>Saved: <strong>{INR(challenge.currentAmount)}</strong></span>
            <span>
              <strong style={{ color: "#7c3aed" }}>{challenge.percentage || 0}%</strong>
              {" "}of {INR(challenge.targetAmount)}
            </span>
          </div>

          <div className="challenge-widget-footer">
            <div className="challenge-widget-next-milestone">
              {challenge.nextMilestone ? (
                <>
                  <span>{challenge.nextMilestone.badge}</span>
                  <span>Next: {challenge.nextMilestone.name}</span>
                </>
              ) : (
                <>
                  <FiAward style={{ color: "#f59e0b" }} />
                  <span>{challenge.unlockedMilestonesCount}/{challenge.totalMilestonesCount || 4} milestones</span>
                </>
              )}
            </div>
            <Link to="/challenges" className="challenge-widget-link">
              Contribute <FiChevronRight />
            </Link>
          </div>
        </>
      )}
    </motion.div>
  );
}
