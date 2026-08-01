const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

const calculateHealthScore = require(
  "../services/healthScoreService"
);

const detectMoneyLeaks = require(
  "../services/moneyLeakService"
);

const detectAnomalies = require(
  "../services/anomalyService"
);

const detectRecurring = require(
  "../services/recurringService"
);

const predictNextMonth = require(
  "../services/predictionService"
);

const getAnalytics = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
    }).sort({
      date: 1,
    });

    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);

    const expenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    const categoryMap = {};

    transactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        categoryMap[item.category] =
          (categoryMap[item.category] || 0) +
          item.amount;
      });

    const categoryData = Object.entries(
      categoryMap
    ).map(([name, value]) => ({
      name,
      value,
    }));

    const monthMap = {};

    transactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        const date = new Date(item.date);

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        monthMap[key] =
          (monthMap[key] || 0) + item.amount;
      });

    const monthlyData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month,
        total,
      }));

    const now = new Date();

    const budgets = await Budget.find({
      userId: req.user._id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    const totalBudget = budgets.reduce(
      (sum, budget) => sum + budget.limit,
      0
    );

    const currentMonthExpenses = transactions
      .filter((item) => {
        const date = new Date(item.date);

        return (
          item.type === "expense" &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, item) => sum + item.amount, 0);

    const budgetUsage =
      totalBudget > 0
        ? (currentMonthExpenses / totalBudget) * 100
        : 0;

    const health = calculateHealthScore({
      income,
      expenses,
      budgetUsage,
    });

    res.json({
      summary: {
        income,
        expenses,
        balance: income - expenses,

        savingsRate:
          income > 0
            ? Number(
                (
                  ((income - expenses) / income) *
                  100
                ).toFixed(1)
              )
            : 0,
      },

      categoryData,

      monthlyData,

      health,

      moneyLeaks: detectMoneyLeaks(transactions),

      anomalies: detectAnomalies(transactions),

      recurring: detectRecurring(transactions),

      predictedNextMonth:
        predictNextMonth(monthlyData),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAnalytics,
};