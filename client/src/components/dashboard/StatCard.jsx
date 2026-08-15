import { motion } from "framer-motion";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

export default function StatCard({
  title,
  value,
  change,
  subtitle,
  icon,
  type = "balance"
}) {
  const isNegative = change?.startsWith("-");

  return (
    <motion.div
      className={`stat-card stat-${type}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >

      {/* TOP */}

      <div className="stat-card-top">

        <div className="stat-card-title">
          <span>{title}</span>
        </div>

        <div className="stat-card-icon">
          {icon}
        </div>

      </div>


      {/* VALUE */}

      <div className="stat-card-value">
        {value}
      </div>


      {/* BOTTOM */}

      <div className="stat-card-bottom">

        <span
          className={`stat-change ${
            isNegative ? "negative" : "positive"
          }`}
        >
          {isNegative ? (
            <FiArrowDownRight />
          ) : (
            <FiArrowUpRight />
          )}

          {change}
        </span>

        <span className="stat-subtitle">
          {subtitle}
        </span>

      </div>

    </motion.div>
  );
}