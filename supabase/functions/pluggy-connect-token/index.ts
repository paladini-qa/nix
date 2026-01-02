// Supabase Edge Function: pluggy-connect-token
// Gera um Connect Token do Pluggy para abrir o widget de conexão

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

interface PluggyConnectTokenResponse {
  accessToken: string;
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

    // Criar cliente Supabase para verificar o usuário
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter credenciais do Pluggy
    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Pluggy credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Passo 1: Gerar API Key do Pluggy
    const apiKeyResponse = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!apiKeyResponse.ok) {
      const errorText = await apiKeyResponse.text();
      console.error("Pluggy auth error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Pluggy" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { apiKey } = (await apiKeyResponse.json()) as PluggyApiKeyResponse;

    // Passo 2: Gerar Connect Token
    // Opções do widget podem ser passadas no body da requisição
    const body = await req.json().catch(() => ({}));
    const { itemId } = body; // itemId opcional para atualizar conexão existente

    const connectTokenPayload: Record<string, unknown> = {
      // Filtrar apenas conectores de cartão de crédito
      options: {
        connectorTypes: [2], // 2 = Credit Card no Pluggy
      },
    };

    // Se itemId fornecido, é para atualizar credenciais de uma conexão existente
    if (itemId) {
      connectTokenPayload.itemId = itemId;
    }

    const connectTokenResponse = await fetch(`${PLUGGY_API_URL}/connect_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(connectTokenPayload),
    });

    if (!connectTokenResponse.ok) {
      const errorText = await connectTokenResponse.text();
      console.error("Pluggy connect token error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate connect token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { accessToken } = (await connectTokenResponse.json()) as PluggyConnectTokenResponse;

    return new Response(
      JSON.stringify({ connectToken: accessToken }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in pluggy-connect-token:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

