import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiPlusCircle,
  FiEdit2,
  FiTag,
  FiTarget,
  FiCalendar,
  FiAlertCircle,
} from "react-icons/fi";
const GOAL_CATEGORIES = [
  "Savings",
  "Emergency Fund",
  "Travel",
  "Education",
  "Technology",
  "Health",
  "Home",
  "Investment",
  "Other",
];

export default function AddGoalModal({
  isOpen,
  onClose,
  onSubmit,
  editingGoal = null,
}) {
  const isEditing = Boolean(editingGoal);

  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [category, setCategory] = useState("Savings");
  const [deadline, setDeadline] = useState("2026-12-31");
  const [saved, setSaved] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setTitle(editingGoal.title || "");
        setTarget(String(editingGoal.target || ""));
        setCategory(editingGoal.category || "Savings");
        setDeadline(editingGoal.deadline || "2026-12-31");
        setSaved(String(editingGoal.saved || "0"));
      } else {
        setTitle("");
        setTarget("");
        setCategory("Savings");
        setDeadline("2026-12-31");
        setSaved("0");
      }
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, editingGoal]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Please enter a goal name.");
      return;
    }

    const numericTarget = parseFloat(target);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      setErrorMessage("Please enter a valid target amount greater than ₹0.");
      return;
    }

    if (!deadline) {
      setErrorMessage("Please select a valid target deadline date.");
      return;
    }

    const numericSaved = parseFloat(saved) || 0;
    if (numericSaved < 0) {
      setErrorMessage("Initial savings cannot be negative.");
      return;
    }

    if (numericSaved > numericTarget) {
      setErrorMessage("Initial savings cannot exceed the target amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: trimmedTitle,
        category,
        target: numericTarget,
        saved: numericSaved,
        deadline,
      };

      if (onSubmit) {
        await onSubmit(payload, editingGoal ? (editingGoal._id || editingGoal.id) : null);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save goal:", err);
      setErrorMessage("An error occurred while saving the goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="goal-modal-overlay" onClick={onClose}>
        <motion.div
          className="goal-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="goal-modal-header">
            <div className="goal-modal-title-wrap">
              <div className={`goal-modal-icon ${isEditing ? "edit" : "add"}`}>
                {isEditing ? <FiEdit2 /> : <FiPlusCircle />}
              </div>
              <div>
                <h2>{isEditing ? "Edit Goal" : "Create Goal"}</h2>
                <p>
                  {isEditing
                    ? "Modify and update your savings goal."
                    : "Set a new financial target and timeline."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="goal-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <FiX />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="goal-modal-form" noValidate>
            {errorMessage && (
              <div className="goal-form-error" role="alert">
                <FiAlertCircle />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Goal Name */}
            <div className="goal-form-group">
              <label htmlFor="goal-input-title">
                Goal Name <span className="req">*</span>
              </label>
              <div className="goal-input-container">
                <FiTarget className="goal-input-icon" />
                <input
                  id="goal-input-title"
                  type="text"
                  placeholder="e.g. Emergency Fund, New Car, Vacation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="goal-input"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Category & Target Amount Grid */}
            <div className="goal-form-grid">
              {/* Category */}
              <div className="goal-form-group">
                <label htmlFor="goal-select-category">
                  Category <span className="req">*</span>
                </label>
                <div className="goal-input-container">
                  <FiTag className="goal-input-icon" />
                  <select
                    id="goal-select-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="goal-input goal-select"
                    required
                  >
                    {GOAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Amount */}
              <div className="goal-form-group">
                <label htmlFor="goal-input-target">
                  Target Amount (₹) <span className="req">*</span>
                </label>
                <div className="goal-input-container">
                  <span className="goal-currency-symbol">₹</span>
                  <input
                    id="goal-input-target"
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 100000"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="goal-input goal-input-amount"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Deadline & Initial Savings Grid */}
            <div className="goal-form-grid">
              {/* Deadline */}
              <div className="goal-form-group">
                <label htmlFor="goal-input-deadline">
                  Target Date <span className="req">*</span>
                </label>
                <div className="goal-input-container">
                  <FiCalendar className="goal-input-icon" />
                  <input
                    id="goal-input-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="goal-input"
                    required
                  />
                </div>
              </div>

              {/* Initial Savings */}
              <div className="goal-form-group">
                <label htmlFor="goal-input-saved">
                  Initial Savings (₹) <span className="opt">(Optional)</span>
                </label>
                <div className="goal-input-container">
                  <span className="goal-currency-symbol">₹</span>
                  <input
                    id="goal-input-saved"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={saved}
                    onChange={(e) => setSaved(e.target.value)}
                    className="goal-input goal-input-amount"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="goal-modal-actions">
              <button
                type="button"
                className="goal-btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="goal-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Goal"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
