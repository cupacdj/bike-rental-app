export function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isPhone(phone: string): boolean {
  // Allow +, spaces, dashes; require 8-15 digits overall
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function isStrongPassword(pw: string): boolean {
  // Simple rule for the project: >= 6 chars
  return pw.trim().length >= 6;
}
