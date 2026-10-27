const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "Contribution amount is required"],
    min: [0.01, "Contribution amount must be greater than zero"],
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  notes: {
    type: String,
    maxlength: 300,
    default: "",
    trim: true,
  },
  idempotencyKey: {
    type: String,
    default: null,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const milestoneSchema = new mongoose.Schema({
  threshold: {
    type: Number, // 25, 50, 75, 100
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  badge: {
    type: String,
    default: "🏆",
  },
  unlocked: {
    type: Boolean,
    default: false,
  },
  unlockedAt: {
    type: Date,
    default: null,
  },
});

const savingsChallengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Challenge title is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "target_savings",
        "30_day",
        "90_day",
        "emergency_fund",
        "no_spend",
        "custom",
      ],
      default: "custom",
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target amount must be at least ₹1"],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, "Target completion date is required"],
    },
    status: {
      type: String,
      enum: ["not_started", "active", "completed", "paused", "overdue"],
      default: "active",
      index: true,
    },
    linkedGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },
    milestones: {
      type: [milestoneSchema],
      default: () => [
        {
          threshold: 25,
          name: "Bronze Milestone (25%)",
          badge: "🥉",
          unlocked: false,
          unlockedAt: null,
        },
        {
          threshold: 50,
          name: "Silver Milestone (50%)",
          badge: "🥈",
          unlocked: false,
          unlockedAt: null,
        },
        {
          threshold: 75,
          name: "Gold Milestone (75%)",
          badge: "🥇",
          unlocked: false,
          unlockedAt: null,
        },
        {
          threshold: 100,
          name: "Platinum Champion (100%)",
          badge: "🏆",
          unlocked: false,
          unlockedAt: null,
        },
      ],
    },
    contributions: [contributionSchema],
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

savingsChallengeSchema.index({ userId: 1, status: 1 });
savingsChallengeSchema.index({ userId: 1, createdAt: -1 });

const SavingsChallenge =
  mongoose.models.SavingsChallenge ||
  mongoose.model("SavingsChallenge", savingsChallengeSchema);

module.exports = SavingsChallenge;
