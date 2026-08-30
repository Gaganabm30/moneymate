/**
 * MoneyMate AI — Shared Finance Data Layer
 * Handles localStorage persistence, transaction CRUD, budget management,
 * goal tracking, financial calculations, and event-driven updates
 * across Dashboard, Analytics, Budgets, Goals, and Transactions pages.
 */

const STORAGE_KEY = "moneymate_transactions";
const EVENT_NAME = "transactionsUpdated";

const BUDGETS_STORAGE_KEY = "moneymate_budgets";
const BUDGETS_EVENT_NAME = "budgetsUpdated";

const GOALS_STORAGE_KEY = "moneymate_goals";
const GOALS_EVENT_NAME = "goalsUpdated";

/* =========================================================
   DEFAULT DEMO DATA GENERATORS
   ========================================================= */

const getDefaultDemoTransactions = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return [
    {
      id: "tx-1",
      title: "Salary",
      amount: 52000,
      type: "income",
      category: "Salary",
      description: "Monthly Tech Corp Salary",
      date: `${year}-${month}-01`,
      createdAt: new Date(year, now.getMonth(), 1).toISOString(),
    },
    {
      id: "tx-2",
      title: "Freelance Project",
      amount: 8500,
      type: "income",
      category: "Freelance",
      description: "UI/UX Design consulting",
      date: `${year}-${month}-05`,
      createdAt: new Date(year, now.getMonth(), 5).toISOString(),
    },
    {
      id: "tx-3",
      title: "Groceries",
      amount: 2450,
      type: "expense",
      category: "Food",
      description: "Supermarket weekly essentials",
      date: `${year}-${month}-08`,
      createdAt: new Date(year, now.getMonth(), 8).toISOString(),
    },
    {
      id: "tx-4",
      title: "Food & Dining",
      amount: 3200,
      type: "expense",
      category: "Food",
      description: "Weekend family dinner",
      date: `${year}-${month}-11`,
      createdAt: new Date(year, now.getMonth(), 11).toISOString(),
    },
    {
      id: "tx-5",
      title: "Fuel & Metro Pass",
      amount: 1500,
      type: "expense",
      category: "Transport",
      description: "Monthly travel pass and fuel",
      date: `${year}-${month}-12`,
      createdAt: new Date(year, now.getMonth(), 12).toISOString(),
    },
    {
      id: "tx-6",
      title: "Netflix Subscription",
      amount: 649,
      type: "expense",
      category: "Entertainment",
      description: "Premium 4K plan",
      date: `${year}-${month}-14`,
      createdAt: new Date(year, now.getMonth(), 14).toISOString(),
    },
  ];
};

const getDefaultDemoBudgets = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return [
    {
      id: "b-1",
      name: "Food & Dining",
      category: "Food",
      limit: 8000,
      month,
      year,
      color: "purple",
    },
    {
      id: "b-2",
      name: "Rent & Housing",
      category: "Housing",
      limit: 15000,
      month,
      year,
      color: "blue",
    },
    {
      id: "b-3",
      name: "Transportation",
      category: "Transport",
      limit: 5000,
      month,
      year,
      color: "orange",
    },
    {
      id: "b-4",
      name: "Health & Fitness",
      category: "Health",
      limit: 4000,
      month,
      year,
      color: "green",
    },
    {
      id: "b-5",
      name: "Entertainment",
      category: "Entertainment",
      limit: 3000,
      month,
      year,
      color: "pink",
    },
  ];
};

const getDefaultDemoGoals = () => {
  return [
    {
      id: "g-1",
      title: "Emergency Fund",
      category: "Savings",
      target: 100000,
      saved: 72000,
      deadline: "2026-12-31",
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-2",
      title: "New Laptop",
      category: "Technology",
      target: 85000,
      saved: 51000,
      deadline: "2026-10-15",
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-3",
      title: "Vacation Trip",
      category: "Travel",
      target: 60000,
      saved: 24000,
      deadline: "2026-12-10",
      createdAt: new Date().toISOString(),
    },
  ];
};

