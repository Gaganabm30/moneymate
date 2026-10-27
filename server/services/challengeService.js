const SavingsChallenge = require("../models/SavingsChallenge");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");
const RecurringPayment = require("../models/RecurringPayment");
const Budget = require("../models/Budget");

/**
 * Format a challenge with computed progress, remaining amounts, and suggested pace.
 */
function enrichChallenge(challengeDoc) {
  const c = challengeDoc.toObject ? challengeDoc.toObject() : { ...challengeDoc };

  const target = Number(c.targetAmount) || 0;
  const current = Number(c.currentAmount) || 0;
  const remaining = Math.max(0, target - current);
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const now = new Date();
  const end = new Date(c.endDate);
  const start = new Date(c.startDate);

  const diffTime = end.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isOverdue = now > end && current < target;

  // Determine dynamic status if not manually paused
  let dynamicStatus = c.status;
  if (c.status !== "paused") {
    if (current >= target) {
      dynamicStatus = "completed";
    } else if (isOverdue) {
      dynamicStatus = "overdue";
    } else if (now < start) {
      dynamicStatus = "not_started";
    } else {
      dynamicStatus = "active";
    }
  }

  // Calculate suggested contribution velocity
  let suggestedDaily = 0;
  let suggestedWeekly = 0;
  if (remaining > 0) {
    if (daysRemaining > 0) {
      suggestedDaily = Math.ceil(remaining / daysRemaining);
      suggestedWeekly = Math.ceil((remaining / daysRemaining) * 7);
    } else {
      suggestedDaily = remaining;
      suggestedWeekly = remaining;
    }
  }

  // Find next milestone to unlock
  const nextMilestone =
    (c.milestones || []).find((m) => !m.unlocked) || null;

  const unlockedMilestones = (c.milestones || []).filter((m) => m.unlocked);

  return {
    ...c,
    status: dynamicStatus,
    remainingAmount: remaining,
    percentage,
    daysRemaining,
    isOverdue,
    suggestedDaily,
    suggestedWeekly,
    nextMilestone,
    unlockedMilestonesCount: unlockedMilestones.length,
    totalMilestonesCount: (c.milestones || []).length,
  };
}

/**
 * Fetch all challenges and overall achievements for a user.
 */
async function getUserChallenges(userId) {
  const rawChallenges = await SavingsChallenge.find({ userId })
    .populate("linkedGoalId", "title target saved deadline")
    .sort({ createdAt: -1 });

  const challenges = rawChallenges.map(enrichChallenge);

  // Sync any status updates if dynamically shifted
  for (let i = 0; i < rawChallenges.length; i++) {
    const raw = rawChallenges[i];
    const enriched = challenges[i];
    if (raw.status !== enriched.status && raw.status !== "paused") {
      await SavingsChallenge.updateOne(
        { _id: raw._id },
        {
          $set: {
            status: enriched.status,
            completedAt: enriched.status === "completed" ? new Date() : raw.completedAt,
          },
        }
      );
    }
  }

  // Calculate summary metrics
  const totalActive = challenges.filter((c) => c.status === "active").length;
  const totalCompleted = challenges.filter((c) => c.status === "completed").length;
  const totalPaused = challenges.filter((c) => c.status === "paused").length;
  const totalOverdue = challenges.filter((c) => c.status === "overdue").length;

  const totalContributed = challenges.reduce(
    (sum, c) => sum + (Number(c.currentAmount) || 0),
    0
  );
  const totalTarget = challenges.reduce(
    (sum, c) => sum + (Number(c.targetAmount) || 0),
    0
  );
  const overallProgress =
    totalTarget > 0 ? Math.min(100, Math.round((totalContributed / totalTarget) * 100)) : 0;

  // Extract all achievements across user's challenges
  const achievements = [];
  challenges.forEach((c) => {
    (c.milestones || []).forEach((m) => {
      if (m.unlocked) {
        achievements.push({
          challengeId: c._id,
          challengeTitle: c.title,
          challengeType: c.type,
          threshold: m.threshold,
          name: m.name,
          badge: m.badge,
          unlockedAt: m.unlockedAt,
        });
      }
    });
  });

  // Sort achievements newest first
  achievements.sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0));

  // Compute personalized recommendations based on actual financial records
  const recommendations = await getPersonalizedRecommendations(userId);

  return {
    challenges,
    summary: {
      totalChallenges: challenges.length,
      totalActive,
      totalCompleted,
      totalPaused,
      totalOverdue,
      totalContributed,
      totalTarget,
      overallProgress,
      totalMilestonesUnlocked: achievements.length,
    },
    achievements,
    recommendations,
  };
}

