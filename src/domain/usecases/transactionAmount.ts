const amountFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Accept plain amounts and correctly grouped US or Brazilian amounts. */
export function parseTransactionAmount(input: string): number | null {
  const amount = input.trim().replace(/^(?:R?\$)\s*/i, "");
  let normalized: string;

  if (/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(amount)) {
    normalized = amount.replace(",", ".");
  } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(amount)) {
    normalized = amount.replaceAll(",", "");
  } else if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(amount)) {
    normalized = amount.replaceAll(".", "").replace(",", ".");
  } else {
    return null;
  }

  const value = Number(normalized);
  return Number.isSafeInteger(Math.round(value * 100)) ? value : null;
}

export function formatTransactionAmount(value: number): string {
  return amountFormatter.format(value);
}
