import { supabase } from "../supabaseClient";
import { Budget, BudgetWithSpending, Transaction, TransactionType } from "../../types";

/**
 * Serviço para gerenciamento de orçamentos
 */
export const budgetService = {
  /**
   * Busca todos os orçamentos do usuário
   */
  async getAll(): Promise<Budget[]> {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToBudget);
  },

  /**
   * Busca orçamentos de um mês específico
   * Automaticamente gera orçamentos recorrentes se não existirem
   */
  async getByMonth(month: number, year: number): Promise<Budget[]> {
    // Primeiro, tenta gerar orçamentos recorrentes para este mês
    await this.generateRecurringBudgets(month, year);

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("month", month)
      .eq("year", year);

    if (error) throw error;

    return (data || []).map(mapDbToBudget);
  },

  /**
   * Gera orçamentos recorrentes automaticamente para um mês específico
   * Baseado nos orçamentos recorrentes de meses anteriores
   */
  async generateRecurringBudgets(month: number, year: number): Promise<Budget[]> {
    try {
      // Busca orçamentos existentes para este mês
      const { data: existingBudgets, error: existingError } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", month)
        .eq("year", year);

      if (existingError) throw existingError;

      // Se já existem orçamentos neste mês, não gera automaticamente
      if (existingBudgets && existingBudgets.length > 0) {
        return [];
      }

      // Busca o mês anterior mais recente que tem orçamentos recorrentes
      const { data: recurringBudgets, error: recurringError } = await supabase
        .from("budgets")
        .select("*")
        .eq("is_recurring", true)
        .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (recurringError) throw recurringError;

      if (!recurringBudgets || recurringBudgets.length === 0) {
        return [];
      }

      // Agrupa por categoria+tipo para pegar apenas o mais recente de cada
      const latestByCategory = new Map<string, any>();
      for (const budget of recurringBudgets) {
        const key = `${budget.type}-${budget.category}`;
        if (!latestByCategory.has(key)) {
          latestByCategory.set(key, budget);
        }
      }

      // Cria os novos orçamentos para o mês atual
      const budgetsToCreate = Array.from(latestByCategory.values()).map((b) => ({
        user_id: b.user_id,
        category: b.category,
        type: b.type,
        limit_amount: b.limit_amount,
        month: month,
        year: year,
        is_recurring: true, // Mantém como recorrente
      }));

      if (budgetsToCreate.length === 0) {
        return [];
      }

      const { data: createdBudgets, error: createError } = await supabase
        .from("budgets")
        .insert(budgetsToCreate)
        .select();

      if (createError) {
        // Se o erro for de duplicidade, apenas ignora (orçamento já existe)
        if (createError.code === "23505") {
          return [];
        }
        throw createError;
      }

      return (createdBudgets || []).map(mapDbToBudget);
    } catch (error) {
      console.error("Error generating recurring budgets:", error);
      return [];
    }
  },

  /**
   * Cria um novo orçamento
   */
  async create(
    userId: string,
    budget: Omit<Budget, "id" | "createdAt" | "updatedAt">
  ): Promise<Budget> {
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: userId,
        category: budget.category,
        type: budget.type,
        limit_amount: budget.limitAmount,
        month: budget.month,
        year: budget.year,
        is_recurring: budget.isRecurring ?? true, // Default: recorrente
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToBudget(data);
  },

  /**
   * Atualiza um orçamento existente
   */
  async update(
    id: string,
    updates: Partial<Omit<Budget, "id" | "createdAt" | "updatedAt">>
  ): Promise<Budget> {
    const dbUpdates: Record<string, any> = {};
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.limitAmount !== undefined) dbUpdates.limit_amount = updates.limitAmount;
    if (updates.month !== undefined) dbUpdates.month = updates.month;
    if (updates.year !== undefined) dbUpdates.year = updates.year;
    if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;

    const { data, error } = await supabase
      .from("budgets")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToBudget(data);
  },

  /**
   * Remove um orçamento
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Calcula orçamentos com gastos do mês
   */
  calculateWithSpending(
    budgets: Budget[],
    transactions: Transaction[]
  ): BudgetWithSpending[] {
    return budgets.map((budget) => {
      // Filtra transações do mesmo tipo e categoria
      const categoryTxs = transactions.filter(
        (t) =>
          t.type === budget.type &&
          t.category === budget.category
      );

      // Calcula total gasto
      const spent = categoryTxs.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.limitAmount - spent;
      const percentage = Math.min((spent / budget.limitAmount) * 100, 100);
      const isOverBudget = spent > budget.limitAmount;

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        isOverBudget,
      };
    });
  },

  /**
   * Copia orçamentos de um mês para outro
   */
  async copyToMonth(
    userId: string,
    fromMonth: number,
    fromYear: number,
    toMonth: number,
    toYear: number
  ): Promise<Budget[]> {
    // Busca orçamentos do mês origem
    const sourceBudgets = await this.getByMonth(fromMonth, fromYear);

    // Verifica se já existem orçamentos no destino
    const existingBudgets = await this.getByMonth(toMonth, toYear);
    const existingCategories = new Set(
      existingBudgets.map((b) => `${b.type}-${b.category}`)
    );

    // Filtra apenas orçamentos que não existem no destino
    const budgetsToCreate = sourceBudgets.filter(
      (b) => !existingCategories.has(`${b.type}-${b.category}`)
    );

    // Cria os novos orçamentos
    const created = await Promise.all(
      budgetsToCreate.map((b) =>
        this.create(userId, {
          category: b.category,
          type: b.type,
          limitAmount: b.limitAmount,
          month: toMonth,
          year: toYear,
        })
      )
    );

    return created;
  },
};

// Helper para mapear dados do banco para interface
function mapDbToBudget(data: any): Budget {
  return {
    id: data.id,
    category: data.category,
    type: data.type,
    limitAmount: data.limit_amount,
    month: data.month,
    year: data.year,
    isRecurring: data.is_recurring ?? true, // Default true para compatibilidade
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export default budgetService;





