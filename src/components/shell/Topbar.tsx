import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
  Badge,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  NotificationsOutlined as BellIcon,
  LightMode as SunIcon,
  DarkMode as MoonIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AccessTime as ClockIcon,
  Repeat as RepeatIcon,
  DoneAll as DoneAllIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useSettings } from "../../contexts";
import { useAppStore } from "../../hooks/useAppStore";
import { useNotifications } from "../../hooks";
import DateFilter from "../ui/DateFilter";
import { NotificationType } from "../../types";
import { AppCurrentView } from "../../types/appView";

interface TopbarProps {
  onOpenSearch: () => void;
  onOpenNewTransaction: () => void;
  onNavigate?: (view: AppCurrentView) => void;
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  budget_exceeded: <ErrorIcon sx={{ fontSize: 14, color: "#DC2626" }} />,
  budget_warning: <WarningIcon sx={{ fontSize: 14, color: "#D97706" }} />,
  unpaid_overdue: <ClockIcon sx={{ fontSize: 14, color: "#7C3AED" }} />,
  recurring_due: <RepeatIcon sx={{ fontSize: 14, color: "#2563EB" }} />,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  budget_exceeded: "#DC2626",
  budget_warning: "#D97706",
  unpaid_overdue: "#7C3AED",
  recurring_due: "#2563EB",
};

const Topbar: React.FC<TopbarProps> = ({ onOpenSearch, onOpenNewTransaction, onNavigate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { themePreference, setThemePreference } = useSettings();
  const { filters, setFilters } = useAppStore();

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(
    filters.month,
    filters.year
  );

  const [notifAnchor, setNotifAnchor] = useState<HTMLButtonElement | null>(null);
  const notifOpen = Boolean(notifAnchor);

  const handleThemeToggle = () => {
    const next = isDark ? "light" : "dark";
    setThemePreference(next);
  };

  const handleNotifClick = (link?: string) => {
    setNotifAnchor(null);
    if (link && onNavigate) onNavigate(link as AppCurrentView);
  };

  const preview = notifications.slice(0, 5);

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

      {/* Date filter */}
      <DateFilter
        month={filters.month}
        year={filters.year}
        onDateChange={(month, year) => setFilters({ month, year })}
        showIcon
      />

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
          <Badge badgeContent={unreadCount} color="error" max={9}>
            <BellIcon sx={{ fontSize: 17 }} />
          </Badge>
        </IconButton>
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
        {/* Header */}
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
          {unreadCount > 0 && (
            <Typography
              sx={{
                ml: 1,
                px: "6px",
                py: "1px",
                borderRadius: "6px",
                fontSize: 11,
                fontWeight: 700,
                bgcolor: "error.main",
                color: "#fff",
              }}
            >
              {unreadCount}
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          {unreadCount > 0 && (
            <Box
              onClick={markAllAsRead}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: 12,
                fontWeight: 600,
                color: "primary.main",
                cursor: "pointer",
                "&:hover": { opacity: 0.75 },
              }}
            >
              <DoneAllIcon sx={{ fontSize: 14 }} />
              Mark all read
            </Box>
          )}
        </Box>

        {/* Notification list */}
        {preview.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
            <BellIcon sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              No notifications
            </Typography>
          </Box>
        ) : (
          <>
            {preview.map((n, i) => (
              <Box
                key={n.id}
                onClick={() => {
                  markAsRead(n.id);
                  handleNotifClick(n.link);
                }}
                sx={{
                  px: 2,
                  py: "11px",
                  borderBottom:
                    i < preview.length - 1
                      ? `1px solid ${alpha(theme.palette.divider, 0.5)}`
                      : "none",
                  display: "flex",
                  gap: "10px",
                  cursor: n.link ? "pointer" : "default",
                  opacity: n.isRead ? 0.6 : 1,
                  "&:hover": {
                    bgcolor: n.link
                      ? isDark
                        ? alpha("#fff", 0.04)
                        : alpha("#000", 0.02)
                      : "transparent",
                  },
                }}
              >
                {!n.isRead ? (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: TYPE_COLOR[n.type],
                      mt: "5px",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box sx={{ width: 8, flexShrink: 0 }} />
                )}
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    bgcolor: alpha(TYPE_COLOR[n.type], isDark ? 0.2 : 0.1),
                  }}
                >
                  {TYPE_ICON[n.type]}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: n.isRead ? 500 : 700,
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: "2px" }}>
                    {n.body}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* View all link */}
            {onNavigate && (
              <Box
                onClick={() => {
                  setNotifAnchor(null);
                  onNavigate("notifications");
                }}
                sx={{
                  px: 2,
                  py: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  cursor: "pointer",
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  color: "primary.main",
                  fontSize: 13,
                  fontWeight: 600,
                  "&:hover": { bgcolor: isDark ? alpha("#fff", 0.03) : alpha("#000", 0.02) },
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 14 }} />
                View all notifications
              </Box>
            )}
          </>
        )}
      </Popover>

      {/* Theme toggle */}
      <IconButton
        onClick={handleThemeToggle}
        title={isDark ? "Dark mode — click for light" : "Light mode — click for dark"}
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
        {isDark ? <MoonIcon sx={{ fontSize: 17 }} /> : <SunIcon sx={{ fontSize: 17 }} />}
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