/* =========================================================
   EVENT BROADCASTERS
   ========================================================= */

export const notifyTransactionsUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_NAME));
    window.dispatchEvent(new CustomEvent("moneymate:transactionsChanged"));
  }
};

export const notifyBudgetsUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BUDGETS_EVENT_NAME));
    window.dispatchEvent(new CustomEvent("moneymate:budgetsChanged"));
  }
};

export const notifyGoalsUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(GOALS_EVENT_NAME));
    window.dispatchEvent(new CustomEvent("moneymate:goalsChanged"));
  }
};

/* =========================================================
   TRANSACTIONS CRUD & CALCULATIONS
   ========================================================= */

export const getTransactions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const defaultData = getDefaultDemoTransactions();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      const defaultData = getDefaultDemoTransactions();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
    return parsed.map((t) => ({
      ...t,
      id: String(t.id || t._id || Date.now() + Math.random()),
      amount: Number(t.amount) || 0,
      type: t.type === "income" ? "income" : "expense",
      category: t.category || (t.type === "income" ? "Salary" : "Other"),
      title: t.title || t.description || "Transaction",
      description: t.description || t.title || "",
      date: t.date || new Date().toISOString().split("T")[0],
    }));
  } catch {
    return getDefaultDemoTransactions();
  }
};

export const saveTransactions = (transactions) => {
  try {
    const sanitized = (transactions || []).map((t) => ({
      id: String(t.id || t._id || Date.now() + Math.random()),
      title: (t.title || t.description || "Transaction").trim(),
      amount: Math.abs(Number(t.amount) || 0),
      type: t.type === "income" ? "income" : "expense",
      category: t.category || (t.type === "income" ? "Other" : "Other"),
      description: (t.description || "").trim(),
      date: t.date || new Date().toISOString().split("T")[0],
      createdAt: t.createdAt || new Date().toISOString(),
      paymentMethod: t.paymentMethod || "upi",
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    notifyTransactionsUpdated();
    return sanitized;
  } catch (err) {
    console.error("Error saving moneymate_transactions to localStorage:", err);
    return transactions;
  }
};

export const addTransaction = (transactionData) => {
  const existing = getTransactions();
  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: (transactionData.title || transactionData.description || "Transaction").trim(),
    amount: Math.abs(Number(transactionData.amount) || 0),
    type: transactionData.type === "income" ? "income" : "expense",
    category: transactionData.category || (transactionData.type === "income" ? "Salary" : "Other"),
    description: (transactionData.description || "").trim(),
    date: transactionData.date || new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
    paymentMethod: transactionData.paymentMethod || "upi",
  };

  const updated = [newTx, ...existing];
  saveTransactions(updated);
  return newTx;
};

export const updateTransaction = (id, updatedFields) => {
  const existing = getTransactions();
  const targetId = String(id);

  let updatedTx = null;
  const updated = existing.map((t) => {
    if (String(t.id) === targetId || String(t._id) === targetId) {
      updatedTx = {
        ...t,
        ...updatedFields,
        id: t.id,
        amount: Math.abs(Number(updatedFields.amount !== undefined ? updatedFields.amount : t.amount) || 0),
        title: (updatedFields.title !== undefined ? updatedFields.title : t.title || "").trim(),
        description: (updatedFields.description !== undefined ? updatedFields.description : t.description || "").trim(),
        category: updatedFields.category || t.category,
        type: updatedFields.type || t.type,
        date: updatedFields.date || t.date,
      };
      return updatedTx;
    }
    return t;
  });

  if (updatedTx) {
    saveTransactions(updated);
  }
  return updatedTx;
};

export const deleteTransaction = (id) => {
  const existing = getTransactions();
  const targetId = String(id);
  const updated = existing.filter(
    (t) => String(t.id) !== targetId && String(t._id) !== targetId
  );
  saveTransactions(updated);
  return true;
};

export const calculateTotals = (transactionsList) => {
  const list = transactionsList !== undefined ? transactionsList : getTransactions();
  let income = 0;
  let expense = 0;

  (list || []).forEach((t) => {
    const amt = Math.abs(Number(t.amount) || 0);
    if (t.type === "income") {
      income += amt;
    } else {
      expense += amt;
    }
  });

  const balance = income - expense;
  const savings = income - expense;

  return {
    income,
    expense,
    balance,
    savings,
  };
};

/* =========================================================
   BUDGETS CRUD & CALCULATIONS
   ========================================================= */

export const getBudgets = (filterMonth = null, filterYear = null) => {
  try {
    const data = localStorage.getItem(BUDGETS_STORAGE_KEY);
    let list = [];
    if (!data) {
      list = getDefaultDemoBudgets();
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(list));
    } else {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        list = getDefaultDemoBudgets();
        localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(list));
      } else {
        list = parsed;
      }
    }

    const sanitized = list.map((b, idx) => ({
      id: String(b.id || `b-${idx + 1}`),
      name: (b.name || b.category || "Budget").trim(),
      category: b.category || "Other",
      limit: Math.abs(Number(b.limit) || 0),
      month: Number(b.month) || (new Date().getMonth() + 1),
      year: Number(b.year) || new Date().getFullYear(),
      color: b.color || getCategoryColor(b.category),
    }));

    if (filterMonth && filterYear) {
      return sanitized.filter((b) => {
        if (!b.month || !b.year) return true;
        return Number(b.month) === Number(filterMonth) && Number(b.year) === Number(filterYear);
      });
    }

    return sanitized;
  } catch {
    return getDefaultDemoBudgets();
  }
};

