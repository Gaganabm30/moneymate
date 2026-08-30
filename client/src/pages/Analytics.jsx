import { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/analytics.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { useAuth } from "../context/AuthContext";
import { getTransactions } from "../services/transactionService";

import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPieChart,
  FiArrowUpRight,
  FiArrowDownRight,
  FiLayers,
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
  Legend,
} from "recharts";

const PIE_COLORS = [
  "#635BFF",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#10B981",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#64748B",
];

export default function Analytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("6"); // "3", "6", "12"
  const [transactions, setTransactions] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build Monthly Chart Data & Period Statistics
  const { chartData, analytics, categoryData, totalCategoryExpense, hasDataInPeriod } =
    useMemo(() => {
      const monthCount = parseInt(period, 10) || 6;
      const now = new Date();

      // Generate ordered months slots
      const months = [];
      const monthMap = {};

      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = d.toLocaleString("default", { month: "short" });
        const obj = {
          key,
          month: monthCount === 12 ? `${monthLabel} '${String(d.getFullYear()).slice(2)}` : monthLabel,
          income: 0,
          expense: 0,
          rawDate: d,
        };
        months.push(obj);
        monthMap[key] = obj;
      }

      // Cutoff date for period
      const startDate = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);
      startDate.setHours(0, 0, 0, 0);

      // Filter transactions within period
      const periodTransactions = transactions.filter((tx) => {
        if (!tx.date) return true;
        const txDate = new Date(tx.date);
        if (isNaN(txDate.getTime())) return true;
        return txDate >= startDate;
      });

      // Aggregate monthly income & expense
      const categoryMap = {};
      let totalIncome = 0;
      let totalExpense = 0;

      periodTransactions.forEach((tx) => {
        const amt = Math.abs(Number(tx.amount) || 0);
        const isIncome = tx.type === "income";

        if (isIncome) {
          totalIncome += amt;
        } else {
          totalExpense += amt;
          const cat = tx.category || "Other";
          categoryMap[cat] = (categoryMap[cat] || 0) + amt;
        }

        // Map to chart month
        if (tx.date) {
          const d = new Date(tx.date);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (monthMap[key]) {
              if (isIncome) {
                monthMap[key].income += amt;
              } else {
                monthMap[key].expense += amt;
              }
            }
          }
        }
      });

      // Category pie chart data
      const catData = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const totalCatExp = catData.reduce((sum, item) => sum + item.value, 0);

      const savings = totalIncome - totalExpense;
      const savingsRate =
        totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
      const averageExpense =
        monthCount > 0 ? Math.round(totalExpense / monthCount) : 0;

      const hasActivity = periodTransactions.length > 0;

      return {
        chartData: months,
        analytics: {
          income: totalIncome,
          expense: totalExpense,
          savings,
          savingsRate,
          averageExpense,
        },
        categoryData: catData,
        totalCategoryExpense: totalCatExp,
        hasDataInPeriod: hasActivity,
      };
    }, [transactions, period]);

  return (
    <div className="analytics-page">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="analytics-main">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() =>
            setIsMobileSidebarOpen(!isMobileSidebarOpen)
          }
          user={user}
        />

        <section className="analytics-content">
          {/* HEADER */}
          <div className="analytics-header">
            <div>
              <p className="analytics-eyebrow">FINANCIAL ANALYSIS</p>
              <h1>Analytics</h1>
              <p>Understand your money, spending patterns, and financial progress.</p>
            </div>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="analytics-period"
              aria-label="Select timeframe period"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
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
                <h2>₹{analytics.income.toLocaleString("en-IN")}</h2>
                <small>
                  <FiArrowUpRight />
                  In selected {period} months
                </small>
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-icon expense">
                <FiTrendingDown />
              </div>
              <div>
                <span>Total Expenses</span>
                <h2>₹{analytics.expense.toLocaleString("en-IN")}</h2>
                <small className="expense-small">
                  <FiArrowDownRight />
                  In selected {period} months
                </small>
              </div>
            </div>

            <div className="analytics-stat-card">
              <div className="analytics-stat-icon savings">
                <FiDollarSign />
              </div>
              <div>
                <span>Total Savings</span>
                <h2>₹{analytics.savings.toLocaleString("en-IN")}</h2>
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
                <h2>₹{analytics.averageExpense.toLocaleString("en-IN")}</h2>
                <small>Based on selected {period} months</small>
              </div>
            </div>
          </div>

          {/* INCOME VS EXPENSE & CATEGORY CHARTS */}
          <div className="analytics-main-grid">
            {/* AREA CHART */}
            <div className="analytics-chart-card">
              <div className="analytics-card-header">
                <div>
                  <span>FINANCIAL TREND</span>
                  <h2>Income vs Expenses</h2>
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
                {!hasDataInPeriod ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8c98a9",
                    }}
                  >
                    <FiLayers style={{ fontSize: "32px", marginBottom: "8px" }} />
                    <p style={{ margin: 0, fontSize: "14px" }}>No transaction activity in this period</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="analyticsIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#635BFF" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#635BFF" stopOpacity={0} />
                        </linearGradient>

                        <linearGradient id="analyticsExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid stroke="#eef0f6" vertical={false} />

                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8b93a3", fontSize: 12 }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8b93a3", fontSize: 11 }}
                        tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      />

                      <Tooltip
                        formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                        contentStyle={{
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 30px rgba(0,0,0,.08)",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#635BFF"
                        strokeWidth={3}
                        fill="url(#analyticsIncomeGradient)"
                      />

                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Expense"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        fill="url(#analyticsExpenseGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* CATEGORY BREAKDOWN */}
            <div className="analytics-chart-card category-card">
              <div className="analytics-card-header">
                <div>
                  <span>SPENDING ANALYSIS</span>
                  <h2>Expense Categories</h2>
                </div>
              </div>

              <div className="category-chart">
                {categoryData.length === 0 ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8c98a9",
                    }}
                  >
                    <FiPieChart style={{ fontSize: "32px", marginBottom: "8px" }} />
                    <p style={{ margin: 0, fontSize: "14px" }}>No expenses recorded in this period</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
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
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                        />

                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>

                    <div className="category-center">
                      <strong>₹{totalCategoryExpense.toLocaleString("en-IN")}</strong>
                      <span>Total</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SAVINGS INSIGHT */}
          <div className="analytics-bottom-grid">
            <div className="savings-analysis-card">
              <div className="savings-analysis-header">
                <div>
                  <span>SAVINGS HEALTH</span>
                  <h2>You're saving {analytics.savingsRate}%</h2>
                </div>

                <div className="savings-score">
                  {analytics.savingsRate >= 30
                    ? "Excellent"
                    : analytics.savingsRate >= 20
                    ? "Good"
                    : analytics.savingsRate > 0
                    ? "Moderate"
                    : "Needs attention"}
                </div>
              </div>

              <div className="savings-progress">
                <div
                  style={{
                    width: `${Math.max(0, Math.min(analytics.savingsRate, 100))}%`,
                  }}
                />
              </div>

              <p>
                {analytics.savings >= 0
                  ? "Your income is higher than your expenses for the selected timeframe. Keep maintaining positive cashflow to reach your goals faster."
                  : "Your expenses currently exceed your income for this timeframe. Review your spending categories to balance your cashflow."}
              </p>
            </div>

            <div className="analytics-summary-card">
              <h3>Financial Summary</h3>

              <div className="summary-line">
                <span>Income</span>
                <strong>₹{analytics.income.toLocaleString("en-IN")}</strong>
              </div>

              <div className="summary-line">
                <span>Expenses</span>
                <strong>₹{analytics.expense.toLocaleString("en-IN")}</strong>
              </div>

              <div className="summary-line total">
                <span>Net Savings</span>
                <strong style={{ color: analytics.savings >= 0 ? "#10b981" : "#ef4444" }}>
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