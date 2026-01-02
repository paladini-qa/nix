// Supabase Edge Function: pluggy-save-item
// Salva uma conexão do Pluggy após o usuário conectar uma conta

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

interface PluggyItem {
  id: string;
  connector: {
    id: number;
    name: string;
    institutionUrl: string;
    imageUrl: string;
    primaryColor: string;
    type: string;
  };
  status: string;
  executionStatus: string;
  createdAt: string;
  updatedAt: string;
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

    // Obter itemId do body
    const body = await req.json();
    const { itemId } = body;

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: "itemId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Buscar detalhes do item no Pluggy
    const itemResponse = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!itemResponse.ok) {
      const errorText = await itemResponse.text();
      console.error("Pluggy item fetch error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch item details from Pluggy" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const item = (await itemResponse.json()) as PluggyItem;

    // Buscar contas do item para determinar o tipo
    const accountsResponse = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let accountType = "credit_card";
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      if (accountsData.results && accountsData.results.length > 0) {
        accountType = accountsData.results[0].type || "credit_card";
      }
    }

    // Verificar se já existe uma conexão com este itemId
    const { data: existingConnection } = await supabaseClient
      .from("pluggy_connections")
      .select("id")
      .eq("item_id", itemId)
      .single();

    if (existingConnection) {
      // Atualizar conexão existente
      const { error: updateError } = await supabaseClient
        .from("pluggy_connections")
        .update({
          connector_name: item.connector.name,
          connector_logo: item.connector.imageUrl,
          account_type: accountType,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("item_id", itemId);

      if (updateError) {
        console.error("Error updating connection:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update connection" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Connection updated",
          connection: {
            itemId,
            connectorName: item.connector.name,
            connectorLogo: item.connector.imageUrl,
            accountType,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar nova conexão
    const { data: newConnection, error: insertError } = await supabaseClient
      .from("pluggy_connections")
      .insert({
        user_id: user.id,
        item_id: itemId,
        connector_name: item.connector.name,
        connector_logo: item.connector.imageUrl,
        account_type: accountType,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting connection:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save connection" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Connection saved",
        connection: {
          id: newConnection.id,
          itemId,
          connectorName: item.connector.name,
          connectorLogo: item.connector.imageUrl,
          accountType,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in pluggy-save-item:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

