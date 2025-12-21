import React from "react";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Settings as SettingsIcon,
  Repeat as RepeatIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

const MotionPaper = motion.create(Paper);

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
  | "categories";

interface MobileNavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

/**
 * MobileNavigation - Bottom navigation bar for mobile with glassmorphism
 */
const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onNavigate,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
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
      <BottomNavigation
        value={currentView}
        onChange={(_, newValue) => onNavigate(newValue)}
        showLabels
        sx={{
          bgcolor: "transparent",
          height: 64,
          "& .MuiBottomNavigationAction-root": {
            minWidth: 60,
            maxWidth: 100,
            color: "text.secondary",
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              color: "primary.main",
              "& .MuiSvgIcon-root": {
                transform: "scale(1.15)",
              },
            },
            "&:active": {
              "& .MuiSvgIcon-root": {
                transform: "scale(0.9)",
              },
            },
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.65rem",
            fontWeight: 500,
            mt: 0.5,
            "&.Mui-selected": {
              fontSize: "0.65rem",
              fontWeight: 600,
            },
          },
          "& .MuiSvgIcon-root": {
            transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          value="dashboard"
          icon={<DashboardIcon />}
        />
        <BottomNavigationAction
          label="Transactions"
          value="transactions"
          icon={<WalletIcon />}
        />
        <BottomNavigationAction
          label="Shared"
          value="shared"
          icon={<PeopleIcon />}
        />
        <BottomNavigationAction
          label="Recurring"
          value="recurring"
          icon={<RepeatIcon />}
        />
        <BottomNavigationAction
          label="Settings"
          value="settings"
          icon={<SettingsIcon />}
        />
      </BottomNavigation>
    </MotionPaper>
  );
};

export default MobileNavigation;

