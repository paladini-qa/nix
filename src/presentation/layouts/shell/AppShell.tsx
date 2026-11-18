import React, { Suspense, lazy, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { calculateInvoiceDueDate } from "@/domain/usecases/transactionUtils";
import type { Transaction } from "@/domain/entities";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import { useTransactionsQuery } from "@/presentation/hooks/useTransactionsQuery";
import { useWalletSync } from "@/presentation/hooks/useWalletSync";
import { useSettings, useNotification } from "@/presentation/contexts";
import { ROUTE_VIEWS, VIEW_ROUTES } from "@/presentation/routes";
import { AppCurrentView } from "@/shared/types/appView";
import Sidebar from "@/presentation/layouts/shell/Sidebar";
import Topbar from "@/presentation/layouts/shell/Topbar";
import AppViewSwitcher from "@/presentation/layouts/shell/AppViewSwitcher";
import ProfileModal from "@/presentation/layouts/shell/ProfileModal";
import GlobalSearch from "@/presentation/panels/GlobalSearch";
import { MobileHeader, MobileDrawer, MobileNavigation } from "@/presentation/layouts/mobile";
import TransactionForm from "@/presentation/forms/TransactionForm";
import TransactionOptionsPanel from "@/presentation/panels/TransactionOptionsPanel";
import SharedOptionsDialog from "@/presentation/components/ui/SharedOptionsDialog";
import RecurringEditForm from "@/presentation/forms/RecurringEditForm";
import PullToRefreshIndicator from "@/presentation/components/banners/PullToRefreshIndicator";
import OfflineBanner from "@/presentation/components/banners/OfflineBanner";
import WalletDraftBanner from "@/presentation/components/banners/WalletDraftBanner";
import { usePullToRefresh } from "@/presentation/hooks";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import { WalletTransaction } from "@/presentation/hooks/useWalletSync";
import dayjs from "dayjs";

import { Session } from "@supabase/supabase-js";
import { supabase } from "@/infrastructure/database/supabaseClient";

const AdvancedFilters = lazy(() => import("@/presentation/panels/AdvancedFilters"));

interface AppShellProps {
  session: Session;
}

const AppShell: React.FC<AppShellProps> = ({ session }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    isFormOpen,
    setIsFormOpen,
    isSearchOpen,
    setIsSearchOpen,
    editingTransaction,
    setEditingTransaction,
    isProfileModalOpen,
    setIsProfileModalOpen,
    showAdvancedFilters,
    setShowAdvancedFilters,
    advancedFilters,
    setFiltersState,
  } = useAppStore();

  // Rascunho capturado do Google Wallet — exibido no WalletDraftBanner
  const [walletDraft, setWalletDraft] = React.useState<WalletTransaction | null>(null);
  // initialContext que pré-preenche o TransactionForm quando aberto via wallet
  const [walletInitialContext, setWalletInitialContext] = React.useState<{
    description?: string;
    amount?: string;
    type?: "expense";
  } | null>(null);

  const {
    categories,
    paymentMethods,
    getPaymentMethodPaymentDay,
    getPaymentMethodConfig,
    displayName,
  } = useSettings();

  const handleNavigate = useCallback((view: AppCurrentView) => {
    navigate(VIEW_ROUTES[view] || VIEW_ROUTES.transactions);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const {
    data: transactions = [],
    isLoading,
    refetch,
    addTransaction,
    bulkAddTransactions,
    updateTransaction
  } = useTransactionsQuery();

  const currentBalance = transactions.reduce((acc, t) => {
    return t.type === "income" ? acc + t.amount : acc - t.amount;
  }, 0);

  const handleSave = async (txData: any, editId?: string) => {
    try {
      if (editId) {
        await updateTransaction({ id: editId, ...txData });
        showSuccess("Transação atualizada com sucesso!");
      } else if (txData.installments && txData.installments > 1) {
        const totalInstallments = txData.installments;
        const txAmount = txData.amount || 0;
        const installmentAmount = Math.round((txAmount / totalInstallments) * 100) / 100;
        const totalFromInstallments = installmentAmount * totalInstallments;
        const remainder = Math.round((txAmount - totalFromInstallments) * 100) / 100;
        const installmentGroupId = crypto.randomUUID();

        const pmConfig = getPaymentMethodConfig(txData.paymentMethod);
        const isCardMethod =
          pmConfig?.type === "card" && !!pmConfig.closingDay && !!pmConfig.paymentDay;
        const baseDate = isCardMethod
          ? txData.date
          : (txData.invoiceDueDate ?? txData.date);

        const installmentPayloads: Partial<Transaction>[] = [];
        for (let i = 0; i < totalInstallments; i++) {
          const amount = i === 0 ? installmentAmount + remainder : installmentAmount;
          const installmentDate = dayjs(baseDate).add(i, "month").format("YYYY-MM-DD");

          let invoiceDueDate: string | undefined;
          if (isCardMethod && pmConfig) {
            invoiceDueDate = calculateInvoiceDueDate(installmentDate, pmConfig) ?? undefined;
          } else if (txData.invoiceDueDate) {
            invoiceDueDate = dayjs(baseDate).add(i, "month").format("YYYY-MM-DD");
          }

          installmentPayloads.push({
            description: txData.description,
            amount,
            type: txData.type,
            category: txData.category,
            paymentMethod: txData.paymentMethod,
            date: installmentDate,
            invoiceDueDate,
            isRecurring: false,
            installments: totalInstallments,
            currentInstallment: i + 1,
            isPaid: false,
            isShared: txData.isShared,
            sharedWith: txData.sharedWith,
            iOwe: txData.iOwe,
            notes: txData.notes,
            installmentGroupId,
          });
        }

        const createdInstallments = await bulkAddTransactions(installmentPayloads);

        // Create income reimbursement transactions for split expenses (iOwe=false)
        if (
          txData.isShared &&
          txData.sharedWith &&
          txData.type === "expense" &&
          !txData.iOwe
        ) {
          const incomePayloads: Partial<Transaction>[] = createdInstallments.map((inst) => ({
            description: `${inst.description} - ${txData.sharedWith}`,
            amount: Math.round((inst.amount / 2) * 100) / 100,
            type: "income" as const,
            category: "Other",
            paymentMethod: inst.paymentMethod,
            date: inst.date,
            isRecurring: false,
            isPaid: false,
            installments: totalInstallments,
            currentInstallment: inst.currentInstallment,
            relatedTransactionId: inst.id,
          }));
          await bulkAddTransactions(incomePayloads);
        }

        showSuccess("Transação criada com sucesso!");
      } else {
        await addTransaction(txData);
        showSuccess("Transação salva com sucesso!");
      }
      setIsFormOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error saving transaction:", error);
      showError("Erro ao salvar transação. Tente novamente.");
    }
  };

  const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
  const currentView: AppCurrentView = (ROUTE_VIEWS[normalizedPath] as AppCurrentView) ?? "dashboard";

  React.useEffect(() => {
    if (!Object.hasOwn(ROUTE_VIEWS, normalizedPath)) {
      navigate(VIEW_ROUTES.dashboard, { replace: true });
    }
  }, [normalizedPath, navigate]);

  // Google Wallet Sync — mostra o WalletDraftBanner em vez de abrir o form diretamente
  const handleWalletTransaction = useCallback((data: WalletTransaction) => {
    setWalletDraft(data);
  }, []);

  const handleWalletConfirm = useCallback((draft: WalletTransaction) => {
    setWalletDraft(null);
    setWalletInitialContext({
      description: draft.merchant,
      amount: draft.amount.toString(),
      type: "expense",
    });
    setEditingTransaction(null);
    setIsFormOpen(true);
  }, [setEditingTransaction, setIsFormOpen]);

  const handleWalletDismiss = useCallback(() => {
    setWalletDraft(null);
    setWalletInitialContext(null);
  }, []);

  useWalletSync(handleWalletTransaction);

  const { isOnline, pendingCount } = useNetworkStatus();

  const { isRefreshing, pullOffset } = usePullToRefresh({
    enabled: !isFormOpen,
    onRefresh: async () => {
      await refetch();
    },
  });

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {!isMobile && (
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          displayName={displayName}
          userEmail={session.user.email || ""}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}

      {/* Desktop: flex-col wrapper so Topbar sits above content */}
      {!isMobile && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <Topbar
            currentView={currentView}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNewTransaction={() => {
              setEditingTransaction(null);
              setIsFormOpen(true);
            }}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              overflowX: "hidden",
              overflowY: isFormOpen || currentView === "nixai" ? "hidden" : "auto",
              display: currentView === "nixai" ? "flex" : "block",
              flexDirection: "column",
              height: currentView === "nixai" ? "calc(100vh - 60px)" : "auto",
            }}
          >
            {!isMobile && (
              <Box sx={{ px: "28px", pt: "24px" }}>
                <Suspense fallback={null}>
                  <AdvancedFilters
                    transactions={transactions}
                    filters={advancedFilters}
                    onFiltersChange={setFiltersState}
                    showFilters={showAdvancedFilters}
                    onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  />
                </Suspense>
              </Box>
            )}
            <Suspense fallback={null}>
              <AppViewSwitcher currentView={currentView} session={session} />
            </Suspense>
          </Box>
        </Box>
      )}

      {isMobile && (
        <>
          <MobileHeader
            onOpenDrawer={() => setIsMobileDrawerOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
          <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} />
          <MobileDrawer
            open={isMobileDrawerOpen}
            onClose={() => setIsMobileDrawerOpen(false)}
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            displayName={displayName}
            userEmail={session.user.email || ""}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              px: currentView === "nixai" ? 0 : 2,
              pt: currentView === "nixai"
                ? "calc(64px + env(safe-area-inset-top, 0px))"
                : "calc(64px + env(safe-area-inset-top, 0px) + 16px)",
              pb: currentView === "nixai"
                ? "calc(80px + env(safe-area-inset-bottom, 0px))"
                : "calc(80px + env(safe-area-inset-bottom, 0px))",
              width: "100%",
              overflowX: "hidden",
              overflowY: isFormOpen || currentView === "nixai" ? "hidden" : "auto",
              display: currentView === "nixai" ? "flex" : "block",
              flexDirection: "column",
              height: currentView === "nixai"
                ? "calc(100vh - 64px - 80px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))"
                : "auto",
            }}
          >
            <PullToRefreshIndicator isRefreshing={isRefreshing} pullOffset={pullOffset} />
            <Suspense fallback={null}>
              <AppViewSwitcher currentView={currentView} session={session} />
            </Suspense>
          </Box>
        </>
      )}

      {isMobile && (
        <MobileNavigation
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}

      {/* Banner de captura do Google Wallet */}
      {isMobile && (
        <WalletDraftBanner
          draft={walletDraft}
          onConfirm={handleWalletConfirm}
          onDismiss={handleWalletDismiss}
        />
      )}

      {/* Modals & Dialogs */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
          setWalletInitialContext(null);
        }}
        onSave={handleSave}
        categories={categories}
        paymentMethods={paymentMethods}
        editTransaction={editingTransaction}
        initialContext={walletInitialContext}
        transactions={transactions}
        currentBalance={currentBalance}
        getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
        getPaymentMethodConfig={getPaymentMethodConfig}
      />
      
      <ProfileModal 
        open={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {isSearchOpen && (
        <GlobalSearch
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          transactions={transactions}
          onNavigate={handleNavigate}
          onSelectTransaction={(tx) => {
            setEditingTransaction(tx);
            setIsFormOpen(true);
            setIsSearchOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default AppShell;
