import "../styles/budgets.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiShoppingBag,
  FiHome,
  FiTruck,
  FiHeart,
  FiFilm,
  FiMoreHorizontal,
  FiAlertCircle,
  FiCheckCircle
} from "react-icons/fi";

import { useState } from "react";

export default function Budgets() {
  const [filter, setFilter] = useState("all");

  const budgets = [
    {
      id: 1,
      name: "Food & Dining",
      category: "Food",
      icon: <FiShoppingBag />,
      limit: 8000,
      spent: 5200,
      color: "purple"
    },
    {
      id: 2,
      name: "Rent & Housing",
      category: "Housing",
      icon: <FiHome />,
      limit: 15000,
      spent: 12000,
      color: "blue"
    },
    {
      id: 3,
      name: "Transportation",
      category: "Transport",
      icon: <FiTruck />,
      limit: 5000,
      spent: 2800,
      color: "orange"
    },
    {
      id: 4,
      name: "Health & Fitness",
      category: "Health",
      icon: <FiHeart />,
      limit: 4000,
      spent: 1200,
      color: "green"
    },
    {
      id: 5,
      name: "Entertainment",
      category: "Entertainment",
      icon: <FiFilm />,
      limit: 3000,
      spent: 2700,
      color: "pink"
    }
  ];

  const filteredBudgets =
    filter === "all"
      ? budgets
      : budgets.filter(
          (budget) => budget.category.toLowerCase() === filter
        );

  const totalLimit = budgets.reduce(
    (sum, budget) => sum + budget.limit,
    0
  );

  const totalSpent = budgets.reduce(
    (sum, budget) => sum + budget.spent,
    0
  );

  const remaining = totalLimit - totalSpent;

  const overallPercentage =
    totalLimit > 0
      ? Math.round((totalSpent / totalLimit) * 100)
      : 0;

  return (
    <div className="budgets-page">

      <Sidebar />

      <main className="budgets-main">

        <Topbar />

        <section className="budgets-content">

          {/* HEADER */}

          <div className="budgets-header">

            <div>
              <p className="budgets-eyebrow">
                MONEY MANAGEMENT
              </p>

              <h1>Budgets</h1>

              <p>
                Set spending limits and stay in control of
                your monthly expenses.
              </p>
            </div>

            <button className="add-budget-btn">
              <FiPlus />
              Create Budget
            </button>

          </div>

          {/* MONTH SELECTOR */}

          <div className="budget-period">

            <div>
              <strong>August 2026</strong>
              <span>Monthly budget overview</span>
            </div>

            <select defaultValue="August 2026">
              <option>August 2026</option>
              <option>July 2026</option>
              <option>June 2026</option>
              <option>May 2026</option>
            </select>

          </div>

          {/* SUMMARY */}

          <div className="budget-summary-grid">

            <div className="budget-summary-card">

              <div className="summary-label">
                Total Budget
              </div>

              <strong>
                ₹{totalLimit.toLocaleString("en-IN")}
              </strong>

              <span>
                Monthly spending limit
              </span>

            </div>

            <div className="budget-summary-card">

              <div className="summary-label">
                Total Spent
              </div>

              <strong className="spent-value">
                ₹{totalSpent.toLocaleString("en-IN")}
              </strong>

              <span>
                {overallPercentage}% of budget used
              </span>

            </div>

            <div className="budget-summary-card">

              <div className="summary-label">
                Remaining
              </div>

              <strong className="remaining-value">
                ₹{remaining.toLocaleString("en-IN")}
              </strong>

              <span>
                Available to spend
              </span>

            </div>

          </div>

          {/* OVERALL PROGRESS */}

          <div className="overall-budget-card">

            <div className="overall-budget-header">

              <div>
                <span>Overall monthly budget</span>

                <h2>
                  ₹{totalSpent.toLocaleString("en-IN")}
                  <small>
                    {" "}
                    / ₹{totalLimit.toLocaleString("en-IN")}
                  </small>
                </h2>
              </div>

              <strong>
                {overallPercentage}%
              </strong>

            </div>

            <div className="overall-progress">
              <div
                className="overall-progress-fill"
                style={{
                  width: `${Math.min(overallPercentage, 100)}%`
                }}
              />
            </div>

            <p>
              You have ₹
              {remaining.toLocaleString("en-IN")} remaining
              across all your budgets.
            </p>

          </div>

          {/* FILTER */}

          <div className="budgets-toolbar">

            <div>
              <h2>Your Budgets</h2>
              <p>
                Manage your category-wise spending limits.
              </p>
            </div>

            <div className="budget-filters">

              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                className={filter === "food" ? "active" : ""}
                onClick={() => setFilter("food")}
              >
                Food
              </button>

              <button
                className={filter === "housing" ? "active" : ""}
                onClick={() => setFilter("housing")}
              >
                Housing
              </button>

              <button
                className={filter === "transport" ? "active" : ""}
                onClick={() => setFilter("transport")}
              >
                Transport
              </button>

            </div>

          </div>

          {/* BUDGET GRID */}

          <div className="budgets-grid">

            {filteredBudgets.map((budget) => {

              const percentage =
                Math.round(
                  (budget.spent / budget.limit) * 100
                );

              const remainingAmount =
                budget.limit - budget.spent;

              const isWarning = percentage >= 80;
              const isExceeded = percentage >= 100;

              return (
                <div
                  className="budget-card"
                  key={budget.id}
                >

                  <div className="budget-card-top">

                    <div className={`budget-icon ${budget.color}`}>
                      {budget.icon}
                    </div>

                    <button className="budget-menu">
                      <FiMoreHorizontal />
                    </button>

                  </div>

                  <div className="budget-card-title">

                    <div>
                      <h3>{budget.name}</h3>

                      <span>
                        {budget.category}
                      </span>
                    </div>

                  </div>

                  <div className="budget-amounts">

                    <div>
                      <span>Spent</span>

                      <strong>
                        ₹{budget.spent.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div>
                      <span>Limit</span>

                      <strong>
                        ₹{budget.limit.toLocaleString("en-IN")}
                      </strong>
                    </div>

                  </div>

                  <div className="budget-progress">

                    <div className="budget-progress-track">

                      <div
                        className={`budget-progress-fill ${
                          isExceeded
                            ? "danger"
                            : isWarning
                            ? "warning"
                            : ""
                        }`}
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`
                        }}
                      />

                    </div>

                    <span>
                      {percentage}%
                    </span>

                  </div>

                  <div
                    className={`budget-status ${
                      isExceeded
                        ? "danger"
                        : isWarning
                        ? "warning"
                        : "safe"
                    }`}
                  >

                    {isExceeded ? (
                      <>
                        <FiAlertCircle />
                        Budget exceeded
                      </>
                    ) : isWarning ? (
                      <>
                        <FiAlertCircle />
                        Nearing your limit
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        ₹
                        {remainingAmount.toLocaleString(
                          "en-IN"
                        )}{" "}
                        remaining
                      </>
                    )}

                  </div>

                  <div className="budget-card-actions">

                    <button>
                      <FiEdit2 />
                      Edit
                    </button>

                    <button className="delete-budget">
                      <FiTrash2 />
                      Delete
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

          {/* EMPTY STATE */}

          {filteredBudgets.length === 0 && (
            <div className="empty-budget">

              <FiMoreHorizontal />

              <h3>No budgets found</h3>

              <p>
                Create a budget to start tracking your
                spending.
              </p>

              <button className="add-budget-btn">
                <FiPlus />
                Create Budget
              </button>

            </div>
          )}

        </section>

      </main>

    </div>
  );
}