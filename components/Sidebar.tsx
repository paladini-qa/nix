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
  Divider,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Settings as SettingsIcon,
  Logout as LogOutIcon,
  Person as UserIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { ThemePreference } from "../types";
import ThemeSwitch from "./ThemeSwitch";

interface SidebarProps {
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  currentView: "dashboard" | "transactions" | "settings";
  onNavigate: (view: "dashboard" | "transactions" | "settings") => void;
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
  const navItems = [
    { icon: DashboardIcon, label: "Dashboard", id: "dashboard" as const },
    { icon: WalletIcon, label: "Transactions", id: "transactions" as const },
    { icon: SettingsIcon, label: "Settings", id: "settings" as const },
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
          borderRight: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        },
      }}
    >
      {/* Logo Area */}
      <Box
        sx={{
          height: 80,
          display: "flex",
          alignItems: "center",
          px: 3,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            color: "text.primary",
            letterSpacing: -0.5,
          }}
        >
          Nix
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 2, py: 3 }}>
        <Typography
          variant="overline"
          sx={{
            px: 2,
            color: "text.secondary",
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          Main Menu
        </Typography>
        <List sx={{ mt: 1 }}>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onNavigate(item.id)}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "primary.contrastText",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                  {isActive && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "primary.contrastText",
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom Actions */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <ThemeSwitch value={themePreference} onChange={onThemeChange} />

        <Divider sx={{ my: 2 }} />

        {/* Profile Button */}
        <ListItemButton
          onClick={onOpenProfile}
          sx={{
            borderRadius: 2,
            mb: 1,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "primary.main",
              mr: 1.5,
            }}
          >
            <UserIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={500}
              noWrap
              color="text.primary"
            >
              {displayName || "User"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {userEmail}
            </Typography>
          </Box>
          <ChevronRightIcon fontSize="small" color="action" />
        </ListItemButton>

        <ListItemButton
          onClick={onLogout}
          sx={{
            borderRadius: 2,
            color: "error.main",
            "&:hover": {
              bgcolor: "error.main",
              color: "error.contrastText",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
            <LogOutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
