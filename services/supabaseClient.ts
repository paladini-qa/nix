import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Environment variables are injected by Vite (see vite.config.ts)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "⚠️ Supabase não configurado!\n" +
      "Crie um arquivo .env na raiz do projeto com:\n" +
      "SUPABASE_URL=sua_url_do_supabase\n" +
      "SUPABASE_ANON_KEY=sua_anon_key"
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);
