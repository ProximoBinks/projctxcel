import { ConvexError } from "convex/values";

export function requiredText(value: string, label: string): string {
  const text = value.trim();
  if (!text) throw new ConvexError(`${label} is required.`);
  return text;
}

export function validEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ConvexError("Enter a valid email address.");
  }
  return email;
}

export function validCents(value: number, positive = false): number {
  if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0)) {
    throw new ConvexError(`Amount must be ${positive ? "positive" : "non-negative"} whole cents.`);
  }
  return value;
}

export function validPassword(value: string): string {
  if (value.length < 12 || new TextEncoder().encode(value).length > 72) {
    throw new ConvexError("Use a password of at least 12 characters and at most 72 UTF-8 bytes.");
  }
  return value;
}

export function validDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ConvexError("Enter a valid date (YYYY-MM-DD).");
  }
  return value;
}

export function validateClass(value: {
  name: string; subject: string; yearLevel: string; dayOfWeek: string;
  startTime: string; endTime: string; hourlyRateCents?: number;
}) {
  requiredText(value.name, "Class name");
  requiredText(value.subject, "Subject");
  requiredText(value.yearLevel, "Year level");
  if (!["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(value.dayOfWeek)) {
    throw new ConvexError("Choose a valid day of the week.");
  }
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!time.test(value.startTime) || !time.test(value.endTime) || value.endTime <= value.startTime) {
    throw new ConvexError("End time must be after start time on the same day.");
  }
  if (value.hourlyRateCents !== undefined) validCents(value.hourlyRateCents);
}
