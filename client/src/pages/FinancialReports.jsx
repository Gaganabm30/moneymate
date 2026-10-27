import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  FiFileText,
  FiDownload,
  FiPrinter,
  FiFilter,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiLayers,
  FiAward,
} from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { useAuth } from "../context/AuthContext";
import {
  getReportData,
  downloadReportCSV,
  downloadReportExcel,
  downloadReportPDF,
} from "../services/reportService";

import "../styles/dashboard.css";
import "../styles/reports.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "₹0";
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

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

const REPORT_TYPES = [
  { id: "transaction-statement", label: "Transaction Statement", icon: <FiFileText /> },
  { id: "monthly-summary", label: "Monthly Summary", icon: <FiBarChart2Icon /> },
  { id: "expense-analysis", label: "Expense Analysis", icon: <FiPieChart /> },
  { id: "budget-performance", label: "Budget Performance", icon: <FiLayers /> },
  { id: "savings-goal-progress", label: "Savings Goal Progress", icon: <FiAward /> },
];

function FiBarChart2Icon() {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}

const CATEGORIES = [
  "All",
  "Salary",
  "Freelance",
  "Investment",
  "Food",
  "Housing",
  "Transport",
  "Bills & Utilities",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Personal Care",
  "Travel",
  "Other",
];

