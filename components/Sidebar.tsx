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
} from "@mui/material";
import { Avatar, Text } from "@radix-ui/themes";
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
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AccountBalance as AccountBalanceIcon,
  EventNote as PlanningIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ThemePreference } from "../types";
import ThemeSwitch from "./ThemeSwitch";
import { usePrivacy } from "../contexts";

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
  | "planning"
  | "paymentMethods"
  | "categories"
  | "openFinance";

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
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  // Itens de menu principais
  const mainNavItems: NavItem[] = [
    { icon: DashboardIcon, label: t("nav.dashboard"), id: "dashboard" },
    { icon: WalletIcon, label: t("nav.transactions"), id: "transactions" },
    { icon: CreditCardIcon, label: t("nav.splits"), id: "splits" },
    { icon: PeopleIcon, label: t("nav.shared"), id: "shared" },
    { icon: RepeatIcon, label: t("nav.recurring"), id: "recurring" },
    { icon: AccountBalanceIcon, label: "Open Finance", id: "openFinance" },
    { icon: PaymentIcon, label: "Payment Methods", id: "paymentMethods" },
    { icon: CategoryIcon, label: "Categorias", id: "categories" },
  ];

  // Itens de relatórios (agora flat, sem dropdown)
  const reportsNavItems: NavItem[] = [
    { icon: BudgetIcon, label: t("nav.budgets"), id: "budgets" },
    { icon: GoalIcon, label: t("nav.goals"), id: "goals" },
    { icon: PlanningIcon, label: "Planejamentos", id: "planning" },
  ];

  // Itens de menu no final
  const footerNavItems: NavItem[] = [
    { icon: SparklesIcon, label: t("nav.nixai"), id: "nixai" },
  ];

  // Renderiza um item de navegação
  // Estilos especiais para o item NixAI conforme Brand Book
  const isNixAI = (itemId: string) => itemId === "nixai";

  const renderNavItem = (
    item: NavItem,
    isSubItem: boolean = false,
    index: number = 0
  ) => {
    const isActive = currentView === item.id;
    const isAIItem = isNixAI(item.id);

    return (
      <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
        <MotionListItemButton
          onClick={() => onNavigate(item.id)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          // NixAI item sempre visível com estilo especial (Brand Book)
          className={isAIItem ? "nix-ai-indicator" : undefined}
          sx={{
            borderRadius: "20px",
            py: isSubItem ? 1 : 1.5,
            px: 2,
            ml: isSubItem ? 2 : 0,
            position: "relative",
            overflow: "hidden",
            // Estilo especial para NixAI: gradiente roxo suave
            ...(isAIItem &&
              !isActive && {
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(138, 43, 226, 0.12) 0%, rgba(106, 13, 173, 0.08) 100%)"
                  : "linear-gradient(135deg, rgba(138, 43, 226, 0.06) 0%, rgba(106, 13, 173, 0.04) 100%)",
                border: `1px solid ${alpha("#8A2BE2", isDarkMode ? 0.2 : 0.1)}`,
              }),
            ...(isActive && {
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.08),
              // Se for NixAI ativo, usar gradiente mais forte
              ...(isAIItem && {
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(138, 43, 226, 0.25) 0%, rgba(106, 13, 173, 0.15) 100%)"
                  : "linear-gradient(135deg, rgba(138, 43, 226, 0.12) 0%, rgba(106, 13, 173, 0.08) 100%)",
              }),
            }),
            "&:hover": {
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.05),
              // NixAI hover com gradiente
              ...(isAIItem && {
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(106, 13, 173, 0.12) 100%)"
                  : "linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(106, 13, 173, 0.06) 100%)",
              }),
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
              minWidth: isSubItem ? 36 : 44,
              // NixAI sempre usa a cor primária roxa
              color: isActive || isAIItem ? "primary.main" : "text.secondary",
              transition: "color 0.2s ease",
            }}
          >
            <MotionBox
              animate={isActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              sx={{
                width: isSubItem ? 28 : 36,
                height: isSubItem ? 28 : 36,
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // NixAI tem gradiente roxo no ícone (Brand Book)
                ...(isAIItem && {
                  background:
                    "linear-gradient(135deg, #8A2BE2 0%, #6A0DAD 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 12px rgba(138, 43, 226, 0.3)",
                }),
                ...(!isAIItem && {
                  bgcolor: isActive
                    ? isDarkMode
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.primary.main, 0.12)
                    : "transparent",
                }),
                transition: "all 0.2s ease",
              }}
            >
              <item.icon
                fontSize={isSubItem ? "small" : "small"}
                sx={isAIItem ? { color: "#FFFFFF" } : undefined}
              />
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
        width: DRAWER_WIDTH,
        flexShrink: 0,
        height: "100vh",
        boxSizing: "border-box",
        border: "none",
        boxShadow: isDarkMode
          ? `1px 0 24px -8px ${alpha("#000000", 0.4)}`
          : `1px 0 24px -8px ${alpha(theme.palette.primary.main, 0.08)}`,
        bgcolor: isDarkMode ? theme.palette.background.paper : "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
        }}
      >
        <MotionBox
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
          sx={{
            width: 52,
            height: 52,
            borderRadius: "20px",
            bgcolor: isDarkMode
              ? alpha("#FFFFFF", 0.1)
              : alpha(theme.palette.primary.main, 0.08),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: isDarkMode
              ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}`
              : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}, 0 2px 8px -2px ${alpha(
                  theme.palette.primary.main,
                  0.15
                )}`,
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
        <Box sx={{ color: "text.primary" }}>
          <Text
            size="5"
            weight="bold"
            style={{ letterSpacing: "-0.02em", color: "inherit" }}
            as="span"
          >
            Nix
          </Text>
          <Text
            size="1"
            style={{
              letterSpacing: "0.02em",
              display: "block",
              color: "inherit",
              opacity: 0.8,
            }}
            as="span"
          >
            Finance Manager
          </Text>
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
          <Text
            size="1"
            color="gray"
            weight="medium"
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              letterSpacing: "0.1em",
              fontSize: 12,
            }}
            as="p"
          >
            Menu Principal
          </Text>
        </motion.div>

        {/* Main Navigation Items */}
        <List sx={{ mt: 1 }}>
          {mainNavItems.map((item, idx) => (
            <motion.div key={item.id} variants={itemVariants}>
              {renderNavItem(item, false, idx)}
            </motion.div>
          ))}
        </List>

        {/* Reports Items - Flat (sem dropdown) */}
        <Box sx={{ mt: 2 }}>
          <motion.div variants={itemVariants}>
            <Text
              size="1"
              color="gray"
              weight="medium"
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                letterSpacing: "0.1em",
                fontSize: 12,
              }}
              as="p"
            >
              Relatórios
            </Text>
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
            <Text
              size="1"
              color="gray"
              weight="medium"
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                letterSpacing: "0.1em",
                fontSize: 12,
              }}
              as="p"
            >
              Ferramentas
            </Text>
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
        }}
      >
        {/* Privacy Mode & Theme Switch Row */}
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: "20px",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.5)
              : alpha(theme.palette.grey[100], 0.8),
          }}
        >
          {/* Privacy Toggle */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
              pb: 1.5,
              borderBottom: `1px solid ${
                isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
              }`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isPrivacyMode ? (
                <VisibilityOffIcon
                  sx={{ fontSize: 18, color: "primary.main" }}
                />
              ) : (
                <VisibilityIcon
                  sx={{ fontSize: 18, color: "text.secondary" }}
                />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: isPrivacyMode ? "primary.main" : "text.secondary",
                }}
              >
                Modo Privado
              </Typography>
            </Box>
            <Tooltip
              title={`${isPrivacyMode ? "Mostrar" : "Ocultar"} valores (Alt+P)`}
            >
              <IconButton
                onClick={togglePrivacyMode}
                size="small"
                sx={{
                  bgcolor: isPrivacyMode
                    ? alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.1)
                    : "transparent",
                  color: isPrivacyMode ? "primary.main" : "text.secondary",
                  "&:hover": {
                    bgcolor: alpha(
                      theme.palette.primary.main,
                      isDarkMode ? 0.25 : 0.15
                    ),
                  },
                }}
              >
                {isPrivacyMode ? (
                  <VisibilityOffIcon sx={{ fontSize: 18 }} />
                ) : (
                  <VisibilityIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Theme Switch */}
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
            borderRadius: "20px",
            cursor: "pointer",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.6)
              : alpha("#FFFFFF", 0.8),
            border: `1px solid ${
              isDarkMode
                ? alpha("#FFFFFF", 0.08)
                : alpha(theme.palette.primary.main, 0.08)
            }`,
            boxShadow: isDarkMode
              ? `0 4px 16px -4px ${alpha("#000000", 0.3)}`
              : `0 4px 16px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
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
            mt: 2,
            borderRadius: "20px",
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
    </Box>
  );
};

export default Sidebar;
