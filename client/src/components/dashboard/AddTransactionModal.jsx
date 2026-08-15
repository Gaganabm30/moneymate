import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlusCircle, FiEdit2, FiCalendar, FiTag, FiCreditCard, FiFileText } from "react-icons/fi";

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  initialType = "expense",
  editingTransaction = null,
}) {
  const isEditing = Boolean(editingTransaction);

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("upi");

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setType(editingTransaction.type || "expense");
        setAmount(String(editingTransaction.amount || ""));
        setCategory(editingTransaction.category || "Food");
        setDescription(editingTransaction.description || "");
        if (editingTransaction.date) {
          const d = new Date(editingTransaction.date);
          setDate(!isNaN(d.getTime()) ? d.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
        } else {
          setDate(new Date().toISOString().split("T")[0]);
        }
        setPaymentMethod((editingTransaction.paymentMethod || "upi").toLowerCase());
      } else {
        setType(initialType || "expense");
        setAmount("");
        setCategory(initialType === "income" ? "Salary" : "Food");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
        setPaymentMethod("upi");
      }
    }
  }, [isOpen, initialType, editingTransaction]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const txData = {
      type,
      amount: Number(amount),
      category: category.trim(),
      description: description.trim() || category,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      paymentMethod: paymentMethod.toLowerCase(),
    };

    if (isEditing && onUpdateTransaction && editingTransaction?._id) {
      onUpdateTransaction(editingTransaction._id, txData);
    } else if (onAddTransaction) {
      onAddTransaction(txData);
    }

    // Reset & close
    setAmount("");
    setDescription("");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div
          className="modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title-group">
              <div className={`modal-icon-badge ${isEditing ? "edit-badge" : ""}`}>
                {isEditing ? <FiEdit2 /> : <FiPlusCircle />}
              </div>
              <div>
                <h2>{isEditing ? "Edit Transaction" : "Add Transaction"}</h2>
                <p>
                  {isEditing
                    ? "Update your transaction details"
                    : "Record a new income or expense item"}
                </p>
              </div>
            </div>

            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <FiX />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Type Switcher */}
            <div className="transaction-type-toggle">
              <button
                type="button"
                className={`type-btn ${type === "expense" ? "active expense" : ""}`}
                onClick={() => setType("expense")}
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-btn ${type === "income" ? "active income" : ""}`}
                onClick={() => setType("income")}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="tx-amount">Amount (₹)</label>
              <div className="modal-input-wrapper">
                <span className="modal-field-currency">₹</span>
                <input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="modal-input"
                  required
                />
              </div>
            </div>

            {/* Category & Date Grid */}
            <div className="modal-grid-2">
              <div className="modal-field">
                <label className="modal-label" htmlFor="tx-category">Category</label>
                <div className="modal-input-wrapper">
                  <FiTag className="modal-field-icon" />
                  <select
                    id="tx-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="modal-input modal-select"
                  >
                    <option value="Food">Food & Dining</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Transport">Transport</option>
                    <option value="Bills">Bills & Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Health">Health & Medical</option>
                    <option value="Education">Education</option>
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Rent">Rent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="tx-date">Date</label>
                <div className="modal-input-wrapper">
                  <FiCalendar className="modal-field-icon" />
                  <input
                    id="tx-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="modal-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="tx-payment">Payment Method</label>
              <div className="modal-input-wrapper">
                <FiCreditCard className="modal-field-icon" />
                <select
                  id="tx-payment"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="modal-input modal-select"
                >
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="debit-card">Debit Card</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="modal-field">
              <label className="modal-label" htmlFor="tx-desc">Description / Merchant</label>
              <div className="modal-input-wrapper">
                <FiFileText className="modal-field-icon" />
                <input
                  id="tx-desc"
                  type="text"
                  placeholder="e.g. Salary, Grocery, Swiggy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="modal-input"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button type="button" className="modal-btn secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="modal-btn primary">
                {isEditing ? "Save Changes" : type === "income" ? "Add Income" : "Add Expense"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
