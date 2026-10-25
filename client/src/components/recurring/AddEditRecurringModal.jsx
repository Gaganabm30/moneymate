import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiRepeat,
  FiCalendar,
  FiTag,
  FiDollarSign,
  FiAlertCircle,
  FiBell,
  FiCreditCard,
  FiFileText,
} from "react-icons/fi";

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Rental",
  "Gift",
  "Other",
];

const EXPENSE_CATEGORIES = [
  "Bills & Utilities",
  "Housing",
  "Food",
  "Transport",
  "Entertainment",
  "Health",
  "Education",
  "Shopping",
  "Travel",
  "Personal Care",
  "Fitness",
  "Other",
];

const FREQUENCIES = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

const REMINDER_OPTIONS = [
  { value: 0, label: "On due date" },
  { value: 1, label: "1 day before" },
  { value: 2, label: "2 days before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "1 week before" },
];

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "bank-transfer", label: "Bank Transfer" },
  { id: "credit-card", label: "Credit Card" },
  { id: "debit-card", label: "Debit Card" },
  { id: "cash", label: "Cash" },
  { id: "other", label: "Other" },
];

export default function AddEditRecurringModal({
  isOpen,
  onClose,
  onSubmit,
  editingSchedule = null,
  initialType = "expense",
}) {
  const isEditing = Boolean(editingSchedule);

  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Bills & Utilities");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [nextDueDate, setNextDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingSchedule) {
        const scType = editingSchedule.type || "expense";
        setType(scType);
        setTitle(editingSchedule.title || "");
        setAmount(String(editingSchedule.amount || ""));
        setCategory(
          editingSchedule.category ||
            (scType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
        );
        setFrequency(editingSchedule.frequency || "monthly");

        if (editingSchedule.startDate) {
          setStartDate(
            new Date(editingSchedule.startDate).toISOString().split("T")[0]
          );
        } else {
          setStartDate(new Date().toISOString().split("T")[0]);
        }

        if (editingSchedule.nextDueDate) {
          setNextDueDate(
            new Date(editingSchedule.nextDueDate).toISOString().split("T")[0]
          );
        } else {
          setNextDueDate(new Date().toISOString().split("T")[0]);
        }

        if (editingSchedule.endDate) {
          setHasEndDate(true);
          setEndDate(
            new Date(editingSchedule.endDate).toISOString().split("T")[0]
          );
        } else {
          setHasEndDate(false);
          setEndDate("");
        }

        setReminderDaysBefore(
          editingSchedule.reminderDaysBefore !== undefined
            ? editingSchedule.reminderDaysBefore
            : 1
        );
        setPaymentMethod(editingSchedule.paymentMethod || "upi");
        setDescription(editingSchedule.description || "");
      } else {
        const defType = initialType || "expense";
        setType(defType);
        setTitle("");
        setAmount("");
        setCategory(
          defType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
        );
        setFrequency("monthly");
        const todayStr = new Date().toISOString().split("T")[0];
        setStartDate(todayStr);
        setNextDueDate(todayStr);
        setHasEndDate(false);
        setEndDate("");
        setReminderDaysBefore(1);
        setPaymentMethod("upi");
        setDescription("");
      }
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, editingSchedule, initialType]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === "income") {
      if (!INCOME_CATEGORIES.includes(category)) {
        setCategory(INCOME_CATEGORIES[0]);
      }
    } else {
      if (!EXPENSE_CATEGORIES.includes(category)) {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    }
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    // If not editing or next due was matching start date, sync next due
    if (!isEditing) {
      setNextDueDate(val);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Please enter a title for this recurring payment.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than ₹0.");
      return;
    }

    if (!startDate) {
      setErrorMessage("Please select a start date.");
      return;
    }

    if (!nextDueDate) {
      setErrorMessage("Please select the next due date.");
      return;
    }

    if (hasEndDate && !endDate) {
      setErrorMessage("Please select an end date or turn off end date.");
      return;
    }

    if (hasEndDate && new Date(endDate) < new Date(startDate)) {
      setErrorMessage("End date cannot be earlier than start date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: trimmedTitle,
        type,
        amount: numericAmount,
        category,
        frequency,
        startDate,
        nextDueDate,
        endDate: hasEndDate ? endDate : null,
        reminderDaysBefore: Number(reminderDaysBefore) || 0,
        paymentMethod,
        description: description.trim(),
      };

      if (onSubmit) {
        await onSubmit(
          payload,
          editingSchedule ? editingSchedule._id || editingSchedule.id : null
        );
      }
      onClose();
    } catch (err) {
      console.error("Failed to save recurring payment:", err);
      setErrorMessage(
        err.response?.data?.message ||
          "An error occurred while saving. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <AnimatePresence>
      <div className="tx-modal-overlay" onClick={onClose}>
        <motion.div
          className="tx-modal-card recurring-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="tx-modal-header">
            <div className="tx-modal-header-text">
              <span className="modal-badge-pill">
                <FiRepeat /> RECURRING
              </span>
              <h3>
                {isEditing
                  ? "Edit Recurring Payment"
                  : "Add Recurring Payment"}
              </h3>
              <p>
                {isEditing
                  ? "Update your regular schedule and reminder settings."
                  : "Set up regular subscriptions, bills, or repeating income."}
              </p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="tx-modal-body">
            {errorMessage && (
              <div className="tx-modal-alert">
                <FiAlertCircle />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Income / Expense Toggle */}
            <div className="tx-type-toggle">
              <button
                type="button"
                className={`tx-type-btn ${type === "expense" ? "active expense" : ""}`}
                onClick={() => handleTypeChange("expense")}
              >
                Expense / Bill
              </button>
              <button
                type="button"
                className={`tx-type-btn ${type === "income" ? "active income" : ""}`}
                onClick={() => handleTypeChange("income")}
              >
                Recurring Income
              </button>
            </div>

            {/* Title & Amount Grid */}
            <div className="tx-form-row two-col">
              <div className="tx-form-group">
                <label>
                  <FiFileText /> Schedule Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Netflix, Wifi Bill, Apartment Rent"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="tx-form-group">
                <label>
                  <FiDollarSign /> Amount (₹)
                </label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category & Frequency */}
            <div className="tx-form-row two-col">
              <div className="tx-form-group">
                <label>
                  <FiTag /> Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tx-form-group">
                <label>
                  <FiRepeat /> Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates Row: Start Date & Next Due Date */}
            <div className="tx-form-row two-col">
              <div className="tx-form-group">
                <label>
                  <FiCalendar /> Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="tx-form-group">
                <label>
                  <FiCalendar /> Next Due Date
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Optional End Date */}
            <div className="tx-form-group end-date-toggle-group">
              <div className="end-date-header-row">
                <label className="checkbox-toggle-label">
                  <input
                    type="checkbox"
                    checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                  />
                  <span>Has an end date (optional)</span>
                </label>
              </div>
              {hasEndDate && (
                <div style={{ marginTop: "8px" }}>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              )}
            </div>

            {/* Reminder Preference & Payment Method */}
            <div className="tx-form-row two-col">
              <div className="tx-form-group">
                <label>
                  <FiBell /> Reminder Preference
                </label>
                <select
                  value={reminderDaysBefore}
                  onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tx-form-group">
                <label>
                  <FiCreditCard /> Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="tx-form-group">
              <label>Optional Notes / Description</label>
              <textarea
                placeholder="Add subscription ID, billing link, or notes..."
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>

            {/* Actions */}
            <div className="tx-modal-actions">
              <button
                type="button"
                className="tx-modal-cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tx-modal-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Recurring Schedule"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
