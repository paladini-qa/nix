import { useState, useCallback, useMemo } from "react";
import { Transaction, TransactionType, FilterState } from "../types";
import { getReportDate } from "../utils/transactionUtils";
import { supabase } from "../services/supabaseClient";

export interface UseTransactionsOptions {
  userId?: string;
}

/**
 * Hook para gerenciamento de transações
 * Encapsula toda a lógica de CRUD e filtragem
 */
export function useTransactions(options: UseTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca transações do banco
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const mapped: Transaction[] = data.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          paymentMethod: t.payment_method,
          date: t.date,
          invoiceDueDate: t.invoice_due_date ?? undefined,
          createdAt: new Date(t.created_at).getTime(),
          isRecurring: t.is_recurring,
          frequency: t.frequency,
          installments: t.installments,
          currentInstallment: t.current_installment,
          isPaid: t.is_paid ?? true,
          installmentGroupId: t.installment_group_id,
          excludedDates: t.excluded_dates ?? [],
        }));
        setTransactions(mapped);
      }
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  // Adiciona uma transação
  const addTransaction = useCallback(
    async (
      tx: Omit<Transaction, "id" | "createdAt">,
      userId: string
    ): Promise<Transaction | null> => {
      try {
        const dbPayload: Record<string, unknown> = {
          user_id: userId,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          payment_method: tx.paymentMethod,
          date: tx.date,
          is_recurring: tx.isRecurring,
          frequency: tx.frequency,
          installments: tx.installments,
          current_installment: tx.currentInstallment,
          is_paid: tx.isPaid ?? false,
        };
        if (tx.invoiceDueDate) dbPayload.invoice_due_date = tx.invoiceDueDate;

        const { data, error } = await supabase
          .from("transactions")
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newTx: Transaction = {
            id: data.id,
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category,
            paymentMethod: data.payment_method,
            date: data.date,
            invoiceDueDate: data.invoice_due_date ?? undefined,
            createdAt: new Date(data.created_at).getTime(),
            isRecurring: data.is_recurring,
            frequency: data.frequency,
            installments: data.installments,
            currentInstallment: data.current_installment,
            isPaid: data.is_paid ?? false,
          };
          setTransactions((prev) => [newTx, ...prev]);
          return newTx;
        }
        return null;
      } catch (err: any) {
        console.error("Error adding transaction:", err);
        setError(err.message || "Failed to add transaction");
        throw err;
      }
    },
    []
  );

  // Adiciona transações parceladas
  const addInstallmentTransactions = useCallback(
    async (
      tx: Omit<Transaction, "id" | "createdAt">,
      userId: string,
      installments: number
    ): Promise<Transaction[]> => {
      try {
        const addMonths = (dateStr: string, months: number): string => {
          const date = new Date(dateStr);
          date.setMonth(date.getMonth() + months);
          return date.toISOString().split("T")[0];
        };

        const txAmount = tx.amount || 0;
        const installmentAmount =
          Math.round((txAmount / installments) * 100) / 100;
        const totalFromInstallments = installmentAmount * installments;
        const remainder =
          Math.round((txAmount - totalFromInstallments) * 100) / 100;

        const payloads = [];
        // Data base das parcelas: se tem data da fatura, a primeira parcela começa nesse mês (ex.: fatura em abril → parcelas em abr, mai, jun...)
        const baseDateForInstallments = tx.invoiceDueDate ?? tx.date;
        const baseDueDate = tx.invoiceDueDate || tx.date; // para invoice_due_date de cada parcela
        for (let i = 0; i < installments; i++) {
          const amount = i === 0 ? installmentAmount + remainder : installmentAmount;
          const payload: Record<string, unknown> = {
            user_id: userId,
            description: tx.description,
            amount: amount,
            type: tx.type,
            category: tx.category,
            payment_method: tx.paymentMethod,
            date: addMonths(baseDateForInstallments, i),
            is_recurring: tx.isRecurring,
            frequency: tx.frequency,
            installments: installments,
            current_installment: i + 1,
            is_paid: false,
          };
          if (tx.invoiceDueDate) payload.invoice_due_date = addMonths(baseDueDate, i);
          payloads.push(payload);
        }

        const { data, error } = await supabase
          .from("transactions")
          .insert(payloads)
          .select();

        if (error) throw error;

        if (data) {
          const newTxs: Transaction[] = data.map((d: any) => ({
            id: d.id,
            description: d.description,
            amount: d.amount,
            type: d.type,
            category: d.category,
            paymentMethod: d.payment_method,
            date: d.date,
            invoiceDueDate: d.invoice_due_date ?? undefined,
            createdAt: new Date(d.created_at).getTime(),
            isRecurring: d.is_recurring,
            frequency: d.frequency,
            installments: d.installments,
            currentInstallment: d.current_installment,
            isPaid: d.is_paid ?? false,
          }));
          setTransactions((prev) => [...newTxs, ...prev]);
          return newTxs;
        }
        return [];
      } catch (err: any) {
        console.error("Error adding installment transactions:", err);
        setError(err.message || "Failed to add installment transactions");
        throw err;
      }
    },
    []
  );

  // Atualiza uma transação
  const updateTransaction = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Transaction, "id" | "createdAt">>,
      userId: string
    ): Promise<Transaction | null> => {
      try {
        const dbPayload: Record<string, any> = { user_id: userId };
        
        if (updates.description !== undefined) dbPayload.description = updates.description;
        if (updates.amount !== undefined) dbPayload.amount = updates.amount;
        if (updates.type !== undefined) dbPayload.type = updates.type;
        if (updates.category !== undefined) dbPayload.category = updates.category;
        if (updates.paymentMethod !== undefined) dbPayload.payment_method = updates.paymentMethod;
        if (updates.date !== undefined) dbPayload.date = updates.date;
        if (updates.isRecurring !== undefined) dbPayload.is_recurring = updates.isRecurring;
        if (updates.frequency !== undefined) dbPayload.frequency = updates.frequency;
        if (updates.installments !== undefined) dbPayload.installments = updates.installments;
        if (updates.currentInstallment !== undefined) dbPayload.current_installment = updates.currentInstallment;
        if (updates.isPaid !== undefined) dbPayload.is_paid = updates.isPaid;
        if (updates.invoiceDueDate !== undefined) dbPayload.invoice_due_date = updates.invoiceDueDate;

        const { data, error } = await supabase
          .from("transactions")
          .update(dbPayload)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const updatedTx: Transaction = {
            id: data.id,
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category,
            paymentMethod: data.payment_method,
            date: data.date,
            invoiceDueDate: data.invoice_due_date ?? undefined,
            createdAt: new Date(data.created_at).getTime(),
            isRecurring: data.is_recurring,
            frequency: data.frequency,
            installments: data.installments,
            currentInstallment: data.current_installment,
            isPaid: data.is_paid ?? true,
          };
          setTransactions((prev) =>
            prev.map((t) => (t.id === id ? updatedTx : t))
          );
          return updatedTx;
        }
        return null;
      } catch (err: any) {
        console.error("Error updating transaction:", err);
        setError(err.message || "Failed to update transaction");
        throw err;
      }
    },
    []
  );

  // Remove uma transação
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      setError(err.message || "Failed to delete transaction");
      throw err;
    }
  }, []);

  // Alterna status de pago
  const togglePaid = useCallback(
    async (id: string, isPaid: boolean): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("transactions")
          .update({ is_paid: isPaid })
          .eq("id", id);
        if (error) throw error;
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isPaid } : t))
        );
        return true;
      } catch (err: any) {
        console.error("Error toggling paid status:", err);
        setError(err.message || "Failed to toggle paid status");
        throw err;
      }
    },
    []
  );

  // Filtra transações por mês/ano (usa data de relatório)
  const getFilteredByDate = useCallback(
    (month: number, year: number): Transaction[] => {
      return transactions.filter((t) => {
        const [y, m] = getReportDate(t).split("-");
        return parseInt(y) === year && parseInt(m) === month + 1;
      });
    },
    [transactions]
  );

  // Calcula resumo financeiro
  const getSummary = useCallback(
    (filteredTxs: Transaction[]) => {
      const income = filteredTxs
        .filter((t) => t.type === "income")
        .reduce((acc, t) => acc + (t.amount || 0), 0);
      const expense = filteredTxs
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + (t.amount || 0), 0);
      return {
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
      };
    },
    []
  );

  // Gera transações recorrentes virtuais (apenas para não-parceladas)
  const generateRecurringForMonth = useCallback(
    (month: number, year: number): Transaction[] => {
      const virtualTransactions: Transaction[] = [];
      const targetMonth = month + 1;

      transactions.forEach((t) => {
        // Ignora se não é recorrente, não tem frequência, ou é parcelada
        if (!t.isRecurring || !t.frequency) return;
        if (t.installments && t.installments > 1) return; // Parceladas não geram virtuais

        const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
        const origDate = new Date(origYear, origMonth - 1, origDay);
        const targetDate = new Date(year, targetMonth - 1, 1);

        if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

        const isOriginalMonth = origYear === year && origMonth === targetMonth;
        if (isOriginalMonth) return;

        let shouldAppear = false;

        if (t.frequency === "monthly") {
          shouldAppear = true;
        } else if (t.frequency === "yearly") {
          shouldAppear = origMonth === targetMonth && year > origYear;
        }

        if (shouldAppear) {
          const daysInMonth = new Date(year, targetMonth, 0).getDate();
          const adjustedDay = Math.min(origDay, daysInMonth);
          const virtualDate = `${year}-${String(targetMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

          // Verifica se esta data está no excluded_dates da transação original
          const excludedDates = t.excludedDates || [];
          if (excludedDates.includes(virtualDate)) {
            return; // Não gera a transação virtual para esta data
          }

          virtualTransactions.push({
            ...t,
            id: `${t.id}_recurring_${year}-${String(targetMonth).padStart(2, "0")}`,
            date: virtualDate,
            isVirtual: true,
            originalTransactionId: t.id,
          });
        }
      });

      return virtualTransactions;
    },
    [transactions]
  );

  // Limpa erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Atualiza datas de múltiplas parcelas de um grupo
  const updateInstallmentDates = useCallback(
    async (
      installmentIds: string[],
      newDates: { id: string; date: string }[]
    ): Promise<boolean> => {
      try {
        // Atualiza cada parcela com sua nova data
        const updatePromises = newDates.map(({ id, date }) =>
          supabase
            .from("transactions")
            .update({ date })
            .eq("id", id)
        );

        const results = await Promise.all(updatePromises);
        
        // Verifica se houve algum erro
        const hasError = results.some((r) => r.error);
        if (hasError) {
          const firstError = results.find((r) => r.error)?.error;
          throw firstError;
        }

        // Atualiza o estado local
        setTransactions((prev) =>
          prev.map((t) => {
            const newDateEntry = newDates.find((d) => d.id === t.id);
            if (newDateEntry) {
              return { ...t, date: newDateEntry.date };
            }
            return t;
          })
        );

        return true;
      } catch (err: any) {
        console.error("Error updating installment dates:", err);
        setError(err.message || "Failed to update installment dates");
        throw err;
      }
    },
    []
  );

  // Mapa de transações por ID — acesso O(1) para lookups frequentes
  const transactionsById = useMemo(
    () => new Map(transactions.map((t) => [t.id, t])),
    [transactions]
  );

  // Listas pré-filtradas por tipo — evita re-filtragem nos consumidores
  const incomeTransactions = useMemo(
    () => transactions.filter((t) => t.type === "income"),
    [transactions]
  );

  const expenseTransactions = useMemo(
    () => transactions.filter((t) => t.type === "expense"),
    [transactions]
  );

  return {
    transactions,
    setTransactions,
    loading,
    error,
    clearError,
    fetchTransactions,
    addTransaction,
    addInstallmentTransactions,
    updateTransaction,
    deleteTransaction,
    togglePaid,
    getFilteredByDate,
    getSummary,
    generateRecurringForMonth,
    updateInstallmentDates,
    transactionsById,
    incomeTransactions,
    expenseTransactions,
  };
}

export default useTransactions;




