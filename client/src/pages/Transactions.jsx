import {
  useEffect,
  useState,
} from "react";

import Layout from "../components/common/Layout";

import {
  createTransaction,
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

  const loadTransactions = async () => {
    const data = await getTransactions();

    setTransactions(data);
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

  const submit = async (event) => {
    event.preventDefault();

    await createTransaction({
      ...form,
      amount: Number(form.amount),
    });

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
          <h3>Add transaction</h3>

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

          <label>Amount</label>

          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
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
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="credit-card">
              Credit Card
            </option>
            <option value="debit-card">
              Debit Card
            </option>
            <option value="bank">
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

          <button className="primary-button">
            Add transaction
          </button>
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
                      {transaction.category} •{" "}
                      {new Date(
                        transaction.date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="transaction-actions">
                    <strong
                      className={
                        transaction.type ===
                        "income"
                          ? "income"
                          : "expense"
                      }
                    >
                      {transaction.type ===
                      "income"
                        ? "+"
                        : "-"}
                      ₹
                      {transaction.amount.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

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