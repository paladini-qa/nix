import type { Transaction, PaymentMethodConfig } from "../types";

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
 * Calcula a data de vencimento da fatura para uma transação de cartão.
 *
 * Regras:
 * - Se dia da transação < closingDay → fatura do mês corrente
 * - Se dia da transação >= closingDay → fatura do próximo mês
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
  const pd = String(config.paymentDay).padStart(2, "0");

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
