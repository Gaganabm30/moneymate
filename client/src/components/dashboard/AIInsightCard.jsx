import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiTrendingUp, FiInfo, FiAlertCircle } from "react-icons/fi";

export default function AIInsightCard({ transactions = [], balance = 0, income = 0, expenses = 0 }) {
  const hasData = transactions && transactions.length > 0;
  const savings = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  return (
    <div className="ai-insight-card">
      <div className="ai-insight-header">
        <div className="ai-icon">✨</div>

        <div>
          <span className="ai-label">MONEYMATE AI</span>
          <h3>{hasData ? "Smart Financial Insight" : "Your Financial Assistant"}</h3>
        </div>
      </div>

      <div className="ai-insight-content">
        {!hasData ? (
          <>
            <div className="ai-insight-message">
              <FiInfo className="insight-check" />
              <p>
                <strong>Welcome to MoneyMate AI! 👋</strong>
                <br />
                Add a few transactions and I'll analyze your spending, identify patterns, and provide personalized financial insights.
              </p>
            </div>

            <div className="ai-insight-stat">
              <div className="ai-stat-icon">
                <FiTrendingUp />
              </div>
              <div>
                <span>Getting Started</span>
                <strong>0 transactions recorded</strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="ai-insight-message">
              {savings >= 0 ? (
                <FiCheckCircle className="insight-check" />
              ) : (
                <FiAlertCircle className="insight-check warning" />
              )}

              <p>
                {savings >= 0 ? (
                  <>
                    You are saving <strong>{savingsRate}%</strong> of your income this period.
                    Keep maintaining your smart spending habits!
                  </>
                ) : (
                  <>
                    Your expenses currently exceed income by <strong>₹{Math.abs(savings).toLocaleString("en-IN")}</strong>.
                    Consider reviewing your top discretionary spending.
                  </>
                )}
              </p>
            </div>

            <div className="ai-insight-stat">
              <div className="ai-stat-icon">
                <FiTrendingUp />
              </div>

              <div>
                <span>{savings >= 0 ? "Net Savings" : "Deficit"}</span>
                <strong>₹{Math.abs(savings).toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </>
        )}
      </div>

      <Link to="/ai-insights" className="ai-insight-button">
        View AI Insights
        <FiArrowRight />
      </Link>
    </div>
  );
}