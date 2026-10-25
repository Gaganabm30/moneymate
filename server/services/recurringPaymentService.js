const mongoose = require("mongoose");
const RecurringPayment = require("../models/RecurringPayment");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

/**
 * Calculate the next occurrence date given a base date and frequency
 */
function getNextOccurrence(baseDate, frequency) {
  const date = new Date(baseDate);

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;

    case "weekly":
      date.setDate(date.getDate() + 7);
      break;

    case "monthly": {
      const day = date.getDate();
      date.setMonth(date.getMonth() + 1);
      // If day was clamped by month overflow (e.g. Jan 31 -> Feb 28), handle cleanly
      if (date.getDate() !== day) {
        date.setDate(0); // Last day of target month
      }
      break;
    }

    case "yearly": {
      const year = date.getFullYear();
      date.setFullYear(year + 1);
      break;
    }

    default:
      date.setMonth(date.getMonth() + 1);
  }

  return date;
}

/**
 * Normalize recurrence amount to estimated monthly expense
 * daily: amount * (365 / 12)
 * weekly: amount * (52 / 12)
 * monthly: amount
 * yearly: amount / 12
 */
function normalizeMonthlyExpense(amount, frequency) {
  const num = Number(amount) || 0;
  switch (frequency) {
    case "daily":
      return Math.round(num * (365 / 12) * 100) / 100;
    case "weekly":
      return Math.round(num * (52 / 12) * 100) / 100;
    case "monthly":
      return num;
    case "yearly":
      return Math.round((num / 12) * 100) / 100;
    default:
      return num;
  }
}

/**
 * Determine bill status string based on next due date
 */
function getBillStatus(dueDate, now = new Date()) {
  const due = new Date(dueDate);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (due < startOfToday) {
    return "Overdue";
  }

  if (due >= startOfToday && due <= endOfToday) {
    return "Due Today";
  }

  return "Upcoming";
}

/**
 * Process due recurring payments idempotently.
 * Generates transactions when nextDueDate <= now, updates nextDueDate,
 * and handles missed executions without creating duplicate records.
 */
async function processDueRecurringPayments(now = new Date(), targetUserId = null) {
  const query = {
    status: "active",
    nextDueDate: { $lte: now },
  };

  if (targetUserId) {
    query.userId = targetUserId;
  }

  const dueSchedules = await RecurringPayment.find(query);
  const processed = [];

  for (const schedule of dueSchedules) {
    let currentDue = new Date(schedule.nextDueDate);
    let changed = false;

    // Process all occurrences up to current time (handles missed runs on restart)
    while (currentDue <= now) {
      // Check if schedule has an end date and has passed it
      if (schedule.endDate && currentDue > new Date(schedule.endDate)) {
        schedule.status = "completed";
        changed = true;
        break;
      }

      // Check if this occurrence was already created to guarantee idempotency
      const existingTx = await Transaction.findOne({
        recurringPaymentId: schedule._id,
        occurrenceDate: currentDue,
      });

      if (!existingTx) {
        // Generate corresponding transaction
        const newTx = await Transaction.create({
          userId: schedule.userId,
          type: schedule.type,
          amount: schedule.amount,
          category: schedule.category,
          title: schedule.title,
          description:
            schedule.description ||
            `Recurring ${schedule.type}: ${schedule.title}`,
          paymentMethod: schedule.paymentMethod || "upi",
          date: currentDue,
          recurring: true,
          recurringPaymentId: schedule._id,
          occurrenceDate: currentDue,
        });

        // Record in in-app notifications if not already recorded
        const existingNotif = await Notification.findOne({
          userId: schedule.userId,
          entityId: schedule._id,
          dueDate: currentDue,
          type: "success",
        });

        if (!existingNotif) {
          await Notification.create({
            userId: schedule.userId,
            title:
              schedule.type === "income"
                ? "Recurring Income Recorded"
                : "Recurring Bill Recorded",
            message: `${schedule.title} (${
              schedule.type === "income" ? "+" : "-"
            }₹${schedule.amount.toLocaleString("en-IN")}) has been recorded for ${currentDue.toLocaleDateString(
              "en-IN"
            )}.`,
            type: "success",
            entityId: schedule._id,
            entityType: "recurring",
            dueDate: currentDue,
          });
        }

        processed.push({
          scheduleId: schedule._id,
          transactionId: newTx._id,
          occurrenceDate: currentDue,
          amount: schedule.amount,
        });
      }

      // Advance schedule occurrence
      schedule.lastProcessedDate = now;
      schedule.lastProcessedOccurrence = currentDue;
      const nextDue = getNextOccurrence(currentDue, schedule.frequency);
      schedule.nextDueDate = nextDue;
      currentDue = nextDue;
      changed = true;

      // If next due date exceeds end date, complete the schedule
      if (schedule.endDate && nextDue > new Date(schedule.endDate)) {
        schedule.status = "completed";
        break;
      }
    }

    if (changed) {
      await schedule.save();
    }
  }

  return processed;
}

