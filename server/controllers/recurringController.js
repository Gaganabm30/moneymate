const mongoose = require("mongoose");
const RecurringPayment = require("../models/RecurringPayment");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const {
  getNextOccurrence,
  getBillStatus,
  processDueRecurringPayments,
  checkAndSendReminders,
  getRecurringOverview,
} = require("../services/recurringPaymentService");

// ============================================
// CREATE RECURRING PAYMENT
// POST /api/recurring
// ============================================
const createRecurringPayment = async (req, res) => {
  try {
    const {
      title,
      type,
      amount,
      category,
      frequency,
      startDate,
      nextDueDate,
      endDate,
      reminderDaysBefore,
      description,
      paymentMethod,
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!type || !["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Valid type (income or expense) is required",
      });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const validFrequencies = ["daily", "weekly", "monthly", "yearly"];
    if (!frequency || !validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: "Valid frequency (daily, weekly, monthly, yearly) is required",
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    let due = nextDueDate ? new Date(nextDueDate) : new Date(start);
    if (isNaN(due.getTime())) {
      due = new Date(start);
    }

    let end = null;
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date",
        });
      }
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: "End date cannot be earlier than start date",
        });
      }
    }

    const reminderDays =
      reminderDaysBefore !== undefined && reminderDaysBefore !== null
        ? Math.max(0, Math.min(30, Number(reminderDaysBefore) || 0))
        : 1;

    // Create schedule strictly using authenticated user's ID
    const schedule = await RecurringPayment.create({
      userId: req.user._id,
      title: title.trim(),
      type,
      amount: numericAmount,
      category: category.trim(),
      frequency,
      startDate: start,
      nextDueDate: due,
      endDate: end,
      reminderDaysBefore: reminderDays,
      description: description ? description.trim() : "",
      paymentMethod: paymentMethod || "upi",
      status: "active",
    });

    // Check if initial due date should trigger reminder or processing
    await checkAndSendReminders(new Date(), req.user._id);

    return res.status(201).json({
      success: true,
      message: "Recurring payment scheduled successfully",
      schedule,
    });
  } catch (error) {
    console.error("Create recurring payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create recurring payment",
    });
  }
};

// ============================================
// GET ALL RECURRING PAYMENTS & OVERVIEW
// GET /api/recurring
// ============================================
const getRecurringPayments = async (req, res) => {
  try {
    // Process due occurrences up to current time idempotently
    await processDueRecurringPayments(new Date(), req.user._id);
    await checkAndSendReminders(new Date(), req.user._id);

    const { type, status, search } = req.query;
    const query = { userId: req.user._id };

    if (type && ["income", "expense"].includes(type)) {
      query.type = type;
    }

    if (status && ["active", "paused", "completed"].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ];
    }

    const schedules = await RecurringPayment.find(query).sort({
      nextDueDate: 1,
      createdAt: -1,
    });

    const now = new Date();
    const enrichedSchedules = schedules.map((item) => {
      const doc = item.toObject();
      doc.billStatus = getBillStatus(item.nextDueDate, now);
      return doc;
    });

    const overview = await getRecurringOverview(req.user._id, now);

    return res.status(200).json({
      success: true,
      count: schedules.length,
      schedules: enrichedSchedules,
      overview,
    });
  } catch (error) {
    console.error("Get recurring payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recurring payments",
    });
  }
};

// ============================================
// GET UPCOMING BILLS (EXPENSES ONLY)
// GET /api/recurring/upcoming-bills
// ============================================
const getUpcomingBills = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const now = new Date();

    const bills = await RecurringPayment.find({
      userId: req.user._id,
      type: "expense",
      status: "active",
    })
      .sort({ nextDueDate: 1 })
      .limit(limit);

    const formattedBills = bills.map((b) => {
      const doc = b.toObject();
      doc.statusBadge = getBillStatus(b.nextDueDate, now);
      return doc;
    });

    return res.status(200).json({
      success: true,
      count: formattedBills.length,
      bills: formattedBills,
    });
  } catch (error) {
    console.error("Get upcoming bills error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming bills",
    });
  }
};

// ============================================
// GET RECURRING PAYMENT BY ID
// GET /api/recurring/:id
// ============================================
const getRecurringPaymentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const schedule = await RecurringPayment.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring payment not found",
      });
    }

    const doc = schedule.toObject();
    doc.billStatus = getBillStatus(schedule.nextDueDate, new Date());

    return res.status(200).json({
      success: true,
      schedule: doc,
    });
  } catch (error) {
    console.error("Get recurring payment by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recurring payment details",
    });
  }
};

