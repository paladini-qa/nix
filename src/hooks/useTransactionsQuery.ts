import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { Transaction } from "../types";

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
    isPaid: t.is_paid ?? true,
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

  const addMutation = useMutation({
    mutationFn: async (tx: Partial<Transaction>) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      const payload = {
        ...mapTransactionToDb(tx),
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return mapTransactionFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
  });

  const updateInstallmentDatesMutation = useMutation({
    mutationFn: async (newDates: { id: string; date: string }[]) => {
      const results = await Promise.all(
        newDates.map(({ id, date }) =>
          supabase.from("transactions").update({ date }).eq("id", id)
        )
      );

      const firstError = results.find((result) => result.error)?.error;
      if (firstError) throw firstError;
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
  };
}
