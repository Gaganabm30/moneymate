const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

const router = express.Router();

router.use(protect);

router.route("/").get(getBudgets).post(createBudget);

router.route("/:id").put(updateBudget).delete(deleteBudget);

module.exports = router;
