import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiPlusCircle,
  FiEdit2,
  FiCalendar,
  FiTag,
  FiFileText,
  FiDollarSign,
  FiAlertCircle,
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

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction = null,
  initialType = "expense",
}) {
  const isEditing = Boolean(editingTransaction);

  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or editing target changes
  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        const txType = editingTransaction.type || "expense";
        setType(txType);
        setTitle(editingTransaction.title || editingTransaction.description || "");
        setAmount(String(editingTransaction.amount || ""));
        setCategory(
          editingTransaction.category ||
            (txType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
        );
        if (editingTransaction.date) {
          const dStr = String(editingTransaction.date).slice(0, 10);
          setDate(dStr);
        } else {
          setDate(new Date().toISOString().split("T")[0]);
        }
        setDescription(editingTransaction.description || "");
      } else {
        const defaultType = initialType || "expense";
        setType(defaultType);
        setTitle("");
        setAmount("");
        setCategory(defaultType === "income" ? "Salary" : "Food");
        setDate(new Date().toISOString().split("T")[0]);
        setDescription("");
      }
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, editingTransaction, initialType]);

  // When type changes, ensure valid category is selected
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Please enter a transaction title.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than ₹0.");
      return;
    }

    if (!date) {
      setErrorMessage("Please select a valid date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: trimmedTitle,
        amount: numericAmount,
        type,
        category,
        date,
        description: description.trim(),
      };

      if (onSubmit) {
        await onSubmit(payload, editingTransaction ? editingTransaction.id || editingTransaction._id : null);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save transaction:", err);
      setErrorMessage("An error occurred while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <AnimatePresence>
      <div className="tx-modal-overlay" onClick={onClose}>
        <motion.div
          className="tx-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="tx-modal-header">
            <div className="tx-modal-title-wrap">
              <div className={`tx-modal-icon ${isEditing ? "edit" : "add"}`}>
                {isEditing ? <FiEdit2 /> : <FiPlusCircle />}
              </div>
              <div>
                <h2>{isEditing ? "Edit Transaction" : "Add Transaction"}</h2>
                <p>
                  {isEditing
                    ? "Modify and update your transaction details."
                    : "Fill in the details to record your income or expense."}
                </p>
              </div>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="tx-modal-form" noValidate>
            {/* Error Message */}
            {errorMessage && (
              <div className="tx-form-error" role="alert">
                <FiAlertCircle />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Type Switcher */}
            <div className="tx-type-toggle">
              <button
                type="button"
                className={`tx-type-btn ${type === "expense" ? "active-expense" : ""}`}
                onClick={() => handleTypeChange("expense")}
              >
                Expense
              </button>
              <button
                type="button"
                className={`tx-type-btn ${type === "income" ? "active-income" : ""}`}
                onClick={() => handleTypeChange("income")}
              >
                Income
              </button>
            </div>

            {/* Title */}
            <div className="tx-form-group">
              <label htmlFor="tx-input-title">
                Transaction Title <span className="req">*</span>
              </label>
              <div className="tx-input-container">
                <FiFileText className="tx-input-icon" />
                <input
                  id="tx-input-title"
                  type="text"
                  placeholder="e.g. Salary, Grocery shopping, Swiggy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="tx-input"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Amount & Date in 2 columns */}
            <div className="tx-form-grid">
              {/* Amount */}
              <div className="tx-form-group">
                <label htmlFor="tx-input-amount">
                  Amount (₹) <span className="req">*</span>
                </label>
                <div className="tx-input-container">
                  <span className="tx-currency-symbol">₹</span>
                  <input
                    id="tx-input-amount"
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="tx-input tx-input-amount"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div className="tx-form-group">
                <label htmlFor="tx-input-date">
                  Date <span className="req">*</span>
                </label>
                <div className="tx-input-container">
                  <FiCalendar className="tx-input-icon" />
                  <input
                    id="tx-input-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="tx-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="tx-form-group">
              <label htmlFor="tx-select-category">
                Category <span className="req">*</span>
              </label>
              <div className="tx-input-container">
                <FiTag className="tx-input-icon" />
                <select
                  id="tx-select-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="tx-input tx-select"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="tx-form-group">
              <label htmlFor="tx-input-description">
                Description <span className="opt">(Optional)</span>
              </label>
              <div className="tx-input-container">
                <FiDollarSign className="tx-input-icon" />
                <input
                  id="tx-input-description"
                  type="text"
                  placeholder="e.g. Paid via UPI, monthly grocery bill"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="tx-input"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="tx-modal-actions">
              <button
                type="button"
                className="tx-btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tx-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : type === "income"
                  ? "Add Income"
                  : "Add Expense"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
