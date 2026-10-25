/**
 * financialAnalyticsService.js
 * 
 * Reusable deterministic financial engine for MoneyMate.
 * All calculations use the authenticated user's actual MongoDB transactions, budgets, and goals.
 * No hardcoded values. No fake data.
 */

const detectAnomalies = require("./anomalyService");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safe = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

function fmtCurrency(n) {
  const val = Math.round(safe(n));
  return `₹${val.toLocaleString("en-IN")}`;
}

function fmtPct(n) {
  const val = Number(n);
  return Number.isFinite(val) ? `${Math.round(val * 10) / 10}%` : "0%";
}

function getMonthName(monthIndex) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex] || "";
}

function getShortMonthName(monthIndex) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return months[monthIndex] || "";
}

function startOfMonth(year, month) {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function endOfMonth(year, month) {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(year, month) {
  return `${getShortMonthName(month)} '${String(year).slice(-2)}`;
}

// ─── Deterministic Analytics Functions (Required by Spec) ─────────────────────

/**
 * Returns total income for a given month and year (defaults to server's current month/year).
 */
function getMonthlyIncome(transactions, year, month) {
  const now = new Date();
  const targetYear = year !== undefined ? year : now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth();

  return transactions
    .filter((tx) => {
      if (tx.type !== "income") return false;
      const d = new Date(tx.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    })
    .reduce((sum, tx) => sum + safe(tx.amount), 0);
}

/**
 * Returns total expenses for a given month and year (defaults to server's current month/year).
 */
function getMonthlyExpenses(transactions, year, month) {
  const now = new Date();
  const targetYear = year !== undefined ? year : now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth();

  return transactions
    .filter((tx) => {
      if (tx.type !== "expense") return false;
      const d = new Date(tx.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    })
    .reduce((sum, tx) => sum + safe(tx.amount), 0);
}

/**
 * Returns net savings (income - expenses) for a given month and year.
 */
function getSavings(transactions, year, month) {
  const income = getMonthlyIncome(transactions, year, month);
  const expenses = getMonthlyExpenses(transactions, year, month);
  return income - expenses;
}

/**
 * Returns savings rate as a percentage (0-100) for a given month and year.
 */
function getSavingsRate(transactions, year, month) {
  const income = getMonthlyIncome(transactions, year, month);
  const expenses = getMonthlyExpenses(transactions, year, month);
  if (income <= 0) return 0;
  const net = income - expenses;
  return Math.round((net / income) * 100);
}

/**
 * Returns category breakdown (sorted by amount descending) for expenses.
 * Optional year and month to filter by specific period.
 */
function getCategoryBreakdown(transactions, year, month) {
  const filtered = transactions.filter((tx) => {
    if (tx.type !== "expense") return false;
    if (year !== undefined && month !== undefined) {
      const d = new Date(tx.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }
    return true;
  });

  const map = {};
  let totalExpenses = 0;

  filtered.forEach((tx) => {
    const cat = tx.category ? tx.category.trim() : "Other";
    const amt = safe(tx.amount);
    map[cat] = (map[cat] || 0) + amt;
    totalExpenses += amt;
  });

  return Object.entries(map)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0,
      count: filtered.filter((t) => (t.category ? t.category.trim() : "Other") === category).length,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Returns the top spending category and second highest category for a month.
 */
function getTopSpendingCategory(transactions, year, month) {
  const now = new Date();
  const targetYear = year !== undefined ? year : now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth();

  const breakdown = getCategoryBreakdown(transactions, targetYear, targetMonth);
  const totalExpenses = getMonthlyExpenses(transactions, targetYear, targetMonth);

  if (breakdown.length === 0) {
    return {
      topCategory: null,
      secondCategory: null,
      totalExpenses: 0,
      breakdown: [],
    };
  }

  return {
    topCategory: breakdown[0] || null,
    secondCategory: breakdown[1] || null,
    totalExpenses: Math.round(totalExpenses),
    breakdown,
  };
}

/**
 * Returns the single biggest expense transaction.
 */
function getBiggestTransaction(transactions, year, month) {
  const filtered = transactions.filter((tx) => {
    if (tx.type !== "expense") return false;
    if (year !== undefined && month !== undefined) {
      const d = new Date(tx.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }
    return true;
  });

  if (filtered.length === 0) return null;

  return filtered.reduce((max, tx) => (safe(tx.amount) > safe(max.amount) ? tx : max), filtered[0]);
}

/**
 * Compares current month expenses with previous month expenses.
 */
function getMonthlyComparison(transactions, year, month) {
  const now = new Date();
  const curYear = year !== undefined ? year : now.getFullYear();
  const curMonth = month !== undefined ? month : now.getMonth();

  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;

  const curExpenses = getMonthlyExpenses(transactions, curYear, curMonth);
  const prevExpenses = getMonthlyExpenses(transactions, prevYear, prevMonth);

  const curIncome = getMonthlyIncome(transactions, curYear, curMonth);
  const prevIncome = getMonthlyIncome(transactions, prevYear, prevMonth);

  const diffExpenses = curExpenses - prevExpenses;
  const pctExpenses = prevExpenses > 0 ? ((diffExpenses / prevExpenses) * 100) : 0;

  // Breakdown comparison by category
  const curCats = getCategoryBreakdown(transactions, curYear, curMonth);
  const prevCats = getCategoryBreakdown(transactions, prevYear, prevMonth);

  const prevCatMap = {};
  prevCats.forEach((c) => (prevCatMap[c.category] = c.amount));

  const categoryChanges = curCats.map((cur) => {
    const prevAmt = prevCatMap[cur.category] || 0;
    const diff = cur.amount - prevAmt;
    const pct = prevAmt > 0 ? (diff / prevAmt) * 100 : 100;
    return {
      category: cur.category,
      currentAmount: cur.amount,
      previousAmount: prevAmt,
      difference: diff,
      percentageChange: Math.round(pct * 10) / 10,
    };
  }).sort((a, b) => b.difference - a.difference);

  return {
    currentPeriod: { month: curMonth, year: curYear, label: `${getMonthName(curMonth)} ${curYear}` },
    previousPeriod: { month: prevMonth, year: prevYear, label: `${getMonthName(prevMonth)} ${prevYear}` },
    currentExpenses: Math.round(curExpenses),
    previousExpenses: Math.round(prevExpenses),
    difference: Math.round(diffExpenses),
    percentageDifference: Math.round(pctExpenses * 10) / 10,
    increased: diffExpenses > 0,
    decreased: diffExpenses < 0,
    currentIncome: Math.round(curIncome),
    previousIncome: Math.round(prevIncome),
    categoryChanges,
    topIncreaseCategory: categoryChanges.find((c) => c.difference > 0) || null,
  };
}

/**
 * Compares current month spending against set budgets.
 */
function getBudgetStatus(transactions, budgets, year, month) {
  const now = new Date();
  const curYear = year !== undefined ? year : now.getFullYear();
  const curMonthIndex = month !== undefined ? month : now.getMonth();
  const budgetMonth = curMonthIndex + 1; // Budgets store 1-indexed month (1..12)

  if (!budgets || budgets.length === 0) {
    return { hasBudgets: false, items: [], totalBudget: 0, totalSpent: 0 };
  }

  // Filter budgets for the specified month and year, or fallback to any active budgets
  let matchedBudgets = budgets.filter((b) => b.month === budgetMonth && b.year === curYear);
  if (matchedBudgets.length === 0) {
    matchedBudgets = budgets;
  }

  const catBreakdown = getCategoryBreakdown(transactions, curYear, curMonthIndex);
  const catSpendMap = {};
  catBreakdown.forEach((c) => (catSpendMap[c.category.toLowerCase()] = c.amount));

  let totalLimit = 0;
  let totalSpent = 0;

  const items = matchedBudgets.map((b) => {
    const catKey = (b.category || "").toLowerCase();
    // Match exact or contains
    let spent = catSpendMap[catKey] || 0;
    if (spent === 0) {
      const match = Object.keys(catSpendMap).find(
        (k) => k.includes(catKey) || catKey.includes(k)
      );
      if (match) spent = catSpendMap[match];
    }

    const limit = safe(b.limit);
    totalLimit += limit;
    totalSpent += spent;

    const remaining = Math.max(0, limit - spent);
    const usagePct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const exceeded = spent > limit;
    const overAmount = exceeded ? spent - limit : 0;

    return {
      category: b.category,
      limit: Math.round(limit),
      spent: Math.round(spent),
      remaining: Math.round(remaining),
      percentageUsed: usagePct,
      exceeded,
      overAmount: Math.round(overAmount),
      status: exceeded ? "exceeded" : usagePct >= 80 ? "warning" : "ok",
    };
  });

  return {
    hasBudgets: items.length > 0,
    items,
    totalBudget: Math.round(totalLimit),
    totalSpent: Math.round(totalSpent),
    overallUsagePct: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
    exceededCount: items.filter((i) => i.exceeded).length,
  };
}

/**
 * Returns progress for all user savings goals.
 */
function getGoalProgress(goals) {
  if (!goals || goals.length === 0) {
    return { hasGoals: false, goals: [] };
  }

  const items = goals.map((g) => {
    const target = safe(g.target);
    const saved = safe(g.saved);
    const remaining = Math.max(0, target - saved);
    const pct = target > 0 ? Math.round((saved / target) * 100) : 0;
    const completed = saved >= target;

    let deadlineFormatted = null;
    if (g.deadline) {
      const d = new Date(g.deadline);
      if (!isNaN(d.getTime())) {
        deadlineFormatted = d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }

    return {
      id: g._id,
      title: g.title || g.name || "Savings Goal",
      category: g.category || "General",
      target: Math.round(target),
      saved: Math.round(saved),
      remaining: Math.round(remaining),
      percentageCompleted: pct,
      completed,
      deadline: deadlineFormatted,
    };
  });

  const totalTarget = items.reduce((s, g) => s + g.target, 0);
  const totalSaved = items.reduce((s, g) => s + g.saved, 0);

  return {
    hasGoals: true,
    goals: items,
    totalTarget,
    totalSaved,
    overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
  };
}

/**
 * Returns recurring expenses identified in transactions.
 */
function getRecurringExpenses(transactions) {
  const recurring = transactions.filter(
    (tx) => tx.type === "expense" && tx.recurring === true
  );

  const total = recurring.reduce((s, tx) => s + safe(tx.amount), 0);
  return {
    count: recurring.length,
    total: Math.round(total),
    items: recurring.map((tx) => ({
      category: tx.category,
      amount: safe(tx.amount),
      description: tx.description || tx.merchant || "",
      date: tx.date,
    })),
  };
}

/**
 * Returns monthly income/expense trends for the last N months.
 */
function getSpendingTrend(transactions, months = 6) {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      key: monthKey(d),
      label: monthLabel(d.getFullYear(), d.getMonth()),
      income: 0,
      expense: 0,
    });
  }

  const map = {};
  result.forEach((r) => (map[r.key] = r));

  transactions.forEach((tx) => {
    const k = monthKey(tx.date);
    if (map[k]) {
      const amt = safe(tx.amount);
      if (tx.type === "income") map[k].income += amt;
      else if (tx.type === "expense") map[k].expense += amt;
    }
  });

  return result.map((r) => ({
    ...r,
    income: Math.round(r.income),
    expense: Math.round(r.expense),
    net: Math.round(r.income - r.expense),
  }));
}

/**
 * Wraps anomalyService to get unusual transactions.
 */
function getUnusualTransactions(transactions) {
  return detectAnomalies(transactions);
}

/**
 * Calculates potential savings based on categories spending above 3-month average.
 */
function getPotentialSavings(transactions) {
  const now = new Date();
  const last3Months = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last3Months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const catByMonth = {};
  transactions
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      const d = new Date(tx.date);
      const mIdx = last3Months.findIndex(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth()
      );
      if (mIdx === -1) return;
      if (!catByMonth[tx.category]) catByMonth[tx.category] = [0, 0, 0];
      catByMonth[tx.category][mIdx] += safe(tx.amount);
    });

  const opportunities = [];
  Object.entries(catByMonth).forEach(([cat, amounts]) => {
    const nonZero = amounts.filter((a) => a > 0);
    if (nonZero.length < 2) return;

    const avg = nonZero.reduce((s, a) => s + a, 0) / nonZero.length;
    const currentMonthAmt = amounts[2]; // latest month

    if (currentMonthAmt > avg * 1.1) {
      const saving = Math.round(currentMonthAmt - avg);
      if (saving >= 100) {
        opportunities.push({
          category: cat,
          currentSpend: Math.round(currentMonthAmt),
          averageSpend: Math.round(avg),
          potentialSaving: saving,
        });
      }
    }
  });

  return opportunities.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

/**
 * Returns expenses in the last 7 days.
 */
function getWeekExpenses(transactions, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const sevenDaysAgo = new Date(ref.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekTxs = transactions.filter((tx) => {
    if (tx.type !== "expense") return false;
    const d = new Date(tx.date);
    return d >= sevenDaysAgo && d <= ref;
  });

  const total = weekTxs.reduce((s, tx) => s + safe(tx.amount), 0);
  return {
    total: Math.round(total),
    count: weekTxs.length,
    transactions: weekTxs,
  };
}

/**
 * Returns spending for a specific category across this month and all-time.
 */
function getCategorySpending(transactions, categoryQuery, year, month) {
  const now = new Date();
  const curYear = year !== undefined ? year : now.getFullYear();
  const curMonth = month !== undefined ? month : now.getMonth();

  const q = (categoryQuery || "").toLowerCase().trim();

  // Find matching expense transactions
  const matchedTxs = transactions.filter((tx) => {
    if (tx.type !== "expense") return false;
    const cat = (tx.category || "").toLowerCase();
    const desc = (tx.description || "").toLowerCase();
    return cat.includes(q) || q.includes(cat) || desc.includes(q);
  });

  const monthTxs = matchedTxs.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === curYear && d.getMonth() === curMonth;
  });

  const monthTotal = monthTxs.reduce((s, tx) => s + safe(tx.amount), 0);
  const allTimeTotal = matchedTxs.reduce((s, tx) => s + safe(tx.amount), 0);
  const totalCurMonthExpenses = getMonthlyExpenses(transactions, curYear, curMonth);

  const matchedCategoryName = matchedTxs[0]?.category || categoryQuery;

  return {
    category: matchedCategoryName,
    monthTotal: Math.round(monthTotal),
    monthCount: monthTxs.length,
    percentageOfMonthExpenses:
      totalCurMonthExpenses > 0
        ? Math.round((monthTotal / totalCurMonthExpenses) * 1000) / 10
        : 0,
    allTimeTotal: Math.round(allTimeTotal),
    allTimeCount: matchedTxs.length,
  };
}

// ─── Intent Detection & Question Answering ────────────────────────────────────

/**
 * Normalize and extract intent from the user message, taking previous history into account.
 */
function detectIntent(message, history = []) {
  const text = (message || "").toLowerCase().trim();

  // Category keyword patterns
  const categoryKeywords = {
    "food": ["food", "dining", "restaurant", "groceries", "grocery", "eating", "snacks", "swiggy", "zomato"],
    "shopping": ["shopping", "clothes", "amazon", "flipkart", "myntra", "purchase"],
    "transport": ["transport", "travel", "cab", "uber", "ola", "commute", "fuel", "petrol", "flight", "train"],
    "bills": ["bill", "bills", "utility", "utilities", "electricity", "water", "wifi", "internet", "recharge"],
    "entertainment": ["entertainment", "movie", "movies", "netflix", "games", "gaming", "outing"],
    "health": ["health", "medical", "medicine", "doctor", "hospital", "pharmacy"],
    "education": ["education", "books", "course", "college", "school", "fees"],
    "rent": ["rent", "housing", "flat", "apartment"],
    "salary": ["salary"],
    "freelance": ["freelance"],
  };

  // Check if message asks specifically about a category: "how much did I spend on food/travel/etc"
  for (const [standardCat, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      const catRegex = new RegExp(`\\b(spend|spent|cost|costs|buying|bought)\\b.*\\b${kw}\\b|\\b${kw}\\b.*\\b(spend|spent|expenses?)\\b`, "i");
      if (catRegex.test(text) || text.includes(`spend on ${kw}`) || text.includes(`spent on ${kw}`)) {
        return { intent: "CATEGORY_SPENDING", category: standardCat };
      }
    }
  }

  // Conversation memory: Check for pronouns / follow-ups referring to a previous category
  if (
    history.length > 0 &&
    (text.includes("how much more") ||
      text.includes("than last month") ||
      text.includes("compare that") ||
      text.includes("what about it") ||
      text.includes("why is that") ||
      text.includes("how about that") ||
      text.includes("compared to"))
  ) {
    // Find the last mentioned category from recent messages
    for (let i = history.length - 1; i >= 0; i--) {
      const hText = (history[i].text || "").toLowerCase();
      for (const [standardCat, keywords] of Object.entries(categoryKeywords)) {
        for (const kw of keywords) {
          if (hText.includes(kw)) {
            return { intent: "CATEGORY_COMPARISON_FOLLOWUP", category: standardCat };
          }
        }
      }
    }
  }

  // A. Top spending category
  if (
    text.includes("spend the most") ||
    text.includes("spent the most") ||
    text.includes("where did i spend") ||
    text.includes("top spending") ||
    text.includes("highest spending") ||
    text.includes("largest expense category") ||
    text.includes("highest expense") ||
    text.includes("most spent")
  ) {
    return { intent: "TOP_SPENDING_CATEGORY" };
  }

  // B. How much can I save this month
  if (
    text.includes("how much can i save") ||
    text.includes("how much money can i save") ||
    text.includes("potential savings this month") ||
    text.includes("can i save this month") ||
    text.includes("how much could i save")
  ) {
    return { intent: "SAVINGS_POTENTIAL" };
  }

  // C. What category should I reduce
  if (
    text.includes("category should i reduce") ||
    text.includes("which category should i reduce") ||
    text.includes("what should i cut back") ||
    text.includes("where should i cut") ||
    text.includes("where can i cut down") ||
    text.includes("where can i reduce") ||
    text.includes("cut down spending") ||
    text.includes("reduce spending")
  ) {
    return { intent: "REDUCE_CATEGORY" };
  }

  // D. How am I doing with my savings goal
  if (
    text.includes("savings goal") ||
    text.includes("saving goal") ||
    text.includes("goal progress") ||
    text.includes("doing with my goal") ||
    text.includes("my goals") ||
    text.includes("progress on my goal")
  ) {
    return { intent: "GOAL_PROGRESS" };
  }

  // E. Why did my expenses increase
  if (
    text.includes("why did my expenses increase") ||
    text.includes("expenses increase") ||
    text.includes("spending increase") ||
    text.includes("why are my expenses higher") ||
    text.includes("why did i spend more") ||
    text.includes("increased compared")
  ) {
    return { intent: "EXPENSES_INCREASE" };
  }

  // L. Which category increased the most
  if (
    text.includes("category increased the most") ||
    text.includes("which category increased") ||
    text.includes("what category increased") ||
    text.includes("highest increase")
  ) {
    return { intent: "CATEGORY_INCREASED_MOST" };
  }

  // F. What are my biggest expenses / top expenses
  if (
    text.includes("biggest expenses") ||
    text.includes("largest expenses") ||
    text.includes("top expenses") ||
    text.includes("major expenses")
  ) {
    return { intent: "BIGGEST_EXPENSES" };
  }

  // M. What was my biggest transaction
  if (
    text.includes("biggest transaction") ||
    text.includes("largest transaction") ||
    text.includes("highest transaction") ||
    text.includes("single biggest expense") ||
    text.includes("biggest purchase")
  ) {
    return { intent: "BIGGEST_TRANSACTION" };
  }

  // H. How much did I spend this week
  if (
    text.includes("spend this week") ||
    text.includes("spent this week") ||
    text.includes("weekly spending") ||
    text.includes("past 7 days") ||
    text.includes("last 7 days")
  ) {
    return { intent: "WEEK_SPENDING" };
  }

  // I. How much did I spend last month
  if (
    text.includes("spend last month") ||
    text.includes("spent last month") ||
    text.includes("previous month spending") ||
    text.includes("last month expenses")
  ) {
    return { intent: "LAST_MONTH_SPENDING" };
  }

  // J. What is my savings rate
  if (
    text.includes("savings rate") ||
    text.includes("saving rate") ||
    text.includes("percentage of income saved")
  ) {
    return { intent: "SAVINGS_RATE" };
  }

  // K. Am I staying within my budget
  if (
    text.includes("within my budget") ||
    text.includes("staying within budget") ||
    text.includes("how is my budget") ||
    text.includes("budget status") ||
    text.includes("am i on budget") ||
    text.includes("budget limit") ||
    text.includes("exceeding my budget")
  ) {
    return { intent: "BUDGET_STATUS" };
  }

  // N. How much did I earn this month
  if (
    text.includes("earn this month") ||
    text.includes("earned this month") ||
    text.includes("my income this month") ||
    text.includes("total income this month") ||
    text.includes("how much income") ||
    text.includes("how much did i earn")
  ) {
    return { intent: "MONTHLY_INCOME" };
  }

  // O. How much did I spend this month
  if (
    text.includes("spend this month") ||
    text.includes("spent this month") ||
    text.includes("total expenses this month") ||
    text.includes("my expenses this month") ||
    text.includes("how much did i spend")
  ) {
    return { intent: "MONTHLY_EXPENSES" };
  }

  // P. What can I do to save more
  if (
    text.includes("save more") ||
    text.includes("how can i save") ||
    text.includes("tips to save") ||
    text.includes("saving tips") ||
    text.includes("ways to save")
  ) {
    return { intent: "TIPS_SAVE_MORE" };
  }

  // Q. Show me my financial summary
  if (
    text.includes("financial summary") ||
    text.includes("financial overview") ||
    text.includes("summarize my finances") ||
    text.includes("summary of my money") ||
    text.includes("overall status")
  ) {
    return { intent: "FINANCIAL_SUMMARY" };
  }

  // Default fallback intent
  return { intent: "GENERAL_QUERY" };
}

/**
 * Master Question Answering engine.
 * Receives the user's question and all database collections.
 * Calculates verified facts and generates an accurate, high-quality response.
 */
function answerFinancialQuestion({ message, history = [], transactions = [], budgets = [], goals = [] }) {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const curMonthName = getMonthName(curMonth);

  // If user has zero transactions across all time
  if (!transactions || transactions.length === 0) {
    return {
      intent: "NO_DATA",
      facts: { totalTransactions: 0 },
      deterministicAnswer:
        "You haven't recorded any transactions yet in MoneyMate. Once you add some income and expense transactions, I can analyze your spending patterns, budgets, and savings.",
    };
  }

  // Check if current month has transactions or find the latest active month
  const curMonthTxs = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === curYear && d.getMonth() === curMonth;
  });

  // If current month has zero transactions, find the user's latest active month
  let effectiveYear = curYear;
  let effectiveMonth = curMonth;
  let isPreviousActiveMonth = false;

  if (curMonthTxs.length === 0) {
    const latestTx = transactions[0]; // transactions are sorted date desc
    if (latestTx) {
      const d = new Date(latestTx.date);
      effectiveYear = d.getFullYear();
      effectiveMonth = d.getMonth();
      isPreviousActiveMonth = true;
    }
  }

  const effectiveMonthName = getMonthName(effectiveMonth);
  const periodLabel = isPreviousActiveMonth
    ? `${effectiveMonthName} ${effectiveYear} (your most recent active month)`
    : `${curMonthName} ${curYear}`;

  const detected = detectIntent(message, history);
  const intent = detected.intent;

  // ── INTENT A: TOP_SPENDING_CATEGORY ──────────────────────────────────────────
  if (intent === "TOP_SPENDING_CATEGORY") {
    const topData = getTopSpendingCategory(transactions, effectiveYear, effectiveMonth);
    const comparison = getMonthlyComparison(transactions, effectiveYear, effectiveMonth);

    if (!topData.topCategory) {
      return {
        intent,
        facts: { totalExpenses: 0, period: periodLabel },
        deterministicAnswer: `You have no recorded expenses for ${periodLabel}. Add your expense transactions to see where your money goes!`,
      };
    }

    const { topCategory, secondCategory, totalExpenses } = topData;
    const facts = {
      questionType: "TOP_SPENDING_CATEGORY",
      period: periodLabel,
      totalExpenses,
      topCategory: {
        name: topCategory.category,
        amount: topCategory.amount,
        percentage: topCategory.percentage,
      },
      secondCategory: secondCategory
        ? {
            name: secondCategory.category,
            amount: secondCategory.amount,
            percentage: secondCategory.percentage,
          }
        : null,
    };

    let answer = `🍔 ${topCategory.category} is your highest spending category for ${periodLabel}.\n\n` +
      `You spent ${fmtCurrency(topCategory.amount)}, which represents ${topCategory.percentage}% of your total expenses (${fmtCurrency(totalExpenses)}).`;

    if (secondCategory) {
      answer += `\n\nYour next highest category is ${secondCategory.category} at ${fmtCurrency(secondCategory.amount)} (${secondCategory.percentage}%).`;
    }

    answer += `\n\n💡 If you're looking to cut costs, focusing on ${topCategory.category} will make the largest positive impact on your savings.`;

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT B: SAVINGS_POTENTIAL ──────────────────────────────────────────────
  if (intent === "SAVINGS_POTENTIAL") {
    const income = getMonthlyIncome(transactions, effectiveYear, effectiveMonth);
    const expenses = getMonthlyExpenses(transactions, effectiveYear, effectiveMonth);
    const net = income - expenses;
    const savingsRate = getSavingsRate(transactions, effectiveYear, effectiveMonth);
    const potentialOps = getPotentialSavings(transactions);

    const facts = {
      questionType: "SAVINGS_POTENTIAL",
      period: periodLabel,
      income: Math.round(income),
      expenses: Math.round(expenses),
      netSavings: Math.round(net),
      savingsRate,
      topPotentialOpportunity: potentialOps[0] || null,
    };

    let answer = `Your recorded income for ${periodLabel} is ${fmtCurrency(income)} and your recorded expenses are ${fmtCurrency(expenses)}. That leaves ${fmtCurrency(Math.max(0, net))} in net savings (${savingsRate}% savings rate).`;

    if (potentialOps.length > 0) {
      const topOp = potentialOps[0];
      answer += `\n\n💡 You could potentially save an extra ${fmtCurrency(topOp.potentialSaving)} by curbing spending in ${topOp.category} back to your 3-month average of ${fmtCurrency(topOp.averageSpend)}.`;
    } else if (net < 0) {
      answer += `\n\n⚠️ Your expenses currently exceed your income by ${fmtCurrency(Math.abs(net))}. Review discretionary categories to balance your cash flow.`;
    }

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT C: REDUCE_CATEGORY ────────────────────────────────────────────────
  if (intent === "REDUCE_CATEGORY") {
    const breakdown = getCategoryBreakdown(transactions, effectiveYear, effectiveMonth);
    const budgetStatus = getBudgetStatus(transactions, budgets, effectiveYear, effectiveMonth);
    const opportunities = getPotentialSavings(transactions);

    if (breakdown.length === 0) {
      return {
        intent,
        facts: { breakdown: [] },
        deterministicAnswer: `You don't have recorded expenses for ${periodLabel} yet. Add transactions to see category recommendations.`,
      };
    }

    const topCat = breakdown[0];
    const exceededBudget = budgetStatus.items.find((b) => b.exceeded);

    const facts = {
      questionType: "REDUCE_CATEGORY",
      topCategory: topCat,
      exceededBudget: exceededBudget || null,
      topOpportunity: opportunities[0] || null,
    };

    let answer = `💡 Based on your spending data for ${periodLabel}, **${topCat.category}** is your primary target for reduction.\n\n` +
      `You've spent ${fmtCurrency(topCat.amount)} (${topCat.percentage}% of your expenses) on ${topCat.category}. A modest 15% reduction would save you ${fmtCurrency(topCat.amount * 0.15)} each month.`;

    if (exceededBudget) {
      answer += `\n\n⚠️ Also, you have exceeded your budget for **${exceededBudget.category}** by ${fmtCurrency(exceededBudget.overAmount)} (${exceededBudget.percentageUsed}% of limit). Keeping this under control should be an immediate priority.`;
    } else if (opportunities.length > 0) {
      const op = opportunities[0];
      answer += `\n\n🔍 **${op.category}** is also running higher than usual (${fmtCurrency(op.currentSpend)} vs 3-month average of ${fmtCurrency(op.averageSpend)}), offering a potential ${fmtCurrency(op.potentialSaving)} saving.`;
    }

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT D: GOAL_PROGRESS ──────────────────────────────────────────────────
  if (intent === "GOAL_PROGRESS") {
    const goalStatus = getGoalProgress(goals);

    const facts = {
      questionType: "GOAL_PROGRESS",
      goalStatus,
    };

    if (!goalStatus.hasGoals || goalStatus.goals.length === 0) {
      return {
        intent,
        facts,
        deterministicAnswer:
          "You don't have any active savings goals yet. You can create one from the Goals tab to track progress toward your targets!",
      };
    }

    let answer = `🎯 **Savings Goals Progress (${goalStatus.overallProgress}% overall):**\n\n`;
    goalStatus.goals.forEach((g) => {
      answer += `• **${g.title}**: ${g.percentageCompleted}% completed — ${fmtCurrency(g.saved)} saved of ${fmtCurrency(g.target)} (${fmtCurrency(g.remaining)} remaining)${g.deadline ? ` by ${g.deadline}` : ""}.\n`;
    });

    const activeIncomplete = goalStatus.goals.filter((g) => !g.completed);
    if (activeIncomplete.length > 0) {
      const closest = [...activeIncomplete].sort((a, b) => b.percentageCompleted - a.percentageCompleted)[0];
      answer += `\n💡 You're closest to reaching your **${closest.title}** goal, with only ${fmtCurrency(closest.remaining)} left to save!`;
    } else {
      answer += `\n🎉 Fantastic job! All your savings goals are fully funded!`;
    }

    return { intent, facts, deterministicAnswer: answer.trim() };
  }

  // ── INTENT E: EXPENSES_INCREASE ──────────────────────────────────────────────
  if (intent === "EXPENSES_INCREASE") {
    const comp = getMonthlyComparison(transactions, effectiveYear, effectiveMonth);

    const facts = {
      questionType: "EXPENSES_INCREASE",
      comparison: comp,
    };

    if (comp.previousExpenses === 0) {
      return {
        intent,
        facts,
        deterministicAnswer: `Your expenses for ${comp.currentPeriod.label} are ${fmtCurrency(comp.currentExpenses)}. There is no transaction history recorded for ${comp.previousPeriod.label} to compare against yet.`,
      };
    }

    if (comp.decreased) {
      return {
        intent,
        facts,
        deterministicAnswer: `Good news! Your expenses actually **decreased** by ${Math.abs(comp.percentageDifference)}% compared to last month (${fmtCurrency(comp.currentExpenses)} vs ${fmtCurrency(comp.previousExpenses)} in ${comp.previousPeriod.label}). You saved ${fmtCurrency(Math.abs(comp.difference))} more!`,
      };
    }

    const increases = comp.categoryChanges.filter((c) => c.difference > 0);
    let answer = `📊 Your expenses increased by ${comp.percentageDifference}% (${fmtCurrency(comp.currentExpenses)} vs ${fmtCurrency(comp.previousExpenses)} in ${comp.previousPeriod.label}), a rise of ${fmtCurrency(comp.difference)}.`;

    if (increases.length > 0) {
      answer += `\n\nThis increase was driven mainly by:`;
      increases.slice(0, 3).forEach((inc) => {
        answer += `\n• **${inc.category}**: +${fmtCurrency(inc.difference)} (${inc.percentageChange > 0 ? `+${inc.percentageChange}%` : ""})`;
      });
      answer += `\n\n💡 Trimming back spending in ${increases[0].category} will help bring your monthly total back into line.`;
    }

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT L: CATEGORY_INCREASED_MOST ────────────────────────────────────────
  if (intent === "CATEGORY_INCREASED_MOST") {
    const comp = getMonthlyComparison(transactions, effectiveYear, effectiveMonth);
    const topInc = comp.topIncreaseCategory;

    const facts = {
      questionType: "CATEGORY_INCREASED_MOST",
      topIncreaseCategory: topInc,
      currentPeriod: comp.currentPeriod.label,
      previousPeriod: comp.previousPeriod.label,
    };

    if (!topInc || topInc.difference <= 0) {
      return {
        intent,
        facts,
        deterministicAnswer: `None of your expense categories increased compared to last month (${comp.previousPeriod.label}). Your spending is stable or reduced across all categories!`,
      };
    }

    const answer = `📈 **${topInc.category}** increased the most this month, rising by ${fmtCurrency(topInc.difference)} (+${topInc.percentageChange}%).\n\n` +
      `You spent ${fmtCurrency(topInc.currentAmount)} this month compared to ${fmtCurrency(topInc.previousAmount)} in ${comp.previousPeriod.label}.`;

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT F: BIGGEST_EXPENSES ───────────────────────────────────────────────
  if (intent === "BIGGEST_EXPENSES") {
    const breakdown = getCategoryBreakdown(transactions, effectiveYear, effectiveMonth);
    const total = getMonthlyExpenses(transactions, effectiveYear, effectiveMonth);

    const facts = {
      questionType: "BIGGEST_EXPENSES",
      period: periodLabel,
      totalExpenses: Math.round(total),
      topCategories: breakdown.slice(0, 4),
    };

    if (breakdown.length === 0) {
      return {
        intent,
        facts,
        deterministicAnswer: `You don't have recorded expenses for ${periodLabel}.`,
      };
    }

    let answer = `💳 **Your largest expense categories for ${periodLabel} (Total: ${fmtCurrency(total)}):**\n\n`;
    breakdown.slice(0, 4).forEach((c, idx) => {
      answer += `${idx + 1}. **${c.category}**: ${fmtCurrency(c.amount)} (${c.percentage}%)\n`;
    });

    return { intent, facts, deterministicAnswer: answer.trim() };
  }

  // ── INTENT M: BIGGEST_TRANSACTION ────────────────────────────────────────────
  if (intent === "BIGGEST_TRANSACTION") {
    const biggest = getBiggestTransaction(transactions, effectiveYear, effectiveMonth);
    const allTimeBiggest = getBiggestTransaction(transactions);

    const facts = {
      questionType: "BIGGEST_TRANSACTION",
      periodBiggest: biggest,
      allTimeBiggest,
    };

    if (!biggest && !allTimeBiggest) {
      return {
        intent,
        facts,
        deterministicAnswer: "You don't have any recorded expense transactions.",
      };
    }

    const tx = biggest || allTimeBiggest;
    const dateStr = new Date(tx.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const answer = `🏷️ Your largest single transaction was **${fmtCurrency(tx.amount)}** for "${tx.description || tx.merchant || tx.category}" under **${tx.category}** on ${dateStr}.`;

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT G: CATEGORY_SPENDING ──────────────────────────────────────────────
  if (intent === "CATEGORY_SPENDING") {
    const catQuery = detected.category || "other";
    const catData = getCategorySpending(transactions, catQuery, effectiveYear, effectiveMonth);

    const facts = {
      questionType: "CATEGORY_SPENDING",
      period: periodLabel,
      categoryData: catData,
    };

    if (catData.monthTotal === 0 && catData.allTimeTotal === 0) {
      return {
        intent,
        facts,
        deterministicAnswer: `You don't have any recorded spending for **${catQuery}** in your transactions.`,
      };
    }

    let answer = "";
    if (catData.monthTotal > 0) {
      answer = `🍔 You spent **${fmtCurrency(catData.monthTotal)}** on **${catData.category}** in ${periodLabel} across ${catData.monthCount} transaction${catData.monthCount > 1 ? "s" : ""}`;
      if (catData.percentageOfMonthExpenses > 0) {
        answer += ` (${catData.percentageOfMonthExpenses}% of your total expenses).`;
      } else {
        answer += `.`;
      }
    } else {
      answer = `You haven't spent anything on **${catData.category}** in ${periodLabel}. However, across all time you've spent ${fmtCurrency(catData.allTimeTotal)} (${catData.allTimeCount} transactions).`;
    }

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT FOLLOW-UP: CATEGORY_COMPARISON_FOLLOWUP ───────────────────────────
  if (intent === "CATEGORY_COMPARISON_FOLLOWUP") {
    const cat = detected.category;
    const comp = getMonthlyComparison(transactions, effectiveYear, effectiveMonth);
    const catChange = comp.categoryChanges.find((c) => c.category.toLowerCase().includes(cat));

    const facts = {
      questionType: "CATEGORY_COMPARISON_FOLLOWUP",
      category: cat,
      change: catChange || null,
    };

    if (!catChange) {
      return {
        intent,
        facts,
        deterministicAnswer: `I couldn't find matching comparison data for ${cat} between this month and last month.`,
      };
    }

    const direction = catChange.difference > 0 ? "more" : "less";
    const answer = `Comparing with ${comp.previousPeriod.label}, you spent **${fmtCurrency(Math.abs(catChange.difference))} ${direction}** on ${catChange.category}.\n\n` +
      `This month: ${fmtCurrency(catChange.currentAmount)} vs Last month: ${fmtCurrency(catChange.previousAmount)} (${catChange.percentageChange > 0 ? `+${catChange.percentageChange}%` : `${catChange.percentageChange}%`}).`;

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT H: WEEK_SPENDING ──────────────────────────────────────────────────
  if (intent === "WEEK_SPENDING") {
    const weekData = getWeekExpenses(transactions);

    const facts = {
      questionType: "WEEK_SPENDING",
      totalWeekExpenses: weekData.total,
      transactionCount: weekData.count,
    };

    const answer = `📅 In the last 7 days, you've spent **${fmtCurrency(weekData.total)}** across ${weekData.count} transaction${weekData.count === 1 ? "" : "s"}.`;

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT I: LAST_MONTH_SPENDING ────────────────────────────────────────────
  if (intent === "LAST_MONTH_SPENDING") {
    const comp = getMonthlyComparison(transactions, effectiveYear, effectiveMonth);

    const facts = {
      questionType: "LAST_MONTH_SPENDING",
      previousPeriod: comp.previousPeriod.label,
      previousExpenses: comp.previousExpenses,
      previousIncome: comp.previousIncome,
    };

    const answer = `🗓️ In **${comp.previousPeriod.label}**, you spent **${fmtCurrency(comp.previousExpenses)}** in total expenses (and earned ${fmtCurrency(comp.previousIncome)}).`;

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT J: SAVINGS_RATE ───────────────────────────────────────────────────
  if (intent === "SAVINGS_RATE") {
    const income = getMonthlyIncome(transactions, effectiveYear, effectiveMonth);
    const expenses = getMonthlyExpenses(transactions, effectiveYear, effectiveMonth);
    const rate = getSavingsRate(transactions, effectiveYear, effectiveMonth);
    const net = income - expenses;

    const facts = {
      questionType: "SAVINGS_RATE",
      period: periodLabel,
      income: Math.round(income),
      expenses: Math.round(expenses),
      savingsRate: rate,
      net: Math.round(net),
    };

    let answer = `💰 Your savings rate for ${periodLabel} is **${rate}%**.\n\n` +
      `You've saved ${fmtCurrency(Math.max(0, net))} out of ${fmtCurrency(income)} recorded income.`;

    if (rate >= 20) {
      answer += `\n\n🎉 Great job! You are meeting the recommended 20%+ savings benchmark.`;
    } else {
      answer += `\n\n💡 Financial guidelines recommend aiming for a 20% savings rate. Trimming your largest discretionary expenses can help bridge the gap.`;
    }

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT K: BUDGET_STATUS ──────────────────────────────────────────────────
  if (intent === "BUDGET_STATUS") {
    const budgetStatus = getBudgetStatus(transactions, budgets, effectiveYear, effectiveMonth);

    const facts = {
      questionType: "BUDGET_STATUS",
      budgetStatus,
    };

    if (!budgetStatus.hasBudgets) {
      return {
        intent,
        facts,
        deterministicAnswer:
          "You haven't set any budgets for this month. Creating a monthly budget in the Budgets section will help track spending and alert you before you overspend!",
      };
    }

    const { items, totalBudget, totalSpent, overallUsagePct } = budgetStatus;
    let answer = `📋 **Budget Summary (${overallUsagePct}% of total limit used):**\n\n`;

    items.forEach((b) => {
      const icon = b.exceeded ? "🔴" : b.status === "warning" ? "🟡" : "🟢";
      answer += `${icon} **${b.category}**: ${fmtCurrency(b.spent)} of ${fmtCurrency(b.limit)} (${b.percentageUsed}%)\n`;
      if (b.exceeded) {
        answer += `   ↳ Exceeded by ${fmtCurrency(b.overAmount)}!\n`;
      } else {
        answer += `   ↳ ${fmtCurrency(b.remaining)} remaining\n`;
      }
    });

    if (budgetStatus.exceededCount > 0) {
      answer += `\n⚠️ You have exceeded ${budgetStatus.exceededCount} budget${budgetStatus.exceededCount > 1 ? "s" : ""}. Review your spending in these areas.`;
    } else {
      answer += `\n✅ All your spending is currently within your set budget limits!`;
    }

    return { intent, facts, deterministicAnswer: answer.trim() };
  }

  // ── INTENT N: MONTHLY_INCOME ─────────────────────────────────────────────────
  if (intent === "MONTHLY_INCOME") {
    const income = getMonthlyIncome(transactions, effectiveYear, effectiveMonth);

    const facts = {
      questionType: "MONTHLY_INCOME",
      period: periodLabel,
      income: Math.round(income),
    };

    const answer = `💵 Your recorded income for ${periodLabel} is **${fmtCurrency(income)}**.`;

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT O: MONTHLY_EXPENSES ───────────────────────────────────────────────
  if (intent === "MONTHLY_EXPENSES") {
    const expenses = getMonthlyExpenses(transactions, effectiveYear, effectiveMonth);
    const count = transactions.filter((tx) => {
      if (tx.type !== "expense") return false;
      const d = new Date(tx.date);
      return d.getFullYear() === effectiveYear && d.getMonth() === effectiveMonth;
    }).length;

    const facts = {
      questionType: "MONTHLY_EXPENSES",
      period: periodLabel,
      expenses: Math.round(expenses),
      count,
    };

    const answer = `💸 You've spent **${fmtCurrency(expenses)}** in ${periodLabel} across ${count} expense transaction${count === 1 ? "" : "s"}.`;

    return { intent, facts, deterministicAnswer: answer };
  }

  // ── INTENT P: TIPS_SAVE_MORE ─────────────────────────────────────────────────
  if (intent === "TIPS_SAVE_MORE") {
    const opportunities = getPotentialSavings(transactions);
    const breakdown = getCategoryBreakdown(transactions, effectiveYear, effectiveMonth);
    const recurring = getRecurringExpenses(transactions);

    const facts = {
      questionType: "TIPS_SAVE_MORE",
      opportunities,
      topCategory: breakdown[0] || null,
      recurring,
    };

    let answer = `💡 **Personalised Tips to Save More:**\n\n`;

    if (breakdown[0]) {
      answer += `1. **Target ${breakdown[0].category}**: It makes up ${breakdown[0].percentage}% of your expenses (${fmtCurrency(breakdown[0].amount)}). Reducing it by just 15% saves ${fmtCurrency(breakdown[0].amount * 0.15)} monthly.\n`;
    }

    if (opportunities.length > 0) {
      answer += `2. **Address Recent Spending Spikes**: You're spending above your 3-month average in ${opportunities[0].category}. Normalizing it will save ${fmtCurrency(opportunities[0].potentialSaving)}.\n`;
    }

    if (recurring.count > 0) {
      answer += `3. **Audit Recurring Subscriptions**: You have ${recurring.count} recurring expenses totalling ${fmtCurrency(recurring.total)}. Check if any subscriptions are no longer in active use.\n`;
    } else {
      answer += `3. **Automate Savings First**: Set aside 20% of income as soon as it arrives, before discretionary purchases.\n`;
    }

    return { intent, facts, deterministicAnswer: answer.trim() };
  }

  // ── INTENT Q / GENERAL: FINANCIAL_SUMMARY ────────────────────────────────────
  const income = getMonthlyIncome(transactions, effectiveYear, effectiveMonth);
  const expenses = getMonthlyExpenses(transactions, effectiveYear, effectiveMonth);
  const net = income - expenses;
  const rate = getSavingsRate(transactions, effectiveYear, effectiveMonth);
  const topData = getTopSpendingCategory(transactions, effectiveYear, effectiveMonth);

  const facts = {
    questionType: "FINANCIAL_SUMMARY",
    period: periodLabel,
    income: Math.round(income),
    expenses: Math.round(expenses),
    net: Math.round(net),
    savingsRate: rate,
    topCategory: topData.topCategory,
  };

  let answer = `📊 **Financial Summary for ${periodLabel}:**\n\n` +
    `• **Income**: ${fmtCurrency(income)}\n` +
    `• **Expenses**: ${fmtCurrency(expenses)}\n` +
    `• **Net Balance**: ${fmtCurrency(net)} (${rate}% savings rate)\n`;

  if (topData.topCategory) {
    answer += `• **Top Expense Category**: ${topData.topCategory.category} (${fmtCurrency(topData.topCategory.amount)}, ${topData.topCategory.percentage}%)\n`;
  }

  if (net > 0) {
    answer += `\n✅ You are operating at a cash surplus this month.`;
  } else if (net < 0) {
    answer += `\n⚠️ Expenses currently exceed income by ${fmtCurrency(Math.abs(net))}.`;
  }

  return { intent: "FINANCIAL_SUMMARY", facts, deterministicAnswer: answer.trim() };
}

// ─── Health Score & Full Insights Payload ──────────────────────────────────────

/**
 * Extended health score from 0–100 using multiple factors.
 */
function computeHealthScore(transactions, budgets, goals) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const curMonthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const income = curMonthTx
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + safe(tx.amount), 0);
  const expenses = curMonthTx
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + safe(tx.amount), 0);

  if (income <= 0 && expenses <= 0) {
    // fallback: use all-time data
    const allIncome = transactions
      .filter((tx) => tx.type === "income")
      .reduce((s, tx) => s + safe(tx.amount), 0);
    const allExpenses = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((s, tx) => s + safe(tx.amount), 0);
    if (allIncome <= 0 && allExpenses <= 0) {
      return { score: 50, label: "Getting Started", description: "Add income and expense transactions so we can calculate your financial health score." };
    }
    return _scoreFromRaw(allIncome, allExpenses, budgets, goals, transactions);
  }

  return _scoreFromRaw(income, expenses, budgets, goals, curMonthTx);
}

function _scoreFromRaw(income, expenses, budgets, goals, transactions) {
  let score = 0;

  // Factor 1: Savings rate (0–35 pts)
  if (income > 0) {
    const savingsRate = Math.max(0, (income - expenses) / income);
    score += Math.min(35, Math.round(savingsRate * 116.67));
  }

  // Factor 2: Expense ratio (0–25 pts)
  if (income > 0) {
    const ratio = expenses / income;
    if (ratio <= 0.5) score += 25;
    else if (ratio <= 0.7) score += 18;
    else if (ratio <= 0.9) score += 10;
    else if (ratio <= 1.0) score += 5;
  }

  // Factor 3: Budget adherence (0–20 pts)
  if (budgets && budgets.length > 0) {
    const catTotals = {};
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        catTotals[tx.category] = (catTotals[tx.category] || 0) + safe(tx.amount);
      });
    let adherentCount = 0;
    budgets.forEach((b) => {
      const spent = catTotals[b.category] || 0;
      if (spent <= b.limit) adherentCount++;
    });
    score += Math.round((adherentCount / budgets.length) * 20);
  } else {
    score += 10; // neutral if no budgets
  }

  // Factor 4: Goal progress (0–10 pts)
  if (goals && goals.length > 0) {
    const avgProgress =
      goals.reduce((s, g) => {
        const pct = g.target > 0 ? Math.min(1, safe(g.saved) / safe(g.target)) : 0;
        return s + pct;
      }, 0) / goals.length;
    score += Math.round(avgProgress * 10);
  } else {
    score += 5; // neutral if no goals
  }

  // Factor 5: Spending volatility (0–10 pts)
  const expAmounts = transactions
    .filter((tx) => tx.type === "expense")
    .map((tx) => safe(tx.amount));
  if (expAmounts.length >= 3) {
    const mean = expAmounts.reduce((s, a) => s + a, 0) / expAmounts.length;
    const stdDev = Math.sqrt(
      expAmounts.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / expAmounts.length
    );
    const cv = mean > 0 ? stdDev / mean : 1;
    if (cv < 0.5) score += 10;
    else if (cv < 1.0) score += 6;
    else if (cv < 1.5) score += 3;
  } else {
    score += 5;
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let label = "Needs Attention";
  let description = "Focus on reducing expenses and building a savings habit.";
  if (score >= 85) {
    label = "Excellent";
    description = "Your finances are in great shape. Keep up the excellent savings rate and budget discipline.";
  } else if (score >= 70) {
    label = "Good";
    description = "Your spending is under control and you're maintaining a healthy balance between income, expenses and savings.";
  } else if (score >= 55) {
    label = "Fair";
    description = "You're doing reasonably well, but there's room to improve your savings rate and reduce discretionary spending.";
  } else if (score >= 40) {
    label = "Needs Improvement";
    description = "Consider reducing your largest expense categories and tracking your budget more closely.";
  }

  return { score, label, description };
}

/**
 * Generate a deterministic natural-language summary when AI is unavailable.
 * Guarantees NEVER to say "Add transactions" if transactions exist!
 */
function buildFallbackSummary(metrics, allTimeMetrics, categoryBreakdown, allTimeCategoryBreakdown, budgetAlerts, goals) {
  let income = metrics.totalIncome;
  let expenses = metrics.totalExpenses;
  let net = metrics.net;
  let savingsRate = metrics.savingsRate;
  let topCat = categoryBreakdown[0];
  let periodWord = "This month";

  // If current month has zero activity, use all-time activity
  if (income <= 0 && expenses <= 0 && (allTimeMetrics.totalIncome > 0 || allTimeMetrics.totalExpenses > 0)) {
    income = allTimeMetrics.totalIncome;
    expenses = allTimeMetrics.totalExpenses;
    net = allTimeMetrics.net;
    savingsRate = allTimeMetrics.savingsRate;
    topCat = allTimeCategoryBreakdown[0];
    periodWord = "Across all recorded transactions";
  }

  let parts = [];

  if (income > 0 && expenses > 0) {
    parts.push(
      `${periodWord} you earned ${fmtCurrency(income)} and spent ${fmtCurrency(expenses)}.`
    );
  } else if (expenses > 0) {
    parts.push(`${periodWord} you have ${fmtCurrency(expenses)} in recorded expenses.`);
  } else if (income > 0) {
    parts.push(`${periodWord} you have ${fmtCurrency(income)} in recorded income.`);
  }

  if (net > 0) {
    parts.push(`Your net savings are ${fmtCurrency(net)} (${savingsRate}% savings rate).`);
  } else if (net < 0) {
    parts.push(`Your expenses exceed your income by ${fmtCurrency(Math.abs(net))}.`);
  }

  if (topCat) {
    parts.push(`Your largest expense category is ${topCat.category} at ${fmtCurrency(topCat.amount)} (${topCat.percentage}% of total expenses).`);
  }

  const budgetsExceeded = (budgetAlerts || []).filter((a) => a.exceeded).length;
  if (budgetsExceeded > 0) {
    parts.push(`You have exceeded ${budgetsExceeded} budget${budgetsExceeded > 1 ? "s" : ""}.`);
  }

  if (goals && goals.length > 0) {
    const avgGoalProgress =
      goals.reduce((s, g) => {
        return s + (g.target > 0 ? Math.min(1, safe(g.saved) / safe(g.target)) : 0);
      }, 0) / goals.length;
    parts.push(`You're ${Math.round(avgGoalProgress * 100)}% of the way toward your savings goals on average.`);
  }

  return parts.join(" ") || "Add transactions to receive a personalised financial summary.";
}

/**
 * Main function — called by the controller with all user data for the insights dashboard.
 */
function buildInsights(transactions, budgets, goals) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Current month only for current metrics
  const curMonthTx = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const curIncome = getMonthlyIncome(transactions, year, month);
  const curExpenses = getMonthlyExpenses(transactions, year, month);
  const curNet = curIncome - curExpenses;
  const curSavingsRate = getSavingsRate(transactions, year, month);

  const metrics = {
    totalIncome: Math.round(curIncome),
    totalExpenses: Math.round(curExpenses),
    net: Math.round(curNet),
    savingsRate: curSavingsRate,
  };

  const allIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + safe(t.amount), 0);
  const allExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + safe(t.amount), 0);
  const allTimeMetrics = {
    totalIncome: Math.round(allIncome),
    totalExpenses: Math.round(allExpenses),
    net: Math.round(allIncome - allExpenses),
    savingsRate: allIncome > 0 ? Math.round(((allIncome - allExpenses) / allIncome) * 100) : 0,
  };

  const categoryBreakdown = getCategoryBreakdown(transactions, year, month);
  const allTimeCategoryBreakdown = getCategoryBreakdown(transactions);
  const monthlyTrends = getSpendingTrend(transactions, 6);
  const healthScore = computeHealthScore(transactions, budgets, goals);
  const budgetAlerts = getBudgetStatus(transactions, budgets, year, month).items;
  const savingsOpportunities = getPotentialSavings(transactions);
  const unusualSpending = getUnusualTransactions(transactions);

  // Recommendations
  const recommendations = [];
  const comp = getMonthlyComparison(transactions, year, month);
  if (comp.increased && comp.difference > 0) {
    recommendations.push({
      icon: "📊",
      title: "Your Expenses Are Rising",
      description: `Your expenses increased by ${comp.percentageDifference}% compared to last month (${fmtCurrency(comp.currentExpenses)} vs ${fmtCurrency(comp.previousExpenses)}). Review your discretionary spending.`,
      priority: "high",
    });
  }

  budgetAlerts.filter((a) => a.exceeded).forEach((a) => {
    recommendations.push({
      icon: "⚠️",
      title: `${a.category} Budget Exceeded`,
      description: `You've exceeded your ${a.category} budget by ${fmtCurrency(a.overAmount)}. Consider adjusting your spending or increasing the budget.`,
      priority: "high",
    });
  });

  (goals || []).forEach((g) => {
    const remaining = safe(g.target) - safe(g.saved);
    const pct = g.target > 0 ? Math.round((safe(g.saved) / safe(g.target)) * 100) : 0;
    if (pct >= 70 && pct < 100) {
      recommendations.push({
        icon: "🎯",
        title: `Close to Your ${g.title || g.name} Goal`,
        description: `You've achieved ${pct}% of your "${g.title || g.name}" goal. Only ${fmtCurrency(remaining)} remaining!`,
        priority: "medium",
      });
    }
  });

  if (curIncome > 0 && curSavingsRate < 10) {
    recommendations.push({
      icon: "💰",
      title: "Increase Your Savings Rate",
      description: `Your current savings rate is ${curSavingsRate}%. Financial experts recommend saving at least 20% of your income. Consider reducing discretionary spending.`,
      priority: "medium",
    });
  }

  // Spending Patterns
  const spendingPatterns = [];
  if (categoryBreakdown.length > 0) {
    spendingPatterns.push({
      type: "HIGH_SPENDING",
      title: "Highest Spending Category",
      description: `${categoryBreakdown[0].category} is your largest expense category at ${fmtCurrency(categoryBreakdown[0].amount)}.`,
      icon: "🔴",
    });
  }
  if (comp.topIncreaseCategory && comp.topIncreaseCategory.difference > 0) {
    spendingPatterns.push({
      type: "TREND",
      title: "Spending Trend",
      description: `Your ${comp.topIncreaseCategory.category} spending increased by ${comp.topIncreaseCategory.percentageChange}% compared to last month.`,
      icon: "📈",
    });
  }
  const recurring = getRecurringExpenses(transactions);
  if (recurring.count > 0) {
    spendingPatterns.push({
      type: "RECURRING",
      title: "Recurring Expenses",
      description: `You have ${recurring.count} recurring expense${recurring.count > 1 ? "s" : ""} totalling ${fmtCurrency(recurring.total)}.`,
      icon: "🔁",
    });
  }
  if (curIncome > 0 && curExpenses < curIncome * 0.8) {
    spendingPatterns.push({
      type: "POSITIVE",
      title: "Healthy Spending Ratio",
      description: `You're spending well within your income this month — expenses are only ${Math.round((curExpenses / curIncome) * 100)}% of income.`,
      icon: "✅",
    });
  }

  const aiContext = {
    currentMonth: {
      income: metrics.totalIncome,
      expenses: metrics.totalExpenses,
      net: metrics.net,
      savingsRate: metrics.savingsRate,
      topCategory: categoryBreakdown[0]?.category || null,
    },
    allTime: {
      income: allTimeMetrics.totalIncome,
      expenses: allTimeMetrics.totalExpenses,
    },
    healthScore: healthScore.score,
    budgetAlertsCount: budgetAlerts.filter((a) => a.exceeded).length,
    goalsCount: goals.length,
    topCategories: allTimeCategoryBreakdown.slice(0, 5),
    savingsOpportunities: savingsOpportunities.slice(0, 3),
  };

  const fallbackSummary = buildFallbackSummary(
    metrics,
    allTimeMetrics,
    categoryBreakdown,
    allTimeCategoryBreakdown,
    budgetAlerts,
    goals
  );

  return {
    metrics,
    allTimeMetrics,
    categoryBreakdown,
    allTimeCategoryBreakdown,
    monthlyTrends,
    spendingPatterns,
    healthScore,
    budgetAlerts,
    savingsOpportunities,
    recommendations,
    unusualSpending,
    fallbackSummary,
    aiContext,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Builds safe financial context string for the AI system prompt.
 */
function buildChatContext(transactions, budgets, goals) {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const curIncome = getMonthlyIncome(transactions, curYear, curMonth);
  const curExpenses = getMonthlyExpenses(transactions, curYear, curMonth);
  const curNet = curIncome - curExpenses;
  const curSavingsRate = getSavingsRate(transactions, curYear, curMonth);

  const allIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + safe(t.amount), 0);
  const allExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + safe(t.amount), 0);

  const catBreakdown = getCategoryBreakdown(transactions, curYear, curMonth);
  const trends = getSpendingTrend(transactions, 3);
  const budgetStatus = getBudgetStatus(transactions, budgets, curYear, curMonth);
  const goalProgress = getGoalProgress(goals);

  const lines = [
    `Current Month: ${getMonthName(curMonth)} ${curYear}`,
    `Income this month: ${fmtCurrency(curIncome)}`,
    `Expenses this month: ${fmtCurrency(curExpenses)}`,
    `Net balance this month: ${fmtCurrency(curNet)}`,
    `Savings rate: ${curSavingsRate}%`,
    `All-time income: ${fmtCurrency(allIncome)}`,
    `All-time expenses: ${fmtCurrency(allExpenses)}`,
    "",
    "Top Categories this month:",
    ...catBreakdown.slice(0, 5).map((c) => `  ${c.category}: ${fmtCurrency(c.amount)} (${c.percentage}%)`),
    "",
    "Last 3 Months:",
    ...trends.map((t) => `  ${t.label}: Income ${fmtCurrency(t.income)}, Expenses ${fmtCurrency(t.expense)}`),
    "",
    `Budget Alerts: ${budgetStatus.exceededCount} exceeded out of ${budgetStatus.items.length} budgets`,
    `Goals: ${goalProgress.goals.length} active`,
    ...goalProgress.goals.map((g) => `  "${g.title}": ${fmtCurrency(g.saved)} of ${fmtCurrency(g.target)} (${g.percentageCompleted}%)`),
  ];

  return lines.join("\n");
}

module.exports = {
  // Required analytical functions
  getMonthlyIncome,
  getMonthlyExpenses,
  getSavings,
  getSavingsRate,
  getCategoryBreakdown,
  getTopSpendingCategory,
  getBiggestTransaction,
  getMonthlyComparison,
  getBudgetStatus,
  getGoalProgress,
  getRecurringExpenses,
  getSpendingTrend,
  getUnusualTransactions,
  getPotentialSavings,
  getWeekExpenses,
  getCategorySpending,

  // Question answering engine
  detectIntent,
  answerFinancialQuestion,

  // Dashboard builders
  buildInsights,
  buildChatContext,
  buildFallbackSummary,
  computeHealthScore,
};
