import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { Transaction } from "../types";

export const TRANSACTIONS_KEY = ["transactions"];

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

      return (data || []).map((t: any) => ({
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
      })) as Transaction[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (tx: Partial<Transaction>) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert(tx)
        .select()
        .single();
      if (error) throw error;
      return data;
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

  return {
    ...query,
    addTransaction: addMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
  };
}
