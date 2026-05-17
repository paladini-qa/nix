import React, { Suspense, lazy, useState, useCallback, useMemo } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { goalService } from "@/application/services/goalService";
import {
  CallSplit as SplitsIcon,
  Group as SharedIcon,
  Repeat as RecurringIcon,
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
import CategoryBreakdown from "@/presentation/widgets/CategoryBreakdown";
import SummaryCards from "@/presentation/widgets/SummaryCards";
import { AdvancedFiltersButton } from "@/presentation/panels/AdvancedFilters";
import type { AdvancedFiltersState } from "@/presentation/panels/AdvancedFilters";
import DashboardSkeleton from "@/presentation/components/skeletons/DashboardSkeleton";
import RecentTransactionsWidget from "@/presentation/widgets/RecentTransactionsWidget";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import { useTransactionsQuery } from "@/presentation/hooks/useTransactionsQuery";
import { useFilteredTransactions } from "@/presentation/hooks/useFilteredTransactions";
import { useCurrency, useSettings } from "@/presentation/hooks";
import { VIEW_ROUTES } from "@/presentation/routes";

const AdvancedFilters = lazy(() => import("@/presentation/panels/AdvancedFilters"));
const AnalyticsView = lazy(() => import("./AnalyticsView"));

const MOBILE_SHORTCUTS = [
  { view: "splits" as const,            icon: <SplitsIcon sx={{ fontSize: 20 }} />,       label: "Divisões",     color: "#6366f1" },
  { view: "shared" as const,            icon: <SharedIcon sx={{ fontSize: 20 }} />,        label: "Partilhas",    color: "#10b981" },
  { view: "recurring" as const,         icon: <RecurringIcon sx={{ fontSize: 20 }} />,     label: "Recorrentes",  color: "#f59e0b" },
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
  const { displayName, getCategoryColor } = useSettings();
  const navigate = useNavigate();

  const { filters, setIsFormOpen, setEditingTransaction } = useAppStore();
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
  const handlePaymentMethodClick = useCallback(
    () => navigate(VIEW_ROUTES.paymentMethods),
    [navigate]
  );
  const NOOP = useCallback(() => {}, []);

  // Receitas por categoria (para segundo painel do dashboard)
  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalService.getAll(),
  });

  const incomeCategoryRows = useMemo(() => {
    const byCategory = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {} as Record<string, number>);
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, amount]) => ({
        name,
        amount,
        color: getCategoryColor("income", name).primary,
      }));
  }, [filteredTransactions, getCategoryColor]);

  const totalIncome = incomeCategoryRows.reduce((s, r) => s + r.amount, 0);

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

      {/* Advanced filters button row */}
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

      {/* Dash grid: recent transactions (left) + expenses by category (right) */}
      <Box
        sx={{
          mt: "24px",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
          gap: "18px",
          alignItems: "start",
        }}
      >
        <RecentTransactionsWidget transactions={filteredTransactions} />
        <CategoryBreakdown
          transactions={filteredTransactions}
          onPaymentMethodClick={handlePaymentMethodClick}
          onCategoryClick={NOOP}
        />
      </Box>

      {/* Segunda linha: receitas por categoria (esquerda) + metas (direita) */}
      {(incomeCategoryRows.length > 0 || goals.length > 0) && (
        <Box
          sx={{
            mt: "18px",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: "18px",
            alignItems: "start",
          }}
        >
          {/* Receitas por categoria */}
          {incomeCategoryRows.length > 0 && (
            <Box
              sx={{
                background: theme.palette.mode === "dark" ? "#131317" : "#ffffff",
                border: `1px solid ${theme.palette.mode === "dark" ? "#27272d" : "#e4e4e7"}`,
                borderRadius: "14px",
                boxShadow: theme.palette.mode === "dark"
                  ? "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)"
                  : "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: "18px",
                  pt: "16px",
                  pb: "14px",
                  borderBottom: `1px solid ${theme.palette.mode === "dark" ? "#1c1c22" : "#f1f1f4"}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: theme.palette.mode === "dark" ? "#fafafa" : "#18181b",
                  }}
                >
                  Receitas por categoria
                </Typography>
              </Box>
              <Box sx={{ px: "18px", py: "6px" }}>
                {incomeCategoryRows.map((row) => {
                  const pct = totalIncome > 0 ? (row.amount / totalIncome) * 100 : 0;
                  const isDark = theme.palette.mode === "dark";
                  return (
                    <Box
                      key={row.name}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "36px 110px 1fr 80px",
                        gap: "12px",
                        alignItems: "center",
                        py: "8px",
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "10px",
                          background: alpha(row.color, isDark ? 0.2 : 0.14),
                          color: row.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>↑</Box>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isDark ? "#fafafa" : "#18181b",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.name}
                      </Typography>
                      <Box
                        sx={{
                          height: "8px",
                          background: isDark ? "#1c1c22" : "#f4f4f5",
                          borderRadius: "99px",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            borderRadius: "99px",
                            background: row.color,
                            width: `${pct}%`,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          color: isDark ? "#fafafa" : "#18181b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(row.amount)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Progresso das metas */}
          {goals.length > 0 && (
            <Box
              sx={{
                background: theme.palette.mode === "dark" ? "#131317" : "#ffffff",
                border: `1px solid ${theme.palette.mode === "dark" ? "#27272d" : "#e4e4e7"}`,
                borderRadius: "14px",
                boxShadow: theme.palette.mode === "dark"
                  ? "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)"
                  : "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: "18px",
                  pt: "16px",
                  pb: "14px",
                  borderBottom: `1px solid ${theme.palette.mode === "dark" ? "#1c1c22" : "#f1f1f4"}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: theme.palette.mode === "dark" ? "#fafafa" : "#18181b",
                  }}
                >
                  Progresso das metas
                </Typography>
              </Box>
              <Box sx={{ px: "18px", py: "12px" }}>
                {goals.slice(0, 3).map((g) => {
                  const isDark = theme.palette.mode === "dark";
                  const pct = g.targetAmount > 0
                    ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100)
                    : 0;
                  const color = g.color || "#a855f7";
                  return (
                    <Box key={g.id} sx={{ mb: "14px", "&:last-child": { mb: 0 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "6px" }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "9px",
                            background: alpha(color, isDark ? 0.2 : 0.14),
                            color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: 14,
                          }}
                        >
                          {g.icon || "🎯"}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: isDark ? "#fafafa" : "#18181b",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {g.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: isDark ? "#a1a1aa" : "#52525b",
                            fontVariantNumeric: "tabular-nums",
                            flexShrink: 0,
                          }}
                        >
                          {pct}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: "6px",
                          background: isDark ? "#1c1c22" : "#f4f4f5",
                          borderRadius: "99px",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            borderRadius: "99px",
                            background: color,
                            width: `${pct}%`,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          color: isDark ? "#a1a1aa" : "#52525b",
                          mt: "4px",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatCompact(g.currentAmount)} de {formatCompact(g.targetAmount)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      )}

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
