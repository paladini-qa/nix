import React from "react";
import { Box, useTheme, alpha } from "@mui/material";
import {
  GridView as HomeIcon,
  Receipt as TransactionsIcon,
  Category as CategoriesIcon,
  Person as ProfileIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AutoAwesome as NixAIIcon } from "@mui/icons-material";

const MotionBox = motion.create(Box);

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
      position: "relative",
      "&:active": { transform: "scale(0.92)" },
    }}
  >
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
        fontSize: "0.72rem",
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

const NAV_HEIGHT = 72;

import { AppCurrentView } from "../../types/appView";

interface MobileNavigationProps {
  currentView: AppCurrentView;
  onNavigate: (view: AppCurrentView) => void;
  onOpenProfile?: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onNavigate,
  onOpenProfile,
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

          {/* Nix AI — center gradient circle */}
          <Box
            component="button"
            type="button"
            aria-label="Nix AI"
            onClick={() => onNavigate("nixai")}
            sx={{
              flex: "0 0 auto",
              width: 46,
              height: 46,
              minWidth: 46,
              borderRadius: "50%",
              border: "none",
              padding: 0,
              cursor: "pointer",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #a855f7, #c084fc)",
              boxShadow: "0 6px 14px -4px rgba(168,85,247,0.55)",
              mt: "-10px",
              transition: "all 0.2s ease",
              "&:active": { transform: "scale(0.93)" },
            }}
          >
            <NixAIIcon sx={{ fontSize: 20, color: "#fff" }} />
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
      </MotionBox>
    </>
  );
};

export default MobileNavigation;
