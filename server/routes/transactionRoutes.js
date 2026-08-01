const express = require("express");

const protect = require(
  "../middleware/authMiddleware"
);

const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require(
  "../controllers/transactionController"
);

const router = express.Router();

// Every transaction route requires authentication.
router.use(protect);

router
  .route("/")
  .get(getTransactions)
  .post(createTransaction);

router
  .route("/:id")
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;