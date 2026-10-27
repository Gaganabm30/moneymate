const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getForecast,
  getForecastScenarios,
} = require("../controllers/forecastingController");

// All forecast routes are strictly protected
router.use(protect);

router.get("/", getForecast);
router.get("/scenarios", getForecastScenarios);

module.exports = router;
