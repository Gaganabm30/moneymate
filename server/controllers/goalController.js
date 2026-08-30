const Goal = require("../models/Goal");

const createGoal = async (req, res) => {
  try {
    const { title, category, target, saved, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Goal title is required" });
    }

    const numericTarget = Number(target);
    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      return res.status(400).json({ message: "Target amount must be greater than zero" });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      title: title.trim(),
      category: category || "Savings",
      target: numericTarget,
      saved: Math.max(0, Number(saved) || 0),
      deadline: deadline ? new Date(deadline) : undefined,
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGoal = async (req, res) => {
  try {
    // Prevent changing userId
    const { userId, _id, createdAt, updatedAt, ...allowedUpdates } = req.body;

    // Validate target/saved if provided
    if (allowedUpdates.target !== undefined) {
      const t = Number(allowedUpdates.target);
      if (!Number.isFinite(t) || t <= 0) {
        return res.status(400).json({ message: "Target must be greater than zero" });
      }
      allowedUpdates.target = t;
    }

    if (allowedUpdates.saved !== undefined) {
      const s = Number(allowedUpdates.saved);
      if (!Number.isFinite(s) || s < 0) {
        return res.status(400).json({ message: "Saved amount cannot be negative" });
      }
      allowedUpdates.saved = s;
    }

    if (allowedUpdates.deadline) {
      allowedUpdates.deadline = new Date(allowedUpdates.deadline);
    }

    const goal = await Goal.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
};