import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const insights = [
  {
    emoji: "🍔",
    title: "Food Spending",
    text: "You spent 18% less on food compared to last month."
  },
  {
    emoji: "🎉",
    title: "Savings",
    text: "You saved ₹4,250 this month. Great job!"
  },
  {
    emoji: "⚡",
    title: "Electricity",
    text: "Electricity bills are higher than your average."
  },
  {
    emoji: "💰",
    title: "Investment",
    text: "You could invest ₹6,000 without affecting your budget."
  }
];

export default function AIInsightCard() {

  const [index, setIndex] = useState(0);

  useEffect(() => {

    const timer = setInterval(() => {

      setIndex(prev =>
        prev === insights.length - 1 ? 0 : prev + 1
      );

    }, 4000);

    return () => clearInterval(timer);

  }, []);

  return (

    <div className="ai-card">

      <div className="ai-header">

        <span>🤖</span>

        <h3>AI Insight</h3>

      </div>

      <AnimatePresence mode="wait">

        <motion.div

          key={index}

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          exit={{ opacity: 0, y: -20 }}

          transition={{ duration: .45 }}

        >

          <h4>

            {insights[index].emoji}

            {" "}

            {insights[index].title}

          </h4>

          <p>

            {insights[index].text}

          </p>

        </motion.div>

      </AnimatePresence>

    </div>

  );

}