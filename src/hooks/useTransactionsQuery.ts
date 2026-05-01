import { useQuery, useMutation, useQueryClient, onlineManager } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { Transaction } from "../types";
import { enqueueSyncOp } from "./useNetworkStatus";
import dayjs from "dayjs";

export const TRANSACTIONS_KEY = ["transactions"];

function mapTransactionFromDb(t: any): Transaction {
  return {
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

function isNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) return true;
  return false;
}

export function useTransactionsQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      return (data || []).map(mapTransactionFromDb);
    },
  });

  // ─── ADD ──────────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (tx: Partial<Transaction>) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      const payload = { ...mapTransactionToDb(tx), user_id: user.id };

      const { data, error } = await supabase
        .from("transactions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return mapTransactionFromDb(data);
    },

    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: TRANSACTIONS_KEY });
      const previous = queryClient.getQueryData<Transaction[]>(TRANSACTIONS_KEY);

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
        TRANSACTIONS_KEY,
        (old) => [optimistic, ...(old ?? [])]
      );

      return { previous };
    },

    onError: (error, tx, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(TRANSACTIONS_KEY, context.previous);
      }
      if (isNetworkError(error)) {
        enqueueSyncOp({ type: "add", payload: mapTransactionToDb(tx) as Record<string, unknown> });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...tx }: Partial<Transaction> & { id: string }) => {
      const payload = mapTransactionToDb(tx);

      const { data, error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapTransactionFromDb(data);
    },

    onMutate: async ({ id, ...tx }) => {
      await queryClient.cancelQueries({ queryKey: TRANSACTIONS_KEY });
      const previous = queryClient.getQueryData<Transaction[]>(TRANSACTIONS_KEY);

      queryClient.setQueryData<Transaction[]>(TRANSACTIONS_KEY, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, ...tx } : t))
      );

      return { previous };
    },

    onError: (error, { id, ...tx }, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(TRANSACTIONS_KEY, context.previous);
      }
      if (isNetworkError(error)) {
        enqueueSyncOp({
          type: "update",
          payload: { id, ...mapTransactionToDb(tx) } as Record<string, unknown>,
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TRANSACTIONS_KEY });
      const previous = queryClient.getQueryData<Transaction[]>(TRANSACTIONS_KEY);

      queryClient.setQueryData<Transaction[]>(TRANSACTIONS_KEY, (old) =>
        (old ?? []).filter((t) => t.id !== id)
      );

      return { previous };
    },

    onError: (error, id, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(TRANSACTIONS_KEY, context.previous);
      }
      if (isNetworkError(error)) {
        enqueueSyncOp({ type: "delete", payload: { id } });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });

  // ─── UPDATE INSTALLMENT DATES ─────────────────────────────────────────────

  const updateInstallmentDatesMutation = useMutation({
    mutationFn: async (newDates: { id: string; date: string }[]) => {
      const results = await Promise.all(
        newDates.map(({ id, date }) =>
          supabase.from("transactions").update({ date }).eq("id", id)
        )
      );

      const errors = results.filter((r) => r.error).map((r) => r.error!);
      if (errors.length > 0) {
        throw new Error(
          `Failed to update ${errors.length} of ${newDates.length} installment dates`
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });

  return {
    ...query,
    addTransaction: addMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    updateInstallmentDates: updateInstallmentDatesMutation.mutateAsync,
    isOnline: onlineManager.isOnline(),
  };
}
