import React, { Suspense, lazy, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
} from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import SummaryCards from "../widgets/SummaryCards";
import CategoryBreakdown from "../widgets/CategoryBreakdown";
import DateFilter from "../ui/DateFilter";
import { AdvancedFiltersButton } from "../panels/AdvancedFilters";
import type { AdvancedFiltersState } from "../panels/AdvancedFilters";
import { CREATE_TRANSACTION_BUTTON } from "../../constants";
import DashboardSkeleton from "../skeletons/DashboardSkeleton";
import RecentTransactionsWidget from "../widgets/RecentTransactionsWidget";
import { useAppStore } from "../../hooks/useAppStore";
import { useTransactionsQuery } from "../../hooks/useTransactionsQuery";
import { useFilteredTransactions } from "../../hooks/useFilteredTransactions";
import { supabase } from "../../services/supabaseClient";
import { VIEW_ROUTES } from "../../routes";

const AdvancedFilters = lazy(() => import("../panels/AdvancedFilters"));
const AnalyticsView = lazy(() => import("./AnalyticsView"));

const DashboardMainSection: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = theme.breakpoints.down("md"); // Simplified for now
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

  const handleToggleFilters = useCallback(
    () => setShowAdvancedFilters((v) => !v),
    []
  );

  const handleDateChange = useCallback(
    (month: number, year: number) => setFilters({ month, year }),
    [setFilters]
  );

  const handleRefetch = useCallback(() => refetch(), [refetch]);

  const handlePaymentMethodClick = useCallback(
    () => navigate(VIEW_ROUTES.paymentMethods),
    [navigate]
  );

  // Callback estável para evitar re-renders em children que recebem onCategoryClick
  const NOOP = useCallback(() => {}, []);

  return (
    <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            {t("dashboard.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("dashboard.welcome")}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 1, sm: 1.5 },
            width: { xs: "100%", sm: "auto" },
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

          <Tooltip title={t("common.refresh")}>
            <IconButton
              onClick={handleRefetch}
              disabled={isRefetching}
              sx={{
                width: 44,
                height: 44,
                border: 1,
                borderColor: "divider",
                borderRadius: "22px",
              }}
            >
              <RefreshIcon
                sx={{
                  fontSize: 24,
                  animation: isRefetching ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
            sx={CREATE_TRANSACTION_BUTTON.sx}
          >
            {CREATE_TRANSACTION_BUTTON.label}
          </Button>
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

      <SummaryCards
        summary={summary}
        transactions={filteredTransactions}
        selectedMonth={filters.month}
        selectedYear={filters.year}
      />

      <RecentTransactionsWidget
        transactions={filteredTransactions}
      />

      <CategoryBreakdown
        transactions={filteredTransactions}
        onPaymentMethodClick={handlePaymentMethodClick}
        onCategoryClick={NOOP}
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsView
          transactions={filteredTransactions}
          hasAdvancedFilters={hasAdvancedFiltersActive}
          advancedFilters={advancedFilters}
          onCategoryClick={NOOP}
        />
      </Suspense>
    </Stack>
  );
};

export default DashboardMainSection;
