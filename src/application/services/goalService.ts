import { supabase } from "@/infrastructure/database/supabaseClient";
import { Goal } from "@/domain/entities";
import { GoalInput } from "@/shared/schemas";

interface DbGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string | null;
  color: string;
  icon: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const mapDbToGoal = (row: DbGoal): Goal => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  targetAmount: Number(row.target_amount),
  currentAmount: Number(row.current_amount),
  deadline: row.deadline ?? undefined,
  category: row.category ?? undefined,
  color: row.color,
  icon: row.icon,
  isCompleted: row.is_completed,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const goalService = {
  async getAll(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbToGoal);
  },

  async create(input: GoalInput): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .insert({
        name: input.name,
        target_amount: input.targetAmount,
        current_amount: input.currentAmount ?? 0,
        color: input.color ?? "#6366f1",
        icon: input.icon ?? "savings",
        deadline: input.deadline ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDbToGoal(data);
  },

  async update(id: string, updates: Partial<GoalInput> & { isCompleted?: boolean }): Promise<Goal> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.targetAmount !== undefined) payload.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) payload.current_amount = updates.currentAmount;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline;
    if (updates.isCompleted !== undefined) payload.is_completed = updates.isCompleted;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("goals")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapDbToGoal(data);
  },

  async deposit(id: string, amount: number, targetAmount: number): Promise<Goal> {
    const newAmount = Math.min(amount, targetAmount);
    const isCompleted = newAmount >= targetAmount;

    const { data, error } = await supabase
      .from("goals")
      .update({ current_amount: newAmount, is_completed: isCompleted, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapDbToGoal(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
  },
};
