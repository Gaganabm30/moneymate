import {
  FiEdit2,
  FiTrash2,
  FiShoppingBag,
  FiHome,
  FiTruck,
  FiHeart,
  FiFilm,
  FiBook,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiPieChart,
} from "react-icons/fi";

export const getCategoryIcon = (category = "") => {
  const cat = String(category).toLowerCase();
  if (cat.includes("food") || cat.includes("grocer") || cat.includes("dining")) return <FiShoppingBag />;
  if (cat.includes("hous") || cat.includes("rent")) return <FiHome />;
  if (cat.includes("trans") || cat.includes("fuel") || cat.includes("travel")) return <FiTruck />;
  if (cat.includes("health") || cat.includes("med") || cat.includes("fit")) return <FiHeart />;
  if (cat.includes("entert") || cat.includes("film") || cat.includes("movie") || cat.includes("netflix")) return <FiFilm />;
  if (cat.includes("shop")) return <FiShoppingBag />;
  if (cat.includes("edu") || cat.includes("book")) return <FiBook />;
  if (cat.includes("bill") || cat.includes("util")) return <FiFileText />;
  return <FiPieChart />;
};

/**
 * BudgetCard — uses server-computed spent/percentage values.
 * Falls back to local calculations only for the overall summary display.
 */
export default function BudgetCard({ budget, onEdit, onDelete }) {
  // Backend sends: { ...budget, spent, percentage }
  const spent = budget.spent || 0;
  const pct = budget.percentage || 0;
  const displayPercentage = Math.min(pct, 100);
  const remaining = budget.limit - spent;

  let status = "safe";
  let statusMessage = `₹${remaining.toLocaleString("en-IN")} remaining`;

  if (pct >= 100) {
    status = "exceeded";
    statusMessage = `Over by ₹${Math.abs(remaining).toLocaleString("en-IN")}`;
  } else if (pct >= 80) {
    status = "warning";
    statusMessage = `₹${remaining.toLocaleString("en-IN")} remaining (${pct}%)`;
  }

  const icon = getCategoryIcon(budget.category);
  const color = budget.color || "purple";

  return (
    <div className="budget-card">
      <div className="budget-card-top">
        <div className={`budget-icon ${color}`}>{icon}</div>

        <div className="budget-card-actions-top">
          <button
            type="button"
            className="budget-action-btn edit"
            title="Edit Budget"
            onClick={() => onEdit && onEdit(budget)}
          >
            <FiEdit2 />
          </button>
          <button
            type="button"
            className="budget-action-btn delete"
            title="Delete Budget"
            onClick={() => onDelete && onDelete(budget)}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="budget-card-title">
        <div>
          <h3>{budget.name || budget.category}</h3>
          <span>{budget.category}</span>
        </div>
      </div>

      <div className="budget-amounts">
        <div>
          <span>Spent</span>
          <strong style={{ color: spent > budget.limit ? "#dc2626" : "var(--bg-text)" }}>
            ₹{spent.toLocaleString("en-IN")}
          </strong>
        </div>

        <div>
          <span>Limit</span>
          <strong>₹{(budget.limit || 0).toLocaleString("en-IN")}</strong>
        </div>
      </div>

      <div className="budget-progress">
        <div className="budget-progress-track">
          <div
            className={`budget-progress-fill ${status}`}
            style={{ width: `${displayPercentage}%` }}
          />
        </div>
        <span>{pct}%</span>
      </div>

      <div className={`budget-status ${status}`}>
        {status === "exceeded" || status === "warning" ? (
          <>
            <FiAlertCircle />
            <span>{statusMessage}</span>
          </>
        ) : (
          <>
            <FiCheckCircle />
            <span>{statusMessage}</span>
          </>
        )}
      </div>
    </div>
  );
}
