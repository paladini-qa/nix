import React, { useState } from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  useTheme,
  alpha,
  Fab,
} from "@mui/material";
import {
  Receipt as TransactionsIcon,
  CreditCard as PaymentMethodsIcon,
  MoreVert as OthersIcon,
  Add as AddIcon,
  GridView as GridViewIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import OthersGridModal from "./OthersGridModal";

const MotionPaper = motion.create(Paper);

// Altura da barra de navegação (para calcular fade gradient)
const NAV_HEIGHT = 80;

// View type matching App.tsx
type ViewType =
  | "dashboard"
  | "transactions"
  | "splits"
  | "shared"
  | "recurring"
  | "nixai"
  | "budgets"
  | "goals"
  | "analytics"
  | "settings"
  | "paymentMethods"
  | "categories"
  | "openFinance"
  | "planning";

interface MobileNavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
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
      currentView === "openFinance" ||
      currentView === "categories" ||
      currentView === "budgets" ||
      currentView === "goals" ||
      currentView === "planning" ||
      currentView === "nixai"
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
      onNavigate(value as ViewType);
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
      <MotionPaper
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          // Glassmorphism
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.9)
            : alpha("#FFFFFF", 0.95),
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          boxShadow: isDarkMode
            ? `0 -4px 20px -4px ${alpha("#000000", 0.4)}`
            : `0 -4px 20px -4px ${alpha(theme.palette.primary.main, 0.08)}`,
          // Safe area for devices with home indicator
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          borderRadius: 0,
        }}
        elevation={0}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            height: NAV_HEIGHT,
            px: 1,
            position: "relative",
          }}
        >
          {/* Dashboard */}
          <Box
            onClick={() => handleNavigation("dashboard")}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              flex: 1,
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
                fontSize: 24,
                transition: "transform 0.2s ease",
                transform:
                  currentView === "dashboard" ? "scale(1.15)" : "scale(1)",
              }}
            />
            <Box
              component="span"
              sx={{
                fontSize: "0.65rem",
                fontWeight: currentView === "dashboard" ? 600 : 500,
              }}
            >
              Dashboard
            </Box>
          </Box>

          {/* Transactions */}
          <Box
            onClick={() => handleNavigation("transactions")}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              flex: 1,
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
                fontSize: 24,
                transition: "transform 0.2s ease",
                transform:
                  currentView === "transactions" ? "scale(1.15)" : "scale(1)",
              }}
            />
            <Box
              component="span"
              sx={{
                fontSize: "0.65rem",
                fontWeight: currentView === "transactions" ? 600 : 500,
              }}
            >
              Transactions
            </Box>
          </Box>

          {/* Create Button - Central, maior */}
          <Fab
            color="primary"
            onClick={() => handleNavigation("create")}
            sx={{
              width: 56,
              height: 56,
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: `0 4px 16px -4px ${alpha(
                theme.palette.primary.main,
                0.4
              )}`,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateX(-50%) translateY(-4px)",
                boxShadow: `0 8px 24px -4px ${alpha(
                  theme.palette.primary.main,
                  0.5
                )}`,
              },
              "&:active": {
                transform: "translateX(-50%) translateY(-2px) scale(0.95)",
              },
            }}
            aria-label="Create transaction"
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Fab>

          {/* Payment Methods */}
          <Box
            onClick={() => handleNavigation("paymentMethods")}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              flex: 1,
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
                fontSize: 24,
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
                fontSize: "0.65rem",
                fontWeight: currentView === "paymentMethods" ? 600 : 500,
              }}
            >
              Payment Methods
            </Box>
          </Box>

          {/* Others */}
          <Box
            onClick={() => handleNavigation("others")}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              flex: 1,
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
                fontSize: 24,
                transition: "transform 0.2s ease",
                transform:
                  getActiveValue() === "others" ? "scale(1.15)" : "scale(1)",
              }}
            />
            <Box
              component="span"
              sx={{
                fontSize: "0.65rem",
                fontWeight: getActiveValue() === "others" ? 600 : 500,
              }}
            >
              Others
            </Box>
          </Box>
        </Box>
      </MotionPaper>

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

