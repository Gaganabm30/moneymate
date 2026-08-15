import {
  FiCpu,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight
} from "react-icons/fi";

export default function AIInsightCard() {
  const insights = [
    {
      type: "positive",
      icon: <FiTrendingDown />,
      title: "Great spending control",
      text: "Your food expenses are 18% lower than last month."
    },
    {
      type: "warning",
      icon: <FiAlertCircle />,
      title: "Budget alert",
      text: "You're close to reaching your Entertainment budget."
    },
    {
      type: "positive",
      icon: <FiTrendingUp />,
      title: "Savings opportunity",
      text: "You could save around ₹3,200 this month by reducing subscriptions."
    }
  ];

  return (
    <div className="ai-insight-card">

      {/* HEADER */}

      <div className="ai-insight-header">

        <div className="ai-insight-title">

          <div className="ai-icon">
            <FiCpu />
          </div>

          <div>
            <span>AI FINANCIAL ASSISTANT</span>
            <h2>Smart Insights</h2>
          </div>

        </div>

        <div className="ai-status">
          <span></span>
          AI Active
        </div>

      </div>

      {/* MAIN MESSAGE */}

      <div className="ai-main-insight">

        <div className="ai-main-icon">
          <FiCheckCircle />
        </div>

        <div>
          <h3>Your finances look healthy</h3>

          <p>
            Based on your recent transactions, you're
            spending less than you earn and your savings
            are moving in the right direction.
          </p>
        </div>

      </div>

      {/* INSIGHTS */}

      <div className="ai-insights-list">

        {insights.map((insight, index) => (

          <div
            className={`ai-insight-item ${insight.type}`}
            key={index}
          >

            <div className="ai-item-icon">
              {insight.icon}
            </div>

            <div className="ai-item-content">

              <h4>{insight.title}</h4>

              <p>{insight.text}</p>

            </div>

          </div>

        ))}

      </div>

      {/* FOOTER */}

      <button className="view-ai-insights">

        View Full AI Analysis

        <FiArrowRight />

      </button>

    </div>
  );
}