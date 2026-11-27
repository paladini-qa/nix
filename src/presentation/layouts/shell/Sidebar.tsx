import NixLogo from "@/presentation/components/ui/NixLogo";
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
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Logout as LogOutIcon,
  ChevronRight as ChevronRightIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  Category as CategoryIcon,
  Payment as PaymentIcon,
  TrendingUp as InvestmentsIcon,
  Subscriptions as SubscriptionsIcon,
  Description as FiscalIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { AppCurrentView } from "@/shared/types/appView";

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

  const mainNavItems: NavItem[] = [
    { icon: DashboardIcon, label: t("nav.dashboard"), id: "dashboard" },
    { icon: WalletIcon, label: t("nav.transactions"), id: "transactions" },
  ];

  const resourcesNavItems: NavItem[] = [
    { icon: PaymentIcon, label: t("nav.paymentMethods"), id: "paymentMethods" },
    { icon: RepeatIcon, label: t("nav.recurring"), id: "recurring" },
    { icon: CreditCardIcon, label: "Parcelas", id: "splits" },
    { icon: CategoryIcon, label: "Categorias", id: "categories" },
    { icon: SubscriptionsIcon, label: t("nav.subscriptions"), id: "subscriptions" },
  ];

  const toolsNavItems: NavItem[] = [
    { icon: InvestmentsIcon, label: t("nav.investments"), id: "investments" },
    { icon: FiscalIcon, label: "Relatório fiscal", id: "fiscal-report" },
  ];

  const renderNavItem = (
    item: NavItem,
    isSubItem: boolean = false,
    index: number = 0
  ) => {
    const isActive = currentView === item.id;

    return (
      <ListItem key={item.id} disablePadding sx={{ mb: "2px" }}>
        <MotionListItemButton
          onClick={(e) => {
            e.preventDefault();
            onNavigate(item.id);
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            borderRadius: "10px",
            py: "8.5px",
            px: "11px",
            gap: "11px",
            minHeight: "unset",
            bgcolor: isActive
              ? isDarkMode
                ? "rgba(168,85,247,0.18)"
                : "rgba(168,85,247,0.12)"
              : "transparent",
            color: isActive ? "#a855f7" : "text.secondary",
            transition: "all 0.12s",
            "&:hover": {
              bgcolor: isActive
                ? isDarkMode
                  ? "rgba(168,85,247,0.22)"
                  : "rgba(168,85,247,0.15)"
                : isDarkMode
                  ? "rgba(255,255,255,0.05)"
                  : "#f4f4f5",
              color: isActive ? "#a855f7" : "text.primary",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: "unset",
              color: "inherit",
              transition: "color 0.12s",
              display: "flex",
              alignItems: "center",
            }}
          >
            <item.icon sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: isActive ? 600 : 500,
              fontSize: 13.5,
              color: "inherit",
              sx: { transition: "all 0.12s", lineHeight: 1 },
            }}
          />
        </MotionListItemButton>
      </ListItem>
    );
  };

  return (
    <Box
      component="aside"
      sx={{
        width: 248,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        boxSizing: "border-box",
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
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
        sx={{ flex: 1, overflowY: "auto" }}
      >
        {/* Brand Header */}
        <Box sx={{ px: "18px", pt: "18px", pb: "14px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <NixLogo size={44} decorative />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", lineHeight: 1.2, color: "text.primary" }}>
                Nix Finance
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 500 }}>
                {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Section */}
        <Box sx={{ px: "12px", pb: "4px", pt: "10px" }}>
          <Typography sx={{ px: "10px", pb: "8px", pt: "6px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.disabled" }}>
            Principal
          </Typography>
          <List disablePadding>
            {mainNavItems.map((item, idx) => (
              <motion.div key={item.id} variants={itemVariants}>
                {renderNavItem(item, false, idx)}
              </motion.div>
            ))}
          </List>
        </Box>

        {/* Resources Section */}
        <Box sx={{ px: "12px", pb: "4px", pt: "6px" }}>
          <Typography sx={{ px: "10px", pb: "8px", pt: "6px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.disabled" }}>
            Recursos
          </Typography>
          <List disablePadding>
            {resourcesNavItems.map((item, idx) => (
              <motion.div key={item.id} variants={itemVariants}>
                {renderNavItem(item, false, idx)}
              </motion.div>
            ))}
          </List>
        </Box>

        {/* Tools Section */}
        <Box sx={{ px: "12px", pb: "4px", pt: "6px" }}>
          <Typography sx={{ px: "10px", pb: "8px", pt: "6px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.disabled" }}>
            Ferramentas
          </Typography>
          <List disablePadding>
            {toolsNavItems.map((item, idx) => (
              <motion.div key={item.id} variants={itemVariants}>
                {renderNavItem(item, false, idx)}
              </motion.div>
            ))}
          </List>
        </Box>
      </MotionBox>

      {/* Sidebar Footer: user card + logout */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          px: "14px",
          pb: "14px",
          pt: "14px",
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          mt: "auto",
        }}
      >
        {/* User card */}
        <MotionBox
          onClick={onOpenProfile}
          whileHover={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#f4f4f5" }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            p: "8px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          {/* Avatar */}
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
            <Typography sx={{ fontWeight: 600, fontSize: 13, color: "text.primary", lineHeight: 1.3 }} noWrap>
              {displayName || "Usuário"}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: "text.disabled", lineHeight: 1.3 }} noWrap>
              Plano Pro
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 14, flexShrink: 0 }} />
        </MotionBox>

        {/* Sign Out Button */}
        <MotionListItemButton
          onClick={onLogout}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            mt: 0.5,
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
            mt: 1.5,
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