/**
 * Get active widget data for dashboard integration.
 */
async function getActiveWidget(userId) {
  const challenges = await SavingsChallenge.find({
    userId,
    status: { $in: ["active", "not_started"] },
  })
    .sort({ endDate: 1, createdAt: -1 })
    .limit(1);

  if (challenges.length === 0) {
    // Check if there are any completed challenges
    const completedCount = await SavingsChallenge.countDocuments({
      userId,
      status: "completed",
    });
    return {
      hasActive: false,
      activeChallenge: null,
      completedCount,
    };
  }

  const activeChallenge = enrichChallenge(challenges[0]);

  return {
    hasActive: true,
    activeChallenge: {
      _id: activeChallenge._id,
      title: activeChallenge.title,
      type: activeChallenge.type,
      currentAmount: activeChallenge.currentAmount,
      targetAmount: activeChallenge.targetAmount,
      percentage: activeChallenge.percentage,
      daysRemaining: activeChallenge.daysRemaining,
      suggestedDaily: activeChallenge.suggestedDaily,
      suggestedWeekly: activeChallenge.suggestedWeekly,
      nextMilestone: activeChallenge.nextMilestone,
      unlockedMilestonesCount: activeChallenge.unlockedMilestonesCount,
    },
  };
}

/**
 * Create a new savings challenge.
 */
async function createChallenge(userId, data) {
  const {
    title,
    description,
    type,
    targetAmount,
    startingAmount,
    startDate,
    endDate,
    linkedGoalId,
  } = data;

  if (!title || !title.trim()) {
    throw new Error("Challenge title is required");
  }

  const numTarget = Number(targetAmount);
  if (!Number.isFinite(numTarget) || numTarget < 1) {
    throw new Error("Target amount must be at least ₹1");
  }

  const start = startDate ? new Date(startDate) : new Date();
  if (isNaN(start.getTime())) {
    throw new Error("Invalid start date");
  }

  if (!endDate) {
    throw new Error("Target completion date is required");
  }
  const end = new Date(endDate);
  if (isNaN(end.getTime())) {
    throw new Error("Invalid completion date");
  }
  if (end <= start) {
    throw new Error("Completion date must be after the start date");
  }

  // Optional linked goal validation
  let validatedGoalId = null;
  if (linkedGoalId) {
    const goal = await Goal.findOne({ _id: linkedGoalId, userId });
    if (goal) {
      validatedGoalId = goal._id;
    }
  }

  const numStarting = Math.max(0, Number(startingAmount) || 0);

  // Initial milestone checks
  const initialPercentage = numTarget > 0 ? (numStarting / numTarget) * 100 : 0;
  const milestones = [
    {
      threshold: 25,
      name: "Bronze Milestone (25%)",
      badge: "🥉",
      unlocked: initialPercentage >= 25,
      unlockedAt: initialPercentage >= 25 ? new Date() : null,
    },
    {
      threshold: 50,
      name: "Silver Milestone (50%)",
      badge: "🥈",
      unlocked: initialPercentage >= 50,
      unlockedAt: initialPercentage >= 50 ? new Date() : null,
    },
    {
      threshold: 75,
      name: "Gold Milestone (75%)",
      badge: "🥇",
      unlocked: initialPercentage >= 75,
      unlockedAt: initialPercentage >= 75 ? new Date() : null,
    },
    {
      threshold: 100,
      name: "Platinum Champion (100%)",
      badge: "🏆",
      unlocked: initialPercentage >= 100,
      unlockedAt: initialPercentage >= 100 ? new Date() : null,
    },
  ];

  const contributions = [];
  if (numStarting > 0) {
    contributions.push({
      amount: numStarting,
      date: new Date(),
      notes: "Starting balance",
      idempotencyKey: `init_${Date.now()}_${Math.random()}`,
    });
  }

  const isCompleted = initialPercentage >= 100;
  const isStarted = new Date() >= start;

  const challenge = await SavingsChallenge.create({
    userId,
    title: title.trim(),
    description: (description || "").trim(),
    type: type || "custom",
    targetAmount: numTarget,
    currentAmount: numStarting,
    startDate: start,
    endDate: end,
    status: isCompleted ? "completed" : isStarted ? "active" : "not_started",
    linkedGoalId: validatedGoalId,
    milestones,
    contributions,
    completedAt: isCompleted ? new Date() : null,
  });

  return enrichChallenge(challenge);
}

