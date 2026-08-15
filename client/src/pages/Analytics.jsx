import "../styles/analytics.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

import {
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiTarget,
  FiPieChart,
  FiActivity,
  FiArrowRight,
  FiInfo,
  FiCalendar,
  FiStar,
  FiShoppingBag,
  FiCoffee,
  FiHome,
  FiTruck,
  FiCreditCard
} from "react-icons/fi";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";


// --------------------------------------------------
// MOCK DATA
// --------------------------------------------------
// Keep this empty for a new user.
// Later replace this with data from your backend.

const hasFinancialData = false;


// Sample data for demonstration.
// These are NOT displayed when hasFinancialData = false.

const monthlyData = [
  {
    month: "Jan",
    income: 42000,
    expenses: 30000,
    savings: 12000
  },
  {
    month: "Feb",
    income: 45000,
    expenses: 28000,
    savings: 17000
  },
  {
    month: "Mar",
    income: 48000,
    expenses: 32000,
    savings: 16000
  },
  {
    month: "Apr",
    income: 50000,
    expenses: 26000,
    savings: 24000
  },
  {
    month: "May",
    income: 52000,
    expenses: 24000,
    savings: 28000
  },
  {
    month: "Jun",
    income: 55000,
    expenses: 23000,
    savings: 32000
  }
];


const categoryData = [
  {
    name: "Food & Dining",
    value: 6500,
    color: "#6C5CE7",
    icon: <FiCoffee />
  },
  {
    name: "Shopping",
    value: 4200,
    color: "#8B7CF6",
    icon: <FiShoppingBag />
  },
  {
    name: "Transportation",
    value: 3000,
    color: "#A99CFF",
    icon: <FiTruck />
  },
  {
    name: "Bills & Utilities",
    value: 5000,
    color: "#C1B9FF",
    icon: <FiHome />
  },
  {
    name: "Entertainment",
    value: 2300,
    color: "#D5D0FF",
    icon: <FiCreditCard />
  }
];


const budgetData = [
  {
    name: "Food",
    spent: 0,
    budget: 8000
  },
  {
    name: "Shopping",
    spent: 0,
    budget: 5000
  },
  {
    name: "Transportation",
    spent: 0,
    budget: 4000
  },
  {
    name: "Entertainment",
    spent: 0,
    budget: 3000
  },
  {
    name: "Utilities",
    spent: 0,
    budget: 5500
  }
];


