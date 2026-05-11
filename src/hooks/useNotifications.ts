import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { AppNotification } from "../types";
import { useTransactionsQuery } from "./useTransactionsQuery";
import { budgetService } from "../services/api";
import { useCurrency } from "./useCurrency";

const STORAGE_KEY = "nix_notifications_read";

function loadReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persistReadSet(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useNotifications(month: number, year: number) {
  const { data: transactions = [] } = useTransactionsQuery();
  const { format } = useCurrency();

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", month, year],
    queryFn: () => budgetService.getByMonth(month, year),
    staleTime: 5 * 60 * 1000,
  });

  const [readIds, setReadIds] = useState<Set<string>>(loadReadSet);

  const rawNotifications = useMemo(() => {
    const today = dayjs();
    const result: Omit<AppNotification, "isRead">[] = [];

    // Transações do mês selecionado (apenas despesas para orçamentos)
    const monthExpenses = transactions.filter((t) => {
      const d = dayjs(t.date);
      return d.month() + 1 === month && d.year() === year && t.type === "expense";
    });

    // Notificações de orçamento
    for (const budget of budgets) {
      if (budget.type !== "expense") continue;
      const spent = monthExpenses
        .filter((t) => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = budget.limitAmount > 0 ? spent / budget.limitAmount : 0;

      if (pct >= 1) {
        result.push({
          id: `budget_exceeded_${budget.id}_${year}_${month}`,
          type: "budget_exceeded",
          title: `Budget exceeded: ${budget.category}`,
          body: `Spent ${format(spent)} out of ${format(budget.limitAmount)} limit`,
          amount: spent,
          createdAt: today.format("YYYY-MM-DD"),
          link: "budgets",
        });
      } else if (pct >= 0.8) {
        result.push({
          id: `budget_warning_${budget.id}_${year}_${month}`,
          type: "budget_warning",
          title: `Budget warning: ${budget.category}`,
          body: `${Math.round(pct * 100)}% of ${format(budget.limitAmount)} limit reached`,
          amount: spent,
          createdAt: today.format("YYYY-MM-DD"),
          link: "budgets",
        });
      }
    }

    // Despesas vencidas não pagas (não recorrentes)
    const overdueExpenses = transactions.filter(
      (t) =>
        t.type === "expense" &&
        !t.isRecurring &&
        !t.installments &&
        t.isPaid === false &&
        dayjs(t.date).isBefore(today, "day")
    );

    for (const t of overdueExpenses) {
      result.push({
        id: `overdue_${t.id}`,
        type: "unpaid_overdue",
        title: `Unpaid: ${t.description}`,
        body: `Due ${dayjs(t.date).format("MMM D, YYYY")} · ${format(t.amount)}`,
        amount: t.amount,
        createdAt: t.date,
        link: "transactions",
      });
    }

    // Transações recorrentes com vencimento nos próximos 3 dias (não pagas este mês)
    const DAYS_AHEAD = 3;
    const recurringExpenses = transactions.filter(
      (t) => t.isRecurring && t.type === "expense" && t.frequency === "monthly"
    );

    for (const t of recurringExpenses) {
      // Calcula o dia de vencimento no mês corrente
      const originalDay = dayjs(t.date).date();
      const dueThisMonth = today.date(originalDay).startOf("day");
      const daysUntilDue = dueThisMonth.diff(today.startOf("day"), "day");

      if (daysUntilDue >= 0 && daysUntilDue <= DAYS_AHEAD) {
        // Verifica se já foi paga este mês
        const alreadyPaidThisMonth = transactions.some(
          (tx) =>
            (tx.id === t.id || tx.recurringGroupId === t.id) &&
            tx.isPaid === true &&
            dayjs(tx.date).month() === today.month() &&
            dayjs(tx.date).year() === today.year()
        );

        if (!alreadyPaidThisMonth) {
          const label = daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`;
          result.push({
            id: `recurring_due_${t.id}_${year}_${month}`,
            type: "recurring_due",
            title: `Recurring due: ${t.description}`,
            body: `Due ${label} · ${format(t.amount)}`,
            amount: t.amount,
            createdAt: today.format("YYYY-MM-DD"),
            link: "recurring",
          });
        }
      }
    }

    return result;
  }, [transactions, budgets, month, year, format]);

  const notifications: AppNotification[] = useMemo(
    () =>
      rawNotifications
        .map((n) => ({ ...n, isRead: readIds.has(n.id) }))
        .sort((a, b) => {
          if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
          return b.createdAt.localeCompare(a.createdAt);
        }),
    [rawNotifications, readIds]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistReadSet(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      rawNotifications.forEach((n) => next.add(n.id));
      persistReadSet(next);
      return next;
    });
  }, [rawNotifications]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
