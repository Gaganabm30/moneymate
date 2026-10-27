import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiX,
  FiCalendar,
  FiCreditCard,
} from "react-icons/fi";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "bank-transfer", label: "Bank Transfer" },
  { id: "credit-card", label: "Credit Card" },
  { id: "debit-card", label: "Debit Card" },
  { id: "cash", label: "Cash" },
  { id: "other", label: "Other" },
];

export default function MarkPaidModal({
  isOpen,
  onClose,
  onConfirm,
  bill = null,
  isSubmitting = false,
}) {
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("upi");

  useEffect(() => {
    if (isOpen) {
      setPaidDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod(bill?.paymentMethod || "upi");
    }
  }, [isOpen, bill]);

  if (!isOpen || !bill) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      paidDate,
      paymentMethod,
    });
  };

  return (
    <AnimatePresence>
      <div className="tx-modal-overlay" onClick={onClose}>
        <motion.div
          className="tx-modal-card mark-paid-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2 }}
        >
          <div className="tx-modal-header">
            <div className="tx-modal-header-text">
              <span className="modal-badge-pill" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)" }}>
                <FiCheckCircle /> BILL PAYMENT
              </span>
              <h3>Mark Bill as Paid</h3>
              <p>Record this bill payment into your completed transactions.</p>
            </div>
            <button
              type="button"
              className="tx-modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="tx-modal-body">
            <div className="mark-paid-summary-box">
              <div className="summary-left">
                <strong>{bill.title}</strong>
                <span>
                  {bill.category} • Due{" "}
                  {new Date(bill.nextDueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="summary-right">
                <span className="summary-amount">
                  ₹{Number(bill.amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="tx-form-grid" style={{ marginTop: "16px" }}>
              <div className="tx-form-group">
                <label htmlFor="mark-paid-date">
                  Payment Date <span className="req">*</span>
                </label>
                <div className="tx-input-container">
                  <FiCalendar className="tx-input-icon" />
                  <input
                    id="mark-paid-date"
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="tx-input"
                    required
                  />
                </div>
              </div>

              <div className="tx-form-group">
                <label htmlFor="mark-paid-method">
                  Payment Method
                </label>
                <div className="tx-input-container">
                  <FiCreditCard className="tx-input-icon" />
                  <select
                    id="mark-paid-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="tx-input tx-select"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <p className="mark-paid-tip">
              This will create a recorded expense transaction of{" "}
              <strong>₹{Number(bill.amount).toLocaleString("en-IN")}</strong>{" "}
              and advance the schedule to its next due date automatically.
            </p>

            <div className="tx-modal-actions">
              <button
                type="button"
                className="tx-btn-cancel tx-modal-cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tx-btn-submit tx-modal-submit-btn"
                style={{ background: "#10b981" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Recording..." : "Confirm Payment"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
