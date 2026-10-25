const {
  processDueRecurringPayments,
  checkAndSendReminders,
} = require("./recurringPaymentService");

let intervalId = null;
let isProcessing = false;

async function runScheduledJobs() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const processed = await processDueRecurringPayments();
    if (processed.length > 0) {
      console.log(
        `[RecurringScheduler] Automatically generated ${processed.length} due recurring transaction(s).`
      );
    }

    const reminders = await checkAndSendReminders();
    if (reminders.length > 0) {
      console.log(
        `[RecurringScheduler] Dispatched ${reminders.length} bill reminder notification(s).`
      );
    }
  } catch (err) {
    console.error(
      "[RecurringScheduler] Error processing recurring schedules:",
      err.message
    );
  } finally {
    isProcessing = false;
  }
}

function startRecurringScheduler(intervalMs = 15 * 60 * 1000) {
  if (intervalId) return;

  console.log(
    "⏰ Recurring Payments Scheduler initialized (runs every 15 mins and on startup)"
  );

  // Run initial check right after start
  setTimeout(() => {
    runScheduledJobs();
  }, 3000);

  // Run on interval
  intervalId = setInterval(runScheduledJobs, intervalMs);
}

function stopRecurringScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = {
  startRecurringScheduler,
  stopRecurringScheduler,
  runScheduledJobs,
};
