import {
  FiEdit2,
  FiTrash2,
  FiTarget,
  FiHome,
  FiBriefcase,
  FiBookOpen,
  FiHeart,
  FiGlobe,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
} from "react-icons/fi";

export const getGoalCategoryIcon = (category = "") => {
  const cat = String(category).toLowerCase();
  if (cat.includes("tech") || cat.includes("laptop") || cat.includes("device")) return <FiBriefcase />;
  if (cat.includes("travel") || cat.includes("trip") || cat.includes("vacation")) return <FiGlobe />;
  if (cat.includes("edu") || cat.includes("book") || cat.includes("study")) return <FiBookOpen />;
  if (cat.includes("health") || cat.includes("med") || cat.includes("fit")) return <FiHeart />;
  if (cat.includes("home") || cat.includes("hous") || cat.includes("car")) return <FiHome />;
  if (cat.includes("sav") || cat.includes("fund") || cat.includes("emer")) return <FiTarget />;
  return <FiTrendingUp />;
};

export const getGoalColorClass = (category = "") => {
  const cat = String(category).toLowerCase();
  if (cat.includes("sav")) return "purple";
  if (cat.includes("tech")) return "blue";
  if (cat.includes("travel")) return "orange";
  if (cat.includes("edu")) return "green";
  if (cat.includes("health")) return "pink";
  if (cat.includes("home")) return "blue";
  return "purple";
};

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

/**
 * Compute goal progress metrics inline (no financeData dependency)
 */
const computeGoalMetrics = (goal) => {
  const target = Number(goal.target) || 0;
  const saved = Number(goal.saved) || 0;
  const remaining = Math.max(0, target - saved);
  const rawPercentage = target > 0 ? (saved / target) * 100 : 0;
  const percentage = Math.round(rawPercentage);
  const displayPercentage = Math.min(percentage, 100);
  const isCompleted = saved >= target && target > 0;

  const now = new Date();
  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = deadline ? Math.ceil((deadline - now) / msPerDay) : null;

  let deadlineStatus = "";
  let deadlineLabel = "";
  let statusKey = "on-track";
  let statusTitle = "On Track";

  if (isCompleted) {
    statusKey = "completed";
    statusTitle = "Completed";
  } else if (daysLeft !== null) {
    if (daysLeft < 0) {
      statusKey = "overdue";
      statusTitle = "Overdue";
      deadlineLabel = `${Math.abs(daysLeft)}d overdue`;
    } else if (daysLeft === 0) {
      statusKey = "overdue";
      deadlineLabel = "Due today";
    } else if (daysLeft <= 30) {
      statusKey = "warning";
      statusTitle = "Due Soon";
      deadlineLabel = `${daysLeft}d left`;
    } else {
      deadlineLabel = `${daysLeft}d left`;
    }
  }

  // Recommended monthly savings
  let recommendedText = "";
  if (!isCompleted && daysLeft && daysLeft > 0 && remaining > 0) {
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
    const monthlySavings = Math.ceil(remaining / monthsLeft);
    recommendedText = `Save ₹${monthlySavings.toLocaleString("en-IN")}/mo to reach your goal`;
  }

  return {
    target,
    saved,
    remaining,
    percentage,
    displayPercentage,
    isCompleted,
    deadlineStatus,
    deadlineLabel,
    statusKey,
    statusTitle,
    recommendedText,
  };
};

export default function GoalCard({ goal, onEdit, onDelete, onAddMoney }) {
  const {
    target,
    saved,
    remaining,
    percentage,
    displayPercentage,
    isCompleted,
    deadlineLabel,
    statusKey,
    statusTitle,
    recommendedText,
  } = computeGoalMetrics(goal);

  const icon = getGoalCategoryIcon(goal.category);
  const colorClass = getGoalColorClass(goal.category);

  return (
    <div className={`goal-card ${isCompleted ? "is-completed" : ""}`}>
      {/* Top Header */}
      <div className="goal-card-top">
        <div className={`goal-icon ${colorClass}`}>{icon}</div>

        <div className="goal-card-actions-top">
          <button
            type="button"
            className="goal-action-btn edit"
            title="Edit Goal"
            onClick={() => onEdit && onEdit(goal)}
          >
            <FiEdit2 />
          </button>
          <button
            type="button"
            className="goal-action-btn delete"
            title="Delete Goal"
            onClick={() => onDelete && onDelete(goal)}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {/* Title & Category */}
      <div className="goal-title">
        <h3>{goal.title}</h3>
        <span>{goal.category}</span>
      </div>

      {/* Money Stats */}
      <div className="goal-money">
        <div>
          <span>Saved</span>
          <strong>₹{saved.toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <span>Target</span>
          <strong>₹{target.toLocaleString("en-IN")}</strong>
        </div>
      </div>

      {/* Progress Track */}
      <div className="goal-progress-row">
        <div className="goal-progress-track">
          <div
            className={`goal-progress-fill ${statusKey}`}
            style={{ width: `${displayPercentage}%` }}
          />
        </div>
        <strong className={`goal-progress-num ${isCompleted ? "completed" : ""}`}>
          {percentage}%
        </strong>
      </div>

      {/* Deadline Info */}
      <div className="goal-deadline">
        <div className="goal-deadline-left">
          <FiCalendar />
          <span>{formatDisplayDate(goal.deadline)}</span>
        </div>
        <div className={`goal-deadline-tag ${statusKey}`}>
          <FiClock />
          <span>{deadlineLabel || "On track"}</span>
        </div>
      </div>

      {/* Smart Monthly Savings Recommendation */}
      {recommendedText && !isCompleted && (
        <div className="goal-recommendation">
          <FiTrendingUp />
          <span>{recommendedText}</span>
        </div>
      )}

      {/* Status Pill */}
      <div className={`goal-status ${statusKey}`}>
        {isCompleted ? (
          <>
            <FiCheckCircle />
            <span>Goal Completed</span>
          </>
        ) : statusKey === "overdue" ? (
          <>
            <FiAlertCircle />
            <span>Overdue (₹{remaining.toLocaleString("en-IN")} needed)</span>
          </>
        ) : (
          <>
            <FiCheckCircle />
            <span>
              {statusTitle} • ₹{remaining.toLocaleString("en-IN")} remaining
            </span>
          </>
        )}
      </div>

      {/* Add Money Action */}
      <div className="goal-card-footer">
        <button
          type="button"
          className={`goal-add-money-btn ${isCompleted ? "completed" : ""}`}
          onClick={() => onAddMoney && onAddMoney(goal)}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <>
              <FiCheckCircle /> Completed
            </>
          ) : (
            <>
              <FiDollarSign /> Add Money
            </>
          )}
        </button>
      </div>
    </div>
  );
}
