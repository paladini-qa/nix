import { Transaction } from "../../types";

export interface DetectedSubscription {
  description: string;
  amount: number;
  category: string;
  occurrences: number;
  lastDate: string;
  monthlyPattern: boolean;
}

/**
 * Analisa transações para detectar possíveis assinaturas/serviços recorrentes.
 * Critérios: mesma descrição (normalizada) + mesmo valor (±5%) por 2+ meses distintos.
 */
export function detectSubscriptions(transactions: Transaction[]): DetectedSubscription[] {
  const expenses = transactions.filter((t) => t.type === "expense" && !t.isRecurring && !t.isVirtual);

  // Normaliza a descrição removendo números (parcelas, datas, etc.)
  const normalize = (desc: string) =>
    desc
      .toLowerCase()
      .replace(/\d+/g, "")
      .replace(/[-_/\.]/g, " ")
      .trim();

  const groups: Record<string, Transaction[]> = {};

  expenses.forEach((tx) => {
    const key = `${normalize(tx.description)}|${Math.round(tx.amount)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });

  const subscriptions: DetectedSubscription[] = [];

  Object.values(groups).forEach((group) => {
    if (group.length < 2) return;

    // Verificar se ocorre em meses distintos
    const months = new Set(group.map((t) => t.date.slice(0, 7)));
    if (months.size < 2) return;

    // Verificar variação de valor (±10%)
    const amounts = group.map((t) => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxVariation = Math.max(...amounts.map((a) => Math.abs(a - avg) / avg));
    if (maxVariation > 0.1) return;

    // Verificar se é padrão mensal (distância entre meses ~1 mês)
    const sortedDates = [...months].sort();
    let isMonthly = true;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + "-01");
      const curr = new Date(sortedDates[i] + "-01");
      const diffMonths = (curr.getFullYear() - prev.getFullYear()) * 12 + curr.getMonth() - prev.getMonth();
      if (diffMonths > 3) {
        isMonthly = false;
        break;
      }
    }

    const sorted = [...group].sort((a, b) => b.date.localeCompare(a.date));

    subscriptions.push({
      description: sorted[0].description,
      amount: avg,
      category: sorted[0].category,
      occurrences: months.size,
      lastDate: sorted[0].date,
      monthlyPattern: isMonthly,
    });
  });

  // Ordenar por valor decrescente
  return subscriptions.sort((a, b) => b.amount - a.amount).slice(0, 10);
}
