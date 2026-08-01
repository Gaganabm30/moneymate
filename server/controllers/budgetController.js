const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

const createBudget = async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        category,
        month,
        year,
      },
      {
        userId: req.user._id,
        category,
        limit,
        month,
        year,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getBudgets = async (req, res) => {
  try {
    const now = new Date();

    const month = Number(req.query.month || now.getMonth() + 1);
    const year = Number(req.query.year || now.getFullYear());

    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year,
    });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const spending = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: "expense",
          date: {
            $gte: start,
            $lt: end,
          },
        },
      },

      {
        $group: {
          _id: "$category",
          spent: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const spendingMap = {};

    spending.forEach((item) => {
      spendingMap[item._id] = item.spent;
    });

    const result = budgets.map((budget) => {
      const spent = spendingMap[budget.category] || 0;

      return {
        ...budget.toObject(),
        spent,
        percentage:
          budget.limit > 0
            ? Math.round((spent / budget.limit) * 100)
            : 0,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.json({
      message: "Budget deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  deleteBudget,
};