import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Detecta se é build para mobile (Capacitor) ou web (GitHub Pages)
  // Use: npm run build:mobile para Capacitor
  // Use: npm run build para GitHub Pages
  const isMobile = process.env.BUILD_TARGET === "mobile";

  return {
    // Para GitHub Pages: "/nix/", para Capacitor: "/"
    base: isMobile ? "/" : "/nix/",
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(env.SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
