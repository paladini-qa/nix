import { useCallback, useMemo } from "react";

export interface CurrencyOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const DEFAULT_OPTIONS: CurrencyOptions = {
  locale: "pt-BR",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/**
 * Hook para formatação de moeda
 * Centraliza a lógica de formatação em toda a aplicação
 */
export function useCurrency(options: CurrencyOptions = {}) {
  const mergedOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options]
  );

  // Formatter memoizado
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(mergedOptions.locale, {
        style: "currency",
        currency: mergedOptions.currency,
        minimumFractionDigits: mergedOptions.minimumFractionDigits,
        maximumFractionDigits: mergedOptions.maximumFractionDigits,
      }),
    [mergedOptions]
  );

  // Formata valor para moeda
  const format = useCallback(
    (value: number): string => {
      return formatter.format(value);
    },
    [formatter]
  );

  // Formata com sinal (+ para positivo, - para negativo)
  const formatWithSign = useCallback(
    (value: number): string => {
      const formatted = formatter.format(Math.abs(value));
      if (value > 0) return `+${formatted}`;
      if (value < 0) return `-${formatted}`;
      return formatted;
    },
    [formatter]
  );

  // Formata de forma compacta (1K, 1M, etc.)
  const formatCompact = useCallback(
    (value: number): string => {
      const compactFormatter = new Intl.NumberFormat(mergedOptions.locale, {
        style: "currency",
        currency: mergedOptions.currency,
        notation: "compact",
        maximumFractionDigits: 1,
      });
      return compactFormatter.format(value);
    },
    [mergedOptions]
  );

  // Parse string para número (remove formatação)
  const parse = useCallback((value: string): number => {
    // Remove tudo exceto números, vírgula e ponto
    const cleaned = value.replace(/[^\d,.-]/g, "");
    // Converte formato brasileiro (1.234,56) para número
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Retorna símbolo da moeda
  const currencySymbol = useMemo(() => {
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");
    return symbolPart?.value || mergedOptions.currency;
  }, [formatter, mergedOptions.currency]);

  return {
    format,
    formatWithSign,
    formatCompact,
    parse,
    currencySymbol,
    locale: mergedOptions.locale,
    currency: mergedOptions.currency,
  };
}

export default useCurrency;





