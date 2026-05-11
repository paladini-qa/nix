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
  paymentMethods: "/payment-methods",
  categories: "/categories",
  budgets: "/budgets",
  analytics: "/analytics",
  planning: "/planning",
  accounts: "/accounts",
  import: "/import",
  "fiscal-report": "/fiscal-report",
  "debt-calculator": "/debt-calculator",
  investments: "/investments",
  subscriptions: "/subscriptions",
  notifications: "/notifications",
  paymentGuide: "/payment-guide",
};

/**
 * Mapeamento reverso: path de URL → view da aplicação.
 */
export const ROUTE_VIEWS: Record<string, AppCurrentView> = Object.fromEntries(
  Object.entries(VIEW_ROUTES).map(([view, path]) => [path, view as AppCurrentView])
);
