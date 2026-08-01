const detectMoneyLeaks = (transactions) => {
  const groups = {};

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const key =
        transaction.description?.trim().toLowerCase() ||
        transaction.category.toLowerCase();

      if (!groups[key]) {
        groups[key] = {
          name:
            transaction.description ||
            transaction.category,
          category: transaction.category,
          count: 0,
          total: 0,
        };
      }

      groups[key].count++;
      groups[key].total += transaction.amount;
    });

  return Object.values(groups)
    .filter((item) => item.count >= 3)
    .map((item) => ({
      ...item,
      average: Math.round(item.total / item.count),
      potentialMonthlySaving:
        Math.round(item.total * 0.3),
      potentialYearlySaving:
        Math.round(item.total * 0.3 * 12),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
};

module.exports = detectMoneyLeaks;