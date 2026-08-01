import { Link } from "react-router-dom";
import { 
  FiArrowRight, 
  FiArrowUpRight,
  FiZap, 
  FiTrendingUp, 
  FiTarget, 
  FiShield, 
  FiLock, 
  FiActivity, 
  FiStar,
  FiCreditCard
} from "react-icons/fi";

import LiveDashboard from "../components/common/LiveDashboard/LiveDashboard";
import "../styles/landing.css";

export default function Landing() {
  const features = [
    {
      icon: <FiZap />,
      title: "AI Smart Insights",
      description: "Auto-categorizes your transactions and provides real-time personalized spending recommendations.",
      tag: "Automated",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)"
    },
    {
      icon: <FiTrendingUp />,
      title: "Real-Time Analytics",
      description: "Visualize cash flow trends, income vs expenses, and monthly growth with interactive charts.",
      tag: "Live Data",
      gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)"
    },
    {
      icon: <FiTarget />,
      title: "Smart Goal Tracking",
      description: "Set targeted savings goals for emergency funds, vacations, or investments and track milestone progress.",
      tag: "Goal Centric",
      gradient: "linear-gradient(135deg, #10b981, #059669)"
    },
    {
      icon: <FiActivity />,
      title: "Financial Health Score",
      description: "Get an instant stability rating based on your savings-to-debt ratio and spending habits.",
      tag: "Instant Rating",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)"
    },
    {
      icon: <FiShield />,
      title: "Smart Budget Alerts",
      description: "Receive instant push alerts when approaching category budget limits to prevent accidental overspending.",
      tag: "Proactive",
      gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)"
    },
    {
      icon: <FiLock />,
      title: "Bank-Grade Security",
      description: "256-bit SSL encryption and strict data privacy protocols ensuring your personal data stays 100% confidential.",
      tag: "Encrypted",
      gradient: "linear-gradient(135deg, #64748b, #334155)"
    }
  ];

  return (
    <div className="landing-page">
      {/* Background Gradients */}
      <div className="gradient one"></div>
      <div className="gradient two"></div>
      <div className="gradient three"></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">M</div>
          <div>
            <h2>MoneyMate AI</h2>
            <span>Smart Finance</span>
          </div>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <Link to="/login">Login</Link>
          <Link className="btn-primary" to="/register">
            Get Started <FiArrowRight />
          </Link>
        </div>
      </nav>

      {/* Main Hero Container - Centered Content */}
      <section className="hero-section">
        <div className="hero-header">
          <div className="badge">
            <FiZap className="badge-icon" /> AI Powered Finance Platform
          </div>

          <h1 className="hero-title">
            Spend Smarter.
            <span className="gradient-text"> Save Better.</span>
            <br />
            Live Freely.
          </h1>

          <p className="hero-description">
            MoneyMate helps you track every rupee, understand your spending habits,
            receive intelligent AI insights, and achieve your financial goals effortlessly.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="btn-primary big">
              Start Free Trial <FiArrowRight />
            </Link>

            <Link to="/login" className="btn-secondary big">
              Explore Demo
            </Link>
          </div>

          {/* Key Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <h2>10K+</h2>
              <span>Active Users</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h2>₹5Cr+</h2>
              <span>Money Tracked</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h2>99%</h2>
              <span>Satisfaction</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h2>4.9 <FiStar className="star-icon" /></h2>
              <span>User Rating</span>
            </div>
          </div>
        </div>

        {/* Live Dashboard Preview with Revolving Background Demo Data */}
        <div className="hero-dashboard-wrapper">
          <div className="dashboard-glow"></div>

          {/* Floating Demo Data Badges Flanking the Dashboard */}
          <div className="floating-badge badge-top-left float-anim-1">
            <div className="floating-icon green-icon">
              <FiArrowUpRight />
            </div>
            <div className="floating-info">
              <span className="floating-label">Salary Credited</span>
              <span className="floating-val green-text">+₹85,000</span>
            </div>
            <span className="pulse-dot"></span>
          </div>

          <div className="floating-badge badge-top-right float-anim-2">
            <div className="floating-icon purple-icon">
              <FiZap />
            </div>
            <div className="floating-info">
              <span className="floating-label">AI Insight</span>
              <span className="floating-text">"Saved ₹2,400 this week!"</span>
            </div>
          </div>

          <div className="floating-badge badge-mid-left float-anim-3">
            <div className="floating-icon blue-icon">
              <FiTrendingUp />
            </div>
            <div className="floating-info">
              <span className="floating-label">Savings Growth</span>
              <span className="floating-val blue-text">+14.2% APY</span>
            </div>
          </div>

          <div className="floating-badge badge-mid-right float-anim-4">
            <div className="floating-icon red-icon">
              <FiCreditCard />
            </div>
            <div className="floating-info">
              <span className="floating-label">Netflix Premium</span>
              <span className="floating-val red-text">-₹649</span>
            </div>
          </div>

          <div className="floating-badge badge-bottom-left float-anim-5">
            <div className="floating-icon emerald-icon">
              <FiTarget />
            </div>
            <div className="floating-info">
              <span className="floating-label">Emergency Fund</span>
              <span className="floating-text">92% Completed 🎉</span>
            </div>
          </div>

          <div className="floating-badge badge-bottom-right float-anim-6">
            <div className="floating-icon orange-icon">
              <FiShield />
            </div>
            <div className="floating-info">
              <span className="floating-label">Budget Shield</span>
              <span className="floating-text">Safe Spend Limit</span>
            </div>
          </div>

          <LiveDashboard />
        </div>
      </section>

      {/* Features Section - Filling the gap below */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div className="section-badge">✨ Key Capabilities</div>
          <h2>Everything You Need to Master Your Money</h2>
          <p>Supercharge your personal finances with AI-driven analytics, budget controls, and bank-grade security.</p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => (
            <div className="feature-card" key={idx}>
              <div className="feature-card-header">
                <div className="feature-icon" style={{ background: feature.gradient }}>
                  {feature.icon}
                </div>
                <span className="feature-tag">{feature.tag}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner Section */}
      <section className="cta-section" id="about">
        <div className="cta-card">
          <div className="cta-content">
            <h2>Ready to Take Control of Your Financial Future?</h2>
            <p>Join thousands of smart spenders who use MoneyMate AI to save more every single month.</p>
            <Link to="/register" className="btn-primary big cta-btn">
              Get Started for Free <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-icon small">M</div>
            <span>MoneyMate AI &copy; {new Date().getFullYear()} - All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}