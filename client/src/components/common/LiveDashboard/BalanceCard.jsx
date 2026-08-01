import "./LiveDashboard.css";
import { motion } from "framer-motion";

export default function BalanceCard() {
  return (
    <motion.div
      className="balance-card"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="demo-badge">
        ✨ DEMO DASHBOARD
      </div>

      <div className="balance-top">

        <div>
          <p>See how MoneyMate works</p>
          <small className="updated">
            Updated just now
          </small>
        </div>

        <div className="live-dot">
          <span></span>
          LIVE
        </div>

      </div>

      <h1>₹48,520</h1>

      <div className="balance-growth">
        ▲ +12.4% this month
      </div>

<div className="mini-stats">

    <div className="mini-box">

        <small>Income</small>

        <h4>₹52K</h4>

    </div>

    <div className="mini-box">

        <small>Expense</small>

        <h4>₹24K</h4>

    </div>

    <div className="mini-box">

        <small>Savings</small>

        <h4>₹28K</h4>

    </div>

</div>

    </motion.div>
  );
}