import dayjs from "dayjs";
import "dayjs/locale/pt-br";

/**
 * Formats a numeric value as currency.
 * @param value - Value to be formatted
 * @param locale - Locale for formatting (default: "pt-BR")
 * @param currency - Currency code (default: "BRL")
 * @param maximumFractionDigits - Maximum number of decimal places (default: 2)
 */
export const formatCurrency = (
  value: number,
  locale: string = "pt-BR",
  currency: string = "BRL",
  maximumFractionDigits: number = 2
): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatCompactCurrency = (value: number): string => compactCurrency.format(value);

/**
 * Formats a date as a string in the specified format.
 * @param date - Date in ISO format (YYYY-MM-DD) or Date object
 * @param format - Output format (default: "DD/MM/YYYY")
 */
export const formatDate = (date: string | Date, format: string = "DD/MM/YYYY"): string =>
  dayjs(date).format(format);

/**
 * Returns a localized label for the given month and year.
 * @param month - Month number (1–12)
 * @param year - Four-digit year
 */
export const getMonthLabel = (month: number, year: number): string =>
  dayjs(`${year}-${String(month).padStart(2, "0")}-01`).locale("pt-br").format("MMM/YY");

