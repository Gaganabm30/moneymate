const forecastingService = require("../services/forecastingService");

/**
 * @route   GET /api/forecast
 * @desc    Get financial forecast including overview, chart timeline, warnings, and goal estimates
 * @access  Private (Authenticated user only)
 */
const getForecast = async (req, res) => {
  try {
    const { days, scenario, threshold } = req.query;

    const parsedDays = [30, 60, 90].includes(Number(days)) ? Number(days) : 30;
    const parsedScenario = ["conservative", "expected", "higher-spending"].includes(scenario)
      ? scenario
      : "expected";
    const parsedThreshold = !isNaN(Number(threshold)) && Number(threshold) >= 0 ? Number(threshold) : 5000;

    const forecastData = await forecastingService.generateForecast(req.user._id, {
      days: parsedDays,
      scenario: parsedScenario,
      threshold: parsedThreshold,
    });

    res.status(200).json({
      success: true,
      data: forecastData,
    });
  } catch (error) {
    console.error("Forecasting Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate financial forecast",
    });
  }
};

/**
 * @route   GET /api/forecast/scenarios
 * @desc    Get summary comparison across conservative, expected, and higher-spending scenarios
 * @access  Private (Authenticated user only)
 */
const getForecastScenarios = async (req, res) => {
  try {
    const forecastData = await forecastingService.generateForecast(req.user._id, {
      days: 90,
      scenario: "expected",
      threshold: 5000,
    });

    res.status(200).json({
      success: true,
      data: {
        scenarios: forecastData.scenarios,
        currentBalance: forecastData.overview.currentBalance,
        currency: forecastData.overview.currency,
      },
    });
  } catch (error) {
    console.error("Forecasting Scenarios Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load forecast scenarios",
    });
  }
};

module.exports = {
  getForecast,
  getForecastScenarios,
};
