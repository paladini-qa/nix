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
   */
  async getByMonth(month: number, year: number): Promise<Budget[]> {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("month", month)
      .eq("year", year);

    if (error) throw error;

    return (data || []).map(mapDbToBudget);
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
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export default budgetService;


