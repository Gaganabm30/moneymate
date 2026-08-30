import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  transactionTitle = "this transaction",
  isDeleting = false,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="tx-modal-overlay" onClick={onClose}>
        <motion.div
          className="tx-modal-card tx-delete-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="tx-delete-header">
            <div className="tx-delete-icon-circle">
              <FiAlertTriangle />
            </div>

            <button
              type="button"
              className="tx-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <FiX />
            </button>
          </div>

          <div className="tx-delete-body">
            <h3>Delete Transaction?</h3>
            <p>
              Are you sure you want to permanently delete{" "}
              {transactionTitle ? <strong>"{transactionTitle}"</strong> : "this transaction"}?
              This action cannot be undone.
            </p>
          </div>

          <div className="tx-delete-actions">
            <button
              type="button"
              className="tx-btn-cancel"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>

            <button
              type="button"
              className="tx-btn-delete"
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