/**
 * Check and create in-app reminders and overdue alerts without duplicates
 */
async function checkAndSendReminders(now = new Date(), targetUserId = null) {
  const query = {
    status: "active",
    type: "expense",
  };

  if (targetUserId) {
    query.userId = targetUserId;
  }

  const activeBills = await RecurringPayment.find(query);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const notificationsCreated = [];

  for (const bill of activeBills) {
    const due = new Date(bill.nextDueDate);

    // 1. Overdue notification
    if (due < startOfToday) {
      const existingOverdue = await Notification.findOne({
        userId: bill.userId,
        entityId: bill._id,
        dueDate: due,
        type: "overdue",
      });

      if (!existingOverdue) {
        const notif = await Notification.create({
          userId: bill.userId,
          title: "Overdue Bill Alert",
          message: `Bill "${bill.title}" of ₹${bill.amount.toLocaleString(
            "en-IN"
          )} was due on ${due.toLocaleDateString("en-IN")}. Please pay and mark as paid.`,
          type: "overdue",
          entityId: bill._id,
          entityType: "bill",
          dueDate: due,
        });
        notificationsCreated.push(notif);
      }
    } else {
      // 2. Upcoming reminder before due date
      const reminderDays =
        typeof bill.reminderDaysBefore === "number"
          ? bill.reminderDaysBefore
          : 1;

      const reminderThreshold = new Date(due);
      reminderThreshold.setDate(reminderThreshold.getDate() - reminderDays);
      reminderThreshold.setHours(0, 0, 0, 0);

      if (now >= reminderThreshold && now <= due) {
        const existingReminder = await Notification.findOne({
          userId: bill.userId,
          entityId: bill._id,
          dueDate: due,
          type: "reminder",
        });

        if (!existingReminder) {
          const daysLeft = Math.max(
            0,
            Math.ceil((due - now) / (1000 * 60 * 60 * 24))
          );
          const timeText =
            daysLeft === 0
              ? "due today"
              : `due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;

          const notif = await Notification.create({
            userId: bill.userId,
            title: "Upcoming Bill Reminder",
            message: `Bill "${bill.title}" of ₹${bill.amount.toLocaleString(
              "en-IN"
            )} is ${timeText} (${due.toLocaleDateString("en-IN")}).`,
            type: "reminder",
            entityId: bill._id,
            entityType: "bill",
            dueDate: due,
          });
          notificationsCreated.push(notif);
        }
      }
    }
  }

  return notificationsCreated;
}

/**
 * Calculate overview statistics for recurring payments
 */
async function getRecurringOverview(userId, now = new Date()) {
  const allSchedules = await RecurringPayment.find({ userId });

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  let totalUpcoming = 0;
  let dueThisWeek = 0;
  let overduePayments = 0;
  let overdueCount = 0;
  let estimatedMonthlyExpenses = 0;
  let activeExpenseCount = 0;
  let activeIncomeCount = 0;
  let pausedCount = 0;

  for (const s of allSchedules) {
    if (s.status === "paused") {
      pausedCount++;
      continue;
    }

    if (s.status === "completed") {
      continue;
    }

    // Active schedule
    if (s.type === "expense") {
      activeExpenseCount++;

      // Normalized monthly expense commitment
      estimatedMonthlyExpenses += normalizeMonthlyExpense(
        s.amount,
        s.frequency
      );

      const due = new Date(s.nextDueDate);

      if (due < startOfToday) {
        overduePayments += s.amount;
        overdueCount++;
      } else {
        totalUpcoming += s.amount;

        if (due <= endOfWeek) {
          dueThisWeek += s.amount;
        }
      }
    } else if (s.type === "income") {
      activeIncomeCount++;
    }
  }

  return {
    totalUpcoming: Math.round(totalUpcoming * 100) / 100,
    dueThisWeek: Math.round(dueThisWeek * 100) / 100,
    overduePayments: Math.round(overduePayments * 100) / 100,
    overdueCount,
    estimatedMonthlyExpenses:
      Math.round(estimatedMonthlyExpenses * 100) / 100,
    activeExpenseCount,
    activeIncomeCount,
    pausedCount,
    totalCount: allSchedules.length,
  };
}

module.exports = {
  getNextOccurrence,
  normalizeMonthlyExpense,
  getBillStatus,
  processDueRecurringPayments,
  checkAndSendReminders,
  getRecurringOverview,
};
