import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";
import ExpenseChart from "../components/dashboard/ExpenseChart";
import AIInsightCard from "../components/dashboard/AIInsightCard";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import AddTransactionModal from "../components/dashboard/AddTransactionModal";

import { useAuth } from "../context/AuthContext";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionService";
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("expense");
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Load user data
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, goalsRes] = await Promise.allSettled([
        getTransactions(),
        getGoals(),
      ]);

      if (txRes.status === "fulfilled" && txRes.value) {
        // Backend returns { success: true, count: N, transactions: [...] } or array
        const txList =
          txRes.value.transactions ||
          (Array.isArray(txRes.value) ? txRes.value : []);
        setTransactions(txList);
      }

      if (goalsRes.status === "fulfilled" && goalsRes.value) {
        const goalsList = Array.isArray(goalsRes.value)
          ? goalsRes.value
          : goalsRes.value.goals || [];
        setGoals(goalsList);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Compute Financial Overview
  const financialData = useMemo(() => {
    let income = 0;
    let expenses = 0;

    (transactions || []).forEach((t) => {
      const amt = Math.abs(Number(t.amount) || 0);
      const isIncome = t.type ? t.type === "income" : Number(t.amount) > 0;
      if (isIncome) {
        income += amt;
      } else {
        expenses += amt;
      }
    });

    const balance = income - expenses;

    // Total target savings goal amount from active goals
    const totalGoalAmount = (goals || []).reduce((sum, g) => {
      return sum + (Number(g.targetAmount) || Number(g.target) || 0);
    }, 0);

    return {
      balance,
      income,
      expenses,
      savings: balance,
      savingsGoal: totalGoalAmount,
      transactionsCount: transactions.length,
      goalsCount: goals.length,
    };
  }, [transactions, goals]);

  // Handle adding new transaction
  const handleAddTransaction = async (newTxData) => {
    try {
      const res = await createTransaction(newTxData);
      if (res?.transaction) {
        setTransactions((prev) => [res.transaction, ...prev]);
      } else {
        await loadUserData();
      }
    } catch (err) {
      console.error("Create transaction failed:", err);
      await loadUserData();
    }
  };

  // Handle editing existing transaction
  const handleUpdateTransaction = async (id, updatedTxData) => {
    try {
      const res = await updateTransaction(id, updatedTxData);
      if (res?.transaction) {
        setTransactions((prev) =>
          prev.map((t) => (t._id === id ? res.transaction : t))
        );
      } else {
        await loadUserData();
      }
    } catch (err) {
      console.error("Update transaction failed:", err);
      await loadUserData();
    }
  };

  // Handle deleting transaction
  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Delete transaction failed:", err);
      await loadUserData();
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
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
      />
    </div>
  );
}