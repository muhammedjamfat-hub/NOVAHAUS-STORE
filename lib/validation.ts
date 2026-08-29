export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  // Accepts 070..., 080..., 081..., 090..., +234..., 234...
  return /^(\+?234\d{10}|0\d{10})$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}
