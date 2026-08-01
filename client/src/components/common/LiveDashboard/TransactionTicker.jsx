import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const transactions = [
  {
    icon: "💼",
    title: "Salary",
    amount: "+₹52,000",
    color: "green"
  },
  {
    icon: "🍔",
    title: "Swiggy",
    amount: "-₹420",
    color: "red"
  },
  {
    icon: "🛒",
    title: "Amazon",
    amount: "-₹2,399",
    color: "red"
  },
  {
    icon: "🚕",
    title: "Uber",
    amount: "-₹260",
    color: "red"
  },
  {
    icon: "💵",
    title: "Interest",
    amount: "+₹180",
    color: "green"
  },
  {
    icon: "🎬",
    title: "Netflix",
    amount: "-₹649",
    color: "red"
  }
];

export default function TransactionTicker() {

  const [index, setIndex] = useState(0);

  useEffect(() => {

    const timer = setInterval(() => {

      setIndex((prev) =>
        prev === transactions.length - 1 ? 0 : prev + 1
      );

    }, 2200);

    return () => clearInterval(timer);

  }, []);

  return (

    <div className="transactions">

      <h3>Recent Transactions</h3>

      <AnimatePresence mode="wait">

        <motion.div

          key={index}

          className="transaction"

          initial={{opacity:0,y:20}}

          animate={{opacity:1,y:0}}

          exit={{opacity:0,y:-20}}

          transition={{duration:.35}}

        >

          <div className="left">

            <span className="icon">

              {transactions[index].icon}

            </span>

            <div>

              <h4>{transactions[index].title}</h4>

              <small>Today</small>

            </div>

          </div>

          <span className={transactions[index].color}>

            {transactions[index].amount}

          </span>

        </motion.div>

      </AnimatePresence>

    </div>

  );

}