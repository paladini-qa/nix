import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  alpha,
  Tooltip,
  IconButton,
  Divider,
} from "@mui/material";
import { Avatar, Text } from "@radix-ui/themes";
import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Logout as LogOutIcon,
  Person as UserIcon,
  ChevronRight as ChevronRightIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Star as BatchRegistrationIcon,
  EmojiEvents as GoalsIcon,
  AccountBalance as BudgetsIcon,
  BarChart as AnalyticsIcon,
  CalendarMonth as PlanningIcon,
  Upload as ImportIcon,
  Description as FiscalIcon,
  Calculate as DebtCalcIcon,
  TrendingUp as InvestmentsIcon,
  Subscriptions as SubscriptionsIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { SIDEBAR_WIDTH } from "../layoutConstants";
import type { AppCurrentView } from "../types/appView";

// Motion-enabled components
const MotionBox = motion.create(Box);
const MotionListItemButton = motion.create(ListItemButton);

interface SidebarProps {
  currentView: AppCurrentView;
  onNavigate: (view: AppCurrentView) => void;
  onLogout: () => void;
  displayName: string;
  userEmail: string;
  onOpenProfile: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: AppCurrentView;
}

// Animation variants
const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  displayName,
  userEmail,
  onOpenProfile,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Itens de menu principais
  const mainNavItems: NavItem[] = [
    { icon: DashboardIcon, label: t("nav.dashboard"), id: "dashboard" },
    { icon: BatchRegistrationIcon, label: t("nav.nixai"), id: "nixai" },
    { icon: WalletIcon, label: t("nav.transactions"), id: "transactions" },
    { icon: CreditCardIcon, label: t("nav.splits"), id: "splits" },
    { icon: PeopleIcon, label: t("nav.shared"), id: "shared" },
    { icon: RepeatIcon, label: t("nav.recurring"), id: "recurring" },
    { icon: PaymentIcon, label: "Pagamentos", id: "paymentMethods" },
    { icon: CategoryIcon, label: "Categorias", id: "categories" },
    { icon: InvestmentsIcon, label: t("nav.investments"), id: "investments" },
    { icon: SubscriptionsIcon, label: t("nav.subscriptions"), id: "subscriptions" },
  ];

  const toolsNavItems: NavItem[] = [
    { icon: FiscalIcon, label: "Rel. Fiscal", id: "fiscal-report" },
    { icon: DebtCalcIcon, label: "Calc. Dívidas", id: "debt-calculator" },
  ];

  const renderNavItem = (
    item: NavItem,
    isSubItem: boolean = false,
    index: number = 0
  ) => {
    const isActive = currentView === item.id;

    return (
      <ListItem key={item.id} disablePadding sx={{ mb: 0 }}>
        <MotionListItemButton
          onClick={() => onNavigate(item.id)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            borderRadius: "16px",
            py: isSubItem ? 0.5 : 0.75,
            px: 1.5,
            ml: isSubItem ? 2 : 0,
            position: "relative",
            overflow: "hidden",
            ...(isActive && {
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.08),
            }),
            "&:hover": {
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          {/* Active indicator with layoutId for smooth transition */}
          <AnimatePresence>
            {isActive && (
              <MotionBox
                layoutId="activeIndicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                sx={{
                  position: "absolute",
                  // Compensa: px:2 do container (16px) + px:2 do botão (16px) + ml:2 para sub-itens (16px)
                  left: isSubItem ? -48 : -32,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 4,
                  height: 24,
                  borderRadius: "0 4px 4px 0",
                  bgcolor: "primary.main",
                  boxShadow: `2px 0 8px ${alpha(
                    theme.palette.primary.main,
                    0.4
                  )}`,
                }}
              />
            )}
          </AnimatePresence>

          <ListItemIcon
            sx={{
              minWidth: isSubItem ? 32 : 40,
              color: isActive ? "primary.main" : "text.secondary",
              transition: "color 0.2s ease",
            }}
          >
            <MotionBox
              animate={isActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              sx={{
                width: isSubItem ? 26 : 32,
                height: isSubItem ? 26 : 32,
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isActive
                  ? isDarkMode
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.primary.main, 0.12)
                  : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              <item.icon fontSize="small" />
            </MotionBox>
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: isActive ? 600 : 500,
              fontSize: isSubItem ? 13 : 14,
              color: isActive ? "primary.main" : "text.primary",
              sx: { transition: "all 0.2s ease" },
            }}
          />
          <AnimatePresence>
            {isActive && (
              <MotionBox
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500 }}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  boxShadow: `0 0 8px ${alpha(
                    theme.palette.primary.main,
                    0.6
                  )}`,
                }}
              />
            )}
          </AnimatePresence>
        </MotionListItemButton>
      </ListItem>
    );
  };

  return (
    <Box
      component="aside"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: "100vh",
        boxSizing: "border-box",
        border: "none",
        boxShadow: isDarkMode
          ? `1px 0 24px -8px rgba(28, 16, 8, 0.5)`
          : `1px 0 24px -8px rgba(124, 66, 38, 0.10)`,
        bgcolor: isDarkMode
          ? theme.palette.background.paper
          : "#FEF8F2",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Navigation */}
      <MotionBox
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        sx={{ flex: 1, px: 2, py: 2, overflowY: "auto" }}
      >
        {/* Brand Accent Header */}
        <Box sx={{ mb: 2, px: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              fontWeight: 700,
              color: "text.secondary",
              letterSpacing: "0.08em",
              fontSize: "0.65rem",
              textTransform: "uppercase",
            }}
          >
             <span>Finance Control</span>
          </Typography>
        </Box>

        {/* Main Navigation Items */}
        <List sx={{ mt: 0 }}>
          {mainNavItems.map((item, idx) => (
            <motion.div key={item.id} variants={itemVariants}>
              {renderNavItem(item, false, idx)}
            </motion.div>
          ))}
        </List>



        {/* Tools Section */}
        <Box sx={{ mt: 0.5, mb: 0.25, px: 1 }}>
          <Divider sx={{ mb: 1, opacity: 0.4 }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.disabled",
              letterSpacing: "0.08em",
              fontSize: "0.6rem",
              textTransform: "uppercase",
            }}
          >
            Ferramentas
          </Typography>
        </Box>
        <List sx={{ mt: 0 }}>
          {toolsNavItems.map((item, idx) => (
            <motion.div key={item.id} variants={itemVariants}>
              {renderNavItem(item, false, idx)}
            </motion.div>
          ))}
        </List>

        {/* Reports Items - Flat (sem dropdown) */}
      </MotionBox>

      {/* Bottom Actions */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ px: 2, pb: 2, pt: 1 }}
      >
        <MotionBox
          onClick={onOpenProfile}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            p: 1.5,
            borderRadius: "16px",
            cursor: "pointer",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.6)
              : alpha("#FEF3E2", 0.85),
            border: `1px solid ${
              isDarkMode
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha("#C4885F", 0.15)
            }`,
            boxShadow: isDarkMode
              ? `0 4px 16px -4px rgba(28, 16, 8, 0.35)`
              : `0 4px 16px -4px rgba(124, 66, 38, 0.10)`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              size="3"
              radius="full"
              fallback={displayName ? displayName.charAt(0).toUpperCase() : "U"}
              style={{
                width: 42,
                height: 42,
                minWidth: 42,
                minHeight: 42,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                color="text.primary"
              >
                {displayName || "User"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ opacity: 0.8 }}
              >
                {userEmail}
              </Typography>
            </Box>
            <MotionBox
              animate={{ x: [0, 3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChevronRightIcon
                fontSize="small"
                sx={{ color: "text.disabled" }}
              />
            </MotionBox>
          </Box>
        </MotionBox>

        {/* Sign Out Button */}
        <MotionListItemButton
          onClick={onLogout}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            mt: 1.5,
            borderRadius: "16px",
            py: 1,
            color: "text.secondary",
            bgcolor: isDarkMode
              ? alpha(theme.palette.error.main, 0.08)
              : alpha(theme.palette.error.main, 0.04),
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.12),
              color: "error.main",
              "& .MuiListItemIcon-root": {
                color: "error.main",
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 40,
              color: "inherit",
              transition: "color 0.2s ease",
            }}
          >
            <LogOutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t("nav.logout")}
            primaryTypographyProps={{
              fontWeight: 500,
              fontSize: 14,
            }}
          />
        </MotionListItemButton>
      </MotionBox>
    </Box>
  );
};

export default Sidebar;
