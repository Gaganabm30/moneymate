import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiPlusCircle,
  FiEdit2,
  FiTag,
  FiPieChart,
  FiAlertCircle,
} from "react-icons/fi";
const EXPENSE_CATEGORIES = [
  "Food",
  "Housing",
  "Transport",
  "Entertainment",
  "Health",
  "Education",
  "Shopping",
  "Bills & Utilities",
  "Travel",
  "Personal Care",
  "Fitness",
  "Other",
];

export default function AddBudgetModal({
  isOpen,
  onClose,
  onSubmit,
  editingBudget = null,
}) {
  const isEditing = Boolean(editingBudget);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food");
  const [limit, setLimit] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingBudget) {
        setName(editingBudget.name || "");
        setCategory(editingBudget.category || "Food");
        setLimit(String(editingBudget.limit || ""));
      } else {
        setName("");
        setCategory("Food");
        setLimit("");
      }
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, editingBudget]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter a budget name.");
      return;
    }

    const numericLimit = parseFloat(limit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      setErrorMessage("Please enter a valid monthly limit greater than ₹0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: trimmedName,
        category,
        limit: numericLimit,
      };

      if (onSubmit) {
        await onSubmit(payload, editingBudget ? (editingBudget._id || editingBudget.id) : null);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save budget:", err);
      setErrorMessage("An error occurred while saving the budget. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="budget-modal-overlay" onClick={onClose}>
        <motion.div
          className="budget-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="budget-modal-header">
            <div className="budget-modal-title-wrap">
              <div className={`budget-modal-icon ${isEditing ? "edit" : "add"}`}>
                {isEditing ? <FiEdit2 /> : <FiPlusCircle />}
              </div>
              <div>
                <h2>{isEditing ? "Edit Budget" : "Create Budget"}</h2>
                <p>
                  {isEditing
                    ? "Modify your category spending limit."
                    : "Set a spending limit for a specific category."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="budget-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <FiX />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="budget-modal-form" noValidate>
            {errorMessage && (
              <div className="budget-form-error" role="alert">
                <FiAlertCircle />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Budget Name */}
            <div className="budget-form-group">
              <label htmlFor="budget-input-name">
                Budget Name <span className="req">*</span>
              </label>
              <div className="budget-input-container">
                <FiPieChart className="budget-input-icon" />
                <input
                  id="budget-input-name"
                  type="text"
                  placeholder="e.g. Food & Dining, Monthly Groceries"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="budget-input"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="budget-form-group">
              <label htmlFor="budget-select-category">
                Category <span className="req">*</span>
              </label>
              <div className="budget-input-container">
                <FiTag className="budget-input-icon" />
                <select
                  id="budget-select-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (!name || EXPENSE_CATEGORIES.some((c) => name.startsWith(c))) {
                      setName(`${e.target.value} Budget`);
                    }
                  }}
                  className="budget-input budget-select"
                  required
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Limit */}
            <div className="budget-form-group">
              <label htmlFor="budget-input-limit">
                Monthly Spending Limit (₹) <span className="req">*</span>
              </label>
              <div className="budget-input-container">
                <span className="budget-currency-symbol">₹</span>
                <input
                  id="budget-input-limit"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g. 8000"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="budget-input budget-input-amount"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="budget-modal-actions">
              <button
                type="button"
                className="budget-btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="budget-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Budget"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
