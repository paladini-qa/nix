import React from "react";
import { Box, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";
import { Menu, LogOut, Eye, EyeOff } from "lucide-react";
import { IconButton, Text } from "@radix-ui/themes";
import { usePrivacy } from "../../contexts";

const MotionBox = motion.create(Box);

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onLogout: () => void;
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
  onMenuOpen,
  onLogout,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

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
        bgcolor: isDarkMode
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha("#FFFFFF", 0.92),
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        boxShadow: isDarkMode
          ? `0 4px 20px -4px ${alpha("#000000", 0.4)}`
          : `0 4px 20px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
        display: "flex",
        alignItems: "center",
        minHeight: 64,
        px: 1.5,
      }}
    >
      <MotionBox
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        sx={{ display: { xs: "none", md: "block" } }}
      >
        <IconButton
          size="3"
          variant="ghost"
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          style={{ width: 48, height: 48 }}
        >
          <Menu size={26} />
        </IconButton>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Box
          component="img"
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Nix Logo"
          sx={{ width: 32, height: 32, objectFit: "contain" }}
        />
        <Text size="5" weight="bold" style={{ letterSpacing: "-0.02em", fontSize: 20 }}>
          Nix
        </Text>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18, type: "spring", stiffness: 400 }}
      >
        <IconButton
          size="3"
          variant={isPrivacyMode ? "soft" : "ghost"}
          color={isPrivacyMode ? "purple" : "gray"}
          onClick={togglePrivacyMode}
          aria-label={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
          title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
          style={{ width: 48, height: 48 }}
        >
          {isPrivacyMode ? <EyeOff size={24} /> : <Eye size={24} />}
        </IconButton>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
      >
        <IconButton
          size="3"
          variant="ghost"
          color="red"
          onClick={onLogout}
          aria-label="Logout"
          style={{ width: 48, height: 48 }}
        >
          <LogOut size={24} />
        </IconButton>
      </MotionBox>
    </MotionBox>
  );
};

export default MobileHeader;
