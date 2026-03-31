import React, { Suspense, lazy } from "react";
import { Session } from "@supabase/supabase-js";
import type { AppCurrentView } from "../types/appView";
import type {
  Transaction,
  FilterState,
  CategoryColors,
  PaymentMethodColors,
} from "../types";
import type { AdvancedFiltersState } from "./AdvancedFilters";
import DashboardMainSection from "./DashboardMainSection";
import type { FinancialSummary } from "../types";
import PageTransition from "./motion/PageTransition";

const PaymentMethodDetailView = lazy(() => import("./PaymentMethodDetailView"));
const TransactionsView = lazy(() => import("./TransactionsView"));
const SplitsView = lazy(() => import("./SplitsView"));
const SharedView = lazy(() => import("./SharedView"));
const RecurringView = lazy(() => import("./RecurringView"));
const NixAIView = lazy(() => import("./NixAIView"));
const BatchRegistrationView = lazy(() => import("./BatchRegistrationView"));
const PaymentMethodsView = lazy(() => import("./PaymentMethodsView"));
const CategoriesView = lazy(() => import("./CategoriesView"));

import TransactionsSkeleton from "./skeletons/TransactionsSkeleton";
import ListCardsSkeleton from "./skeletons/ListCardsSkeleton";
import PaymentMethodsSkeleton from "./skeletons/PaymentMethodsSkeleton";
import CategoriesSkeleton from "./skeletons/CategoriesSkeleton";
import { Box, CircularProgress } from "@mui/material";

const ViewLoadingMui: React.FC = () => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
    <CircularProgress color="primary" />
  </Box>
);

export interface AppViewSwitcherProps {
  currentView: AppCurrentView;
  setCurrentView: (view: AppCurrentView) => void;
  selectedPaymentMethod: string | null;
  setSelectedPaymentMethod: React.Dispatch<React.SetStateAction<string | null>>;
  selectedCategoryNav: { name: string; type: "income" | "expense" } | null;
  setSelectedCategoryNav: React.Dispatch<
    React.SetStateAction<{ name: string; type: "income" | "expense" } | null>
  >;
  session: Session;
  displayName: string;
  isMobile: boolean;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  advancedFilters: AdvancedFiltersState;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFiltersState>>;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: React.Dispatch<React.SetStateAction<boolean>>;
  isRefreshing: boolean;
  onRefresh: () => void;
  transactions: Transaction[];
  dashboardFilteredTransactions: Transaction[];
  summary: FinancialSummary;
  analyticsTransactions: Transaction[];
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  paymentMethodColors: PaymentMethodColors;
  friends: string[];
  onRefreshData: () => Promise<void>;
  handleNewTransaction: () => void;
  handleEditTransaction: (t: Transaction) => void;
  handleDeleteTransaction: (t: Transaction) => void;
  handleTogglePaid: (t: Transaction) => void;
  handleSmartInputTransaction: (parsed: unknown) => void;
  getPaymentMethodPaymentDay: (method: string) => number | undefined;
  handlePayAllTransactions: (method: string) => void;
  handleAddPaymentMethod: (method: string) => void;
  handleRemovePaymentMethod: (method: string) => void;
  handleUpdatePaymentMethodColor: (method: string, primary: string, secondary: string) => void;
  updatePaymentMethodPaymentDay: (method: string, day: number | null) => Promise<void>;
  handleAddCategory: (type: "income" | "expense", name: string) => void;
  handleRemoveCategory: (type: "income" | "expense", name: string) => void;
  handleUpdateCategoryColor: (
    type: "income" | "expense",
    name: string,
    primary: string,
    secondary: string
  ) => void;
  categoryColors: CategoryColors;
  handleUpdateInstallmentDates: (groupId: string, dates: string[]) => void;
}

/**
 * Renders the main content area based on currentView.
 * Extracted from App.tsx to isolate navigation switching.
 * Cada view é envolvida em PageTransition para garantir feedback visual em toda navegação.
 * O key nas Suspense boundaries garante que o skeleton seja exibido ao navegar para uma view
 * mesmo que o chunk já esteja em cache (React cria nova boundary na troca de currentView).
 */
