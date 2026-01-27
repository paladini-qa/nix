import { supabase } from "../supabaseClient";
import {
  OpenFinanceConnection,
  PendingTransaction,
  PendingTransactionStatus,
} from "../../types";

/**
 * Serviço para gerenciamento de conexões Open Finance e transações pendentes
 */
export const openFinanceService = {
  // ============================================
  // CONNECTION METHODS
  // ============================================

  /**
   * Busca todas as conexões do usuário
   */
  async getConnections(userId: string): Promise<OpenFinanceConnection[]> {
    const { data, error } = await supabase
      .from("open_finance_connections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToConnection);
  },

  /**
   * Busca uma conexão específica
   */
  async getConnection(
    id: string,
    userId: string
  ): Promise<OpenFinanceConnection | null> {
    const { data, error } = await supabase
      .from("open_finance_connections")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    return data ? mapDbToConnection(data) : null;
  },

  /**
   * Busca conexão por pluggy_item_id
   */
  async getConnectionByPluggyItemId(
    pluggyItemId: string,
    userId: string
  ): Promise<OpenFinanceConnection | null> {
    const { data, error } = await supabase
      .from("open_finance_connections")
      .select("*")
      .eq("pluggy_item_id", pluggyItemId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    return data ? mapDbToConnection(data) : null;
  },

  /**
   * Cria uma nova conexão
   */
  async createConnection(
    userId: string,
    connection: {
      pluggyItemId: string;
      pluggyConnectorId: string;
      institutionName: string;
      paymentMethodId?: string | null;
    }
  ): Promise<OpenFinanceConnection> {
    const { data, error } = await supabase
      .from("open_finance_connections")
      .insert({
        user_id: userId,
        pluggy_item_id: connection.pluggyItemId,
        pluggy_connector_id: connection.pluggyConnectorId,
        institution_name: connection.institutionName,
        payment_method_id: connection.paymentMethodId || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToConnection(data);
  },

  /**
   * Atualiza uma conexão
   */
  async updateConnection(
    id: string,
    userId: string,
    updates: {
      paymentMethodId?: string | null;
      isActive?: boolean;
      lastSyncAt?: string | null;
    }
  ): Promise<OpenFinanceConnection> {
    const dbUpdates: Record<string, any> = {};

    if (updates.paymentMethodId !== undefined) {
      dbUpdates.payment_method_id = updates.paymentMethodId;
    }
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
    }
    if (updates.lastSyncAt !== undefined) {
      dbUpdates.last_sync_at = updates.lastSyncAt;
    }

    const { data, error } = await supabase
      .from("open_finance_connections")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return mapDbToConnection(data);
  },

  /**
   * Deleta uma conexão
   */
  async deleteConnection(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("open_finance_connections")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  },

  // ============================================
  // PENDING TRANSACTIONS METHODS
  // ============================================

  /**
   * Busca todas as transações pendentes do usuário
   */
  async getPendingTransactions(
    userId: string,
    options: {
      connectionId?: string;
      status?: PendingTransactionStatus;
    } = {}
  ): Promise<PendingTransaction[]> {
    let query = supabase
      .from("pending_transactions")
      .select("*")
      .eq("user_id", userId);

    if (options.connectionId) {
      query = query.eq("connection_id", options.connectionId);
    }

    if (options.status) {
      query = query.eq("status", options.status);
    } else {
      // Por padrão, busca apenas pendentes
      query = query.eq("status", "pending");
    }

    query = query.order("raw_date", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(mapDbToPendingTransaction);
  },

  /**
   * Busca uma transação pendente específica
   */
  async getPendingTransaction(
    id: string,
    userId: string
  ): Promise<PendingTransaction | null> {
    const { data, error } = await supabase
      .from("pending_transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    return data ? mapDbToPendingTransaction(data) : null;
  },

  /**
   * Busca transação pendente por pluggy_transaction_id
   */
  async getPendingTransactionByPluggyId(
    pluggyTransactionId: string,
    userId: string
  ): Promise<PendingTransaction | null> {
    const { data, error } = await supabase
      .from("pending_transactions")
      .select("*")
      .eq("pluggy_transaction_id", pluggyTransactionId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    return data ? mapDbToPendingTransaction(data) : null;
  },

  /**
   * Cria uma nova transação pendente
   * Verifica se já existe para evitar duplicatas
   */
  async createPendingTransaction(
    userId: string,
    transaction: {
      connectionId: string;
      pluggyTransactionId: string;
      rawDescription: string;
      rawAmount: number;
      rawDate: string; // YYYY-MM-DD
      rawType: "DEBIT" | "CREDIT";
    }
  ): Promise<PendingTransaction | null> {
    // Verifica se já existe
    const existing = await this.getPendingTransactionByPluggyId(
      transaction.pluggyTransactionId,
      userId
    );

    if (existing) {
      return null; // Já existe, não cria duplicata
    }

    const { data, error } = await supabase
      .from("pending_transactions")
      .insert({
        user_id: userId,
        connection_id: transaction.connectionId,
        pluggy_transaction_id: transaction.pluggyTransactionId,
        raw_description: transaction.rawDescription,
        raw_amount: transaction.rawAmount,
        raw_date: transaction.rawDate,
        raw_type: transaction.rawType,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToPendingTransaction(data);
  },

  /**
   * Cria múltiplas transações pendentes
   * Ignora duplicatas automaticamente
   */
  async createPendingTransactions(
    userId: string,
    transactions: Array<{
      connectionId: string;
      pluggyTransactionId: string;
      rawDescription: string;
      rawAmount: number;
      rawDate: string;
      rawType: "DEBIT" | "CREDIT";
    }>
  ): Promise<number> {
    let created = 0;

    // Cria uma por uma para evitar problemas com duplicatas
    for (const tx of transactions) {
      try {
        const result = await this.createPendingTransaction(userId, tx);
        if (result) created++;
      } catch (error: any) {
        // Se for erro de duplicata, ignora
        if (error.code !== "23505") {
          console.error("Error creating pending transaction:", error);
        }
      }
    }

    return created;
  },

  /**
   * Atualiza uma transação pendente
   */
  async updatePendingTransaction(
    id: string,
    userId: string,
    updates: {
      description?: string | null;
      amount?: number | null;
      date?: string | null; // YYYY-MM-DD
      type?: "income" | "expense" | null;
      category?: string | null;
      paymentMethod?: string | null;
      status?: PendingTransactionStatus;
    }
  ): Promise<PendingTransaction> {
    const dbUpdates: Record<string, any> = {};

    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from("pending_transactions")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return mapDbToPendingTransaction(data);
  },

  /**
   * Deleta uma transação pendente
   */
  async deletePendingTransaction(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("pending_transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  },

  /**
   * Conta transações pendentes
   */
  async countPendingTransactions(
    userId: string,
    connectionId?: string
  ): Promise<number> {
    let query = supabase
      .from("pending_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending");

    if (connectionId) {
      query = query.eq("connection_id", connectionId);
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  },
};

// Helper para mapear dados do banco para interface
function mapDbToConnection(data: any): OpenFinanceConnection {
  return {
    id: data.id,
    userId: data.user_id,
    pluggyItemId: data.pluggy_item_id,
    pluggyConnectorId: data.pluggy_connector_id,
    institutionName: data.institution_name,
    paymentMethodId: data.payment_method_id,
    isActive: data.is_active ?? true,
    lastSyncAt: data.last_sync_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapDbToPendingTransaction(data: any): PendingTransaction {
  return {
    id: data.id,
    userId: data.user_id,
    connectionId: data.connection_id,
    pluggyTransactionId: data.pluggy_transaction_id,
    rawDescription: data.raw_description,
    rawAmount: data.raw_amount,
    rawDate: data.raw_date,
    rawType: data.raw_type,
    description: data.description,
    amount: data.amount,
    date: data.date,
    type: data.type,
    category: data.category,
    paymentMethod: data.payment_method,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export default openFinanceService;
