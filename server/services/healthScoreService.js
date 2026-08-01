const calculateHealthScore = ({
  income,
  expenses,
  budgetUsage,
}) => {
  if (income <= 0) {
    return {
      score: 0,
      label: "Needs Attention",
    };
  }

  const savings = income - expenses;

  const savingsRate = savings / income;

  let savingsScore = Math.min(
    Math.max(savingsRate / 0.3, 0),
    1
  ) * 50;

  let spendingScore =
    expenses <= income ? 30 : 0;

  let budgetScore =
    budgetUsage <= 80
      ? 20
      : budgetUsage <= 100
      ? 10
      : 0;

  const score = Math.round(
    savingsScore + spendingScore + budgetScore
  );

  let label = "Needs Attention";

  if (score >= 80) {
    label = "Excellent";
  } else if (score >= 60) {
    label = "Good";
  } else if (score >= 40) {
    label = "Fair";
  }

  return {
    score,
    label,
  };
};

module.exports = calculateHealthScore;