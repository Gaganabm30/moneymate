import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function DeleteGoalModal({
  isOpen,
  onClose,
  onConfirm,
  goalTitle = "this goal",
  isDeleting = false,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="goal-modal-overlay" onClick={onClose}>
        <motion.div
          className="goal-modal-card goal-delete-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="goal-delete-header">
            <div className="goal-delete-icon-circle">
              <FiAlertTriangle />
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

          <div className="goal-delete-body">
            <h3>Delete Goal?</h3>
            <p>
              Are you sure you want to delete this financial goal
              {goalTitle ? (
                <>
                  {" "}
                  <strong>"{goalTitle}"</strong>?
                </>
              ) : (
                "?"
              )}{" "}
              Your transactions and budget history will not be affected.
            </p>
          </div>

          <div className="goal-delete-actions">
            <button
              type="button"
              className="goal-btn-cancel"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>

            <button
              type="button"
              className="goal-btn-delete"
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
