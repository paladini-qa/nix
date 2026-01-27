import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout as LogOutIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { usePrivacy } from "../../contexts";

const MotionAppBar = motion.create(AppBar);
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
    <MotionAppBar
      position="fixed"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      sx={{
        // Glassmorphism
        bgcolor: isDarkMode
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha("#FFFFFF", 0.92),
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        boxShadow: isDarkMode
          ? `0 4px 20px -4px ${alpha("#000000", 0.4)}`
          : `0 4px 20px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
      elevation={0}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64 }, // Taller for better touch
          px: { xs: 1.5 },
        }}
      >
        {/* Hamburger Menu Button - Hidden on mobile (using bottom navigation) */}
        <MotionBox
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
          sx={{ display: { xs: "none", md: "block" } }}
        >
          <IconButton
            onClick={onMenuOpen}
            aria-label="Open navigation menu"
            sx={{
              width: 48,
              height: 48,
              color: "text.primary",
              transition: "all 0.2s ease",
              borderRadius: "14px",
              "&:hover": {
                bgcolor: isDarkMode
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.08),
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <MenuIcon sx={{ fontSize: 26 }} />
          </IconButton>
        </MotionBox>

        {/* Centered Logo */}
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
            sx={{
              width: 32,
              height: 32,
              objectFit: "contain",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.02em",
              fontSize: 20,
            }}
          >
            Nix
          </Typography>
        </MotionBox>

        {/* Privacy Toggle Button */}
        <MotionBox
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, type: "spring", stiffness: 400 }}
        >
          <Tooltip title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}>
            <IconButton
              onClick={togglePrivacyMode}
              aria-label={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
              sx={{
                width: 48,
                height: 48,
                color: isPrivacyMode ? theme.palette.primary.main : "text.secondary",
                transition: "all 0.2s ease",
                borderRadius: "14px",
                bgcolor: isPrivacyMode
                  ? isDarkMode
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.1)
                  : "transparent",
                "&:hover": {
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.primary.main, 0.12),
                  transform: "scale(1.05)",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              {isPrivacyMode ? (
                <VisibilityOffIcon sx={{ fontSize: 24 }} />
              ) : (
                <VisibilityIcon sx={{ fontSize: 24 }} />
              )}
            </IconButton>
          </Tooltip>
        </MotionBox>

        {/* Logout Button */}
        <MotionBox
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
        >
          <IconButton
            onClick={onLogout}
            aria-label="Logout"
            sx={{
              width: 48,
              height: 48,
              color: theme.palette.error.main,
              transition: "all 0.2s ease",
              borderRadius: "14px",
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.1),
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <LogOutIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </MotionBox>
      </Toolbar>
    </MotionAppBar>
  );
};

export default MobileHeader;
