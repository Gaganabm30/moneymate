import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  FiRefreshCw,
  FiCpu,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiAlertTriangle,
  FiCheckCircle,
  FiSend,
  FiMessageSquare,
  FiPlusCircle,
  FiBarChart2,
} from "react-icons/fi";

import Layout from "../components/common/Layout";
import { getAIInsights, sendAIChatMessage } from "../services/aiService";

import "../styles/aiInsights.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "₹0";
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

function fmtPct(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0%";
  return `${num}%`;
}

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 5) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

function formatChatMessage(text) {
  if (!text) return "";
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// Category bar colours — cycle through a palette

const CATEGORY_COLORS = [
  "#635bff", "#8b5cf6", "#3b82f6", "#06b6d4",
  "#10b981", "#f59e0b", "#ef4444", "#ec4899",
];

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <div className="ai-skeleton-page">
      <div className="ai-skeleton-block ai-skeleton-health" />
      <div className="ai-skeleton-block ai-skeleton-summary" />
      <div className="ai-skeleton-metrics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ai-skeleton-block ai-skeleton-metric" />
        ))}
      </div>
      <div className="ai-skeleton-block ai-skeleton-card" />
      <div className="ai-skeleton-row">
        <div className="ai-skeleton-block ai-skeleton-half" />
        <div className="ai-skeleton-block ai-skeleton-half" />
      </div>
      <div className="ai-skeleton-block ai-skeleton-card" />
    </div>
  );
}

// ─── Health Score Ring ────────────────────────────────────────────────────────

