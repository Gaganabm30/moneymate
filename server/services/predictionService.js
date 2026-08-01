const predictNextMonth = (monthlyData) => {
  if (!monthlyData.length) {
    return 0;
  }

  const lastThree = monthlyData.slice(-3);

  let weightedTotal = 0;
  let totalWeight = 0;

  lastThree.forEach((item, index) => {
    const weight = index + 1;

    weightedTotal += item.total * weight;
    totalWeight += weight;
  });

  return Math.round(weightedTotal / totalWeight);
};

module.exports = predictNextMonth;