const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Support both "name" (old) and "title" (frontend) — stored as "title"
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "Savings",
      trim: true,
    },

    // The amount the user wants to save
    target: {
      type: Number,
      required: true,
      min: 1,
    },

    // How much has been saved so far
    saved: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Target completion date
    deadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Goal", goalSchema);