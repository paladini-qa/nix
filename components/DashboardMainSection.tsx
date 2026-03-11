import React, { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { Session } from "@supabase/supabase-js";
import SummaryCards from "./SummaryCards";
import CategoryBreakdown from "./CategoryBreakdown";
import DateFilter from "./DateFilter";
import { AdvancedFiltersButton } from "./AdvancedFilters";
import type { AdvancedFiltersState } from "./AdvancedFilters";
import { CREATE_TRANSACTION_BUTTON } from "../constants";
import type { FilterState, FinancialSummary, Transaction } from "../types";
import DashboardSkeleton from "./skeletons/DashboardSkeleton";

const AdvancedFilters = lazy(() => import("./AdvancedFilters"));
const AnalyticsView = lazy(() => import("./AnalyticsView"));

export interface DashboardMainSectionProps {
  isMobile: boolean;
  displayName: string;
  session: Session;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  advancedFilters: AdvancedFiltersState;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFiltersState>>;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: React.Dispatch<React.SetStateAction<boolean>>;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNewTransaction: () => void;
  transactions: Transaction[];
  dashboardFilteredTransactions: Transaction[];
  summary: FinancialSummary;
  analyticsTransactions: Transaction[];
  onPaymentMethodClick: (method: string) => void;
  onCategoryClick: (category: string, type: "income" | "expense") => void;
}

/**
 * Dashboard header, advanced filters, summary cards, category breakdown, and analytics.
 * Extracted from App.tsx to reduce monolith size and isolate dashboard layout.
 */
const DashboardMainSection: React.FC<DashboardMainSectionProps> = ({
  isMobile,
  displayName,
  session,
  filters,
  setFilters,
  advancedFilters,
  setAdvancedFilters,
  showAdvancedFilters,
  setShowAdvancedFilters,
  isRefreshing,
  onRefresh,
  onNewTransaction,
  transactions,
  dashboardFilteredTransactions,
  summary,
  analyticsTransactions,
  onPaymentMethodClick,
  onCategoryClick,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

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

  return (
    <>
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
            variant={isMobile ? "h6" : "h5"}
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            {t("dashboard.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isMobile
              ? displayName || session.user.email?.split("@")[0]
              : t("dashboard.welcomeWithName", {
                  name: displayName || session.user.email || "",
                })}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1.5 },
            width: { xs: "100%", sm: "auto" },
            minWidth: 0,
            flexWrap: "nowrap",
          }}
        >
          <AdvancedFiltersButton
            hasActiveFilters={hasAdvancedFiltersActive}
            activeFiltersCount={activeFiltersCount}
            showFilters={showAdvancedFilters}
            onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
            compact={isMobile}
          />
          <Box sx={{ minWidth: 0, flex: isMobile ? 1 : "0 0 auto" }}>
            <DateFilter
              month={filters.month}
              year={filters.year}
              onDateChange={(month, year) => setFilters({ ...filters, month, year })}
              showIcon
              compact={isMobile}
              disabled={hasAdvancedFiltersActive}
              disabledMessage={t("dashboard.removeAdvancedFiltersForMonth")}
            />
          </Box>

          {!isMobile && (
            <Tooltip title={t("common.refresh")}>
              <IconButton
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label={t("common.refresh")}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: "20px",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: 24,
                    animation: isRefreshing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          )}

          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewTransaction}
              sx={CREATE_TRANSACTION_BUTTON.sx}
            >
              {CREATE_TRANSACTION_BUTTON.label}
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
          onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        />
      </Suspense>

      <SummaryCards
        summary={summary}
        transactions={transactions}
        selectedMonth={filters.month}
        selectedYear={filters.year}
      />

      <CategoryBreakdown
        transactions={dashboardFilteredTransactions}
        onPaymentMethodClick={onPaymentMethodClick}
        onCategoryClick={onCategoryClick}
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsView
          transactions={analyticsTransactions}
          hasAdvancedFilters={hasAdvancedFiltersActive}
          advancedFilters={advancedFilters}
        />
      </Suspense>
    </>
  );
};

export default DashboardMainSection;