/**
 * Record a contribution to an existing challenge.
 * Safe atomic checks and idempotency support.
 */
async function recordContribution(userId, challengeId, data) {
  const { amount, date, notes, idempotencyKey, linkToGoal } = data;

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    throw new Error("Contribution amount must be greater than zero");
  }

  const challenge = await SavingsChallenge.findOne({ _id: challengeId, userId });
  if (!challenge) {
    throw new Error("Challenge not found or unauthorized");
  }

  // Idempotency check: prevent duplicate contributions with the same idempotency key
  if (idempotencyKey && typeof idempotencyKey === "string") {
    const existingContribution = challenge.contributions.find(
      (c) => c.idempotencyKey === idempotencyKey.trim()
    );
    if (existingContribution) {
      return {
        challenge: enrichChallenge(challenge),
        newlyUnlockedMilestones: [],
        contribution: existingContribution,
        isDuplicate: true,
      };
    }
  }

  const contributionDate = date ? new Date(date) : new Date();
  if (isNaN(contributionDate.getTime())) {
    throw new Error("Invalid contribution date");
  }

  const newCurrentAmount = (Number(challenge.currentAmount) || 0) + numAmount;
  const target = Number(challenge.targetAmount) || 1;
  const newPercentage = (newCurrentAmount / target) * 100;

  // Check milestones to unlock
  const newlyUnlockedMilestones = [];
  challenge.milestones.forEach((m) => {
    if (!m.unlocked && newPercentage >= m.threshold) {
      m.unlocked = true;
      m.unlockedAt = new Date();
      newlyUnlockedMilestones.push({
        threshold: m.threshold,
        name: m.name,
        badge: m.badge,
        unlockedAt: m.unlockedAt,
      });
    }
  });

  // Record contribution document
  const contributionDoc = {
    amount: numAmount,
    date: contributionDate,
    notes: (notes || "").trim(),
    idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
    createdAt: new Date(),
  };

  challenge.contributions.push(contributionDoc);
  challenge.currentAmount = newCurrentAmount;

  if (newPercentage >= 100 && challenge.status !== "completed") {
    challenge.status = "completed";
    challenge.completedAt = new Date();
  }

  await challenge.save();

  // If linked to an existing goal and requested, update the Goal model saved balance consistently
  if (linkToGoal && challenge.linkedGoalId) {
    await Goal.updateOne(
      { _id: challenge.linkedGoalId, userId },
      { $inc: { saved: numAmount } }
    );
  }

  return {
    challenge: enrichChallenge(challenge),
    newlyUnlockedMilestones,
    contribution: contributionDoc,
    isDuplicate: false,
  };
}

/**
 * Update challenge details.
 */
async function updateChallenge(userId, challengeId, updates) {
  const challenge = await SavingsChallenge.findOne({ _id: challengeId, userId });
  if (!challenge) {
    throw new Error("Challenge not found or unauthorized");
  }

  const { title, description, targetAmount, endDate, type, linkedGoalId } = updates;

  if (title !== undefined) {
    if (!title || !title.trim()) {
      throw new Error("Challenge title cannot be empty");
    }
    challenge.title = title.trim();
  }

  if (description !== undefined) {
    challenge.description = (description || "").trim();
  }

  if (type !== undefined) {
    challenge.type = type;
  }

  if (endDate !== undefined) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new Error("Invalid completion date");
    }
    challenge.endDate = end;
  }

  if (targetAmount !== undefined) {
    const numTarget = Number(targetAmount);
    if (!Number.isFinite(numTarget) || numTarget < 1) {
      throw new Error("Target amount must be at least ₹1");
    }
    challenge.targetAmount = numTarget;

    // Check if new target marks it completed
    const current = Number(challenge.currentAmount) || 0;
    if (current >= numTarget && challenge.status !== "completed") {
      challenge.status = "completed";
      challenge.completedAt = new Date();
    } else if (current < numTarget && challenge.status === "completed") {
      // Reopening completed challenge if target was increased
      challenge.status = "active";
      challenge.completedAt = null;
    }

    // Retain milestone history: previously unlocked milestones remain unlocked!
    // Check if new target unlocks any previously locked milestones
    const percentage = (current / numTarget) * 100;
    challenge.milestones.forEach((m) => {
      if (!m.unlocked && percentage >= m.threshold) {
        m.unlocked = true;
        m.unlockedAt = new Date();
      }
    });
  }

  if (linkedGoalId !== undefined) {
    if (linkedGoalId) {
      const goal = await Goal.findOne({ _id: linkedGoalId, userId });
      challenge.linkedGoalId = goal ? goal._id : null;
    } else {
      challenge.linkedGoalId = null;
    }
  }

  await challenge.save();
  return enrichChallenge(challenge);
}

