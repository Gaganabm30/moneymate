const detectRecurring = (transactions) => {
  const groups = {};

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const name =
        transaction.description?.trim().toLowerCase();

      if (!name) return;

      if (!groups[name]) {
        groups[name] = [];
      }

      groups[name].push(transaction);
    });

  const recurring = [];

  Object.entries(groups).forEach(([name, items]) => {
    if (items.length < 2) return;

    items.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const gaps = [];

    for (let i = 1; i < items.length; i++) {
      const difference =
        new Date(items[i].date) -
        new Date(items[i - 1].date);

      gaps.push(
        difference / (1000 * 60 * 60 * 24)
      );
    }

    const monthlyGap = gaps.some(
      (gap) => gap >= 25 && gap <= 35
    );

    if (monthlyGap) {
      const latest = items[items.length - 1];

      recurring.push({
        name:
          latest.description ||
          name,
        amount: latest.amount,
        category: latest.category,
        monthlyCost: latest.amount,
        yearlyCost: latest.amount * 12,
      });
    }
  });

  return recurring;
};

module.exports = detectRecurring;