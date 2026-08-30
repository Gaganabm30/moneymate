export const formatINR = (amount) =>
  `₹${Math.abs(Number(amount) || 0).toLocaleString("en-IN")}`;

export const formatCurrency = (amount, includeSign = false, type = null) => {
  const abs = Math.abs(Number(amount) || 0);
  const formatted = `₹${abs.toLocaleString("en-IN")}`;
  if (!includeSign) return formatted;
  if (type === "income") return `+${formatted}`;
  if (type === "expense") return `-${formatted}`;
  return formatted;
};

export default formatCurrency;
