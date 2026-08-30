import { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/transactions.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import AddTransactionModal from "../components/transactions/AddTransactionModal";
import DeleteConfirmModal from "../components/transactions/DeleteConfirmModal";

import { useAuth } from "../context/AuthContext";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionService";

import {
  FiPlus,
  FiSearch,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiShoppingBag,
  FiCoffee,
  FiHome,
  FiTruck,
  FiFilm,
  FiHeart,
  FiBook,
  FiFileText,
  FiBriefcase,
  FiDollarSign,
  FiTrendingUp,
  FiLayers,
  FiLoader,
} from "react-icons/fi";

/**
 * Return appropriate category icon
 */
const getCategoryIcon = (category = "", type = "expense") => {
  const cat = (category || "").toLowerCase();

  if (type === "income") {
    if (cat.includes("salary")) return <FiBriefcase />;
    if (cat.includes("freelance") || cat.includes("business")) return <FiTrendingUp />;
    if (cat.includes("invest")) return <FiDollarSign />;
    return <FiArrowDownLeft />;
  }

  if (cat.includes("food") || cat.includes("grocer") || cat.includes("dining")) return <FiCoffee />;
  if (cat.includes("hous") || cat.includes("rent")) return <FiHome />;
  if (cat.includes("trans") || cat.includes("fuel") || cat.includes("travel")) return <FiTruck />;
  if (cat.includes("shop")) return <FiShoppingBag />;
  if (cat.includes("entert") || cat.includes("film") || cat.includes("movie") || cat.includes("netflix")) return <FiFilm />;
  if (cat.includes("health") || cat.includes("med")) return <FiHeart />;
  if (cat.includes("edu") || cat.includes("book") || cat.includes("course")) return <FiBook />;
  if (cat.includes("bill") || cat.includes("util")) return <FiFileText />;
  return <FiArrowUpRight />;
};

const formatINR = (amount) =>
  `₹${Math.abs(Number(amount) || 0).toLocaleString("en-IN")}`;

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr).slice(0, 10);
  }
};

