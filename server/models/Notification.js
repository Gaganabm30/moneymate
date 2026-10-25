const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "Notification",
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      default: "info",
      enum: ["info", "success", "warning", "reminder", "overdue", "alert"],
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    entityType: {
      type: String,
      default: "", // e.g. "recurring", "bill", "transaction"
    },

    dueDate: {
      type: Date,
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reminders for the same occurrence and reminder type
notificationSchema.index({
  userId: 1,
  entityId: 1,
  dueDate: 1,
  type: 1,
});

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

module.exports = Notification;