import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiPlus, FiMinusCircle, FiPieChart, FiTarget } from "react-icons/fi";

export default function QuickActions({ onOpenModal }) {
  const actions = [
    { label: "Add Expense", icon: <FiMinusCircle />, color: "#EF4444", action: () => onOpenModal && onOpenModal() },
    { label: "Add Income", icon: <FiPlus />, color: "#16A36A", action: () => onOpenModal && onOpenModal() },
    { label: "Create Budget", icon: <FiPieChart />, color: "#5B67F1", link: "/budgets" },
    { label: "Set Goal", icon: <FiTarget />, color: "#8B5CF6", link: "/goals" },
  ];

  return (
    <motion.div
      className="quick-actions-bar"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className="quick-actions-title">Quick Actions:</span>
      <div className="quick-actions-buttons">
        {actions.map((act, idx) => {
          if (act.link) {
            return (
              <Link key={idx} to={act.link} className="quick-action-chip">
                <span className="chip-icon" style={{ color: act.color }}>{act.icon}</span>
                <span>{act.label}</span>
              </Link>
            );
          }
          return (
            <button key={idx} type="button" onClick={act.action} className="quick-action-chip">
              <span className="chip-icon" style={{ color: act.color }}>{act.icon}</span>
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