export default function Analytics() {

  return (
    <div className="analytics-page">

      {/* SIDEBAR */}
      <Sidebar />


      {/* MAIN AREA */}
      <main className="analytics-main">

        <Topbar />


        <div className="analytics-content">

          {/* ========================================
              HEADER
          ======================================== */}

          <section className="analytics-header">

            <div className="analytics-title-area">

              <span className="analytics-eyebrow">
                FINANCIAL ANALYTICS
              </span>

              <h1>
                Understand your money better.
              </h1>

              <p>
                Analyze your income, spending, savings and
                financial habits with detailed insights.
              </p>

            </div>


            <div className="analytics-header-actions">

              <button className="date-filter">
                <FiCalendar />
                <span>Last 6 Months</span>
                <span className="filter-arrow">⌄</span>
              </button>

              <button className="export-btn">
                <FiDownload />
                <span>Export Report</span>
              </button>

            </div>

          </section>


          {/* ========================================
              SUMMARY CARDS
          ======================================== */}

          <section className="analytics-summary-grid">

            <AnalyticsSummaryCard
              title="Net Cash Flow"
              value={hasFinancialData ? "₹28,000" : "₹0"}
              change={hasFinancialData ? "+12.5%" : "+0.0%"}
              subtitle={
                hasFinancialData
                  ? "vs previous period"
                  : "No transactions yet"
              }
              icon={<FiDollarSign />}
              type="purple"
            />


            <AnalyticsSummaryCard
              title="Average Monthly Income"
              value={hasFinancialData ? "₹52,000" : "₹0"}
              change={hasFinancialData ? "+8.2%" : "+0.0%"}
              subtitle={
                hasFinancialData
                  ? "monthly average"
                  : "Add your first income"
              }
              icon={<FiTrendingUp />}
              type="green"
            />


            <AnalyticsSummaryCard
              title="Average Monthly Spending"
              value={hasFinancialData ? "₹24,000" : "₹0"}
              change={hasFinancialData ? "-5.4%" : "0.0%"}
              subtitle={
                hasFinancialData
                  ? "monthly average"
                  : "No expenses recorded"
              }
              icon={<FiTrendingDown />}
              type="red"
            />


            <AnalyticsSummaryCard
              title="Savings Rate"
              value={hasFinancialData ? "53.8%" : "0%"}
              change={hasFinancialData ? "+6.4%" : "0.0%"}
              subtitle={
                hasFinancialData
                  ? "of total income"
                  : "Start saving"
              }
              icon={<FiTarget />}
              type="blue"
            />

          </section>


          {/* ========================================
              INCOME VS EXPENSES
          ======================================== */}

          <section className="analytics-card large-chart-card">

            <div className="card-heading">

              <div>
                <span className="card-eyebrow">
                  FINANCIAL TREND
                </span>

                <h2>Income vs Expenses</h2>

                <p>
                  Track how your income and expenses change over time.
                </p>
              </div>


              <select className="chart-select">
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Yearly</option>
              </select>

            </div>


            {hasFinancialData ? (

              <div className="chart-container">

                <ResponsiveContainer
                  width="100%"
                  height={330}
                >

                  <LineChart data={monthlyData}>

                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="#E8EBF3"
                    />

                    <XAxis
                      dataKey="month"
                      stroke="#94A3B8"
                    />

                    <YAxis
                      stroke="#94A3B8"
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#6C5CE7"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#EF6461"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            ) : (

              <EmptyChart
                icon={<FiActivity />}
                title="No financial activity yet"
                text="Add your first transaction to see your income and expense trends here."
              />

            )}

          </section>


          {/* ========================================
              CATEGORY + TOP SPENDING
          ======================================== */}

          <section className="analytics-two-column">


            {/* SPENDING CATEGORY */}

            <section className="analytics-card">

              <div className="card-heading">

                <div>

                  <span className="card-eyebrow">
                    SPENDING BREAKDOWN
                  </span>

                  <h2>Spending by Category</h2>

                  <p>
                    See where your money is going.
                  </p>

                </div>

              </div>


              {hasFinancialData ? (

                <div className="category-chart-wrapper">

                  <div className="donut-container">

                    <ResponsiveContainer
                      width="100%"
                      height={230}
                    >

                      <PieChart>

                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                        >

                          {categoryData.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                              />
                            )
                          )}

                        </Pie>

                        <Tooltip />

                      </PieChart>

                    </ResponsiveContainer>


                    <div className="donut-center">

                      <strong>₹24K</strong>

                      <span>Total</span>

                    </div>

                  </div>


                  <div className="category-list">

                    {categoryData.map((item) => (

                      <div
                        className="category-item"
                        key={item.name}
                      >

                        <div className="category-name">

                          <span
                            className="category-dot"
                            style={{
                              backgroundColor: item.color
                            }}
                          />

                          <span>{item.name}</span>

                        </div>

                        <strong>
                          ₹{item.value.toLocaleString("en-IN")}
                        </strong>

                      </div>

                    ))}

                  </div>

                </div>

              ) : (

                <EmptyChart
                  icon={<FiPieChart />}
                  title="No spending data yet"
                  text="Your spending categories will appear here after you add transactions."
                />

              )}

            </section>



            {/* TOP CATEGORIES */}

            <section className="analytics-card">

              <div className="card-heading">

                <div>

                  <span className="card-eyebrow">
                    TOP SPENDING
                  </span>

                  <h2>Top Categories</h2>

                  <p>
                    Your highest spending areas.
                  </p>

                </div>

              </div>


              {hasFinancialData ? (

                <div className="top-category-list">

                  {categoryData.map((item, index) => {

                    const maxValue = 6500;

                    const percentage =
                      (item.value / maxValue) * 100;

                    return (

                      <div
                        className="top-category"
                        key={item.name}
                      >

                        <div className="top-category-info">

                          <div className="rank">
                            {index + 1}
                          </div>

                          <div className="top-category-details">

                            <div className="top-category-name">
                              {item.name}
                            </div>

                            <div className="category-progress">

                              <span
                                style={{
                                  width: `${percentage}%`
                                }}
                              />

                            </div>

                          </div>

                          <strong>
                            ₹{item.value.toLocaleString("en-IN")}
                          </strong>

                        </div>

                      </div>

                    );

                  })}

                </div>

              ) : (

                <EmptyChart
                  icon={<FiTrendingDown />}
                  title="No spending patterns"
                  text="Add expenses to discover your top spending categories."
                />

              )}

            </section>

          </section>


          {/* ========================================
              MONTHLY SPENDING
          ======================================== */}

          <section className="analytics-card">

            <div className="card-heading">

              <div>

                <span className="card-eyebrow">
                  MONTHLY ANALYSIS
                </span>

                <h2>Monthly Spending</h2>

                <p>
                  Compare your financial activity across months.
                </p>

              </div>


              <div className="chart-tabs">

                <button className="active">
                  Expenses
                </button>

                <button>
                  Income
                </button>

                <button>
                  Savings
                </button>

              </div>

            </div>


            {hasFinancialData ? (

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <BarChart data={monthlyData}>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#E8EBF3"
                  />

                  <XAxis
                    dataKey="month"
                    stroke="#94A3B8"
                  />

                  <YAxis
                    stroke="#94A3B8"
                  />

                  <Tooltip />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#6C5CE7"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <EmptyChart
                icon={<FiActivity />}
                title="No monthly spending data"
                text="Your monthly spending chart will appear after you record expenses."
              />

            )}

          </section>


          {/* ========================================
              BUDGET PERFORMANCE
          ======================================== */}

          <section className="analytics-card">

            <div className="card-heading">

              <div>

                <span className="card-eyebrow">
                  BUDGET CONTROL
                </span>

                <h2>Budget Performance</h2>

                <p>
                  See how you're doing against your planned budgets.
                </p>

              </div>

            </div>


            {hasFinancialData ? (

              <div className="budget-performance">

                {budgetData.map((budget) => {

                  const percentage =
                    Math.min(
                      (budget.spent / budget.budget) * 100,
                      100
                    );

                  return (

                    <div
                      className="budget-row"
                      key={budget.name}
                    >

                      <div className="budget-row-header">

                        <span>
                          {budget.name}
                        </span>

                        <strong>
                          ₹{budget.spent.toLocaleString("en-IN")}
                          {" / "}
                          ₹{budget.budget.toLocaleString("en-IN")}
                        </strong>

                      </div>

                      <div className="budget-progress">

                        <span
                          style={{
                            width: `${percentage}%`
                          }}
                        />

                      </div>

                      <small>
                        {Math.round(percentage)}% used
                      </small>

                    </div>

                  );

                })}

              </div>

            ) : (

              <div className="budget-empty">

                <div className="empty-icon">
                  <FiTarget />
                </div>

                <div>

                  <h3>Create your first budget</h3>

                  <p>
                    Set spending limits to start tracking your budget performance.
                  </p>

                </div>

                <button className="small-action-btn">
                  Create Budget
                  <FiArrowRight />
                </button>

              </div>

            )}

          </section>


          {/* ========================================
              SAVINGS ANALYSIS
          ======================================== */}

          <section className="analytics-two-column">


            <section className="analytics-card savings-card">

              <div className="card-heading">

                <div>

                  <span className="card-eyebrow">
                    SAVINGS
                  </span>

                  <h2>Savings Progress</h2>

                  <p>
                    Track your progress toward your savings goals.
                  </p>

                </div>

              </div>


              <div className="savings-empty">

                <div className="savings-circle">

                  <span>0%</span>

                </div>

                <h3>
                  Start building your savings
                </h3>

                <p>
                  Add your income and expenses to start
                  calculating your savings rate.
                </p>

                <button className="small-action-btn">
                  Set Savings Goal
                  <FiArrowRight />
                </button>

              </div>

            </section>



            {/* FINANCIAL HEALTH */}

            <section className="analytics-card">

              <div className="card-heading">

                <div>

                  <span className="card-eyebrow">
                    FINANCIAL HEALTH
                  </span>

                  <h2>Financial Health</h2>

                  <p>
                    Your overall financial wellness score.
                  </p>

                </div>

              </div>


              <div className="health-empty">

                <div className="health-score">

                  <strong>--</strong>

                  <span>/ 100</span>

                </div>

                <div className="health-status">
                  Not enough data
                </div>

                <p>
                  Add transactions, budgets and savings goals
                  to calculate your financial health score.
                </p>

                <div className="health-factors">

                  <HealthFactor
                    name="Savings"
                    value="--"
                  />

                  <HealthFactor
                    name="Budget Control"
                    value="--"
                  />

                  <HealthFactor
                    name="Spending Consistency"
                    value="--"
                  />

                  <HealthFactor
                    name="Emergency Fund"
                    value="--"
                  />

                </div>

              </div>

            </section>

          </section>


          {/* ========================================
              AI ANALYSIS
          ======================================== */}

          <section className="ai-analytics-card">

            <div className="ai-card-header">

              <div className="ai-icon">
                <FiStar />
              </div>

              <div>

                <span>
                  MONEYMATE AI
                </span>

                <h2>
                  Your Financial Assistant
                </h2>

                <p>
                  Personalized insights based on your financial activity.
                </p>

              </div>

            </div>


            {hasFinancialData ? (

              <div className="ai-insights-grid">

                <AIInsight
                  title="Spending is trending downward"
                  text="Your expenses decreased compared with the previous month."
                  icon={<FiTrendingDown />}
                />

                <AIInsight
                  title="Your savings are improving"
                  text="You're currently saving more of your monthly income."
                  icon={<FiTrendingUp />}
                />

                <AIInsight
                  title="Food is your largest category"
                  text="Consider setting a monthly dining budget."
                  icon={<FiCoffee />}
                />

              </div>

            ) : (

              <div className="ai-empty">

                <div className="ai-empty-icon">
                  <FiInfo />
                </div>

                <div>

                  <h3>
                    Your AI insights will appear here
                  </h3>

                  <p>
                    Add a few transactions and MoneyMate AI
                    will analyze your spending patterns and
                    provide personalized financial insights.
                  </p>

                </div>

                <button className="ai-view-btn">
                  View AI Insights
                  <FiArrowRight />
                </button>

              </div>

            )}

          </section>


          {/* ========================================
              RECENT ACTIVITY
          ======================================== */}

          <section className="analytics-card activity-card">

            <div className="card-heading">

              <div>

                <span className="card-eyebrow">
                  ACTIVITY
                </span>

                <h2>Recent Financial Activity</h2>

                <p>
                  Your latest income and expense activity.
                </p>

              </div>


              <button className="view-all-btn">
                View All
                <FiArrowRight />
              </button>

            </div>


            <div className="activity-empty">

              <div className="activity-empty-icon">
                <FiActivity />
              </div>

              <h3>
                No financial activity yet
              </h3>

              <p>
                Add your first transaction to start
                analyzing your finances.
              </p>

              <button className="small-action-btn">
                + Add Transaction
              </button>

            </div>

          </section>


        </div>

      </main>

    </div>
  );
}


