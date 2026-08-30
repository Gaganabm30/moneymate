const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

const createBudget = async (req, res) => {
  try {
    const { category, limit, month, year, name } = req.body;

    // Use name OR category as the category label
    const categoryLabel = (name || category || "").trim();

    if (!categoryLabel || !limit || !month || !year) {
      return res.status(400).json({
        message: "Category, limit, month, and year are required",
      });
    }

    const numericLimit = Number(limit);
    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
      return res.status(400).json({
        message: "Limit must be greater than zero",
      });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        category: categoryLabel,
        month: Number(month),
        year: Number(year),
      },
      {
        userId: req.user._id,
        category: categoryLabel,
        limit: numericLimit,
        month: Number(month),
        year: Number(year),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$category",
          spent: { $sum: "$amount" },
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
        // Expose category as "name" for frontend compatibility
        name: budget.category,
        spent,
        percentage:
          budget.limit > 0
            ? Math.round((spent / budget.limit) * 100)
            : 0,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { userId, _id, createdAt, updatedAt, ...allowedUpdates } = req.body;

    if (allowedUpdates.limit !== undefined) {
      const l = Number(allowedUpdates.limit);
      if (!Number.isFinite(l) || l <= 0) {
        return res.status(400).json({ message: "Limit must be greater than zero" });
      }
      allowedUpdates.limit = l;
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ ...budget.toObject(), name: budget.category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ message: "Budget deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};