const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/recurringController");

const router = express.Router();

// All recurring routes require authentication
router.use(protect);

router
  .route("/")
  .get(getRecurringPayments)
  .post(createRecurringPayment);

router.get("/upcoming-bills", getUpcomingBills);
router.post("/process-due", triggerProcessDue);

router
  .route("/:id")
  .get(getRecurringPaymentById)
  .put(updateRecurringPayment)
  .delete(deleteRecurringPayment);

router.patch("/:id/pause", pauseRecurringPayment);
router.patch("/:id/resume", resumeRecurringPayment);
router.post("/:id/pay", markBillPaid);

module.exports = router;
