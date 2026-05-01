import { QueryClient, onlineManager } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "./idbPersister";

// Conecta o onlineManager do TanStack Query aos eventos nativos do browser/Capacitor
onlineManager.setEventListener((setOnline) => {
  const handle = () => setOnline(navigator.onLine);
  window.addEventListener("online", handle);
  window.addEventListener("offline", handle);
  return () => {
    window.removeEventListener("online", handle);
    window.removeEventListener("offline", handle);
  };
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24h — mantém cache por 1 dia
      staleTime: 1000 * 60 * 5,    // 5 min — refetch em background após 5 min
      retry: 2,
      refetchOnWindowFocus: false,
      // "offlineFirst": serve do cache mesmo sem rede, tenta o network em paralelo
      networkMode: "offlineFirst",
    },
    mutations: {
      // "offlineFirst": tenta a mutação mesmo offline — o caller decide o que fazer com o erro
      networkMode: "offlineFirst",
    },
  },
});

// IDB persister: suporta muito mais que 5 MB do localStorage, e é assíncrono
const persister = createIDBPersister();

persistQueryClient({
  queryClient,
  persister,
  // Invalida o cache persistido se tiver mais de 24h
  maxAge: 1000 * 60 * 60 * 24,
});
