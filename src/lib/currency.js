export const formatNaira = (value) => {
  const amount = Number(value || 0);
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
