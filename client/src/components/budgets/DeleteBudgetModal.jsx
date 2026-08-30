import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function DeleteBudgetModal({
  isOpen,
  onClose,
  onConfirm,
  budgetName = "this budget",
  isDeleting = false,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="budget-modal-overlay" onClick={onClose}>
        <motion.div
          className="budget-modal-card budget-delete-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="budget-delete-header">
            <div className="budget-delete-icon-circle">
              <FiAlertTriangle />
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

          <div className="budget-delete-body">
            <h3>Delete Budget?</h3>
            <p>
              Are you sure you want to delete{" "}
              {budgetName ? <strong>"{budgetName}"</strong> : "this budget"}?
              Your transactions will not be deleted.
            </p>
          </div>

          <div className="budget-delete-actions">
            <button
              type="button"
              className="budget-btn-cancel"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>

            <button
              type="button"
              className="budget-btn-delete"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
