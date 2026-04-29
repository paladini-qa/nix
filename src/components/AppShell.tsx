import React, { Suspense, lazy, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useAppStore } from "../hooks/useAppStore";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useWalletSync } from "../hooks/useWalletSync";
import { useSettings, useNotification } from "../contexts";
import { ROUTE_VIEWS, VIEW_ROUTES } from "../routes";
import { AppCurrentView } from "../types/appView";
import Sidebar from "./Sidebar";
import AppViewSwitcher from "./AppViewSwitcher";
import ProfileModal from "./ProfileModal";
import GlobalSearch from "./GlobalSearch";
import { MobileHeader, MobileDrawer, MobileNavigation } from "./layout";
import TransactionForm from "./TransactionForm";
import TransactionOptionsPanel from "./TransactionOptionsPanel";
import SharedOptionsDialog from "./components/SharedOptionsDialog";
import RecurringEditForm from "./components/RecurringEditForm";
import PullToRefreshIndicator from "./PullToRefreshIndicator";
import { usePullToRefresh } from "../hooks";
import dayjs from "dayjs";

import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

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
  } = useAppStore();

  const {
    categories,
    paymentMethods,
    friends,
    addFriend,
    getPaymentMethodPaymentDay,
    getPaymentMethodConfig,
    displayName,
  } = useSettings();

  const handleNavigate = useCallback((view: AppCurrentView) => {
    navigate(VIEW_ROUTES[view] || "/dashboard");
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const { 
    data: transactions = [], 
    isLoading, 
    refetch,
    addTransaction,
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

  // Google Wallet Sync
  const handleWalletTransaction = useCallback((data: any) => {
    setEditingTransaction({
      id: "new_wallet_" + Date.now(),
      description: data.merchant,
      amount: data.amount,
      type: "expense",
      category: "",
      paymentMethod: "",
      date: dayjs().format("YYYY-MM-DD"),
      isPaid: false,
    } as any);
    setIsFormOpen(true);
    showSuccess(`Transação detectada: ${data.merchant} - ${data.amount}`);
  }, [setEditingTransaction, setIsFormOpen, showSuccess]);

  useWalletSync(handleWalletTransaction);

  const { isRefreshing, pullOffset } = usePullToRefresh({
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
      
      {isMobile && (
        <>
          <MobileHeader 
            onOpenDrawer={() => setIsMobileDrawerOpen(true)} 
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
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
        </>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 2 : 3,
          pb: isMobile ? 10 : 3,
          width: "100%",
          overflowX: "hidden",
        }}
      >
        {isMobile && <PullToRefreshIndicator isRefreshing={isRefreshing} pullOffset={pullOffset} />}
        
        <Suspense fallback={null}>
          <AppViewSwitcher currentView={currentView} />
        </Suspense>
      </Box>

      {isMobile && (
        <MobileNavigation 
          currentView={currentView} 
          onNavigate={handleNavigate}
          onCreateTransaction={() => setIsFormOpen(true)}
        />
      )}

      {/* Modals & Dialogs */}
      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSave}
        categories={categories}
        paymentMethods={paymentMethods}
        editTransaction={editingTransaction}
        friends={friends}
        onAddFriend={addFriend}
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
        />
      )}
    </Box>
  );
};

export default AppShell;
