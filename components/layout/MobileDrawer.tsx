import React from "react";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Logout as LogOutIcon,
  Person as UserIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
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
import { ThemePreference } from "../../types";
import ThemeSwitch from "../ThemeSwitch";

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
  | "analytics"
  | "settings"
  | "paymentMethods"
  | "categories";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
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

const DRAWER_WIDTH = 300;

// Animation variants
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

/**
 * MobileDrawer - Mobile navigation drawer with hamburger menu
 * 
 * Features:
 * - Full navigation menu with all views
 * - Glassmorphism styling
 * - User profile section
 * - Theme switch
 * - Swipe-to-close gesture
 */
const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
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

  // Itens de cadastro
  const registrationNavItems: NavItem[] = [
    { icon: PaymentIcon, label: "Payment Methods", id: "paymentMethods" },
    { icon: CategoryIcon, label: "Categorias", id: "categories" },
  ];

  // Itens de relatórios
  const reportsNavItems: NavItem[] = [
    { icon: BudgetIcon, label: t("nav.budgets"), id: "budgets" },
    { icon: GoalIcon, label: t("nav.goals"), id: "goals" },
  ];

  // Itens de ferramentas
  const toolsNavItems: NavItem[] = [
    { icon: SparklesIcon, label: t("nav.nixai"), id: "nixai" },
  ];

  // Helper para verificar se é item NixAI
  const isNixAI = (itemId: string) => itemId === "nixai";

  // Handler para navegação (fecha o drawer após navegar)
  const handleNavigate = (view: ViewType) => {
    onNavigate(view);
    onClose();
  };

  // Handler para abrir perfil
  const handleOpenProfile = () => {
    onOpenProfile();
    onClose();
  };

  // Renderiza um item de navegação
  const renderNavItem = (item: NavItem) => {
    const isActive = currentView === item.id;
    const isAIItem = isNixAI(item.id);

    return (
      <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
        <MotionListItemButton
          onClick={() => handleNavigate(item.id)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={isAIItem ? "nix-ai-indicator" : undefined}
          sx={{
            borderRadius: "16px",
            py: 1.5,
            px: 2,
            minHeight: 52, // Touch-friendly size
            position: "relative",
            overflow: "hidden",
            // Estilo especial para NixAI
            ...(isAIItem && !isActive && {
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(138, 43, 226, 0.12) 0%, rgba(106, 13, 173, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(138, 43, 226, 0.06) 0%, rgba(106, 13, 173, 0.04) 100%)",
              border: `1px solid ${alpha("#8A2BE2", isDarkMode ? 0.2 : 0.1)}`,
            }),
            ...(isActive && {
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.08),
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
              ...(isAIItem && {
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(106, 13, 173, 0.12) 100%)"
                  : "linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(106, 13, 173, 0.06) 100%)",
              }),
            },
          }}
        >
          {/* Active indicator */}
          <AnimatePresence>
            {isActive && (
              <MotionBox
                layoutId="mobileActiveIndicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                sx={{
                  position: "absolute",
                  left: -16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 4,
                  height: 28,
                  borderRadius: "0 4px 4px 0",
                  bgcolor: "primary.main",
                  boxShadow: `2px 0 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              />
            )}
          </AnimatePresence>

          <ListItemIcon
            sx={{
              minWidth: 44,
              color: isActive || isAIItem ? "primary.main" : "text.secondary",
              transition: "color 0.2s ease",
            }}
          >
            <MotionBox
              animate={isActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...(isAIItem && {
                  background: "linear-gradient(135deg, #8A2BE2 0%, #6A0DAD 100%)",
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
                sx={{
                  fontSize: 24,
                  ...(isAIItem && { color: "#FFFFFF" }),
                }}
              />
            </MotionBox>
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: isActive ? 600 : 500,
              fontSize: 15,
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
                  width: 8,
                  height: 8,
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

  // Renderiza uma seção de navegação
  const renderSection = (title: string, items: NavItem[]) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="overline"
        sx={{
          px: 2,
          color: "text.secondary",
          fontWeight: 600,
          letterSpacing: "0.1em",
          fontSize: 11,
        }}
      >
        {title}
      </Typography>
      <List sx={{ mt: 0.5 }}>
        {items.map((item) => (
          <motion.div key={item.id} variants={itemVariants}>
            {renderNavItem(item)}
          </motion.div>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          maxWidth: "85vw",
          boxSizing: "border-box",
          border: "none",
          // Glassmorphism
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.95)
            : alpha("#FFFFFF", 0.98),
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: isDarkMode
            ? `4px 0 24px -8px ${alpha("#000000", 0.5)}`
            : `4px 0 24px -8px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
      }}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(4px)",
          backgroundColor: alpha("#000000", 0.5),
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 80,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 20,
            right: 20,
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
          sx={{
            width: 48,
            height: 48,
            borderRadius: "16px",
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
              width: 36,
              height: 36,
              objectFit: "contain",
            }}
          />
        </MotionBox>
        <Box sx={{ flex: 1 }}>
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
        <IconButton
          onClick={onClose}
          sx={{
            color: "text.secondary",
            transition: "all 0.2s ease",
            "&:hover": {
              color: "text.primary",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 2,
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {renderSection("Menu Principal", mainNavItems)}
        {renderSection("Cadastro", registrationNavItems)}
        {renderSection("Relatórios", reportsNavItems)}
        {renderSection("Ferramentas", toolsNavItems)}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 20,
            right: 20,
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
            borderRadius: "16px",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.5)
              : alpha(theme.palette.grey[100], 0.8),
          }}
        >
          <ThemeSwitch value={themePreference} onChange={onThemeChange} />
        </Box>

        {/* Profile Card */}
        <MotionBox
          onClick={handleOpenProfile}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          sx={{
            p: 2,
            borderRadius: "16px",
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
                width: 44,
                height: 44,
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
              <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled" }} />
            </MotionBox>
          </Box>
        </MotionBox>

        {/* Logout Button */}
        <MotionListItemButton
          onClick={() => {
            onLogout();
            onClose();
          }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          sx={{
            mt: 2,
            borderRadius: "16px",
            py: 1.5,
            minHeight: 52,
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
              minWidth: 44,
              color: "inherit",
              transition: "color 0.2s ease",
            }}
          >
            <LogOutIcon sx={{ fontSize: 24 }} />
          </ListItemIcon>
          <ListItemText
            primary={t("nav.logout")}
            primaryTypographyProps={{
              fontWeight: 500,
              fontSize: 15,
            }}
          />
        </MotionListItemButton>
      </Box>

      {/* Safe area padding for devices with home indicator */}
      <Box sx={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </Drawer>
  );
};

export default MobileDrawer;