const AppViewSwitcher: React.FC<AppViewSwitcherProps> = (props) => {
  const {
    currentView,
    setCurrentView,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    selectedCategoryNav,
    setSelectedCategoryNav,
    session,
    displayName,
    isMobile,
    filters,
    setFilters,
    advancedFilters,
    setAdvancedFilters,
    showAdvancedFilters,
    setShowAdvancedFilters,
    isRefreshing,
    onRefresh,
    transactions,
    dashboardFilteredTransactions,
    summary,
    analyticsTransactions,
    categories,
    paymentMethods,
    paymentMethodColors,
    friends,
    onRefreshData,
    handleNewTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    handleTogglePaid,
    handleSmartInputTransaction,
    getPaymentMethodPaymentDay,
    handlePayAllTransactions,
    handleAddPaymentMethod,
    handleRemovePaymentMethod,
    handleUpdatePaymentMethodColor,
    updatePaymentMethodPaymentDay,
    handleAddCategory,
    handleRemoveCategory,
    handleUpdateCategoryColor,
    categoryColors,
    handleUpdateInstallmentDates,
  } = props;

  // Chave composta: inclui selectedPaymentMethod para animar a transição dentro de paymentMethods/dashboard
  const transitionKey = `${currentView}-${selectedPaymentMethod ?? ""}`;

  const renderView = () => {
    if (currentView === "dashboard") {
      if (selectedPaymentMethod) {
        return (
          <Suspense key={transitionKey} fallback={<ViewLoadingMui />}>
            <PaymentMethodDetailView
              paymentMethod={selectedPaymentMethod}
              transactions={transactions}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onDateChange={(month, year) => setFilters({ ...filters, month, year })}
              onBack={() => setSelectedPaymentMethod(null)}
              onNewTransaction={handleNewTransaction}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onTogglePaid={handleTogglePaid}
            />
          </Suspense>
        );
      }
      return (
        <DashboardMainSection
          isMobile={isMobile}
          displayName={displayName}
          session={session}
          filters={filters}
          setFilters={setFilters}
          advancedFilters={advancedFilters}
          setAdvancedFilters={setAdvancedFilters}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onNewTransaction={handleNewTransaction}
          transactions={transactions}
          dashboardFilteredTransactions={dashboardFilteredTransactions}
          summary={summary}
          analyticsTransactions={analyticsTransactions}
          onPaymentMethodClick={(method) => {
            setSelectedPaymentMethod(method);
            setCurrentView("paymentMethods");
          }}
          onCategoryClick={(category, type) => {
            setSelectedCategoryNav({ name: category, type });
            setCurrentView("categories");
          }}
        />
      );
    }

    if (currentView === "transactions") {
      return (
        <Suspense key={currentView} fallback={<TransactionsSkeleton />}>
          <TransactionsView
            transactions={transactions}
            onNewTransaction={handleNewTransaction}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onTogglePaid={handleTogglePaid}
            selectedMonth={filters.month}
            selectedYear={filters.year}
            onDateChange={(month, year) => setFilters({ ...filters, month, year })}
            onRefreshData={onRefreshData}
          />
        </Suspense>
      );
    }

    if (currentView === "splits") {
      return (
        <Suspense key={currentView} fallback={<ListCardsSkeleton />}>
          <SplitsView
            transactions={transactions}
            onNewTransaction={handleNewTransaction}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onTogglePaid={handleTogglePaid}
            onRefreshData={onRefreshData}
            onUpdateInstallmentDates={handleUpdateInstallmentDates}
          />
        </Suspense>
      );
    }

    if (currentView === "shared") {
      return (
        <Suspense key={currentView} fallback={<ListCardsSkeleton />}>
          <SharedView
            transactions={transactions}
            friends={friends}
            userName={displayName}
            onNewTransaction={handleNewTransaction}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onTogglePaid={handleTogglePaid}
            onRefreshData={onRefreshData}
          />
        </Suspense>
      );
    }

    if (currentView === "recurring") {
      return (
        <Suspense key={currentView} fallback={<ListCardsSkeleton />}>
          <RecurringView
            transactions={transactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onTogglePaid={handleTogglePaid}
            onNewTransaction={handleNewTransaction}
            onRefreshData={onRefreshData}
          />
        </Suspense>
      );
    }

    if (currentView === "nixai") {
      return (
        <Suspense key={currentView} fallback={<ViewLoadingMui />}>
          <NixAIView
            transactions={transactions}
            categories={categories}
            paymentMethods={paymentMethods}
            onTransactionCreate={handleSmartInputTransaction}
            getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
          />
        </Suspense>
      );
    }

    if (currentView === "batchRegistration") {
      return (
        <Suspense key={currentView} fallback={<ViewLoadingMui />}>
          <BatchRegistrationView
            categories={categories}
            paymentMethods={paymentMethods}
            onTransactionCreate={handleSmartInputTransaction}
            getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
          />
        </Suspense>
      );
    }

    if (currentView === "paymentMethods") {
      if (selectedPaymentMethod) {
        return (
          <Suspense key={transitionKey} fallback={<ViewLoadingMui />}>
            <PaymentMethodDetailView
              paymentMethod={selectedPaymentMethod}
              transactions={transactions}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onDateChange={(month, year) => setFilters({ ...filters, month, year })}
              onBack={() => setSelectedPaymentMethod(null)}
              onNewTransaction={handleNewTransaction}
              onPayAll={handlePayAllTransactions}
              onTogglePaid={handleTogglePaid}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </Suspense>
        );
      }
      return (
        <Suspense key={currentView} fallback={<PaymentMethodsSkeleton />}>
          <PaymentMethodsView
            transactions={transactions}
            paymentMethods={paymentMethods}
            paymentMethodColors={paymentMethodColors}
            selectedMonth={filters.month}
            selectedYear={filters.year}
            onDateChange={(month, year) => setFilters({ ...filters, month, year })}
            onSelectPaymentMethod={setSelectedPaymentMethod}
            onPayAll={handlePayAllTransactions}
            onAddPaymentMethod={handleAddPaymentMethod}
            onRemovePaymentMethod={handleRemovePaymentMethod}
            onUpdatePaymentMethodColor={handleUpdatePaymentMethodColor}
            getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
            onUpdatePaymentMethodPaymentDay={updatePaymentMethodPaymentDay}
          />
        </Suspense>
      );
    }

    if (currentView === "categories") {
      return (
        <Suspense key={currentView} fallback={<CategoriesSkeleton />}>
          <CategoriesView
            transactions={transactions}
            categories={categories}
            categoryColors={categoryColors}
            selectedMonth={filters.month}
            selectedYear={filters.year}
            onDateChange={(month, year) => setFilters({ ...filters, month, year })}
            onAddCategory={handleAddCategory}
            onRemoveCategory={handleRemoveCategory}
            onUpdateCategoryColor={handleUpdateCategoryColor}
            onTogglePaid={handleTogglePaid}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            initialSelectedCategory={selectedCategoryNav}
            onClearInitialCategory={() => setSelectedCategoryNav(null)}
          />
        </Suspense>
      );
    }

    return null;
  };

  return (
    <PageTransition transitionKey={transitionKey} type="slideUp" duration={0.22} mode="sync">
      {renderView()}
    </PageTransition>
  );
};

export default AppViewSwitcher;
