import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";
import ExpenseChart from "../components/dashboard/ExpenseChart";
import AIInsightCard from "../components/dashboard/AIInsightCard";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import AddTransactionModal from "../components/transactions/AddTransactionModal";
import DeleteConfirmModal from "../components/transactions/DeleteConfirmModal";

import { useAuth } from "../context/AuthContext";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "../services/transactionService";
import { getGoals } from "../services/goalService";

import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiPlus,
  FiMinusCircle,
  FiPieChart,
} from "react-icons/fi";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("expense");
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Delete Confirm State
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user data from API
  const loadUserData = useCallback(async () => {
    try {
      const [txList, goalsList] = await Promise.all([
        getTransactions(),
        getGoals(),
      ]);
      setTransactions(txList);
      setGoals(goalsList);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Compute Financial Overview
  const financialData = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const expenses = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const balance = income - expenses;
    const savings = balance > 0 ? balance : 0;

    const totalGoalAmount = goals.reduce(
      (sum, g) => sum + (Number(g.target) || Number(g.targetAmount) || 0),
      0
    );

    return {
      balance,
      income,
      expenses,
      savings,
      savingsGoal: totalGoalAmount,
      transactionsCount: transactions.length,
      goalsCount: goals.length,
    };
  }, [transactions, goals]);

  // Handle adding / editing transaction from modal
  const handleModalSubmit = async (formData, idToUpdate) => {
    try {
      if (idToUpdate) {
        await updateTransaction(idToUpdate, formData);
      } else {
        await createTransaction(formData);
      }
      await loadUserData();
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }
  };

  // Open delete confirm modal
  const handleDeleteTransaction = (id) => {
    const tx = transactions.find(
      (t) => String(t._id || t.id) === String(id)
    );
    if (tx) {
      setDeletingTransaction(tx);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(
        deletingTransaction._id || deletingTransaction.id
      );
      await loadUserData();
      setDeletingTransaction(null);
    } catch (err) {
      console.error("Delete transaction failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddModal = (type = "expense") => {
    setEditingTransaction(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setModalType(transaction.type || "expense");
    setIsModalOpen(true);
  };

  const isNewUser = financialData.transactionsCount === 0;

  return (
    <div className="dashboard-page">
      {/* ================= SIDEBAR ================= */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* ================= MAIN ================= */}
      <main className="dashboard-main">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() =>
            setIsMobileSidebarOpen(!isMobileSidebarOpen)
          }
          user={user}
        />

        <section className="dashboard-content">
          {/* ================= HEADER ================= */}
          <div className="dashboard-heading">
            <div>
              <p className="dashboard-greeting">
                Good{" "}
                {new Date().getHours() < 12
                  ? "morning"
                  : new Date().getHours() < 18
                  ? "afternoon"
                  : "evening"}{" "}
                {user?.name ? `${user.name.split(" ")[0]} ` : ""}👋
              </p>

              <h1>
                {isNewUser
                  ? "Welcome to your financial dashboard"
                  : "Here's your financial overview"}
              </h1>

              <p className="dashboard-subtitle">
                {isNewUser
                  ? "Start tracking your money, analyze your spending, and make smarter financial decisions."
                  : "Track your income, monitor expenses, and stay on top of your financial goals."}
              </p>
            </div>

            <button
              type="button"
              className="add-money-btn"
              onClick={() => openAddModal("expense")}
            >
              <FiPlus /> Add Transaction
            </button>
          </div>

          {/* ================= QUICK ACTIONS ================= */}
          <div className="quick-actions">
            <span className="quick-label">Quick Actions:</span>

            <button
              type="button"
              className="quick-action-btn"
              onClick={() => openAddModal("expense")}
            >
              <FiMinusCircle className="action-icon expense-color" /> Add Expense
            </button>

            <button
              type="button"
              className="quick-action-btn"
              onClick={() => openAddModal("income")}
            >
              <FiPlus className="action-icon income-color" /> Add Income
            </button>

            <button
              type="button"
              className="quick-action-btn"
              onClick={() => navigate("/budgets")}
            >
              <FiPieChart className="action-icon budget-color" /> Create Budget
            </button>

            <button
              type="button"
              className="quick-action-btn"
              onClick={() => navigate("/goals")}
            >
              <FiTarget className="action-icon goal-color" /> Set Goal
            </button>
          </div>

          {/* ================= STAT CARDS ================= */}
          <div className="stats-grid">
            <StatCard
              title="Total Balance"
              value={`₹${financialData.balance.toLocaleString("en-IN")}`}
              change={financialData.balance >= 0 ? "+0.0%" : "-0.0%"}
              subtitle={isNewUser ? "No transactions yet" : "Net balance"}
              icon={<FiDollarSign />}
              type="balance"
            />

            <StatCard
              title="Total Income"
              value={`₹${financialData.income.toLocaleString("en-IN")}`}
              change="+0.0%"
              subtitle={isNewUser ? "Add your first income" : "Total earned"}
              icon={<FiTrendingUp />}
              type="income"
            />

            <StatCard
              title="Total Expenses"
              value={`₹${financialData.expenses.toLocaleString("en-IN")}`}
              change="0.0%"
              subtitle={isNewUser ? "No expenses recorded" : "Total spent"}
              icon={<FiTrendingDown />}
              type="expense"
            />

            <StatCard
              title="Savings Goal"
              value={`₹${financialData.savingsGoal.toLocaleString("en-IN")}`}
              change="0.0%"
              subtitle={
                financialData.goalsCount === 0
                  ? "Create your first goal"
                  : `${financialData.goalsCount} active goal${
                      financialData.goalsCount === 1 ? "" : "s"
                    }`
              }
              icon={<FiTarget />}
              type="goal"
            />
          </div>

          {/* ================= MIDDLE ================= */}
          <div className="dashboard-middle">
            <ExpenseChart
              transactions={transactions}
              onAddTransactionClick={() => openAddModal("expense")}
            />

            <AIInsightCard
              transactions={transactions}
              balance={financialData.balance}
              income={financialData.income}
              expenses={financialData.expenses}
            />
          </div>

          {/* ================= RECENT TRANSACTIONS ================= */}
          <RecentTransactions
            searchQuery={searchQuery}
            transactions={transactions}
            onAddTransactionClick={() => openAddModal("expense")}
            onEditTransaction={openEditModal}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </section>
      </main>

      {/* ================= ADD/EDIT TRANSACTION MODAL ================= */}
      <AddTransactionModal
        isOpen={isModalOpen}
        initialType={modalType}
        editingTransaction={editingTransaction}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleModalSubmit}
      />

      {/* ================= DELETE CONFIRM MODAL ================= */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        transactionTitle={
          deletingTransaction?.title || deletingTransaction?.description
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}
