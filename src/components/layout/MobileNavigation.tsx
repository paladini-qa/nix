import React, { useState } from "react";
import { Box, useTheme, alpha } from "@mui/material";
import {
  Receipt as TransactionsIcon,
  CreditCard as PaymentMethodsIcon,
  MoreVert as OthersIcon,
  Add as AddIcon,
  GridView as GridViewIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import OthersGridModal from "./OthersGridModal";

const MotionBox = motion.create(Box);

// Altura da barra de navegação (para calcular fade gradient)
const NAV_HEIGHT = 80;

// View type matching App.tsx
import { AppCurrentView } from "../../types/appView";

interface MobileNavigationProps {
  currentView: AppCurrentView;
  onNavigate: (view: AppCurrentView) => void;
  onCreateTransaction?: () => void;
}

/**
 * MobileNavigation - Bottom navigation bar for mobile with glassmorphism
 * New layout: Dashboard, Transactions, Create Button, Payment Methods, Others
 */
const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onNavigate,
  onCreateTransaction,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [othersModalOpen, setOthersModalOpen] = useState(false);

  // Determina qual item está ativo (considerando que "others" não é uma view real)
  const getActiveValue = () => {
    if (
      currentView === "splits" ||
      currentView === "shared" ||
      currentView === "recurring" ||
      currentView === "categories" ||
      currentView === "nixai" ||
      currentView === "goals" ||
      currentView === "budgets" ||
      currentView === "analytics" ||
      currentView === "planning" ||
      currentView === "import" ||
      currentView === "fiscal-report" ||
      currentView === "debt-calculator" ||
      currentView === "subscriptions"
    ) {
      return "others";
    }
    return currentView;
  };

  const handleNavigation = (value: string) => {
    if (value === "others") {
      setOthersModalOpen(true);
    } else if (value === "create") {
      onCreateTransaction?.();
    } else {
      onNavigate(value as AppCurrentView);
    }
  };

  return (
    <>
      {/* Gradiente de fade-out para suavizar transição de conteúdo */}
      <Box
        sx={{
          position: "fixed",
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          left: 0,
          right: 0,
          height: 48,
          background: isDarkMode
            ? `linear-gradient(to bottom, transparent 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(to bottom, transparent 0%, ${theme.palette.background.default} 100%)`,
          pointerEvents: "none",
          zIndex: 1199,
        }}
      />
      <MotionBox
        component="nav"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.92)
            : alpha("#FEF8F2", 0.96),
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderTop: `1px solid ${isDarkMode ? alpha(theme.palette.primary.main, 0.12) : alpha("#C4885F", 0.18)}`,
          boxShadow: isDarkMode
            ? `0 -4px 20px -4px rgba(28, 16, 8, 0.5)`
            : `0 -4px 20px -4px rgba(124, 66, 38, 0.10)`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          borderRadius: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
            height: NAV_HEIGHT,
            px: 3,
            position: "relative",
            maxWidth: "100%",
          }}
        >
          {/* Dashboard */}
          <Box
            component="button"
            type="button"
            role="button"
            aria-label="Dashboard"
            onClick={() => handleNavigation("dashboard")}
            sx={{
              border: 0,
              background: "none",
              padding: 0,
              font: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              minWidth: 0,
              flex: "0 0 auto",
              cursor: "pointer",
              color:
                currentView === "dashboard"
                  ? theme.palette.primary.main
                  : "text.secondary",
              transition: "all 0.2s ease",
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <GridViewIcon
              sx={{
                fontSize: 22,
                transition: "transform 0.2s ease",
                transform:
                  currentView === "dashboard" ? "scale(1.15)" : "scale(1)",
              }}
            />
            <Box
              component="span"
              sx={{
                fontSize: "0.72rem",
                fontWeight: currentView === "dashboard" ? 600 : 500,
                lineHeight: 1.2,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              Dashboard
            </Box>
          </Box>

          {/* Transactions */}
          <Box
            component="button"
            type="button"
            role="button"
            aria-label="Transactions"
            onClick={() => handleNavigation("transactions")}
            sx={{
              border: 0,
              background: "none",
              padding: 0,
              font: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              minWidth: 0,
              flex: "0 0 auto",
              cursor: "pointer",
              color:
                currentView === "transactions"
                  ? theme.palette.primary.main
                  : "text.secondary",
              transition: "all 0.2s ease",
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <TransactionsIcon
              sx={{
                fontSize: 22,
                transition: "transform 0.2s ease",
                transform:
                  currentView === "transactions" ? "scale(1.15)" : "scale(1)",
              }}
            />
            <Box
              component="span"
              sx={{
                fontSize: "0.72rem",
                fontWeight: currentView === "transactions" ? 600 : 500,
                lineHeight: 1.2,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              Transactions
            </Box>
          </Box>

          {/* Create Button - Central FAB, 48px - botão MUI para o + aparecer */}
          <Box
            component="button"
            type="button"
            role="button"
            aria-label="Create transaction"
            onClick={() => handleNavigation("create")}
            className="nix-fab-create"
            sx={{
              flex: "0 0 auto",
              width: 48,
              height: 48,
              minWidth: 48,
              minHeight: 48,
              borderRadius: "16px",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: theme.palette.primary.main,
              color: theme.palette.mode === "dark" ? "#2C1A11" : "#fff",
              boxShadow: theme.palette.mode === "dark"
                ? `0 4px 14px rgba(212, 168, 117, 0.45)`
                : `0 4px 14px rgba(124, 66, 38, 0.38)`,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: theme.palette.primary.light,
                transform: "scale(1.05)",
                boxShadow: `0 6px 20px rgba(124, 66, 38, 0.45)`,
              },
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            <AddIcon sx={{ fontSize: 26, color: "#fff" }} />
          </Box>

          {/* Payment Methods */}
          <Box
            component="button"
            type="button"
            role="button"
            aria-label="Payment Methods"
            onClick={() => handleNavigation("paymentMethods")}
            sx={{
              border: 0,
              background: "none",
              padding: 0,
              font: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              minWidth: 0,
              flex: "0 0 auto",
              cursor: "pointer",
              color:
                currentView === "paymentMethods"
                  ? theme.palette.primary.main
                  : "text.secondary",
              transition: "all 0.2s ease",
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <PaymentMethodsIcon
              sx={{
                fontSize: 22,
                transition: "transform 0.2s ease",
                transform:
                  currentView === "paymentMethods"
                    ? "scale(1.15)"
                    : "scale(1)",
              }}
            />
            <Box
              component="span"
              sx={{
                fontSize: "0.72rem",
                fontWeight: currentView === "paymentMethods" ? 600 : 500,
                lineHeight: 1.2,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              Payment Methods
            </Box>
          </Box>

          {/* Others */}
          <Box
            component="button"
            type="button"
            role="button"
            aria-label="Others"
            onClick={() => handleNavigation("others")}
            sx={{
              border: 0,
              background: "none",
              padding: 0,
              font: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              minWidth: 0,
              flex: "0 0 auto",
              cursor: "pointer",
              color:
                getActiveValue() === "others"
                  ? theme.palette.primary.main
                  : "text.secondary",
              transition: "all 0.2s ease",
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <OthersIcon
              sx={{
                fontSize: 22,
                transition: "transform 0.2s ease",
                transform:
                  getActiveValue() === "others" ? "scale(1.15)" : "scale(1)",
              }}
            />
            <Box
              component="span"
              sx={{
                fontSize: "0.72rem",
                fontWeight: getActiveValue() === "others" ? 600 : 500,
                lineHeight: 1.2,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              Others
            </Box>
          </Box>
        </Box>
      </MotionBox>

      {/* Others Grid Modal */}
      <OthersGridModal
        open={othersModalOpen}
        onClose={() => setOthersModalOpen(false)}
        onNavigate={(view) => {
          onNavigate(view);
          setOthersModalOpen(false);
        }}
      />
    </>
  );
};

export default MobileNavigation;

