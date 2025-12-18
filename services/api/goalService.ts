import { supabase } from "../supabaseClient";
import { Goal, GoalProgress } from "../../types";

/**
 * Serviço para gerenciamento de metas financeiras
 */
export const goalService = {
  /**
   * Busca todas as metas do usuário
   */
  async getAll(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("is_completed", { ascending: true })
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToGoal);
  },

  /**
   * Busca metas ativas (não completadas)
   */
  async getActive(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("is_completed", false)
      .order("deadline", { ascending: true, nullsFirst: false });

    if (error) throw error;

    return (data || []).map(mapDbToGoal);
  },

  /**
   * Cria uma nova meta
   */
  async create(
    userId: string,
    goal: Omit<Goal, "id" | "isCompleted" | "createdAt" | "updatedAt">
  ): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        deadline: goal.deadline || null,
        category: goal.category || null,
        color: goal.color,
        icon: goal.icon,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToGoal(data);
  },

  /**
   * Atualiza uma meta existente
   */
  async update(
    id: string,
    updates: Partial<Omit<Goal, "id" | "createdAt" | "updatedAt">>
  ): Promise<Goal> {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;

    const { data, error } = await supabase
      .from("goals")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToGoal(data);
  },

  /**
   * Adiciona valor à meta
   */
  async addAmount(id: string, amount: number): Promise<Goal> {
    // Busca meta atual
    const { data: current, error: fetchError } = await supabase
      .from("goals")
      .select("current_amount, target_amount")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const newAmount = current.current_amount + amount;
    const isCompleted = newAmount >= current.target_amount;

    const { data, error } = await supabase
      .from("goals")
      .update({
        current_amount: newAmount,
        is_completed: isCompleted,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToGoal(data);
  },

  /**
   * Remove uma meta
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Calcula progresso das metas
   */
  calculateProgress(goals: Goal[]): GoalProgress[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return goals.map((goal) => {
      const percentage = Math.min(
        (goal.currentAmount / goal.targetAmount) * 100,
        100
      );
      const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);

      let daysRemaining: number | undefined;
      let isOverdue: boolean | undefined;

      if (goal.deadline) {
        const deadlineDate = new Date(goal.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const diffTime = deadlineDate.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isOverdue = daysRemaining < 0 && !goal.isCompleted;
      }

      return {
        ...goal,
        percentage,
        remainingAmount,
        daysRemaining,
        isOverdue,
      };
    });
  },
};

// Helper para mapear dados do banco para interface
function mapDbToGoal(data: any): Goal {
  return {
    id: data.id,
    name: data.name,
    targetAmount: data.target_amount,
    currentAmount: data.current_amount,
    deadline: data.deadline,
    category: data.category,
    color: data.color || "#6366f1",
    icon: data.icon || "savings",
    isCompleted: data.is_completed,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export default goalService;

