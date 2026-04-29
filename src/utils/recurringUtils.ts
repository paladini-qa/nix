import { Transaction, FilterState, PaymentMethodConfig } from "../types";
import { calculateInvoiceDueDate } from "./transactionUtils";

export const generateRecurringTransactions = (
  transactions: Transaction[],
  filters: FilterState,
  paymentMethodConfigs: PaymentMethodConfig[]
): Transaction[] => {
  const virtualTransactions: Transaction[] = [];
  const targetMonth = filters.month + 1; // 1-12
  const targetYear = filters.year;

  transactions.forEach((t) => {
    if (!t.isRecurring || !t.frequency) return;
    if (t.installments && t.installments > 1) return;

    const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
    const pmConfig = paymentMethodConfigs.find((c) => c.name === t.paymentMethod);
    const hasInvoiceConfig =
      pmConfig?.type === "card" && !!pmConfig.closingDay && !!pmConfig.paymentDay;

    let sourceYear = targetYear;
    let sourceMonth = targetMonth;

    if (hasInvoiceConfig) {
      // Para cartões com data de fechamento, o mês da transação (sourceMonth) pode
      // ser diferente do mês do filtro. Buscamos qual sourceMonth produz um
      // invoiceDueDate dentro do targetMonth. Verificamos até 3 candidatos
      // (targetMonth, targetMonth-1, targetMonth-2) — suficiente para qualquer config.
      let found = false;
      for (let offset = 0; offset >= -2; offset--) {
        let cm = targetMonth + offset;
        let cy = targetYear;
        if (cm <= 0) { cm += 12; cy -= 1; }

        if (t.frequency === "yearly" && cm !== origMonth) continue;

        const daysInCm = new Date(cy, cm, 0).getDate();
        const adjDay = Math.min(origDay, daysInCm);
        const candidateDate = `${cy}-${String(cm).padStart(2, "0")}-${String(adjDay).padStart(2, "0")}`;
        const effectiveDate = calculateInvoiceDueDate(candidateDate, pmConfig!) ?? candidateDate;
        const [ey, em] = effectiveDate.split("-").map(Number);

        if (ey === targetYear && em === targetMonth) {
          sourceYear = cy;
          sourceMonth = cm;
          found = true;
          break;
        }
      }
      if (!found) return;
    } else {
      // Sem configuração de cartão: sourceMonth = targetMonth (comportamento anterior)
      if (t.frequency === "yearly" && origMonth !== targetMonth) return;
      if (t.frequency === "yearly" && targetYear <= origYear) return;
    }

    // Não gera antes da data original
    if (new Date(sourceYear, sourceMonth - 1, 1) < new Date(origYear, origMonth - 1, 1)) return;

    // Não duplica o mês original (transação real já existe)
    if (origYear === sourceYear && origMonth === sourceMonth) return;

    // Data da transação virtual no sourceMonth
    const daysInSourceMonth = new Date(sourceYear, sourceMonth, 0).getDate();
    const adjustedDay = Math.min(origDay, daysInSourceMonth);
    const virtualDate = `${sourceYear}-${String(sourceMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

    // Verifica se a data está excluída
    if ((t.excludedDates ?? []).includes(virtualDate)) return;

    // Não gera virtual se já existe transação real no sourceMonth para esta recorrência
    const hasRealInSourceMonth = transactions.some(
      (tx) =>
        !tx.isVirtual &&
        tx.date?.startsWith(`${sourceYear}-${String(sourceMonth).padStart(2, "0")}`) &&
        (tx.recurringGroupId === t.id ||
          (tx.description === t.description &&
            tx.category === t.category &&
            Number(tx.amount) === Number(t.amount) &&
            tx.type === t.type))
    );
    if (hasRealInSourceMonth) return;

    // Calcula invoiceDueDate para a transação virtual
    let virtualInvoiceDueDate: string | undefined;
    if (hasInvoiceConfig) {
      virtualInvoiceDueDate = calculateInvoiceDueDate(virtualDate, pmConfig!) ?? undefined;
    } else if (t.invoiceDueDate) {
      const origInvDay = Number(t.invoiceDueDate.split("-")[2]);
      const daysInTargetInv = new Date(targetYear, targetMonth, 0).getDate();
      const adjustedInvDay = Math.min(origInvDay, daysInTargetInv);
      virtualInvoiceDueDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(adjustedInvDay).padStart(2, "0")}`;
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
  });

  return virtualTransactions;
};