/**
 * Pause or resume challenge.
 */
async function togglePause(userId, challengeId, shouldPause) {
  const challenge = await SavingsChallenge.findOne({ _id: challengeId, userId });
  if (!challenge) {
    throw new Error("Challenge not found or unauthorized");
  }

  if (shouldPause) {
    challenge.status = "paused";
  } else {
    // Resume to active or completed based on progress
    const current = Number(challenge.currentAmount) || 0;
    const target = Number(challenge.targetAmount) || 1;
    if (current >= target) {
      challenge.status = "completed";
    } else if (new Date() > new Date(challenge.endDate)) {
      challenge.status = "overdue";
    } else {
      challenge.status = "active";
    }
  }

  await challenge.save();
  return enrichChallenge(challenge);
}

/**
 * Delete challenge.
 * Does NOT delete historical financial transactions or linked goals!
 */
async function deleteChallenge(userId, challengeId) {
  const result = await SavingsChallenge.findOneAndDelete({
    _id: challengeId,
    userId,
  });

  if (!result) {
    throw new Error("Challenge not found or unauthorized");
  }

  return { message: "Savings challenge deleted successfully" };
}

/**
 * Compute personalized recommendations based on actual financial records.
 * Uses recent income, expenses, budgets, upcoming recurring payments, and goals.
 */
