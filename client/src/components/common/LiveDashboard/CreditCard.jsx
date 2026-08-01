import { motion } from "framer-motion";
import "./LiveDashboard.css";

export default function CreditCard() {
  return (
    <motion.div
      className="credit-card"
      whileHover={{
        rotateY: 12,
        rotateX: -6,
        scale: 1.04
      }}
    >
      <div className="chip"></div>

      <h3>MoneyMate AI</h3>

      <h2>•••• •••• •••• 3042</h2>

      <div className="card-footer">
        <span>GAGANA B M</span>

        <span>12/29</span>
      </div>
    </motion.div>
  );
}