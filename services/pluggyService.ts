import {
  PluggyConnector,
  PluggyItem,
  PluggyTransaction,
  PluggyAccount,
} from "../types";

// URLs fixas da API Pluggy
const PLUGGY_API_URL = "https://api.pluggy.ai";
const PLUGGY_CONNECT_URL = "https://connect.pluggy.ai";

// Cache para access token (expira em 1 hora)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

// Cache para conectores (atualizar a cada 24h)
let cachedConnectors: PluggyConnector[] | null = null;
let connectorsCacheExpiresAt: number = 0;

/**
 * Autentica na API Pluggy usando Client Credentials
 * Retorna um access token válido
 */
async function getAccessToken(): Promise<string> {
  // Verifica se o token em cache ainda é válido (com margem de 5 minutos)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  // Vite injeta variáveis de ambiente através do define no vite.config.ts
  // process.env é substituído em tempo de build pelo Vite
  // @ts-ignore - process.env é substituído pelo Vite em tempo de build
  const clientId = process.env.PLUGGY_CLIENT_ID || "";
  // @ts-ignore - process.env é substituído pelo Vite em tempo de build
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Pluggy credentials not configured. Please set PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET in your .env file."
    );
  }

  try {
    const response = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to authenticate with Pluggy: ${error.message || response.statusText}`
      );
    }

    const data = await response.json();
    cachedAccessToken = data.apiKey;
    // Tokens Pluggy geralmente expiram em 1 hora
    tokenExpiresAt = Date.now() + 60 * 60 * 1000;

    return cachedAccessToken;
  } catch (error: any) {
    console.error("Error authenticating with Pluggy:", error);
    throw error;
  }
}

/**
 * Faz uma requisição autenticada para a API Pluggy
 */
async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();

  const response = await fetch(`${PLUGGY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      "X-API-KEY": token,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Pluggy API error: ${error.message || response.statusText} (${response.status})`
    );
  }

  return response;
}

/**
 * Retry logic para requisições
 */
async function retryFetch<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError || new Error("Failed after retries");
}

/**
 * Serviço para integração com Pluggy API
 */
export const pluggyService = {
  /**
   * Lista todos os conectores disponíveis
   * Filtra apenas conectores de cartão de crédito
   */
  async getConnectors(): Promise<PluggyConnector[]> {
    // Verifica cache (válido por 24 horas)
    if (cachedConnectors && Date.now() < connectorsCacheExpiresAt) {
      return cachedConnectors.filter((c) => c.type === "CREDIT_CARD");
    }

    try {
      const response = await retryFetch(() =>
        authenticatedFetch("/connectors")
      );
      const data = await response.json();

      // Filtra apenas conectores de cartão de crédito
      const creditCardConnectors = (data.results || []).filter(
        (connector: PluggyConnector) => connector.type === "CREDIT_CARD"
      );

      // Atualiza cache
      cachedConnectors = data.results || [];
      connectorsCacheExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

      return creditCardConnectors;
    } catch (error: any) {
      console.error("Error fetching connectors:", error);
      throw error;
    }
  },

  /**
   * Lista todos os conectores disponíveis sem filtro
   * Útil para Open Finance onde queremos permitir todos os tipos
   */
  async getAllConnectors(): Promise<PluggyConnector[]> {
    // Verifica cache (válido por 24 horas)
    if (cachedConnectors && Date.now() < connectorsCacheExpiresAt) {
      return cachedConnectors;
    }

    try {
      const response = await retryFetch(() =>
        authenticatedFetch("/connectors")
      );
      const data = await response.json();

      // Atualiza cache
      cachedConnectors = data.results || [];
      connectorsCacheExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

      return cachedConnectors;
    } catch (error: any) {
      console.error("Error fetching all connectors:", error);
      throw error;
    }
  },

  /**
   * Cria um connect token para iniciar o fluxo de conexão
   * Permite criar token sem connectorId para que o usuário escolha o banco no widget
   */
  async createConnectToken(
    connectorId?: string,
    clientUserId?: string
  ): Promise<{ connectToken: string; connectUrl: string }> {
    try {
      const requestBody: any = {
        ...(clientUserId && { clientUserId }),
      };

      // Se connectorId foi fornecido, inclui no body
      // Se não, o usuário poderá escolher o banco dentro do widget da Pluggy
      if (connectorId) {
        requestBody.connectorId = connectorId;
      }

      console.log("Creating connect token with:", { 
        hasConnectorId: !!connectorId, 
        connectorId: connectorId || "none (user will choose)",
        hasClientUserId: !!clientUserId 
      });

      const response = await retryFetch(() =>
        authenticatedFetch("/connect_token", {
          method: "POST",
          body: JSON.stringify(requestBody),
        })
      );

      const data = await response.json();
      console.log("Pluggy connect_token response:", data);
      
      // A API Pluggy retorna 'accessToken' ao invés de 'connectToken'
      const connectToken = data.accessToken || data.connectToken;
      
      // Valida se o token foi retornado
      if (!connectToken) {
        console.error("Pluggy API response (missing token):", data);
        throw new Error(
          `Connect token não foi retornado pela API Pluggy. Response: ${JSON.stringify(data)}`
        );
      }
      
      // Não codifica o token - tokens JWT são seguros para passar diretamente na URL
      // A codificação pode causar problemas com a validação do token pela Pluggy
      const connectUrl = `${PLUGGY_CONNECT_URL}?connectToken=${connectToken}`;
      
      console.log("Connect URL generated:", connectUrl.substring(0, 100) + "...");
      console.log("Token length:", connectToken.length);
      console.log("Token starts with:", connectToken.substring(0, 20));
      
      return {
        connectToken,
        connectUrl,
      };
    } catch (error: any) {
      console.error("Error creating connect token:", error);
      throw error;
    }
  },

  /**
   * Busca informações de um item (conexão)
   */
  async getItem(itemId: string): Promise<PluggyItem> {
    try {
      const response = await retryFetch(() =>
        authenticatedFetch(`/items/${itemId}`)
      );
      return await response.json();
    } catch (error: any) {
      console.error("Error fetching item:", error);
      throw error;
    }
  },

  /**
   * Inicia sincronização de um item
   */
  async syncItem(itemId: string): Promise<PluggyItem> {
    try {
      const response = await retryFetch(() =>
        authenticatedFetch(`/items/${itemId}/sync`, {
          method: "POST",
        })
      );
      return await response.json();
    } catch (error: any) {
      console.error("Error syncing item:", error);
      throw error;
    }
  },

  /**
   * Aguarda até que o item esteja sincronizado
   * Faz polling até o status ser UPDATED ou ocorrer erro
   */
  async waitForItemSync(
    itemId: string,
    maxWaitTime = 120000, // 2 minutos
    pollInterval = 2000 // 2 segundos
  ): Promise<PluggyItem> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const item = await this.getItem(itemId);

      if (item.status === "UPDATED") {
        return item;
      }

      if (item.status === "LOGIN_ERROR" || item.status === "USER_INPUT_ERROR") {
        throw new Error(
          item.error?.message || `Item sync failed with status: ${item.status}`
        );
      }

      // Aguarda antes do próximo poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Timeout waiting for item sync");
  },

  /**
   * Busca contas de um item
   * Filtra apenas contas de cartão de crédito
   */
  async getAccounts(itemId: string): Promise<PluggyAccount[]> {
    try {
      const response = await retryFetch(() =>
        authenticatedFetch(`/accounts?itemId=${itemId}`)
      );
      const data = await response.json();

      // Filtra apenas contas de cartão de crédito
      return (data.results || []).filter(
        (account: PluggyAccount) => account.type === "CREDIT"
      );
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      throw error;
    }
  },

  /**
   * Busca transações de um item
   * Filtra apenas transações de contas de cartão de crédito
   */
  async getTransactions(
    itemId: string,
    options: {
      from?: string; // ISO date string
      to?: string; // ISO date string
      pageSize?: number;
      page?: number;
    } = {}
  ): Promise<{ results: PluggyTransaction[]; total: number; page: number; totalPages: number }> {
    try {
      // Primeiro, busca as contas de cartão de crédito
      const accounts = await this.getAccounts(itemId);
      const accountIds = accounts.map((a) => a.id);

      if (accountIds.length === 0) {
        return { results: [], total: 0, page: 1, totalPages: 0 };
      }

      // Constrói query params
      const params = new URLSearchParams({
        itemId,
        pageSize: String(options.pageSize || 500),
        page: String(options.page || 1),
      });

      if (options.from) params.append("from", options.from);
      if (options.to) params.append("to", options.to);

      const response = await retryFetch(() =>
        authenticatedFetch(`/transactions?${params.toString()}`)
      );
      const data = await response.json();

      // Filtra apenas transações das contas de cartão de crédito
      const creditCardTransactions = (data.results || []).filter(
        (tx: PluggyTransaction) => accountIds.includes(tx.accountId)
      );

      return {
        results: creditCardTransactions,
        total: creditCardTransactions.length,
        page: data.page || 1,
        totalPages: data.totalPages || 1,
      };
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  },

  /**
   * Deleta um item (conexão)
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      await retryFetch(() =>
        authenticatedFetch(`/items/${itemId}`, {
          method: "DELETE",
        })
      );
    } catch (error: any) {
      console.error("Error deleting item:", error);
      throw error;
    }
  },
};

export default pluggyService;
