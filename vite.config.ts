import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lê a versão base do package.json
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8"));
const baseVersion = pkg.version.split(".").slice(0, 2).join(".");

// Obtém o número de commits para gerar a versão
const getVersion = () => {
  try {
    const count = execSync("git rev-list --count HEAD").toString().trim();
    return `${baseVersion}.${count}`;
  } catch (e) {
    return `${baseVersion}.0`;
  }
};

const APP_VERSION = getVersion();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  const isMobile = process.env.BUILD_TARGET === "mobile";
  const isVercel = process.env.VERCEL === "1";
  const isDev = mode === "development";

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
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules/recharts")) return "recharts";
            if (id.includes("node_modules/@mui/material") || id.includes("node_modules/@mui/icons-material")) return "mui";
            if (id.includes("node_modules/framer-motion")) return "framer-motion";
            if (id.includes("node_modules/@supabase/supabase-js")) return "supabase";
          },
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: "Nix Finance",
          short_name: "Nix",
          description: "Smart Personal Finance Manager",
          theme_color: "#7C3AED",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(env.SUPABASE_ANON_KEY),
      "process.env.PLUGGY_CLIENT_ID": JSON.stringify(env.PLUGGY_CLIENT_ID),
      "process.env.PLUGGY_CLIENT_SECRET": JSON.stringify(env.PLUGGY_CLIENT_SECRET),
      "process.env.APP_VERSION": JSON.stringify(APP_VERSION),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
