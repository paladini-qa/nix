import React, { Suspense, lazy, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  alpha,
} from "@mui/material";
import {
  CallSplit as SplitsIcon,
  Group as SharedIcon,
  Repeat as RecurringIcon,
  EmojiEvents as GoalsIcon,
  Savings as BudgetsIcon,
  BarChart as AnalyticsIcon,
  CalendarMonth as PlanningIcon,
  AccountBalanceWallet as AccountsIcon,
  FileUpload as ImportIcon,
  Article as FiscalIcon,
  Calculate as DebtIcon,
  TrendingUp as InvestmentsIcon,
  Star as SubscriptionsIcon,
  CreditCard as PaymentMethodsIcon,
} from "@mui/icons-material";
import CategoryBreakdown from "../widgets/CategoryBreakdown";
import SummaryCards from "../widgets/SummaryCards";
import DateFilter from "../ui/DateFilter";
import { AdvancedFiltersButton } from "../panels/AdvancedFilters";
import type { AdvancedFiltersState } from "../panels/AdvancedFilters";
import DashboardSkeleton from "../skeletons/DashboardSkeleton";
import RecentTransactionsWidget from "../widgets/RecentTransactionsWidget";
import { useAppStore } from "../../hooks/useAppStore";
import { useTransactionsQuery } from "../../hooks/useTransactionsQuery";
import { useFilteredTransactions } from "../../hooks/useFilteredTransactions";
import { useCurrency, useSettings } from "../../hooks";
import { VIEW_ROUTES } from "../../routes";

const AdvancedFilters = lazy(() => import("../panels/AdvancedFilters"));
const AnalyticsView = lazy(() => import("./AnalyticsView"));

const MOBILE_SHORTCUTS = [
  { view: "splits" as const,            icon: <SplitsIcon sx={{ fontSize: 20 }} />,       label: "Divisões",     color: "#6366f1" },
  { view: "shared" as const,            icon: <SharedIcon sx={{ fontSize: 20 }} />,        label: "Partilhas",    color: "#10b981" },
  { view: "recurring" as const,         icon: <RecurringIcon sx={{ fontSize: 20 }} />,     label: "Recorrentes",  color: "#f59e0b" },
  { view: "goals" as const,             icon: <GoalsIcon sx={{ fontSize: 20 }} />,         label: "Metas",        color: "#eab308" },
  { view: "budgets" as const,           icon: <BudgetsIcon sx={{ fontSize: 20 }} />,       label: "Orçamentos",   color: "#3b82f6" },
  { view: "analytics" as const,         icon: <AnalyticsIcon sx={{ fontSize: 20 }} />,     label: "Análises",     color: "#8b5cf6" },
  { view: "planning" as const,          icon: <PlanningIcon sx={{ fontSize: 20 }} />,      label: "Planejamento", color: "#14b8a6" },
  { view: "accounts" as const,          icon: <AccountsIcon sx={{ fontSize: 20 }} />,      label: "Contas",       color: "#06b6d4" },
  { view: "investments" as const,       icon: <InvestmentsIcon sx={{ fontSize: 20 }} />,   label: "Investimentos",color: "#22c55e" },
  { view: "subscriptions" as const,     icon: <SubscriptionsIcon sx={{ fontSize: 20 }} />, label: "Assinaturas",  color: "#ec4899" },
  { view: "paymentMethods" as const,    icon: <PaymentMethodsIcon sx={{ fontSize: 20 }} />,label: "Pagamentos",   color: "#0ea5e9" },
  { view: "import" as const,            icon: <ImportIcon sx={{ fontSize: 20 }} />,        label: "Importar",     color: "#64748b" },
  { view: "fiscal-report" as const,     icon: <FiscalIcon sx={{ fontSize: 20 }} />,        label: "Fiscal",       color: "#ef4444" },
  { view: "debt-calculator" as const,   icon: <DebtIcon sx={{ fontSize: 20 }} />,          label: "Dívidas",      color: "#f97316" },
];

