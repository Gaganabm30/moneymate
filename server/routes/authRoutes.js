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

    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    paymentMethod: {
      type: String,

      enum: [
        "cash",
        "upi",
        "credit-card",
        "debit-card",
        "bank-transfer",
        "other",
      ],

      default: "upi",
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    recurring: {
      type: Boolean,
      default: false,
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

// Useful for fetching user's transactions ordered by date.
transactionSchema.index({
  userId: 1,
  date: -1,
});

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);