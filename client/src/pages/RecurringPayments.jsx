import { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/dashboard.css";
import "../styles/recurring.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import AddEditRecurringModal from "../components/recurring/AddEditRecurringModal";
import DeleteRecurringModal from "../components/recurring/DeleteRecurringModal";
import MarkPaidModal from "../components/recurring/MarkPaidModal";

import { useAuth } from "../context/AuthContext";
import {
  getRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  pauseRecurringPayment,
  resumeRecurringPayment,
  markBillPaid,
  deleteRecurringPayment,
  processDueRecurringPayments,
} from "../services/recurringService";

import {
  FiPlus,
  FiRepeat,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiPlay,
  FiPause,
  FiEdit2,
  FiTrash2,
  FiTrendingDown,
  FiCheck,
  FiLoader,
  FiTag,
  FiBell,
  FiRefreshCw,
} from "react-icons/fi";

const formatINR = (amt) =>
  `₹${Math.abs(Number(amt) || 0).toLocaleString("en-IN")}`;

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "N/A";
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

export default function RecurringPayments() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [overview, setOverview] = useState({
    totalUpcoming: 0,
    dueThisWeek: 0,
    overduePayments: 0,
    overdueCount: 0,
    estimatedMonthlyExpenses: 0,
    activeExpenseCount: 0,
    activeIncomeCount: 0,
    pausedCount: 0,
    totalCount: 0,
  });

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "upcoming", "expense", "income", "paused"
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalType, setModalType] = useState("expense");

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [payingBill, setPayingBill] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  // Load recurring payments
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getRecurringPayments();
      if (res?.success) {
        setSchedules(res.schedules || []);
        if (res.overview) {
          setOverview(res.overview);
        }
      }
    } catch (err) {
      console.error("Failed to load recurring payments:", err);
      setError("Failed to load recurring payments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manual refresh & sync due
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await processDueRecurringPayments();
      await loadData();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add / Edit submission
  const handleModalSubmit = async (formData, idToUpdate) => {
    if (idToUpdate) {
      await updateRecurringPayment(idToUpdate, formData);
    } else {
      await createRecurringPayment(formData);
    }
    await loadData();
  };

  // Pause / Resume
  const handleTogglePause = async (schedule) => {
    try {
      if (schedule.status === "paused") {
        await resumeRecurringPayment(schedule._id);
      } else {
        await pauseRecurringPayment(schedule._id);
      }
      await loadData();
    } catch (err) {
      console.error("Pause/resume toggle failed:", err);
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;
    try {
      setIsDeleting(true);
      await deleteRecurringPayment(deletingSchedule._id);
      setDeletingSchedule(null);
      await loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Mark Paid
  const handleConfirmMarkPaid = async (paymentDetails) => {
    if (!payingBill) return;
    try {
      setIsPaying(true);
      await markBillPaid(payingBill._id, paymentDetails);
      setPayingBill(null);
      await loadData();
    } catch (err) {
      console.error("Mark paid failed:", err);
    } finally {
      setIsPaying(false);
    }
  };

  // Filtered upcoming bills (expenses only, active or overdue)
  const upcomingBills = useMemo(() => {
    return schedules
      .filter((s) => s.type === "expense" && s.status === "active")
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
  }, [schedules]);

  // Filtered recurring schedules list for table
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      // Tab filter
      if (activeTab === "expense" && s.type !== "expense") return false;
      if (activeTab === "income" && s.type !== "income") return false;
      if (activeTab === "paused" && s.status !== "paused") return false;
      if (activeTab === "active" && s.status !== "active") return false;

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = (s.title || "").toLowerCase().includes(query);
        const matchesCat = (s.category || "").toLowerCase().includes(query);
        const matchesDesc = (s.description || "").toLowerCase().includes(query);
        return matchesTitle || matchesCat || matchesDesc;
      }
      return true;
    });
  }, [schedules, activeTab, search]);

  const openAddModal = (type = "expense") => {
    setEditingSchedule(null);
    setModalType(type);
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setIsAddEditModalOpen(true);
  };

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
          searchQuery={search}
          onSearchChange={setSearch}
          onToggleMobileSidebar={() =>
            setIsMobileSidebarOpen(!isMobileSidebarOpen)
          }
          user={user}
        />

        <section className="dashboard-content recurring-page-content">
          {/* ================= PAGE HEADER ================= */}
          <div className="dashboard-heading recurring-header">
            <div>
              <div className="page-tag">
                <FiRepeat /> RECURRING PAYMENTS & BILLS
              </div>
              <h1>Recurring Payments</h1>
              <p className="dashboard-subtitle">
                Manage regular income and upcoming bills.
              </p>
            </div>

            <div className="recurring-header-actions">
              <button
                type="button"
                className="recurring-sync-btn"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Sync and check due bills"
              >
                <FiRefreshCw
                  className={isRefreshing ? "spin-animation" : ""}
                />
                <span>{isRefreshing ? "Syncing..." : "Sync Due"}</span>
              </button>

              <button
                type="button"
                className="add-money-btn"
                onClick={() => openAddModal("expense")}
              >
                <FiPlus /> Add Recurring Payment
              </button>
            </div>
          </div>

          {error && (
            <div className="tx-modal-alert" style={{ marginBottom: "20px" }}>
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* ================= OVERVIEW CARDS ================= */}
          <div className="recurring-stats-grid">
            {/* Card 1: Total Upcoming */}
            <div className="recurring-stat-card">
              <div className="r-stat-top">
                <span className="r-stat-label">Total Upcoming Payments</span>
                <div className="r-stat-icon upcoming-icon">
                  <FiCalendar />
                </div>
              </div>
              <strong className="r-stat-value">
                {formatINR(overview.totalUpcoming)}
              </strong>
              <div className="r-stat-footer">
                <span>
                  {upcomingBills.length} pending bill
                  {upcomingBills.length === 1 ? "" : "s"} scheduled
                </span>
              </div>
            </div>

            {/* Card 2: Due This Week */}
            <div className="recurring-stat-card">
              <div className="r-stat-top">
                <span className="r-stat-label">Payments Due This Week</span>
                <div className="r-stat-icon this-week-icon">
                  <FiClock />
                </div>
              </div>
              <strong className="r-stat-value">
                {formatINR(overview.dueThisWeek)}
              </strong>
              <div className="r-stat-footer">
                <span>Next 7 calendar days</span>
              </div>
            </div>

            {/* Card 3: Overdue Payments */}
            <div
              className={`recurring-stat-card ${
                overview.overdueCount > 0 ? "has-overdue" : ""
              }`}
            >
              <div className="r-stat-top">
                <span className="r-stat-label">Overdue Payments</span>
                <div className="r-stat-icon overdue-icon">
                  <FiAlertCircle />
                </div>
              </div>
              <strong className="r-stat-value" style={{ color: overview.overdueCount > 0 ? "#ef4444" : "inherit" }}>
                {formatINR(overview.overduePayments)}
              </strong>
              <div className="r-stat-footer">
                {overview.overdueCount > 0 ? (
                  <span className="overdue-badge-pill">
                    {overview.overdueCount} bill
                    {overview.overdueCount === 1 ? "" : "s"} overdue
                  </span>
                ) : (
                  <span style={{ color: "#10b981", fontWeight: 600 }}>
                    <FiCheck /> All bills up to date
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: Estimated Monthly Recurring Expenses */}
            <div className="recurring-stat-card highlight-card">
              <div className="r-stat-top">
                <span className="r-stat-label">
                  Estimated Monthly Expenses{" "}
                  <em className="estimate-tag">(Estimate)</em>
                </span>
                <div className="r-stat-icon monthly-icon">
                  <FiTrendingDown />
                </div>
              </div>
              <strong className="r-stat-value">
                {formatINR(overview.estimatedMonthlyExpenses)}
              </strong>
              <div className="r-stat-footer">
                <span>
                  Normalized monthly commitment ({overview.activeExpenseCount}{" "}
                  active)
                </span>
              </div>
            </div>
          </div>

          {/* ================= SECTION 1: UPCOMING BILLS ================= */}
          <div className="recurring-section-container upcoming-bills-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <span className="section-label">PAYMENT SCHEDULE</span>
                <h2>Upcoming Bills</h2>
                <p>Expense payments ordered chronologically by due date.</p>
              </div>
              <span className="bills-counter-badge">
                {upcomingBills.length} Active Bill
                {upcomingBills.length === 1 ? "" : "s"}
              </span>
            </div>

            {upcomingBills.length === 0 ? (
              <div className="bills-empty-state">
                <div className="empty-circle-icon">
                  <FiCheckCircle />
                </div>
                <h3>No upcoming bills</h3>
                <p>
                  You have no pending bills. Click below to add regular utility
                  bills, rent, or subscriptions.
                </p>
                <button
                  type="button"
                  className="empty-action-btn"
                  onClick={() => openAddModal("expense")}
                >
                  <FiPlus /> Add Recurring Bill
                </button>
              </div>
            ) : (
              <div className="upcoming-bills-grid">
                {upcomingBills.map((bill) => {
                  const status = bill.billStatus || "Upcoming";
                  const isOverdue = status === "Overdue";
                  const isDueToday = status === "Due Today";

                  return (
                    <div
                      key={bill._id}
                      className={`bill-card-item ${
                        isOverdue ? "overdue-item" : isDueToday ? "due-today-item" : ""
                      }`}
                    >
                      <div className="bill-card-top">
                        <div className="bill-title-col">
                          <h4>{bill.title}</h4>
                          <span className="bill-category-chip">
                            <FiTag /> {bill.category}
                          </span>
                        </div>
                        <span
                          className={`bill-status-badge ${
                            isOverdue
                              ? "overdue"
                              : isDueToday
                              ? "due-today"
                              : "upcoming"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="bill-card-middle">
                        <div className="bill-amount-wrap">
                          <span className="amount-label">Amount</span>
                          <strong className="bill-amount-display">
                            {formatINR(bill.amount)}
                          </strong>
                        </div>
                        <div className="bill-due-wrap">
                          <span className="due-label">
                            <FiCalendar /> Due Date
                          </span>
                          <span className="due-date-val">
                            {formatDisplayDate(bill.nextDueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="bill-card-footer">
                        <span className="frequency-pill">
                          <FiRepeat /> {bill.frequency}
                        </span>

                        <button
                          type="button"
                          className="mark-paid-action-btn"
                          onClick={() => setPayingBill(bill)}
                        >
                          <FiCheck /> Mark as Paid
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================= SECTION 2: RECURRING TRANSACTIONS LIST ================= */}
          <div className="recurring-section-container recurring-list-section">
            <div className="section-header-row table-header-row">
              <div className="section-title-wrap">
                <span className="section-label">ALL SCHEDULES</span>
                <h2>Recurring Transactions</h2>
                <p>Manage, pause, edit, or delete active recurrence schedules.</p>
              </div>

              {/* FILTER TABS */}
              <div className="recurring-tabs">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All ({schedules.length})
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
                  onClick={() => setActiveTab("active")}
                >
                  Active ({overview.activeExpenseCount + overview.activeIncomeCount})
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "expense" ? "active" : ""}`}
                  onClick={() => setActiveTab("expense")}
                >
                  Bills & Expenses
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "income" ? "active" : ""}`}
                  onClick={() => setActiveTab("income")}
                >
                  Income ({overview.activeIncomeCount})
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "paused" ? "active" : ""}`}
                  onClick={() => setActiveTab("paused")}
                >
                  Paused ({overview.pausedCount})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="recurring-loading-state">
                <FiLoader className="spin-animation" />
                <p>Loading recurring schedules...</p>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="recurring-empty-state">
                <FiRepeat className="empty-table-icon" />
                <h3>No recurring schedules found</h3>
                <p>
                  {search
                    ? "No schedules match your search query."
                    : activeTab !== "all"
                    ? `No schedules in the "${activeTab}" filter.`
                    : "Create your first recurring payment to automate tracking."}
                </p>
                <button
                  type="button"
                  className="empty-action-btn"
                  onClick={() => openAddModal("expense")}
                >
                  <FiPlus /> Create Schedule
                </button>
              </div>
            ) : (
              <div className="recurring-table-wrapper">
                <table className="recurring-table">
                  <thead>
                    <tr>
                      <th>Schedule / Title</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Frequency</th>
                      <th>Amount</th>
                      <th>Next Due Date</th>
                      <th>Status</th>
                      <th>Reminders</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedules.map((schedule) => {
                      const isIncome = schedule.type === "income";
                      const isPaused = schedule.status === "paused";

                      return (
                        <tr
                          key={schedule._id}
                          className={isPaused ? "row-paused" : ""}
                        >
                          {/* Title */}
                          <td className="col-title">
                            <div className="schedule-name-cell">
                              <div
                                className={`type-dot ${
                                  isIncome ? "income-dot" : "expense-dot"
                                }`}
                              />
                              <div>
                                <strong>{schedule.title}</strong>
                                {schedule.description && (
                                  <span className="cell-sub">
                                    {schedule.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td>
                            <span
                              className={`type-tag ${
                                isIncome ? "income-tag" : "expense-tag"
                              }`}
                            >
                              {isIncome ? "Income" : "Expense"}
                            </span>
                          </td>

                          {/* Category */}
                          <td>
                            <span className="category-cell-pill">
                              {schedule.category}
                            </span>
                          </td>

                          {/* Frequency */}
                          <td>
                            <span className="frequency-cell-text">
                              {schedule.frequency.charAt(0).toUpperCase() +
                                schedule.frequency.slice(1)}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="col-amount">
                            <strong
                              style={{
                                color: isIncome ? "#10b981" : "#111827",
                              }}
                            >
                              {isIncome ? "+" : "-"}
                              {formatINR(schedule.amount)}
                            </strong>
                          </td>

                          {/* Next Due Date */}
                          <td>
                            <div className="due-cell">
                              <FiCalendar />
                              <span>
                                {formatDisplayDate(schedule.nextDueDate)}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            <span
                              className={`status-pill ${
                                schedule.status === "active"
                                  ? "status-active"
                                  : schedule.status === "paused"
                                  ? "status-paused"
                                  : "status-completed"
                              }`}
                            >
                              {schedule.status}
                            </span>
                          </td>

                          {/* Reminder */}
                          <td>
                            <span className="reminder-text">
                              <FiBell />
                              {schedule.reminderDaysBefore === 0
                                ? "On due date"
                                : `${schedule.reminderDaysBefore}d before`}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="col-actions">
                            <div className="actions-btn-group">
                              {/* Pause / Resume */}
                              <button
                                type="button"
                                className={`action-icon-btn ${
                                  isPaused ? "resume-btn" : "pause-btn"
                                }`}
                                onClick={() => handleTogglePause(schedule)}
                                title={
                                  isPaused
                                    ? "Resume Schedule"
                                    : "Pause Schedule"
                                }
                              >
                                {isPaused ? <FiPlay /> : <FiPause />}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                className="action-icon-btn edit-btn"
                                onClick={() => openEditModal(schedule)}
                                title="Edit Schedule"
                              >
                                <FiEdit2 />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                className="action-icon-btn delete-btn"
                                onClick={() => setDeletingSchedule(schedule)}
                                title="Delete Schedule"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ================= SECTION 3: NOTIFICATION & REMINDER PREFERENCES ================= */}
          <div className="recurring-section-container notification-preferences-card">
            <div className="pref-left">
              <div className="pref-icon">
                <FiBell />
              </div>
              <div className="pref-info">
                <h3>In-App Reminders & Due Bill Alerts</h3>
                <p>
                  MoneyMate automatically checks upcoming bills and alerts you in
                  the topbar notification bell before bills are due. Configured
                  reminders avoid missed deadlines and prevent duplicate alerts.
                </p>
              </div>
            </div>
            <div className="pref-right">
              <span className="pref-status-pill">
                <FiCheckCircle /> Reminders Active
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ================= MODALS ================= */}
      <AddEditRecurringModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={handleModalSubmit}
        editingSchedule={editingSchedule}
        initialType={modalType}
      />

      <DeleteRecurringModal
        isOpen={Boolean(deletingSchedule)}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={handleConfirmDelete}
        scheduleTitle={deletingSchedule?.title}
        isDeleting={isDeleting}
      />

      <MarkPaidModal
        isOpen={Boolean(payingBill)}
        onClose={() => setPayingBill(null)}
        onConfirm={handleConfirmMarkPaid}
        bill={payingBill}
        isSubmitting={isPaying}
      />
    </div>
  );
}