const DashboardMainSection: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { format: formatCurrency, formatCompact } = useCurrency();
  const { displayName } = useSettings();
  const navigate = useNavigate();

  const { filters, setFilters, setIsFormOpen, setEditingTransaction } = useAppStore();
  const { data: transactions = [], refetch } = useTransactionsQuery();
  const { filteredTransactions, summary } = useFilteredTransactions();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    startDate: null,
    endDate: null,
    type: "all",
    categories: [],
    paymentMethods: [],
  });

  const hasAdvancedFiltersActive =
    advancedFilters.startDate !== null ||
    advancedFilters.endDate !== null ||
    advancedFilters.type !== "all" ||
    advancedFilters.categories.length > 0 ||
    advancedFilters.paymentMethods.length > 0;

  const activeFiltersCount =
    (advancedFilters.startDate || advancedFilters.endDate ? 1 : 0) +
    (advancedFilters.type !== "all" ? 1 : 0) +
    advancedFilters.categories.length +
    advancedFilters.paymentMethods.length;

  const handleToggleFilters = useCallback(() => setShowAdvancedFilters((v) => !v), []);
  const handleDateChange = useCallback(
    (month: number, year: number) => setFilters({ month, year }),
    [setFilters]
  );
  const handlePaymentMethodClick = useCallback(
    () => navigate(VIEW_ROUTES.paymentMethods),
    [navigate]
  );
  const NOOP = useCallback(() => {}, []);

  const firstName = displayName ? displayName.split(" ")[0] : t("dashboard.title");
  const monthLabel = new Date(filters.year, filters.month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Box sx={{ px: { xs: 0, md: "28px" }, pt: { xs: 0, md: "24px" }, pb: { xs: 0, md: "60px" } }}>
      {/* Mobile balance hero */}
      {isMobile && (
        <>
          <Box
            sx={{
              mb: 2,
              p: 2.5,
              background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
              color: "white",
              borderRadius: "20px",
              boxShadow: "0 12px 40px -8px rgba(168,85,247,0.45)",
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: "uppercase", letterSpacing: ".08em" }}>
              {monthLabel}
            </Typography>
            <Typography sx={{ fontSize: 30, fontWeight: 800, mt: 0.5, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {formatCurrency(summary.balance)}
            </Typography>
            <Stack direction="row" spacing={3} mt={1.5} alignItems="center">
              <Box>
                <Typography sx={{ fontSize: 10, opacity: 0.8, mb: 0.25 }}>Receitas</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>+{formatCompact(summary.totalIncome)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, opacity: 0.8, mb: 0.25 }}>Despesas</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>−{formatCompact(summary.totalExpense)}</Typography>
              </Box>
            </Stack>
          </Box>

          {/* Shortcuts carousel */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              overflowX: "auto",
              pb: 1.5,
              mx: -2,
              px: 2,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {MOBILE_SHORTCUTS.map(({ view, icon, label, color }) => (
              <Box
                key={view}
                component="button"
                type="button"
                onClick={() => navigate(VIEW_ROUTES[view])}
                sx={{
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.75,
                  px: 0.5,
                  py: 0,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  transition: "all 0.18s ease",
                  "&:active": { transform: "scale(0.93)", opacity: 0.85 },
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "16px",
                    background: alpha(color, theme.palette.mode === "dark" ? 0.3 : 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: color,
                  }}
                >
                  {icon}
                </Box>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: "text.secondary", whiteSpace: "nowrap" }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Page head — desktop only shows welcome text */}
      {!isMobile && (
        <Box sx={{ mb: "22px" }}>
          <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {t("dashboard.welcomeWithName", { name: firstName })}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            {t("dashboard.subtitle")}
          </Typography>
        </Box>
      )}

      {/* Summary cards — desktop only */}
      {!isMobile && (
        <Box sx={{ mb: "22px" }}>
          <SummaryCards
            summary={summary}
            transactions={transactions}
            selectedMonth={filters.month}
            selectedYear={filters.year}
          />
        </Box>
      )}

      {/* Filters row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          mb: "22px",
          flexWrap: "wrap",
          justifyContent: { xs: "flex-start", md: "flex-end" },
        }}
      >
        <AdvancedFiltersButton
          hasActiveFilters={hasAdvancedFiltersActive}
          activeFiltersCount={activeFiltersCount}
          showFilters={showAdvancedFilters}
          onToggleFilters={handleToggleFilters}
        />
        <DateFilter
          month={filters.month}
          year={filters.year}
          onDateChange={handleDateChange}
          showIcon
          disabled={hasAdvancedFiltersActive}
        />
      </Box>

      <Suspense fallback={null}>
        <AdvancedFilters
          transactions={transactions}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          showFilters={showAdvancedFilters}
          onToggleFilters={handleToggleFilters}
        />
      </Suspense>

      {/* Recent transactions */}
      <Box sx={{ mt: "24px" }}>
        <RecentTransactionsWidget transactions={filteredTransactions} />
      </Box>

      {/* Category breakdown charts */}
      <Box sx={{ mt: "18px" }}>
        <CategoryBreakdown
          transactions={filteredTransactions}
          onPaymentMethodClick={handlePaymentMethodClick}
          onCategoryClick={NOOP}
        />
      </Box>

      {/* Analytics section */}
      <Box sx={{ mt: "18px" }}>
        <Suspense fallback={<DashboardSkeleton />}>
          <AnalyticsView
            transactions={filteredTransactions}
            hasAdvancedFilters={hasAdvancedFiltersActive}
            advancedFilters={advancedFilters}
            onCategoryClick={NOOP}
          />
        </Suspense>
      </Box>
    </Box>
  );
};

export default DashboardMainSection;
