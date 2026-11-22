import React from "react";
import { Box, useTheme, alpha } from "@mui/material";
import {
  Add as AddIcon,
  GridView as HomeIcon,
  Receipt as TransactionsIcon,
  Category as CategoriesIcon,
  Person as ProfileIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

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
      minWidth: 44,
      minHeight: 44,
      flex: "1 1 0",
      cursor: "pointer",
      color: isActive ? primaryColor : "text.secondary",
      transition: "color 0.2s ease",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      "&:active": { opacity: 0.7 },
    }}
  >
    <Box sx={{ fontSize: 22, lineHeight: 1 }}>{icon}</Box>
    <Box
      component="span"
      sx={{
        fontSize: "0.72rem",
        fontWeight: isActive ? 700 : 500,
        lineHeight: 1.2,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  </Box>
);

const NAV_HEIGHT = 72;

import { AppCurrentView } from "@/shared/types/appView";

interface MobileNavigationProps {
  currentView: AppCurrentView;
  onNavigate: (view: AppCurrentView) => void;
  onOpenProfile?: () => void;
  onOpenNewTransaction: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onNavigate,
  onOpenProfile,
  onOpenNewTransaction,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {/* Fade gradient above nav bar */}
      <Box
        sx={{
          position: "fixed",
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          left: 0,
          right: 0,
          height: 40,
          background: `linear-gradient(to bottom, transparent 0%, ${theme.palette.background.default} 100%)`,
          pointerEvents: "none",
          zIndex: 1199,
        }}
      />

      <Box
        component="nav"
        aria-label={t("nav.menu")}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          bgcolor: alpha(theme.palette.background.paper, 0.96),
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderTop: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === "dark"
            ? `0 -4px 20px -4px rgba(0,0,0,0.5)`
            : `0 -4px 20px -4px rgba(0,0,0,0.06)`,
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
            px: 1,
            position: "relative",
          }}
        >
          {/* Home */}
          <NavItem
            label={t("nav.dashboard")}
            icon={<HomeIcon fontSize="inherit" />}
            isActive={currentView === "dashboard"}
            onClick={() => onNavigate("dashboard")}
            primaryColor={theme.palette.primary.main}
          />

          {/* Transactions */}
          <NavItem
            label={t("nav.transactions")}
            icon={<TransactionsIcon fontSize="inherit" />}
            isActive={currentView === "transactions"}
            onClick={() => onNavigate("transactions")}
            primaryColor={theme.palette.primary.main}
          />

          <Box sx={{ flex: "1 1 0", display: "flex", justifyContent: "center", minWidth: 48 }}>
            <Box
              component="button"
              type="button"
              onClick={onOpenNewTransaction}
              aria-label={t("dashboard.newTransaction")}
              sx={{
                width: 48,
                height: 48,
                border: 0,
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.32)}`,
                cursor: "pointer",
                touchAction: "manipulation",
                "&:active": { bgcolor: "primary.dark" },
              }}
            >
              <AddIcon aria-hidden="true" />
            </Box>
          </Box>

          {/* Categories */}
          <NavItem
            label="Categorias"
            icon={<CategoriesIcon fontSize="inherit" />}
            isActive={currentView === "categories"}
            onClick={() => onNavigate("categories")}
            primaryColor={theme.palette.primary.main}
          />

          {/* Profile */}
          <NavItem
            label="Perfil"
            icon={<ProfileIcon fontSize="inherit" />}
            isActive={false}
            onClick={() => onOpenProfile?.()}
            primaryColor={theme.palette.primary.main}
          />
        </Box>
      </Box>
    </>
  );
};

export default MobileNavigation;
