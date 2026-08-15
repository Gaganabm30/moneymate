import "../styles/transactions.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiEdit2,
  FiTrash2,
  FiCalendar
} from "react-icons/fi";

import { useState } from "react";

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const transactions = [
    {
      id: 1,
      title: "Salary",
      category: "Income",
      date: "15 Aug 2026",
      amount: 52000,
      type: "income",
      icon: <FiArrowDownLeft />
    },
    {
      id: 2,
      title: "Groceries",
      category: "Food",
      date: "14 Aug 2026",
      amount: 2450,
      type: "expense",
      icon: <FiArrowUpRight />
    },
    {
      id: 3,
      title: "Netflix",
      category: "Entertainment",
      date: "12 Aug 2026",
      amount: 649,
      type: "expense",
      icon: <FiArrowUpRight />
    },
    {
      id: 4,
      title: "Freelance Project",
      category: "Income",
      date: "10 Aug 2026",
      amount: 8500,
      type: "income",
      icon: <FiArrowDownLeft />
    }
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.title.toLowerCase().includes(search.toLowerCase()) ||
      transaction.category.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" || transaction.type === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="transactions-page">

      <Sidebar />

      <main className="transactions-main">

        <Topbar />

        <section className="transactions-content">

          {/* HEADER */}
          <div className="transactions-header">

            <div>
              <p className="transactions-eyebrow">
                MONEY MANAGEMENT
              </p>

              <h1>Transactions</h1>

              <p>
                Track your income and expenses in one place.
              </p>
            </div>

            <button className="add-transaction-btn">
              <FiPlus />
              Add Transaction
            </button>

          </div>

          {/* SUMMARY */}
          <div className="transaction-summary">

            <div className="transaction-summary-card">
              <span>Total Income</span>
              <strong className="income-text">
                ₹52,000
              </strong>
              <small>This month</small>
            </div>

            <div className="transaction-summary-card">
              <span>Total Expenses</span>
              <strong className="expense-text">
                ₹24,000
              </strong>
              <small>This month</small>
            </div>

            <div className="transaction-summary-card">
              <span>Net Balance</span>
              <strong>
                ₹28,000
              </strong>
              <small>Available balance</small>
            </div>

          </div>

          {/* TRANSACTIONS CARD */}
          <div className="transactions-card">

            <div className="transactions-toolbar">

              <div className="transaction-search">

                <FiSearch />

                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

              </div>

              <div className="transaction-filters">

                <button
                  className={filter === "all" ? "active" : ""}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>

                <button
                  className={filter === "income" ? "active" : ""}
                  onClick={() => setFilter("income")}
                >
                  Income
                </button>

                <button
                  className={filter === "expense" ? "active" : ""}
                  onClick={() => setFilter("expense")}
                >
                  Expenses
                </button>

                <button className="filter-btn">
                  <FiFilter />
                  Filter
                </button>

              </div>

            </div>

            {/* TABLE HEADER */}
            <div className="transactions-table-header">

              <span>Transaction</span>
              <span>Category</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Actions</span>

            </div>

            {/* TRANSACTIONS */}
            <div className="transactions-list">

              {filteredTransactions.length > 0 ? (

                filteredTransactions.map((transaction) => (

                  <div
                    className="transaction-row"
                    key={transaction.id}
                  >

                    <div className="transaction-name">

                      <div
                        className={`transaction-icon ${transaction.type}`}
                      >
                        {transaction.icon}
                      </div>

                      <div>
                        <strong>
                          {transaction.title}
                        </strong>

                        <span>
                          Transaction #{transaction.id}
                        </span>
                      </div>

                    </div>

                    <div className="transaction-category">
                      {transaction.category}
                    </div>

                    <div className="transaction-date">
                      <FiCalendar />
                      {transaction.date}
                    </div>

                    <div
                      className={`transaction-amount ${transaction.type}`}
                    >
                      {transaction.type === "income"
                        ? "+"
                        : "-"}
                      ₹{transaction.amount.toLocaleString("en-IN")}
                    </div>

                    <div className="transaction-actions">

                      <button title="Edit">
                        <FiEdit2 />
                      </button>

                      <button
                        title="Delete"
                        className="delete-btn"
                      >
                        <FiTrash2 />
                      </button>

                    </div>

                  </div>

                ))

              ) : (

                <div className="empty-transactions">

                  <div className="empty-icon">
                    <FiSearch />
                  </div>

                  <h3>No transactions found</h3>

                  <p>
                    Try changing your search or filters.
                  </p>

                </div>

              )}

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}