export default function FinancialReports() {
  const { user } = useAuth();

  // Filter States
  const [reportType, setReportType] = useState("transaction-statement");
  const [preset, setPreset] = useState("this-month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [category, setCategory] = useState("All");

  // Data & Execution States
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState({ csv: false, excel: false, pdf: false });
  const [error, setError] = useState(null);

  // Pagination for statements
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);

      const res = await getReportData({
        reportType,
        preset,
        startDate: preset === "custom" ? startDate : undefined,
        endDate: preset === "custom" ? endDate : undefined,
        typeFilter,
        category: category === "All" ? undefined : category,
      });

      if (res?.success) {
        setReportData(res.data);
      } else {
        throw new Error(res?.message || "Failed to load report data");
      }
    } catch (err) {
      console.error("Report generation error:", err);
      setError(err?.response?.data?.message || err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [reportType, preset, startDate, endDate, typeFilter, category]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Export handlers
  const handleExportCSV = async () => {
    try {
      setExporting((prev) => ({ ...prev, csv: true }));
      await downloadReportCSV({
        reportType,
        preset,
        startDate: preset === "custom" ? startDate : undefined,
        endDate: preset === "custom" ? endDate : undefined,
        typeFilter,
        category: category === "All" ? undefined : category,
      });
    } catch (err) {
      console.error("CSV download error:", err);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setExporting((prev) => ({ ...prev, csv: false }));
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting((prev) => ({ ...prev, excel: true }));
      await downloadReportExcel({
        reportType,
        preset,
        startDate: preset === "custom" ? startDate : undefined,
        endDate: preset === "custom" ? endDate : undefined,
        typeFilter,
        category: category === "All" ? undefined : category,
      });
    } catch (err) {
      console.error("Excel download error:", err);
      alert("Failed to export Excel. Please try again.");
    } finally {
      setExporting((prev) => ({ ...prev, excel: false }));
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting((prev) => ({ ...prev, pdf: true }));
      await downloadReportPDF({
        reportType,
        preset,
        startDate: preset === "custom" ? startDate : undefined,
        endDate: preset === "custom" ? endDate : undefined,
        typeFilter,
        category: category === "All" ? undefined : category,
      });
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting((prev) => ({ ...prev, pdf: false }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary;
  const transactions = reportData?.transactions || [];
  const monthlySummary = reportData?.monthlySummary || [];
  const categoryBreakdown = reportData?.categoryBreakdown || [];
  const budgetPerformance = reportData?.budgetPerformance || [];
  const goalsProgress = reportData?.goalsProgress || [];

  // Pagination slicing for transactions
  const totalPages = Math.ceil(transactions.length / rowsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return transactions.slice(startIdx, startIdx + rowsPerPage);
  }, [transactions, currentPage]);

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

        <div className="dashboard-content reports-page-content">
          {/* Header */}
          <div className="reports-header">
            <div className="reports-header-left">
              <span className="reports-tag">
                <FiFileText /> REPORTING & EXPORT CENTER
              </span>
              <h1 className="reports-heading">Financial Reports</h1>
              <p className="reports-subtitle">
                Generate itemized transaction statements, executive cashflow summaries, and export genuine CSV, Excel, or PDF reports.
              </p>
            </div>
          </div>

          {/* Filter & Configuration Toolbar Card */}
          <div className="reports-filter-card">
            {/* Report Type Tabs */}
            <div className="report-type-nav">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`report-type-tab-btn ${reportType === type.id ? "active" : ""}`}
                  onClick={() => setReportType(type.id)}
                >
                  {type.icon}
                  <span>{type.label}</span>
                </button>
              ))}
            </div>

            {/* Filter Controls Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadReport();
              }}
              className="reports-filter-grid"
            >
              {/* Date Preset */}
              <div className="report-filter-group">
                <label>
                  <FiCalendar /> Period
                </label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  className="report-select"
                >
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="last-3-months">Last 3 Months</option>
                  <option value="last-6-months">Last 6 Months</option>
                  <option value="this-year">This Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Custom Date Pickers */}
              {preset === "custom" && (
                <>
                  <div className="report-filter-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="report-date-input"
                      required
                    />
                  </div>
                  <div className="report-filter-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="report-date-input"
                      required
                    />
                  </div>
                </>
              )}

              {/* Type Filter */}
              <div className="report-filter-group">
                <label>
                  <FiDollarSign /> Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="report-select"
                >
                  <option value="all">All (Income & Expenses)</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expense Only</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="report-filter-group">
                <label>
                  <FiFilter /> Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="report-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                className="report-generate-btn"
                disabled={loading}
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Generating..." : "Generate Report"}</span>
              </button>
            </form>
          </div>

          {/* Export Action Bar */}
          {reportData && (
            <div className="reports-export-bar">
              <div className="export-bar-left">
                <h4>Export & Print</h4>
                <span className="export-period-tag">
                  {reportData.metadata.startDate} to {reportData.metadata.endDate}
                </span>
              </div>

              <div className="export-buttons-group">
                <button
                  type="button"
                  className="export-btn csv"
                  onClick={handleExportCSV}
                  disabled={exporting.csv}
                >
                  <FiDownload />
                  <span>{exporting.csv ? "Exporting CSV..." : "Export CSV"}</span>
                </button>

                <button
                  type="button"
                  className="export-btn excel"
                  onClick={handleExportExcel}
                  disabled={exporting.excel}
                >
                  <FiDownload />
                  <span>{exporting.excel ? "Exporting Excel..." : "Export Excel (.xlsx)"}</span>
                </button>

                <button
                  type="button"
                  className="export-btn pdf"
                  onClick={handleExportPDF}
                  disabled={exporting.pdf}
                >
                  <FiDownload />
                  <span>{exporting.pdf ? "Creating PDF..." : "Download PDF"}</span>
                </button>

                <button
                  type="button"
                  className="export-btn print"
                  onClick={handlePrint}
                >
                  <FiPrinter />
                  <span>Print Report</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading View */}
          {loading && (
            <div className="forecast-empty-state" style={{ background: "#ffffff", padding: "40px" }}>
              <div className="empty-icon-circle animate-spin">
                <FiRefreshCw />
              </div>
              <h3>Generating Financial Report...</h3>
              <p>Analyzing transactions, category allocations, and budget metrics for the selected period.</p>
            </div>
          )}

          {/* Error View */}
          {!loading && error && (
            <div className="forecast-warning-card critical">
              <div className="warning-icon-wrapper">
                <FiAlertCircle />
              </div>
              <div className="warning-content">
                <h4>Report Generation Failed</h4>
                <p className="warning-desc">{error}</p>
                <button
                  type="button"
                  className="report-generate-btn"
                  onClick={loadReport}
                  style={{ height: "36px", padding: "0 18px" }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Report Content */}
          {!loading && !error && reportData && (
            <>
              {/* Financial Summary KPI Cards Grid */}
              <div className="reports-summary-grid">
                {/* 1. Total Income */}
                <div className="report-kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Total Recorded Income</span>
                    <div className="kpi-icon-box green">
                      <FiTrendingUp />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: "#10b981" }}>
                    {fmt(summary.totalIncome)}
                  </div>
                  <div className="kpi-subtext">Cash inflows in selected period</div>
                </div>

                {/* 2. Total Expenses */}
                <div className="report-kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Total Recorded Expenses</span>
                    <div className="kpi-icon-box red">
                      <FiTrendingDown />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ color: "#ef4444" }}>
                    {fmt(summary.totalExpenses)}
                  </div>
                  <div className="kpi-subtext">Cash outflows in selected period</div>
                </div>

                {/* 3. Net Cash Flow */}
                <div className="report-kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Net Cash Flow</span>
                    <div className="kpi-icon-box purple">
                      <FiDollarSign />
                    </div>
                  </div>
                  <div
                    className="kpi-value"
                    style={{ color: summary.netCashFlow >= 0 ? "#10b981" : "#ef4444" }}
                  >
                    {fmt(summary.netCashFlow)}
                  </div>
                  <div className="kpi-subtext">
                    Inflow minus outflow (distinct from bank balance)
                  </div>
                </div>

                {/* 4. Savings Rate */}
                <div className="report-kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Savings Rate</span>
                    <div className="kpi-icon-box blue">
                      <FiPieChart />
                    </div>
                  </div>
                  <div className="kpi-value">
                    {summary.savingsRate}%
                  </div>
                  <div className="kpi-subtext">Percentage of income preserved</div>
                </div>

                {/* 5. Transactions Count */}
                <div className="report-kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Transactions Count</span>
                    <div className="kpi-icon-box amber">
                      <FiLayers />
                    </div>
                  </div>
                  <div className="kpi-value">
                    {summary.transactionCount}
                  </div>
                  <div className="kpi-subtext">Records meeting filter criteria</div>
                </div>

                {/* 6. Highest Category */}
                <div className="report-kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">Highest-Spending Category</span>
                    <div className="kpi-icon-box red">
                      <FiTrendingDown />
                    </div>
                  </div>
                  <div className="kpi-value" style={{ fontSize: "18px" }}>
                    {summary.highestCategory.name}
                  </div>
                  <div className="kpi-subtext">
                    Total: {fmt(summary.highestCategory.amount)}
                  </div>
                </div>
              </div>

              {/* Visual Charts Split View (Income vs Expense & Category Breakdown) */}
              {(monthlySummary.length > 0 || categoryBreakdown.length > 0) && (
                <div className="reports-charts-grid">
                  {/* Monthly Cashflow Comparison */}
                  {monthlySummary.length > 0 && (
                    <div className="report-chart-box">
                      <h3>
                        <FiTrendingUp /> Monthly Cash Flow Comparison
                      </h3>
                      <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={monthlySummary}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                            />
                            <Tooltip
                              formatter={(value) => [fmt(value)]}
                              contentStyle={{
                                background: "#ffffff",
                                borderRadius: 10,
                                border: "1px solid #e2e8f0",
                                fontSize: 12,
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown Donut */}
                  {categoryBreakdown.length > 0 && (
                    <div className="report-chart-box">
                      <h3>
                        <FiPieChart /> Expense Distribution by Category
                      </h3>
                      <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryBreakdown.slice(0, 7)}
                              dataKey="amount"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={3}
                            >
                              {categoryBreakdown.slice(0, 7).map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [fmt(value), "Spent"]}
                              contentStyle={{
                                background: "#ffffff",
                                borderRadius: 10,
                                border: "1px solid #e2e8f0",
                                fontSize: 12,
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Data Table Section */}
              <div className="reports-table-card">
                <div className="reports-table-header-wrap">
                  <h3>
                    {reportType === "monthly-summary"
                      ? "Month-by-Month Statement"
                      : reportType === "expense-analysis"
                      ? "Category-Wise Expense Breakdown"
                      : reportType === "budget-performance"
                      ? "Budget Performance & Variance Statement"
                      : reportType === "savings-goal-progress"
                      ? "Savings Goal Progress Statement"
                      : "Itemized Transaction Statement"}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Showing records for {reportData.metadata.startDate} to {reportData.metadata.endDate}
                  </span>
                </div>

                <div className="table-responsive-container">
                  {/* Table: Monthly Summary */}
                  {reportType === "monthly-summary" && (
                    <table className="reports-data-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th style={{ textAlign: "right" }}>Income</th>
                          <th style={{ textAlign: "right" }}>Expenses</th>
                          <th style={{ textAlign: "right" }}>Net Cash Flow</th>
                          <th style={{ textAlign: "right" }}>Savings Rate</th>
                          <th style={{ textAlign: "right" }}>Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummary.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                              No transactions recorded in the selected period.
                            </td>
                          </tr>
                        ) : (
                          monthlySummary.map((m) => (
                            <tr key={m.monthKey}>
                              <td style={{ fontWeight: 600 }}>{m.label}</td>
                              <td style={{ textAlign: "right", color: "#10b981", fontWeight: 600 }}>
                                {fmt(m.income)}
                              </td>
                              <td style={{ textAlign: "right", color: "#ef4444", fontWeight: 600 }}>
                                {fmt(m.expenses)}
                              </td>
                              <td
                                style={{
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color: m.net >= 0 ? "#10b981" : "#ef4444",
                                }}
                              >
                                {fmt(m.net)}
                              </td>
                              <td style={{ textAlign: "right" }}>{m.savingsRate}%</td>
                              <td style={{ textAlign: "right" }}>{m.count}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Table: Expense Analysis */}
                  {reportType === "expense-analysis" && (
                    <table className="reports-data-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th style={{ textAlign: "right" }}>Total Amount Spent</th>
                          <th style={{ textAlign: "right" }}>Share of Total</th>
                          <th style={{ textAlign: "right" }}>Transaction Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryBreakdown.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                              No expenses recorded in the selected period.
                            </td>
                          </tr>
                        ) : (
                          categoryBreakdown.map((cat) => (
                            <tr key={cat.category}>
                              <td style={{ fontWeight: 600 }}>{cat.category}</td>
                              <td style={{ textAlign: "right", color: "#ef4444", fontWeight: 600 }}>
                                {fmt(cat.amount)}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: "60px", height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ width: `${cat.percentage}%`, height: "100%", background: "#635bff" }} />
                                  </div>
                                  <span>{cat.percentage}%</span>
                                </div>
                              </td>
                              <td style={{ textAlign: "right" }}>{cat.count}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Table: Budget Performance */}
                  {reportType === "budget-performance" && (
                    <table className="reports-data-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Period</th>
                          <th style={{ textAlign: "right" }}>Budget Limit</th>
                          <th style={{ textAlign: "right" }}>Actual Spent</th>
                          <th style={{ textAlign: "right" }}>Variance</th>
                          <th style={{ textAlign: "right" }}>Utilization</th>
                          <th style={{ textAlign: "center" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetPerformance.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                              No budgets created yet. <Link to="/budgets" style={{ color: "#635bff" }}>Set up budgets</Link> to view performance!
                            </td>
                          </tr>
                        ) : (
                          budgetPerformance.map((b) => (
                            <tr key={b.id}>
                              <td style={{ fontWeight: 600 }}>{b.category}</td>
                              <td>{b.month}/{b.year}</td>
                              <td style={{ textAlign: "right" }}>{fmt(b.limit)}</td>
                              <td style={{ textAlign: "right", color: "#ef4444", fontWeight: 600 }}>
                                {fmt(b.spent)}
                              </td>
                              <td
                                style={{
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color: b.variance >= 0 ? "#10b981" : "#ef4444",
                                }}
                              >
                                {fmt(b.variance)}
                              </td>
                              <td style={{ textAlign: "right" }}>{b.usagePct}%</td>
                              <td style={{ textAlign: "center" }}>
                                <span
                                  className={`report-status-badge ${b.status.toLowerCase().replace(/\s+/g, "-")}`}
                                >
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Table: Savings Goal Progress */}
                  {reportType === "savings-goal-progress" && (
                    <table className="reports-data-table">
                      <thead>
                        <tr>
                          <th>Goal Title</th>
                          <th>Category</th>
                          <th style={{ textAlign: "right" }}>Target Amount</th>
                          <th style={{ textAlign: "right" }}>Amount Saved</th>
                          <th style={{ textAlign: "right" }}>Remaining</th>
                          <th style={{ textAlign: "right" }}>Progress</th>
                          <th>Deadline</th>
                          <th style={{ textAlign: "center" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {goalsProgress.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                              No savings goals created yet. <Link to="/goals" style={{ color: "#635bff" }}>Create goals</Link> to track progress!
                            </td>
                          </tr>
                        ) : (
                          goalsProgress.map((g) => (
                            <tr key={g.id}>
                              <td style={{ fontWeight: 600 }}>{g.title}</td>
                              <td>{g.category}</td>
                              <td style={{ textAlign: "right" }}>{fmt(g.target)}</td>
                              <td style={{ textAlign: "right", color: "#10b981", fontWeight: 600 }}>
                                {fmt(g.saved)}
                              </td>
                              <td style={{ textAlign: "right" }}>{fmt(g.remaining)}</td>
                              <td style={{ textAlign: "right" }}>{g.progressPct}%</td>
                              <td>{g.deadline}</td>
                              <td style={{ textAlign: "center" }}>
                                <span
                                  className={`report-status-badge ${g.status.toLowerCase().replace(/\s+/g, "-")}`}
                                >
                                  {g.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Table: Transaction Statement (Default) */}
                  {reportType === "transaction-statement" && (
                    <table className="reports-data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Category</th>
                          <th>Payment Method</th>
                          <th style={{ textAlign: "right" }}>Amount</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                              No transactions recorded for the selected filter criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedTransactions.map((tx) => (
                            <tr key={tx.id}>
                              <td style={{ whiteSpace: "nowrap" }}>{tx.displayDate}</td>
                              <td style={{ fontWeight: 600 }}>{tx.title}</td>
                              <td>
                                <span className={`report-type-badge ${tx.type}`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td>{tx.category}</td>
                              <td>{tx.paymentMethod.toUpperCase()}</td>
                              <td
                                style={{
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color: tx.type === "income" ? "#10b981" : "#ef4444",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                              </td>
                              <td style={{ color: "#64748b", maxWidth: "200px" }}>
                                {tx.description || "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination Controls for Transaction Statement */}
                {reportType === "transaction-statement" && transactions.length > rowsPerPage && (
                  <div className="reports-pagination">
                    <span>
                      Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                      {Math.min(currentPage * rowsPerPage, transactions.length)} of{" "}
                      {transactions.length} records
                    </span>

                    <div className="pagination-btn-group">
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <FiChevronLeft /> Previous
                      </button>

                      <span style={{ padding: "6px 12px", fontWeight: 700, color: "#0f172a" }}>
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
