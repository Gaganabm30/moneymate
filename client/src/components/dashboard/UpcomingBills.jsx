import { motion } from "framer-motion";
import { FiCalendar, FiAlertCircle, FiCheck } from "react-icons/fi";

const bills = [
  { id: 1, name: "Netflix Subscription", amount: 649, dueDate: "Aug 18", category: "Entertainment", status: "Due Soon" },
  { id: 2, name: "Electricity Bill", amount: 1240, dueDate: "Aug 20", category: "Utilities", status: "Upcoming" },
  { id: 3, name: "Broadband Internet", amount: 799, dueDate: "Aug 22", category: "Utilities", status: "Upcoming" },
];

export default function UpcomingBills() {
  return (
    <motion.div
      className="dashboard-card upcoming-bills-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <div className="card-header-clean">
        <div>
          <span className="section-label">REMINDERS</span>
          <h3>Upcoming Bills</h3>
        </div>
        <span className="bills-count-badge">3 Pending</span>
      </div>

      <div className="bills-list">
        {bills.map((b) => (
          <div key={b.id} className="bill-row-item">
            <div className="bill-left-icon">
              <FiCalendar />
            </div>

            <div className="bill-details">
              <h4>{b.name}</h4>
              <span>{b.category} • Due {b.dueDate}</span>
            </div>

            <div className="bill-right-group">
              <strong className="bill-amount">₹{b.amount.toLocaleString("en-IN")}</strong>
              <span className={`bill-status-pill ${b.status === "Due Soon" ? "due-soon" : ""}`}>
                {b.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
