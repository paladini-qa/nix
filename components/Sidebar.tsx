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
  Settings as SettingsIcon,
  Logout as LogOutIcon,
  Person as UserIcon,
  ChevronRight as ChevronRightIcon,
  AutoAwesome as SparklesIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  People as PeopleIcon,
  PieChart as BudgetIcon,
  Flag as GoalIcon,
  AccountBalance as AccountIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ThemePreference } from "../types";
import ThemeSwitch from "./ThemeSwitch";

interface SidebarProps {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  currentView:
    | "dashboard"
    | "transactions"
    | "splits"
    | "shared"
    | "recurring"
    | "nixai"
    | "budgets"
    | "goals"
    | "accounts"
    | "analytics"
    | "settings";
  onNavigate: (
    view: "dashboard" | "transactions" | "splits" | "shared" | "recurring" | "nixai" | "budgets" | "goals" | "accounts" | "analytics" | "settings"
  ) => void;
  onLogout: () => void;
  displayName: string;
  userEmail: string;
  onOpenProfile: () => void;
}

const DRAWER_WIDTH = 280;

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

  const navItems = [
    { icon: DashboardIcon, label: t("nav.dashboard"), id: "dashboard" as const },
    { icon: WalletIcon, label: t("nav.transactions"), id: "transactions" as const },
    { icon: CreditCardIcon, label: t("nav.splits"), id: "splits" as const },
    { icon: PeopleIcon, label: t("nav.shared"), id: "shared" as const },
    { icon: RepeatIcon, label: t("nav.recurring"), id: "recurring" as const },
    { icon: BudgetIcon, label: t("nav.budgets"), id: "budgets" as const },
    { icon: GoalIcon, label: t("nav.goals"), id: "goals" as const },
    { icon: AccountIcon, label: t("nav.accounts"), id: "accounts" as const },
    { icon: AnalyticsIcon, label: "Analytics", id: "analytics" as const },
    { icon: SparklesIcon, label: t("nav.nixai"), id: "nixai" as const },
    { icon: SettingsIcon, label: t("nav.settings"), id: "settings" as const },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          // Removido border harsh - usando sombra suave com tonalidade
          border: "none",
          boxShadow: isDarkMode
            ? `1px 0 24px -8px ${alpha("#000000", 0.4)}`
            : `1px 0 24px -8px ${alpha(theme.palette.primary.main, 0.08)}`,
          // Background mais suave - levemente diferente do conteúdo principal
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha("#FFFFFF", 0.85),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        },
      }}
    >
      {/* Logo Area - Clean & Premium */}
      <Box
        sx={{
          height: 88,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          // Substituído border por gradiente sutil
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
        <Box
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
        </Box>
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
      </Box>

      {/* Navigation - Generous padding & Soft Pill style */}
      <Box sx={{ flex: 1, px: 2, py: 3 }}>
        <Typography
          variant="overline"
          sx={{
            px: 2,
            color: "text.secondary",
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: 10,
          }}
        >
          Main Menu
        </Typography>
        <List sx={{ mt: 1.5 }}>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.75 }}>
                <ListItemButton
                  onClick={() => onNavigate(item.id)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    px: 2,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                    // Estado ativo - Soft Pill com Left Border Marker
                    ...(isActive && {
                      bgcolor: isDarkMode
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.primary.main, 0.08),
                      // Left Border Marker
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 4,
                        height: 24,
                        borderRadius: "0 4px 4px 0",
                        bgcolor: "primary.main",
                        boxShadow: `2px 0 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                      },
                    }),
                    // Hover state
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.05),
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 44,
                      color: isActive ? "primary.main" : "text.secondary",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2.5,
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
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 14,
                      color: isActive ? "primary.main" : "text.primary",
                      sx: { transition: "all 0.2s ease" },
                    }}
                  />
                  {/* Indicador sutil no estado ativo */}
                  {isActive && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.6)}`,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom Actions - Mini Card Style */}
      <Box
        sx={{
          p: 2,
          // Gradiente sutil ao invés de border
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
        <Box
          onClick={onOpenProfile}
          sx={{
            p: 2,
            borderRadius: 2.5,
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            // Glassmorphism card
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.6)
              : alpha("#FFFFFF", 0.8),
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha(theme.palette.primary.main, 0.08)}`,
            boxShadow: isDarkMode
              ? `0 4px 16px -4px ${alpha("#000000", 0.3)}`
              : `0 4px 16px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
            // Hover
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: isDarkMode
                ? `0 8px 24px -4px ${alpha("#000000", 0.4)}`
                : `0 8px 24px -4px ${alpha(theme.palette.primary.main, 0.15)}`,
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.12) : alpha(theme.palette.primary.main, 0.15)}`,
            },
            "&:active": {
              transform: "translateY(0)",
            },
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
                // Efeito 3D sutil
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
            <ChevronRightIcon
              fontSize="small"
              sx={{
                color: "text.disabled",
                transition: "transform 0.2s ease",
              }}
            />
          </Box>
        </Box>

        {/* Sign Out Button */}
        <ListItemButton
          onClick={onLogout}
          sx={{
            mt: 2,
            borderRadius: 2.5,
            py: 1.5,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            color: "text.secondary",
            bgcolor: isDarkMode
              ? alpha(theme.palette.error.main, 0.08)
              : alpha(theme.palette.error.main, 0.04),
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.12),
              color: "error.main",
              transform: "translateX(4px)",
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
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
