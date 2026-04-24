import { supabase } from "../supabaseClient";
import { Tag, TagWithCount } from "../../types";

/**
 * Serviço para gerenciamento de tags
 */
export const tagService = {
  /**
   * Busca todas as tags do usuário
   */
  async getAll(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return (data || []).map(mapDbToTag);
  },

  /**
   * Busca tags com contagem de transações
   */
  async getAllWithCount(): Promise<TagWithCount[]> {
    const { data, error } = await supabase
      .from("tags")
      .select(`
        *,
        transaction_tags(count)
      `)
      .order("name", { ascending: true });

    if (error) throw error;

    return (data || []).map((d: any) => ({
      ...mapDbToTag(d),
      transactionCount: d.transaction_tags?.[0]?.count || 0,
    }));
  },

  /**
   * Busca tags de uma transação
   */
  async getByTransaction(transactionId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from("transaction_tags")
      .select("tag:tags(*)")
      .eq("transaction_id", transactionId);

    if (error) throw error;

    return (data || []).map((d: any) => mapDbToTag(d.tag));
  },

  /**
   * Cria uma nova tag
   */
  async create(userId: string, tag: Omit<Tag, "id" | "createdAt">): Promise<Tag> {
    const { data, error } = await supabase
      .from("tags")
      .insert({
        user_id: userId,
        name: tag.name,
        color: tag.color,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToTag(data);
  },

  /**
   * Atualiza uma tag
   */
  async update(id: string, updates: Partial<Omit<Tag, "id" | "createdAt">>): Promise<Tag> {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.color !== undefined) dbUpdates.color = updates.color;

    const { data, error } = await supabase
      .from("tags")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToTag(data);
  },

  /**
   * Remove uma tag
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Adiciona tag a uma transação
   */
  async addToTransaction(transactionId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from("transaction_tags")
      .insert({
        transaction_id: transactionId,
        tag_id: tagId,
      });

    if (error && error.code !== "23505") throw error; // Ignora duplicatas
  },

  /**
   * Remove tag de uma transação
   */
  async removeFromTransaction(transactionId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from("transaction_tags")
      .delete()
      .eq("transaction_id", transactionId)
      .eq("tag_id", tagId);

    if (error) throw error;
  },

  /**
   * Define tags de uma transação (substitui todas)
   */
  async setTransactionTags(transactionId: string, tagIds: string[]): Promise<void> {
    // Remove todas as tags existentes
    const { error: deleteError } = await supabase
      .from("transaction_tags")
      .delete()
      .eq("transaction_id", transactionId);

    if (deleteError) throw deleteError;

    // Adiciona novas tags
    if (tagIds.length > 0) {
      const inserts = tagIds.map((tagId) => ({
        transaction_id: transactionId,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase
        .from("transaction_tags")
        .insert(inserts);

      if (insertError) throw insertError;
    }
  },

  /**
   * Busca ou cria uma tag pelo nome
   */
  async getOrCreate(userId: string, name: string, color?: string): Promise<Tag> {
    // Tenta buscar existente
    const { data: existing } = await supabase
      .from("tags")
      .select("*")
      .eq("name", name)
      .single();

    if (existing) {
      return mapDbToTag(existing);
    }

    // Cria nova
    return this.create(userId, {
      name,
      color: color || generateRandomColor(),
    });
  },
};

// Helper para mapear dados do banco
function mapDbToTag(data: any): Tag {
  return {
    id: data.id,
    name: data.name,
    color: data.color || "#6366f1",
    createdAt: data.created_at,
  };
}

// Gera cor aleatória
function generateRandomColor(): string {
  const colors = [
    "#6366f1", "#ec4899", "#10b981", "#f59e0b",
    "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default tagService;





