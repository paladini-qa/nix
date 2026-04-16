/**
 * Single source of truth for main app navigation views.
 * Use this type in Sidebar, MobileNavigation, AppContent, and GlobalSearch.
 */
export type AppCurrentView =
  | "dashboard"
  | "batchRegistration"
  | "transactions"
  | "splits"
  | "shared"
  | "recurring"
  | "nixai"
  | "paymentMethods"
  | "categories"
  | "goals"
  | "budgets"
  | "analytics"
  | "planning"
  | "accounts"
  | "import"
  | "fiscal-report"
  | "debt-calculator";
