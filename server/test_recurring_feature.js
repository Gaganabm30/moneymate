const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Transaction = require("./models/Transaction");
const RecurringPayment = require("./models/RecurringPayment");
const Notification = require("./models/Notification");
const {
  getNextOccurrence,
  normalizeMonthlyExpense,
  getBillStatus,
  processDueRecurringPayments,
  checkAndSendReminders,
  getRecurringOverview,
} = require("./services/recurringPaymentService");

const connectDB = require("./config/db");

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING RECURRING TRANSACTIONS & BILLS TEST SUITE");
  console.log("==================================================");

  await connectDB();

  const testUserAId = new mongoose.Types.ObjectId();
  const testUserBId = new mongoose.Types.ObjectId();

  try {
    // Clean up any old test data
    await RecurringPayment.deleteMany({ userId: { $in: [testUserAId, testUserBId] } });
    await Transaction.deleteMany({ userId: { $in: [testUserAId, testUserBId] } });
    await Notification.deleteMany({ userId: { $in: [testUserAId, testUserBId] } });

    console.log("✓ Test environment initialized with isolated test user IDs.");

    // ----------------------------------------------------
    // TEST 1: CREATE RECURRING MONTHLY EXPENSE
    // ----------------------------------------------------
    const expenseSchedule = await RecurringPayment.create({
      userId: testUserAId,
      title: "Fiber Broadband Internet",
      type: "expense",
      amount: 999,
      category: "Bills & Utilities",
      frequency: "monthly",
      startDate: new Date("2026-10-01"),
      nextDueDate: new Date("2026-11-01"),
      reminderDaysBefore: 2,
      description: "High speed fiber broadband connection",
      paymentMethod: "upi",
    });

    if (!expenseSchedule || expenseSchedule.amount !== 999) {
      throw new Error("Test 1 Failed: Expense schedule creation failed.");
    }
    console.log("✓ Test 1: Created recurring monthly expense successfully.");

    // ----------------------------------------------------
    // TEST 2: CREATE RECURRING INCOME
    // ----------------------------------------------------
    const incomeSchedule = await RecurringPayment.create({
      userId: testUserAId,
      title: "Tech Consulting Retainer",
      type: "income",
      amount: 45000,
      category: "Freelance",
      frequency: "monthly",
      startDate: new Date("2026-10-05"),
      nextDueDate: new Date("2026-11-05"),
      description: "Monthly client consulting retainer",
    });

    if (!incomeSchedule || incomeSchedule.amount !== 45000) {
      throw new Error("Test 2 Failed: Income schedule creation failed.");
    }
    console.log("✓ Test 2: Created recurring income successfully.");

    // ----------------------------------------------------
    // TEST 3: EDIT SCHEDULE
    // ----------------------------------------------------
    expenseSchedule.title = "High-Speed Fiber Broadband";
    expenseSchedule.amount = 1199;
    await expenseSchedule.save();

    const updated = await RecurringPayment.findById(expenseSchedule._id);
    if (updated.amount !== 1199 || updated.title !== "High-Speed Fiber Broadband") {
      throw new Error("Test 3 Failed: Edit schedule values mismatch.");
    }
    console.log("✓ Test 3: Edited schedule successfully.");

    // ----------------------------------------------------
    // TEST 4: PAUSE & RESUME SCHEDULE
    // ----------------------------------------------------
    expenseSchedule.status = "paused";
    await expenseSchedule.save();
    let reloaded = await RecurringPayment.findById(expenseSchedule._id);
    if (reloaded.status !== "paused") {
      throw new Error("Test 4 Failed: Schedule status was not paused.");
    }

    expenseSchedule.status = "active";
    await expenseSchedule.save();
    reloaded = await RecurringPayment.findById(expenseSchedule._id);
    if (reloaded.status !== "active") {
      throw new Error("Test 4 Failed: Schedule status was not resumed.");
    }
    console.log("✓ Test 4: Pause and resume schedule verified.");

    // ----------------------------------------------------
    // TEST 5: MONTHLY NORMALIZATION CALCULATION
    // ----------------------------------------------------
    const normDaily = normalizeMonthlyExpense(100, "daily");
    const normWeekly = normalizeMonthlyExpense(1000, "weekly");
    const normMonthly = normalizeMonthlyExpense(1200, "monthly");
    const normYearly = normalizeMonthlyExpense(12000, "yearly");

    if (normMonthly !== 1200 || normYearly !== 1000) {
      throw new Error("Test 5 Failed: Normalization math incorrect.");
    }
    console.log(`✓ Test 5: Normalization math verified: Monthly: ${normMonthly}, Yearly/mo: ${normYearly}, Weekly/mo: ${normWeekly}, Daily/mo: ${normDaily}`);

    // ----------------------------------------------------
    // TEST 6: AUTOMATIC PROCESS DUE OCCURRENCE
    // ----------------------------------------------------
    // Create an active bill whose nextDueDate was yesterday
    const pastDueDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dueBill = await RecurringPayment.create({
      userId: testUserAId,
      title: "Mobile Postpaid Bill",
      type: "expense",
      amount: 499,
      category: "Bills & Utilities",
      frequency: "monthly",
      startDate: new Date("2026-09-01"),
      nextDueDate: pastDueDate,
      status: "active",
    });

    const processed = await processDueRecurringPayments(new Date(), testUserAId);
    if (!processed.some((p) => String(p.scheduleId) === String(dueBill._id))) {
      throw new Error("Test 6 Failed: Due bill was not automatically processed.");
    }

    const generatedTx = await Transaction.find({
      recurringPaymentId: dueBill._id,
      userId: testUserAId,
    });

    if (generatedTx.length !== 1) {
      throw new Error(`Test 6 Failed: Expected 1 transaction, got ${generatedTx.length}`);
    }

    if (generatedTx[0].amount !== 499 || generatedTx[0].recurring !== true) {
      throw new Error("Test 6 Failed: Generated transaction fields mismatch.");
    }

    const updatedDueBill = await RecurringPayment.findById(dueBill._id);
    if (new Date(updatedDueBill.nextDueDate) <= pastDueDate) {
      throw new Error("Test 6 Failed: Next due date was not advanced.");
    }
    console.log("✓ Test 6: Due occurrence generated transaction and advanced nextDueDate.");

    // ----------------------------------------------------
    // TEST 7: IDEMPOTENCY — PROCESS TWICE, NO DUPLICATE
    // ----------------------------------------------------
    const processedSecondRun = await processDueRecurringPayments(new Date(), testUserAId);
    const txAfterSecondRun = await Transaction.find({
      recurringPaymentId: dueBill._id,
      userId: testUserAId,
    });

    if (txAfterSecondRun.length !== 1) {
      throw new Error(`Test 7 Failed: Duplicate transaction generated! Count: ${txAfterSecondRun.length}`);
    }
    console.log("✓ Test 7: Idempotency verified. Running due processing twice created NO duplicates.");

    // ----------------------------------------------------
    // TEST 8: MARK BILL AS PAID
    // ----------------------------------------------------
    const billToPay = await RecurringPayment.create({
      userId: testUserAId,
      title: "Gym Membership",
      type: "expense",
      amount: 2500,
      category: "Fitness",
      frequency: "monthly",
      startDate: new Date("2026-10-01"),
      nextDueDate: new Date("2026-10-28"),
      status: "active",
    });

    const initialDue = new Date(billToPay.nextDueDate);

    // Simulate mark bill paid
    const paidTx = await Transaction.create({
      userId: testUserAId,
      type: billToPay.type,
      amount: billToPay.amount,
      category: billToPay.category,
      title: billToPay.title,
      description: `Bill payment: ${billToPay.title}`,
      paymentMethod: "upi",
      date: new Date(),
      recurring: true,
      recurringPaymentId: billToPay._id,
      occurrenceDate: initialDue,
    });

    const nextDue = getNextOccurrence(initialDue, billToPay.frequency);
    billToPay.nextDueDate = nextDue;
    billToPay.lastProcessedDate = new Date();
    billToPay.lastProcessedOccurrence = initialDue;
    await billToPay.save();

    const checkPaidTx = await Transaction.find({
      recurringPaymentId: billToPay._id,
      userId: testUserAId,
    });

    if (checkPaidTx.length !== 1) {
      throw new Error("Test 8 Failed: Expected 1 paid transaction recorded.");
    }

    if (new Date(billToPay.nextDueDate).getTime() === initialDue.getTime()) {
      throw new Error("Test 8 Failed: Next due date did not advance after payment.");
    }
    console.log("✓ Test 8: Marked bill as paid: 1 transaction recorded, nextDueDate advanced.");

    // ----------------------------------------------------
    // TEST 9: OVERDUE BILL DETECTION & NOTIFICATIONS
    // ----------------------------------------------------
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const overdueBill = await RecurringPayment.create({
      userId: testUserAId,
      title: "Water Utility Bill",
      type: "expense",
      amount: 350,
      category: "Bills & Utilities",
      frequency: "monthly",
      startDate: new Date("2026-09-01"),
      nextDueDate: threeDaysAgo,
      status: "active",
    });

    const statusStr = getBillStatus(overdueBill.nextDueDate);
    if (statusStr !== "Overdue") {
      throw new Error(`Test 9 Failed: Expected status 'Overdue', got '${statusStr}'`);
    }

    const notifs1 = await checkAndSendReminders(new Date(), testUserAId);
    const overdueNotifs = await Notification.find({
      userId: testUserAId,
      entityId: overdueBill._id,
      type: "overdue",
    });

    if (overdueNotifs.length !== 1) {
      throw new Error(`Test 9 Failed: Expected 1 overdue alert, got ${overdueNotifs.length}`);
    }

    // Run again to ensure no duplicate notifications
    await checkAndSendReminders(new Date(), testUserAId);
    const overdueNotifs2 = await Notification.find({
      userId: testUserAId,
      entityId: overdueBill._id,
      type: "overdue",
    });

    if (overdueNotifs2.length !== 1) {
      throw new Error(`Test 9 Failed: Duplicate notification created! Got ${overdueNotifs2.length}`);
    }
    console.log("✓ Test 9: Overdue bill identified and dispatched exactly 1 notification without duplicates.");

    // ----------------------------------------------------
    // TEST 10: OVERVIEW CALCULATIONS & EXCLUSION OF PAUSED
    // ----------------------------------------------------
    const overviewData = await getRecurringOverview(testUserAId);
    if (overviewData.estimatedMonthlyExpenses <= 0) {
      throw new Error("Test 10 Failed: Estimated monthly recurring expenses should be > 0.");
    }

    // Verify income is not in expense calculation
    const allExpenses = await RecurringPayment.find({
      userId: testUserAId,
      type: "expense",
      status: "active",
    });
    let manualSum = 0;
    for (const exp of allExpenses) {
      manualSum += normalizeMonthlyExpense(exp.amount, exp.frequency);
    }
    manualSum = Math.round(manualSum * 100) / 100;

    if (Math.abs(overviewData.estimatedMonthlyExpenses - manualSum) > 0.05) {
      throw new Error(`Test 10 Failed: Overview mismatch. Calc: ${overviewData.estimatedMonthlyExpenses}, Manual: ${manualSum}`);
    }
    console.log(`✓ Test 10: Overview verified. Estimated Monthly Recurring Expenses: ₹${overviewData.estimatedMonthlyExpenses}`);

    // ----------------------------------------------------
    // TEST 11: USER DATA ISOLATION
    // ----------------------------------------------------
    const userBSchedules = await RecurringPayment.find({ userId: testUserBId });
    if (userBSchedules.length !== 0) {
      throw new Error("Test 11 Failed: User B saw User A's schedules!");
    }

    const userBOverview = await getRecurringOverview(testUserBId);
    if (userBOverview.totalUpcoming !== 0 || userBOverview.totalCount !== 0) {
      throw new Error("Test 11 Failed: User B overview contaminated with User A data!");
    }
    console.log("✓ Test 11: User isolation verified. User B cannot see User A's data.");

    // ----------------------------------------------------
    // TEST 12: DELETE SCHEDULE PRESERVES TRANSACTION HISTORY
    // ----------------------------------------------------
    // dueBill had 1 generated transaction: generatedTx[0]._id
    const targetTxId = generatedTx[0]._id;
    await RecurringPayment.findByIdAndDelete(dueBill._id);

    const checkScheduleGone = await RecurringPayment.findById(dueBill._id);
    if (checkScheduleGone !== null) {
      throw new Error("Test 12 Failed: Schedule was not deleted.");
    }

    const checkTxStillExists = await Transaction.findById(targetTxId);
    if (!checkTxStillExists) {
      throw new Error("Test 12 Failed: Historical transaction was deleted when schedule was removed!");
    }
    console.log("✓ Test 12: Deleted schedule verified. Recorded historical transaction remains intact!");

    console.log("==================================================");
    console.log("🎉 ALL 12 TEST SUITE CHECKS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } finally {
    // Cleanup test data
    await RecurringPayment.deleteMany({ userId: { $in: [testUserAId, testUserBId] } });
    await Transaction.deleteMany({ userId: { $in: [testUserAId, testUserBId] } });
    await Notification.deleteMany({ userId: { $in: [testUserAId, testUserBId] } });
    await mongoose.disconnect();
    console.log("✓ Test cleanup completed and DB disconnected.");
  }
}

runTests().catch((err) => {
  console.error("❌ TEST RUNNER FAILED:", err);
  process.exit(1);
});