function HealthRing({ score = 0 }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const colorClass =
    score >= 85
      ? "excellent"
      : score >= 70
      ? "good"
      : score >= 55
      ? "fair"
      : "poor";

  return (
    <svg
      className="ai-health-ring-svg"
      width={140}
      height={140}
      viewBox="0 0 140 140"
      aria-label={`Financial health score: ${score} out of 100`}
    >
      <circle className="ai-health-ring-bg" cx={70} cy={70} r={r} />
      <circle
        className={`ai-health-ring-fill ring-${colorClass}`}
        cx={70}
        cy={70}
        r={r}
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-month">{label}</p>
      {payload.map((item) => (
        <div className="tooltip-row" key={item.dataKey}>
          <span className="tooltip-legend-dot" style={{ backgroundColor: item.color }} />
          <span>{item.name}:</span>
          <strong>{fmt(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIInsights() {
  const navigate = useNavigate();

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Chart period for category breakdown
  const [categoryPeriod, setCategoryPeriod] = useState("current");
  // Chart period for trend
  const [trendPeriod, setTrendPeriod] = useState(6);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ── Load insights ──────────────────────────────────────────────────────────

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAIInsights();
      if (res?.success) {
        setInsights(res);
      } else {
        setError("We couldn't load your financial insights.");
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Your session expired. Please log in again.");
      } else {
        setError("We couldn't refresh your insights right now. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Scroll chat to bottom when new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // ── Chat submit & conversation handling ───────────────────────────────────

  const sendMessage = async (text) => {
    const msg = text?.trim();
    if (!msg || chatLoading) return;

    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Pass session history for conversational context and follow-up question understanding
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await sendAIChatMessage(msg, historyPayload);
      if (res?.success && res.answer) {
        setChatMessages((prev) => [
          ...prev,
          { role: "ai", text: res.answer },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "error",
            text: res?.message || "Sorry, I couldn't access your financial data right now.",
            retryText: msg,
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: "Sorry, I couldn't access your financial data right now.",
          retryText: msg,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = (e) => {
    e?.preventDefault();
    sendMessage(chatInput);
  };

  const handleSuggestedQuestion = (q) => {
    sendMessage(q);
  };

  // ── Category breakdown (period-filtered) ──────────────────────────────────

  const categoryData =
    categoryPeriod === "all"
      ? insights?.data?.allTimeCategoryBreakdown
      : insights?.data?.categoryBreakdown;

  // ── Trend data filtered by period ─────────────────────────────────────────

  const trendData = insights?.data?.monthlyTrends?.slice(-trendPeriod) ?? [];

  // ── Health score derived values ────────────────────────────────────────────

  const health = insights?.data?.healthScore ?? { score: 0, label: "—", description: "" };
  const colorClass =
    health.score >= 85
      ? "excellent"
      : health.score >= 70
      ? "good"
      : health.score >= 55
      ? "fair"
      : "poor";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Layout>
      {/* ── PAGE HEADER ── */}
      <div className="ai-page-header">
        <div className="ai-page-header-left">
          <div className="ai-eyebrow">
            <FiCpu size={13} />
            AI Financial Advisor
          </div>
          <h1>Smart Financial Insights</h1>
          <p>
            Understand your spending, discover patterns, and get personalised
            recommendations based on your financial activity.
          </p>
        </div>

        <div className="ai-header-right">
          <button
            id="ai-refresh-btn"
            type="button"
            className="ai-refresh-btn"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            aria-label="Refresh insights"
          >
            <FiRefreshCw
              size={15}
              className={loading ? "spinning" : ""}
            />
            {loading ? "Refreshing…" : "Refresh Insights"}
          </button>
          {insights?.data?.generatedAt && (
            <span className="ai-last-updated">
              Last updated: {timeAgo(insights.data.generatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* ── AI UNAVAILABLE BANNER ── */}
      {insights && !insights.aiAvailable && !loading && (
        <div className="ai-fallback-banner" role="alert">
          <FiAlertTriangle size={16} />
          AI natural-language summaries are unavailable. All financial statistics below are calculated directly from your data.
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && <SkeletonLoader />}

      {/* ── ERROR ── */}
      {!loading && error && (
        <div className="ai-error-state" role="alert">
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h3>Couldn't load insights</h3>
          <p>{error}</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <FiRefreshCw size={15} /> Try Again
          </button>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && !error && insights?.data?.hasData === false && (
        <div className="ai-empty-state">
          <div className="ai-empty-icon">🧠</div>
          <h2>Let's understand your money</h2>
          <p>
            Add a few transactions and MoneyMate AI will start identifying
            spending patterns, trends and personalised opportunities.
          </p>
          <div className="ai-empty-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/transactions")}
            >
              <FiPlusCircle size={15} /> Add Transaction
            </button>
            <button
              type="button"
              className="primary-button"
              style={{ background: "var(--surface-2)", color: "var(--primary)", boxShadow: "none", border: "1.5px solid var(--primary)" }}
              onClick={() => navigate("/budgets")}
            >
              <FiBarChart2 size={15} /> Create Budget
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT (only when data exists) ── */}
      {!loading && !error && insights?.data?.hasData && (
        <>
          {/* ── 1. FINANCIAL HEALTH SCORE ── */}
          <div className="ai-health-card" id="ai-health-card">
            <div className="ai-health-score-ring">
              <HealthRing score={health.score} />
              <div className="ai-health-score-text">
                <div className={`ai-health-score-number score-${colorClass}`}>
                  {health.score}
                </div>
                <div className="ai-health-score-of">/ 100</div>
              </div>
            </div>

            <div className="ai-health-info">
              <h3>Financial Health</h3>
              <div className="ai-health-label-row">
                <span className={`ai-health-label score-${colorClass}`}>
                  {health.label}
                </span>
                <span className={`ai-health-badge badge-${colorClass}`}>
                  {health.score >= 85
                    ? "🏆 Top Tier"
                    : health.score >= 70
                    ? "✅ On Track"
                    : health.score >= 55
                    ? "📊 Average"
                    : "🔴 Needs Work"}
                </span>
              </div>
              <p className="ai-health-description">{health.description}</p>

              <div className="ai-health-factors">
                <div className="ai-health-factor">
                  <span className="ai-health-factor-label">Monthly Income</span>
                  <span className="ai-health-factor-value">
                    {fmt(insights.data.metrics.totalIncome)}
                  </span>
                </div>
                <div className="ai-health-factor">
                  <span className="ai-health-factor-label">Monthly Expenses</span>
                  <span className="ai-health-factor-value">
                    {fmt(insights.data.metrics.totalExpenses)}
                  </span>
                </div>
                <div className="ai-health-factor">
                  <span className="ai-health-factor-label">Savings Rate</span>
                  <span className="ai-health-factor-value">
                    {fmtPct(insights.data.metrics.savingsRate)}
                  </span>
                </div>
                <div className="ai-health-factor">
                  <span className="ai-health-factor-label">Net Balance</span>
                  <span
                    className="ai-health-factor-value"
                    style={{
                      color:
                        insights.data.metrics.net >= 0
                          ? "var(--success)"
                          : "var(--danger)",
                    }}
                  >
                    {fmt(insights.data.metrics.net)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. FINANCIAL SUMMARY ── */}
          <div className="ai-summary-card" id="ai-summary-card">
            <div className="ai-summary-header">
              <div className="ai-summary-icon">🧠</div>
              <div>
                <div className="ai-summary-label">
                  {insights.aiAvailable ? "AI Analysis" : "Financial Summary"}
                </div>
                <div className="ai-summary-title">Your Financial Summary</div>
              </div>
            </div>
            <p className="ai-summary-text">{insights.data.summary}</p>
          </div>

          {/* ── 3. METRICS ROW ── */}
          <div className="ai-metrics-row">
            <div className="ai-metric-card">
              <div
                className="ai-metric-icon-wrap"
                style={{
                  background: "var(--success-alpha)",
                  color: "var(--success)",
                }}
              >
                <FiTrendingUp size={18} />
              </div>
              <div className="ai-metric-label">Total Income</div>
              <div className="ai-metric-value" style={{ color: "var(--success)" }}>
                {fmt(insights.data.allTimeMetrics.totalIncome)}
              </div>
              <div className="ai-metric-sub">All time</div>
            </div>

            <div className="ai-metric-card">
              <div
                className="ai-metric-icon-wrap"
                style={{
                  background: "var(--danger-alpha)",
                  color: "var(--danger)",
                }}
              >
                <FiTrendingDown size={18} />
              </div>
              <div className="ai-metric-label">Total Expenses</div>
              <div className="ai-metric-value" style={{ color: "var(--danger)" }}>
                {fmt(insights.data.allTimeMetrics.totalExpenses)}
              </div>
              <div className="ai-metric-sub">All time</div>
            </div>

            <div className="ai-metric-card">
              <div
                className="ai-metric-icon-wrap"
                style={{
                  background: "var(--primary-alpha)",
                  color: "var(--primary)",
                }}
              >
                <FiDollarSign size={18} />
              </div>
              <div className="ai-metric-label">Net Savings</div>
              <div
                className="ai-metric-value"
                style={{
                  color:
                    insights.data.metrics.net >= 0
                      ? "var(--success)"
                      : "var(--danger)",
                }}
              >
                {fmt(insights.data.metrics.net)}
              </div>
              <div className="ai-metric-sub">This month</div>
            </div>

            <div className="ai-metric-card">
              <div
                className="ai-metric-icon-wrap"
                style={{
                  background: "var(--warning-alpha)",
                  color: "var(--warning)",
                }}
              >
                <FiTarget size={18} />
              </div>
              <div className="ai-metric-label">Savings Rate</div>
              <div
                className="ai-metric-value"
                style={{
                  color:
                    insights.data.metrics.savingsRate >= 20
                      ? "var(--success)"
                      : insights.data.metrics.savingsRate >= 10
                      ? "var(--warning)"
                      : "var(--danger)",
                }}
              >
                {fmtPct(insights.data.metrics.savingsRate)}
              </div>
              <div className="ai-metric-sub">This month</div>
            </div>
          </div>

          {/* ── 4. SPENDING PATTERNS ── */}
          {insights.data.spendingPatterns?.length > 0 && (
            <div className="ai-card ai-section" id="ai-spending-patterns">
              <div className="ai-card-header">
                <div>
                  <h2 className="ai-card-title">Spending Patterns</h2>
                  <p className="ai-card-subtitle">
                    Patterns detected from your recent transactions
                  </p>
                </div>
              </div>
              <div className="ai-patterns-grid">
                {insights.data.spendingPatterns.map((p, i) => (
                  <div key={i} className="ai-pattern-card">
                    <div className="ai-pattern-emoji">{p.icon}</div>
                    <div>
                      <div className="ai-pattern-type">{p.type.replace(/_/g, " ")}</div>
                      <div className="ai-pattern-title">{p.title}</div>
                      <div className="ai-pattern-desc">{p.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. CATEGORY BREAKDOWN + TREND (2-column) ── */}
          <div className="ai-grid-2">
            {/* Category Breakdown */}
            <div className="ai-card" id="ai-category-breakdown">
              <div className="ai-card-header">
                <div>
                  <h2 className="ai-card-title">Where Your Money Goes</h2>
                  <p className="ai-card-subtitle">Expense breakdown by category</p>
                </div>
                <select
                  id="ai-category-period-select"
                  className="ai-period-select"
                  value={categoryPeriod}
                  onChange={(e) => setCategoryPeriod(e.target.value)}
                >
                  <option value="current">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {categoryData && categoryData.length > 0 ? (
                <div className="ai-category-list">
                  {categoryData.slice(0, 7).map((cat, i) => (
                    <div key={cat.category} className="ai-category-row">
                      <div className="ai-category-row-top">
                        <span className="ai-category-name">{cat.category}</span>
                        <div className="ai-category-meta">
                          <span className="ai-category-amount">{fmt(cat.amount)}</span>
                          <span className="ai-category-pct">{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="ai-bar-track">
                        <div
                          className="ai-bar-fill"
                          style={{
                            width: `${cat.percentage}%`,
                            background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                  No expense data for this period.
                </div>
              )}
            </div>

            {/* Monthly Trend */}
            <div className="ai-card" id="ai-monthly-trend">
              <div className="ai-card-header">
                <div>
                  <h2 className="ai-card-title">Income vs Expenses</h2>
                  <p className="ai-card-subtitle">Monthly financial trend</p>
                </div>
                <select
                  id="ai-trend-period-select"
                  className="ai-period-select"
                  value={trendPeriod}
                  onChange={(e) => setTrendPeriod(Number(e.target.value))}
                >
                  <option value={3}>Last 3 months</option>
                  <option value={6}>Last 6 months</option>
                </select>
              </div>

              {trendData.length > 0 ? (
                <div className="ai-chart-wrapper">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={trendData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="aiIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#635bff" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#635bff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="aiExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#eef0f5"
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8a93a4", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8a93a4", fontSize: 10 }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`
                        }
                        width={48}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#635bff"
                        strokeWidth={2.5}
                        fill="url(#aiIncomeGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#fff", stroke: "#635bff", strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Expenses"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#aiExpenseGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#fff", stroke: "#ef4444", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                  Not enough data for the selected period.
                </div>
              )}
            </div>
          </div>

          {/* ── 6. BUDGET ALERTS + UNUSUAL SPENDING (2-column) ── */}
          <div className="ai-grid-2">
            {/* Budget Alerts */}
            <div className="ai-card" id="ai-budget-alerts">
              <div className="ai-card-header">
                <div>
                  <h2 className="ai-card-title">Budget Alerts</h2>
                  <p className="ai-card-subtitle">Current month budget vs spending</p>
                </div>
              </div>

              {insights.data.budgetAlerts?.length > 0 ? (
                <div className="ai-budget-list">
                  {insights.data.budgetAlerts.map((b) => (
                    <div key={b.category} className="ai-budget-item">
                      <div className="ai-budget-item-top">
                        <span className="ai-budget-category">
                          <span className={`ai-budget-status-dot ${b.status}`} />
                          {b.category}
                        </span>
                        <span className={`ai-budget-badge ${b.status}`}>
                          {b.exceeded
                            ? `Exceeded by ${fmt(b.overAmount)}`
                            : `${b.percentage}%`}
                        </span>
                      </div>
                      <div className="ai-budget-amounts">
                        Spent: <strong>{fmt(b.spent)}</strong> / Budget: <strong>{fmt(b.limit)}</strong>
                      </div>
                      <div className="ai-bar-track">
                        <div
                          className="ai-bar-fill"
                          style={{
                            width: `${Math.min(b.percentage, 100)}%`,
                            background:
                              b.exceeded
                                ? "var(--danger)"
                                : b.status === "warning"
                                ? "var(--warning)"
                                : "var(--success)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="ai-all-clear">
                    <div className="ai-all-clear-icon">📋</div>
                    <div className="ai-all-clear-text">
                      <strong>No budgets set</strong>
                      <span>Create a budget to receive AI-powered spending alerts.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ marginTop: "var(--space-4)", width: "100%" }}
                    onClick={() => navigate("/budgets")}
                  >
                    <FiPlusCircle size={15} /> Create Budget
                  </button>
                </div>
              )}
            </div>

            {/* Unusual Spending */}
            <div className="ai-card" id="ai-unusual-spending">
              <div className="ai-card-header">
                <div>
                  <h2 className="ai-card-title">Unusual Spending</h2>
                  <p className="ai-card-subtitle">Transactions significantly above normal</p>
                </div>
              </div>

              {insights.data.unusualSpending?.length > 0 ? (
                <div className="ai-anomaly-list">
                  {insights.data.unusualSpending.slice(0, 4).map((a, i) => (
                    <div key={i} className="ai-anomaly-item">
                      <div className="ai-anomaly-top">
                        <span className="ai-anomaly-category">
                          ⚠️ {a.transaction.category}
                        </span>
                        <span className="ai-anomaly-amount">
                          {fmt(a.transaction.amount)}
                        </span>
                      </div>
                      <p className="ai-anomaly-reason">{a.reason}</p>
                      <span className="ai-anomaly-avg">
                        Typical amount: ~{fmt(a.average)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ai-all-clear">
                  <div className="ai-all-clear-icon">
                    <FiCheckCircle size={22} color="var(--success)" />
                  </div>
                  <div className="ai-all-clear-text">
                    <strong>Everything looks normal</strong>
                    <span>No unusual spending patterns were detected recently.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 7. SAVINGS OPPORTUNITIES ── */}
          {insights.data.savingsOpportunities?.length > 0 && (
            <div className="ai-card ai-section" id="ai-savings-opportunities">
              <div className="ai-card-header">
                <div>
                  <h2 className="ai-card-title">Potential Savings</h2>
                  <p className="ai-card-subtitle">
                    Based on your spending vs your 3-month average
                  </p>
                </div>
              </div>

              <table className="ai-savings-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Current Month</th>
                    <th>3-Month Avg</th>
                    <th>Potential Saving</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.data.savingsOpportunities.map((opp) => (
                    <tr key={opp.category} className="ai-savings-row">
                      <td className="ai-savings-cat">{opp.category}</td>
                      <td className="ai-savings-current">{fmt(opp.currentSpend)}</td>
                      <td className="ai-savings-avg">{fmt(opp.averageSpend)}</td>
                      <td className="ai-savings-potential">{fmt(opp.potentialSaving)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ai-savings-total">
                <span className="ai-savings-total-label">Potential monthly savings</span>
                <span className="ai-savings-total-value">
                  {fmt(
                    insights.data.savingsOpportunities.reduce(
                      (s, o) => s + o.potentialSaving,
                      0
                    )
                  )}
                </span>
              </div>
              <p className="ai-savings-disclaimer">
                * Potential savings if spending is reduced to 3-month average. Actual results will vary.
              </p>
            </div>
          )}

          {/* ── 8. SMART RECOMMENDATIONS ── */}
          {insights.data.recommendations?.length > 0 && (
            <div className="ai-card ai-section" id="ai-recommendations">
              <div className="ai-card-header">
                <div>
                  <h2 className="ai-card-title">Smart Recommendations</h2>
                  <p className="ai-card-subtitle">
                    Personalised suggestions based on your financial data
                  </p>
                </div>
              </div>
              <div className="ai-rec-list">
                {insights.data.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`ai-rec-item priority-${rec.priority}`}
                  >
                    <div className="ai-rec-emoji">{rec.icon}</div>
                    <div className="ai-rec-content">
                      <div className="ai-rec-title">{rec.title}</div>
                      <div className="ai-rec-desc">{rec.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 9. AI CHAT ── */}
          <div className="ai-chat-card" id="ai-chat">
            <div className="ai-chat-header">
              <div className="ai-chat-header-icon">
                <FiMessageSquare size={20} />
              </div>
              <div>
                <h3>Ask MoneyMate AI</h3>
                <p>Ask questions about your finances using your transaction history.</p>
              </div>
            </div>

            {/* Messages */}
            {chatMessages.length > 0 && (
              <div className="ai-chat-messages" id="ai-chat-messages">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`ai-chat-bubble ${msg.role}`}
                  >
                    <div className="ai-chat-bubble-avatar">
                      {msg.role === "ai" ? "🧠" : msg.role === "error" ? "⚠️" : "👤"}
                    </div>
                    <div className="ai-chat-bubble-text">
                      <div>{formatChatMessage(msg.text)}</div>
                      {msg.role === "error" && msg.retryText && (
                        <button
                          type="button"
                          className="ai-chat-retry-btn"
                          onClick={() => sendMessage(msg.retryText)}
                          disabled={chatLoading}
                        >
                          <FiRefreshCw size={12} /> Try Again
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="ai-chat-bubble ai">
                    <div className="ai-chat-bubble-avatar">🧠</div>
                    <div className="ai-chat-loading-wrap">
                      <span className="ai-chat-loading-text">
                        MoneyMate AI is analyzing your finances...
                      </span>
                      <div className="ai-chat-typing">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Input */}
            <div className="ai-chat-input-area">
              <form className="ai-chat-form" onSubmit={handleChatSubmit}>
                <input
                  id="ai-chat-input"
                  type="text"
                  className="ai-chat-input"
                  placeholder="Ask MoneyMate AI…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={500}
                  disabled={chatLoading}
                  autoComplete="off"
                />
                <button
                  id="ai-chat-send"
                  type="submit"
                  className="ai-chat-send-btn"
                  disabled={!chatInput.trim() || chatLoading}
                  aria-label="Send message"
                >
                  <FiSend size={17} />
                </button>
              </form>

              {/* Suggested Questions */}
              <div className="ai-suggested-questions">
                <div className="ai-suggested-label">Suggested questions</div>
                <div className="ai-suggested-list">
                  {[
                    "Where did I spend the most this month?",
                    "How much can I save this month?",
                    "What category should I reduce?",
                    "How am I doing with my savings goal?",
                    "Why did my expenses increase?",
                    "Am I staying within my budget?",
                    "How much did I spend this week?",
                    "What was my biggest transaction?",
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="ai-suggested-chip"
                      onClick={() => handleSuggestedQuestion(q)}
                      disabled={chatLoading}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
