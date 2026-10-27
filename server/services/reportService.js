const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const User = require("../models/User");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeNum = (n, fallback = 0) => (Number.isFinite(Number(n)) ? Number(n) : fallback);

function formatCurrency(n) {
  const num = Math.round(safeNum(n));
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseDateRange(preset, startStr, endStr) {
  const now = new Date();
  let start;
  let end;

  switch (preset) {
    case "last-month": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case "last-3-months": {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case "last-6-months": {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case "this-year": {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    }
    case "custom": {
      start = startStr ? new Date(`${startStr}T00:00:00.000`) : new Date(now.getFullYear(), now.getMonth(), 1);
      end = endStr ? new Date(`${endStr}T23:59:59.999`) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case "this-month":
    default: {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
  }

  // Sanity check: if start > end, swap them
  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  return { start, end };
}

/**
 * Escape a string for safe CSV output:
 * - Quotes wrapped around strings containing comma, quote, or newline
 * - Double quotes escaped as ""
 * - Prepend formula injection triggers (=, +, -, @, \t, \r) with a single quote '
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return "";
  let str = String(val);

  // Prevent CSV / Excel formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

class ReportService {
  /**
   * Fetch and calculate full financial report data
   */
  async getReportData(userId, options = {}) {
    const {
      reportType = "transaction-statement",
      preset = "this-month",
      startDate,
      endDate,
      typeFilter = "all", // "all" | "income" | "expense"
      category = "all",
    } = options;

    const { start, end } = parseDateRange(preset, startDate, endDate);

    // Build query for Transactions
    const txQuery = {
      userId,
      date: { $gte: start, $lte: end },
    };

    if (typeFilter && typeFilter !== "all") {
      txQuery.type = typeFilter;
    }

    if (category && category !== "all") {
      txQuery.category = category;
    }

    const [transactions, budgets, goals, user] = await Promise.all([
      Transaction.find(txQuery).sort({ date: -1 }).lean(),
      Budget.find({ userId }).lean(),
      Goal.find({ userId }).lean(),
      User.findById(userId).lean(),
    ]);

    // Financial Metrics
    let totalIncome = 0;
    let totalExpenses = 0;
    let largestTransaction = null;

    const categoryMap = {};
    const monthlyMap = {};

    transactions.forEach((tx) => {
      const amt = safeNum(tx.amount);
      if (tx.type === "income") {
        totalIncome += amt;
      } else if (tx.type === "expense") {
        totalExpenses += amt;
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + amt;
      }

      // Check largest transaction
      if (!largestTransaction || amt > largestTransaction.amount) {
        largestTransaction = {
          title: tx.title || "Untitled",
          amount: amt,
          type: tx.type,
          category: tx.category,
          date: formatDate(tx.date),
        };
      }

      // Month-by-month cashflow
      const txDate = new Date(tx.date);
      const mKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = {
          monthKey: mKey,
          label: txDate.toLocaleString("en-IN", { month: "short", year: "numeric" }),
          income: 0,
          expenses: 0,
          count: 0,
        };
      }
      if (tx.type === "income") {
        monthlyMap[mKey].income += amt;
      } else if (tx.type === "expense") {
        monthlyMap[mKey].expenses += amt;
      }
      monthlyMap[mKey].count += 1;
    });

    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100 * 10) / 10 : 0;

    // Highest spending category
    let highestCategory = null;
    let maxCatSpend = 0;
    Object.entries(categoryMap).forEach(([cat, spend]) => {
      if (spend > maxCatSpend) {
        maxCatSpend = spend;
        highestCategory = { name: cat, amount: spend };
      }
    });

    // Category breakdown list
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, amount]) => ({
        category: name,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100 * 10) / 10 : 0,
        count: transactions.filter((t) => t.category === name && t.type === "expense").length,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly summary list sorted chronologically
    const monthlySummary = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((m) => ({
        ...m,
        net: m.income - m.expenses,
        savingsRate: m.income > 0 ? Math.round(((m.income - m.expenses) / m.income) * 100 * 10) / 10 : 0,
      }));

    // Budget performance report items
    const budgetPerformance = budgets.map((b) => {
      // Find actual expenses in this category and month/year
      const spent = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.type === "expense" &&
            t.category === b.category &&
            tDate.getMonth() + 1 === b.month &&
            tDate.getFullYear() === b.year
          );
        })
        .reduce((sum, t) => sum + safeNum(t.amount), 0);

      const variance = b.limit - spent;
      const usagePct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      const status = spent > b.limit ? "Exceeded" : spent === b.limit ? "At Limit" : "Within Budget";

      return {
        id: b._id,
        category: b.category,
        month: b.month,
        year: b.year,
        limit: b.limit,
        spent,
        variance,
        usagePct,
        status,
      };
    });

    // Savings goal progress report items
    const goalsProgress = goals.map((g) => {
      const target = safeNum(g.target);
      const saved = safeNum(g.saved);
      const remaining = Math.max(0, target - saved);
      const progressPct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
      return {
        id: g._id,
        title: g.title,
        category: g.category || "Savings",
        target,
        saved,
        remaining,
        progressPct,
        deadline: g.deadline ? formatDate(g.deadline) : "No Deadline",
        status: saved >= target ? "Completed" : "In Progress",
      };
    });

    return {
      metadata: {
        reportType,
        preset,
        startDate: formatDate(start),
        endDate: formatDate(end),
        typeFilter,
        category,
        generatedAt: new Date().toISOString(),
        userName: user?.name || "MoneyMate User",
        userEmail: user?.email || "",
        currency: user?.currency || "INR",
      },
      summary: {
        totalIncome: Math.round(totalIncome),
        totalExpenses: Math.round(totalExpenses),
        netCashFlow: Math.round(netCashFlow),
        savingsRate,
        transactionCount: transactions.length,
        highestCategory: highestCategory || { name: "N/A", amount: 0 },
        largestTransaction: largestTransaction || { title: "N/A", amount: 0 },
      },
      transactions: transactions.map((t) => ({
        id: t._id,
        date: formatDate(t.date),
        displayDate: formatDisplayDate(t.date),
        title: t.title || "Untitled",
        type: t.type,
        category: t.category,
        amount: safeNum(t.amount),
        paymentMethod: t.paymentMethod || "UPI",
        description: t.description || t.notes || "",
      })),
      categoryBreakdown,
      monthlySummary,
      budgetPerformance,
      goalsProgress,
    };
  }

  /**
   * Generate genuine CSV format string
   */
  async generateCSV(userId, options = {}) {
    const data = await this.getReportData(userId, options);
    const { reportType } = data.metadata;
    const lines = [];

    // UTF-8 BOM so Excel opens Indian Rupee symbol & unicode flawlessly
    lines.push("\uFEFF# MoneyMate Financial Report");
    lines.push(`# Report Type: ${escapeCSV(reportType)}`);
    lines.push(`# Period: ${escapeCSV(data.metadata.startDate)} to ${escapeCSV(data.metadata.endDate)}`);
    lines.push(`# Generated For: ${escapeCSV(data.metadata.userName)} on ${escapeCSV(formatDisplayDate(new Date()))}`);
    lines.push("");

    // Summary Section in CSV
    lines.push("--- FINANCIAL SUMMARY ---");
    lines.push("Metric,Value");
    lines.push(`Total Recorded Income,₹${data.summary.totalIncome}`);
    lines.push(`Total Recorded Expenses,₹${data.summary.totalExpenses}`);
    lines.push(`Net Cash Flow,₹${data.summary.netCashFlow}`);
    lines.push(`Savings Rate,${data.summary.savingsRate}%`);
    lines.push(`Transaction Count,${data.summary.transactionCount}`);
    lines.push(`Highest-Spending Category,${escapeCSV(data.summary.highestCategory.name)} (₹${data.summary.highestCategory.amount})`);
    lines.push("");

    // Table Content based on Report Type
    if (reportType === "monthly-summary") {
      lines.push("--- MONTHLY CASHFLOW SUMMARY ---");
      lines.push("Month,Income (₹),Expenses (₹),Net Cash Flow (₹),Savings Rate (%),Transactions");
      data.monthlySummary.forEach((m) => {
        lines.push(
          [
            escapeCSV(m.label),
            m.income,
            m.expenses,
            m.net,
            `${m.savingsRate}%`,
            m.count,
          ].join(",")
        );
      });
    } else if (reportType === "expense-analysis") {
      lines.push("--- CATEGORY EXPENSE ANALYSIS ---");
      lines.push("Category,Total Spent (₹),Percentage (%),Transactions Count");
      data.categoryBreakdown.forEach((c) => {
        lines.push(
          [
            escapeCSV(c.category),
            c.amount,
            `${c.percentage}%`,
            c.count,
          ].join(",")
        );
      });
    } else if (reportType === "budget-performance") {
      lines.push("--- BUDGET PERFORMANCE ---");
      lines.push("Category,Month/Year,Budget Limit (₹),Actual Spent (₹),Variance (₹),Utilization (%),Status");
      data.budgetPerformance.forEach((b) => {
        lines.push(
          [
            escapeCSV(b.category),
            `${b.month}/${b.year}`,
            b.limit,
            b.spent,
            b.variance,
            `${b.usagePct}%`,
            escapeCSV(b.status),
          ].join(",")
        );
      });
    } else if (reportType === "savings-goal-progress") {
      lines.push("--- SAVINGS GOAL PROGRESS ---");
      lines.push("Goal Title,Category,Target Amount (₹),Saved (₹),Remaining (₹),Progress (%),Deadline,Status");
      data.goalsProgress.forEach((g) => {
        lines.push(
          [
            escapeCSV(g.title),
            escapeCSV(g.category),
            g.target,
            g.saved,
            g.remaining,
            `${g.progressPct}%`,
            escapeCSV(g.deadline),
            escapeCSV(g.status),
          ].join(",")
        );
      });
    } else {
      // Default: Transaction statement
      lines.push("--- TRANSACTION RECORDS ---");
      lines.push("Date,Title,Type,Category,Amount (₹),Payment Method,Description");
      data.transactions.forEach((t) => {
        lines.push(
          [
            escapeCSV(t.date),
            escapeCSV(t.title),
            escapeCSV(t.type.toUpperCase()),
            escapeCSV(t.category),
            t.amount,
            escapeCSV(t.paymentMethod),
            escapeCSV(t.description),
          ].join(",")
        );
      });
    }

    return lines.join("\n");
  }

  /**
   * Generate genuine Excel (.xlsx) workbook buffer using ExcelJS
   */
  async generateExcel(userId, options = {}) {
    const data = await this.getReportData(userId, options);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MoneyMate AI";
    workbook.created = new Date();

    // ─── Sheet 1: Summary Sheet ───
    const summarySheet = workbook.addWorksheet("Overview & Summary", {
      views: [{ showGridLines: true }],
    });

    // Brand Title
    summarySheet.mergeCells("A1:E1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = "MONEYMATE FINANCIAL REPORT";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF635BFF" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    summarySheet.getRow(1).height = 36;

    // Report Details
    summarySheet.addRow([]);
    summarySheet.addRow(["Report Type:", data.metadata.reportType.replace(/-/g, " ").toUpperCase()]);
    summarySheet.addRow(["Reporting Period:", `${data.metadata.startDate} to ${data.metadata.endDate}`]);
    summarySheet.addRow(["Prepared For:", data.metadata.userName]);
    summarySheet.addRow(["Generated At:", formatDisplayDate(new Date())]);
    summarySheet.addRow([]);

    // KPI Summary Header
    summarySheet.addRow(["EXECUTIVE CASH FLOW SUMMARY"]);
    const kpiHeadRow = summarySheet.lastRow;
    kpiHeadRow.font = { bold: true, size: 12, color: { argb: "FF1E293B" } };

    summarySheet.addRow(["Metric", "Amount (₹)", "Notes"]);
    const kpiColRow = summarySheet.lastRow;
    kpiColRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    kpiColRow.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
    });

    summarySheet.addRow(["Total Recorded Income", data.summary.totalIncome, "Inflows within date range"]);
    summarySheet.addRow(["Total Recorded Expenses", data.summary.totalExpenses, "Outflows within date range"]);
    summarySheet.addRow(["Net Cash Flow", data.summary.netCashFlow, "Total Income minus Expenses"]);
    summarySheet.addRow(["Savings Rate", `${data.summary.savingsRate}%`, "Percentage of income saved"]);
    summarySheet.addRow(["Transactions Count", data.summary.transactionCount, "Total transactions processed"]);
    summarySheet.addRow(["Highest Spending Category", data.summary.highestCategory.amount, data.summary.highestCategory.name]);

    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 20;
    summarySheet.getColumn(3).width = 35;

    // Number format for column 2
    for (let r = 9; r <= 14; r++) {
      if (r !== 12 && r !== 13) {
        summarySheet.getCell(`B${r}`).numFmt = '"₹"#,##0.00';
      }
    }

    // ─── Sheet 2: Data Records Sheet ───
    const dataSheet = workbook.addWorksheet("Report Records", {
      views: [{ showGridLines: true }],
    });

    if (data.metadata.reportType === "monthly-summary") {
      dataSheet.columns = [
        { header: "Month", key: "month", width: 20 },
        { header: "Income (₹)", key: "income", width: 18 },
        { header: "Expenses (₹)", key: "expenses", width: 18 },
        { header: "Net Cash Flow (₹)", key: "net", width: 18 },
        { header: "Savings Rate (%)", key: "savingsRate", width: 18 },
        { header: "Transactions Count", key: "count", width: 18 },
      ];

      data.monthlySummary.forEach((m) => {
        dataSheet.addRow({
          month: m.label,
          income: m.income,
          expenses: m.expenses,
          net: m.net,
          savingsRate: `${m.savingsRate}%`,
          count: m.count,
        });
      });
    } else if (data.metadata.reportType === "expense-analysis") {
      dataSheet.columns = [
        { header: "Category", key: "category", width: 25 },
        { header: "Total Spent (₹)", key: "amount", width: 20 },
        { header: "Share of Total (%)", key: "percentage", width: 20 },
        { header: "Transaction Count", key: "count", width: 18 },
      ];

      data.categoryBreakdown.forEach((c) => {
        dataSheet.addRow({
          category: c.category,
          amount: c.amount,
          percentage: `${c.percentage}%`,
          count: c.count,
        });
      });
    } else if (data.metadata.reportType === "budget-performance") {
      dataSheet.columns = [
        { header: "Category", key: "category", width: 22 },
        { header: "Period", key: "period", width: 16 },
        { header: "Budget Limit (₹)", key: "limit", width: 18 },
        { header: "Actual Spent (₹)", key: "spent", width: 18 },
        { header: "Variance (₹)", key: "variance", width: 18 },
        { header: "Utilization (%)", key: "usage", width: 16 },
        { header: "Status", key: "status", width: 18 },
      ];

      data.budgetPerformance.forEach((b) => {
        dataSheet.addRow({
          category: b.category,
          period: `${b.month}/${b.year}`,
          limit: b.limit,
          spent: b.spent,
          variance: b.variance,
          usage: `${b.usagePct}%`,
          status: b.status,
        });
      });
    } else if (data.metadata.reportType === "savings-goal-progress") {
      dataSheet.columns = [
        { header: "Goal Title", key: "title", width: 26 },
        { header: "Category", key: "category", width: 18 },
        { header: "Target (₹)", key: "target", width: 18 },
        { header: "Saved (₹)", key: "saved", width: 18 },
        { header: "Remaining (₹)", key: "remaining", width: 18 },
        { header: "Progress (%)", key: "progress", width: 16 },
        { header: "Target Deadline", key: "deadline", width: 18 },
        { header: "Status", key: "status", width: 16 },
      ];

      data.goalsProgress.forEach((g) => {
        dataSheet.addRow({
          title: g.title,
          category: g.category,
          target: g.target,
          saved: g.saved,
          remaining: g.remaining,
          progress: `${g.progressPct}%`,
          deadline: g.deadline,
          status: g.status,
        });
      });
    } else {
      // Default: Transaction statement
      dataSheet.columns = [
        { header: "Date", key: "date", width: 14 },
        { header: "Title", key: "title", width: 28 },
        { header: "Type", key: "type", width: 14 },
        { header: "Category", key: "category", width: 20 },
        { header: "Amount (₹)", key: "amount", width: 16 },
        { header: "Payment Method", key: "paymentMethod", width: 18 },
        { header: "Description / Notes", key: "description", width: 32 },
      ];

      data.transactions.forEach((t) => {
        dataSheet.addRow({
          date: t.date,
          title: t.title,
          type: t.type.toUpperCase(),
          category: t.category,
          amount: t.amount,
          paymentMethod: t.paymentMethod.toUpperCase(),
          description: t.description,
        });
      });
    }

    // Style table headers
    const headerRow = dataSheet.getRow(1);
    headerRow.height = 26;
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF635BFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Generate genuine PDF document stream using PDFKit
   */
  async generatePDF(userId, options = {}) {
    const data = await this.getReportData(userId, options);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: "A4",
          bufferPages: true,
        });

        const buffers = [];
        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // ─── Header Banner ───
        doc
          .rect(0, 0, doc.page.width, 70)
          .fill("#635bff");

        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .fillColor("#ffffff")
          .text("MoneyMate", 40, 20);

        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#e0e7ff")
          .text("FINANCIAL INTELLIGENCE REPORT", 40, 44);

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#ffffff")
          .text(`Generated: ${formatDisplayDate(new Date())}`, doc.page.width - 200, 24, { width: 160, align: "right" })
          .text(`User: ${data.metadata.userName}`, doc.page.width - 200, 38, { width: 160, align: "right" });

        doc.moveDown(3);
        doc.fillColor("#0f172a");

        // ─── Report Title & Period ───
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(data.metadata.reportType.replace(/-/g, " ").toUpperCase(), 40, 90);

        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#64748b")
          .text(`Reporting Period: ${data.metadata.startDate} to ${data.metadata.endDate} (${data.metadata.preset})`, 40, 112);

        // ─── KPI Summary Cards Block ───
        const cardY = 135;
        const cardWidth = 120;
        const cardHeight = 54;
        const gap = 12;

        const kpis = [
          { label: "Total Income", val: formatCurrency(data.summary.totalIncome), color: "#10b981" },
          { label: "Total Expenses", val: formatCurrency(data.summary.totalExpenses), color: "#ef4444" },
          { label: "Net Cash Flow", val: formatCurrency(data.summary.netCashFlow), color: data.summary.netCashFlow >= 0 ? "#10b981" : "#ef4444" },
          { label: "Savings Rate", val: `${data.summary.savingsRate}%`, color: "#635bff" },
        ];

        kpis.forEach((kpi, idx) => {
          const x = 40 + idx * (cardWidth + gap);
          doc
            .roundedRect(x, cardY, cardWidth, cardHeight, 6)
            .fillAndStroke("#f8fafc", "#e2e8f0");

          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#64748b")
            .text(kpi.label.toUpperCase(), x + 8, cardY + 10);

          doc
            .fontSize(13)
            .font("Helvetica-Bold")
            .fillColor(kpi.color)
            .text(kpi.val, x + 8, cardY + 26);
        });

        // ─── Table Rendering ───
        let currentY = 210;

        const drawTableHeader = (headers) => {
          doc
            .rect(40, currentY, doc.page.width - 80, 22)
            .fill("#f1f5f9");

          doc.fontSize(8).font("Helvetica-Bold").fillColor("#334155");

          headers.forEach((h) => {
            doc.text(h.label, h.x, currentY + 6, { width: h.width, align: h.align || "left" });
          });

          currentY += 24;
        };

        const checkPageBreak = (neededHeight = 24) => {
          if (currentY + neededHeight > doc.page.height - 50) {
            doc.addPage();
            currentY = 40;
            return true;
          }
          return false;
        };

        if (data.metadata.reportType === "monthly-summary") {
          doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("Monthly Cash Flow Breakdown", 40, currentY);
          currentY += 18;

          const headers = [
            { label: "MONTH", x: 45, width: 90 },
            { label: "INCOME", x: 140, width: 90, align: "right" },
            { label: "EXPENSES", x: 235, width: 90, align: "right" },
            { label: "NET FLOW", x: 330, width: 90, align: "right" },
            { label: "SAVINGS %", x: 425, width: 60, align: "right" },
            { label: "TXNS", x: 490, width: 40, align: "right" },
          ];

          drawTableHeader(headers);

          data.monthlySummary.forEach((m, idx) => {
            checkPageBreak();
            if (idx % 2 === 1) {
              doc.rect(40, currentY, doc.page.width - 80, 18).fill("#f8fafc");
            }
            doc.fontSize(8).font("Helvetica").fillColor("#0f172a");
            doc.text(m.label, 45, currentY + 4, { width: 90 });
            doc.fillColor("#10b981").text(formatCurrency(m.income), 140, currentY + 4, { width: 90, align: "right" });
            doc.fillColor("#ef4444").text(formatCurrency(m.expenses), 235, currentY + 4, { width: 90, align: "right" });
            doc.fillColor(m.net >= 0 ? "#10b981" : "#ef4444").text(formatCurrency(m.net), 330, currentY + 4, { width: 90, align: "right" });
            doc.fillColor("#0f172a").text(`${m.savingsRate}%`, 425, currentY + 4, { width: 60, align: "right" });
            doc.text(String(m.count), 490, currentY + 4, { width: 40, align: "right" });
            currentY += 18;
          });
        } else if (data.metadata.reportType === "expense-analysis") {
          doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("Category-Wise Expense Analysis", 40, currentY);
          currentY += 18;

          const headers = [
            { label: "CATEGORY", x: 45, width: 180 },
            { label: "AMOUNT SPENT", x: 230, width: 110, align: "right" },
            { label: "SHARE OF EXPENSES", x: 345, width: 110, align: "right" },
            { label: "TXN COUNT", x: 460, width: 70, align: "right" },
          ];

          drawTableHeader(headers);

          data.categoryBreakdown.forEach((c, idx) => {
            checkPageBreak();
            if (idx % 2 === 1) {
              doc.rect(40, currentY, doc.page.width - 80, 18).fill("#f8fafc");
            }
            doc.fontSize(8).font("Helvetica").fillColor("#0f172a");
            doc.text(c.category, 45, currentY + 4, { width: 180 });
            doc.fillColor("#ef4444").text(formatCurrency(c.amount), 230, currentY + 4, { width: 110, align: "right" });
            doc.fillColor("#0f172a").text(`${c.percentage}%`, 345, currentY + 4, { width: 110, align: "right" });
            doc.text(String(c.count), 460, currentY + 4, { width: 70, align: "right" });
            currentY += 18;
          });
        } else if (data.metadata.reportType === "budget-performance") {
          doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("Budget Utilization & Variance", 40, currentY);
          currentY += 18;

          const headers = [
            { label: "CATEGORY", x: 45, width: 130 },
            { label: "LIMIT", x: 180, width: 75, align: "right" },
            { label: "SPENT", x: 260, width: 75, align: "right" },
            { label: "VARIANCE", x: 340, width: 75, align: "right" },
            { label: "UTILIZATION", x: 420, width: 60, align: "right" },
            { label: "STATUS", x: 485, width: 60, align: "center" },
          ];

          drawTableHeader(headers);

          data.budgetPerformance.forEach((b, idx) => {
            checkPageBreak();
            if (idx % 2 === 1) {
              doc.rect(40, currentY, doc.page.width - 80, 18).fill("#f8fafc");
            }
            doc.fontSize(8).font("Helvetica").fillColor("#0f172a");
            doc.text(b.category, 45, currentY + 4, { width: 130 });
            doc.text(formatCurrency(b.limit), 180, currentY + 4, { width: 75, align: "right" });
            doc.text(formatCurrency(b.spent), 260, currentY + 4, { width: 75, align: "right" });
            doc.fillColor(b.variance >= 0 ? "#10b981" : "#ef4444").text(formatCurrency(b.variance), 340, currentY + 4, { width: 75, align: "right" });
            doc.fillColor("#0f172a").text(`${b.usagePct}%`, 420, currentY + 4, { width: 60, align: "right" });
            doc.fillColor(b.status === "Exceeded" ? "#ef4444" : "#10b981").text(b.status, 485, currentY + 4, { width: 60, align: "center" });
            currentY += 18;
          });
        } else if (data.metadata.reportType === "savings-goal-progress") {
          doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("Savings Goals Progress", 40, currentY);
          currentY += 18;

          const headers = [
            { label: "GOAL TITLE", x: 45, width: 150 },
            { label: "TARGET", x: 200, width: 80, align: "right" },
            { label: "SAVED", x: 285, width: 80, align: "right" },
            { label: "REMAINING", x: 370, width: 80, align: "right" },
            { label: "PROGRESS", x: 455, width: 50, align: "right" },
            { label: "STATUS", x: 510, width: 45, align: "center" },
          ];

          drawTableHeader(headers);

          data.goalsProgress.forEach((g, idx) => {
            checkPageBreak();
            if (idx % 2 === 1) {
              doc.rect(40, currentY, doc.page.width - 80, 18).fill("#f8fafc");
            }
            doc.fontSize(8).font("Helvetica").fillColor("#0f172a");
            doc.text(g.title, 45, currentY + 4, { width: 150 });
            doc.text(formatCurrency(g.target), 200, currentY + 4, { width: 80, align: "right" });
            doc.text(formatCurrency(g.saved), 285, currentY + 4, { width: 80, align: "right" });
            doc.text(formatCurrency(g.remaining), 370, currentY + 4, { width: 80, align: "right" });
            doc.text(`${g.progressPct}%`, 455, currentY + 4, { width: 50, align: "right" });
            doc.fillColor(g.status === "Completed" ? "#10b981" : "#635bff").text(g.status, 510, currentY + 4, { width: 45, align: "center" });
            currentY += 18;
          });
        } else {
          // Default: Transaction statement
          doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("Itemized Transaction Records", 40, currentY);
          currentY += 18;

          const headers = [
            { label: "DATE", x: 45, width: 65 },
            { label: "TITLE", x: 115, width: 150 },
            { label: "CATEGORY", x: 270, width: 100 },
            { label: "METHOD", x: 375, width: 60 },
            { label: "TYPE", x: 440, width: 45, align: "center" },
            { label: "AMOUNT", x: 490, width: 65, align: "right" },
          ];

          drawTableHeader(headers);

          data.transactions.forEach((t, idx) => {
            if (checkPageBreak(18)) {
              drawTableHeader(headers);
            }
            if (idx % 2 === 1) {
              doc.rect(40, currentY, doc.page.width - 80, 18).fill("#f8fafc");
            }
            doc.fontSize(8).font("Helvetica").fillColor("#0f172a");
            doc.text(t.date, 45, currentY + 4, { width: 65 });
            doc.text(t.title, 115, currentY + 4, { width: 150, ellipsis: true });
            doc.text(t.category, 270, currentY + 4, { width: 100, ellipsis: true });
            doc.text(t.paymentMethod.toUpperCase(), 375, currentY + 4, { width: 60 });
            doc.fillColor(t.type === "income" ? "#10b981" : "#ef4444").text(t.type.toUpperCase(), 440, currentY + 4, { width: 45, align: "center" });
            doc.fillColor(t.type === "income" ? "#10b981" : "#ef4444").text(formatCurrency(t.amount), 490, currentY + 4, { width: 65, align: "right" });
            currentY += 18;
          });
        }

        // ─── Footer on all pages ───
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor("#94a3b8")
            .text(
              `MoneyMate AI Financial Report • Confidential • Page ${i + 1} of ${range.count}`,
              40,
              doc.page.height - 30,
              { align: "center", width: doc.page.width - 80 }
            );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new ReportService();
