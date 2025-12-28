import { useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";
import { Transaction } from "../types";
import { useNotification, useConfirmDialog } from "../contexts";

// ============================================
// Types
// ============================================

type EditOption = "single" | "all" | "all_future";

interface TransactionHandlersOptions {
  session: Session;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

interface TransactionHandlers {
  handleAddTransaction: (
    newTx: Omit<Transaction, "id" | "createdAt">,
    editId?: string,
    editMode?: EditOption | null,
    editingTransaction?: Transaction | null
  ) => Promise<void>;
  handleDeleteTransaction: (id: string) => Promise<void>;
  handleTogglePaid: (id: string, isPaid: boolean) => Promise<void>;
  handlePayAllTransactions: (
    paymentMethod: string,
    month: number,
    year: number
  ) => Promise<void>;
}

// ============================================
// Hook
// ============================================

/**
 * useTransactionHandlers - Extracted CRUD operations for transactions
 * 
 * This hook encapsulates all transaction manipulation logic that was
 * previously in App.tsx, making it reusable and testable.
 */
export const useTransactionHandlers = ({
  session,
  transactions,
  setTransactions,
}: TransactionHandlersOptions): TransactionHandlers => {
  const { showError } = useNotification();
  const { confirm, choice } = useConfirmDialog();

  // ============================================
  // Add/Edit Transaction
  // ============================================
  
  const handleAddTransaction = useCallback(
    async (
      newTx: Omit<Transaction, "id" | "createdAt">,
      editId?: string,
      editMode?: EditOption | null,
      editingTransaction?: Transaction | null
    ) => {
      if (!session) return;

      const addMonths = (dateStr: string, months: number): string => {
        const date = new Date(dateStr);
        date.setMonth(date.getMonth() + months);
        return date.toISOString().split("T")[0];
      };

      try {
        if (editId) {
          // EDIT MODE
          const dbPayload = {
            description: newTx.description,
            amount: newTx.amount,
            type: newTx.type,
            category: newTx.category,
            payment_method: newTx.paymentMethod,
            is_recurring: newTx.isRecurring,
            frequency: newTx.frequency,
            is_shared: newTx.isShared,
            shared_with: newTx.sharedWith,
          };

          if (editMode === "all" || editMode === "all_future") {
            // Bulk edit
            const originalTx = editingTransaction;
            if (!originalTx) return;

            // Tratamento especial para transações recorrentes com "all_future"
            // Precisamos materializar as ocorrências passadas antes de atualizar
            if (originalTx.isRecurring && editMode === "all_future" && originalTx.frequency) {
              const targetDate = new Date(newTx.date);
              const targetYear = targetDate.getFullYear();
              const targetMonth = targetDate.getMonth() + 1; // 1-12

              const [origYear, origMonth, origDay] = originalTx.date.split("-").map(Number);
              
              // Gerar transações materializadas para meses passados
              const materializedTransactions: Array<{
                user_id: string;
                description: string;
                amount: number;
                type: string;
                category: string;
                payment_method: string;
                date: string;
                is_recurring: boolean;
                is_paid: boolean;
                is_shared?: boolean;
                shared_with?: string;
              }> = [];

              // Iterar pelos meses desde o original até o mês anterior ao selecionado
              let currentYear = origYear;
              let currentMonth = origMonth;

              while (
                currentYear < targetYear ||
                (currentYear === targetYear && currentMonth < targetMonth)
              ) {
                // Pula o mês original (já existe como transação real)
                if (!(currentYear === origYear && currentMonth === origMonth)) {
                  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                  const adjustedDay = Math.min(origDay, daysInMonth);
                  const materializedDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

                  // Verifica se já existe uma transação materializada para esta data
                  const alreadyExists = transactions.some((mt) => {
                    if (mt.isRecurring || mt.isVirtual) return false;
                    if (mt.id === originalTx.id) return false;
                    
                    const sameDescription = mt.description === originalTx.description;
                    const sameCategory = mt.category === originalTx.category;
                    const sameAmount = mt.amount === originalTx.amount;
                    const sameDate = mt.date === materializedDate;
                    const sameType = mt.type === originalTx.type;
                    
                    return sameDescription && sameCategory && sameAmount && sameDate && sameType;
                  });

                  if (!alreadyExists) {
                    materializedTransactions.push({
                      user_id: session.user.id,
                      description: originalTx.description,
                      amount: originalTx.amount,
                      type: originalTx.type,
                      category: originalTx.category,
                      payment_method: originalTx.paymentMethod,
                      date: materializedDate,
                      is_recurring: false,
                      is_paid: false,
                      is_shared: originalTx.isShared,
                      shared_with: originalTx.sharedWith,
                    });
                  }
                }

                // Avançar para o próximo mês
                if (originalTx.frequency === "monthly") {
                  currentMonth++;
                  if (currentMonth > 12) {
                    currentMonth = 1;
                    currentYear++;
                  }
                } else if (originalTx.frequency === "yearly") {
                  currentYear++;
                }
              }

              // Inserir transações materializadas no banco
              if (materializedTransactions.length > 0) {
                const { data: insertedData, error: insertError } = await supabase
                  .from("transactions")
                  .insert(materializedTransactions)
                  .select();

                if (insertError) {
                  console.error("Error materializing past transactions:", insertError);
                } else if (insertedData) {
                  // Adicionar transações materializadas ao estado local
                  const newTransactions: Transaction[] = insertedData.map((d) => ({
                    id: d.id,
                    description: d.description,
                    amount: d.amount,
                    type: d.type,
                    category: d.category,
                    paymentMethod: d.payment_method,
                    date: d.date,
                    createdAt: new Date(d.created_at).getTime(),
                    isRecurring: false,
                    isPaid: d.is_paid ?? false,
                    isShared: d.is_shared,
                    sharedWith: d.shared_with,
                  }));
                  setTransactions((prev) => [...newTransactions, ...prev]);
                }
              }

              // Atualizar a transação original com nova data E novos valores
              const updatedPayload = {
                ...dbPayload,
                date: newTx.date, // Nova data de início
              };

              const { error: updateError } = await supabase
                .from("transactions")
                .update(updatedPayload)
                .eq("id", originalTx.id);

              if (updateError) throw updateError;

              // Atualizar estado local
              const wasShared = originalTx.isShared && originalTx.sharedWith;
              const isNowShared = newTx.isShared && newTx.sharedWith;

              // Handle shared transaction income creation for recurring
              if (isNowShared && !wasShared && newTx.type === "expense") {
                const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
                const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

                const incomePayload = {
                  user_id: session.user.id,
                  description: incomeDescription,
                  amount: incomeAmount,
                  type: "income" as const,
                  category: "Other",
                  payment_method: newTx.paymentMethod,
                  date: newTx.date,
                  is_recurring: newTx.isRecurring,
                  frequency: newTx.frequency,
                  is_paid: false,
                  related_transaction_id: originalTx.id,
                };

                const { data: incomeData, error: incomeError } = await supabase
                  .from("transactions")
                  .insert(incomePayload)
                  .select()
                  .single();

                if (!incomeError && incomeData) {
                  await supabase
                    .from("transactions")
                    .update({ related_transaction_id: incomeData.id })
                    .eq("id", originalTx.id);

                  const incomeTransaction: Transaction = {
                    id: incomeData.id,
                    description: incomeData.description,
                    amount: incomeData.amount,
                    type: incomeData.type,
                    category: incomeData.category,
                    paymentMethod: incomeData.payment_method,
                    date: incomeData.date,
                    createdAt: new Date(incomeData.created_at).getTime(),
                    isRecurring: incomeData.is_recurring,
                    frequency: incomeData.frequency,
                    isPaid: incomeData.is_paid ?? false,
                    relatedTransactionId: originalTx.id,
                  };
                  setTransactions((prev) => [incomeTransaction, ...prev]);
                }
              }

              // Remove income if no longer shared
              if (wasShared && !isNowShared && originalTx.relatedTransactionId) {
                await supabase
                  .from("transactions")
                  .delete()
                  .eq("id", originalTx.relatedTransactionId);

                setTransactions((prev) =>
                  prev.filter((t) => t.id !== originalTx.relatedTransactionId)
                );
              }

              // Update existing income if still shared
              if (wasShared && isNowShared && originalTx.relatedTransactionId) {
                const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
                const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

                await supabase
                  .from("transactions")
                  .update({
                    description: incomeDescription,
                    amount: incomeAmount,
                    date: newTx.date,
                    payment_method: newTx.paymentMethod,
                  })
                  .eq("id", originalTx.relatedTransactionId);

                setTransactions((prev) =>
                  prev.map((t) =>
                    t.id === originalTx.relatedTransactionId
                      ? {
                          ...t,
                          description: incomeDescription,
                          amount: incomeAmount,
                          date: newTx.date,
                          paymentMethod: newTx.paymentMethod,
                        }
                      : t
                  )
                );
              }

              setTransactions((prev) =>
                prev.map((t) => {
                  if (t.id === originalTx.id) {
                    return {
                      ...t,
                      description: newTx.description,
                      amount: newTx.amount,
                      type: newTx.type,
                      category: newTx.category,
                      paymentMethod: newTx.paymentMethod,
                      date: newTx.date,
                      isRecurring: newTx.isRecurring,
                      frequency: newTx.frequency,
                      isShared: newTx.isShared,
                      sharedWith: newTx.sharedWith,
                    };
                  }
                  return t;
                })
              );

              return; // Early return - já tratamos o caso de recorrente + all_future
            }

            // Encontrar transações relacionadas usando installment_group_id (preferido) ou fallback por descrição
            const relatedTxs = transactions.filter((t) => {
              // Para parcelamentos com installment_group_id (novo sistema)
              if (originalTx.installments && originalTx.installments > 1) {
                if (originalTx.installmentGroupId) {
                  // Usar installment_group_id para encontrar parcelas relacionadas
                  if (t.installmentGroupId !== originalTx.installmentGroupId) return false;
                  if (editMode === "all_future") {
                    return (t.currentInstallment || 1) >= (originalTx.currentInstallment || 1);
                  }
                  return true;
                } else {
                  // Fallback para transações antigas sem installment_group_id
                  const sameDescription = t.description === originalTx.description;
                  const samePaymentMethod = t.paymentMethod === originalTx.paymentMethod;
                  const sameCategory = t.category === originalTx.category;
                  const sameInstallments = t.installments === originalTx.installments;
                  const sameType = t.type === originalTx.type;
                  
                  if (!sameDescription || !samePaymentMethod || !sameCategory || !sameType || !sameInstallments) {
                    return false;
                  }
                  if (editMode === "all_future") {
                    return (t.currentInstallment || 1) >= (originalTx.currentInstallment || 1);
                  }
                  return true;
                }
              } else if (originalTx.isRecurring) {
                // Para "all" em recorrentes, simplesmente atualiza a transação original
                return t.id === originalTx.id;
              }

              return false;
            });

            const idsToUpdate = relatedTxs.map((t) => t.id);

            const wasShared = originalTx.isShared && originalTx.sharedWith;
            const isNowShared = newTx.isShared && newTx.sharedWith;

            const { error } = await supabase
              .from("transactions")
              .update(dbPayload)
              .in("id", idsToUpdate);

            if (error) throw error;

            // Handle shared transaction income creation
            if (isNowShared && !wasShared && newTx.type === "expense") {
              const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
              const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

              const incomePayload = {
                user_id: session.user.id,
                description: incomeDescription,
                amount: incomeAmount,
                type: "income" as const,
                category: "Other",
                payment_method: newTx.paymentMethod,
                date: originalTx.date,
                is_recurring: newTx.isRecurring,
                frequency: newTx.frequency,
                is_paid: false,
                related_transaction_id: editId,
              };

              const { data: incomeData, error: incomeError } = await supabase
                .from("transactions")
                .insert(incomePayload)
                .select()
                .single();

              if (!incomeError && incomeData) {
                await supabase
                  .from("transactions")
                  .update({ related_transaction_id: incomeData.id })
                  .eq("id", editId);

                const incomeTransaction: Transaction = {
                  id: incomeData.id,
                  description: incomeData.description,
                  amount: incomeData.amount,
                  type: incomeData.type,
                  category: incomeData.category,
                  paymentMethod: incomeData.payment_method,
                  date: incomeData.date,
                  createdAt: new Date(incomeData.created_at).getTime(),
                  isRecurring: incomeData.is_recurring,
                  frequency: incomeData.frequency,
                  isPaid: incomeData.is_paid ?? false,
                  relatedTransactionId: editId,
                };
                setTransactions((prev) => [incomeTransaction, ...prev]);
              }
            }

            // Remove income if no longer shared
            if (wasShared && !isNowShared && originalTx.relatedTransactionId) {
              await supabase
                .from("transactions")
                .delete()
                .eq("id", originalTx.relatedTransactionId);

              setTransactions((prev) =>
                prev.filter((t) => t.id !== originalTx.relatedTransactionId)
              );
            }

            // Update existing income if still shared
            if (wasShared && isNowShared && originalTx.relatedTransactionId) {
              const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
              const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

              await supabase
                .from("transactions")
                .update({
                  description: incomeDescription,
                  amount: incomeAmount,
                  payment_method: newTx.paymentMethod,
                })
                .eq("id", originalTx.relatedTransactionId);

              setTransactions((prev) =>
                prev.map((t) =>
                  t.id === originalTx.relatedTransactionId
                    ? {
                        ...t,
                        description: incomeDescription,
                        amount: incomeAmount,
                        paymentMethod: newTx.paymentMethod,
                      }
                    : t
                )
              );
            }

            setTransactions((prev) =>
              prev.map((t) => {
                if (idsToUpdate.includes(t.id)) {
                  return {
                    ...t,
                    description: newTx.description,
                    amount: newTx.amount,
                    type: newTx.type,
                    category: newTx.category,
                    paymentMethod: newTx.paymentMethod,
                    isRecurring: newTx.isRecurring,
                    frequency: newTx.frequency,
                    isShared: newTx.isShared,
                    sharedWith: newTx.sharedWith,
                    relatedTransactionId:
                      t.id === editId ? t.relatedTransactionId : undefined,
                  };
                }
                return t;
              })
            );
          } else {
            // Single edit
            const singlePayload = {
              ...dbPayload,
              date: newTx.date,
              installments: newTx.installments,
              current_installment: newTx.currentInstallment,
              is_shared: newTx.isShared,
              shared_with: newTx.sharedWith,
            };

            const { data, error } = await supabase
              .from("transactions")
              .update(singlePayload)
              .eq("id", editId)
              .select()
              .single();

            if (error) throw error;

            if (data) {
              const oldTransaction = editingTransaction;
              const wasShared =
                oldTransaction?.isShared && oldTransaction?.sharedWith;
              const isNowShared = newTx.isShared && newTx.sharedWith;

              // Handle shared transaction changes (similar to bulk edit)
              if (wasShared && !isNowShared && oldTransaction?.relatedTransactionId) {
                await supabase
                  .from("transactions")
                  .delete()
                  .eq("id", oldTransaction.relatedTransactionId);

                setTransactions((prev) =>
                  prev.filter((t) => t.id !== oldTransaction.relatedTransactionId)
                );
              }

              if (isNowShared && !wasShared) {
                const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
                const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

                const incomePayload = {
                  user_id: session.user.id,
                  description: incomeDescription,
                  amount: incomeAmount,
                  type: "income" as const,
                  category: "Other",
                  payment_method: newTx.paymentMethod,
                  date: newTx.date,
                  is_recurring: false,
                  is_paid: false,
                  related_transaction_id: data.id,
                };

                const { data: incomeData, error: incomeError } = await supabase
                  .from("transactions")
                  .insert(incomePayload)
                  .select()
                  .single();

                if (!incomeError && incomeData) {
                  await supabase
                    .from("transactions")
                    .update({ related_transaction_id: incomeData.id })
                    .eq("id", data.id);

                  const incomeTransaction: Transaction = {
                    id: incomeData.id,
                    description: incomeData.description,
                    amount: incomeData.amount,
                    type: incomeData.type,
                    category: incomeData.category,
                    paymentMethod: incomeData.payment_method,
                    date: incomeData.date,
                    createdAt: new Date(incomeData.created_at).getTime(),
                    isRecurring: incomeData.is_recurring,
                    frequency: incomeData.frequency,
                    isPaid: incomeData.is_paid ?? false,
                    relatedTransactionId: data.id,
                  };
                  setTransactions((prev) => [incomeTransaction, ...prev]);
                  data.related_transaction_id = incomeData.id;
                }
              }

              if (wasShared && isNowShared && oldTransaction?.relatedTransactionId) {
                const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
                const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

                await supabase
                  .from("transactions")
                  .update({
                    description: incomeDescription,
                    amount: incomeAmount,
                    date: newTx.date,
                    payment_method: newTx.paymentMethod,
                  })
                  .eq("id", oldTransaction.relatedTransactionId);

                setTransactions((prev) =>
                  prev.map((t) =>
                    t.id === oldTransaction.relatedTransactionId
                      ? {
                          ...t,
                          description: incomeDescription,
                          amount: incomeAmount,
                          date: newTx.date,
                          paymentMethod: newTx.paymentMethod,
                        }
                      : t
                  )
                );
              }

              const transaction: Transaction = {
                id: data.id,
                description: data.description,
                amount: data.amount,
                type: data.type,
                category: data.category,
                paymentMethod: data.payment_method,
                date: data.date,
                createdAt: new Date(data.created_at).getTime(),
                isRecurring: data.is_recurring,
                frequency: data.frequency,
                installments: data.installments,
                currentInstallment: data.current_installment,
                isPaid: data.is_paid ?? true,
                isShared: data.is_shared,
                sharedWith: data.shared_with,
                relatedTransactionId: data.related_transaction_id,
                installmentGroupId: data.installment_group_id,
              };
              setTransactions((prev) =>
                prev.map((t) => (t.id === editId ? transaction : t))
              );
            }
          }
        } else if (!editId && newTx.installments && newTx.installments > 1) {
          // NEW INSTALLMENT TRANSACTION (only when NOT editing)
          // NEW INSTALLMENT TRANSACTION
          const totalInstallments = newTx.installments;
          const txAmount = newTx.amount || 0;
          const installmentAmount =
            Math.round((txAmount / totalInstallments) * 100) / 100;
          const totalFromInstallments = installmentAmount * totalInstallments;
          const remainder =
            Math.round((txAmount - totalFromInstallments) * 100) / 100;

          // Gera um UUID único para agrupar todas as parcelas deste parcelamento
          const installmentGroupId = crypto.randomUUID();

          const installmentPayloads = [];
          for (let i = 0; i < totalInstallments; i++) {
            const amount =
              i === 0 ? installmentAmount + remainder : installmentAmount;

            installmentPayloads.push({
              user_id: session.user.id,
              description: newTx.description,
              amount: amount,
              type: newTx.type,
              category: newTx.category,
              payment_method: newTx.paymentMethod,
              date: addMonths(newTx.date, i),
              is_recurring: newTx.isRecurring,
              frequency: newTx.frequency,
              installments: totalInstallments,
              current_installment: i + 1,
              is_paid: false,
              is_shared: newTx.isShared,
              shared_with: newTx.sharedWith,
              installment_group_id: installmentGroupId,
            });
          }

          const { data, error } = await supabase
            .from("transactions")
            .insert(installmentPayloads)
            .select();

          if (error) throw error;

          if (data) {
            const newTransactions: Transaction[] = data.map((d: any) => ({
              id: d.id,
              description: d.description,
              amount: d.amount,
              type: d.type,
              category: d.category,
              paymentMethod: d.payment_method,
              date: d.date,
              createdAt: new Date(d.created_at).getTime(),
              isRecurring: d.is_recurring,
              frequency: d.frequency,
              installments: d.installments,
              currentInstallment: d.current_installment,
              isPaid: d.is_paid ?? false,
              isShared: d.is_shared,
              sharedWith: d.shared_with,
              installmentGroupId: d.installment_group_id,
            }));
            setTransactions((prev) => [...newTransactions, ...prev]);

            // Create income for shared installment expenses
            if (newTx.isShared && newTx.sharedWith && newTx.type === "expense") {
              const incomePayloads = data.map((d: any) => ({
                user_id: session.user.id,
                description: `${d.description} - ${newTx.sharedWith}`,
                amount: Math.round((d.amount / 2) * 100) / 100,
                type: "income" as const,
                category: "Other",
                payment_method: d.payment_method,
                date: d.date,
                is_recurring: false,
                is_paid: false,
                installments: totalInstallments,
                current_installment: d.current_installment,
                related_transaction_id: d.id,
              }));

              const { data: incomeData, error: incomeError } = await supabase
                .from("transactions")
                .insert(incomePayloads)
                .select();

              if (!incomeError && incomeData) {
                const incomeTransactions: Transaction[] = incomeData.map(
                  (d: any) => ({
                    id: d.id,
                    description: d.description,
                    amount: d.amount,
                    type: d.type,
                    category: d.category,
                    paymentMethod: d.payment_method,
                    date: d.date,
                    createdAt: new Date(d.created_at).getTime(),
                    isRecurring: d.is_recurring,
                    frequency: d.frequency,
                    installments: d.installments,
                    currentInstallment: d.current_installment,
                    isPaid: d.is_paid ?? false,
                    relatedTransactionId: d.related_transaction_id,
                  })
                );
                setTransactions((prev) => [...incomeTransactions, ...prev]);
              }
            }
          }
        } else {
          // NEW SINGLE TRANSACTION
          const dbPayload = {
            user_id: session.user.id,
            description: newTx.description,
            amount: newTx.amount,
            type: newTx.type,
            category: newTx.category,
            payment_method: newTx.paymentMethod,
            date: newTx.date,
            is_recurring: newTx.isRecurring,
            frequency: newTx.frequency,
            installments: newTx.installments,
            current_installment: newTx.currentInstallment,
            is_paid: false,
            is_shared: newTx.isShared,
            shared_with: newTx.sharedWith,
          };

          const { data, error } = await supabase
            .from("transactions")
            .insert(dbPayload)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const transaction: Transaction = {
              id: data.id,
              description: data.description,
              amount: data.amount,
              type: data.type,
              category: data.category,
              paymentMethod: data.payment_method,
              date: data.date,
              createdAt: new Date(data.created_at).getTime(),
              isRecurring: data.is_recurring,
              frequency: data.frequency,
              installments: data.installments,
              currentInstallment: data.current_installment,
              isPaid: data.is_paid ?? false,
              isShared: data.is_shared,
              sharedWith: data.shared_with,
            };
            setTransactions((prev) => [transaction, ...prev]);

            // Create income for shared expense
            if (newTx.isShared && newTx.sharedWith && newTx.type === "expense") {
              const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
              const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

              const incomePayload = {
                user_id: session.user.id,
                description: incomeDescription,
                amount: incomeAmount,
                type: "income" as const,
                category: "Other",
                payment_method: newTx.paymentMethod,
                date: newTx.date,
                is_recurring: newTx.isRecurring,
                frequency: newTx.frequency,
                is_paid: false,
                related_transaction_id: data.id,
              };

              const { data: incomeData, error: incomeError } = await supabase
                .from("transactions")
                .insert(incomePayload)
                .select()
                .single();

              if (incomeError) {
                console.error(
                  "Error creating income for shared expense:",
                  incomeError
                );
              } else if (incomeData) {
                await supabase
                  .from("transactions")
                  .update({ related_transaction_id: incomeData.id })
                  .eq("id", data.id);

                setTransactions((prev) =>
                  prev.map((t) =>
                    t.id === data.id
                      ? { ...t, relatedTransactionId: incomeData.id }
                      : t
                  )
                );

                const incomeTransaction: Transaction = {
                  id: incomeData.id,
                  description: incomeData.description,
                  amount: incomeData.amount,
                  type: incomeData.type,
                  category: incomeData.category,
                  paymentMethod: incomeData.payment_method,
                  date: incomeData.date,
                  createdAt: new Date(incomeData.created_at).getTime(),
                  isRecurring: incomeData.is_recurring,
                  frequency: incomeData.frequency,
                  isPaid: incomeData.is_paid ?? false,
                  relatedTransactionId: data.id,
                };
                setTransactions((prev) => [incomeTransaction, ...prev]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error saving transaction:", err);
        showError("Error saving transaction. Please try again.", "Save Error");
      }
    },
    [session, transactions, setTransactions, showError]
  );

  // ============================================
  // Delete Transaction
  // ============================================
  
  const handleDeleteTransaction = useCallback(
    async (id: string) => {
      const transactionToDelete = transactions.find((t) => t.id === id);
      if (!transactionToDelete) return;

      const relatedTransaction = transactionToDelete.relatedTransactionId
        ? transactions.find(
            (t) => t.id === transactionToDelete.relatedTransactionId
          )
        : null;

      let deleteRelated = false;

      if (relatedTransaction) {
        const isExpense = transactionToDelete.type === "expense";
        const relatedType = isExpense
          ? "income (reimbursement)"
          : "original expense";
        const relatedDesc = relatedTransaction.description;

        const result = await choice({
          title: "Delete Linked Transaction",
          message: `This transaction has a related ${relatedType}:\n"${relatedDesc}"\n\nWhat would you like to do?`,
          variant: "warning",
          choices: [
            {
              label: "Delete Both",
              value: "both",
              variant: "contained",
              color: "error",
            },
            {
              label: "Delete Only This One",
              value: "this",
              variant: "outlined",
              color: "warning",
            },
          ],
        });

        if (result === null) return;
        deleteRelated = result === "both";
      } else {
        const confirmed = await confirm({
          title: "Delete Transaction",
          message:
            "Are you sure you want to delete this transaction? This action cannot be undone.",
          confirmText: "Delete",
          cancelText: "Cancel",
          variant: "danger",
        });

        if (!confirmed) return;
      }

      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id);
        if (error) throw error;

        let idsToRemove = [id];

        if (deleteRelated && relatedTransaction) {
          const { error: relatedError } = await supabase
            .from("transactions")
            .delete()
            .eq("id", relatedTransaction.id);

          if (relatedError) {
            console.error("Error deleting related transaction:", relatedError);
          } else {
            idsToRemove.push(relatedTransaction.id);
          }
        } else if (relatedTransaction) {
          await supabase
            .from("transactions")
            .update({ related_transaction_id: null })
            .eq("id", relatedTransaction.id);

          setTransactions((prev) =>
            prev.map((t) =>
              t.id === relatedTransaction.id
                ? { ...t, relatedTransactionId: undefined }
                : t
            )
          );
        }

        setTransactions((prev) =>
          prev.filter((t) => !idsToRemove.includes(t.id))
        );
      } catch (err) {
        console.error("Error deleting transaction:", err);
        showError(
          "Error deleting transaction. Please try again.",
          "Delete Error"
        );
      }
    },
    [transactions, setTransactions, confirm, choice, showError]
  );

  // ============================================
  // Toggle Paid Status
  // ============================================
  
  const handleTogglePaid = useCallback(
    async (id: string, isPaid: boolean) => {
      try {
        const { error } = await supabase
          .from("transactions")
          .update({ is_paid: isPaid })
          .eq("id", id);
        if (error) throw error;
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isPaid } : t))
        );
      } catch (err) {
        console.error("Error updating transaction:", err);
      }
    },
    [setTransactions]
  );

  // ============================================
  // Pay All Transactions
  // ============================================
  
  const handlePayAllTransactions = useCallback(
    async (paymentMethod: string, month: number, year: number) => {
      if (!session) return;

      const confirmed = await confirm({
        title: "Pagar Fatura Completa",
        message: `Deseja marcar todas as despesas não pagas de "${paymentMethod}" em ${month + 1}/${year} como pagas?`,
        confirmText: "Pagar Tudo",
        cancelText: "Cancelar",
        severity: "info",
      });

      if (!confirmed) return;

      try {
        const targetMonth = month + 1;
        const unpaidIds = transactions
          .filter((t) => {
            const [y, m] = t.date.split("-");
            return (
              t.paymentMethod === paymentMethod &&
              parseInt(y) === year &&
              parseInt(m) === targetMonth &&
              t.type === "expense" &&
              !t.isPaid &&
              !t.isVirtual
            );
          })
          .map((t) => t.id);

        if (unpaidIds.length === 0) return;

        const { error } = await supabase
          .from("transactions")
          .update({ is_paid: true })
          .in("id", unpaidIds);

        if (error) throw error;

        setTransactions((prev) =>
          prev.map((t) =>
            unpaidIds.includes(t.id) ? { ...t, isPaid: true } : t
          )
        );
      } catch (err) {
        console.error("Error paying all transactions:", err);
        showError("Erro ao marcar transações como pagas");
      }
    },
    [session, transactions, setTransactions, confirm, showError]
  );

  return {
    handleAddTransaction,
    handleDeleteTransaction,
    handleTogglePaid,
    handlePayAllTransactions,
  };
};

export default useTransactionHandlers;

