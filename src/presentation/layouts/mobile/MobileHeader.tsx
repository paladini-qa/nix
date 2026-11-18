import NixLogo from "@/presentation/components/ui/NixLogo";
import React from "react";
import { Box, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "@radix-ui/themes";
import { usePrivacy } from "@/presentation/contexts";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import DateFilter from "@/presentation/components/ui/DateFilter";

const MotionBox = motion.create(Box);

interface MobileHeaderProps {
  onOpenDrawer?: () => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
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
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { filters, setFilters } = useAppStore();

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
          flex: "1 1 0%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <NixLogo size={40} />
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, type: "spring", stiffness: 400 }}
        sx={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DateFilter
          month={filters.month}
          year={filters.year}
          onDateChange={(month, year) => setFilters({ month, year })}
          compact
        />
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18, type: "spring", stiffness: 400 }}
        sx={{
          flex: "1 1 0%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.5,
        }}
      >
        <IconButton
          size="3"
          variant={isPrivacyMode ? "soft" : "ghost"}
          color={isPrivacyMode ? "purple" : "gray"}
          onClick={togglePrivacyMode}
          aria-label={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
          title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
          style={{ width: 38, height: 38 }}
        >
          {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </IconButton>
      </MotionBox>


    </MotionBox>
  );
};

export default MobileHeader;
