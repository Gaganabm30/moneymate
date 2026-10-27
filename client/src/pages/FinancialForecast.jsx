import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiShield,
  FiInfo,
  FiTarget,
  FiCalendar,
  FiSliders,
  FiArrowUpRight,
  FiArrowDownRight,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { useAuth } from "../context/AuthContext";
import { getFinancialForecast } from "../services/forecastingService";

import "../styles/dashboard.css";
import "../styles/forecast.css";

// ─── Currency Formatter ────────────────────────────────────────────────────────

function fmt(n) {
  const val = Number(n);
  if (!Number.isFinite(val)) return "₹0";
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

// ─── Custom Tooltip Component ─────────────────────────────────────────────────

function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const isForecast = point.isForecast;
  const balanceVal = isForecast ? point.projectedBalance : point.actualBalance;

  return (
    <div className="forecast-custom-tooltip">
      <div className="tooltip-date">
        <span>{point.label}</span>
        <span className={`tooltip-badge ${isForecast ? "projected" : "actual"}`}>
          {isForecast ? "Forecast" : "Actual"}
        </span>
      </div>

      <div className="tooltip-metric-row">
        <span style={{ color: "#64748b" }}>Balance:</span>
        <strong style={{ color: balanceVal < 0 ? "#ef4444" : "#0f172a" }}>
          {fmt(balanceVal)}
        </strong>
      </div>

      {isForecast && point.conservativeBalance !== undefined && (
        <div className="tooltip-metric-row" style={{ fontSize: "11px", color: "#b45309" }}>
          <span>Conservative:</span>
          <strong>{fmt(point.conservativeBalance)}</strong>
        </div>
      )}

      {isForecast && point.higherSpendingBalance !== undefined && (
        <div className="tooltip-metric-row" style={{ fontSize: "11px", color: "#dc2626" }}>
          <span>Higher-Spending:</span>
          <strong>{fmt(point.higherSpendingBalance)}</strong>
        </div>
      )}

      {point.dailyCashflow !== 0 && (
        <div className="tooltip-metric-row" style={{ fontSize: "11px", color: point.dailyCashflow > 0 ? "#10b981" : "#ef4444" }}>
          <span>Net Change:</span>
          <strong>{point.dailyCashflow > 0 ? `+${fmt(point.dailyCashflow)}` : fmt(point.dailyCashflow)}</strong>
        </div>
      )}

      {point.events && point.events.length > 0 && (
        <div className="tooltip-events-list">
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
            SCHEDULED PAYMENTS:
          </div>
          {point.events.map((ev, i) => (
            <div key={i} className={`tooltip-event-chip ${ev.type === "income" ? "income" : ""}`}>
              <span>{ev.title}</span>
              <span>{ev.type === "income" ? "+" : "-"}{fmt(ev.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Financial Forecast Component ────────────────────────────────────────

export default function FinancialForecast() {
  const { user } = useAuth();

  const [days, setDays] = useState(30);
  const [scenario, setScenario] = useState("expected");
  const [threshold, setThreshold] = useState(5000);
  const [inputThreshold, setInputThreshold] = useState("5000");

  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssumptions, setShowAssumptions] = useState(false);

  const loadForecast = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await getFinancialForecast({
        days,
        scenario,
        threshold,
      });

      if (res?.success) {
        setForecastData(res.data);
      } else {
        throw new Error(res?.message || "Failed to load forecast");
      }
    } catch (err) {
      console.error("Forecast load error:", err);
      setError(err?.response?.data?.message || err.message || "Failed to generate financial forecast");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days, scenario, threshold]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const handleApplyThreshold = (e) => {
    e.preventDefault();
    const val = parseFloat(inputThreshold);
    if (!isNaN(val) && val >= 0) {
      setThreshold(val);
    }
  };

  const overview = forecastData?.overview;
  const scenarios = forecastData?.scenarios;
  const chartData = forecastData?.chartData || [];
  const warning = forecastData?.warningDetails;
  const confidence = forecastData?.confidence;
  const goalsForecast = forecastData?.goalsForecast || [];

  // Compute 30-day delta % from current balance
  const balanceDelta30 = useMemo(() => {
    if (!overview || overview.currentBalance === 0) return null;
    const diff = overview.balance30Days - overview.currentBalance;
    const pct = (diff / Math.abs(overview.currentBalance)) * 100;
    return {
      diff,
      pct: Math.round(pct * 10) / 10,
      isPositive: diff >= 0,
    };
  }, [overview]);

  return (
    <div className="dashboard-page">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="dashboard-main">
        <Topbar
          user={user}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="dashboard-content forecast-page-content">
          {/* Header */}
          <div className="forecast-header">
            <div className="forecast-header-left">
              <span className="forecast-tag">
                <FiTrendingUp /> PREDICTIVE CASHFLOW ENGINE
              </span>
              <h1 className="forecast-heading">Financial Forecasting</h1>
              <p className="forecast-subtitle">
                Deterministic cashflow simulation combining past transaction patterns, recurring commitments, and savings goals.
              </p>
            </div>

            <div className="forecast-header-actions">
              <button
                type="button"
                className="forecast-sync-btn"
                onClick={() => loadForecast(true)}
                disabled={refreshing || loading}
                title="Refresh forecast with latest transactions"
              >
                <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                <span>{refreshing ? "Updating..." : "Recalculate"}</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="forecast-empty-state" style={{ borderStyle: "solid" }}>
              <div className="empty-icon-circle animate-spin">
                <FiRefreshCw />
              </div>
              <h3>Simulating Financial Trajectory...</h3>
              <p>Analyzing historical transactions, upcoming recurring bills, and spending trends.</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="forecast-warning-card critical">
              <div className="warning-icon-wrapper">
                <FiAlertTriangle />
              </div>
              <div className="warning-content">
                <h4>Forecasting Error</h4>
                <p className="warning-desc">{error}</p>
                <button
                  type="button"
                  className="forecast-sync-btn"
                  onClick={() => loadForecast()}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty Records State */}
          {!loading && !error && confidence?.transactionCount === 0 && (
            <div className="forecast-empty-state">
              <div className="empty-icon-circle">
                <FiSliders />
              </div>
              <h3>No Transaction History Yet</h3>
              <p>
                To generate accurate financial forecasts and simulations, MoneyMate requires recorded transactions. Start by adding your income or expenses!
              </p>
              <Link to="/transactions" className="empty-action-btn" style={{ textDecoration: "none" }}>
                <FiDollarSign /> Add Your First Transaction
              </Link>
            </div>
          )}

          {/* Main Forecast Content */}
          {!loading && !error && forecastData && confidence?.transactionCount > 0 && (
            <>
              {/* Confidence & Data Quality Banner */}
              <div className="forecast-confidence-banner">
                <div className="confidence-left">
                  <div className="confidence-icon-box">
                    <FiShield />
                  </div>
                  <div className="confidence-meta">
                    <h4>
                      Forecast Confidence:{" "}
                      <span className={`confidence-pill ${confidence.level.toLowerCase().replace(/\s+/g, "-")}`}>
                        {confidence.level} ({confidence.score}%)
                      </span>
                    </h4>
                    <p>
                      {confidence.dataSufficiencyNotes[0] || "Calculations derived from your recorded history."}
                    </p>
                  </div>
                </div>

                <div className="confidence-right">
                  <div className="confidence-stat-item">
                    <span>Analyzed Transactions</span>
                    <strong>{confidence.transactionCount} records</strong>
                  </div>
                  <div className="confidence-stat-item">
                    <span>Active Recurring</span>
                    <strong>{confidence.recurringCount} schedules</strong>
                  </div>
                  <button
                    type="button"
                    className="forecast-sync-btn"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => setShowAssumptions((prev) => !prev)}
                  >
                    <FiInfo /> Assumptions {showAssumptions ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
              </div>

              {/* Collapsible Assumptions Panel */}
              {showAssumptions && (
                <div className="forecast-threshold-section" style={{ marginBottom: "24px", background: "#fbfaff", border: "1.5px solid #e9edf5" }}>
                  <div className="section-title-wrap">
                    <h3>Transparent Forecasting Assumptions</h3>
                    <p>MoneyMate models are deterministic and explainable. No black-box fabrication.</p>
                  </div>
                  <ul style={{ paddingLeft: "20px", margin: "10px 0 0", color: "#475569", fontSize: "13px", lineHeight: "1.6" }}>
                    {confidence.assumptions.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: "6px" }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Low-Balance Warning Alert Box */}
              {warning && warning.isWarning && (
                <div className={`forecast-warning-card ${warning.warningSeverity}`}>
                  <div className="warning-icon-wrapper">
                    <FiAlertTriangle />
                  </div>
                  <div className="warning-content">
                    <div className="warning-header-row">
                      <h4>{warning.headline}</h4>
                      <span className="warning-badge">
                        Estimated Breach in {warning.daysUntilBreach} Day{warning.daysUntilBreach === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="warning-desc">{warning.message}</p>

                    {warning.contributingPayments && warning.contributingPayments.length > 0 && (
                      <div className="warning-contributing-payments">
                        <span className="contributing-label">Main Scheduled Commitments:</span>
                        {warning.contributingPayments.map((p, idx) => (
                          <span key={idx} className="contributing-chip">
                            <span>{p.title}:</span>
                            <strong style={{ color: "#ef4444" }}>-{fmt(p.amount)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="warning-disclaimer">{warning.disclaimer}</p>
                  </div>
                </div>
              )}

              {/* Overview Metrics Cards */}
              <div className="forecast-overview-grid">
                {/* 1. Current Recorded Balance */}
                <div className="forecast-stat-card highlight">
                  <div className="forecast-stat-card-header">
                    <div className="forecast-stat-icon purple">
                      <FiDollarSign />
                    </div>
                    <span className="forecast-stat-tag" style={{ background: "#f0eeff", color: "#635bff" }}>
                      RECORDED
                    </span>
                  </div>
                  <div className="forecast-stat-label">Current Balance</div>
                  <div className={`forecast-stat-value ${overview.currentBalance < 0 ? "negative" : ""}`}>
                    {fmt(overview.currentBalance)}
                  </div>
                  <div className="forecast-stat-subtext">
                    From all recorded transactions
                  </div>
                </div>

                {/* 2. Estimated Balance in 30 Days */}
                <div className="forecast-stat-card">
                  <div className="forecast-stat-card-header">
                    <div className="forecast-stat-icon blue">
                      <FiCalendar />
                    </div>
                    <span className="forecast-stat-tag">30 DAYS</span>
                  </div>
                  <div className="forecast-stat-label">Estimated in 30 Days</div>
                  <div className={`forecast-stat-value ${overview.balance30Days < 0 ? "negative" : ""}`}>
                    {fmt(overview.balance30Days)}
                  </div>
                  <div className="forecast-stat-subtext">
                    {balanceDelta30 && (
                      <span style={{ color: balanceDelta30.isPositive ? "#10b981" : "#ef4444", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
                        {balanceDelta30.isPositive ? <FiArrowUpRight /> : <FiArrowDownRight />}
                        {balanceDelta30.pct > 0 ? `+${balanceDelta30.pct}%` : `${balanceDelta30.pct}%`}
                      </span>
                    )}
                    <span style={{ marginLeft: "4px" }}>vs current balance</span>
                  </div>
                </div>

                {/* 3. Estimated Balance in 60 Days */}
                <div className="forecast-stat-card">
                  <div className="forecast-stat-card-header">
                    <div className="forecast-stat-icon emerald">
                      <FiCalendar />
                    </div>
                    <span className="forecast-stat-tag">60 DAYS</span>
                  </div>
                  <div className="forecast-stat-label">Estimated in 60 Days</div>
                  <div className={`forecast-stat-value ${overview.balance60Days < 0 ? "negative" : ""}`}>
                    {fmt(overview.balance60Days)}
                  </div>
                  <div className="forecast-stat-subtext">
                    Mid-term projected balance
                  </div>
                </div>

                {/* 4. Estimated Balance in 90 Days */}
                <div className="forecast-stat-card">
                  <div className="forecast-stat-card-header">
                    <div className="forecast-stat-icon green">
                      <FiCalendar />
                    </div>
                    <span className="forecast-stat-tag">90 DAYS</span>
                  </div>
                  <div className="forecast-stat-label">Estimated in 90 Days</div>
                  <div className={`forecast-stat-value ${overview.balance90Days < 0 ? "negative" : ""}`}>
                    {fmt(overview.balance90Days)}
                  </div>
                  <div className="forecast-stat-subtext">
                    Quarterly projected balance
                  </div>
                </div>

                {/* 5. Projected Monthly Income */}
                <div className="forecast-stat-card">
                  <div className="forecast-stat-card-header">
                    <div className="forecast-stat-icon green">
                      <FiTrendingUp />
                    </div>
                    <span className="forecast-stat-tag" style={{ background: "#dcfce7", color: "#15803d" }}>
                      MONTHLY
                    </span>
                  </div>
                  <div className="forecast-stat-label">Projected Monthly Income</div>
                  <div className="forecast-stat-value" style={{ color: "#10b981" }}>
                    {fmt(overview.projectedMonthlyIncome)}
                  </div>
                  <div className="forecast-stat-subtext">
                    Expected 30-day cash inflow
                  </div>
                </div>

                {/* 6. Projected Monthly Expenses */}
                <div className="forecast-stat-card">
                  <div className="forecast-stat-card-header">
                    <div className="forecast-stat-icon orange">
                      <FiTrendingDown />
                    </div>
                    <span className="forecast-stat-tag" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                      EXPENSES
                    </span>
                  </div>
                  <div className="forecast-stat-label">Projected Monthly Expenses</div>
                  <div className="forecast-stat-value" style={{ color: "#ef4444" }}>
                    {fmt(overview.projectedMonthlyExpenses)}
                  </div>
                  <div className="forecast-stat-subtext">
                    Net monthly savings:{" "}
                    <strong style={{ color: overview.projectedMonthlyNet >= 0 ? "#10b981" : "#ef4444", marginLeft: "4px" }}>
                      {fmt(overview.projectedMonthlyNet)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Interactive Forecast Chart */}
              <div className="forecast-chart-section">
                <div className="forecast-chart-toolbar">
                  <div className="chart-title-group">
                    <h3>Balance Trajectory & Timeline</h3>
                    <p>Historical recorded balance seamlessly transitioning into simulation models.</p>
                  </div>

                  <div className="chart-controls-group">
                    {/* Scenario Pills */}
                    <div className="scenario-selector-pills">
                      <button
                        type="button"
                        className={`scenario-pill-btn ${scenario === "conservative" ? "active conservative" : ""}`}
                        onClick={() => setScenario("conservative")}
                      >
                        Conservative
                      </button>
                      <button
                        type="button"
                        className={`scenario-pill-btn ${scenario === "expected" ? "active" : ""}`}
                        onClick={() => setScenario("expected")}
                      >
                        Expected
                      </button>
                      <button
                        type="button"
                        className={`scenario-pill-btn ${scenario === "higher-spending" ? "active higher-spending" : ""}`}
                        onClick={() => setScenario("higher-spending")}
                      >
                        Higher-Spending
                      </button>
                    </div>

                    {/* Horizon Range Toggles */}
                    <div className="horizon-toggle-pill">
                      <button
                        type="button"
                        className={`horizon-btn ${days === 30 ? "active" : ""}`}
                        onClick={() => setDays(30)}
                      >
                        30 Days
                      </button>
                      <button
                        type="button"
                        className={`horizon-btn ${days === 60 ? "active" : ""}`}
                        onClick={() => setDays(60)}
                      >
                        60 Days
                      </button>
                      <button
                        type="button"
                        className={`horizon-btn ${days === 90 ? "active" : ""}`}
                        onClick={() => setDays(90)}
                      >
                        90 Days
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chart Graphic Container */}
                <div className="chart-container-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#635bff" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#635bff" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                      />
                      <Tooltip content={<CustomChartTooltip />} />

                      {/* Threshold reference line */}
                      <ReferenceLine
                        y={threshold}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Warning Threshold (${fmt(threshold)})`,
                          fill: "#ef4444",
                          fontSize: 11,
                          position: "insideTopRight",
                        }}
                      />

                      {/* Actual Historical Line */}
                      <Area
                        type="monotone"
                        dataKey="actualBalance"
                        stroke="#635bff"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#actualGradient)"
                        name="Actual Balance"
                        connectNulls={false}
                      />

                      {/* Projected Forecast Line */}
                      <Area
                        type="monotone"
                        dataKey={
                          scenario === "conservative"
                            ? "conservativeBalance"
                            : scenario === "higher-spending"
                            ? "higherSpendingBalance"
                            : "projectedBalance"
                        }
                        stroke={
                          scenario === "conservative"
                            ? "#d97706"
                            : scenario === "higher-spending"
                            ? "#dc2626"
                            : "#8b5cf6"
                        }
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        fillOpacity={1}
                        fill="url(#projectedGradient)"
                        name="Projected Balance"
                        connectNulls={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scenarios Comparison Section */}
              {scenarios && (
                <div className="forecast-scenarios-section">
                  <div className="section-title-wrap">
                    <h3>Explore Simulation Scenarios</h3>
                    <p>Compare how different spending habits and unexpected buffers impact your cashflow over 30, 60, and 90 days.</p>
                  </div>

                  <div className="scenarios-grid">
                    {/* Conservative */}
                    <div
                      className={`scenario-card ${scenario === "conservative" ? "active" : ""}`}
                      onClick={() => setScenario("conservative")}
                    >
                      <div className="scenario-card-header">
                        <div className="scenario-name">
                          <span>Conservative</span>
                        </div>
                        <span className="scenario-badge conservative">
                          {scenarios.conservative.riskRating}
                        </span>
                      </div>
                      <p className="scenario-desc">{scenarios.conservative.description}</p>
                      <div className="scenario-metrics-row">
                        <div className="scenario-metric-item">
                          <span>30d Balance</span>
                          <strong>{fmt(scenarios.conservative.balance30Days)}</strong>
                        </div>
                        <div className="scenario-metric-item">
                          <span>90d Balance</span>
                          <strong style={{ color: scenarios.conservative.balance90Days < 0 ? "#ef4444" : "#0f172a" }}>
                            {fmt(scenarios.conservative.balance90Days)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Expected (Baseline) */}
                    <div
                      className={`scenario-card ${scenario === "expected" ? "active" : ""}`}
                      onClick={() => setScenario("expected")}
                    >
                      <div className="scenario-card-header">
                        <div className="scenario-name">
                          <span>Expected (Baseline)</span>
                        </div>
                        <span className="scenario-badge expected">
                          {scenarios.expected.riskRating}
                        </span>
                      </div>
                      <p className="scenario-desc">{scenarios.expected.description}</p>
                      <div className="scenario-metrics-row">
                        <div className="scenario-metric-item">
                          <span>30d Balance</span>
                          <strong>{fmt(scenarios.expected.balance30Days)}</strong>
                        </div>
                        <div className="scenario-metric-item">
                          <span>90d Balance</span>
                          <strong style={{ color: scenarios.expected.balance90Days < 0 ? "#ef4444" : "#0f172a" }}>
                            {fmt(scenarios.expected.balance90Days)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Higher-Spending */}
                    <div
                      className={`scenario-card ${scenario === "higher-spending" ? "active" : ""}`}
                      onClick={() => setScenario("higher-spending")}
                    >
                      <div className="scenario-card-header">
                        <div className="scenario-name">
                          <span>Higher-Spending</span>
                        </div>
                        <span className="scenario-badge higher-spending">
                          {scenarios.higherSpending.riskRating}
                        </span>
                      </div>
                      <p className="scenario-desc">{scenarios.higherSpending.description}</p>
                      <div className="scenario-metrics-row">
                        <div className="scenario-metric-item">
                          <span>30d Balance</span>
                          <strong>{fmt(scenarios.higherSpending.balance30Days)}</strong>
                        </div>
                        <div className="scenario-metric-item">
                          <span>90d Balance</span>
                          <strong style={{ color: scenarios.higherSpending.balance90Days < 0 ? "#ef4444" : "#0f172a" }}>
                            {fmt(scenarios.higherSpending.balance90Days)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Savings Goals Forecast */}
              <div className="forecast-goals-section">
                <div className="section-title-wrap">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h3>Savings Goals Forecast</h3>
                      <p>Estimated timelines to reach your active financial targets based on projected net cashflow.</p>
                    </div>
                    <Link to="/goals" style={{ fontSize: "13px", fontWeight: 700, color: "#635bff", textDecoration: "none" }}>
                      Manage Goals →
                    </Link>
                  </div>
                </div>

                {goalsForecast.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "13px", marginTop: "10px" }}>
                    No savings goals found. <Link to="/goals" style={{ color: "#635bff" }}>Create a savings goal</Link> to track projected completion dates!
                  </p>
                ) : (
                  <div className="goals-forecast-grid">
                    {goalsForecast.map((goal) => (
                      <div key={goal.id} className="goal-forecast-card">
                        <div className="goal-card-top">
                          <span className="goal-card-title">{goal.title}</span>
                          <span className={`goal-status-pill ${goal.status}`}>
                            {goal.status.replace(/-/g, " ").toUpperCase()}
                          </span>
                        </div>

                        <div className="goal-progress-bar-wrap">
                          <div
                            className="goal-progress-bar-fill"
                            style={{ width: `${goal.percentageCompleted}%` }}
                          />
                        </div>

                        <div className="goal-amounts-row">
                          <span>Saved: <strong>{fmt(goal.saved)}</strong></span>
                          <span>Target: <strong>{fmt(goal.target)}</strong> ({goal.percentageCompleted}%)</span>
                        </div>

                        <div className="goal-explanation">
                          {goal.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low-Balance Threshold Simulator */}
              <div className="forecast-threshold-section">
                <div className="section-title-wrap">
                  <h3>Low-Balance Threshold Alert Settings</h3>
                  <p>Configure your safety buffer. MoneyMate will flag whenever a projected balance risks breaching this line.</p>
                </div>

                <form onSubmit={handleApplyThreshold} className="threshold-control-box">
                  <div className="threshold-input-group">
                    <div className="threshold-input-wrapper">
                      <span className="threshold-prefix">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={inputThreshold}
                        onChange={(e) => setInputThreshold(e.target.value)}
                        className="threshold-input"
                      />
                    </div>
                    <button type="submit" className="threshold-apply-btn">
                      Update Threshold
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[2000, 5000, 10000, 25000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="forecast-sync-btn"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => {
                          setInputThreshold(String(preset));
                          setThreshold(preset);
                        }}
                      >
                        ₹{preset.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
