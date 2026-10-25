/**
 * aiController.js
 *
 * GET  /api/ai/insights  — Full AI insights payload
 * POST /api/ai/chat      — Real-time financial question answering
 *
 * Security:
 *  - All routes use the `protect` middleware (req.user set to authenticated user)
 *  - User ID always comes from req.user._id — NEVER from request body/query
 *  - AI API keys are never sent to the frontend
 *  - Deterministic analytics engine is the ground truth; AI only explains real numbers
 */

const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");

const {
  buildInsights,
  buildChatContext,
  answerFinancialQuestion,
} = require("../services/financialAnalyticsService");
const { generateInsightSummary, generateChatResponse } = require("../services/aiService");

// ─── GET /api/ai/insights ─────────────────────────────────────────────────────

const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all authenticated user's data in parallel
    const [transactions, budgets, goals] = await Promise.all([
      Transaction.find({ userId }).sort({ date: -1 }).lean(),
      Budget.find({ userId }).lean(),
      Goal.find({ userId }).lean(),
    ]);

    // Layer 1: Pure deterministic calculations from real MongoDB data
    const insights = buildInsights(transactions, budgets, goals);

    // Layer 2: Optional AI natural-language summary
    let aiSummary = null;
    try {
      aiSummary = await generateInsightSummary(insights.aiContext);
    } catch {
      // AI unavailable — graceful fallback to deterministic summary
    }

    return res.status(200).json({
      success: true,
      aiAvailable: Boolean(aiSummary),
      data: {
        healthScore: insights.healthScore,
        summary: aiSummary || insights.fallbackSummary,
        metrics: insights.metrics,
        allTimeMetrics: insights.allTimeMetrics,
        categoryBreakdown: insights.categoryBreakdown,
        allTimeCategoryBreakdown: insights.allTimeCategoryBreakdown,
        monthlyTrends: insights.monthlyTrends,
        spendingPatterns: insights.spendingPatterns,
        budgetAlerts: insights.budgetAlerts,
        savingsOpportunities: insights.savingsOpportunities,
        recommendations: insights.recommendations,
        unusualSpending: insights.unusualSpending,
        generatedAt: insights.generatedAt,
        hasData: transactions.length > 0,
      },
    });
  } catch (error) {
    console.error("AI insights error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate insights. Please try again.",
    });
  }
};

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

const chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message too long. Please keep it under 500 characters.",
      });
    }

    // Always use the authenticated user's ID
    const userId = req.user._id;

    // Fetch only this user's records from MongoDB
    const [transactions, budgets, goals] = await Promise.all([
      Transaction.find({ userId }).sort({ date: -1 }).lean(),
      Budget.find({ userId }).lean(),
      Goal.find({ userId }).lean(),
    ]);

    // 1. Calculate deterministic ground-truth answer using the analytics engine
    const sanitizedHistory = Array.isArray(history) ? history.slice(-6) : [];
    const { intent, facts, deterministicAnswer } = answerFinancialQuestion({
      message: message.trim(),
      history: sanitizedHistory,
      transactions,
      budgets,
      goals,
    });

    // 2. If transactions exist, attempt natural AI explanation using verified facts
    let finalAnswer = deterministicAnswer;

    if (transactions.length > 0) {
      try {
        const financialContext = buildChatContext(transactions, budgets, goals);
        const aiResponse = await generateChatResponse(
          message.trim(),
          financialContext,
          facts
        );

        if (aiResponse && aiResponse.trim().length > 0) {
          finalAnswer = aiResponse.trim();
        }
      } catch (aiErr) {
        // AI call failed or timed out — safely stick to deterministicAnswer
        console.warn("AI provider error, using deterministic analytics:", aiErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      answer: finalAnswer,
      intent,
      facts,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      success: false,
      message: "Sorry, I couldn't access your financial data right now.",
    });
  }
};

module.exports = { getInsights, chat };
