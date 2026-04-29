import React, { Suspense, lazy, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardMainSection from "./DashboardMainSection";
import PageTransition from "./motion/PageTransition";
import { useAppStore } from "../hooks/useAppStore";
import { calculateInvoiceDueDate } from "../utils/transactionUtils";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useSettingsQuery } from "../hooks/useSettingsQuery";
import { useSettings, useNotification } from "../contexts";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { Session } from "@supabase/supabase-js";

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
  session: Session;
}

const AppViewSwitcher: React.FC<AppViewSwitcherProps> = ({ currentView: propView, session }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { filters, setFilters, setIsFormOpen, setEditingTransaction } = useAppStore();
  const {
    data: transactions = [],
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: refetchTransactions,
    updateInstallmentDates
  } = useTransactionsQuery();
  const { 
    paymentMethods, 
    paymentMethodColors, 
    paymentMethodConfigs,
    categories,
    categoryColors,
    addCategory,
    removeCategory,
    updateCategoryColor,
    addPaymentMethod,
    removePaymentMethod,
    updatePaymentMethodColor,
    getPaymentMethodPaymentDay,
    updatePaymentMethodPaymentDay,
    addPaymentMethodConfig,
    updatePaymentMethodConfig,
    removePaymentMethodConfig,
    friends,
    displayName
  } = useSettings();
  const { showSuccess, showError } = useNotification();
  const location = useLocation();
  
  const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
  const currentView: AppCurrentView = propView || (ROUTE_VIEWS[normalizedPath] as AppCurrentView) || "dashboard";

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedCategoryNav, setSelectedCategoryNav] = useState<{ name: string; type: "income" | "expense" } | null>(null);

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handlePayAll = async (paymentMethod: string, month: number, year: number) => {
    try {
      const unpaid = transactions.filter(t => 
        !t.isPaid && 
        t.paymentMethod === paymentMethod && 
        new Date(t.date).getMonth() === month && 
        new Date(t.date).getFullYear() === year
      );

      if (unpaid.length === 0) return;

      await Promise.all(unpaid.map(t => updateTransaction({ id: t.id, isPaid: true })));
      showSuccess(`Todas as transações de ${paymentMethod} marcadas como pagas!`);
    } catch (error) {
      showError("Erro ao pagar transações");
    }
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
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
              onTogglePaid={(id, isPaid) => updateTransaction({ id, isPaid })}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onDateChange={(month, year) => setFilters({ month, year })}
              paymentMethodConfigs={paymentMethodConfigs}
            />
          </Suspense>
        );
      case "splits":
        return (
          <Suspense fallback={<ListCardsSkeleton />}>
            <SplitsView 
              transactions={transactions} 
              onNewTransaction={handleNewTransaction}
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
              onTogglePaid={(id, isPaid) => updateTransaction({ id, isPaid })}
              onRefreshData={async () => { await refetchTransactions(); }}
              onUpdateInstallmentDates={updateInstallmentDates}
            />
          </Suspense>
        );
      case "recurring":
        return (
          <Suspense fallback={<ListCardsSkeleton />}>
            <RecurringView 
              transactions={transactions} 
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
              onTogglePaid={(id, isPaid) => updateTransaction({ id, isPaid })}
              onNewTransaction={handleNewTransaction}
              onRefreshData={async () => { await refetchTransactions(); }}
            />
          </Suspense>
        );
      case "nixai":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <NixAIView
              transactions={transactions}
              categories={categories}
              paymentMethods={paymentMethods}
              displayName={displayName}
              getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
              getPaymentMethodConfig={(method) =>
                paymentMethodConfigs.find((c) => c.name === method)
              }
              onTransactionCreate={async (tx) => {
                let invoiceDueDate = tx.invoiceDueDate;
                if (!invoiceDueDate) {
                  const config = paymentMethodConfigs.find(
                    (c) => c.name === tx.paymentMethod
                  );
                  if (config) {
                    invoiceDueDate =
                      calculateInvoiceDueDate(tx.date, config) ?? undefined;
                  }
                }
                await addTransaction({
                  description: tx.description,
                  amount: tx.amount ?? 0,
                  type: tx.type,
                  category: tx.category,
                  paymentMethod: tx.paymentMethod,
                  date: tx.date,
                  ...(invoiceDueDate && { invoiceDueDate }),
                });
                showSuccess("Transação salva com sucesso!");
              }}
            />
          </Suspense>
        );
      case "paymentMethods":
        return (
          <Suspense fallback={<PaymentMethodsSkeleton />}>
            {selectedPaymentMethod ? (
              <PaymentMethodDetailView
                paymentMethod={selectedPaymentMethod}
                transactions={transactions}
                paymentMethodConfigs={paymentMethodConfigs}
                selectedMonth={filters.month}
                selectedYear={filters.year}
                onDateChange={(month, year) => setFilters({ month, year })}
                onBack={() => setSelectedPaymentMethod(null)}
                onNewTransaction={handleNewTransaction}
                onPayAll={handlePayAll}
                onTogglePaid={(id, isPaid) => updateTransaction({ id, isPaid })}
                onEdit={setEditingTransaction}
                onDelete={deleteTransaction}
              />
            ) : (
              <PaymentMethodsView
                transactions={transactions}
                paymentMethods={paymentMethods}
                paymentMethodColors={paymentMethodColors}
                paymentMethodConfigs={paymentMethodConfigs}
                selectedMonth={filters.month}
                selectedYear={filters.year}
                onDateChange={(month, year) => setFilters({ month, year })}
                onSelectPaymentMethod={setSelectedPaymentMethod}
                onPayAll={handlePayAll}
                onAddPaymentMethod={addPaymentMethod}
                onRemovePaymentMethod={removePaymentMethod}
                onUpdatePaymentMethodColor={updatePaymentMethodColor}
                getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
                onUpdatePaymentMethodPaymentDay={updatePaymentMethodPaymentDay}
                onAddPaymentMethodConfig={addPaymentMethodConfig}
                onUpdatePaymentMethodConfig={updatePaymentMethodConfig}
                onRemovePaymentMethodConfig={removePaymentMethodConfig}
              />
            )}
          </Suspense>
        );
      case "categories":
        return (
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesView 
              transactions={transactions}
              categories={categories}
              categoryColors={categoryColors}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onDateChange={(month, year) => setFilters({ month, year })}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
              onUpdateCategoryColor={updateCategoryColor}
              onTogglePaid={(id, isPaid) => updateTransaction({ id, isPaid })}
              onEditTransaction={setEditingTransaction}
              onDeleteTransaction={deleteTransaction}
              initialSelectedCategory={selectedCategoryNav}
              onClearInitialCategory={() => setSelectedCategoryNav(null)}
            />
          </Suspense>
        );
      case "goals":
        return (
          <Suspense fallback={<GoalsSkeleton />}>
            <GoalsView userId={session.user.id} />
          </Suspense>
        );
      case "budgets":
        return (
          <Suspense fallback={<BudgetsSkeleton />}>
            <BudgetsView
              transactions={transactions}
              categories={categories}
              userId={session.user.id}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onDateChange={(month, year) => setFilters({ month, year })}
            />
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
            <PlanningView
              categories={categories}
              paymentMethods={paymentMethods}
              userId={session.user.id}
            />
          </Suspense>
        );
      case "import":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <ImportView
              categories={categories}
              paymentMethods={paymentMethods}
              onImport={async (txs) => {
                await Promise.all(txs.map((tx) => addTransaction(tx)));
              }}
            />
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
            <SubscriptionsView 
              transactions={transactions} 
              onNewTransaction={handleNewTransaction}
              onEdit={setEditingTransaction}
              onDelete={(t) => deleteTransaction(t.id)}
              userId={session.user.id}
            />
          </Suspense>
        );
      case "shared":
        return (
          <Suspense fallback={<ListCardsSkeleton />}>
            <SharedView 
              transactions={transactions}
              friends={friends}
              userName={displayName}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onDateChange={(month, year) => setFilters({ month, year })}
              onNewTransaction={handleNewTransaction}
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
              onTogglePaid={(id, isPaid) => updateTransaction({ id, isPaid })}
              onRefreshData={async () => { await refetchTransactions(); }}
            />
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
