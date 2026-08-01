
const detectAnomalies = (transactions) => {
  const categories = {};

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = [];
      }

      categories[transaction.category].push(transaction);
    });

  const anomalies = [];

  Object.values(categories).forEach((items) => {
    if (items.length < 3) return;

    const amounts = items.map((item) => item.amount);

    const mean =
      amounts.reduce((sum, amount) => sum + amount, 0) /
      amounts.length;

    const variance =
      amounts.reduce(
        (sum, amount) =>
          sum + Math.pow(amount - mean, 2),
        0
      ) / amounts.length;

    const standardDeviation = Math.sqrt(variance);

    items.forEach((transaction) => {
      if (
        standardDeviation > 0 &&
        transaction.amount > mean + 2 * standardDeviation
      ) {
        anomalies.push({
          transaction,
          average: Math.round(mean),
          reason:
            "This transaction is significantly higher than your usual spending in this category.",
        });
      }
    });
  });

  return anomalies;
};

module.exports = detectAnomalies;