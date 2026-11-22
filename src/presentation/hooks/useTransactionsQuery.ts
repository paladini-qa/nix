import { useQuery, useMutation, useQueryClient, onlineManager } from "@tanstack/react-query";
import { supabase } from "@/infrastructure/database/supabaseClient";
import { Transaction } from "@/domain/entities";
import type { InstallmentDateChange } from "@/domain/usecases/transactionUtils";
import { enqueueSyncOp } from "@/presentation/hooks/useNetworkStatus";
import dayjs from "dayjs";

const TRANSACTION_COLUMNS = "*, recurring_transactions(frequency), splited_transactions(occurrence_number, due_date, amount, is_paid), recurring_overrides(override_date, amount, is_paid)";

function mapTransactionFromDb(t: any): Transaction {
  return {
    id: t.id,
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    paymentMethod: t.payment_method,
    paymentMethodId: t.payment_method_id ?? undefined,
    status: t.status ?? undefined,
    occurrences: t.splited_transactions?.map(
      (row: { occurrence_number: number; due_date: string; amount: number; is_paid: boolean | null }) => ({
        number: row.occurrence_number,
        dueDate: row.due_date,
        amount: row.amount,
        isPaid: row.is_paid,
      })
    ),
    recurringOverrides: t.recurring_overrides?.map(
      (row: { override_date: string; amount: number | null; is_paid: boolean | null }) => ({
        date: row.override_date,
        amount: row.amount,
        isPaid: row.is_paid,
      })
    ),
    date: t.date,
    invoiceDueDate: t.invoice_due_date ?? undefined,
    createdAt: new Date(t.created_at).getTime(),
    isRecurring: t.is_recurring,
    frequency: t.recurring_transactions?.frequency ?? t.frequency,
    installments: t.installments,
    currentInstallment: t.current_installment,
    isPaid: t.is_paid ?? false,
    isShared: t.is_shared,
    sharedWith: t.shared_with,
    iOwe: t.i_owe,
    relatedTransactionId: t.related_transaction_id,
    installmentGroupId: t.installment_group_id,
    excludedDates: t.excluded_dates ?? [],
    recurringGroupId: t.recurring_group_id,
    notes: t.notes ?? undefined,
  };
}

function mapTransactionToDb(tx: Partial<Transaction>) {
  const payload: Record<string, unknown> = {};

  if (tx.description !== undefined) payload.description = tx.description;
  if (tx.amount !== undefined) payload.amount = tx.amount;
  if (tx.type !== undefined) payload.type = tx.type;
  if (tx.category !== undefined) payload.category = tx.category;
  if (tx.paymentMethod !== undefined) payload.payment_method = tx.paymentMethod;
  if (tx.paymentMethodId !== undefined) payload.payment_method_id = tx.paymentMethodId;
  if (tx.date !== undefined) payload.date = tx.date;
  if (tx.invoiceDueDate !== undefined) payload.invoice_due_date = tx.invoiceDueDate;
  if (tx.isRecurring !== undefined) payload.is_recurring = tx.isRecurring;
  if (tx.frequency !== undefined) payload.frequency = tx.frequency;
  if (tx.installments !== undefined) payload.installments = tx.installments;
  if (tx.currentInstallment !== undefined) payload.current_installment = tx.currentInstallment;
  if (tx.isPaid !== undefined) payload.is_paid = tx.isPaid;
  if (tx.isShared !== undefined) payload.is_shared = tx.isShared;
  if (tx.sharedWith !== undefined) payload.shared_with = tx.sharedWith;
  if (tx.iOwe !== undefined) payload.i_owe = tx.iOwe;
  if (tx.relatedTransactionId !== undefined) {
    payload.related_transaction_id = tx.relatedTransactionId;
  }
  if (tx.installmentGroupId !== undefined) {
    payload.installment_group_id = tx.installmentGroupId;
  }
  if (tx.excludedDates !== undefined) payload.excluded_dates = tx.excludedDates;
  if (tx.recurringGroupId !== undefined) payload.recurring_group_id = tx.recurringGroupId;
  if (tx.notes !== undefined) payload.notes = tx.notes;

  return payload;
}

