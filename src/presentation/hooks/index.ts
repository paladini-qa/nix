// Hooks customizados para o Nix
export { useLocalStorage } from "@/presentation/hooks/useLocalStorage";
export { useCurrency } from "@/presentation/hooks/useCurrency";
export { useFilters, type ExtendedFilterState } from "@/presentation/hooks/useFilters";
export { useTransactions } from "@/presentation/hooks/useTransactions";
export { useSettings, type UserSettings } from "@/presentation/hooks/useSettings";
export { useFormValidation } from "@/presentation/hooks/useFormValidation";
export { useTransactionHandlers } from "@/presentation/hooks/useTransactionHandlers";
export { useResponsiveModal, useModalProps } from "@/presentation/hooks/useResponsiveModal";
export { useSwipeActions, type SwipeActionsConfig, type SwipeActionsReturn } from "@/presentation/hooks/useSwipeActions";
export { usePullToRefresh, type PullToRefreshConfig, type PullToRefreshReturn } from "@/presentation/hooks/usePullToRefresh";
export { usePrivacyMode } from "@/presentation/hooks/usePrivacyMode";
export { useLayoutSpacing, type LayoutSpacing } from "@/presentation/hooks/useLayoutSpacing";
export { useCancelledSubscriptions } from "@/presentation/hooks/useCancelledSubscriptions";
export { useNotifications } from "@/presentation/hooks/useNotifications";

