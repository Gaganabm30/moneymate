import { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/budgets.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import BudgetCard from "../components/budgets/BudgetCard";
import AddBudgetModal from "../components/budgets/AddBudgetModal";
import DeleteBudgetModal from "../components/budgets/DeleteBudgetModal";

import { useAuth } from "../context/AuthContext";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../services/budgetService";

import {
  FiPlus,
  FiPieChart,
  FiAlertTriangle,
  FiCalendar,
  FiLoader,
} from "react-icons/fi";

/**
 * Generate 12 recent month-year options ending with the current month
 */
const generateMonthOptions = () => {
  const options = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    const value = `${year}-${month}`;

    options.push({ value, month, year, label });
  }

  return options;
};

export default function Budgets() {
  const { user } = useAuth();
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const [selectedMonthValue, setSelectedMonthValue] = useState(monthOptions[0].value);
  const [budgets, setBudgets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Parse current selected month and year
  const currentMonthOption = useMemo(() => {
    return (
      monthOptions.find((opt) => opt.value === selectedMonthValue) ||
      monthOptions[0]
    );
  }, [monthOptions, selectedMonthValue]);

  // Load budgets from API for the selected month
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getBudgets(
        currentMonthOption.month,
        currentMonthOption.year
      );
      setBudgets(data);
    } catch (err) {
      console.error("Failed to load budgets:", err);
      setError("Failed to load budgets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentMonthOption]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall summary — computed from the server-returned budgets (which include spent)
  const overallSummary = useMemo(() => {
    const totalLimit = budgets.reduce((sum, b) => sum + (b.limit || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const remaining = totalLimit - totalSpent;
    const overallPercentage =
      totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    return { totalLimit, totalSpent, remaining, overallPercentage };
  }, [budgets]);

  // Budget warnings (>= 80% or exceeded)
  const budgetWarnings = useMemo(() => {
    const warnings = [];
    budgets.forEach((b) => {
      const pct = b.percentage || 0;
      const remaining = b.limit - b.spent;
      if (pct >= 100) {
        warnings.push({
          id: b._id,
          type: "danger",
          message: `Your ${b.name || b.category} spending is ₹${Math.abs(remaining).toLocaleString("en-IN")} over budget.`,
        });
      } else if (pct >= 80) {
        warnings.push({
          id: b._id,
          type: "warning",
          message: `You're close to reaching your ${b.name || b.category} budget (₹${remaining.toLocaleString("en-IN")} remaining).`,
        });
      }
    });
    return warnings;
  }, [budgets]);

  // Filter budgets
  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const cat = (b.category || b.name || "").toLowerCase();
      return filter === "all" || cat === filter.toLowerCase();
    });
  }, [budgets, filter]);

  // Available category filters
  const availableFilterCategories = useMemo(() => {
    const presentCategories = new Set(budgets.map((b) => b.category || b.name));
    const list = ["Food", "Housing", "Transport", "Entertainment"];
    presentCategories.forEach((cat) => list.push(cat));
    return Array.from(new Set(list));
  }, [budgets]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (budget) => {
    setEditingBudget(budget);
    setIsAddModalOpen(true);
  };

  const handleModalSubmit = async (formData, idToUpdate) => {
    try {
      const payload = {
        ...formData,
        month: currentMonthOption.month,
        year: currentMonthOption.year,
      };

      if (idToUpdate) {
        await updateBudget(idToUpdate, payload);
      } else {
        await createBudget(payload);
      }
      await loadData();
    } catch (err) {
      console.error("Failed to save budget:", err);
    }
  };

  const handleOpenDeleteModal = (budget) => {
    setDeletingBudget(budget);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBudget) return;
    setIsDeleting(true);
    try {
      await deleteBudget(deletingBudget._id || deletingBudget.id);
      await loadData();
      setDeletingBudget(null);
    } catch (err) {
      console.error("Failed to delete budget:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="budgets-page">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN CONTENT */}
      <main className="budgets-main">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() =>
            setIsMobileSidebarOpen(!isMobileSidebarOpen)
          }
          user={user}
        />

        <section className="budgets-content">
          {/* HEADER */}
          <div className="budgets-header">
            <div>
              <p className="budgets-eyebrow">MONEY MANAGEMENT</p>
              <h1>Budgets</h1>
              <p>Set category spending limits and stay in control of your monthly expenses.</p>
            </div>

            <button
              type="button"
              className="add-budget-btn"
              onClick={handleOpenAddModal}
            >
              <FiPlus />
              Create Budget
            </button>
          </div>

          {/* MONTH SELECTOR BANNER */}
          <div className="budget-period">
            <div>
              <strong>{currentMonthOption.label}</strong>
              <span>
                {overallSummary.totalSpent === 0 && budgets.length > 0
                  ? "₹0 spent • You're on track."
                  : "Live budget overview derived from monthly expenses"}
              </span>
            </div>

            <div className="budget-period-select-wrap">
              <FiCalendar className="period-icon" />
              <select
                value={selectedMonthValue}
                onChange={(e) => setSelectedMonthValue(e.target.value)}
                className="budget-month-select"
                aria-label="Select Budget Month"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC WARNINGS BANNER */}
          {budgetWarnings.length > 0 && (
            <div className="budget-warnings-container">
              {budgetWarnings.map((w) => (
                <div key={w.id} className={`budget-warning-alert ${w.type}`}>
                  <FiAlertTriangle />
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* SUMMARY GRID */}
          <div className="budget-summary-grid">
            <div className="budget-summary-card">
              <div className="summary-label">Total Budget</div>
              <strong>₹{overallSummary.totalLimit.toLocaleString("en-IN")}</strong>
              <span>Monthly spending limit for {currentMonthOption.label}</span>
            </div>

            <div className="budget-summary-card">
              <div className="summary-label">Total Spent</div>
              <strong className="spent-value">
                ₹{overallSummary.totalSpent.toLocaleString("en-IN")}
              </strong>
              <span>{overallSummary.overallPercentage}% of total budget used</span>
            </div>

            <div className="budget-summary-card">
              <div className="summary-label">Remaining</div>
              <strong
                className="remaining-value"
                style={{
                  color:
                    overallSummary.remaining >= 0
                      ? "var(--bg-success-text)"
                      : "var(--bg-danger-text)",
                }}
              >
                ₹{Math.max(0, overallSummary.remaining).toLocaleString("en-IN")}
              </strong>
              <span>
                {overallSummary.remaining >= 0
                  ? "Available to spend this month"
                  : `Over budget by ₹${Math.abs(overallSummary.remaining).toLocaleString("en-IN")}`}
              </span>
            </div>
          </div>

          {/* OVERALL PROGRESS CARD */}
          <div className="overall-budget-card">
            <div className="overall-budget-header">
              <div>
                <span>Overall Monthly Budget Progress</span>
                <h2>
                  ₹{overallSummary.totalSpent.toLocaleString("en-IN")}
                  <small> / ₹{overallSummary.totalLimit.toLocaleString("en-IN")}</small>
                </h2>
              </div>

              <strong
                style={{
                  color:
                    overallSummary.overallPercentage >= 100
                      ? "#ef4444"
                      : overallSummary.overallPercentage >= 80
                      ? "#f59e0b"
                      : "#635bff",
                }}
              >
                {overallSummary.overallPercentage}%
              </strong>
            </div>

            <div className="overall-progress">
              <div
                className="overall-progress-fill"
                style={{
                  width: `${Math.min(overallSummary.overallPercentage, 100)}%`,
                  background:
                    overallSummary.overallPercentage >= 100
                      ? "#ef4444"
                      : overallSummary.overallPercentage >= 80
                      ? "#f59e0b"
                      : "#635bff",
                }}
              />
            </div>

            <p>
              {overallSummary.remaining >= 0
                ? `You have ₹${overallSummary.remaining.toLocaleString("en-IN")} remaining across your ${budgets.length} budgets.`
                : `You have exceeded your overall budget by ₹${Math.abs(overallSummary.remaining).toLocaleString("en-IN")}.`}
            </p>
          </div>

          {/* TOOLBAR & FILTERS */}
          <div className="budgets-toolbar">
            <div>
              <h2>Your Category Budgets</h2>
              <p>Manage and monitor your category spending limits.</p>
            </div>

            <div className="budget-filters">
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              {availableFilterCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={
                    filter.toLowerCase() === cat.toLowerCase() ? "active" : ""
                  }
                  onClick={() => setFilter(cat.toLowerCase())}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* BUDGET CARDS GRID */}
          {loading ? (
            <div className="empty-budget">
              <FiLoader style={{ animation: "spin 1s linear infinite", fontSize: "2rem", color: "#635bff" }} />
              <h3>Loading budgets...</h3>
            </div>
          ) : error ? (
            <div className="empty-budget">
              <FiPieChart />
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button type="button" className="add-budget-btn" onClick={loadData}>
                Try Again
              </button>
            </div>
          ) : budgets.length === 0 ? (
            /* EMPTY STATE: NO BUDGETS AT ALL */
            <div className="empty-budget">
              <FiPieChart />
              <h3>No budgets yet</h3>
              <p>Create your first budget to start controlling your spending.</p>
              <button
                type="button"
                className="add-budget-btn"
                onClick={handleOpenAddModal}
              >
                <FiPlus />
                Create Budget
              </button>
            </div>
          ) : filteredBudgets.length === 0 ? (
            /* EMPTY STATE: NO BUDGETS MATCHING FILTER */
            <div className="empty-budget">
              <FiPieChart />
              <h3>No budgets found</h3>
              <p>No budgets matching the "{filter}" category filter.</p>
              <button
                type="button"
                className="add-budget-btn"
                onClick={() => setFilter("all")}
              >
                Show All Budgets
              </button>
            </div>
          ) : (
            <div className="budgets-grid">
              {filteredBudgets.map((b) => (
                <BudgetCard
                  key={b._id || b.id}
                  budget={b}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* CREATE / EDIT BUDGET MODAL */}
      <AddBudgetModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={handleModalSubmit}
        editingBudget={editingBudget}
      />

      {/* DELETE BUDGET MODAL */}
      <DeleteBudgetModal
        isOpen={Boolean(deletingBudget)}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleConfirmDelete}
        budgetName={deletingBudget?.name || deletingBudget?.category}
        isDeleting={isDeleting}
      />
    </div>
  );
}