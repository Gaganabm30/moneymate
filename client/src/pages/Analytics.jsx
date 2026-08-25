import "../styles/analytics.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPieChart,
  FiArrowUpRight,
  FiArrowDownRight
} from "react-icons/fi";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { useMemo, useState } from "react";

export default function Analytics() {

  const [period, setPeriod] = useState("6");

  /* ---------------------------------------------
     DEMO ANALYTICS DATA
     Later this will come from MongoDB/API.
  --------------------------------------------- */

  const monthlyData = {
    "6": [
      { month: "Mar", income: 43000, expense: 21000 },
      { month: "Apr", income: 47000, expense: 23500 },
      { month: "May", income: 49000, expense: 22000 },
      { month: "Jun", income: 51000, expense: 26000 },
      { month: "Jul", income: 48000, expense: 23000 },
      { month: "Aug", income: 52000, expense: 24000 }
    ],

    "3": [
      { month: "Jun", income: 51000, expense: 26000 },
      { month: "Jul", income: 48000, expense: 23000 },
      { month: "Aug", income: 52000, expense: 24000 }
    ],

    "12": [
      { month: "Sep", income: 39000, expense: 20000 },
      { month: "Oct", income: 41000, expense: 21500 },
      { month: "Nov", income: 42000, expense: 22000 },
      { month: "Dec", income: 45000, expense: 24000 },
      { month: "Jan", income: 44000, expense: 21000 },
      { month: "Feb", income: 46000, expense: 22500 },
      { month: "Mar", income: 43000, expense: 21000 },
      { month: "Apr", income: 47000, expense: 23500 },
      { month: "May", income: 49000, expense: 22000 },
      { month: "Jun", income: 51000, expense: 26000 },
      { month: "Jul", income: 48000, expense: 23000 },
      { month: "Aug", income: 52000, expense: 24000 }
    ]
  };

  const categoryData = [
    {
      name: "Food",
      value: 7200
    },
    {
      name: "Housing",
      value: 6500
    },
    {
      name: "Transport",
      value: 3800
    },
    {
      name: "Entertainment",
      value: 2700
    },
    {
      name: "Shopping",
      value: 2200
    },
    {
      name: "Others",
      value: 1600
    }
  ];

  const chartData = monthlyData[period];

  /* ---------------------------------------------
     CALCULATIONS
  --------------------------------------------- */

  const analytics = useMemo(() => {

    const income = chartData.reduce(
      (sum, item) => sum + item.income,
      0
    );

    const expense = chartData.reduce(
      (sum, item) => sum + item.expense,
      0
    );

    const savings = income - expense;

    const savingsRate =
      income > 0
        ? Math.round((savings / income) * 100)
        : 0;

    const averageExpense =
      chartData.length > 0
        ? Math.round(expense / chartData.length)
        : 0;

    return {
      income,
      expense,
      savings,
      savingsRate,
      averageExpense
    };

  }, [chartData]);

  const totalCategoryExpense = categoryData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const pieColors = [
    "#635BFF",
    "#4285F4",
    "#F59E0B",
    "#E75B91",
    "#16A36A",
    "#94A3B8"
  ];

  return (
    <div className="analytics-page">

      <Sidebar />

      <main className="analytics-main">

        <Topbar />

        <section className="analytics-content">

          {/* HEADER */}

          <div className="analytics-header">

            <div>
              <p className="analytics-eyebrow">
                FINANCIAL ANALYSIS
              </p>

              <h1>Analytics</h1>

              <p>
                Understand your money, spending patterns,
                and financial progress.
              </p>
            </div>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="analytics-period"
            >
              <option value="3">
                Last 3 months
              </option>

              <option value="6">
                Last 6 months
              </option>

              <option value="12">
                Last 12 months
              </option>
            </select>

          </div>

          {/* STAT CARDS */}

          <div className="analytics-stats">

            <div className="analytics-stat-card">

              <div className="analytics-stat-icon income">
                <FiTrendingUp />
              </div>

              <div>
                <span>Total Income</span>

                <h2>
                  ₹{analytics.income.toLocaleString("en-IN")}
                </h2>

                <small>
                  <FiArrowUpRight />
                  Money received
                </small>
              </div>

            </div>

            <div className="analytics-stat-card">

              <div className="analytics-stat-icon expense">
                <FiTrendingDown />
              </div>

              <div>
                <span>Total Expenses</span>

                <h2>
                  ₹{analytics.expense.toLocaleString("en-IN")}
                </h2>

                <small className="expense-small">
                  <FiArrowDownRight />
                  Money spent
                </small>
              </div>

            </div>

            <div className="analytics-stat-card">

              <div className="analytics-stat-icon savings">
                <FiDollarSign />
              </div>

              <div>
                <span>Total Savings</span>

                <h2>
                  ₹{analytics.savings.toLocaleString("en-IN")}
                </h2>

                <small>
                  {analytics.savingsRate}% savings rate
                </small>
              </div>

            </div>

            <div className="analytics-stat-card">

              <div className="analytics-stat-icon average">
                <FiPieChart />
              </div>

              <div>
                <span>Avg. Monthly Expense</span>

                <h2>
                  ₹{analytics.averageExpense.toLocaleString("en-IN")}
                </h2>

                <small>
                  Based on selected period
                </small>
              </div>

            </div>

          </div>

          {/* INCOME VS EXPENSE */}

          <div className="analytics-main-grid">

            <div className="analytics-chart-card">

              <div className="analytics-card-header">

                <div>
                  <span>FINANCIAL TREND</span>

                  <h2>
                    Income vs Expenses
                  </h2>
                </div>

                <div className="chart-legend">

                  <span>
                    <i className="income-dot" />
                    Income
                  </span>

                  <span>
                    <i className="expense-dot" />
                    Expenses
                  </span>

                </div>

              </div>

              <div className="analytics-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart data={chartData}>

                    <defs>

                      <linearGradient
                        id="incomeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#635BFF"
                          stopOpacity={0.25}
                        />

                        <stop
                          offset="100%"
                          stopColor="#635BFF"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      <linearGradient
                        id="expenseGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#F59E0B"
                          stopOpacity={0.2}
                        />

                        <stop
                          offset="100%"
                          stopColor="#F59E0B"
                          stopOpacity={0}
                        />
                      </linearGradient>

                    </defs>

                    <CartesianGrid
                      stroke="#eef0f6"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8b93a3",
                        fontSize: 12
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8b93a3",
                        fontSize: 11
                      }}
                      tickFormatter={(value) =>
                        `₹${value / 1000}k`
                      }
                    />

                    <Tooltip
                      formatter={(value) =>
                        `₹${value.toLocaleString("en-IN")}`
                      }
                      contentStyle={{
                        border: "none",
                        borderRadius: "12px",
                        boxShadow:
                          "0 10px 30px rgba(0,0,0,.08)"
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#635BFF"
                      strokeWidth={3}
                      fill="url(#incomeGradient)"
                    />

                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      fill="url(#expenseGradient)"
                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>

            </div>

            {/* CATEGORY BREAKDOWN */}

            <div className="analytics-chart-card category-card">

              <div className="analytics-card-header">

                <div>
                  <span>SPENDING ANALYSIS</span>

                  <h2>
                    Expense Categories
                  </h2>
                </div>

              </div>

              <div className="category-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <RechartsPieChart>

                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >

                      {categoryData.map(
                        (entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              pieColors[index]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        `₹${value.toLocaleString("en-IN")}`
                      }
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "11px"
                      }}
                    />

                  </RechartsPieChart>

                </ResponsiveContainer>

                <div className="category-center">

                  <strong>
                    ₹
                    {totalCategoryExpense.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <span>
                    Total
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* SAVINGS INSIGHT */}

          <div className="analytics-bottom-grid">

            <div className="savings-analysis-card">

              <div className="savings-analysis-header">

                <div>
                  <span>SAVINGS HEALTH</span>

                  <h2>
                    You're saving {analytics.savingsRate}%
                  </h2>
                </div>

                <div className="savings-score">
                  {analytics.savingsRate >= 30
                    ? "Excellent"
                    : analytics.savingsRate >= 20
                    ? "Good"
                    : "Needs attention"}
                </div>

              </div>

              <div className="savings-progress">

                <div
                  style={{
                    width: `${Math.min(
                      analytics.savingsRate,
                      100
                    )}%`
                  }}
                />

              </div>

              <p>
                Your income is currently higher than your
                expenses. Maintaining this trend can help
                you reach your financial goals faster.
              </p>

            </div>

            <div className="analytics-summary-card">

              <h3>
                Financial Summary
              </h3>

              <div className="summary-line">
                <span>Income</span>
                <strong>
                  ₹{analytics.income.toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="summary-line">
                <span>Expenses</span>
                <strong>
                  ₹{analytics.expense.toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="summary-line total">
                <span>Net Savings</span>
                <strong>
                  ₹{analytics.savings.toLocaleString("en-IN")}
                </strong>
              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}