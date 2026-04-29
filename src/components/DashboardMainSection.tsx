import React, { Suspense, lazy, useState } from "react";
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
import SummaryCards from "./SummaryCards";
import CategoryBreakdown from "./CategoryBreakdown";
import DateFilter from "./DateFilter";
import { AdvancedFiltersButton } from "./AdvancedFilters";
import type { AdvancedFiltersState } from "./AdvancedFilters";
import { CREATE_TRANSACTION_BUTTON } from "../constants";
import DashboardSkeleton from "./skeletons/DashboardSkeleton";
import RecentTransactionsWidget from "./RecentTransactionsWidget";
import { useAppStore } from "../hooks/useAppStore";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useFilteredTransactions } from "../hooks/useFilteredTransactions";
import { supabase } from "../services/supabaseClient";
import { VIEW_ROUTES } from "../routes";

const AdvancedFilters = lazy(() => import("./AdvancedFilters"));
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

  const onNewTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

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
            gap: { xs: 0.5, sm: 1.5 },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <AdvancedFiltersButton
            hasActiveFilters={hasAdvancedFiltersActive}
            activeFiltersCount={activeFiltersCount}
            showFilters={showAdvancedFilters}
            onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          />
          <DateFilter
            month={filters.month}
            year={filters.year}
            onDateChange={(month, year) => setFilters({ month, year })}
            showIcon
            disabled={hasAdvancedFiltersActive}
          />

          <Tooltip title={t("common.refresh")}>
            <IconButton
              onClick={() => refetch()}
              disabled={isRefetching}
              sx={{
                width: 40,
                height: 40,
                border: 1,
                borderColor: "divider",
                borderRadius: "20px",
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
          onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
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
        onPaymentMethodClick={() => navigate(VIEW_ROUTES.paymentMethods)}
        onCategoryClick={() => {}}
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsView
          transactions={filteredTransactions}
          hasAdvancedFilters={hasAdvancedFiltersActive}
          advancedFilters={advancedFilters}
          onCategoryClick={() => {}}
        />
      </Suspense>
    </Stack>
  );
};

export default DashboardMainSection;
