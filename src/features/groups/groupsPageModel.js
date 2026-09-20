export const genderIcon = (gender) => {
  const value = (gender || "").toLowerCase();
  if (value.includes("female")) return "♀";
  if (value.includes("male")) return "♂";
  if (value.includes("non")) return "⚧";
  return "•";
};

export const genderColor = (gender) => {
  const value = (gender || "").toLowerCase();
  if (value.includes("female")) return "#ec4899";
  if (value.includes("male")) return "#3b82f6";
  if (value.includes("non")) return "#8b5cf6";
  return "#94a3b8";
};

export const groupAccent = (index) =>
  ["#0077b6", "#00b4d8", "#03045e", "#90e0ef"][index % 4];
