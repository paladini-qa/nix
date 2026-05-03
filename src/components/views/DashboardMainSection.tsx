import React, { Suspense, lazy, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  alpha,
} from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import SummaryCards from "../widgets/SummaryCards";
import CategoryBreakdown from "../widgets/CategoryBreakdown";
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

const DashboardMainSection: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { format: formatCurrency, formatCompact } = useCurrency();
  const { displayName } = useSettings();
  const navigate = useNavigate();

  const { filters, setFilters, setIsFormOpen, setEditingTransaction } = useAppStore();
  const { data: transactions = [], isRefetching, refetch } = useTransactionsQuery();
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

  const onNewTransaction = useCallback(() => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  }, [setEditingTransaction, setIsFormOpen]);

  const handleToggleFilters = useCallback(() => setShowAdvancedFilters((v) => !v), []);
  const handleDateChange = useCallback(
    (month: number, year: number) => setFilters({ month, year }),
    [setFilters]
  );
  const handleRefetch = useCallback(() => refetch(), [refetch]);
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
        <Box
          sx={{
            mx: -2,
            mb: 2,
            p: 2.5,
            background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
            color: "white",
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
      )}

      {/* Page head */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: "14px",
          mb: "22px",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {t("dashboard.welcome_name", { name: firstName }) || `Welcome back, ${firstName}`}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            {t("dashboard.subtitle") || "Here's your financial pulse for this month"}
          </Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
          <Tooltip title={t("common.refresh")}>
            <IconButton
              onClick={handleRefetch}
              disabled={isRefetching}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: theme.palette.mode === "dark"
                  ? alpha("#fff", 0.06)
                  : alpha("#000", 0.04),
                border: `1px solid ${theme.palette.divider}`,
                "&:hover": { bgcolor: theme.palette.mode === "dark" ? alpha("#fff", 0.1) : alpha("#000", 0.07) },
              }}
            >
              <RefreshIcon
                sx={{
                  fontSize: 16,
                  animation: isRefetching ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
                }}
              />
            </IconButton>
          </Tooltip>
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: "14px !important" }} />}
              onClick={onNewTransaction}
              sx={{
                borderRadius: "10px",
                px: "14px",
                py: "8px",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 6px 14px -8px rgba(168,85,247,0.7)",
              }}
            >
              {t("common.addTransaction") || "Transaction"}
            </Button>
          )}
        </Box>
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

      {/* Summary cards */}
      <SummaryCards
        summary={summary}
        transactions={filteredTransactions}
        selectedMonth={filters.month}
        selectedYear={filters.year}
      />

      {/* Dash grid: recent transactions + category breakdown */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
          gap: "18px",
          mt: "24px",
        }}
      >
        <RecentTransactionsWidget transactions={filteredTransactions} />
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
