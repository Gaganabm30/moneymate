import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiCheck,
  FiArrowRight,
  FiCheckCircle,
  FiPlus,
} from "react-icons/fi";
import {
  getUpcomingBills,
  markBillPaid,
} from "../../services/recurringService";

export default function UpcomingBills({ onActionSuccess }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUpcomingBills(4);
      setBills(data || []);
    } catch (err) {
      console.error("Failed to fetch upcoming bills for dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const handleQuickPay = async (bill) => {
    try {
      setPayingId(bill._id);
      await markBillPaid(bill._id);
      await loadBills();
      if (onActionSuccess) {
        onActionSuccess();
      }
    } catch (err) {
      console.error("Quick pay failed:", err);
    } finally {
      setPayingId(null);
    }
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(dateStr).slice(0, 10);
    }
  };

  return (
    <motion.div
      className="dashboard-card upcoming-bills-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <div className="card-header-clean">
        <div>
          <span className="section-label">REMINDERS</span>
          <h3>Upcoming Bills</h3>
        </div>
        <Link to="/recurring" className="view-all-link">
          View All <FiArrowRight />
        </Link>
      </div>

      <div className="bills-list">
        {loading ? (
          <div className="bills-widget-loading">
            <span className="loading-dot" /> Loading bills...
          </div>
        ) : bills.length === 0 ? (
          <div className="bills-widget-empty">
            <FiCheckCircle className="empty-check-icon" />
            <p>No bills due right now!</p>
            <Link to="/recurring" className="widget-add-link">
              <FiPlus /> Add a recurring bill
            </Link>
          </div>
        ) : (
          bills.map((b) => {
            const status = b.statusBadge || "Upcoming";
            const isOverdue = status === "Overdue";
            const isDueToday = status === "Due Today";
            const isPaying = payingId === b._id;

            return (
              <div
                key={b._id}
                className={`bill-row-item ${
                  isOverdue ? "overdue-row" : isDueToday ? "today-row" : ""
                }`}
              >
                <div
                  className={`bill-left-icon ${
                    isOverdue
                      ? "overdue-icon"
                      : isDueToday
                      ? "today-icon"
                      : "normal-icon"
                  }`}
                >
                  <FiCalendar />
                </div>

                <div className="bill-details">
                  <h4>{b.title}</h4>
                  <span>
                    {b.category} • Due {formatDueDate(b.nextDueDate)}
                  </span>
                </div>

                <div className="bill-right-group">
                  <strong className="bill-amount">
                    ₹{Number(b.amount).toLocaleString("en-IN")}
                  </strong>
                  <button
                    type="button"
                    className={`bill-pay-btn ${
                      isOverdue ? "btn-overdue" : ""
                    }`}
                    onClick={() => handleQuickPay(b)}
                    disabled={isPaying}
                    title="Mark this bill as paid"
                  >
                    <FiCheck /> {isPaying ? "..." : "Pay"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
