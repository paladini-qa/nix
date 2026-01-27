import { supabase } from "../supabaseClient";
import { Planning, PlanningItem, PlanningWithItems, Transaction } from "../../types";

/**
 * Serviço para gerenciamento de planejamentos
 */
export const planningService = {
  /**
   * Busca todos os planejamentos do usuário com seus itens
   */
  async getAll(): Promise<PlanningWithItems[]> {
    const { data: plannings, error: planningsError } = await supabase
      .from("plannings")
      .select("*")
      .order("created_at", { ascending: false });

    if (planningsError) throw planningsError;

    if (!plannings || plannings.length === 0) {
      return [];
    }

    // Busca os itens de cada planejamento
    const planningIds = plannings.map((p) => p.id);
    const { data: items, error: itemsError } = await supabase
      .from("planning_items")
      .select("*")
      .in("planning_id", planningIds)
      .order("created_at", { ascending: true });

    if (itemsError) throw itemsError;

    // Agrupa itens por planejamento
    const itemsByPlanning = new Map<string, PlanningItem[]>();
    (items || []).forEach((item) => {
      const planningId = item.planning_id;
      if (!itemsByPlanning.has(planningId)) {
        itemsByPlanning.set(planningId, []);
      }
      itemsByPlanning.get(planningId)!.push(mapDbToPlanningItem(item));
    });

    // Monta os planejamentos com seus itens
    return plannings.map((p) => {
      const items = itemsByPlanning.get(p.id) || [];
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      return {
        ...mapDbToPlanning(p),
        items,
        totalAmount,
      };
    });
  },

  /**
   * Busca um planejamento específico com seus itens
   */
  async getById(id: string): Promise<PlanningWithItems | null> {
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("*")
      .eq("id", id)
      .single();

    if (planningError) {
      if (planningError.code === "PGRST116") return null; // Not found
      throw planningError;
    }

    if (!planning) return null;

    const { data: items, error: itemsError } = await supabase
      .from("planning_items")
      .select("*")
      .eq("planning_id", id)
      .order("created_at", { ascending: true });

    if (itemsError) throw itemsError;

    const planningItems = (items || []).map(mapDbToPlanningItem);
    const totalAmount = planningItems.reduce((sum, item) => sum + item.amount, 0);

    return {
      ...mapDbToPlanning(planning),
      items: planningItems,
      totalAmount,
    };
  },

  /**
   * Cria um novo planejamento
   */
  async create(
    userId: string,
    planning: Omit<Planning, "id" | "createdAt" | "updatedAt">
  ): Promise<Planning> {
    const { data, error } = await supabase
      .from("plannings")
      .insert({
        user_id: userId,
        name: planning.name,
        description: planning.description || null,
        target_date: planning.targetDate || null,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToPlanning(data);
  },

  /**
   * Atualiza um planejamento existente
   */
  async update(
    id: string,
    updates: Partial<Omit<Planning, "id" | "createdAt" | "updatedAt">>
  ): Promise<Planning> {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate || null;

    const { data, error } = await supabase
      .from("plannings")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToPlanning(data);
  },

  /**
   * Remove um planejamento (e todos os seus itens via CASCADE)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("plannings").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Adiciona um item a um planejamento
   */
  async addItem(
    planningId: string,
    item: Omit<PlanningItem, "id" | "planningId" | "createdAt" | "updatedAt">
  ): Promise<PlanningItem> {
    const { data, error } = await supabase
      .from("planning_items")
      .insert({
        planning_id: planningId,
        description: item.description,
        amount: item.amount,
        category: item.category,
        payment_method: item.paymentMethod,
        date: item.date || null,
        notes: item.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToPlanningItem(data);
  },

  /**
   * Atualiza um item de planejamento
   */
  async updateItem(
    id: string,
    updates: Partial<Omit<PlanningItem, "id" | "planningId" | "createdAt" | "updatedAt">>
  ): Promise<PlanningItem> {
    const dbUpdates: Record<string, any> = {};
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.date !== undefined) dbUpdates.date = updates.date || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

    const { data, error } = await supabase
      .from("planning_items")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToPlanningItem(data);
  },

  /**
   * Remove um item de planejamento
   */
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from("planning_items").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Transforma um item de planejamento em transação
   */
  async convertItemToTransaction(
    userId: string,
    itemId: string,
    date?: string
  ): Promise<Transaction> {
    // Busca o item
    const { data: item, error: itemError } = await supabase
      .from("planning_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError) throw itemError;

    // Busca o planejamento para pegar a data alvo
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("target_date")
      .eq("id", item.planning_id)
      .single();

    if (planningError) throw planningError;

    const transactionDate = date || item.date || planning.target_date || new Date().toISOString().split("T")[0];

    // Cria a transação
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        description: item.description,
        amount: item.amount,
        type: "expense",
        category: item.category,
        payment_method: item.payment_method,
        date: transactionDate,
        is_paid: false,
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Remove o item do planejamento
    await this.deleteItem(itemId);

    return {
      id: transaction.id,
      description: transaction.description,
      amount: parseFloat(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      paymentMethod: transaction.payment_method,
      date: transaction.date,
      createdAt: new Date(transaction.created_at).getTime(),
      isPaid: transaction.is_paid ?? false,
    };
  },

  /**
   * Transforma todos os itens de um planejamento em transações
   */
  async convertPlanningToTransactions(
    userId: string,
    planningId: string,
    date?: string
  ): Promise<Transaction[]> {
    // Busca o planejamento com seus itens
    const planning = await this.getById(planningId);
    if (!planning) {
      throw new Error("Planning not found");
    }

    const transactionDate = date || planning.targetDate || new Date().toISOString().split("T")[0];

    // Cria todas as transações
    const transactionsToCreate = planning.items.map((item) => ({
      user_id: userId,
      description: item.description,
      amount: item.amount,
      type: "expense" as const,
      category: item.category,
      payment_method: item.paymentMethod,
      date: item.date || transactionDate,
      is_paid: false,
    }));

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .insert(transactionsToCreate)
      .select();

    if (transactionsError) throw transactionsError;

    // Remove todos os itens do planejamento
    await Promise.all(planning.items.map((item) => this.deleteItem(item.id)));

    // Opcionalmente, remove o planejamento vazio
    // await this.delete(planningId);

    return (transactions || []).map((t) => ({
      id: t.id,
      description: t.description,
      amount: parseFloat(t.amount),
      type: t.type,
      category: t.category,
      paymentMethod: t.payment_method,
      date: t.date,
      createdAt: new Date(t.created_at).getTime(),
      isPaid: t.is_paid ?? false,
    }));
  },
};

// Helper para mapear dados do banco para interface Planning
function mapDbToPlanning(data: any): Planning {
  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    targetDate: data.target_date || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// Helper para mapear dados do banco para interface PlanningItem
function mapDbToPlanningItem(data: any): PlanningItem {
  return {
    id: data.id,
    planningId: data.planning_id,
    description: data.description,
    amount: parseFloat(data.amount),
    category: data.category,
    paymentMethod: data.payment_method,
    date: data.date || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export default planningService;
