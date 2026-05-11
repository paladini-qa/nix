import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  AccessTime as ClockIcon,
  Repeat as RepeatIcon,
  CheckCircle as CheckCircleIcon,
  DoneAll as DoneAllIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { AppNotification, NotificationType } from "../../types";
import { useNotifications } from "../../hooks";
import { useAppStore } from "../../hooks/useAppStore";
import EmptyState from "../ui/EmptyState";
import { AppCurrentView } from "../../types/appView";

const MotionBox = motion.create(Box);

interface NotificationsViewProps {
  onNavigate: (view: AppCurrentView) => void;
}

type FilterTab = "all" | "unread" | NotificationType;

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  budget_exceeded: {
    label: "Budget Exceeded",
    icon: <ErrorIcon fontSize="small" />,
    color: "#DC2626",
  },
  budget_warning: {
    label: "Budget Warning",
    icon: <WarningIcon fontSize="small" />,
    color: "#D97706",
  },
  unpaid_overdue: {
    label: "Overdue",
    icon: <ClockIcon fontSize="small" />,
    color: "#7C3AED",
  },
  recurring_due: {
    label: "Recurring Due",
    icon: <RepeatIcon fontSize="small" />,
    color: "#2563EB",
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 28, delay: i * 0.04 },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { filters } = useAppStore();

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(filters.month, filters.year);

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filtered = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.isRead;
    return n.type === activeFilter;
  });

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "budget_exceeded", label: "Exceeded" },
    { key: "budget_warning", label: "Warnings" },
    { key: "unpaid_overdue", label: "Overdue" },
    { key: "recurring_due", label: "Recurring" },
  ];

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        px: isMobile ? 0 : 3,
        py: isMobile ? 1 : 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ letterSpacing: "-0.02em", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
          >
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <IconButton
            onClick={markAllAsRead}
            size="small"
            title="Mark all as read"
            sx={{
              borderRadius: "10px",
              px: 1.5,
              py: 0.75,
              gap: 0.5,
              bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.04),
              color: "primary.main",
              fontSize: 13,
              fontWeight: 600,
              "&:hover": { bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#000", 0.07) },
            }}
          >
            <DoneAllIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Mark all read</Typography>
          </IconButton>
        )}
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          const count = tab.count ?? notifications.filter((n) => n.type === tab.key).length;
          return (
            <Chip
              key={tab.key}
              label={count > 0 ? `${tab.label} (${count})` : tab.label}
              onClick={() => setActiveFilter(tab.key)}
              size="small"
              sx={{
                borderRadius: "8px",
                fontWeight: isActive ? 700 : 500,
                bgcolor: isActive
                  ? "primary.main"
                  : isDark
                    ? alpha("#fff", 0.06)
                    : alpha("#000", 0.04),
                color: isActive ? "#fff" : "text.secondary",
                border: "none",
                cursor: "pointer",
                "& .MuiChip-label": { px: 1.25 },
                "&:hover": {
                  bgcolor: isActive
                    ? "primary.dark"
                    : isDark
                      ? alpha("#fff", 0.1)
                      : alpha("#000", 0.07),
                },
              }}
            />
          );
        })}
      </Box>

      {/* Notification Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          type="generic"
          title="No notifications"
          description={
            activeFilter === "unread"
              ? "You're all caught up!"
              : "Nothing to show for this filter"
          }
        />
      ) : (
        <Stack spacing={1.5}>
          <AnimatePresence mode="popLayout">
            {filtered.map((n, i) => (
              <NotificationCard
                key={n.id}
                notification={n}
                index={i}
                isDark={isDark}
                onMarkRead={() => markAsRead(n.id)}
                onNavigate={onNavigate}
              />
            ))}
          </AnimatePresence>
        </Stack>
      )}
    </Box>
  );
};

interface NotificationCardProps {
  notification: AppNotification;
  index: number;
  isDark: boolean;
  onMarkRead: () => void;
  onNavigate: (view: AppCurrentView) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification: n,
  index,
  isDark,
  onMarkRead,
  onNavigate,
}) => {
  const theme = useTheme();
  const meta = TYPE_META[n.type];

  const handleClick = () => {
    if (!n.isRead) onMarkRead();
    if (n.link) onNavigate(n.link as AppCurrentView);
  };

  return (
    <MotionBox
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      onClick={handleClick}
      sx={{
        position: "relative",
        p: 2,
        borderRadius: "16px",
        cursor: n.link ? "pointer" : "default",
        background: isDark
          ? alpha(theme.palette.background.paper, 0.7)
          : alpha("#fff", 0.85),
        backdropFilter: "blur(12px)",
        border: `1px solid ${
          isDark ? alpha("#fff", 0.06) : alpha("#000", 0.05)
        }`,
        borderLeft: `3px solid ${meta.color}`,
        boxShadow: n.isRead
          ? "none"
          : `0 4px 16px -4px ${alpha(meta.color, 0.2)}`,
        opacity: n.isRead ? 0.65 : 1,
        transition: "all 0.15s ease-in-out",
        "&:hover": n.link
          ? {
              transform: "translateY(-2px)",
              boxShadow: `0 8px 24px -6px ${alpha(meta.color, 0.25)}`,
              opacity: 1,
            }
          : {},
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        {/* Dot indicator */}
        {!n.isRead && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: meta.color,
              flexShrink: 0,
              mt: "6px",
            }}
          />
        )}
        {n.isRead && <Box sx={{ width: 8, flexShrink: 0 }} />}

        {/* Icon */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            bgcolor: alpha(meta.color, isDark ? 0.2 : 0.1),
            color: meta.color,
          }}
        >
          {meta.icon}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}
          >
            <Typography
              variant="body2"
              fontWeight={n.isRead ? 500 : 700}
              sx={{ fontSize: "0.9rem", color: "text.primary" }}
            >
              {n.title}
            </Typography>
            <Chip
              label={meta.label}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 600,
                bgcolor: alpha(meta.color, 0.12),
                color: meta.color,
                borderRadius: "6px",
                flexShrink: 0,
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.25, display: "block" }}
          >
            {n.body}
          </Typography>
        </Box>

        {/* Mark as read button */}
        {!n.isRead && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            title="Mark as read"
            sx={{
              flexShrink: 0,
              width: 28,
              height: 28,
              color: "text.disabled",
              "&:hover": { color: "primary.main" },
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>
    </MotionBox>
  );
};

export default NotificationsView;
