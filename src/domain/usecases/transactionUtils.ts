import type { Transaction, PaymentMethodConfig } from "@/domain/entities";

export interface InstallmentDateChange {
  id: string;
  date: string;
  invoiceDueDate?: string;
  previousDate: string;
  previousInvoiceDueDate?: string | null;
}

export function getBalanceOnDate(
  transactions: readonly Transaction[],
  date: string,
  excludedId?: string,
): number {
  const balanceInCents = transactions.reduce((balance, transaction) => {
    if (transaction.date > date || transaction.id === excludedId) return balance;
    const cents = Math.round(transaction.amount * 100);
    return balance + (transaction.type === "income" ? cents : -cents);
  }, 0);
  return balanceInCents / 100;
}

export const MAX_INSTALLMENTS = 48;

export function getInstallmentAmounts(total: number, count: number): number[] {
  if (!Number.isInteger(count) || count < 2 || count > MAX_INSTALLMENTS) {
    throw new RangeError("Invalid installment count");
  }

  const cents = Math.round(total * 100);
  const regular = Math.round(cents / count);
  const first = cents - regular * (count - 1);

  if (first >= 0) {
    return Array.from({ length: count }, (_, index) => (index === 0 ? first : regular) / 100);
  }

  // Match the database's cumulative rounding when the first installment
  // cannot absorb the full adjustment.
  return Array.from({ length: count }, (_, index) =>
    (Math.round(cents * (index + 1) / count) - Math.round(cents * index / count)) / 100
  );
}

/**
 * Data usada para relatórios (filtro/agrupamento por mês).
 * Quando a transação tem vencimento de fatura (invoiceDueDate), usa essa data;
 * caso contrário usa a data da transação (date).
 * Ex.: transação em abril com fatura vencendo em maio → aparece no relatório de maio.
 */
export function getReportDate(t: Transaction): string {
  return t.invoiceDueDate ?? t.date;
}

/**
 * Como getReportDate, mas calcula o invoiceDueDate dinamicamente quando não está
 * armazenado na transação, usando a configuração do método de pagamento.
 * Isso corrige casos em que a configuração de fechamento foi adicionada depois da transação.
 */
export function getEffectiveReportDate(
  t: Transaction,
  paymentMethodConfigs?: PaymentMethodConfig[]
): string {
  if (t.invoiceDueDate) return t.invoiceDueDate;
  if (paymentMethodConfigs?.length) {
    const pmConfig = paymentMethodConfigs.find((c) => c.name === t.paymentMethod);
    if (pmConfig) {
      const calculated = calculateInvoiceDueDate(t.date, pmConfig);
      if (calculated) return calculated;
    }
  }
  return t.date;
}

/**
 * Calcula a data de vencimento da fatura para uma transação de cartão.
 *
 * Regras:
 * - Se dia da transação <= closingDay → fatura do mês corrente
 * - Se dia da transação > closingDay → fatura do próximo mês
 * - O pagamento ocorre no paymentDay do mês de fechamento se paymentDay > closingDay,
 *   ou no mês seguinte ao fechamento se paymentDay <= closingDay.
 *
 * Exemplos (fecha dia 10, paga dia 25):
 *   - Jan 8  → fatura Jan → vence Jan 25
 *   - Jan 11 → fatura Fev → vence Fev 25
 *
 * Exemplos (fecha dia 25, paga dia 5):
 *   - Jan 20 → fatura Jan → fecha Jan 25 → paga Fev 5
 *   - Jan 26 → fatura Fev → fecha Fev 25 → paga Mar 5
 *
 * @returns Data no formato YYYY-MM-DD, ou undefined se o método não for cartão.
 */
export function calculateInvoiceDueDate(
  transactionDate: string,
  config: PaymentMethodConfig
): string | undefined {
  if (
    config.type !== "card" ||
    !config.closingDay ||
    !config.paymentDay
  ) {
    return undefined;
  }

  // Decompõe a data sem conversão de timezone (trata como local)
  const [year, month, day] = transactionDate.split("-").map(Number);

  // Mês base em que a fatura fecha (0-indexed)
  let closingMonth = month - 1; // 0-indexed
  let closingYear = year;

  if (day > config.closingDay) {
    // Transação ocorreu após o fechamento → próxima fatura
    closingMonth += 1;
    if (closingMonth > 11) {
      closingMonth = 0;
      closingYear += 1;
    }
  }

  // Mês do pagamento
  let paymentMonth = closingMonth;
  let paymentYear = closingYear;

  if (config.paymentDay <= config.closingDay) {
    // Pagamento é no mês seguinte ao fechamento
    paymentMonth += 1;
    if (paymentMonth > 11) {
      paymentMonth = 0;
      paymentYear += 1;
    }
  }

  const pm = String(paymentMonth + 1).padStart(2, "0");
  const py = String(paymentYear);
  const lastDay = new Date(paymentYear, paymentMonth + 1, 0).getDate();
  const pd = String(Math.min(config.paymentDay, lastDay)).padStart(2, "0");

  return `${py}-${pm}-${pd}`;
}

/**
 * Retorna o nome legível do mês/ano de uma fatura calculada.
 * Ex.: "2024-02-05" → "Fevereiro 2024"
 */
export function formatInvoiceMonth(invoiceDueDate: string): string {
  const [year, month] = invoiceDueDate.split("-").map(Number);
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${months[month - 1]} ${year}`;
}
