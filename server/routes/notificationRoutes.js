const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/mark-all-read", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
