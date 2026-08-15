const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  simulateGoal,
} = require("../controllers/goalController");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getGoals)
  .post(createGoal);

router
  .route("/:id")
  .put(updateGoal)
  .delete(deleteGoal);

router.post("/:id/simulate", simulateGoal);

module.exports = router;