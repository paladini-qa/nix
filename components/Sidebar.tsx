import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Logout as LogOutIcon,
  Person as UserIcon,
  ChevronRight as ChevronRightIcon,
  AutoAwesome as SparklesIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  People as PeopleIcon,
  PieChart as BudgetIcon,
  Flag as GoalIcon,
  Category as CategoryIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ThemePreference } from "../types";
import ThemeSwitch from "./ThemeSwitch";

// Motion-enabled components
const MotionBox = motion.create(Box);
const MotionListItemButton = motion.create(ListItemButton);

// Tipo para todas as views disponíveis
type ViewType =
  | "dashboard"
  | "transactions"
  | "splits"
  | "shared"
  | "recurring"
  | "nixai"
  | "budgets"
  | "goals"
  | "paymentMethods"
  | "categories";

interface SidebarProps {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  displayName: string;
  userEmail: string;
  onOpenProfile: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: ViewType;
}

const DRAWER_WIDTH = 280;

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
  themePreference,
  onThemeChange,
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
    { icon: WalletIcon, label: t("nav.transactions"), id: "transactions" },
    { icon: CreditCardIcon, label: t("nav.splits"), id: "splits" },
    { icon: PeopleIcon, label: t("nav.shared"), id: "shared" },
    { icon: RepeatIcon, label: t("nav.recurring"), id: "recurring" },
  ];

  // Itens de cadastro (agora flat, sem dropdown)
  const registrationNavItems: NavItem[] = [
    { icon: PaymentIcon, label: "Payment Methods", id: "paymentMethods" },
    { icon: CategoryIcon, label: "Categorias", id: "categories" },
  ];

  // Itens de relatórios (agora flat, sem dropdown)
  const reportsNavItems: NavItem[] = [
    { icon: BudgetIcon, label: t("nav.budgets"), id: "budgets" },
    { icon: GoalIcon, label: t("nav.goals"), id: "goals" },
  ];

  // Itens de menu no final
  const footerNavItems: NavItem[] = [
    { icon: SparklesIcon, label: t("nav.nixai"), id: "nixai" },
  ];

  // Renderiza um item de navegação
  const renderNavItem = (item: NavItem, isSubItem: boolean = false, index: number = 0) => {
    const isActive = currentView === item.id;
    return (
      <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
        <MotionListItemButton
          onClick={() => onNavigate(item.id)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            borderRadius: 2.5,
            py: isSubItem ? 1 : 1.5,
            px: 2,
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
                  boxShadow: `2px 0 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              />
            )}
          </AnimatePresence>
          
          <ListItemIcon
            sx={{
              minWidth: isSubItem ? 36 : 44,
              color: isActive ? "primary.main" : "text.secondary",
              transition: "color 0.2s ease",
            }}
          >
            <MotionBox
              animate={isActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              sx={{
                width: isSubItem ? 28 : 36,
                height: isSubItem ? 28 : 36,
                borderRadius: 2,
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
              <item.icon fontSize={isSubItem ? "small" : "small"} />
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
                  boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.6)}`,
                }}
              />
            )}
          </AnimatePresence>
        </MotionListItemButton>
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          border: "none",
          boxShadow: isDarkMode
            ? `1px 0 24px -8px ${alpha("#000000", 0.4)}`
            : `1px 0 24px -8px ${alpha(theme.palette.primary.main, 0.08)}`,
          bgcolor: isDarkMode
            ? theme.palette.background.paper
            : "#FFFFFF",
        },
      }}
    >
      {/* Logo Area */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        sx={{
          height: 88,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 24,
            right: 24,
            height: 1,
            background: isDarkMode
              ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.5)}, transparent)`
              : `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
          },
        }}
      >
        <MotionBox
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            bgcolor: isDarkMode
              ? alpha("#FFFFFF", 0.1)
              : alpha(theme.palette.primary.main, 0.08),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: isDarkMode
              ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}`
              : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}, 0 2px 8px -2px ${alpha(theme.palette.primary.main, 0.15)}`,
          }}
        >
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Nix Logo"
            sx={{
              width: 40,
              height: 40,
              objectFit: "contain",
            }}
          />
        </MotionBox>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.02em",
            }}
          >
            Nix
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            Finance Manager
          </Typography>
        </Box>
      </MotionBox>

      {/* Navigation */}
      <MotionBox
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        sx={{ flex: 1, px: 2, py: 2, overflowY: "auto" }}
      >
        {/* Main Menu Label */}
        <motion.div variants={itemVariants}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              color: "text.secondary",
              fontWeight: 600,
              letterSpacing: "0.1em",
              fontSize: 12,
            }}
          >
            Menu Principal
          </Typography>
        </motion.div>

        {/* Main Navigation Items */}
        <List sx={{ mt: 1 }}>
          {mainNavItems.map((item, idx) => (
            <motion.div key={item.id} variants={itemVariants}>
              {renderNavItem(item, false, idx)}
            </motion.div>
          ))}
        </List>

        {/* Registration Items - Flat (sem dropdown) */}
        <Box sx={{ mt: 2 }}>
          <motion.div variants={itemVariants}>
            <Typography
              variant="overline"
              sx={{
                px: 2,
                color: "text.secondary",
                fontWeight: 600,
                letterSpacing: "0.1em",
                fontSize: 12,
              }}
            >
              Cadastro
            </Typography>
          </motion.div>
          <List sx={{ mt: 1 }}>
            {registrationNavItems.map((item, idx) => (
              <motion.div key={item.id} variants={itemVariants}>
                {renderNavItem(item, false, idx)}
              </motion.div>
            ))}
          </List>
        </Box>

        {/* Reports Items - Flat (sem dropdown) */}
        <Box sx={{ mt: 2 }}>
          <motion.div variants={itemVariants}>
            <Typography
              variant="overline"
              sx={{
                px: 2,
                color: "text.secondary",
                fontWeight: 600,
                letterSpacing: "0.1em",
                fontSize: 12,
              }}
            >
              Relatórios
            </Typography>
          </motion.div>
          <List sx={{ mt: 1 }}>
            {reportsNavItems.map((item, idx) => (
              <motion.div key={item.id} variants={itemVariants}>
                {renderNavItem(item, false, idx)}
              </motion.div>
            ))}
          </List>
        </Box>

        {/* Footer Items */}
        <Box sx={{ mt: 2 }}>
          <motion.div variants={itemVariants}>
            <Typography
              variant="overline"
              sx={{
                px: 2,
                color: "text.secondary",
                fontWeight: 600,
                letterSpacing: "0.1em",
                fontSize: 12,
              }}
            >
              Ferramentas
            </Typography>
          </motion.div>
          <List sx={{ mt: 1 }}>
            {footerNavItems.map((item, idx) => (
              <motion.div key={item.id} variants={itemVariants}>
                {renderNavItem(item, false, idx)}
              </motion.div>
            ))}
          </List>
        </Box>
      </MotionBox>

      {/* Bottom Actions */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
        sx={{
          p: 2,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 24,
            right: 24,
            height: 1,
            background: isDarkMode
              ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.5)}, transparent)`
              : `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
          },
        }}
      >
        {/* Theme Switch */}
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2.5,
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.5)
              : alpha(theme.palette.grey[100], 0.8),
          }}
        >
          <ThemeSwitch value={themePreference} onChange={onThemeChange} />
        </Box>

        {/* Profile Mini Card */}
        <MotionBox
          onClick={onOpenProfile}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          sx={{
            p: 2,
            borderRadius: 2.5,
            cursor: "pointer",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.6)
              : alpha("#FFFFFF", 0.8),
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha(theme.palette.primary.main, 0.08)}`,
            boxShadow: isDarkMode
              ? `0 4px 16px -4px ${alpha("#000000", 0.3)}`
              : `0 4px 16px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: isDarkMode
                  ? alpha(theme.palette.primary.main, 0.2)
                  : alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                fontWeight: 600,
                fontSize: 16,
                boxShadow: `inset 0 -2px 4px ${alpha("#000000", 0.1)}, 0 2px 8px -2px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              {displayName ? displayName.charAt(0).toUpperCase() : <UserIcon fontSize="small" />}
            </Avatar>
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
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
            mt: 2,
            borderRadius: 2.5,
            py: 1.5,
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
    </Drawer>
  );
};

export default Sidebar;
