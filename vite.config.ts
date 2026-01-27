import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Detecta o ambiente de build
  // - BUILD_TARGET=mobile -> Capacitor (base: "/")
  // - VERCEL=1 -> Vercel (base: "/")
  // - Development -> "/" (para evitar problemas com lazy loading)
  // - Production -> GitHub Pages (base: "/nix/")
  const isMobile = process.env.BUILD_TARGET === "mobile";
  const isVercel = process.env.VERCEL === "1";
  const isDev = mode === "development";

  // Determina o base path baseado no ambiente
  const getBasePath = () => {
    if (isMobile || isVercel || isDev) return "/";
    return "/nix/";
  };

  return {
    base: getBasePath(),
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
      "process.env.PLUGGY_CLIENT_ID": JSON.stringify(env.PLUGGY_CLIENT_ID),
      "process.env.PLUGGY_CLIENT_SECRET": JSON.stringify(env.PLUGGY_CLIENT_SECRET),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
