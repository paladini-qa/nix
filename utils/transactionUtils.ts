import type { Transaction } from "../types";

/**
 * Data usada para relatórios (filtro/agrupamento por mês).
 * Quando a transação tem vencimento de fatura (invoiceDueDate), usa essa data;
 * caso contrário usa a data da transação (date).
 * Ex.: transação em abril com fatura vencendo em maio → aparece no relatório de maio.
 */
export function getReportDate(t: Transaction): string {
  return t.invoiceDueDate ?? t.date;
}
