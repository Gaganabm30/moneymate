const Transaction = require("../models/Transaction");
const RecurringPayment = require("../models/RecurringPayment");
const Goal = require("../models/Goal");
const User = require("../models/User");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeNum = (n, fallback = 0) => (Number.isFinite(Number(n)) ? Number(n) : fallback);

function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date) {
  const d = new Date(date);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${monthNames[d.getMonth()]} ${d.getDate()}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Generate all upcoming occurrences of an active recurring schedule
 * within [startDate, endDateLimit].
 */
function getOccurrencesForSchedule(schedule, rangeStart, rangeEnd) {
  const occurrences = [];
  if (!schedule.nextDueDate || schedule.status !== "active") return occurrences;

  let current = new Date(schedule.nextDueDate);
  const scheduleEnd = schedule.endDate ? new Date(schedule.endDate) : null;
  const maxOccurrences = 400; // safety ceiling
  let count = 0;

  // If nextDueDate is in the past, advance it forward according to frequency
  while (current < rangeStart && count < maxOccurrences) {
    count++;
    current = advanceOccurrence(current, schedule.frequency);
  }

  while (current <= rangeEnd && count < maxOccurrences) {
    if (scheduleEnd && current > scheduleEnd) break;
    if (current >= rangeStart) {
      occurrences.push({
        date: new Date(current),
        dateStr: formatDateKey(current),
        title: schedule.title,
        amount: safeNum(schedule.amount),
        type: schedule.type, // "income" or "expense"
        category: schedule.category || "General",
        paymentMethod: schedule.paymentMethod || "upi",
        scheduleId: schedule._id,
      });
    }
    current = advanceOccurrence(current, schedule.frequency);
    count++;
  }

  return occurrences;
}

function advanceOccurrence(date, frequency) {
  const next = new Date(date);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "monthly":
    default: {
      const targetMonth = next.getMonth() + 1;
      const targetDay = next.getDate();
      next.setMonth(targetMonth);
      // Handle month-end roll-overs (e.g. Jan 31 -> Feb 28)
      if (next.getDate() !== targetDay) {
        next.setDate(0);
      }
      break;
    }
  }
  return next;
}

/**
 * Core Forecasting Service
 */
