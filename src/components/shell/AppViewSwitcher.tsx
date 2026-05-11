import React, { Suspense, lazy, useState, useRef } from "react";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardMainSection from "../views/DashboardMainSection";
import PageTransition, { TransitionType } from "../motion/PageTransition";
import { useAppStore } from "../../hooks/useAppStore";
import { calculateInvoiceDueDate } from "../../utils/transactionUtils";
import { useTransactionsQuery } from "../../hooks/useTransactionsQuery";
import { useSettingsQuery } from "../../hooks/useSettingsQuery";
import { useSettings, useNotification, useConfirmDialog } from "../../contexts";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { Session } from "@supabase/supabase-js";

// Skeletons
import TransactionsSkeleton from "../skeletons/TransactionsSkeleton";
import ListCardsSkeleton from "../skeletons/ListCardsSkeleton";
import PaymentMethodsSkeleton from "../skeletons/PaymentMethodsSkeleton";
import CategoriesSkeleton from "../skeletons/CategoriesSkeleton";
import BudgetsSkeleton from "../skeletons/BudgetsSkeleton";
import PlanningSkeleton from "../skeletons/PlanningSkeleton";

// Lazy views
import RecurringEditForm from "../forms/RecurringEditForm";
import TransactionOptionsPanel, { OptionType, ActionType } from "../panels/TransactionOptionsPanel";
const PaymentMethodDetailView = lazy(() => import("../views/PaymentMethodDetailView"));
const TransactionsView = lazy(() => import("../views/TransactionsView"));
const SplitsView = lazy(() => import("../views/SplitsView"));
const SharedView = lazy(() => import("../views/SharedView"));
const RecurringView = lazy(() => import("../views/RecurringView"));
const NixAIView = lazy(() => import("../views/NixAIView"));
const PaymentMethodsView = lazy(() => import("../views/PaymentMethodsView"));
const CategoriesView = lazy(() => import("../views/CategoriesView"));
const BudgetsView = lazy(() => import("../views/BudgetsView"));
const AnalyticsView = lazy(() => import("../views/AnalyticsView"));
const PlanningView = lazy(() => import("../views/PlanningView"));
const ImportView = lazy(() => import("../views/ImportView"));
const FiscalReportView = lazy(() => import("../views/FiscalReportView"));
const DebtCalculatorView = lazy(() => import("../views/DebtCalculatorView"));
const InvestmentsView = lazy(() => import("../views/InvestmentsView"));
const SubscriptionsView = lazy(() => import("../views/SubscriptionsView"));
const NotificationsView = lazy(() => import("../views/NotificationsView"));
const PaymentGuideView = lazy(() => import("../views/PaymentGuideView"));

const ViewLoadingMui: React.FC = () => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
    <CircularProgress color="primary" />
  </Box>
);

import { ROUTE_VIEWS, VIEW_ROUTES } from "../../routes";
import { AppCurrentView } from "../../types/appView";
import { Transaction } from "../../types";

interface AppViewSwitcherProps {
  currentView?: AppCurrentView;
  session: Session;
}

