import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables are injected by Vite (see vite.config.ts)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Flag para verificar se Supabase está configurado
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase não configurado!\n" +
      "Crie um arquivo .env na raiz do projeto com:\n" +
      "SUPABASE_URL=sua_url_do_supabase\n" +
      "SUPABASE_ANON_KEY=sua_anon_key"
  );
}

// Cria o cliente apenas se as credenciais estiverem disponíveis
// Caso contrário, usa um placeholder URL para evitar crash
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
