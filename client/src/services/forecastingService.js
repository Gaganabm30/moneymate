import api from "./api";

/**
 * Fetch financial forecast data for the authenticated user.
 * @param {Object} params
 * @param {number} [params.days=30] - Horizon: 30, 60, or 90
 * @param {string} [params.scenario='expected'] - 'conservative' | 'expected' | 'higher-spending'
 * @param {number} [params.threshold=5000] - Low balance alert threshold
 */
export const getFinancialForecast = async ({ days = 30, scenario = "expected", threshold = 5000 } = {}) => {
  const response = await api.get("/forecast", {
    params: { days, scenario, threshold },
  });
  return response.data;
};

/**
 * Fetch comparison metrics across all scenarios.
 */
export const getForecastScenarios = async () => {
  const response = await api.get("/forecast/scenarios");
  return response.data;
};