export const saveBudgets = (budgets) => {
  try {
    const sanitized = (budgets || []).map((b, idx) => ({
      id: String(b.id || `b-${Date.now()}-${idx}`),
      name: (b.name || b.category || "Budget").trim(),
      category: b.category || "Other",
      limit: Math.abs(Number(b.limit) || 0),
      month: Number(b.month) || (new Date().getMonth() + 1),
      year: Number(b.year) || new Date().getFullYear(),
      color: b.color || getCategoryColor(b.category),
    }));

    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(sanitized));
    notifyBudgetsUpdated();
    return sanitized;
  } catch (err) {
    console.error("Error saving moneymate_budgets to localStorage:", err);
    return budgets;
  }
};

export const addBudget = (budgetData) => {
  const existing = getBudgets();
  const now = new Date();
  const newBudget = {
    id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: (budgetData.name || budgetData.category || "Budget").trim(),
    category: budgetData.category || "Other",
    limit: Math.abs(Number(budgetData.limit) || 0),
    month: Number(budgetData.month) || (now.getMonth() + 1),
    year: Number(budgetData.year) || now.getFullYear(),
    color: budgetData.color || getCategoryColor(budgetData.category),
  };

  const updated = [newBudget, ...existing];
  saveBudgets(updated);
  return newBudget;
};

export const updateBudget = (id, updatedFields) => {
  const existing = getBudgets();
  const targetId = String(id);

  let updatedBudget = null;
  const updated = existing.map((b) => {
    if (String(b.id) === targetId) {
      updatedBudget = {
        ...b,
        ...updatedFields,
        id: b.id,
        name: (updatedFields.name !== undefined ? updatedFields.name : b.name || "").trim(),
        category: updatedFields.category || b.category,
        limit: Math.abs(Number(updatedFields.limit !== undefined ? updatedFields.limit : b.limit) || 0),
        color: updatedFields.color || b.color || getCategoryColor(updatedFields.category || b.category),
      };
      return updatedBudget;
    }
    return b;
  });

  if (updatedBudget) {
    saveBudgets(updated);
  }
  return updatedBudget;
};

export const deleteBudget = (id) => {
  const existing = getBudgets();
  const targetId = String(id);
  const updated = existing.filter((b) => String(b.id) !== targetId);
  saveBudgets(updated);
  return true;
};