// ============================================
// UPDATE RECURRING PAYMENT
// PUT /api/recurring/:id
// ============================================
const updateRecurringPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const schedule = await RecurringPayment.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring payment not found",
      });
    }

    const {
      title,
      type,
      amount,
      category,
      frequency,
      startDate,
      nextDueDate,
      endDate,
      reminderDaysBefore,
      description,
      paymentMethod,
      status,
    } = req.body;

    if (title !== undefined) schedule.title = title.trim();
    if (type !== undefined && ["income", "expense"].includes(type)) {
      schedule.type = type;
    }
    if (amount !== undefined) {
      const num = Number(amount);
      if (Number.isFinite(num) && num > 0) schedule.amount = num;
    }
    if (category !== undefined) schedule.category = category.trim();
    if (
      frequency !== undefined &&
      ["daily", "weekly", "monthly", "yearly"].includes(frequency)
    ) {
      schedule.frequency = frequency;
    }
    if (startDate !== undefined) schedule.startDate = new Date(startDate);
    if (nextDueDate !== undefined) schedule.nextDueDate = new Date(nextDueDate);
    if (endDate !== undefined) {
      schedule.endDate = endDate ? new Date(endDate) : null;
    }
    if (reminderDaysBefore !== undefined) {
      schedule.reminderDaysBefore = Math.max(
        0,
        Math.min(30, Number(reminderDaysBefore) || 0)
      );
    }
    if (description !== undefined) schedule.description = description.trim();
    if (paymentMethod !== undefined) schedule.paymentMethod = paymentMethod;
    if (status !== undefined && ["active", "paused", "completed"].includes(status)) {
      schedule.status = status;
    }

    await schedule.save();

    return res.status(200).json({
      success: true,
      message: "Recurring payment updated successfully",
      schedule,
    });
  } catch (error) {
    console.error("Update recurring payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update recurring payment",
    });
  }
};

// ============================================
// PAUSE RECURRING PAYMENT
// PATCH /api/recurring/:id/pause
// ============================================
const pauseRecurringPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const schedule = await RecurringPayment.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      { status: "paused" },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recurring payment paused successfully",
      schedule,
    });
  } catch (error) {
    console.error("Pause recurring payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to pause recurring payment",
    });
  }
};

// ============================================
// RESUME RECURRING PAYMENT
// PATCH /api/recurring/:id/resume
// ============================================
const resumeRecurringPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const schedule = await RecurringPayment.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      { status: "active" },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recurring payment resumed successfully",
      schedule,
    });
  } catch (error) {
    console.error("Resume recurring payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resume recurring payment",
    });
  }
};

// ============================================
// MARK BILL AS PAID
// POST /api/recurring/:id/pay
// ============================================
const markBillPaid = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const schedule = await RecurringPayment.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring payment schedule not found",
      });
    }

    const currentDue = new Date(schedule.nextDueDate);

    // Idempotency: verify if this occurrence was already recorded
    let transaction = await Transaction.findOne({
      recurringPaymentId: schedule._id,
      occurrenceDate: currentDue,
    });

    if (!transaction) {
      transaction = await Transaction.create({
        userId: req.user._id,
        type: schedule.type,
        amount: schedule.amount,
        category: schedule.category,
        title: schedule.title,
        description:
          req.body.description ||
          schedule.description ||
          `Bill payment: ${schedule.title}`,
        paymentMethod:
          req.body.paymentMethod || schedule.paymentMethod || "upi",
        date: req.body.paidDate ? new Date(req.body.paidDate) : new Date(),
        recurring: true,
        recurringPaymentId: schedule._id,
        occurrenceDate: currentDue,
      });
    }

    // Advance next due date to next occurrence
    const nextDue = getNextOccurrence(currentDue, schedule.frequency);
    schedule.lastProcessedDate = new Date();
    schedule.lastProcessedOccurrence = currentDue;
    schedule.nextDueDate = nextDue;

    if (schedule.endDate && nextDue > new Date(schedule.endDate)) {
      schedule.status = "completed";
    }

    await schedule.save();

    // Create in-app notification confirming bill payment
    await Notification.create({
      userId: req.user._id,
      title: "Bill Marked as Paid",
      message: `"${schedule.title}" (₹${schedule.amount.toLocaleString(
        "en-IN"
      )}) has been recorded in your transactions.`,
      type: "success",
      entityId: schedule._id,
      entityType: "bill",
      dueDate: currentDue,
    });

    return res.status(200).json({
      success: true,
      message: "Bill successfully marked as paid and transaction recorded",
      transaction,
      schedule,
    });
  } catch (error) {
    console.error("Mark bill paid error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark bill as paid",
    });
  }
};

// ============================================
// DELETE RECURRING PAYMENT
// DELETE /api/recurring/:id
// Note: Does NOT delete historical transactions
// ============================================
const deleteRecurringPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const schedule = await RecurringPayment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Recurring payment schedule deleted successfully (recorded transactions preserved)",
    });
  } catch (error) {
    console.error("Delete recurring payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete recurring payment",
    });
  }
};

// ============================================
// MANUAL PROCESS DUE TRIGGER
// POST /api/recurring/process-due
// ============================================
const triggerProcessDue = async (req, res) => {
  try {
    const processed = await processDueRecurringPayments(
      new Date(),
      req.user._id
    );
    await checkAndSendReminders(new Date(), req.user._id);

    return res.status(200).json({
      success: true,
      message: `Processed ${processed.length} due recurring payment(s)`,
      processed,
    });
  } catch (error) {
    console.error("Trigger process due error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process due recurring payments",
    });
  }
};

module.exports = {
  createRecurringPayment,
  getRecurringPayments,
  getUpcomingBills,
  getRecurringPaymentById,
  updateRecurringPayment,
  pauseRecurringPayment,
  resumeRecurringPayment,
  markBillPaid,
  deleteRecurringPayment,
  triggerProcessDue,
};
