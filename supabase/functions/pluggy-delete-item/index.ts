// Supabase Edge Function: pluggy-delete-item
// Remove uma conexão do Pluggy e deleta o item na API do Pluggy

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

    // Verificar se a conexão pertence ao usuário
    const { data: connection, error: connError } = await supabaseClient
      .from("pluggy_connections")
      .select("*")
      .eq("item_id", itemId)
      .eq("user_id", user.id)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "Connection not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter credenciais do Pluggy
    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

    if (clientId && clientSecret) {
      // Autenticar com Pluggy
      const apiKeyResponse = await fetch(`${PLUGGY_API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      });

      if (apiKeyResponse.ok) {
        const { apiKey } = (await apiKeyResponse.json()) as PluggyApiKeyResponse;

        // Deletar item no Pluggy (opcional, pode falhar se já foi deletado)
        try {
          await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": apiKey,
            },
          });
        } catch (e) {
          console.warn("Failed to delete item from Pluggy:", e);
          // Continua mesmo se falhar, pois pode já ter sido deletado
        }
      }
    }

    // Deletar conexão do banco de dados
    const { error: deleteError } = await supabaseClient
      .from("pluggy_connections")
      .delete()
      .eq("id", connection.id);

    if (deleteError) {
      console.error("Error deleting connection:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete connection" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Connection deleted successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in pluggy-delete-item:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