export const getCategoryColor = (category = "") => {
  const cat = String(category).toLowerCase();
  if (cat.includes("food") || cat.includes("dining")) return "purple";
  if (cat.includes("hous") || cat.includes("rent")) return "blue";
  if (cat.includes("trans") || cat.includes("fuel")) return "orange";
  if (cat.includes("health") || cat.includes("med")) return "green";
  if (cat.includes("entert") || cat.includes("movie")) return "pink";
  if (cat.includes("shop")) return "blue";
  if (cat.includes("edu")) return "green";
  if (cat.includes("bill")) return "orange";
  return "purple";
};

export const calculateBudgetMetrics = (budget, transactionsList, selectedMonth, selectedYear) => {
  const transactions = transactionsList !== undefined ? transactionsList : getTransactions();
  const budgetCat = (budget.category || "").toLowerCase();

  let spent = 0;

  (transactions || []).forEach((tx) => {
    if (tx.type !== "expense") return;

    const txCat = (tx.category || "Other").toLowerCase();
    if (txCat !== budgetCat) return;

    if (tx.date) {
      const parts = String(tx.date).slice(0, 10).split("-");
      if (parts.length >= 2) {
        const txYear = parseInt(parts[0], 10);
        const txMonth = parseInt(parts[1], 10);

        if (txYear === Number(selectedYear) && txMonth === Number(selectedMonth)) {
          spent += Math.abs(Number(tx.amount) || 0);
        }
      }
    }
  });

  const limit = Math.abs(Number(budget.limit) || 0);
  const remaining = limit - spent;
  const rawPercentage = limit > 0 ? (spent / limit) * 100 : 0;
  const percentage = Math.round(rawPercentage);
  const displayPercentage = Math.min(percentage, 100);

  let status = "safe";
  let statusMessage = `₹${Math.max(0, remaining).toLocaleString("en-IN")} remaining`;

  if (rawPercentage >= 100) {
    status = "exceeded";
    const overAmt = Math.abs(remaining);
    statusMessage = `Budget exceeded by ₹${overAmt.toLocaleString("en-IN")}`;
  } else if (rawPercentage >= 90) {
    status = "almost";
    statusMessage = `Almost reached (₹${remaining.toLocaleString("en-IN")} left)`;
  } else if (rawPercentage >= 70) {
    status = "warning";
    statusMessage = `Nearing your limit (₹${remaining.toLocaleString("en-IN")} left)`;
  }

  return {
    spent,
    remaining,
    rawPercentage,
    percentage,
    displayPercentage,
    status,
    statusMessage,
  };
};

export const calculateOverallBudgetSummary = (budgetsList, transactionsList, selectedMonth, selectedYear) => {
  const budgets = budgetsList !== undefined ? budgetsList : getBudgets();
  const transactions = transactionsList !== undefined ? transactionsList : getTransactions();

  const totalLimit = budgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0);

  let totalSpent = 0;
  budgets.forEach((b) => {
    const { spent } = calculateBudgetMetrics(b, transactions, selectedMonth, selectedYear);
    totalSpent += spent;
  });

  const remaining = totalLimit - totalSpent;
  const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return {
    totalLimit,
    totalSpent,
    remaining,
    overallPercentage,
  };
};

/* =========================================================
   GOALS CRUD & CALCULATIONS
   ========================================================= */

export const GOAL_CATEGORIES = [
  "Savings",
  "Technology",
  "Travel",
  "Education",
  "Health",
  "Home",
  "Other",
];

export const getGoals = () => {
  try {
    const data = localStorage.getItem(GOALS_STORAGE_KEY);
    let list = [];
    if (!data) {
      list = getDefaultDemoGoals();
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(list));
    } else {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        list = getDefaultDemoGoals();
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(list));
      } else {
        list = parsed;
      }
    }

    return list.map((g, idx) => ({
      id: String(g.id || `g-${idx + 1}`),
      title: (g.title || g.name || "Goal").trim(),
      category: g.category || "Savings",
      target: Math.abs(Number(g.target || g.targetAmount) || 0),
      saved: Math.abs(Number(g.saved || g.currentAmount) || 0),
      deadline: g.deadline || "2026-12-31",
      createdAt: g.createdAt || new Date().toISOString(),
    }));
  } catch {
    return getDefaultDemoGoals();
  }
};