function mapNewTransactionToDb(tx: Partial<Transaction>) {
  return { ...mapTransactionToDb(tx), is_paid: tx.isPaid ?? false };
}

function isNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) return true;
  return false;
}

export function useTransactionsQuery(userId: string) {
  const transactionsKey = ["transactions", userId];
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: transactionsKey,
    queryFn: async ({ signal }) => {
      const transactions: Transaction[] = [];
      const pageSize = 500;
      let cursor: { date: string; id: string } | undefined;

      for (;;) {
        let page = supabase
          .from("transactions")
          .select(TRANSACTION_COLUMNS)
          .eq("user_id", userId)
          .gte("date", "2026-01-01")
          .order("date", { ascending: false })
          .order("id", { ascending: false })
          .limit(pageSize)
          .abortSignal(signal);

        if (cursor) {
          page = page.or(`date.lt.${cursor.date},and(date.eq.${cursor.date},id.lt.${cursor.id})`);
        }

        const { data, error } = await page;
        if (error) throw error;
        if (!data?.length) return transactions;

        transactions.push(...data.map(mapTransactionFromDb));
        const last = data[data.length - 1];
        cursor = { date: last.date, id: last.id };
      }
    },
  });

  // ─── ADD ──────────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (tx: Partial<Transaction>) => {
      // TODO: move to application service — layer violation
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (user?.id !== userId) throw new Error("Session changed");

      const payload = { ...mapNewTransactionToDb(tx), user_id: user.id };

      // TODO: move to application service — layer violation
      const { data, error } = await supabase
        .from("transactions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return mapTransactionFromDb(data);
    },

    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: transactionsKey });
      const previous = queryClient.getQueryData<Transaction[]>(transactionsKey);

      const optimistic: Transaction = {
        id: `optimistic_${crypto.randomUUID()}`,
        description: newTx.description ?? "",
        amount: newTx.amount ?? 0,
        type: newTx.type ?? "expense",
        category: newTx.category ?? "",
        paymentMethod: newTx.paymentMethod ?? "",
        date: newTx.date ?? dayjs().format("YYYY-MM-DD"),
        createdAt: Date.now(),
        isPaid: newTx.isPaid ?? false,
        isRecurring: newTx.isRecurring,
        frequency: newTx.frequency,
        installments: newTx.installments,
        currentInstallment: newTx.currentInstallment,
        isShared: newTx.isShared,
        sharedWith: newTx.sharedWith,
        iOwe: newTx.iOwe,
        excludedDates: newTx.excludedDates ?? [],
        notes: newTx.notes,
      };

      queryClient.setQueryData<Transaction[]>(
        transactionsKey,
        (old) => [optimistic, ...(old ?? [])]
      );

      return { previous, optimisticId: optimistic.id };
    },

    onSuccess: (saved, _tx, context) => {
      queryClient.setQueryData<Transaction[]>(transactionsKey, (current = []) => {
        const alreadyLoaded = current.some((transaction) => transaction.id === saved.id);
        const otherTransactions = current.filter((transaction) => transaction.id !== context.optimisticId);
        return alreadyLoaded ? otherTransactions : [saved, ...otherTransactions];
      });
    },

    onError: (error, tx, context) => {
      if (context) {
        queryClient.setQueryData(transactionsKey, context.previous ?? []);
      }
      if (isNetworkError(error)) {
        void enqueueSyncOp(userId, { type: "add", payload: mapNewTransactionToDb(tx) }).catch(() => {});
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKey });
    },
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...tx }: Partial<Transaction> & { id: string }) => {
      const payload = mapTransactionToDb(tx);

      // TODO: move to application service — layer violation
      const { data, error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", id).eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return mapTransactionFromDb(data);
    },

    onMutate: async ({ id, ...tx }) => {
      await queryClient.cancelQueries({ queryKey: transactionsKey });
      const previous = queryClient.getQueryData<Transaction[]>(transactionsKey);

      queryClient.setQueryData<Transaction[]>(transactionsKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, ...tx } : t))
      );

      return { previous };
    },

    onError: (error, { id, ...tx }, context: any) => {
      if (context) {
        queryClient.setQueryData(transactionsKey, context.previous ?? []);
      }
      if (isNetworkError(error)) {
        void enqueueSyncOp(userId, {
          type: "update",
          payload: { id, ...mapTransactionToDb(tx) } as Record<string, unknown>,
        }).catch(() => {});
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKey });
    },
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: move to application service — layer violation
      const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: transactionsKey });
      const previous = queryClient.getQueryData<Transaction[]>(transactionsKey);

      queryClient.setQueryData<Transaction[]>(transactionsKey, (old) =>
        (old ?? []).filter((t) => t.id !== id)
      );

      return { previous };
    },

    onError: (error, id, context: any) => {
      if (context) {
        queryClient.setQueryData(transactionsKey, context.previous ?? []);
      }
      if (isNetworkError(error)) {
        void enqueueSyncOp(userId, { type: "delete", payload: { id } }).catch(() => {});
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKey });
    },
  });

  // ─── BULK ADD (installments) ──────────────────────────────────────────────

  const bulkAddMutation = useMutation({
    mutationFn: async (transactions: Partial<Transaction>[]) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (user?.id !== userId) throw new Error("Session changed");

      const payloads = transactions.map((tx) => ({
        ...mapNewTransactionToDb(tx),
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from("transactions")
        .insert(payloads)
        .select();
      if (error) throw error;
      return (data || []).map(mapTransactionFromDb);
    },

    onMutate: async (newTransactions) => {
      await queryClient.cancelQueries({ queryKey: transactionsKey });
      const previous = queryClient.getQueryData<Transaction[]>(transactionsKey);

      const optimistics: Transaction[] = newTransactions.map((tx) => ({
        id: `optimistic_${crypto.randomUUID()}`,
        description: tx.description ?? "",
        amount: tx.amount ?? 0,
        type: tx.type ?? "expense",
        category: tx.category ?? "",
        paymentMethod: tx.paymentMethod ?? "",
        date: tx.date ?? dayjs().format("YYYY-MM-DD"),
        createdAt: Date.now(),
        isPaid: tx.isPaid ?? false,
        isRecurring: tx.isRecurring,
        frequency: tx.frequency,
        installments: tx.installments,
        currentInstallment: tx.currentInstallment,
        isShared: tx.isShared,
        sharedWith: tx.sharedWith,
        iOwe: tx.iOwe,
        excludedDates: tx.excludedDates ?? [],
        notes: tx.notes,
        installmentGroupId: tx.installmentGroupId,
        relatedTransactionId: tx.relatedTransactionId,
      }));

      queryClient.setQueryData<Transaction[]>(
        transactionsKey,
        (old) => [...optimistics, ...(old ?? [])]
      );

      return { previous };
    },

    onError: (_error, _txs, context: any) => {
      if (context) {
        queryClient.setQueryData(transactionsKey, context.previous ?? []);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKey });
    },
  });

  // ─── UPDATE INSTALLMENT DATES ─────────────────────────────────────────────

  const updateInstallmentDatesMutation = useMutation({
    mutationFn: async (changes: InstallmentDateChange[]) => {
      const { error } = await supabase.rpc("reschedule_installments", {
        p_changes: changes.map(({ id, date, invoiceDueDate, previousDate, previousInvoiceDueDate }) => ({
          id,
          date,
          invoice_due_date: invoiceDueDate,
          previous_date: previousDate,
          previous_invoice_due_date: previousInvoiceDueDate,
        })),
      });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: transactionsKey }),
  });

  const recurringPaymentMutation = useMutation({
    mutationFn: async ({ transactionId, date, isPaid }: { transactionId: string; date: string; isPaid: boolean }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (user?.id !== userId) throw new Error("Session changed");

      const { error } = await supabase.from("recurring_overrides").upsert(
        { transaction_id: transactionId, user_id: user.id, override_date: date, is_paid: isPaid },
        { onConflict: "transaction_id,override_date" }
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionsKey }),
  });

  return {
    ...query,
    setRecurringOccurrencePaid: recurringPaymentMutation.mutateAsync,
    addTransaction: addMutation.mutateAsync,
    bulkAddTransactions: bulkAddMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    updateInstallmentDates: updateInstallmentDatesMutation.mutateAsync,
    isOnline: onlineManager.isOnline(),
  };
}
