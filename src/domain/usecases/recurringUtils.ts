import { Transaction, FilterState, PaymentMethodConfig } from "@/domain/entities";
import { calculateInvoiceDueDate } from "@/domain/usecases/transactionUtils";

export function getRecurringOccurrenceId(transactionId: string, date: string): string {
  return `${transactionId}_recurring_${date}`;
}

export function readRecurringOccurrenceId(id: string) {
  const match = /^(.+)_recurring_(\d{4}-\d{2}-\d{2})$/.exec(id);
  return match ? { transactionId: match[1], date: match[2] } : null;
}

export function getRecurringOccurrenceValue(transaction: Transaction, date: string) {
  const override = transaction.recurringOverrides?.find((entry) => entry.date === date);
  const occurrence = transaction.occurrences?.find((entry) => entry.dueDate === date);
  return {
    amount: override?.amount ?? occurrence?.amount ?? transaction.amount,
    isPaid: override?.isPaid ?? occurrence?.isPaid ?? (date === transaction.date && !!transaction.isPaid),
  };
}

export const generateRecurringTransactions = (
  transactions: Transaction[],
  filters: FilterState,
  paymentMethodConfigs: PaymentMethodConfig[]
): Transaction[] => {
  const virtualTransactions: Transaction[] = [];
  const targetMonth = filters.month + 1; // 1-12
  const targetYear = filters.year;

  for (const t of transactions) {
    if (!t.isRecurring || !t.frequency || (t.installments ?? 0) > 1) continue;

    const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
    const pmConfig = paymentMethodConfigs.find((c) => c.name === t.paymentMethod);
    const hasInvoiceConfig =
      pmConfig?.type === "card" && !!pmConfig.closingDay && !!pmConfig.paymentDay;

    // Up to three purchase months can feed one invoice month. In particular,
    // a short month can move an occurrence back before the closing day.
    for (let offset = hasInvoiceConfig ? -2 : 0; offset <= 0; offset++) {
      const source = new Date(targetYear, targetMonth - 1 + offset, 1);
      const sourceYear = source.getFullYear();
      const sourceMonth = source.getMonth() + 1;

      if (t.frequency === "yearly" && sourceMonth !== origMonth) continue;

      const sourceDays = new Date(sourceYear, sourceMonth, 0).getDate();
      const sourcePrefix = `${sourceYear}-${String(sourceMonth).padStart(2, "0")}`;
      const virtualDate = `${sourcePrefix}-${String(Math.min(origDay, sourceDays)).padStart(2, "0")}`;
      if (virtualDate <= t.date || t.excludedDates?.includes(virtualDate)) continue;

      let invoiceDueDate = hasInvoiceConfig ? calculateInvoiceDueDate(virtualDate, pmConfig) : undefined;
      if (hasInvoiceConfig && !invoiceDueDate?.startsWith(`${targetYear}-${String(targetMonth).padStart(2, "0")}`)) {
        continue;
      }
      if (!hasInvoiceConfig && t.invoiceDueDate) {
        const invoiceDay = Number(t.invoiceDueDate.split("-")[2]);
        const targetDays = new Date(targetYear, targetMonth, 0).getDate();
        invoiceDueDate = `${sourcePrefix}-${String(Math.min(invoiceDay, targetDays)).padStart(2, "0")}`;
      }

      const hasRealOccurrence = transactions.some((tx) =>
        !tx.isVirtual && tx.date?.startsWith(sourcePrefix) &&
        (tx.recurringGroupId === t.id ||
          (!tx.recurringGroupId && tx.description === t.description &&
            tx.category === t.category && Number(tx.amount) === Number(t.amount) && tx.type === t.type))
      );
      if (hasRealOccurrence) continue;

      const occurrence = getRecurringOccurrenceValue(t, virtualDate);
      virtualTransactions.push({
        ...t,
        id: getRecurringOccurrenceId(t.id, virtualDate),
        date: virtualDate,
        amount: occurrence.amount,
        invoiceDueDate,
        isVirtual: true,
        originalTransactionId: t.id,
        isPaid: occurrence.isPaid,
      });
    }
  }

  return virtualTransactions;
};
