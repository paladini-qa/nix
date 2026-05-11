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
  AccountBalance as BudgetsIcon,
  BarChart as AnalyticsIcon,
  CalendarMonth as PlanningIcon,
  Upload as ImportIcon,
  Description as FiscalIcon,
  Calculate as DebtCalcIcon,
  TrendingUp as InvestmentsIcon,
  Subscriptions as SubscriptionsIcon,
  NotificationsOutlined as NotificationsIcon,
  FactCheck as PaymentGuideIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@mui/material";

import logoUrl from "../../assets/logo.png";
import { SIDEBAR_WIDTH } from "../../layoutConstants";
import type { AppCurrentView } from "../../types/appView";
import { useNotifications } from "../../hooks";
import { useAppStore } from "../../hooks/useAppStore";

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
  const { filters } = useAppStore();
  const { unreadCount } = useNotifications(filters.month, filters.year);

  const mainNavItems: NavItem[] = [
    { icon: DashboardIcon, label: t("nav.dashboard"), id: "dashboard" },
    { icon: WalletIcon, label: t("nav.transactions"), id: "transactions" },
    { icon: BatchRegistrationIcon, label: t("nav.nixai"), id: "nixai" },
    { icon: NotificationsIcon, label: "Notificações", id: "notifications" },
  ];

  const resourcesNavItems: NavItem[] = [
    { icon: PaymentIcon, label: "Pagamentos", id: "paymentMethods" },
    { icon: PaymentGuideIcon, label: "Guia de Pagamento", id: "paymentGuide" },
    { icon: RepeatIcon, label: t("nav.recurring"), id: "recurring" },
    { icon: CreditCardIcon, label: "Parcelas", id: "splits" },
    { icon: CategoryIcon, label: "Categorias", id: "categories" },
    { icon: SubscriptionsIcon, label: t("nav.subscriptions"), id: "subscriptions" },
  ];

  const financeNavItems: NavItem[] = [
    { icon: PeopleIcon, label: t("nav.shared"), id: "shared" },
    { icon: BudgetsIcon, label: "Orçamentos", id: "budgets" },
    { icon: PlanningIcon, label: "Planejamento", id: "planning" },
    { icon: InvestmentsIcon, label: t("nav.investments"), id: "investments" },
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
          onClick={(e) => {
            e.preventDefault();
            onNavigate(item.id);
          }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            borderRadius: "10px",
            py: isSubItem ? 0.5 : 0.6,
            px: 1.25,
            ml: isSubItem ? 2 : 0,
            position: "relative",
            overflow: "hidden",
            ...(isActive && {
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.18)
                : alpha(theme.palette.primary.main, 0.12),
            }),
            "&:hover": {
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.primary.main, 0.07),
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
              <Badge
                badgeContent={item.id === "notifications" ? unreadCount : 0}
                color="error"
                max={9}
                sx={{ "& .MuiBadge-badge": { fontSize: 9, minWidth: 14, height: 14, p: 0 } }}
              >
                <item.icon fontSize="small" />
              </Badge>
            </MotionBox>
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: isActive ? 600 : 500,
              fontSize: isSubItem ? 12.5 : 13.5,
              color: isActive ? "primary.main" : "text.secondary",
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
        position: "sticky",
        top: 0,
        height: "100vh",
        boxSizing: "border-box",
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
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
        {/* Brand Header */}
        <Box sx={{ mb: 2.5, px: 0.5, display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            component="img"
            src={logoUrl}
            alt="Nix Finance"
            sx={{
              width: 36, height: 36, borderRadius: "11px", flexShrink: 0,
              objectFit: "contain",
              boxShadow: "0 6px 16px -6px rgba(168,85,247,0.6)",
            }}
          />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", lineHeight: 1.2, color: "text.primary" }}>
              Nix Finance
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 500 }}>
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </Typography>
          </Box>
        </Box>

        {/* Main Section */}
        <Typography variant="caption" sx={{ px: 1.25, fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", fontSize: "0.6rem", textTransform: "uppercase" }}>
          Main
        </Typography>
        <List sx={{ mt: 0.25 }}>
          {mainNavItems.map((item, idx) => (
            <motion.div key={item.id} variants={itemVariants}>
              {renderNavItem(item, false, idx)}
            </motion.div>
          ))}
        </List>

        {/* Resources Section */}
        <Box sx={{ mt: 0.5, mb: 0.25, px: 1 }}>
          <Divider sx={{ mb: 1, opacity: 0.4 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", fontSize: "0.6rem", textTransform: "uppercase" }}>
            Resources
          </Typography>
        </Box>
        <List sx={{ mt: 0 }}>
          {resourcesNavItems.map((item, idx) => (
            <motion.div key={item.id} variants={itemVariants}>
              {renderNavItem(item, false, idx)}
            </motion.div>
          ))}
        </List>

        {/* Finance Section */}
        <Box sx={{ mt: 0.5, mb: 0.25, px: 1 }}>
          <Divider sx={{ mb: 1, opacity: 0.4 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", fontSize: "0.6rem", textTransform: "uppercase" }}>
            Finance
          </Typography>
        </Box>
        <List sx={{ mt: 0 }}>
          {financeNavItems.map((item, idx) => (
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
            sx={{ fontWeight: 700, color: "text.disabled", letterSpacing: "0.08em", fontSize: "0.6rem", textTransform: "uppercase" }}
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
      </MotionBox>

      {/* Bottom Actions */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ px: "14px", pb: "14px", pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}
      >
        <MotionBox
          onClick={onOpenProfile}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            p: 1,
            borderRadius: "10px",
            cursor: "pointer",
            "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.6) },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #a855f7, #c084fc)",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {displayName ? displayName.charAt(0).toUpperCase() : "U"}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: "text.primary" }} noWrap>
                {displayName || "User"}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.disabled" }} noWrap>
                Pro plan
              </Typography>
            </Box>
            <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled", fontSize: 14 }} />
          </Box>
        </MotionBox>

        {/* Sign Out Button */}
        <MotionListItemButton
          onClick={onLogout}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            mt: 1,
            borderRadius: "10px",
            py: 0.75,
            color: "text.secondary",
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.08),
              color: "error.main",
              "& .MuiListItemIcon-root": { color: "error.main" },
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
            primaryTypographyProps={{ fontWeight: 500, fontSize: 13.5 }}
          />
        </MotionListItemButton>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 2,
            color: "text.disabled",
            fontSize: "10px",
            fontWeight: 500,
            opacity: 0.5,
          }}
        >
          v{process.env.APP_VERSION}
        </Typography>
      </MotionBox>
    </Box>
  );
};

export default Sidebar;
