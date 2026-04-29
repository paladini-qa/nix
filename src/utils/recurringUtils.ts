import { Transaction, FilterState, PaymentMethodConfig } from "../types";
import { getReportDate, calculateInvoiceDueDate } from "./transactionUtils";

export const generateRecurringTransactions = (
  transactions: Transaction[],
  filters: FilterState,
  paymentMethodConfigs: PaymentMethodConfig[]
): Transaction[] => {
  const virtualTransactions: Transaction[] = [];
  const targetMonth = filters.month + 1;
  const targetYear = filters.year;

  transactions.forEach((t) => {
    // Ignora se não é recorrente, não tem frequência, ou é parcelada
    if (!t.isRecurring || !t.frequency) return;
    if (t.installments && t.installments > 1) return; // Parceladas não geram virtuais

    const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
    const targetDate = new Date(targetYear, targetMonth - 1, 1);

    if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

    const isOriginalMonth = origYear === targetYear && origMonth === targetMonth;
    if (isOriginalMonth) return;

    let shouldAppear = false;

    if (t.frequency === "monthly") {
      shouldAppear = true;
    } else if (t.frequency === "yearly") {
      shouldAppear = origMonth === targetMonth && targetYear > origYear;
    }

    if (shouldAppear) {
      const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
      const adjustedDay = Math.min(origDay, daysInTargetMonth);
      const virtualDate = `${targetYear}-${String(targetMonth).padStart(
        2,
        "0"
      )}-${String(adjustedDay).padStart(2, "0")}`;

      const excludedDates = t.excludedDates || [];
      if (excludedDates.includes(virtualDate)) {
        return;
      }

      const hasRealInTargetMonth = transactions.some(
        (tx) =>
          !tx.isVirtual &&
          tx.date &&
          tx.date.startsWith(`${targetYear}-${String(targetMonth).padStart(2, "0")}`) &&
          (tx.recurringGroupId === t.id ||
            (tx.description === t.description &&
              tx.category === t.category &&
              Number(tx.amount) === Number(t.amount) &&
              tx.type === t.type))
      );
      if (hasRealInTargetMonth) {
        return;
      }

      let virtualInvoiceDueDate: string | undefined = undefined;
      const pmConfig = paymentMethodConfigs.find((c) => c.name === t.paymentMethod);
      if (pmConfig?.type === "card" && pmConfig.closingDay && pmConfig.paymentDay) {
        virtualInvoiceDueDate = calculateInvoiceDueDate(virtualDate, pmConfig) ?? undefined;
      } else if (t.invoiceDueDate) {
        const origInvDay = Number(t.invoiceDueDate.split("-")[2]);
        const daysInTargetMonthInv = new Date(targetYear, targetMonth, 0).getDate();
        const adjustedInvDay = Math.min(origInvDay, daysInTargetMonthInv);
        virtualInvoiceDueDate = `${targetYear}-${String(targetMonth).padStart(
          2,
          "0"
        )}-${String(adjustedInvDay).padStart(2, "0")}`;
      }

      virtualTransactions.push({
        ...t,
        id: `${t.id}_recurring_${targetYear}-${String(targetMonth).padStart(2, "0")}`,
        date: virtualDate,
        invoiceDueDate: virtualInvoiceDueDate,
        isVirtual: true,
        originalTransactionId: t.id,
        isPaid: false,
      });
    }
  });

  return virtualTransactions;
};
