import FloatingCards from "./FloatingCards";
import { motion } from "framer-motion";

export default function AuthIllustration() {

  return (

    <div className="illustration">

      {/* Badge */}

      <motion.div
        className="badge"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6 }}
      >
        🚀 MoneyMate AI
      </motion.div>

      {/* Heading */}

      <motion.h1
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: .2, duration: .6 }}
      >

        Smart Finance

        <br />

        Starts Here.

      </motion.h1>

      {/* Description */}

      <motion.p
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: .4, duration: .6 }}
      >

        Manage your expenses, budgets and savings with

        <strong> AI-powered insights</strong>.

        Track every rupee, understand your spending habits,

        and make smarter financial decisions.

      </motion.p>

      {/* Floating Dashboard */}

      <FloatingCards />

      {/* Floating Info Badges */}

      <motion.div
        className="floating-badge badge1"
        animate={{
          y: [0, -12, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity
        }}
      >
        💰 Income
        <strong>₹52K</strong>
      </motion.div>

      <motion.div
        className="floating-badge badge2"
        animate={{
          y: [0, -12, 0]
        }}
        transition={{
          duration: 4,
          delay: 1,
          repeat: Infinity
        }}
      >
        📈 Savings
        <strong>+18%</strong>
      </motion.div>

      <motion.div
        className="floating-badge badge3"
        animate={{
          y: [0, -12, 0]
        }}
        transition={{
          duration: 4,
          delay: 2,
          repeat: Infinity
        }}
      >
        🤖 AI Score
        <strong>92/100</strong>
      </motion.div>

    </div>

  );

}