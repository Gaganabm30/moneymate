const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createBudget,
  getBudgets,
  deleteBudget,
} = require("../controllers/budgetController");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getBudgets)
  .post(createBudget);

router
  .route("/:id")
  .delete(deleteBudget);

module.exports = router;
