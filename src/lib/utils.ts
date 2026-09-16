export { cn } from "cn";
import { AxiosError } from "axios";
import type { ApiResponse } from "@/types";

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const apiMessage = (error.response?.data as ApiResponse | undefined)?.message;
    if (status === 429) {
      return apiMessage || "Too many requests. Please wait a moment and try again.";
    }
    if (error.code === "ECONNABORTED" || /timeout/i.test(error.message)) {
      return "The server took too long to respond. Please try again.";
    }
    if (!error.response) {
      return "Cannot reach the server. Check your connection and try again.";
    }
    if (apiMessage) return apiMessage;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isReachabilityError(error: unknown) {
  if (!(error instanceof AxiosError)) return false;
  if (error.response?.status === 429) return true;
  if (error.code === "ECONNABORTED" || /timeout/i.test(error.message)) return true;
  return !error.response;
}

export function toAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatPkr(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(toAmount(value));
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function toDateKey(value?: string | Date | null) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatMonthYear(month: number, year: number) {
  return `${MONTHS[month - 1] ?? month} ${year}`;
}

export function remainingBalance(challan: {
  amount: string | number;
  paidAmount?: string | number;
  remainingBalance?: number;
}) {
  if (challan.remainingBalance !== undefined) return toAmount(challan.remainingBalance);
  return Math.max(0, toAmount(challan.amount) - toAmount(challan.paidAmount));
}

export const EXPENSE_CATEGORIES = [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies",
  "Maintenance",
  "Transport",
  "Other",
] as const;