export const saveGoals = (goals) => {
  try {
    const sanitized = (goals || []).map((g, idx) => ({
      id: String(g.id || `g-${Date.now()}-${idx}`),
      title: (g.title || g.name || "Goal").trim(),
      category: g.category || "Savings",
      target: Math.abs(Number(g.target || g.targetAmount) || 0),
      saved: Math.min(
        Math.abs(Number(g.target || g.targetAmount) || 0),
        Math.abs(Number(g.saved || g.currentAmount) || 0)
      ),
      deadline: g.deadline || "2026-12-31",
      createdAt: g.createdAt || new Date().toISOString(),
    }));

    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(sanitized));
    notifyGoalsUpdated();
    return sanitized;
  } catch (err) {
    console.error("Error saving moneymate_goals to localStorage:", err);
    return goals;
  }
};

export const addGoal = (goalData) => {
  const existing = getGoals();
  const target = Math.abs(Number(goalData.target || goalData.targetAmount) || 0);
  const initialSaved = Math.min(
    target,
    Math.max(0, Number(goalData.saved || goalData.initialSavings) || 0)
  );

  const newGoal = {
    id: `g-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: (goalData.title || goalData.name || "Financial Goal").trim(),
    category: goalData.category || "Savings",
    target,
    saved: initialSaved,
    deadline: goalData.deadline || "2026-12-31",
    createdAt: new Date().toISOString(),
  };

  const updated = [newGoal, ...existing];
  saveGoals(updated);
  return newGoal;
};

export const updateGoal = (id, updatedFields) => {
  const existing = getGoals();
  const targetId = String(id);

  let updatedGoal = null;
  const updated = existing.map((g) => {
    if (String(g.id) === targetId) {
      const newTarget =
        updatedFields.target !== undefined
          ? Math.abs(Number(updatedFields.target) || 0)
          : g.target;

      const newSaved =
        updatedFields.saved !== undefined
          ? Math.min(newTarget, Math.max(0, Number(updatedFields.saved) || 0))
          : Math.min(newTarget, g.saved);

      updatedGoal = {
        ...g,
        ...updatedFields,
        id: g.id,
        title: (updatedFields.title !== undefined ? updatedFields.title : g.title).trim(),
        category: updatedFields.category || g.category,
        target: newTarget,
        saved: newSaved,
        deadline: updatedFields.deadline || g.deadline,
      };
      return updatedGoal;
    }
    return g;
  });

  if (updatedGoal) {
    saveGoals(updated);
  }
  return updatedGoal;
};

export const deleteGoal = (id) => {
  const existing = getGoals();
  const targetId = String(id);
  const updated = existing.filter((g) => String(g.id) !== targetId);
  saveGoals(updated);
  return true;
};

export const addMoneyToGoal = (id, amount) => {
  const existing = getGoals();
  const targetId = String(id);
  const addAmt = Math.abs(Number(amount) || 0);

  let updatedGoal = null;
  const updated = existing.map((g) => {
    if (String(g.id) === targetId) {
      // Cap saved at target
      const newSaved = Math.min(g.target, g.saved + addAmt);
      updatedGoal = {
        ...g,
        saved: newSaved,
      };
      return updatedGoal;
    }
    return g;
  });

  if (updatedGoal) {
    saveGoals(updated);
  }
  return updatedGoal;
};

export const calculateGoalMetrics = (goal) => {
  const target = Math.abs(Number(goal.target) || 0);
  const saved = Math.abs(Number(goal.saved) || 0);
  const remaining = Math.max(0, target - saved);

  const rawPercentage = target > 0 ? (saved / target) * 100 : 0;
  const percentage = Math.round(rawPercentage);
  const displayPercentage = Math.min(percentage, 100);
  const isCompleted = saved >= target && target > 0;

  // Deadline calculation
  let daysLeft = null;
  let deadlineStatus = "Upcoming";
  let deadlineLabel = "";

  if (goal.deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(goal.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    if (!isNaN(deadlineDate.getTime())) {
      const diffMs = deadlineDate.getTime() - today.getTime();
      daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (isCompleted) {
        deadlineStatus = "Completed";
        deadlineLabel = "Completed";
      } else if (daysLeft < 0) {
        deadlineStatus = "Overdue";
        deadlineLabel = "Overdue";
      } else if (daysLeft === 0) {
        deadlineStatus = "Due today";
        deadlineLabel = "Due today";
      } else if (daysLeft === 1) {
        deadlineStatus = "1 day left";
        deadlineLabel = "1 day left";
      } else {
        deadlineStatus = `${daysLeft} days left`;
        deadlineLabel = `${daysLeft} days left`;
      }
    }
  }

  // Goal Status
  let statusKey = "started";
  let statusTitle = "Getting Started";

  if (isCompleted) {
    statusKey = "completed";
    statusTitle = "Goal Completed";
  } else if (deadlineStatus === "Overdue") {
    statusKey = "overdue";
    statusTitle = "Overdue";
  } else if (percentage >= 90) {
    statusKey = "final";
    statusTitle = "Final Stretch";
  } else if (percentage >= 75) {
    statusKey = "almost";
    statusTitle = "Almost There";
  } else if (percentage >= 50) {
    statusKey = "progress";
    statusTitle = "Making Progress";
  } else {
    statusKey = "started";
    statusTitle = "Getting Started";
  }

  // Recommended monthly saving calculation
  let recommendedMonthly = 0;
  let recommendedText = "";

  if (!isCompleted && daysLeft !== null && daysLeft > 0 && remaining > 0) {
    const monthsLeft = Math.max(1, Math.round(daysLeft / 30));
    recommendedMonthly = Math.ceil(remaining / monthsLeft);
    recommendedText = `Save ~₹${recommendedMonthly.toLocaleString("en-IN")}/mo to reach on time`;
  }

  return {
    target,
    saved,
    remaining,
    percentage,
    displayPercentage,
    isCompleted,
    daysLeft,
    deadlineStatus,
    deadlineLabel,
    statusKey,
    statusTitle,
    recommendedMonthly,
    recommendedText,
  };
};

export const calculateGoalsSummary = (goalsList) => {
  const list = goalsList !== undefined ? goalsList : getGoals();
  const totalGoals = list.length;
  let totalSaved = 0;
  let totalTarget = 0;
  let completedCount = 0;

  list.forEach((g) => {
    const s = Number(g.saved) || 0;
    const t = Number(g.target) || 0;
    totalSaved += s;
    totalTarget += t;
    if (s >= t && t > 0) {
      completedCount += 1;
    }
  });

  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return {
    totalGoals,
    totalSaved,
    totalTarget,
    totalRemaining,
    overallProgress,
    completedCount,
  };
};

/* =========================================================
   FORMATTING HELPERS
   ========================================================= */

export const formatINR = (amount, includeSign = false, type = null) => {
  const num = Number(amount) || 0;
  const formatted = Math.abs(num).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

  if (!includeSign) {
    return `₹${formatted}`;
  }

  if (type === "income" || (type === null && num > 0)) {
    return `+₹${formatted}`;
  }
  if (type === "expense" || (type === null && num < 0)) {
    return `-₹${formatted}`;
  }
  return `₹${formatted}`;
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "Today";
  try {
    if (typeof dateStr === "string" && dateStr.length === 10 && dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
};

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Other",
];

export const EXPENSE_CATEGORIES = [
  "Food",
  "Housing",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Bills",
  "Other",
];

export const getExpenseCategoryTotals = (transactionsList) => {
  const list = transactionsList !== undefined ? transactionsList : getTransactions();
  const totals = {};

  (list || []).forEach((t) => {
    if (t.type === "expense") {
      const cat = t.category || "Other";
      totals[cat] = (totals[cat] || 0) + Math.abs(Number(t.amount) || 0);
    }
  });

  return totals;
};
