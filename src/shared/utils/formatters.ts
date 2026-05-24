import dayjs from "dayjs";

/**
 * Formats a numeric value as currency.
 * @param value - Value to be formatted
 * @param locale - Locale for formatting (default: "en-US")
 * @param currency - Currency code (default: "USD")
 * @param maximumFractionDigits - Maximum number of decimal places (default: 0)
 */
export const formatCurrency = (
  value: number,
  locale: string = "en-US",
  currency: string = "USD",
  maximumFractionDigits: number = 0
): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);

/**
 * Formats a date as a string in the specified format.
 * @param date - Date in ISO format (YYYY-MM-DD) or Date object
 * @param format - Output format (default: "MM/DD/YYYY")
 */
export const formatDate = (date: string | Date, format: string = "MM/DD/YYYY"): string =>
  dayjs(date).format(format);

/**
 * Returns a localized label for the given month and year.
 * @param month - Month number (1–12)
 * @param year - Four-digit year
 */
export const getMonthLabel = (month: number, year: number): string =>
  dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMM/YY");

