import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import { Logout as LogOutIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { ThemePreference } from "../../types";
import ThemeSwitch from "../ThemeSwitch";

const MotionAppBar = motion.create(AppBar);

interface MobileHeaderProps {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onLogout: () => void;
}

/**
 * MobileHeader - Sleek mobile app bar with glassmorphism
 */
const MobileHeader: React.FC<MobileHeaderProps> = ({
  themePreference,
  onThemeChange,
  onLogout,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <MotionAppBar
      position="fixed"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      sx={{
        // Glassmorphism
        bgcolor: isDarkMode
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha("#FFFFFF", 0.85),
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        boxShadow: isDarkMode
          ? `0 4px 20px -4px ${alpha("#000000", 0.4)}`
          : `0 4px 20px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
      elevation={0}
    >
      <Toolbar>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
          style={{ display: "flex", alignItems: "center", gap: 8, flexGrow: 1 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.02em",
            }}
          >
            Nix
          </Typography>
        </motion.div>

        {/* Theme Switch */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ThemeSwitch
            value={themePreference}
            onChange={onThemeChange}
            compact
          />
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
        >
          <IconButton
            onClick={onLogout}
            sx={{
              ml: 1,
              color: theme.palette.error.main,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.1),
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <LogOutIcon />
          </IconButton>
        </motion.div>
      </Toolbar>
    </MotionAppBar>
  );
};

export default MobileHeader;

