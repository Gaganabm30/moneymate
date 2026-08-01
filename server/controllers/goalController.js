const Goal = require("../models/Goal");

const createGoal = async (req, res) => {
  try {
    const goal = await Goal.create({
      userId: req.user._id,
      ...req.body,
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.json(goals);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    res.json({
      message: "Goal deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const simulateGoal = async (req, res) => {
  try {
    const { purchaseAmount, monthlySavings } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    const monthly = Number(monthlySavings);

    if (monthly <= 0) {
      return res.status(400).json({
        message: "Monthly savings must be greater than zero",
      });
    }

    const currentRemaining = Math.max(
      goal.targetAmount - goal.savedAmount,
      0
    );

    const remainingAfterPurchase =
      currentRemaining + Number(purchaseAmount || 0);

    const monthsBefore = Math.ceil(
      currentRemaining / monthly
    );

    const monthsAfter = Math.ceil(
      remainingAfterPurchase / monthly
    );

    res.json({
      goal: goal.name,
      monthsBefore,
      monthsAfter,
      delay: Math.max(monthsAfter - monthsBefore, 0),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  simulateGoal,
};