async function getPersonalizedRecommendations(userId) {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Fetch recent transactions
  const transactions = await Transaction.find({
    userId,
    date: { $gte: sixtyDaysAgo },
  });

  const recurringBills = await RecurringPayment.find({
    userId,
    status: "active",
  });

  const budgets = await Budget.find({ userId });
  const goals = await Goal.find({ userId });

  // If very few transactions, provide graceful insufficient data state
  if (transactions.length < 2) {
    return {
      hasSufficientData: false,
      reason:
        "Add at least 2-3 income and expense transactions to unlock AI-personalized savings challenge recommendations.",
      presets: [
        {
          presetId: "30_day_5k",
          title: "Save ₹5,000 in 30 Days",
          type: "30_day",
          targetAmount: 5000,
          durationDays: 30,
          description: "A fast-paced 30-day challenge to build momentum and save ₹167 per day.",
          suggestedDaily: 167,
          suggestedWeekly: 1250,
          tag: "Popular Sprint",
        },
        {
          presetId: "90_day_10k",
          title: "Save ₹10,000 in 90 Days",
          type: "90_day",
          targetAmount: 10000,
          durationDays: 90,
          description: "A sustainable 3-month savings habit requiring just ₹112 daily.",
          suggestedDaily: 112,
          suggestedWeekly: 770,
          tag: "Habit Builder",
        },
        {
          presetId: "emergency_25k",
          title: "Emergency Fund Starter",
          type: "emergency_fund",
          targetAmount: 25000,
          durationDays: 60,
          description: "Establish a resilient cushion for unexpected healthcare or auto expenses.",
          suggestedDaily: 417,
          suggestedWeekly: 2917,
          tag: "Security Cushion",
        },
        {
          presetId: "no_spend_3k",
          title: "14-Day No-Spend Challenge",
          type: "no_spend",
          targetAmount: 3000,
          durationDays: 14,
          description: "Cut all non-essential discretionary spends (dining out, impulse shopping) for 2 weeks.",
          suggestedDaily: 215,
          suggestedWeekly: 1500,
          tag: "Frugal Sprint",
        },
      ],
    };
  }

  // Calculate monthly normalized figures
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 60-day window -> approximate monthly figures (/ 2)
  const monthlyAvgIncome = Math.round(totalIncome / 2);
  const monthlyAvgExpense = Math.round(totalExpense / 2);

  // Calculate upcoming monthly recurring obligations
  const monthlyRecurring = recurringBills.reduce((sum, bill) => {
    const amt = Number(bill.amount) || 0;
    if (bill.frequency === "yearly") return sum + amt / 12;
    if (bill.frequency === "weekly") return sum + (amt * 52) / 12;
    if (bill.frequency === "daily") return sum + amt * 30;
    return sum + amt; // monthly
  }, 0);

  // Net surplus calculation
  const netMonthlySurplus = Math.max(0, monthlyAvgIncome - monthlyAvgExpense);
  const freeCashFlow = Math.max(0, netMonthlySurplus - monthlyRecurring);

  // Recommended challenge size: 15% - 25% of free cash flow, rounded to nearest 500
  let recommendedTarget = 5000;
  if (freeCashFlow > 5000) {
    recommendedTarget = Math.max(
      2000,
      Math.round((freeCashFlow * 0.2) / 500) * 500
    );
  } else if (monthlyAvgIncome > 10000) {
    recommendedTarget = Math.max(
      1500,
      Math.round((monthlyAvgIncome * 0.1) / 500) * 500
    );
  }

  const suggestedDaily = Math.round(recommendedTarget / 30);
  const suggestedWeekly = Math.round(recommendedTarget / 4);

  return {
    hasSufficientData: true,
    financialContext: {
      monthlyAvgIncome,
      monthlyAvgExpense,
      monthlyRecurringCommitments: Math.round(monthlyRecurring),
      netMonthlySurplus,
      estimatedFreeCashFlow: Math.round(freeCashFlow),
      activeBudgetsCount: budgets.length,
      activeGoalsCount: goals.length,
    },
    recommendation: {
      title: `Personalized 30-Day Sprint (₹${recommendedTarget.toLocaleString("en-IN")})`,
      targetAmount: recommendedTarget,
      durationDays: 30,
      type: "30_day",
      suggestedDaily,
      suggestedWeekly,
      explanation: `Based on your recent financial trends (avg monthly income of ₹${monthlyAvgIncome.toLocaleString(
        "en-IN"
      )} and ₹${Math.round(
        monthlyRecurring
      ).toLocaleString("en-IN")} in recurring bills), committing ₹${suggestedDaily}/day fits your budget comfortably.`,
      disclaimer: "This estimate is advisory and does not guarantee affordability. Adjust freely to fit your plans.",
    },
    presets: [
      {
        presetId: "personalized_sprint",
        title: `AI Recommended Sprint: ₹${recommendedTarget.toLocaleString("en-IN")}`,
        type: "30_day",
        targetAmount: recommendedTarget,
        durationDays: 30,
        description: `Tailored to your estimated ₹${Math.round(freeCashFlow).toLocaleString("en-IN")}/mo discretionary flow.`,
        suggestedDaily,
        suggestedWeekly,
        tag: "AI Tailored",
      },
      {
        presetId: "30_day_5k",
        title: "Save ₹5,000 in 30 Days",
        type: "30_day",
        targetAmount: 5000,
        durationDays: 30,
        description: "A fast-paced 30-day challenge to build momentum and save ₹167 per day.",
        suggestedDaily: 167,
        suggestedWeekly: 1250,
        tag: "Popular Sprint",
      },
      {
        presetId: "90_day_10k",
        title: "Save ₹10,000 in 90 Days",
        type: "90_day",
        targetAmount: 10000,
        durationDays: 90,
        description: "A sustainable 3-month savings habit requiring just ₹112 daily.",
        suggestedDaily: 112,
        suggestedWeekly: 770,
        tag: "Habit Builder",
      },
      {
        presetId: "emergency_fund",
        title: "Emergency Fund Starter",
        type: "emergency_fund",
        targetAmount: Math.max(20000, Math.round((monthlyAvgExpense * 1.5) / 1000) * 1000),
        durationDays: 90,
        description: "Targeting 1.5 months of typical living expenses over 90 days.",
        suggestedDaily: Math.round(
          Math.max(20000, Math.round((monthlyAvgExpense * 1.5) / 1000) * 1000) / 90
        ),
        suggestedWeekly: Math.round(
          (Math.max(20000, Math.round((monthlyAvgExpense * 1.5) / 1000) * 1000) / 90) * 7
        ),
        tag: "Emergency Buffer",
      },
      {
        presetId: "no_spend_3k",
        title: "14-Day No-Spend Challenge",
        type: "no_spend",
        targetAmount: 3000,
        durationDays: 14,
        description: "Cut all non-essential discretionary spends (dining out, impulse shopping) for 2 weeks.",
        suggestedDaily: 215,
        suggestedWeekly: 1500,
        tag: "Frugal Sprint",
      },
    ],
  };
}

module.exports = {
  getUserChallenges,
  getActiveWidget,
  createChallenge,
  recordContribution,
  updateChallenge,
  togglePause,
  deleteChallenge,
  getPersonalizedRecommendations,
};
