import React, { Suspense, lazy, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useAppStore } from "../hooks/useAppStore";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";
import { useWalletSync } from "../hooks/useWalletSync";
import { useNotification } from "../contexts";
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

const AppShell: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess } = useNotification();
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

  const { data: transactions = [], isLoading, refetch } = useTransactionsQuery();

  const currentView: AppCurrentView = (ROUTE_VIEWS[location.pathname] as AppCurrentView) ?? "dashboard";

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
      {!isMobile && <Sidebar currentView={currentView} />}
      
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

      {isMobile && <MobileNavigation currentView={currentView} />}

      {/* Modals & Dialogs */}
      <TransactionForm 
        open={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        editingTransaction={editingTransaction}
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
