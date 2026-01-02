// Supabase Edge Function: pluggy-sync
// Sincroniza transações do Pluggy para o banco de dados

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLUGGY_API_URL = "https://api.pluggy.ai";

interface PluggyApiKeyResponse {
  apiKey: string;
}

interface PluggyTransaction {
  id: string;
  description: string;
  descriptionRaw?: string;
  amount: number;
  date: string;
  category?: {
    id: string;
    description: string;
    descriptionTranslated?: string;
  };
  accountId: string;
  status?: string;
  paymentData?: {
    paymentMethod?: string;
  };
  creditCardMetadata?: {
    installmentNumber?: number;
    totalInstallments?: number;
    totalAmount?: number;
    purchaseDate?: string;
  };
  merchant?: {
    name?: string;
    businessName?: string;
    category?: string;
  };
}

interface PluggyTransactionsResponse {
  total: number;
  totalPages: number;
  page: number;
  results: PluggyTransaction[];
}

// Mapeamento de categorias do Pluggy para categorias do Nix
const CATEGORY_MAP: Record<string, string> = {
  "Food and Drink": "Food",
  "Restaurants": "Food",
  "Groceries": "Food",
  "Fast Food": "Food",
  "Coffee Shops": "Food",
  "Transportation": "Transportation",
  "Gas Stations": "Transportation",
  "Parking": "Transportation",
  "Public Transportation": "Transportation",
  "Ride Sharing": "Transportation",
  "Shopping": "Shopping",
  "Clothing": "Shopping",
  "Electronics": "Shopping",
  "Home": "Housing",
  "Utilities": "Housing",
  "Rent": "Housing",
  "Health": "Healthcare",
  "Pharmacy": "Healthcare",
  "Doctor": "Healthcare",
  "Gym": "Healthcare",
  "Entertainment": "Entertainment",
  "Movies": "Entertainment",
  "Music": "Entertainment",
  "Games": "Entertainment",
  "Streaming Services": "Subscriptions",
  "Software Subscriptions": "Subscriptions",
  "Education": "Education",
  "Books": "Education",
  "Courses": "Education",
  "Travel": "Other",
  "Hotels": "Other",
  "Airlines": "Other",
  "Insurance": "Other",
  "Financial": "Other",
  "Taxes": "Other",
  "Fees": "Other",
};

function mapCategory(pluggyCategory?: { description?: string; descriptionTranslated?: string }): string {
  if (!pluggyCategory) return "Other";
  
  const categoryName = pluggyCategory.descriptionTranslated || pluggyCategory.description || "";
  
  // Procurar correspondência no mapa
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return "Other";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar usuário
    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter parâmetros do body
    const body = await req.json().catch(() => ({}));
    const { itemId, fromDate, toDate } = body;

    // Obter credenciais do Pluggy
    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Pluggy credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Autenticar com Pluggy
    const apiKeyResponse = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!apiKeyResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Pluggy" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { apiKey } = (await apiKeyResponse.json()) as PluggyApiKeyResponse;

    // Buscar conexões do usuário
    let connectionQuery = supabaseClient
      .from("pluggy_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (itemId) {
      connectionQuery = connectionQuery.eq("item_id", itemId);
    }

    const { data: connections, error: connError } = await connectionQuery;

    if (connError || !connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: itemId ? "Connection not found" : "No active connections found",
          transactionsImported: 0,
          transactionsSkipped: 0,
        }),
        { status: itemId ? 404 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalImported = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    // Processar cada conexão
    for (const connection of connections) {
      try {
        // Atualizar status para "updating"
        await supabaseClient
          .from("pluggy_connections")
          .update({ status: "updating" })
          .eq("id", connection.id);

        // Buscar contas do item
        const accountsResponse = await fetch(
          `${PLUGGY_API_URL}/accounts?itemId=${connection.item_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": apiKey,
            },
          }
        );

        if (!accountsResponse.ok) {
          throw new Error(`Failed to fetch accounts for item ${connection.item_id}`);
        }

        const accountsData = await accountsResponse.json();
        const accounts = accountsData.results || [];

        // Buscar transações de cada conta
        for (const account of accounts) {
          // Filtrar apenas cartões de crédito
          if (account.type !== "CREDIT") continue;

          // Construir query de transações
          let transactionsUrl = `${PLUGGY_API_URL}/transactions?accountId=${account.id}&pageSize=500`;
          
          // Usar datas fornecidas ou últimos 90 dias
          const from = fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          const to = toDate || new Date().toISOString().split("T")[0];
          transactionsUrl += `&from=${from}&to=${to}`;

          const transactionsResponse = await fetch(transactionsUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": apiKey,
            },
          });

          if (!transactionsResponse.ok) {
            throw new Error(`Failed to fetch transactions for account ${account.id}`);
          }

          const transactionsData = (await transactionsResponse.json()) as PluggyTransactionsResponse;
          const transactions = transactionsData.results || [];

          // Processar cada transação
          for (const tx of transactions) {
            // Verificar se já existe (evitar duplicatas)
            const { data: existing } = await supabaseClient
              .from("transactions")
              .select("id")
              .eq("pluggy_transaction_id", tx.id)
              .single();

            if (existing) {
              totalSkipped++;
              continue;
            }

            // Determinar tipo (income ou expense)
            // No Pluggy, valores negativos são despesas, positivos são receitas
            const isExpense = tx.amount < 0;
            const type = isExpense ? "expense" : "income";
            const amount = Math.abs(tx.amount);

            // Mapear categoria
            const category = mapCategory(tx.category);

            // Determinar método de pagamento
            const paymentMethod = connection.connector_name || "Credit Card";

            // Descrição
            const description = tx.merchant?.name || tx.description || tx.descriptionRaw || "Transação Pluggy";

            // Dados de parcelamento
            const hasInstallments = tx.creditCardMetadata?.totalInstallments && tx.creditCardMetadata.totalInstallments > 1;

            // Inserir transação
            const { error: insertError } = await supabaseClient
              .from("transactions")
              .insert({
                user_id: user.id,
                description: description,
                amount: amount,
                type: type,
                category: category,
                payment_method: paymentMethod,
                date: tx.date.split("T")[0], // Formato YYYY-MM-DD
                pluggy_transaction_id: tx.id,
                is_paid: true,
                installments: hasInstallments ? tx.creditCardMetadata!.totalInstallments : null,
                current_installment: hasInstallments ? tx.creditCardMetadata!.installmentNumber : null,
              });

            if (insertError) {
              console.error("Error inserting transaction:", insertError);
              errors.push(`Failed to insert transaction ${tx.id}: ${insertError.message}`);
            } else {
              totalImported++;
            }
          }
        }

        // Atualizar status e last_sync_at
        await supabaseClient
          .from("pluggy_connections")
          .update({
            status: "active",
            last_sync_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

      } catch (error) {
        console.error(`Error processing connection ${connection.id}:`, error);
        errors.push(`Connection ${connection.connector_name}: ${error.message}`);

        // Marcar como erro
        await supabaseClient
          .from("pluggy_connections")
          .update({ status: "error" })
          .eq("id", connection.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        transactionsImported: totalImported,
        transactionsSkipped: totalSkipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in pluggy-sync:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

