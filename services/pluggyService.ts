import { supabase } from "./supabaseClient";
import { PluggyConnection, PluggySyncResult } from "../types";

/**
 * URL base das Edge Functions do Supabase
 */
const getEdgeFunctionUrl = (functionName: string): string => {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  return `${supabaseUrl}/functions/v1/${functionName}`;
};

/**
 * Helper para fazer chamadas às Edge Functions com autenticação
 */
async function callEdgeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(getEdgeFunctionUrl(functionName), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Error calling ${functionName}`);
  }

  return data as T;
}

/**
 * Mapeia dados do banco para interface PluggyConnection
 */
function mapDbToConnection(data: any): PluggyConnection {
  return {
    id: data.id,
    itemId: data.item_id,
    connectorName: data.connector_name,
    connectorLogo: data.connector_logo,
    accountType: data.account_type,
    status: data.status,
    lastSyncAt: data.last_sync_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Serviço para integração com Pluggy Open Finance
 */
export const pluggyService = {
  /**
   * Obtém um Connect Token para abrir o widget do Pluggy
   * @param itemId - ID do item para atualizar credenciais (opcional)
   */
  async getConnectToken(itemId?: string): Promise<string> {
    const response = await callEdgeFunction<{ connectToken: string }>(
      "pluggy-connect-token",
      itemId ? { itemId } : undefined
    );
    return response.connectToken;
  },

  /**
   * Salva uma nova conexão após o usuário conectar via widget
   * @param itemId - ID do item retornado pelo widget Pluggy
   */
  async saveConnection(itemId: string): Promise<PluggyConnection> {
    const response = await callEdgeFunction<{
      success: boolean;
      connection: {
        id?: string;
        itemId: string;
        connectorName: string;
        connectorLogo?: string;
        accountType?: string;
      };
    }>("pluggy-save-item", { itemId });

    return {
      id: response.connection.id || itemId,
      itemId: response.connection.itemId,
      connectorName: response.connection.connectorName,
      connectorLogo: response.connection.connectorLogo,
      accountType: response.connection.accountType,
      status: "active",
    };
  },

  /**
   * Sincroniza transações de uma conexão específica ou todas
   * @param itemId - ID do item para sincronizar (opcional, sincroniza todas se não fornecido)
   * @param fromDate - Data inicial para buscar transações (YYYY-MM-DD)
   * @param toDate - Data final para buscar transações (YYYY-MM-DD)
   */
  async syncTransactions(
    itemId?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<PluggySyncResult> {
    const body: Record<string, unknown> = {};
    if (itemId) body.itemId = itemId;
    if (fromDate) body.fromDate = fromDate;
    if (toDate) body.toDate = toDate;

    return callEdgeFunction<PluggySyncResult>("pluggy-sync", body);
  },

  /**
   * Lista todas as conexões do usuário
   */
  async getConnections(): Promise<PluggyConnection[]> {
    const { data, error } = await supabase
      .from("pluggy_connections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbToConnection);
  },

  /**
   * Remove uma conexão
   * @param itemId - ID do item no Pluggy
   */
  async removeConnection(itemId: string): Promise<void> {
    await callEdgeFunction<{ success: boolean }>("pluggy-delete-item", {
      itemId,
    });
  },

  /**
   * Atualiza o status de uma conexão localmente
   */
  async updateConnectionStatus(
    itemId: string,
    status: PluggyConnection["status"]
  ): Promise<void> {
    const { error } = await supabase
      .from("pluggy_connections")
      .update({ status })
      .eq("item_id", itemId);

    if (error) throw error;
  },

  /**
   * Verifica se o Pluggy está configurado (Edge Functions disponíveis)
   */
  async isConfigured(): Promise<boolean> {
    try {
      // Tenta obter um connect token - se falhar com erro de credenciais,
      // significa que as Edge Functions existem mas não estão configuradas
      await this.getConnectToken();
      return true;
    } catch (error: any) {
      // Se o erro for de credenciais não configuradas, o serviço está parcialmente configurado
      if (error.message?.includes("credentials not configured")) {
        return false;
      }
      // Se for erro de autenticação, o usuário não está logado
      if (error.message?.includes("not authenticated")) {
        return false;
      }
      // Para outros erros (como função não encontrada), consideramos não configurado
      return false;
    }
  },
};

export default pluggyService;

