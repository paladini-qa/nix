import React from "react";
import logoUrl from "../../assets/logo.png";
import { Box, Badge, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";
import { Eye, EyeOff, Bell } from "lucide-react";
import { IconButton, Text } from "@radix-ui/themes";
import { usePrivacy } from "../../contexts";
import { useAppStore } from "../../hooks/useAppStore";
import { useNotifications } from "../../hooks";
import DateFilter from "../ui/DateFilter";
import { AppCurrentView } from "../../types/appView";

const MotionBox = motion.create(Box);

interface MobileHeaderProps {
  onOpenDrawer?: () => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
  onNavigate?: (view: AppCurrentView) => void;
}

/**
 * MobileHeader - Sleek mobile app bar with hamburger menu
 * 
 * Features:
 * - Hamburger menu button on the left
 * - Centered logo
 * - Logout button on the right
 * - Glassmorphism styling
 * - Touch-friendly tap targets (min 44px)
 */
const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenDrawer,
  onOpenSearch,
  onOpenProfile,
  onNavigate,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { filters, setFilters } = useAppStore();
  const { unreadCount } = useNotifications(filters.month, filters.year);

  return (
    <MotionBox
      component="header"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        // Glassmorphism via CSS vars do design system
        bgcolor: "var(--nix-glass-bg)",
        backdropFilter: "blur(var(--nix-glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--nix-glass-blur)) saturate(180%)",
        borderBottom: "1px solid var(--nix-glass-border)",
        boxShadow: isDarkMode
          ? `0 4px 20px -4px ${alpha("#000000", 0.4)}`
          : `0 4px 20px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
        display: "flex",
        alignItems: "center",
        minHeight: 64,
        px: 1.5,
        // Respeita status bar nativo (safe area)
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
        }}
      >
        <Box
          component="img"
          src={logoUrl}
          alt="Finance Control Logo"
          sx={{ width: 32, height: 32, objectFit: "contain", borderRadius: "9px" }}
        />
        <Text size="5" weight="bold" style={{ letterSpacing: "-0.02em", fontSize: 20 }}>
          Nix Finance
        </Text>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18, type: "spring", stiffness: 400 }}
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
      >
        <DateFilter
          month={filters.month}
          year={filters.year}
          onDateChange={(month, year) => setFilters({ month, year })}
          compact
        />
        <IconButton
          size="3"
          variant={isPrivacyMode ? "soft" : "ghost"}
          color={isPrivacyMode ? "purple" : "gray"}
          onClick={togglePrivacyMode}
          aria-label={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
          title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
          style={{ width: 44, height: 44 }}
        >
          {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
        </IconButton>
        <IconButton
          size="3"
          variant="ghost"
          color="gray"
          onClick={() => onNavigate?.("notifications")}
          aria-label="Notificações"
          title="Notificações"
          style={{ width: 44, height: 44, position: "relative" }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={9}
            sx={{ "& .MuiBadge-badge": { fontSize: 9, minWidth: 14, height: 14, p: 0 } }}
          >
            <Bell size={20} />
          </Badge>
        </IconButton>
      </MotionBox>


    </MotionBox>
  );
};

export default MobileHeader;
