const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Transaction = require("./models/Transaction");
const RecurringPayment = require("./models/RecurringPayment");
const Goal = require("./models/Goal");
const forecastingService = require("./services/forecastingService");
const connectDB = require("./config/db");

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING FINANCIAL FORECASTING TEST SUITE");
  console.log("==================================================");

  await connectDB();

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  try {
    // Clean up any old test data
    await Transaction.deleteMany({ userId: { $in: [userA, userB] } });
    await RecurringPayment.deleteMany({ userId: { $in: [userA, userB] } });
    await Goal.deleteMany({ userId: { $in: [userA, userB] } });

    console.log("✓ Test isolation setup complete.");

    // -------------------------------------------------------------------------
    // TEST 1: Empty state (Zero transactions, zero recurring, zero goals)
    // -------------------------------------------------------------------------
    const emptyForecast = await forecastingService.generateForecast(userA, {
      days: 30,
      scenario: "expected",
      threshold: 5000,
    });

    if (emptyForecast.overview.currentBalance !== 0) {
      throw new Error(`Test 1 Failed: Expected current balance 0, got ${emptyForecast.overview.currentBalance}`);
    }
    if (emptyForecast.confidence.score > 20) {
      throw new Error(`Test 1 Failed: Expected low confidence score for empty user, got ${emptyForecast.confidence.score}`);
    }
    console.log("✓ Test 1: Empty state handled cleanly with zero balance and low confidence flag.");

    // -------------------------------------------------------------------------
    // TEST 2: Add historical transactions for User A and verify current balance
    // -------------------------------------------------------------------------
    const baseDate = new Date();
    const dMinus20 = new Date(baseDate.getTime() - 20 * 24 * 3600 * 1000);
    const dMinus10 = new Date(baseDate.getTime() - 10 * 24 * 3600 * 1000);
    const dMinus5 = new Date(baseDate.getTime() - 5 * 24 * 3600 * 1000);

    // User A: Income 50,000, Expenses: 10,000 + 5,000 = 15,000 => Balance = 35,000
    await Transaction.create([
      {
        userId: userA,
        title: "Monthly Salary",
        type: "income",
        amount: 50000,
        category: "Salary",
        date: dMinus20,
      },
      {
        userId: userA,
        title: "Grocery Shopping",
        type: "expense",
        amount: 10000,
        category: "Food",
        date: dMinus10,
      },
      {
        userId: userA,
        title: "Electricity & Gas",
        type: "expense",
        amount: 5000,
        category: "Bills & Utilities",
        date: dMinus5,
      },
    ]);

    const forecastA = await forecastingService.generateForecast(userA, {
      days: 30,
      scenario: "expected",
      threshold: 10000,
    });

    if (forecastA.overview.currentBalance !== 35000) {
      throw new Error(`Test 2 Failed: Expected balance 35000, got ${forecastA.overview.currentBalance}`);
    }
    console.log("✓ Test 2: Current recorded balance accurately calculated (₹35,000).");

    // -------------------------------------------------------------------------
    // TEST 3: User Data Isolation (User B should not see User A's transactions)
    // -------------------------------------------------------------------------
    const forecastB = await forecastingService.generateForecast(userB, {
      days: 30,
      scenario: "expected",
      threshold: 5000,
    });

    if (forecastB.overview.currentBalance !== 0) {
      throw new Error(`Test 3 Failed: User B leaked User A data! Balance: ${forecastB.overview.currentBalance}`);
    }
    console.log("✓ Test 3: User data strictly isolated between authenticated users.");

    // -------------------------------------------------------------------------
    // TEST 4: Recurring Payment Schedule Integration
    // -------------------------------------------------------------------------
    // Add a recurring rent bill due in 7 days of ₹30,000
    const dPlus7 = new Date(baseDate.getTime() + 7 * 24 * 3600 * 1000);
    await RecurringPayment.create({
      userId: userA,
      title: "Apartment Rent",
      type: "expense",
      amount: 30000,
      category: "Housing",
      frequency: "monthly",
      startDate: dMinus20,
      nextDueDate: dPlus7,
      status: "active",
    });

    const forecastWithRent = await forecastingService.generateForecast(userA, {
      days: 30,
      scenario: "expected",
      threshold: 25000, // Threshold 25,000
    });

    // Check that rent appears in chart timeline events
    const rentEvent = forecastWithRent.chartData.find((pt) =>
      pt.events && pt.events.some((e) => e.title === "Apartment Rent")
    );
    if (!rentEvent) {
      throw new Error("Test 4 Failed: Recurring rent not found in timeline occurrences.");
    }
    console.log("✓ Test 4: Recurring payment schedule accurately projected onto future calendar date.");

    // -------------------------------------------------------------------------
    // TEST 5: Low-Balance Warning Trigger
    // -------------------------------------------------------------------------
    // Because rent of 20,000 reduces balance below 20,000 threshold, warning should be triggered
    if (!forecastWithRent.warningDetails.isWarning) {
      throw new Error("Test 5 Failed: Expected low-balance warning to trigger when dipping below ₹20,000.");
    }
    console.log(`✓ Test 5: Low-balance warning triggered correctly (Estimated dip to ₹${forecastWithRent.warningDetails.lowestProjectedBalance}).`);

    // -------------------------------------------------------------------------
    // TEST 6: Scenario Calculations (Conservative vs Expected vs Higher-Spending)
    // -------------------------------------------------------------------------
    const conservative = forecastWithRent.scenarios.conservative;
    const expected = forecastWithRent.scenarios.expected;
    const higherSpending = forecastWithRent.scenarios.higherSpending;

    if (conservative.balance30Days > expected.balance30Days) {
      throw new Error("Test 6 Failed: Conservative balance should be <= Expected balance.");
    }
    if (higherSpending.balance30Days > expected.balance30Days) {
      throw new Error("Test 6 Failed: Higher-spending balance should be <= Expected balance.");
    }
    console.log("✓ Test 6: Scenarios verified (Conservative < Expected and Higher-Spending < Expected).");

    // -------------------------------------------------------------------------
    // TEST 7: Savings Goals Forecast
    // -------------------------------------------------------------------------
    const targetDeadline = new Date(baseDate.getTime() + 180 * 24 * 3600 * 1000); // 6 months
    await Goal.create({
      userId: userA,
      title: "Emergency Fund",
      category: "Emergency",
      target: 60000,
      saved: 10000, // Remaining 50,000
      deadline: targetDeadline,
    });

    const forecastWithGoal = await forecastingService.generateForecast(userA, {
      days: 90,
      scenario: "expected",
      threshold: 5000,
    });

    const goalItem = forecastWithGoal.goalsForecast.find((g) => g.title === "Emergency Fund");
    if (!goalItem) {
      throw new Error("Test 7 Failed: Goal not found in forecast.");
    }
    if (goalItem.remaining !== 50000 || goalItem.percentageCompleted !== 17) {
      throw new Error(`Test 7 Failed: Expected remaining 50000, got ${goalItem.remaining}`);
    }
    console.log(`✓ Test 7: Goal estimation active: status="${goalItem.status}", explanation="${goalItem.explanation}".`);

    // Clean up test data
    await Transaction.deleteMany({ userId: { $in: [userA, userB] } });
    await RecurringPayment.deleteMany({ userId: { $in: [userA, userB] } });
    await Goal.deleteMany({ userId: { $in: [userA, userB] } });

    console.log("==================================================");
    console.log("🎉 ALL 7 FINANCIAL FORECASTING TESTS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test Suite Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