class ForecastingService {
  /**
   * Generates a comprehensive financial forecast for the authenticated user.
   *
   * @param {string|ObjectId} userId
   * @param {Object} options
   * @param {number} [options.days=30] - Horizon: 30, 60, or 90
   * @param {string} [options.scenario="expected"] - "conservative" | "expected" | "higher-spending"
   * @param {number} [options.threshold=5000] - Low-balance threshold
   */
  async generateForecast(userId, options = {}) {
    const horizonDays = [30, 60, 90].includes(Number(options.days))
      ? Number(options.days)
      : 30;

    const validScenarios = ["conservative", "expected", "higher-spending"];
    const scenario = validScenarios.includes(options.scenario)
      ? options.scenario
      : "expected";

    const threshold = safeNum(options.threshold, 5000);

    // 1. Fetch user data in parallel
    const [transactions, recurringSchedules, goals, user] = await Promise.all([
      Transaction.find({ userId }).sort({ date: 1 }).lean(),
      RecurringPayment.find({ userId, status: "active" }).lean(),
      Goal.find({ userId }).lean(),
      User.findById(userId).lean(),
    ]);

    // 2. Calculate Current Recorded Balance
    let totalRecordedIncome = 0;
    let totalRecordedExpense = 0;

    transactions.forEach((tx) => {
      const amt = safeNum(tx.amount);
      if (tx.type === "income") {
        totalRecordedIncome += amt;
      } else if (tx.type === "expense") {
        totalRecordedExpense += amt;
      }
    });

    const currentBalance = totalRecordedIncome - totalRecordedExpense;

    // 3. Historical Run-Rate & Trend Analysis
    const now = new Date();
    const todayStr = formatDateKey(now);
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Look back at recent history (last 60 days or all transactions if fewer)
    const lookbackDays = 60;
    const lookbackCutoff = addDays(todayZero, -lookbackDays);
    const recentTx = transactions.filter((tx) => new Date(tx.date) >= lookbackCutoff);

    // Calculate actual active days in recent history
    let earliestRecent = recentTx.length > 0 ? new Date(recentTx[0].date) : todayZero;
    const daysWithHistory = Math.max(
      1,
      Math.min(lookbackDays, Math.round((todayZero - earliestRecent) / (1000 * 3600 * 24)) + 1)
    );

    // Separate discretionary vs recurring historical transactions to avoid double-counting
    let recentDiscretionaryIncome = 0;
    let recentDiscretionaryExpense = 0;
    const expenseAmounts = [];

    recentTx.forEach((tx) => {
      const amt = safeNum(tx.amount);
      const isTaggedRecurring = Boolean(tx.recurring || tx.recurringPaymentId);

      if (tx.type === "income") {
        if (!isTaggedRecurring) {
          recentDiscretionaryIncome += amt;
        }
      } else if (tx.type === "expense") {
        expenseAmounts.push(amt);
        if (!isTaggedRecurring) {
          recentDiscretionaryExpense += amt;
        }
      }
    });

    // Detect and filter large one-time expense outliers from discretionary baseline
    let filteredDiscretionaryExpense = recentDiscretionaryExpense;
    if (expenseAmounts.length >= 5) {
      expenseAmounts.sort((a, b) => a - b);
      const median = expenseAmounts[Math.floor(expenseAmounts.length / 2)];
      const outlierThreshold = Math.max(median * 4, 25000); // 4x median or 25k

      const nonOutlierTotal = recentTx
        .filter((tx) => tx.type === "expense" && !tx.recurring && !tx.recurringPaymentId)
        .filter((tx) => safeNum(tx.amount) <= outlierThreshold)
        .reduce((sum, tx) => sum + safeNum(tx.amount), 0);

      filteredDiscretionaryExpense = nonOutlierTotal;
    }

    const baselineDailyDiscretionaryIncome = recentDiscretionaryIncome / daysWithHistory;
    const baselineDailyDiscretionaryExpense = filteredDiscretionaryExpense / daysWithHistory;

    // 4. Map Upcoming Known Recurring Payments onto Future Timeline
    const forecastEnd = addDays(todayZero, 90); // Always project up to 90 days for overview metrics
    const upcomingEventsByDate = {};

    recurringSchedules.forEach((schedule) => {
      const occurrences = getOccurrencesForSchedule(schedule, todayZero, forecastEnd);
      occurrences.forEach((occ) => {
        if (!upcomingEventsByDate[occ.dateStr]) {
          upcomingEventsByDate[occ.dateStr] = [];
        }
        upcomingEventsByDate[occ.dateStr].push(occ);
      });
    });

    // 5. Generate Daily Projections for all 3 Scenarios
    // Scenario multipliers on discretionary cashflows:
    // Expected: 1.0x income, 1.0x expense
    // Conservative: 0.85x income, 1.15x expense (cushion for emergencies)
    // Higher-Spending: 1.0x income, 1.25x expense (splurge / inflation stress test)

    const timelinePoints = [];
    let runningExpected = currentBalance;
    let runningConservative = currentBalance;
    let runningHigherSpending = currentBalance;

    let total30DayIncome = 0;
    let total30DayExpense = 0;

    let balanceAt30 = currentBalance;
    let balanceAt60 = currentBalance;
    let balanceAt90 = currentBalance;

    // Day 0: Today anchor point
    timelinePoints.push({
      date: todayStr,
      label: "Today",
      dayIndex: 0,
      isForecast: false,
      actualBalance: Math.round(currentBalance),
      projectedBalance: Math.round(currentBalance),
      conservativeBalance: Math.round(currentBalance),
      higherSpendingBalance: Math.round(currentBalance),
      dailyCashflow: 0,
      events: upcomingEventsByDate[todayStr] || [],
    });

    for (let day = 1; day <= 90; day++) {
      const dateObj = addDays(todayZero, day);
      const dateStr = formatDateKey(dateObj);
      const events = upcomingEventsByDate[dateStr] || [];

      let recurringIncomeOnDay = 0;
      let recurringExpenseOnDay = 0;

      events.forEach((ev) => {
        if (ev.type === "income") {
          recurringIncomeOnDay += ev.amount;
        } else {
          recurringExpenseOnDay += ev.amount;
        }
      });

      // Expected Cashflow
      const expInc = recurringIncomeOnDay + baselineDailyDiscretionaryIncome;
      const expExp = recurringExpenseOnDay + baselineDailyDiscretionaryExpense;
      const netExp = expInc - expExp;
      runningExpected += netExp;

      // Conservative Cashflow (less variable income, more unexpected expenses)
      const consInc = recurringIncomeOnDay + baselineDailyDiscretionaryIncome * 0.85;
      const consExp = recurringExpenseOnDay + baselineDailyDiscretionaryExpense * 1.15;
      const netCons = consInc - consExp;
      runningConservative += netCons;

      // Higher-Spending Cashflow (standard income, +25% spending)
      const highInc = recurringIncomeOnDay + baselineDailyDiscretionaryIncome;
      const highExp = recurringExpenseOnDay + baselineDailyDiscretionaryExpense * 1.25;
      const netHigh = highInc - highExp;
      runningHigherSpending += netHigh;

      if (day <= 30) {
        total30DayIncome += expInc;
        total30DayExpense += expExp;
      }

      if (day === 30) balanceAt30 = runningExpected;
      if (day === 60) balanceAt60 = runningExpected;
      if (day === 90) balanceAt90 = runningExpected;

      // Only push to chart timeline if within the requested horizon
      if (day <= horizonDays) {
        timelinePoints.push({
          date: dateStr,
          label: formatShortDate(dateObj),
          dayIndex: day,
          isForecast: true,
          actualBalance: null,
          projectedBalance: Math.round(runningExpected),
          conservativeBalance: Math.round(runningConservative),
          higherSpendingBalance: Math.round(runningHigherSpending),
          dailyCashflow: Math.round(netExp),
          events,
        });
      }
    }

    // 6. Build Historical Actual Balance Trend (Past 30 Days)
    const historicalLookbackDays = 30;
    const historicalPoints = [];
    const pastStart = addDays(todayZero, -historicalLookbackDays);

    // Group transactions by date
    const txByDate = {};
    transactions.forEach((tx) => {
      const dKey = formatDateKey(tx.date);
      if (!txByDate[dKey]) txByDate[dKey] = { income: 0, expense: 0 };
      if (tx.type === "income") txByDate[dKey].income += safeNum(tx.amount);
      else txByDate[dKey].expense += safeNum(tx.amount);
    });

    // Reconstruct backwards from currentBalance
    const pastDailyDeltas = [];
    for (let day = 0; day <= historicalLookbackDays; day++) {
      const curDate = addDays(todayZero, -day);
      const dKey = formatDateKey(curDate);
      const dayData = txByDate[dKey] || { income: 0, expense: 0 };
      pastDailyDeltas.push({ dateObj: curDate, dKey, net: dayData.income - dayData.expense });
    }

    let runningBackwards = currentBalance;
    const tempHist = [];
    for (let i = 0; i < pastDailyDeltas.length; i++) {
      const item = pastDailyDeltas[i];
      if (i > 0) {
        runningBackwards -= pastDailyDeltas[i - 1].net;
      }
      tempHist.push({
        date: item.dKey,
        label: formatShortDate(item.dateObj),
        dayIndex: -i,
        isForecast: false,
        actualBalance: Math.round(runningBackwards),
        projectedBalance: null,
        conservativeBalance: null,
        higherSpendingBalance: null,
        dailyCashflow: item.net,
        events: [],
      });
    }

    // Sort past points chronologically (excluding Day 0 because Day 0 is in timelinePoints)
    tempHist.reverse();
    const finalHistoryPoints = tempHist.slice(0, tempHist.length - 1);

    // Merge history + forecast for the chart
    const combinedChartData = [...finalHistoryPoints, ...timelinePoints];

    // 7. Low-Balance Warnings Check
    const activeTimelineForWarnings = timelinePoints.slice(1); // skip Day 0
    let isWarning = false;
    let breachDate = null;
    let daysUntilBreach = null;
    let lowestBalance = currentBalance;
    let lowestDate = todayStr;
    const contributingPayments = [];

    activeTimelineForWarnings.forEach((pt) => {
      const balToCheck =
        scenario === "conservative"
          ? pt.conservativeBalance
          : scenario === "higher-spending"
          ? pt.higherSpendingBalance
          : pt.projectedBalance;

      if (balToCheck < lowestBalance) {
        lowestBalance = balToCheck;
        lowestDate = pt.date;
      }

      if (!isWarning && balToCheck < threshold) {
        isWarning = true;
        breachDate = pt.date;
        daysUntilBreach = pt.dayIndex;
      }

      // Collect contributing recurring expenses that triggered or worsened the dip
      if (isWarning && pt.events && pt.events.length > 0) {
        pt.events.forEach((ev) => {
          if (ev.type === "expense" && contributingPayments.length < 5) {
            contributingPayments.push({
              title: ev.title,
              amount: ev.amount,
              date: pt.date,
              category: ev.category,
            });
          }
        });
      }
    });

    const warningDetails = {
      isWarning,
      threshold,
      breachDate,
      daysUntilBreach,
      lowestProjectedBalance: Math.round(lowestBalance),
      lowestDate,
      warningSeverity: lowestBalance < 0 ? "critical" : isWarning ? "caution" : "none",
      headline:
        lowestBalance < 0
          ? "Projected Negative Balance Alert"
          : isWarning
          ? "Low-Balance Threshold Alert"
          : "Safe Cashflow Projection",
      message:
        lowestBalance < 0
          ? `Forecast models indicate your balance could drop to negative (₹${Math.abs(
              Math.round(lowestBalance)
            ).toLocaleString("en-IN")}) by ${formatShortDate(lowestDate)}.`
          : isWarning
          ? `Estimated balance is projected to fall below your ₹${threshold.toLocaleString(
              "en-IN"
            )} threshold around ${formatShortDate(breachDate)} (day ${daysUntilBreach}).`
          : `Projected balance remains comfortably above your ₹${threshold.toLocaleString(
              "en-IN"
            )} threshold throughout the ${horizonDays}-day period.`,
      contributingPayments,
      disclaimer: "Forecast Simulation — Not a confirmed future event. Estimates adapt with your new transactions.",
    };

    // 8. Savings Goals Forecast
    const projectedMonthlyNet = Math.round(total30DayIncome - total30DayExpense);
    const goalsForecast = goals.map((goal) => {
      const target = safeNum(goal.target);
      const saved = safeNum(goal.saved);
      const remaining = Math.max(0, target - saved);
      const percentageCompleted = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
      const isCompleted = remaining <= 0;

      let estimatedCompletionDate = null;
      let monthsNeeded = null;
      let status = "in-progress";
      let explanation = "";

      if (isCompleted) {
        status = "completed";
        explanation = "Goal achieved! Target savings reached.";
      } else if (transactions.length < 3) {
        status = "insufficient-data";
        explanation = "Insufficient transaction history to forecast a completion timeline.";
      } else if (projectedMonthlyNet <= 0) {
        status = "at-risk";
        explanation = `Current projected net monthly savings is non-positive (₹${projectedMonthlyNet.toLocaleString(
          "en-IN"
        )}/mo). Reduce discretionary expenses or increase income to reach this goal.`;
      } else {
        // Assume user can allocate a reasonable portion (e.g. 50% of net savings or full net savings if single goal)
        const allocatedMonthlySavings = goals.length > 1 ? projectedMonthlyNet / goals.length : projectedMonthlyNet;
        monthsNeeded = Math.ceil(remaining / allocatedMonthlySavings);
        const estDate = addDays(todayZero, Math.round(monthsNeeded * 30.4375));
        estimatedCompletionDate = formatDateKey(estDate);

        if (goal.deadline) {
          const deadlineDate = new Date(goal.deadline);
          if (estDate <= deadlineDate) {
            status = "on-track";
            explanation = `On track! At an estimated ₹${Math.round(
              allocatedMonthlySavings
            ).toLocaleString("en-IN")}/mo savings rate, you are projected to reach this goal by ${formatShortDate(
              estDate
            )}.`;
          } else {
            status = "behind-schedule";
            explanation = `Behind target deadline (${formatShortDate(
              deadlineDate
            )}). Projected completion is ${formatShortDate(
              estDate
            )}. Consider boosting savings by ₹${Math.round(
              remaining / Math.max(1, (deadlineDate - todayZero) / (1000 * 3600 * 24 * 30.4))
            ).toLocaleString("en-IN")}/mo.`;
          }
        } else {
          status = "on-track";
          explanation = `Projected completion in ~${monthsNeeded} month${
            monthsNeeded === 1 ? "" : "s"
          } (${formatShortDate(estDate)}).`;
        }
      }

      return {
        id: goal._id,
        title: goal.title,
        category: goal.category || "Savings",
        target,
        saved,
        remaining,
        percentageCompleted,
        deadline: goal.deadline ? formatDateKey(goal.deadline) : null,
        status,
        estimatedCompletionDate,
        monthsNeeded,
        explanation,
      };
    });

    // 9. Forecast Confidence & Data Quality Score
    let confidenceScore = 85;
    let confidenceLevel = "High";
    const dataSufficiencyNotes = [];

    if (transactions.length === 0) {
      confidenceScore = 10;
      confidenceLevel = "Insufficient Data";
      dataSufficiencyNotes.push("No transaction records found. Add past transactions to train the forecasting engine.");
    } else if (transactions.length < 10 || daysWithHistory < 14) {
      confidenceScore = 40;
      confidenceLevel = "Low";
      dataSufficiencyNotes.push("Limited transaction history (<14 days). Projections rely heavily on simple baseline averages.");
    } else if (daysWithHistory < 45) {
      confidenceScore = 65;
      confidenceLevel = "Moderate";
      dataSufficiencyNotes.push("Moderate history (~1 month). Trend detection will improve with continued records.");
    } else {
      confidenceScore = 90;
      confidenceLevel = "High";
      dataSufficiencyNotes.push("Extensive transaction history available across multiple pay cycles.");
    }

    if (recurringSchedules.length > 0) {
      dataSufficiencyNotes.push(`${recurringSchedules.length} active recurring payment schedule${recurringSchedules.length > 1 ? "s" : ""} detected and mapped to calendar due dates.`);
    } else {
      dataSufficiencyNotes.push("No active recurring schedules configured. Recurring payments help forecast exact bill spikes.");
    }

    const assumptions = [
      `Baseline daily discretionary spending: ₹${Math.round(baselineDailyDiscretionaryExpense).toLocaleString("en-IN")}/day based on past ${daysWithHistory} days.`,
      `Baseline daily discretionary income: ₹${Math.round(baselineDailyDiscretionaryIncome).toLocaleString("en-IN")}/day.`,
      `${recurringSchedules.length} recurring schedules mapped on their respective recurrence frequencies.`,
      scenario === "conservative"
        ? "Conservative scenario applied: -15% variable income buffer, +15% unexpected expense cushion."
        : scenario === "higher-spending"
        ? "Higher-spending scenario applied: +25% discretionary expenditure stress-test."
        : "Expected baseline scenario applied: past average spending patterns assumed to continue.",
      "Calculations derived exclusively from authenticated user records.",
    ];

    return {
      overview: {
        currentBalance: Math.round(currentBalance),
        balance30Days: Math.round(balanceAt30),
        balance60Days: Math.round(balanceAt60),
        balance90Days: Math.round(balanceAt90),
        projectedMonthlyIncome: Math.round(total30DayIncome),
        projectedMonthlyExpenses: Math.round(total30DayExpense),
        projectedMonthlyNet,
        activeScenario: scenario,
        horizonDays,
        currency: user?.currency || "INR",
      },
      scenarios: {
        conservative: {
          name: "Conservative",
          description: "-15% variable income buffer & +15% unexpected expense cushion.",
          balance30Days: Math.round(timelinePoints[Math.min(30, timelinePoints.length - 1)]?.conservativeBalance || currentBalance),
          balance60Days: Math.round(timelinePoints[Math.min(60, timelinePoints.length - 1)]?.conservativeBalance || currentBalance),
          balance90Days: Math.round(timelinePoints[Math.min(90, timelinePoints.length - 1)]?.conservativeBalance || currentBalance),
          projectedMonthlyNet: Math.round(total30DayIncome * 0.85 - total30DayExpense * 1.15),
          riskRating: "Low Risk",
        },
        expected: {
          name: "Expected (Baseline)",
          description: "Past average discretionary patterns continue with scheduled recurring bills.",
          balance30Days: Math.round(balanceAt30),
          balance60Days: Math.round(balanceAt60),
          balance90Days: Math.round(balanceAt90),
          projectedMonthlyNet,
          riskRating: "Moderate",
        },
        higherSpending: {
          name: "Higher-Spending",
          description: "+25% discretionary spending stress-test (lifestyle/travel/splurge).",
          balance30Days: Math.round(timelinePoints[Math.min(30, timelinePoints.length - 1)]?.higherSpendingBalance || currentBalance),
          balance60Days: Math.round(timelinePoints[Math.min(60, timelinePoints.length - 1)]?.higherSpendingBalance || currentBalance),
          balance90Days: Math.round(timelinePoints[Math.min(90, timelinePoints.length - 1)]?.higherSpendingBalance || currentBalance),
          projectedMonthlyNet: Math.round(total30DayIncome - total30DayExpense * 1.25),
          riskRating: "Stress Test",
        },
      },
      chartData: combinedChartData,
      warningDetails,
      goalsForecast,
      confidence: {
        score: confidenceScore,
        level: confidenceLevel,
        dataSufficiencyNotes,
        assumptions,
        transactionCount: transactions.length,
        recurringCount: recurringSchedules.length,
        goalsCount: goals.length,
      },
    };
  }
}

module.exports = new ForecastingService();
