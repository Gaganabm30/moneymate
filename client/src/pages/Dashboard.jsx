import {
  useEffect,
  useState,
} from "react";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import Layout from "../components/common/Layout";
import StatCard from "../components/dashboard/StatCard";

import { getAnalytics } from "../services/analyticsService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <Layout>
        <div>Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            FINANCIAL OVERVIEW
          </p>

          <h1>Your money at a glance</h1>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Income"
          value={currency(data.summary.income)}
        />

        <StatCard
          title="Total Expenses"
          value={currency(data.summary.expenses)}
        />

        <StatCard
          title="Balance"
          value={currency(data.summary.balance)}
        />

        <StatCard
          title="Savings Rate"
          value={`${data.summary.savingsRate}%`}
        />
      </div>

      <div className="dashboard-grid">
        <div className="card chart-card">
          <h3>Spending trend</h3>

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <LineChart data={data.monthlyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="total"
                stroke="currentColor"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Expense categories</h3>

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <PieChart>
              <Pie
                data={data.categoryData}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={100}
              />

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="intelligence-grid">
        <div className="card health-card">
          <p className="eyebrow">
            FINANCIAL HEALTH
          </p>

          <div className="score">
            {data.health.score}
            <span>/100</span>
          </div>

          <h3>{data.health.label}</h3>
        </div>

        <div className="card">
          <p className="eyebrow">
            NEXT MONTH FORECAST
          </p>

          <h2>
            {currency(
              data.predictedNextMonth
            )}
          </h2>

          <p className="muted">
            Estimated using your recent
            spending history.
          </p>
        </div>

        <div className="card">
          <p className="eyebrow">
            MONEY LEAKS
          </p>

          <h2>{data.moneyLeaks.length}</h2>

          <p className="muted">
            Repeated spending patterns
            worth reviewing.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;