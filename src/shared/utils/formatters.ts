import dayjs from "dayjs";

/**
 * Formata um valor numérico como moeda.
 * @param value - Valor a ser formatado
 * @param locale - Locale para formatação (padrão: "pt-BR")
 * @param currency - Código da moeda (padrão: "BRL")
 * @param maximumFractionDigits - Número máximo de casas decimais (padrão: 0)
 */
export const formatCurrency = (
  value: number,
  locale: string = "pt-BR",
  currency: string = "BRL",
  maximumFractionDigits: number = 0
): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);

/**
 * Formata uma data como string no formato especificado.
 * @param date - Data em formato ISO (YYYY-MM-DD) ou objeto Date
 * @param format - Formato de saída (padrão: "DD/MM/YYYY")
 */
export const formatDate = (date: string | Date, format: string = "DD/MM/YYYY"): string =>
  dayjs(date).format(format);

/**
 * Retorna um rótulo localizado para o mês e ano informados.
 * @param month - Número do mês (1–12)
 * @param year - Ano com quatro dígitos
 */
export const getMonthLabel = (month: number, year: number): string =>
  dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMM/YY");
