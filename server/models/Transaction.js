const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["income", "expense"],
    },

    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than zero"],
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
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

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    recurring: {
      type: Boolean,
      default: false,
    },

    recurringPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringPayment",
      default: null,
      index: true,
    },

    occurrenceDate: {
      type: Date,
      default: null,
    },

    merchant: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Helps fetch each user's transactions efficiently
transactionSchema.index({
  userId: 1,
  date: -1,
});

// Helps query occurrences from recurring schedules idempotently
transactionSchema.index({
  recurringPaymentId: 1,
  occurrenceDate: 1,
});

// IMPORTANT:
// Prevent OverwriteModelError if model was already compiled.
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;