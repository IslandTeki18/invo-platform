import { REMINDER_DAYS_BEFORE_DUE } from "@repo/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateDueDate(
  createdAt: number,
  termsDays: number,
): number {
  return createdAt + termsDays * MS_PER_DAY;
}

export function isOverdue(dueDate: number, now?: number): boolean {
  return (now ?? Date.now()) > dueDate;
}

export function calculateReminderDate(dueDate: number): number {
  return dueDate - REMINDER_DAYS_BEFORE_DUE * MS_PER_DAY;
}
