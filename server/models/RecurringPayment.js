const mongoose = require("mongoose");

const recurringPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    type: {
      type: String,
      required: [true, "Type is required"],
      enum: ["income", "expense"],
      default: "expense",
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    frequency: {
      type: String,
      required: [true, "Frequency is required"],
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: "monthly",
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },

    nextDueDate: {
      type: Date,
      required: [true, "Next due date is required"],
      index: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
      index: true,
    },

    reminderDaysBefore: {
      type: Number,
      default: 1, // 0 = on due date, 1 = 1 day before, etc.
      min: 0,
      max: 30,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    paymentMethod: {
      type: String,
      lowercase: true,
      trim: true,
      default: "upi",
      enum: [
        "cash",
        "upi",
        "credit-card",
        "debit-card",
        "bank-transfer",
        "other",
      ],
      set: (v) => {
        if (!v) return "upi";
        const s = String(v).toLowerCase().trim().replace(/\s+/g, "-");
        if (s === "card") return "credit-card";
        if (s === "bank") return "bank-transfer";
        if (["cash", "upi", "credit-card", "debit-card", "bank-transfer", "other"].includes(s)) return s;
        return "other";
      },
    },

    autoGenerate: {
      type: Boolean,
      default: true,
    },

    lastProcessedDate: {
      type: Date,
      default: null,
    },

    lastProcessedOccurrence: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

recurringPaymentSchema.index({ userId: 1, nextDueDate: 1, status: 1 });
recurringPaymentSchema.index({ userId: 1, type: 1, status: 1 });

const RecurringPayment =
  mongoose.models.RecurringPayment ||
  mongoose.model("RecurringPayment", recurringPaymentSchema);

module.exports = RecurringPayment;
