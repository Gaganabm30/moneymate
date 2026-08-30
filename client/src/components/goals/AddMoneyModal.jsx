import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi";

export default function AddMoneyModal({
  isOpen,
  onClose,
  onSubmit,
  goal = null,
}) {
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  // Inline metrics (no financeData dependency)
  const target = Number(goal.target) || 0;
  const saved = Number(goal.saved) || 0;
  const remaining = Math.max(0, target - saved);
  const percentage = target > 0 ? Math.round((saved / target) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than ₹0.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        // Pass _id (MongoDB) — falls back to id for compatibility
        await onSubmit(goal._id || goal.id, numericAmount);
      }
      onClose();
    } catch (err) {
      console.error("Failed to add money to goal:", err);
      setErrorMessage("An error occurred while adding funds. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = (value) => {
    const currentVal = parseFloat(amount) || 0;
    const newVal = Math.min(remaining, currentVal + value);
    setAmount(String(newVal));
  };

  const handleFillRemaining = () => {
    if (remaining > 0) {
      setAmount(String(remaining));
    }
  };

  return (
    <AnimatePresence>
      <div className="goal-modal-overlay" onClick={onClose}>
        <motion.div
          className="goal-modal-card add-money-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="goal-modal-header">
            <div className="goal-modal-title-wrap">
              <div className="goal-modal-icon add-money-icon">
                <FiDollarSign />
              </div>
              <div>
                <h2>Add Money to Goal</h2>
                <p>Deposit intentional savings toward your goal.</p>
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

          {/* Goal Overview Box */}
          <div className="add-money-goal-box">
            <div className="goal-box-header">
              <h3>{goal.title}</h3>
              <span className="goal-box-category">{goal.category}</span>
            </div>

            <div className="goal-box-metrics">
              <div>
                <span>Current Saved</span>
                <strong>₹{saved.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Target</span>
                <strong>₹{target.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong style={{ color: remaining === 0 ? "#10b981" : "#635bff" }}>
                  ₹{remaining.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="goal-box-progress">
              <div className="goal-progress-track">
                <div
                  className="goal-progress-fill"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span>{percentage}%</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="goal-modal-form" noValidate>
            {errorMessage && (
              <div className="goal-form-error" role="alert">
                <FiAlertCircle />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Amount input */}
            <div className="goal-form-group">
              <label htmlFor="add-money-input">
                Amount to Add (₹) <span className="req">*</span>
              </label>
              <div className="goal-input-container">
                <span className="goal-currency-symbol">₹</span>
                <input
                  id="add-money-input"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="Enter amount (e.g. 5000)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="goal-input goal-input-amount"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Quick Add Chips */}
            {remaining > 0 && (
              <div className="quick-add-chips">
                <button type="button" className="quick-chip" onClick={() => handleQuickAdd(1000)}>
                  +₹1,000
                </button>
                <button type="button" className="quick-chip" onClick={() => handleQuickAdd(5000)}>
                  +₹5,000
                </button>
                <button type="button" className="quick-chip" onClick={() => handleQuickAdd(10000)}>
                  +₹10,000
                </button>
                <button type="button" className="quick-chip highlight" onClick={handleFillRemaining}>
                  Full Remaining (₹{remaining.toLocaleString("en-IN")})
                </button>
              </div>
            )}

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
                {isSubmitting ? "Adding..." : "Add Money"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
