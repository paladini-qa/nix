import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  NotificationsOutlined as BellIcon,
  LightMode as SunIcon,
  DarkMode as MoonIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useSettings } from "../../contexts";

interface TopbarProps {
  onOpenSearch: () => void;
  onOpenNewTransaction: () => void;
}

const NOTIFICATIONS = [
  { text: "Spotify charge — R$ 34.90", sub: "Pending payment · Apr 30", unread: true },
  { text: "Budget warning: Groceries", sub: "83% of monthly limit reached", unread: true },
  { text: "Goal milestone: Emergency Fund", sub: "You hit 50% of your target!", unread: true },
  { text: "Lucas paid you R$ 124.50", sub: "Settled: Dinner — Outback", unread: false },
  { text: "Recurring detected", sub: "ChatGPT Plus — R$ 109.90/mo", unread: false },
];

const Topbar: React.FC<TopbarProps> = ({ onOpenSearch, onOpenNewTransaction }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { themePreference, setThemePreference } = useSettings();

  const [notifAnchor, setNotifAnchor] = useState<HTMLButtonElement | null>(null);
  const notifOpen = Boolean(notifAnchor);

  const handleThemeToggle = () => {
    const next = isDark ? "light" : "dark";
    setThemePreference(next);
  };

  return (
    <Box
      sx={{
        height: 60,
        px: "28px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        bgcolor: "background.paper",
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Search box */}
      <Box
        onClick={onOpenSearch}
        sx={{
          flex: 1,
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          px: "11px",
          height: 38,
          borderRadius: "10px",
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.03),
          cursor: "text",
          transition: "border-color 0.15s",
          "&:hover": { borderColor: theme.palette.primary.main },
        }}
      >
        <SearchIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13.5, color: "text.disabled", userSelect: "none" }}>
          Search transactions, categories…
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* Notifications bell */}
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={(e) => setNotifAnchor(e.currentTarget)}
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.04),
            color: "text.secondary",
            "&:hover": {
              bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#000", 0.07),
              color: "text.primary",
              transform: "none",
            },
          }}
        >
          <BellIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "error.main",
            border: `2px solid ${theme.palette.background.paper}`,
            pointerEvents: "none",
          }}
        />
      </Box>

      {/* Notifications popover */}
      <Popover
        open={notifOpen}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: 340,
            borderRadius: "14px",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: isDark
              ? "0 16px 40px -12px rgba(0,0,0,0.6)"
              : "0 16px 40px -12px rgba(0,0,0,0.12)",
            mt: "8px",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: "14px",
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Notifications</Typography>
          <Box sx={{ flex: 1 }} />
          <Typography
            sx={{ fontSize: 12, fontWeight: 600, color: "primary.main", cursor: "pointer" }}
          >
            Mark all read
          </Typography>
        </Box>
        {NOTIFICATIONS.map((n, i) => (
          <Box
            key={i}
            sx={{
              px: 2,
              py: "12px",
              borderBottom: i < NOTIFICATIONS.length - 1
                ? `1px solid ${alpha(theme.palette.divider, 0.5)}`
                : "none",
              display: "flex",
              gap: "10px",
              cursor: "pointer",
              "&:hover": { bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.02) },
            }}
          >
            {n.unread ? (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  mt: "6px",
                  flexShrink: 0,
                }}
              />
            ) : (
              <Box sx={{ width: 8, flexShrink: 0 }} />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{n.text}</Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: "2px" }}>
                {n.sub}
              </Typography>
            </Box>
          </Box>
        ))}
      </Popover>

      {/* Theme toggle */}
      <IconButton
        onClick={handleThemeToggle}
        sx={{
          width: 38,
          height: 38,
          borderRadius: "10px",
          bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.04),
          color: "text.secondary",
          "&:hover": {
            bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#000", 0.07),
            color: "text.primary",
            transform: "none",
          },
        }}
      >
        {isDark ? <SunIcon sx={{ fontSize: 17 }} /> : <MoonIcon sx={{ fontSize: 17 }} />}
      </IconButton>

      {/* New transaction button */}
      <Button
        variant="contained"
        startIcon={<AddIcon sx={{ fontSize: "14px !important" }} />}
        onClick={onOpenNewTransaction}
        sx={{
          borderRadius: "10px",
          px: "14px",
          py: "8px",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "none",
          boxShadow: "0 6px 14px -8px rgba(168,85,247,0.7)",
          "&:hover": {
            boxShadow: "0 8px 20px -6px rgba(168,85,247,0.6)",
          },
        }}
      >
        New
      </Button>
    </Box>
  );
};

export default Topbar;
