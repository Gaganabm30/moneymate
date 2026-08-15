import "../styles/goals.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  FiPlus,
  FiTarget,
  FiHome,
  FiBriefcase,
  FiBookOpen,
  FiHeart,
  FiEdit2,
  FiTrash2,
  FiMoreHorizontal,
  FiCheckCircle,
  FiCalendar,
  FiTrendingUp
} from "react-icons/fi";

import { useState } from "react";

export default function Goals() {
  const [filter, setFilter] = useState("all");

  const goals = [
    {
      id: 1,
      title: "Emergency Fund",
      category: "Savings",
      icon: <FiTarget />,
      target: 100000,
      saved: 72000,
      deadline: "Dec 31, 2026",
      color: "purple"
    },
    {
      id: 2,
      title: "New Laptop",
      category: "Technology",
      icon: <FiBriefcase />,
      target: 85000,
      saved: 51000,
      deadline: "Oct 15, 2026",
      color: "blue"
    },
    {
      id: 3,
      title: "Vacation",
      category: "Travel",
      icon: <FiHome />,
      target: 60000,
      saved: 24000,
      deadline: "Dec 10, 2026",
      color: "orange"
    },
    {
      id: 4,
      title: "Higher Education",
      category: "Education",
      icon: <FiBookOpen />,
      target: 200000,
      saved: 90000,
      deadline: "Jun 30, 2027",
      color: "green"
    },
    {
      id: 5,
      title: "Health Fund",
      category: "Health",
      icon: <FiHeart />,
      target: 50000,
      saved: 35000,
      deadline: "Nov 30, 2026",
      color: "pink"
    }
  ];

  const filteredGoals =
    filter === "all"
      ? goals
      : goals.filter(
          (goal) => goal.category.toLowerCase() === filter
        );

  const totalTarget = goals.reduce(
    (sum, goal) => sum + goal.target,
    0
  );

  const totalSaved = goals.reduce(
    (sum, goal) => sum + goal.saved,
    0
  );

  const totalRemaining = totalTarget - totalSaved;

  const overallProgress =
    totalTarget > 0
      ? Math.round((totalSaved / totalTarget) * 100)
      : 0;

  return (
    <div className="goals-page">

      <Sidebar />

      <main className="goals-main">

        <Topbar />

        <section className="goals-content">

          {/* HEADER */}

          <div className="goals-header">

            <div>
              <p className="goals-eyebrow">
                FINANCIAL PLANNING
              </p>

              <h1>Your Financial Goals</h1>

              <p>
                Turn your plans into goals and track your
                progress step by step.
              </p>
            </div>

            <button className="add-goal-btn">
              <FiPlus />
              Create Goal
            </button>

          </div>

          {/* SUMMARY */}

          <div className="goals-summary-grid">

            <div className="goal-summary-card">

              <div className="goal-summary-icon purple">
                <FiTarget />
              </div>

              <div>
                <span>Total Goals</span>
                <strong>{goals.length}</strong>
                <small>Active financial goals</small>
              </div>

            </div>

            <div className="goal-summary-card">

              <div className="goal-summary-icon blue">
                <FiTrendingUp />
              </div>

              <div>
                <span>Total Saved</span>

                <strong>
                  ₹{totalSaved.toLocaleString("en-IN")}
                </strong>

                <small>
                  {overallProgress}% overall progress
                </small>
              </div>

            </div>

            <div className="goal-summary-card">

              <div className="goal-summary-icon orange">
                <FiTarget />
              </div>

              <div>
                <span>Remaining</span>

                <strong>
                  ₹{totalRemaining.toLocaleString("en-IN")}
                </strong>

                <small>
                  Amount needed to reach goals
                </small>
              </div>

            </div>

          </div>

          {/* OVERALL PROGRESS */}

          <div className="goals-overview">

            <div className="goals-overview-top">

              <div>
                <span>Overall Goal Progress</span>

                <h2>
                  ₹{totalSaved.toLocaleString("en-IN")}
                  <small>
                    {" "}
                    / ₹{totalTarget.toLocaleString("en-IN")}
                  </small>
                </h2>
              </div>

              <strong>
                {overallProgress}%
              </strong>

            </div>

            <div className="goals-overview-progress">

              <div
                style={{
                  width: `${overallProgress}%`
                }}
              />

            </div>

            <p>
              Keep saving consistently to reach your
              financial goals.
            </p>

          </div>

          {/* GOALS TOOLBAR */}

          <div className="goals-toolbar">

            <div>
              <h2>Your Goals</h2>

              <p>
                Monitor your progress and stay motivated.
              </p>
            </div>

            <div className="goal-filters">

              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                className={filter === "savings" ? "active" : ""}
                onClick={() => setFilter("savings")}
              >
                Savings
              </button>

              <button
                className={filter === "technology" ? "active" : ""}
                onClick={() => setFilter("technology")}
              >
                Technology
              </button>

              <button
                className={filter === "travel" ? "active" : ""}
                onClick={() => setFilter("travel")}
              >
                Travel
              </button>

            </div>

          </div>

          {/* GOALS GRID */}

          <div className="goals-grid">

            {filteredGoals.map((goal) => {

              const percentage =
                Math.round(
                  (goal.saved / goal.target) * 100
                );

              const remaining =
                goal.target - goal.saved;

              const completed = percentage >= 100;

              return (
                <div
                  className="goal-card"
                  key={goal.id}
                >

                  <div className="goal-card-top">

                    <div
                      className={`goal-icon ${goal.color}`}
                    >
                      {goal.icon}
                    </div>

                    <button className="goal-menu">
                      <FiMoreHorizontal />
                    </button>

                  </div>

                  <div className="goal-title">

                    <h3>{goal.title}</h3>

                    <span>{goal.category}</span>

                  </div>

                  <div className="goal-money">

                    <div>
                      <span>Saved</span>

                      <strong>
                        ₹{goal.saved.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div>
                      <span>Target</span>

                      <strong>
                        ₹{goal.target.toLocaleString("en-IN")}
                      </strong>
                    </div>

                  </div>

                  {/* PROGRESS */}

                  <div className="goal-progress-row">

                    <div className="goal-progress-track">

                      <div
                        className="goal-progress-fill"
                        style={{
                          width: `${Math.min(
                            percentage,
                            100
                          )}%`
                        }}
                      />

                    </div>

                    <strong>
                      {percentage}%
                    </strong>

                  </div>

                  {/* DEADLINE */}

                  <div className="goal-deadline">

                    <div>
                      <FiCalendar />

                      <span>Deadline</span>
                    </div>

                    <strong>
                      {goal.deadline}
                    </strong>

                  </div>

                  {/* STATUS */}

                  <div
                    className={`goal-status ${
                      completed
                        ? "completed"
                        : ""
                    }`}
                  >

                    <FiCheckCircle />

                    {completed
                      ? "Goal completed"
                      : `₹${remaining.toLocaleString(
                          "en-IN"
                        )} remaining`}

                  </div>

                  {/* ACTIONS */}

                  <div className="goal-actions">

                    <button>
                      <FiEdit2 />
                      Edit
                    </button>

                    <button className="delete-goal">
                      <FiTrash2 />
                      Delete
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

        </section>

      </main>

    </div>
  );
}