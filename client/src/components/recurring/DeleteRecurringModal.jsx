import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";

export default function DeleteRecurringModal({
  isOpen,
  onClose,
  onConfirm,
  scheduleTitle = "this recurring schedule",
  isDeleting = false,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="tx-modal-overlay" onClick={onClose}>
        <motion.div
          className="tx-modal-card delete-confirm-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2 }}
        >
          <div className="delete-modal-content">
            <div className="delete-icon-wrapper">
              <FiAlertTriangle />
            </div>

            <h3>Delete Recurring Schedule?</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{scheduleTitle}&rdquo;</strong>?
            </p>

            <div className="delete-info-note">
              <strong>Notice:</strong> Deleting this schedule will stop future
              automatic payments and reminders.{" "}
              <span style={{ color: "#059669", fontWeight: 600 }}>
                Historical transactions already recorded will be preserved.
              </span>
            </div>

            <div className="tx-modal-actions" style={{ marginTop: "24px" }}>
              <button
                type="button"
                className="tx-btn-cancel tx-modal-cancel-btn"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tx-btn-submit delete-btn tx-modal-submit-btn"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                <FiTrash2 /> {isDeleting ? "Deleting..." : "Delete Schedule"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
