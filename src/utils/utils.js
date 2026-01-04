export const capitalizeWords = (value = "") => {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ") // evita múltiples espacios
    .replace(/\b\w/g, (char) => char.toUpperCase());
};