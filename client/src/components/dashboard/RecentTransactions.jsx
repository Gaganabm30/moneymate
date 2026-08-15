import { Link } from "react-router-dom";
import {
  FiShoppingBag,
  FiCoffee,
  FiHome,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownRight,
  FiSearch,
  FiPlus,
  FiFileText,
  FiTag,
  FiEdit2,
  FiTrash2
} from "react-icons/fi";

const getCategoryIcon = (category, isIncome) => {
  const cat = (category || "").toLowerCase();
  if (isIncome) return <FiArrowUpRight />;
  if (cat.includes("food") || cat.includes("grocer") || cat.includes("dining")) return <FiCoffee />;
  if (cat.includes("shop")) return <FiShoppingBag />;
  if (cat.includes("rent") || cat.includes("hous")) return <FiHome />;
  if (cat.includes("bill") || cat.includes("util")) return <FiFileText />;
  if (cat.includes("card") || cat.includes("bank")) return <FiCreditCard />;
  return <FiTag />;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch (e) {
    return "Recent";
  }
};

export default function RecentTransactions({
  searchQuery = "",
  transactions = [],
  onAddTransactionClick,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const hasTransactions = transactions && transactions.length > 0;

  const filtered = (transactions || []).filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = (t.description || t.title || "").toLowerCase();
    const category = (t.category || "").toLowerCase();
    return title.includes(q) || category.includes(q);
  });

  return (
    <div className="recent-transactions">
      <div className="transactions-header">
        <div>
          <span className="section-label">ACTIVITY</span>
          <h3>Recent Transactions</h3>
        </div>

        {hasTransactions && (
          <Link to="/transactions" className="view-all-btn">
            View All
          </Link>
        )}
      </div>

      <div className="transaction-list">
        {!hasTransactions ? (
          <div className="transactions-empty-state">
            <div className="empty-icon-circle">
              <FiFileText />
            </div>
            <h4>No transactions yet</h4>
            <p>Your transactions will appear here once you add them.</p>
            {onAddTransactionClick && (
              <button
                type="button"
                className="empty-add-btn"
                onClick={onAddTransactionClick}
              >
                <FiPlus /> Add Transaction
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="no-transactions-found">
            <FiSearch />
            <p>No transactions matching "{searchQuery}"</p>
          </div>
        ) : (
          filtered.slice(0, 8).map((transaction, idx) => {
            const isIncome =
              transaction.type
                ? transaction.type === "income"
                : Number(transaction.amount) > 0;
            const amt = Math.abs(Number(transaction.amount) || 0);
            const title =
              transaction.description ||
              transaction.title ||
              transaction.category ||
              "Transaction";

            return (
              <div
                className="transaction-item"
                key={transaction._id || transaction.id || idx}
              >
                <div
                  className={`transaction-icon ${
                    isIncome ? "income-icon" : "expense-icon"
                  }`}
                >
                  {getCategoryIcon(transaction.category, isIncome)}
                </div>

                <div className="transaction-details">
                  <h4>{title}</h4>
                  <span>
                    {transaction.category || "General"} •{" "}
                    {formatDate(transaction.date || transaction.createdAt)}
                  </span>
                </div>

                <div className="transaction-right-group">
                  <div
                    className={`transaction-amount ${
                      isIncome ? "income-amount" : "expense-amount"
                    }`}
                  >
                    {isIncome ? <FiArrowUpRight /> : <FiArrowDownRight />}
                    ₹{amt.toLocaleString("en-IN")}
                  </div>

                  <div className="transaction-item-actions">
                    {onEditTransaction && (
                      <button
                        type="button"
                        className="tx-action-btn edit"
                        title="Edit transaction"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTransaction(transaction);
                        }}
                      >
                        <FiEdit2 />
                      </button>
                    )}
                    {onDeleteTransaction && (
                      <button
                        type="button"
                        className="tx-action-btn delete"
                        title="Delete transaction"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTransaction(transaction._id || transaction.id);
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}