const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Transaction = require("./models/Transaction");
const Budget = require("./models/Budget");
const Goal = require("./models/Goal");
const reportService = require("./services/reportService");
const connectDB = require("./config/db");

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING FINANCIAL REPORTS & EXPORT TEST SUITE");
  console.log("==================================================");

  await connectDB();

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  try {
    // Clean up any old test data
    await Transaction.deleteMany({ userId: { $in: [userA, userB] } });
    await Budget.deleteMany({ userId: { $in: [userA, userB] } });
    await Goal.deleteMany({ userId: { $in: [userA, userB] } });

    console.log("✓ Test isolation environment initialized.");

    // -------------------------------------------------------------------------
    // TEST 1: Empty state handling (No transactions)
    // -------------------------------------------------------------------------
    const emptyReport = await reportService.getReportData(userA, {
      reportType: "transaction-statement",
      preset: "this-month",
    });

    if (emptyReport.summary.totalIncome !== 0 || emptyReport.summary.transactionCount !== 0) {
      throw new Error("Test 1 Failed: Expected zero totals for empty user.");
    }
    console.log("✓ Test 1: Empty state handled cleanly with zero totals.");

    // -------------------------------------------------------------------------
    // TEST 2: Add seed records for User A and verify financial calculations
    // -------------------------------------------------------------------------
    const now = new Date();
    const d1 = new Date(now.getFullYear(), now.getMonth(), 2, 10, 0, 0);
    const d2 = new Date(now.getFullYear(), now.getMonth(), 5, 14, 0, 0);
    const d3 = new Date(now.getFullYear(), now.getMonth(), 8, 18, 0, 0);

    await Transaction.create([
      {
        userId: userA,
        title: "Client Retainer Income",
        type: "income",
        amount: 80000,
        category: "Salary",
        date: d1,
      },
      {
        userId: userA,
        title: "Grocery Mega Mart, Fresh Veggies", // contains comma
        type: "expense",
        amount: 12000,
        category: "Food",
        date: d2,
      },
      {
        userId: userA,
        title: "=SUM(1+2) Test Formula Injection", // formula injection trigger
        type: "expense",
        amount: 4000,
        category: "Utilities",
        date: d3,
      },
    ]);

    await Budget.create({
      userId: userA,
      category: "Food",
      limit: 15000,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    await Goal.create({
      userId: userA,
      title: "Vacation Fund",
      category: "Travel",
      target: 50000,
      saved: 20000,
    });

    const reportData = await reportService.getReportData(userA, {
      reportType: "transaction-statement",
      preset: "this-month",
    });

    if (reportData.summary.totalIncome !== 80000) {
      throw new Error(`Test 2 Failed: Expected income 80000, got ${reportData.summary.totalIncome}`);
    }
    if (reportData.summary.totalExpenses !== 16000) {
      throw new Error(`Test 2 Failed: Expected expenses 16000, got ${reportData.summary.totalExpenses}`);
    }
    if (reportData.summary.netCashFlow !== 64000) {
      throw new Error(`Test 2 Failed: Expected net cash flow 64000, got ${reportData.summary.netCashFlow}`);
    }
    if (reportData.summary.savingsRate !== 80) {
      throw new Error(`Test 2 Failed: Expected savings rate 80%, got ${reportData.summary.savingsRate}`);
    }
    console.log("✓ Test 2: Financial summary calculations match actual database records (Income: 80k, Exp: 16k, Net: 64k, Savings: 80%).");

    // -------------------------------------------------------------------------
    // TEST 3: User Data Isolation
    // -------------------------------------------------------------------------
    const reportUserB = await reportService.getReportData(userB, {
      reportType: "transaction-statement",
      preset: "this-month",
    });

    if (reportUserB.summary.totalIncome !== 0 || reportUserB.transactions.length !== 0) {
      throw new Error("Test 3 Failed: User B leaked User A data!");
    }
    console.log("✓ Test 3: User data strictly isolated between users.");

    // -------------------------------------------------------------------------
    // TEST 4: CSV Export & Formula Injection Escaping
    // -------------------------------------------------------------------------
    const csvContent = await reportService.generateCSV(userA, {
      reportType: "transaction-statement",
      preset: "this-month",
    });

    // Check UTF-8 BOM
    if (!csvContent.startsWith("\uFEFF")) {
      throw new Error("Test 4 Failed: CSV must start with UTF-8 BOM for spreadsheet compatibility.");
    }

    // Check comma escaping in title
    if (!csvContent.includes('"Grocery Mega Mart, Fresh Veggies"')) {
      throw new Error("Test 4 Failed: Comma in title was not wrapped in quotes.");
    }

    // Check formula injection escaping (=SUM must be prepended with ')
    if (!csvContent.includes("'=SUM(1+2)")) {
      throw new Error("Test 4 Failed: Formula injection '=SUM' was not safely sanitized.");
    }
    console.log("✓ Test 4: CSV generated with UTF-8 BOM, comma quoting, and formula-injection defense.");

    // -------------------------------------------------------------------------
    // TEST 5: Excel (.xlsx) Generation
    // -------------------------------------------------------------------------
    const excelBuffer = await reportService.generateExcel(userA, {
      reportType: "transaction-statement",
      preset: "this-month",
    });

    if (!Buffer.isBuffer(excelBuffer) || excelBuffer.length < 1000) {
      throw new Error("Test 5 Failed: Excel buffer is invalid or too small.");
    }
    // Check XLSX zip signature (PK\x03\x04)
    if (excelBuffer[0] !== 0x50 || excelBuffer[1] !== 0x4b) {
      throw new Error("Test 5 Failed: Buffer is not a genuine XLSX file.");
    }
    console.log(`✓ Test 5: Genuine Excel XLSX file generated successfully (${excelBuffer.length} bytes).`);

    // -------------------------------------------------------------------------
    // TEST 6: PDF Generation
    // -------------------------------------------------------------------------
    const pdfBuffer = await reportService.generatePDF(userA, {
      reportType: "transaction-statement",
      preset: "this-month",
    });

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length < 1000) {
      throw new Error("Test 6 Failed: PDF buffer is invalid or too small.");
    }
    // Check PDF header signature (%PDF)
    const pdfHeader = pdfBuffer.slice(0, 4).toString("utf8");
    if (pdfHeader !== "%PDF") {
      throw new Error(`Test 6 Failed: Invalid PDF signature: ${pdfHeader}`);
    }
    console.log(`✓ Test 6: Printable PDF report generated successfully (${pdfBuffer.length} bytes, starts with %PDF).`);

    // -------------------------------------------------------------------------
    // TEST 7: Budget Performance and Savings Goal Report Types
    // -------------------------------------------------------------------------
    const budgetReport = await reportService.getReportData(userA, {
      reportType: "budget-performance",
      preset: "this-month",
    });

    const foodBudget = budgetReport.budgetPerformance.find((b) => b.category === "Food");
    if (!foodBudget || foodBudget.spent !== 12000 || foodBudget.variance !== 3000) {
      throw new Error(`Test 7 Failed: Expected food budget spent 12000, variance 3000. Got ${JSON.stringify(foodBudget)}`);
    }

    const goalReport = await reportService.getReportData(userA, {
      reportType: "savings-goal-progress",
      preset: "this-month",
    });

    const vacGoal = goalReport.goalsProgress.find((g) => g.title === "Vacation Fund");
    if (!vacGoal || vacGoal.remaining !== 30000 || vacGoal.progressPct !== 40) {
      throw new Error(`Test 7 Failed: Expected vacation goal remaining 30000, progress 40%. Got ${JSON.stringify(vacGoal)}`);
    }
    console.log("✓ Test 7: Budget Performance & Savings Goal Progress report types verified.");

    // Clean up test data
    await Transaction.deleteMany({ userId: { $in: [userA, userB] } });
    await Budget.deleteMany({ userId: { $in: [userA, userB] } });
    await Goal.deleteMany({ userId: { $in: [userA, userB] } });

    console.log("==================================================");
    console.log("🎉 ALL 7 FINANCIAL REPORTS TESTS PASSED!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test Suite Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
