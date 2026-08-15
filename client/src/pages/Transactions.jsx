import {
  useEffect,
  useState,
} from "react";

import Layout from "../components/common/Layout";

import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
} from "../services/transactionService";

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Rent",
  "Bills",
  "Entertainment",
  "Education",
  "Health",
  "Salary",
  "Freelance",
  "Other",
];

const initialForm = {
  type: "expense",
  amount: "",
  category: "Food",
  description: "",
  paymentMethod: "upi",
  date: new Date().toISOString().split("T")[0],
};

function Transactions() {
  const [transactions, setTransactions] =
    useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      const list = Array.isArray(data) ? data : (data?.transactions || []);
      setTransactions(list);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setTransactions([]);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const startEdit = (transaction) => {
    setEditingId(transaction._id);
    setForm({
      type: transaction.type || "expense",
      amount: transaction.amount || "",
      category: transaction.category || "Food",
      description: transaction.description || "",
      paymentMethod: (transaction.paymentMethod || "upi").toLowerCase(),
      date: transaction.date ? new Date(transaction.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod.toLowerCase(),
    };

    if (editingId) {
      await updateTransaction(editingId, payload);
      setEditingId(null);
    } else {
      await createTransaction(payload);
    }

    setForm(initialForm);
    await loadTransactions();
  };

  const remove = async (id) => {
    if (
      !window.confirm(
        "Delete this transaction?"
      )
    ) {
      return;
    }

    await deleteTransaction(id);

    await loadTransactions();
  };

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            TRANSACTIONS
          </p>

          <h1>Track every rupee</h1>
        </div>
      </div>

      <div className="transaction-layout">
        <form
          className="card transaction-form"
          onSubmit={submit}
        >
          <h3>{editingId ? "Edit transaction" : "Add transaction"}</h3>

          <label>Type</label>

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <option value="expense">
              Expense
            </option>

            <option value="income">
              Income
            </option>
          </select>

          <label>Amount (₹)</label>

          <input
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={handleChange}
            required
          />

          <label>Category</label>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {categories.map((category) => (
              <option key={category}>
                {category}
              </option>
            ))}
          </select>

          <label>Description</label>

          <input
            name="description"
            placeholder="Swiggy, Uber, Salary..."
            value={form.description}
            onChange={handleChange}
          />

          <label>Payment method</label>

          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
          >
            <option value="upi">UPI / GPay / PhonePe</option>
            <option value="cash">Cash</option>
            <option value="credit-card">
              Credit Card
            </option>
            <option value="debit-card">
              Debit Card
            </option>
            <option value="bank-transfer">
              Bank Transfer
            </option>
          </select>

          <label>Date</label>

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button type="submit" className="primary-button" style={{ flex: 1 }}>
              {editingId ? "Update transaction" : "Add transaction"}
            </button>
            {editingId && (
              <button
                type="button"
                className="delete-button"
                style={{ background: "#f1f5f9", color: "#475569" }}
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="card">
          <h3>Transaction history</h3>

          <div className="transaction-list">
            {transactions.map(
              (transaction) => (
                <div
                  className="transaction-row"
                  key={transaction._id}
                >
                  <div>
                    <strong>
                      {transaction.description ||
                        transaction.category}
                    </strong>

                    <p className="muted">
                      {transaction.category || "General"} •{" "}
                      {transaction.date
                        ? new Date(transaction.date).toLocaleDateString("en-IN")
                        : "Recent"}
                    </p>
                  </div>

                  <div className="transaction-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <strong
                      className={
                        transaction.type === "income"
                          ? "income"
                          : "expense"
                      }
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      ₹
                      {Number(transaction.amount || 0).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                    <button
                      type="button"
                      className="edit-button"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        fontSize: "0.825rem",
                        fontWeight: 600,
                        color: "#3b82f6",
                        cursor: "pointer",
                      }}
                      onClick={() => startEdit(transaction)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        remove(
                          transaction._id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}

            {!transactions.length && (
              <p className="empty-state">
                No transactions yet. Add your
                first one.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Transactions;