/* ==================================================
   SUMMARY CARD
================================================== */

function AnalyticsSummaryCard({
  title,
  value,
  change,
  subtitle,
  icon,
  type
}) {

  return (

    <div className={`analytics-summary-card ${type}`}>

      <div className="summary-top">

        <span className="summary-title">
          {title}
        </span>

        <div className="summary-icon">
          {icon}
        </div>

      </div>

      <strong className="summary-value">
        {value}
      </strong>

      <div className="summary-bottom">

        <span className="summary-change">
          ↗ {change}
        </span>

        <span className="summary-subtitle">
          {subtitle}
        </span>

      </div>

    </div>

  );
}


/* ==================================================
   EMPTY CHART
================================================== */

function EmptyChart({
  icon,
  title,
  text
}) {

  return (

    <div className="empty-chart">

      <div className="empty-chart-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

    </div>

  );
}


/* ==================================================
   HEALTH FACTOR
================================================== */

function HealthFactor({
  name,
  value
}) {

  return (

    <div className="health-factor">

      <span>{name}</span>

      <strong>{value}</strong>

    </div>

  );

}


/* ==================================================
   AI INSIGHT
================================================== */

function AIInsight({
  title,
  text,
  icon
}) {

  return (

    <div className="ai-insight">

      <div className="ai-insight-icon">
        {icon}
      </div>

      <div>

        <h3>{title}</h3>

        <p>{text}</p>

      </div>

    </div>

  );

}