const AppViewSwitcher: React.FC<AppViewSwitcherProps> = ({ currentView: propView, session }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const handleNavigate = (view: AppCurrentView) => navigate(VIEW_ROUTES[view] || VIEW_ROUTES.dashboard);
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
  const { confirmDelete } = useConfirmDialog();
  const location = useLocation();
  
  const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
  const currentView: AppCurrentView = propView || (ROUTE_VIEWS[normalizedPath] as AppCurrentView) || "dashboard";

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedCategoryNav, setSelectedCategoryNav] = useState<{ name: string; type: "income" | "expense" } | null>(null);

  const [recurringEditForm, setRecurringEditForm] = useState<{
    open: boolean;
    transaction: Transaction | null;
    editMode: OptionType;
    virtualDate?: string;
  }>({ open: false, transaction: null, editMode: "all" });

  const [globalOptionsPanel, setGlobalOptionsPanel] = useState<{
    open: boolean;
    transaction: Transaction | null;
    actionType: ActionType;
  }>({ open: false, transaction: null, actionType: "edit" });

  // Ordem das views na barra de navegação primária — usada para detectar direção
  const PRIMARY_VIEW_ORDER: Partial<Record<AppCurrentView, number>> = {
    transactions: 0,
    paymentMethods: 1,
  };
  const SECONDARY_VIEWS = new Set<AppCurrentView>([
    "splits", "shared", "recurring", "categories", "nixai",
    "budgets", "analytics", "planning", "import",
    "fiscal-report", "debt-calculator", "subscriptions", "investments", "notifications", "paymentGuide",
  ]);

  const prevViewRef = useRef<AppCurrentView>(currentView);
  const getTransitionType = (from: AppCurrentView, to: AppCurrentView): TransitionType => {
    const fromOrder = PRIMARY_VIEW_ORDER[from];
    const toOrder = PRIMARY_VIEW_ORDER[to];
    if (fromOrder !== undefined && toOrder !== undefined) {
      return toOrder > fromOrder ? "slideLeft" : "slideRight";
    }
    if (SECONDARY_VIEWS.has(to)) return "slideUp";
    if (SECONDARY_VIEWS.has(from) && toOrder !== undefined) return "slideDown";
    return "slideLeft";
  };
  const transitionType = getTransitionType(prevViewRef.current, currentView);
  prevViewRef.current = currentView;

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleEditAware = (tx: Transaction) => {
    // Ocorrências virtuais não têm virtualDate definido — preencher com a data da ocorrência
    const transaction: Transaction =
      tx.isVirtual && !tx.virtualDate
        ? { ...tx, virtualDate: tx.date }
        : tx;

    const isComplex =
      transaction.isRecurring ||
      transaction.isVirtual ||
      (transaction.installments !== undefined && transaction.installments > 1);
    if (isComplex) {
      setGlobalOptionsPanel({ open: true, transaction, actionType: "edit" });
    } else {
      setEditingTransaction(transaction);
      setIsFormOpen(true);
    }
  };

  const handleDeleteAware = async (id: string) => {
    let tx = transactions.find((t) => t.id === id);

    // Ocorrências virtuais têm ID no formato "{parentId}_recurring_YYYY-MM"
    if (!tx) {
      const virtualMatch = id.match(/^(.+)_recurring_(\d{4}-\d{2})$/);
      if (virtualMatch) {
        const parentId = virtualMatch[1];
        const parent = transactions.find((t) => t.id === parentId);
        if (parent) {
          tx = {
            ...parent,
            id,
            isVirtual: true,
            originalTransactionId: parentId,
            virtualDate: `${virtualMatch[2]}-${parent.date.split("-")[2] ?? "01"}`,
          };
        }
      }
    }

    if (!tx) return;
    const isComplex =
      tx.isRecurring ||
      tx.isVirtual ||
      (tx.installments !== undefined && tx.installments > 1);
    if (isComplex) {
      setGlobalOptionsPanel({ open: true, transaction: tx, actionType: "delete" });
    } else {
      const confirmed = await confirmDelete(tx.description);
      if (confirmed) await deleteTransaction(id);
    }
  };

  const handleGlobalOptionSelect = async (scope: OptionType) => {
    const { transaction, actionType } = globalOptionsPanel;
    if (!transaction) return;
    const virtualDate =
      transaction.virtualDate ?? (transaction.isVirtual ? transaction.date : undefined);
    setGlobalOptionsPanel({ open: false, transaction: null, actionType: "edit" });
    if (actionType === "edit") {
      handleRecurringEditWithScope(transaction, scope, virtualDate);
    } else {
      await handleDeleteWithScope(transaction, scope, virtualDate);
    }
  };

  const handleRecurringEditWithScope = (tx: Transaction, scope: OptionType, virtualDate?: string) => {
    setRecurringEditForm({ open: true, transaction: tx, editMode: scope, virtualDate });
  };

  const handleRecurringSave = async (
    newTx: Omit<Transaction, "id" | "createdAt">,
    editId: string | undefined,
    editMode?: OptionType
  ) => {
    const formTx = recurringEditForm.transaction;
    const virtualDate = recurringEditForm.virtualDate;
    const recurringId = formTx?.isVirtual
      ? formTx.originalTransactionId!
      : (formTx?.recurringGroupId ?? formTx?.id);

    switch (editMode ?? "all") {
      case "single": {
        if (editId === undefined) {
          // Cria transação avulsa + adiciona data às exclusões da recorrência pai
          await addTransaction({ ...newTx, isRecurring: false, frequency: undefined });
          if (virtualDate && recurringId) {
            const parent = transactions.find((t) => t.id === recurringId);
            if (parent) {
              const excluded = [...(parent.excludedDates ?? [])];
              if (!excluded.includes(virtualDate)) excluded.push(virtualDate);
              await updateTransaction({ id: recurringId, excludedDates: excluded });
            }
          }
        } else {
          await updateTransaction({ id: editId, ...newTx });
        }
        break;
      }
      case "all_future":
      case "all": {
        if (formTx?.installmentGroupId) {
          const affected = transactions.filter(
            (t) =>
              t.installmentGroupId === formTx.installmentGroupId &&
              (editMode === "all" ||
                (t.currentInstallment ?? 0) >= (formTx.currentInstallment ?? 0))
          );
          // newTx.date é o mês de início (parcela 1); recalcula data de cada parcela
          const startDate = dayjs(newTx.date);
          const pmConfig = paymentMethodConfigs.find((c) => c.name === newTx.paymentMethod);
          const isCardMethod = pmConfig?.type === "card" && !!pmConfig.closingDay && !!pmConfig.paymentDay;
          await Promise.all(
            affected.map((t) => {
              const monthOffset = (t.currentInstallment ?? 1) - 1;
              const newDate = startDate.add(monthOffset, "month").format("YYYY-MM-DD");
              const newInvoiceDueDate = isCardMethod && pmConfig
                ? calculateInvoiceDueDate(newDate, pmConfig)
                : newTx.invoiceDueDate
                  ? dayjs(newTx.invoiceDueDate).add(monthOffset, "month").format("YYYY-MM-DD")
                  : newTx.invoiceDueDate;
              return updateTransaction({
                id: t.id,
                ...newTx,
                date: newDate,
                ...(newInvoiceDueDate !== undefined && { invoiceDueDate: newInvoiceDueDate }),
                currentInstallment: t.currentInstallment,
                installments: t.installments,
                installmentGroupId: t.installmentGroupId,
              });
            })
          );
        } else if (recurringId) {
          await updateTransaction({ id: recurringId, ...newTx });
        }
        break;
      }
    }

    setRecurringEditForm({ open: false, transaction: null, editMode: "all" });
    showSuccess("Transação atualizada com sucesso!");
  };

  const handleDeleteWithScope = async (
    tx: Transaction,
    scope: OptionType,
    virtualDate?: string
  ) => {
    try {
      // Parcelamentos
      if (tx.installments && tx.installments > 1 && tx.installmentGroupId) {
        switch (scope) {
          case "single":
            await deleteTransaction(tx.id);
            break;
          case "all_future":
            await Promise.all(
              transactions
                .filter(
                  (t) =>
                    t.installmentGroupId === tx.installmentGroupId &&
                    (t.currentInstallment ?? 0) >= (tx.currentInstallment ?? 0)
                )
                .map((t) => deleteTransaction(t.id))
            );
            break;
          case "all":
            await Promise.all(
              transactions
                .filter((t) => t.installmentGroupId === tx.installmentGroupId)
                .map((t) => deleteTransaction(t.id))
            );
            break;
        }
        showSuccess("Excluído com sucesso!");
        return;
      }

      // Recorrentes
      const recurringId = tx.isVirtual
        ? tx.originalTransactionId!
        : (tx.recurringGroupId ?? tx.id);

      switch (scope) {
        case "single": {
          if (!virtualDate || !recurringId) break;
          const parent = transactions.find((t) => t.id === recurringId);
          if (parent) {
            const excluded = [...(parent.excludedDates ?? [])];
            if (!excluded.includes(virtualDate)) excluded.push(virtualDate);
            await updateTransaction({ id: recurringId, excludedDates: excluded });
          }
          const toDelete = tx.isVirtual
            ? transactions.find((t) => t.recurringGroupId === recurringId && t.date === virtualDate)
            : tx.recurringGroupId ? tx : null;
          if (toDelete) await deleteTransaction(toDelete.id);
          break;
        }
        case "all_future": {
          const futureRelated = transactions.filter(
            (t) => t.recurringGroupId === recurringId && (!virtualDate || t.date >= virtualDate)
          );
          await Promise.all(futureRelated.map((t) => deleteTransaction(t.id)));
          await deleteTransaction(recurringId);
          break;
        }
        case "all": {
          const related = transactions.filter((t) => t.recurringGroupId === recurringId);
          await Promise.all(related.map((t) => deleteTransaction(t.id)));
          await deleteTransaction(recurringId);
          break;
        }
      }
      showSuccess("Excluído com sucesso!");
    } catch {
      showError("Erro ao excluir. Tente novamente.");
    }
  };

  // Ao marcar pago em ocorrência virtual de recorrência, materializa um registro real no DB
  // para que apenas aquele mês seja afetado — sem alterar a transação original nem outras ocorrências.
  const handleTogglePaid = async (id: string, isPaid: boolean) => {
    const recurringMatch = id.match(/^(.+)_recurring_(\d{4})-(\d{2})$/);
    if (recurringMatch) {
      if (!isPaid) return; // ocorrências virtuais já aparecem como não pagas; desmarcar não faz nada
      const [, originalId, yearStr, monthStr] = recurringMatch;
      const year = Number(yearStr);
      const month = Number(monthStr);
      const original = transactions.find((t) => t.id === originalId);
      if (!original) return;

      const origDay = Number(original.date.split("-")[2]);
      const daysInMonth = new Date(year, month, 0).getDate();
      const adjustedDay = Math.min(origDay, daysInMonth);
      const virtualDate = `${yearStr}-${monthStr}-${String(adjustedDay).padStart(2, "0")}`;

      let invoiceDueDate: string | undefined;
      const pmConfig = paymentMethodConfigs.find((c) => c.name === original.paymentMethod);
      if (pmConfig?.type === "card" && pmConfig.closingDay && pmConfig.paymentDay) {
        invoiceDueDate = calculateInvoiceDueDate(virtualDate, pmConfig) ?? undefined;
      } else if (original.invoiceDueDate) {
        const origInvDay = Number(original.invoiceDueDate.split("-")[2]);
        const daysInInvMonth = new Date(year, month, 0).getDate();
        const adjustedInvDay = Math.min(origInvDay, daysInInvMonth);
        invoiceDueDate = `${yearStr}-${monthStr}-${String(adjustedInvDay).padStart(2, "0")}`;
      }

      await addTransaction({
        description: original.description,
        amount: original.amount,
        type: original.type,
        category: original.category,
        paymentMethod: original.paymentMethod,
        date: virtualDate,
        ...(invoiceDueDate ? { invoiceDueDate } : {}),
        isRecurring: false,
        recurringGroupId: originalId,
        isPaid: true,
        isShared: original.isShared,
        sharedWith: original.sharedWith,
        iOwe: original.iOwe,
        notes: original.notes,
      });
      return;
    }
    await updateTransaction({ id, isPaid });
  };

  const handlePayAll = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => handleTogglePaid(id, true)));
      showSuccess("Todas as transações marcadas como pagas!");
    } catch (error) {
      showError("Erro ao pagar transações");
    }
  };

  const renderView = () => {
    switch (currentView) {
      case "transactions":
        return (
          <Suspense fallback={<TransactionsSkeleton />}>
            <TransactionsView
              transactions={transactions}
              onNewTransaction={handleNewTransaction}
              onEdit={handleEditAware}
              onDelete={handleDeleteAware}
              onTogglePaid={handleTogglePaid}
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
              onEdit={handleEditAware}
              onDelete={handleDeleteAware}
              onTogglePaid={handleTogglePaid}
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
              onEditSeries={handleEdit}
              onEditWithScope={handleRecurringEditWithScope}
              onDeleteWithScope={handleDeleteWithScope}
              onTogglePaid={handleTogglePaid}
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
                onTogglePaid={handleTogglePaid}
                onEdit={handleEditAware}
                onDelete={handleDeleteAware}
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
              onTogglePaid={handleTogglePaid}
              onEditTransaction={handleEditAware}
              onDeleteTransaction={handleDeleteAware}
              initialSelectedCategory={selectedCategoryNav}
              onClearInitialCategory={() => setSelectedCategoryNav(null)}
            />
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
              onEdit={handleEditAware}
              onDelete={(t) => handleDeleteAware(t.id)}
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
              onEdit={handleEditAware}
              onDelete={handleDeleteAware}
              onTogglePaid={handleTogglePaid}
              onRefreshData={async () => { await refetchTransactions(); }}
            />
          </Suspense>
        );
      case "notifications":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <NotificationsView onNavigate={handleNavigate} />
          </Suspense>
        );
      case "paymentGuide":
        return (
          <Suspense fallback={<ViewLoadingMui />}>
            <PaymentGuideView
              transactions={transactions}
              paymentMethodConfigs={paymentMethodConfigs}
              onTogglePaid={handleTogglePaid}
              selectedMonth={filters.month}
              selectedYear={filters.year}
            />
          </Suspense>
        );
      case "dashboard":
        return <DashboardMainSection />;
      default:
        return (
          <Suspense fallback={<TransactionsSkeleton />}>
            <TransactionsView
              transactions={transactions}
              onNewTransaction={handleNewTransaction}
              onEdit={handleEditAware}
              onDelete={handleDeleteAware}
              onTogglePaid={handleTogglePaid}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onDateChange={(month, year) => setFilters({ month, year })}
              paymentMethodConfigs={paymentMethodConfigs}
            />
          </Suspense>
        );
    }
  };

  return (
    <>
      <PageTransition transitionKey={currentView} type={isMobile ? transitionType : "slideLeft"}>
        {renderView()}
      </PageTransition>

      <RecurringEditForm
        isOpen={recurringEditForm.open}
        onClose={() => setRecurringEditForm({ open: false, transaction: null, editMode: "all" })}
        onSave={handleRecurringSave}
        transaction={recurringEditForm.transaction}
        editMode={recurringEditForm.editMode}
        categories={categories}
        paymentMethods={paymentMethods}
        virtualDate={recurringEditForm.virtualDate}
      />

      <TransactionOptionsPanel
        open={globalOptionsPanel.open}
        onClose={() => setGlobalOptionsPanel({ open: false, transaction: null, actionType: "edit" })}
        transaction={globalOptionsPanel.transaction}
        actionType={globalOptionsPanel.actionType}
        onSelect={handleGlobalOptionSelect}
      />
    </>
  );
};

export default AppViewSwitcher;
