import type { AppCurrentView } from "./types/appView";

/**
 * Mapeamento bidirecional entre views da aplicação e paths de URL.
 * Fonte central de verdade para roteamento.
 */
export const VIEW_ROUTES: Record<AppCurrentView, string> = {
  dashboard: "/dashboard",
  transactions: "/transactions",
  splits: "/splits",
  shared: "/shared",
  recurring: "/recurring",
  nixai: "/nixai",
  batchRegistration: "/batch",
  paymentMethods: "/payment-methods",
  categories: "/categories",
};

/**
 * Mapeamento reverso: path de URL → view da aplicação.
 */
export const ROUTE_VIEWS: Record<string, AppCurrentView> = Object.fromEntries(
  Object.entries(VIEW_ROUTES).map(([view, path]) => [path, view as AppCurrentView])
);