export default function Transactions() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load transactions from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate totals for summary cards
  const totals = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const expense = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // Search & Filter
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return transactions.filter((tx) => {
      const title = (tx.title || tx.description || "").toLowerCase();
      const category = (tx.category || "").toLowerCase();
      const description = (tx.description || "").toLowerCase();

      const matchesSearch =
        !q ||
        title.includes(q) ||
        category.includes(q) ||
        description.includes(q);

      const matchesFilter =
        filter === "all" ||
        (filter === "income" && tx.type === "income") ||
        (filter === "expense" && tx.type === "expense");

      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleModalSubmit = async (formData, idToUpdate) => {
    try {
      if (idToUpdate) {
        await updateTransaction(idToUpdate, formData);
      } else {
        await createTransaction(formData);
      }
      await loadData();
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }
  };

  const handleOpenDeleteModal = (tx) => {
    setDeletingTransaction(tx);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deletingTransaction._id || deletingTransaction.id);
      await loadData();
      setDeletingTransaction(null);
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="transactions-page">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN CONTENT */}
      <main className="transactions-main">
        <Topbar
          searchQuery={search}
          onSearchChange={setSearch}
          onToggleMobileSidebar={() =>
            setIsMobileSidebarOpen(!isMobileSidebarOpen)
          }
          user={user}
        />

        <section className="transactions-content">
          {/* HEADER */}
          <div className="transactions-header">
            <div>
              <p className="transactions-eyebrow">MONEY MANAGEMENT</p>
              <h1>Transactions</h1>
              <p>Track, manage, and categorize your income and expenses in one place.</p>
            </div>

            <button
              type="button"
              className="add-transaction-btn"
              onClick={handleOpenAddModal}
            >
              <FiPlus />
              Add Transaction
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="transaction-summary">
            <div className="transaction-summary-card">
              <span>Total Income</span>
              <strong className="income-text">{formatINR(totals.income)}</strong>
              <small>All time recorded income</small>
            </div>

            <div className="transaction-summary-card">
              <span>Total Expenses</span>
              <strong className="expense-text">{formatINR(totals.expense)}</strong>
              <small>All time recorded expenses</small>
            </div>

            <div className="transaction-summary-card">
              <span>Net Balance</span>
              <strong
                style={{
                  color:
                    totals.balance >= 0
                      ? "var(--tx-text)"
                      : "var(--tx-danger-text)",
                }}
              >
                {formatINR(totals.balance)}
              </strong>
              <small>Available net balance</small>
            </div>
          </div>

          {/* TRANSACTIONS CARD */}
          <div className="transactions-card">
            {/* TOOLBAR */}
            <div className="transactions-toolbar">
              <div className="transaction-search">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search by title, category, or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="transaction-filters">
                <button
                  type="button"
                  className={filter === "all" ? "active" : ""}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>

                <button
                  type="button"
                  className={filter === "income" ? "active" : ""}
                  onClick={() => setFilter("income")}
                >
                  Income
                </button>

                <button
                  type="button"
                  className={filter === "expense" ? "active" : ""}
                  onClick={() => setFilter("expense")}
                >
                  Expenses
                </button>
              </div>
            </div>

            {/* TABLE HEADER */}
            <div className="transactions-table-header">
              <span>Transaction</span>
              <span>Category</span>
              <span>Date</span>
              <span>Amount</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {/* TRANSACTIONS LIST */}
            <div className="transactions-list">
              {loading ? (
                <div className="empty-transactions">
                  <div className="empty-icon" style={{ background: "#f1f5f9", color: "#635bff" }}>
                    <FiLoader style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                  <h3>Loading transactions...</h3>
                </div>
              ) : error ? (
                <div className="empty-transactions">
                  <div className="empty-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
                    <FiLayers />
                  </div>
                  <h3>Something went wrong</h3>
                  <p>{error}</p>
                  <button
                    type="button"
                    className="empty-action-btn"
                    onClick={loadData}
                  >
                    Try Again
                  </button>
                </div>
              ) : transactions.length === 0 ? (
                /* EMPTY STATE: ZERO TRANSACTIONS */
                <div className="empty-transactions">
                  <div className="empty-icon">
                    <FiLayers />
                  </div>
                  <h3>No transactions yet</h3>
                  <p>Add your first transaction to start tracking your finances.</p>
                  <button
                    type="button"
                    className="empty-action-btn"
                    onClick={handleOpenAddModal}
                  >
                    <FiPlus />
                    Add Transaction
                  </button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                /* EMPTY STATE: NO MATCH FOR SEARCH/FILTER */
                <div className="empty-transactions">
                  <div
                    className="empty-icon"
                    style={{ background: "#f1f5f9", color: "#64748b" }}
                  >
                    <FiSearch />
                  </div>
                  <h3>No matching transactions</h3>
                  <p>Try changing your search or filter.</p>
                </div>
              ) : (
                /* TRANSACTION ROWS */
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  const amt = Math.abs(Number(tx.amount) || 0);
                  const txId = tx._id || tx.id;

                  return (
                    <div className="transaction-row" key={txId}>
                      {/* Name & Icon */}
                      <div className="transaction-name">
                        <div
                          className={`transaction-icon ${
                            isIncome ? "income" : "expense"
                          }`}
                        >
                          {getCategoryIcon(tx.category, tx.type)}
                        </div>

                        <div className="transaction-name-text">
                          <strong>
                            {tx.title || tx.description || "Transaction"}
                          </strong>
                          {tx.description &&
                          tx.description !== (tx.title || tx.description) ? (
                            <span>{tx.description}</span>
                          ) : (
                            <span>{isIncome ? "Income" : "Expense"}</span>
                          )}
                        </div>
                      </div>

                      {/* Category */}
                      <div className="transaction-category">
                        <span className="category-badge">
                          {tx.category || (isIncome ? "Salary" : "Other")}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="transaction-date">
                        <FiCalendar />
                        <span>
                          {formatDisplayDate(tx.date || tx.createdAt)}
                        </span>
                      </div>

                      {/* Amount */}
                      <div
                        className={`transaction-amount ${
                          isIncome ? "income" : "expense"
                        }`}
                      >
                        {isIncome ? "+" : "-"}₹{amt.toLocaleString("en-IN")}
                      </div>

                      {/* Actions */}
                      <div
                        className="transaction-actions"
                        style={{ justifyContent: "flex-end" }}
                      >
                        <button
                          type="button"
                          className="tx-action-btn"
                          title="Edit transaction"
                          onClick={() => handleOpenEditModal(tx)}
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          className="tx-action-btn delete-btn"
                          title="Delete transaction"
                          onClick={() => handleOpenDeleteModal(tx)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ADD / EDIT TRANSACTION MODAL */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleModalSubmit}
        editingTransaction={editingTransaction}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        transactionTitle={
          deletingTransaction?.title ||
          deletingTransaction?.description
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}