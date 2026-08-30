import { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/goals.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import GoalCard from "../components/goals/GoalCard";
import AddGoalModal from "../components/goals/AddGoalModal";
import AddMoneyModal from "../components/goals/AddMoneyModal";
import DeleteGoalModal from "../components/goals/DeleteGoalModal";

import { useAuth } from "../context/AuthContext";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "../services/goalService";

import {
  FiPlus,
  FiTarget,
  FiTrendingUp,
  FiSearch,
  FiSliders,
  FiLoader,
} from "react-icons/fi";

const GOAL_CATEGORIES = [
  "Savings",
  "Emergency Fund",
  "Travel",
  "Education",
  "Technology",
  "Health",
  "Home",
  "Investment",
  "Other",
];

export default function Goals() {
  const { user } = useAuth();

  const [goals, setGoals] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [addingMoneyGoal, setAddingMoneyGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const list = await getGoals();
      setGoals(list);
    } catch (err) {
      console.error("Failed to load goals:", err);
      setError("Failed to load goals. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall Summary
  const summary = useMemo(() => {
    const totalGoals = goals.length;
    const totalTarget = goals.reduce((sum, g) => sum + (Number(g.target) || 0), 0);
    const totalSaved = goals.reduce((sum, g) => sum + (Number(g.saved) || 0), 0);
    const totalRemaining = Math.max(0, totalTarget - totalSaved);
    const overallProgress =
      totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const completedCount = goals.filter(
      (g) => Number(g.saved) >= Number(g.target) && Number(g.target) > 0
    ).length;

    return {
      totalGoals,
      totalTarget,
      totalSaved,
      totalRemaining,
      overallProgress,
      completedCount,
    };
  }, [goals]);

  // Filtered & Sorted Goals
  const displayedGoals = useMemo(() => {
    let result = [...goals];

    if (filter !== "all") {
      result = result.filter(
        (g) => (g.category || "").toLowerCase() === filter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          (g.title || "").toLowerCase().includes(q) ||
          (g.category || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "progress") {
        const pctA = a.target > 0 ? a.saved / a.target : 0;
        const pctB = b.target > 0 ? b.saved / b.target : 0;
        return pctB - pctA;
      }
      if (sortBy === "deadline") {
        return new Date(a.deadline || 0) - new Date(b.deadline || 0);
      }
      if (sortBy === "target") {
        return (b.target || 0) - (a.target || 0);
      }
      // newest by default
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return result;
  }, [goals, filter, searchQuery, sortBy]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditingGoal(goal);
    setIsAddModalOpen(true);
  };

  const handleModalSubmit = async (formData, idToUpdate) => {
    try {
      if (idToUpdate) {
        await updateGoal(idToUpdate, formData);
      } else {
        await createGoal(formData);
      }
      await loadData();
    } catch (err) {
      console.error("Failed to save goal:", err);
    }
  };

  const handleOpenAddMoneyModal = (goal) => {
    setAddingMoneyGoal(goal);
  };

  // Add money = update goal's saved amount via API
  const handleAddMoneySubmit = async (goalId, amount) => {
    try {
      const goal = goals.find((g) => (g._id || g.id) === goalId);
      if (!goal) return;
      const newSaved = Math.min(
        (Number(goal.saved) || 0) + Number(amount),
        Number(goal.target) || 0
      );
      await updateGoal(goalId, { saved: newSaved });
      await loadData();
    } catch (err) {
      console.error("Failed to add money to goal:", err);
    }
  };

  const handleOpenDeleteModal = (goal) => {
    setDeletingGoal(goal);
  };

  const handleConfirmDelete = async () => {
    if (!deletingGoal) return;
    setIsDeleting(true);
    try {
      await deleteGoal(deletingGoal._id || deletingGoal.id);
      await loadData();
      setDeletingGoal(null);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Available filter categories
  const filterCategories = useMemo(() => {
    const set = new Set(GOAL_CATEGORIES);
    goals.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set);
  }, [goals]);

  return (
    <div className="goals-page">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN CONTENT */}
      <main className="goals-main">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() =>
            setIsMobileSidebarOpen(!isMobileSidebarOpen)
          }
          user={user}
        />

        <section className="goals-content">
          {/* HEADER */}
          <div className="goals-header">
            <div>
              <p className="goals-eyebrow">FINANCIAL PLANNING</p>
              <h1>Your Financial Goals</h1>
              <p>Turn your plans into goals and track your progress step by step.</p>
            </div>

            <button
              type="button"
              className="add-goal-btn"
              onClick={handleOpenAddModal}
            >
              <FiPlus />
              Create Goal
            </button>
          </div>

          {/* SUMMARY GRID */}
          <div className="goals-summary-grid">
            <div className="goal-summary-card">
              <div className="goal-summary-icon purple">
                <FiTarget />
              </div>
              <div>
                <span>Total Goals</span>
                <strong>{summary.totalGoals}</strong>
                <small>
                  {summary.completedCount > 0
                    ? `${summary.completedCount} completed`
                    : "Active financial goals"}
                </small>
              </div>
            </div>

            <div className="goal-summary-card">
              <div className="goal-summary-icon blue">
                <FiTrendingUp />
              </div>
              <div>
                <span>Total Saved</span>
                <strong>₹{summary.totalSaved.toLocaleString("en-IN")}</strong>
                <small>{summary.overallProgress}% overall progress</small>
              </div>
            </div>

            <div className="goal-summary-card">
              <div className="goal-summary-icon orange">
                <FiTarget />
              </div>
              <div>
                <span>Remaining</span>
                <strong>₹{summary.totalRemaining.toLocaleString("en-IN")}</strong>
                <small>Amount needed to reach goals</small>
              </div>
            </div>
          </div>

          {/* OVERALL PROGRESS CARD */}
          <div className="goals-overview">
            <div className="goals-overview-top">
              <div>
                <span>Overall Goal Progress</span>
                <h2>
                  ₹{summary.totalSaved.toLocaleString("en-IN")}
                  <small> / ₹{summary.totalTarget.toLocaleString("en-IN")}</small>
                </h2>
              </div>

              <strong>{summary.overallProgress}%</strong>
            </div>

            <div className="goals-overview-progress">
              <div
                style={{
                  width: `${Math.min(summary.overallProgress, 100)}%`,
                  background:
                    summary.overallProgress >= 100
                      ? "#10b981"
                      : "linear-gradient(90deg, #635bff, #756cf6)",
                }}
              />
            </div>

            <p>
              {summary.completedCount > 0
                ? `You have completed ${summary.completedCount} of ${summary.totalGoals} goals. Keep saving consistently!`
                : "Keep saving consistently to reach your financial milestones."}
            </p>
          </div>

          {/* TOOLBAR & CONTROLS */}
          <div className="goals-toolbar">
            <div className="goals-toolbar-left">
              <h2>Your Goals</h2>
              <p>Monitor your progress and stay motivated.</p>
            </div>

            <div className="goals-toolbar-controls">
              {/* Search input */}
              <div className="goals-search-box">
                <FiSearch className="goals-search-icon" />
                <input
                  type="text"
                  placeholder="Search goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="goals-search-input"
                />
              </div>

              {/* Sort dropdown */}
              <div className="goals-sort-wrap">
                <FiSliders className="goals-sort-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="goals-sort-select"
                  aria-label="Sort Goals"
                >
                  <option value="newest">Newest</option>
                  <option value="progress">Highest Progress</option>
                  <option value="deadline">Earliest Deadline</option>
                  <option value="target">Largest Target</option>
                </select>
              </div>
            </div>
          </div>

          {/* CATEGORY FILTER PILLS */}
          <div className="goal-filters">
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>

            {filterCategories.map((cat) => (
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

          {/* GOALS GRID / EMPTY STATE */}
          {loading ? (
            <div className="empty-goals">
              <FiLoader
                style={{
                  animation: "spin 1s linear infinite",
                  fontSize: "2.5rem",
                  color: "#635bff",
                }}
              />
              <h3>Loading goals...</h3>
            </div>
          ) : error ? (
            <div className="empty-goals">
              <FiTarget style={{ fontSize: "2.5rem" }} />
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button
                type="button"
                className="add-goal-btn"
                onClick={loadData}
              >
                Try Again
              </button>
            </div>
          ) : goals.length === 0 ? (
            /* EMPTY STATE: NO GOALS YET */
            <div className="empty-goals">
              <FiTarget />
              <h3>No goals yet</h3>
              <p>Create your first financial goal to start saving with a plan.</p>
              <button
                type="button"
                className="add-goal-btn"
                onClick={handleOpenAddModal}
              >
                <FiPlus />
                Create Goal
              </button>
            </div>
          ) : displayedGoals.length === 0 ? (
            /* EMPTY STATE: NO MATCHES */
            <div className="empty-goals">
              <FiSearch />
              <h3>No goals found</h3>
              <p>No goals match your search "{searchQuery}" or filter.</p>
              <button
                type="button"
                className="add-goal-btn"
                onClick={() => {
                  setFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="goals-grid">
              {displayedGoals.map((goal) => (
                <GoalCard
                  key={goal._id || goal.id}
                  goal={goal}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteModal}
                  onAddMoney={handleOpenAddMoneyModal}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* CREATE / EDIT GOAL MODAL */}
      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleModalSubmit}
        editingGoal={editingGoal}
      />

      {/* ADD MONEY MODAL */}
      <AddMoneyModal
        isOpen={Boolean(addingMoneyGoal)}
        onClose={() => setAddingMoneyGoal(null)}
        onSubmit={handleAddMoneySubmit}
        goal={addingMoneyGoal}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteGoalModal
        isOpen={Boolean(deletingGoal)}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleConfirmDelete}
        goalTitle={deletingGoal?.title}
        isDeleting={isDeleting}
      />
    </div>
  );
}