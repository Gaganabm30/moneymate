import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { FiTrendingUp, FiPlus } from "react-icons/fi";

function formatAmount(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p className="tooltip-month">{label}</p>
      {payload.map((item) => (
        <div className="tooltip-row" key={item.dataKey}>
          <span className="tooltip-legend-dot" style={{ backgroundColor: item.color }} />
          <span>{item.name}:</span>
          <strong>₹{Number(item.value || 0).toLocaleString("en-IN")}</strong>
        </div>
      ))}
    </div>
  );
}

export default function ExpenseChart({ transactions = [], onAddTransactionClick }) {
  const [period, setPeriod] = useState("Last 6 months");

  // Aggregate user's real transactions by month
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const monthCount = period === "Last 12 months" ? 12 : 6;
    const now = new Date();
    const months = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: `${monthName}${period === "Last 12 months" ? ` '${String(year).slice(2)}` : ""}`,
        income: 0,
        expense: 0,
        hasData: false
      });
    }

    const monthMap = {};
    months.forEach((m) => {
      monthMap[m.key] = m;
    });

    transactions.forEach((tx) => {
      const txDate = tx.date ? new Date(tx.date) : new Date();
      if (!isNaN(txDate.getTime())) {
        const key = `${txDate.getFullYear()}-${txDate.getMonth()}`;
        if (monthMap[key]) {
          const amt = Math.abs(Number(tx.amount) || 0);
          const isIncome = tx.type ? tx.type === "income" : Number(tx.amount) > 0;
          if (isIncome) {
            monthMap[key].income += amt;
          } else {
            monthMap[key].expense += amt;
          }
          monthMap[key].hasData = true;
        }
      }
    });

    return months;
  }, [transactions, period]);

  const hasActivity = transactions && transactions.length > 0;

  return (
    <div className="expense-chart-card">
      {/* HEADER */}
      <div className="chart-header">
        <div>
          <span className="section-label">FINANCIAL OVERVIEW</span>
          <h3>Income vs Expenses</h3>
          <p>
            {hasActivity
              ? "Your financial activity over the selected period"
              : "No financial activity recorded yet"}
          </p>
        </div>

        {hasActivity && (
          <select
            className="chart-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="Last 6 months">Last 6 months</option>
            <option value="Last 12 months">Last 12 months</option>
          </select>
        )}
      </div>

      {/* EMPTY STATE */}
      {!hasActivity ? (
        <div className="chart-empty-state">
          <div className="chart-empty-icon">
            <FiTrendingUp />
          </div>
          <h4>No financial activity yet</h4>
          <p>
            Add your first transaction to see your spending and income trends visualised here.
          </p>
          {onAddTransactionClick && (
            <button
              type="button"
              className="chart-empty-btn"
              onClick={onAddTransactionClick}
            >
              <FiPlus /> Add Transaction
            </button>
          )}
        </div>
      ) : (
        /* CHART */
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6257ff" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#6257ff" stopOpacity={0.0} />
                </linearGradient>

                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f5" />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8a93a4", fontSize: 12 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8a93a4", fontSize: 11 }}
                tickFormatter={formatAmount}
                width={52}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                height={35}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", color: "#647087" }}
              />

              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#6257ff"
                strokeWidth={2.5}
                fill="url(#incomeGradient)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#6257ff" }}
                animationDuration={800}
              />

              <Area
                type="monotone"
                dataKey="expense"
                name="Expenses"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#expenseGradient)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#ef4444" }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}