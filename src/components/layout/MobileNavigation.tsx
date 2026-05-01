import React, { useState } from "react";
import { Box, useTheme, alpha } from "@mui/material";
import {
  Receipt as TransactionsIcon,
  CreditCard as PaymentMethodsIcon,
  MoreVert as OthersIcon,
  Add as AddIcon,
  GridView as GridViewIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import OthersGridModal from "./OthersGridModal";

const MotionBox = motion.create(Box);

// Item de navegação reutilizável com indicador animado e touch target correto
const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  primaryColor: string;
}> = ({ label, icon, isActive, onClick, primaryColor }) => (
  <Box
    component="button"
    type="button"
    aria-label={label}
    onClick={onClick}
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
      // Touch target mínimo 44×44px (Apple HIG / Material)
      minWidth: 44,
      minHeight: 44,
      flex: "1 1 0",
      cursor: "pointer",
      color: isActive ? primaryColor : "text.secondary",
      transition: "color 0.2s ease",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      position: "relative",
      "&:active": { transform: "scale(0.92)" },
    }}
  >
    {/* Pill indicadora animada atrás do ícone */}
    <AnimatePresence>
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -58%)",
            width: 36,
            height: 20,
            borderRadius: 10,
            background: `${primaryColor}22`,
            pointerEvents: "none",
          }}
        />
      )}
    </AnimatePresence>

    <Box
      sx={{
        fontSize: 22,
        lineHeight: 1,
        transition: "transform 0.2s ease",
        transform: isActive ? "scale(1.15)" : "scale(1)",
        position: "relative",
        zIndex: 1,
      }}
    >
      {icon}
    </Box>

    <Box
      component="span"
      sx={{
        fontSize: "0.7rem",
        fontWeight: isActive ? 700 : 500,
        lineHeight: 1.2,
        textAlign: "center",
        whiteSpace: "nowrap",
        letterSpacing: isActive ? "0.01em" : 0,
        position: "relative",
        zIndex: 1,
      }}
    >
      {label}
    </Box>
  </Box>
);

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
  const { t } = useTranslation();
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
          <NavItem
            label={t("nav.dashboard")}
            icon={<GridViewIcon fontSize="inherit" />}
            isActive={currentView === "dashboard"}
            onClick={() => handleNavigation("dashboard")}
            primaryColor={theme.palette.primary.main}
          />

          <NavItem
            label={t("nav.transactions")}
            icon={<TransactionsIcon fontSize="inherit" />}
            isActive={currentView === "transactions"}
            onClick={() => handleNavigation("transactions")}
            primaryColor={theme.palette.primary.main}
          />

          {/* Create Button - FAB central */}
          <Box
            component="button"
            type="button"
            aria-label="Create transaction"
            onClick={() => handleNavigation("create")}
            className="nix-fab-create"
            sx={{
              flex: "0 0 auto",
              width: 52,
              height: 52,
              minWidth: 52,
              minHeight: 52,
              borderRadius: "16px",
              border: "none",
              padding: 0,
              cursor: "pointer",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: theme.palette.primary.main,
              boxShadow: isDarkMode
                ? `0 4px 16px rgba(167, 139, 250, 0.45)`
                : `0 4px 16px rgba(124, 58, 237, 0.38)`,
              transition: "all 0.2s ease",
              "&:active": { transform: "scale(0.94)" },
            }}
          >
            <AddIcon sx={{ fontSize: 28, color: "#fff" }} />
          </Box>

          <NavItem
            label={t("nav.paymentMethods")}
            icon={<PaymentMethodsIcon fontSize="inherit" />}
            isActive={currentView === "paymentMethods"}
            onClick={() => handleNavigation("paymentMethods")}
            primaryColor={theme.palette.primary.main}
          />

          <NavItem
            label={t("nav.others")}
            icon={<OthersIcon fontSize="inherit" />}
            isActive={getActiveValue() === "others"}
            onClick={() => handleNavigation("others")}
            primaryColor={theme.palette.primary.main}
          />
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

