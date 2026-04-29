import React, { Suspense, lazy, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardMainSection from "./DashboardMainSection";
import PageTransition from "./motion/PageTransition";
import { useAppStore } from "../hooks/useAppStore";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useSettingsQuery } from "../hooks/useSettingsQuery";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";

// Skeletons
import TransactionsSkeleton from "./skeletons/TransactionsSkeleton";
import ListCardsSkeleton from "./skeletons/ListCardsSkeleton";
import PaymentMethodsSkeleton from "./skeletons/PaymentMethodsSkeleton";
import CategoriesSkeleton from "./skeletons/CategoriesSkeleton";
import BudgetsSkeleton from "./skeletons/BudgetsSkeleton";
import GoalsSkeleton from "./skeletons/GoalsSkeleton";
import PlanningSkeleton from "./skeletons/PlanningSkeleton";

// Lazy views
const PaymentMethodDetailView = lazy(() => import("./PaymentMethodDetailView"));
const TransactionsView = lazy(() => import("./TransactionsView"));
const SplitsView = lazy(() => import("./SplitsView"));
const SharedView = lazy(() => import("./SharedView"));
const RecurringView = lazy(() => import("./RecurringView"));
const NixAIView = lazy(() => import("./NixAIView"));
const PaymentMethodsView = lazy(() => import("./PaymentMethodsView"));
const CategoriesView = lazy(() => import("./CategoriesView"));
const GoalsView = lazy(() => import("./GoalsView"));
const BudgetsView = lazy(() => import("./BudgetsView"));
const AnalyticsView = lazy(() => import("./AnalyticsView"));
const PlanningView = lazy(() => import("./PlanningView"));
const ImportView = lazy(() => import("./ImportView"));
const FiscalReportView = lazy(() => import("./FiscalReportView"));
const DebtCalculatorView = lazy(() => import("./DebtCalculatorView"));
const InvestmentsView = lazy(() => import("./InvestmentsView"));
const SubscriptionsView = lazy(() => import("./SubscriptionsView"));

const ViewLoadingMui: React.FC = () => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
    <CircularProgress color="primary" />
  </Box>
);

import { ROUTE_VIEWS } from "../routes";
import { AppCurrentView } from "../types/appView";

interface AppViewSwitcherProps {
  currentView?: AppCurrentView;
}

const AppViewSwitcher: React.FC<AppViewSwitcherProps> = ({ currentView: propView }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { filters, setFilters, setIsFormOpen, setEditingTransaction } = useAppStore();
  const { data: transactions = [] } = useTransactionsQuery();
  const { data: settings } = useSettingsQuery();
  const location = useLocation();
  
  const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
  const currentView: AppCurrentView = propView || (ROUTE_VIEWS[normalizedPath] as AppCurrentView) || "dashboard";

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedCategoryNav, setSelectedCategoryNav] = useState<{ name: string; type: "income" | "expense" } | null>(null);

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardMainSection />;
      case "transactions":
        return (
          <Suspense fallback={<TransactionsSkeleton />}>
            <TransactionsView 
              transactions={transactions} 
              onNewTransaction={handleNewTransaction}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onDateChange={(month, year) => setFilters({ month, year })}
            />
          </Suspense>
        );
      case "splits":
        return (
          <Suspense fallback={<ListCardsSkeleton />}>
            <SplitsView transactions={transactions} onNewTransaction={handleNewTransaction} />
          </Suspense>
        );
      case "recurring":
        return (
          <Suspense fallback={<ListCardsSkeleton />}>
            <RecurringView transactions={transactions} onNewTransaction={handleNewTransaction} />
          </Suspense>
        );
      case "nixai":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <NixAIView transactions={transactions} />
          </Suspense>
        );
      case "paymentMethods":
        return (
          <Suspense fallback={<PaymentMethodsSkeleton />}>
            <PaymentMethodsView transactions={transactions} />
          </Suspense>
        );
      case "categories":
        return (
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesView transactions={transactions} />
          </Suspense>
        );
      case "goals":
        return (
          <Suspense fallback={<GoalsSkeleton />}>
            <GoalsView />
          </Suspense>
        );
      case "budgets":
        return (
          <Suspense fallback={<BudgetsSkeleton />}>
            <BudgetsView transactions={transactions} />
          </Suspense>
        );
      case "analytics":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <AnalyticsView transactions={transactions} />
          </Suspense>
        );
      case "planning":
        return (
          <Suspense fallback={<PlanningSkeleton />}>
            <PlanningView />
          </Suspense>
        );
      case "import":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <ImportView />
          </Suspense>
        );
      case "fiscal-report":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <FiscalReportView transactions={transactions} />
          </Suspense>
        );
      case "debt-calculator":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <DebtCalculatorView />
          </Suspense>
        );
      case "investments":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <InvestmentsView transactions={transactions} isMobile={isMobile} />
          </Suspense>
        );
      case "subscriptions":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <SubscriptionsView transactions={transactions} onNewTransaction={handleNewTransaction} />
          </Suspense>
        );
      default:
        return <DashboardMainSection />;
    }
  };

  return (
    <PageTransition transitionKey={currentView} type="slideLeft">
      {renderView()}
    </PageTransition>
  );
};

export default AppViewSwitcher;
