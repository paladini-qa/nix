import React, { Suspense, lazy, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Skeleton,
  Stack,
} from "@mui/material";
import CategoryBreakdown from "@/presentation/widgets/CategoryBreakdown";
import SummaryCards from "@/presentation/widgets/SummaryCards";
import { AdvancedFiltersButton } from "@/presentation/panels/AdvancedFilters";
import DashboardSkeleton from "@/presentation/components/skeletons/DashboardSkeleton";
import RecentTransactionsWidget from "@/presentation/widgets/RecentTransactionsWidget";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import { useTransactionsQuery } from "@/presentation/hooks/useTransactionsQuery";
import { useFilteredTransactions } from "@/presentation/hooks/useFilteredTransactions";
import { usePrivacy, useSettings } from "@/presentation/contexts";
import MobileDashboardOverview, { MobileDashboardShortcuts } from "@/presentation/widgets/MobileDashboardOverview";
import { VIEW_ROUTES } from "@/presentation/routes";

const AdvancedFilters = lazy(() => import("@/presentation/panels/AdvancedFilters"));
const AnalyticsView = lazy(() => import("./AnalyticsView"));

const DashboardMainSection: React.FC<{ userId: string }> = ({ userId }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isPrivacyMode } = usePrivacy();
  const { displayName, paymentMethodConfigs } = useSettings();
  const navigate = useNavigate();

  const { 
    filters, 
    showAdvancedFilters,
    setShowAdvancedFilters,
    advancedFilters,
    setFiltersState,
  } = useAppStore();
  const { data, isPending } = useTransactionsQuery(userId);
  const transactions = data ?? [];
  const { filteredTransactions, summary } = useFilteredTransactions(transactions, paymentMethodConfigs);

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

  const handleToggleFilters = useCallback(() => setShowAdvancedFilters(!showAdvancedFilters), [showAdvancedFilters, setShowAdvancedFilters]);
  const handlePaymentMethodClick = useCallback(
    () => navigate(VIEW_ROUTES.paymentMethods),
    [navigate]
  );
  const NOOP = useCallback(() => {}, []);
  const hasExpenses = filteredTransactions.some(({ type }) => type === "expense");

  const firstName = displayName ? displayName.split(" ")[0] : t("dashboard.title");
  const showAnalysis = !isMobile || !isPrivacyMode;

  return (
    <Box sx={{ maxWidth: { xs: 640, md: "none" }, mx: "auto", px: { xs: 0, md: "28px" }, pt: { xs: 0, md: "24px" }, pb: { xs: 0, md: "60px" } }}>
      {isMobile && (data ? (
        <MobileDashboardOverview
          transactions={transactions}
          summary={summary}
          paymentMethodConfigs={paymentMethodConfigs}
          selectedMonth={filters.month}
          selectedYear={filters.year}
          hasDateRange={!!(advancedFilters.startDate || advancedFilters.endDate)}
          isPrivate={isPrivacyMode}
          onOpenTransactions={() => navigate(VIEW_ROUTES.transactions)}
        />
      ) : (
        <Stack spacing={1.5} aria-busy={isPending}>
          {isPending && <Skeleton variant="rounded" height={144} sx={{ borderRadius: "20px" }} />}
          <MobileDashboardShortcuts />
          {isPending && <Skeleton variant="rounded" height={96} sx={{ borderRadius: "20px" }} />}
        </Stack>
      ))}

      {/* Page head — desktop only */}
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

      {/* Advanced filters button row — mobile only */}
      {isMobile && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            mb: "22px",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            width: "100%",
          }}
        >
          <AdvancedFiltersButton
            hasActiveFilters={hasAdvancedFiltersActive}
            activeFiltersCount={activeFiltersCount}
            showFilters={showAdvancedFilters}
            onToggleFilters={handleToggleFilters}
            fullWidth={true}
          />
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

      {/* Advanced filters selection drawer — mobile only */}
      {isMobile && (
        <Suspense fallback={null}>
          <AdvancedFilters
            transactions={transactions}
            filters={advancedFilters}
            onFiltersChange={setFiltersState}
            showFilters={showAdvancedFilters}
            onToggleFilters={handleToggleFilters}
          />
        </Suspense>
      )}

      {showAnalysis && <>
        {/* Dash grid: recent transactions (left) + expenses by category (right) */}
        <Box
          sx={{
            mt: "24px",
            display: "grid",
            gridTemplateColumns: hasExpenses
              ? { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.4fr) minmax(0, 1fr)" }
              : "minmax(0, 1fr)",
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

        {/* Analytics section */}
        <Box sx={{ mt: "24px" }}>
          <Suspense fallback={<DashboardSkeleton />}>
            <AnalyticsView
              transactions={filteredTransactions}
              allTransactions={transactions}
              paymentMethodConfigs={paymentMethodConfigs}
              advancedFilters={advancedFilters}
              onCategoryClick={NOOP}
            />
          </Suspense>
        </Box>
      </>}
    </Box>
  );
};

export default DashboardMainSection;
