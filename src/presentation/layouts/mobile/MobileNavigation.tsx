import type { ReactNode } from "react";
import { Box, ButtonBase, alpha } from "@mui/material";
import { Add, CategoryOutlined, HomeOutlined, PersonOutline, ReceiptLongOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { orbitColors } from "@/shared/theme/colors";
import type { AppCurrentView } from "@/shared/types/appView";

interface NavItemProps {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ label, icon, active, onClick }: NavItemProps) {
  return (
    <ButtonBase
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      sx={(theme) => ({
        flex: 1,
        minWidth: 0,
        minHeight: 48,
        borderRadius: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        color: active ? (theme.palette.mode === "dark" ? orbitColors.lavender : "primary.main") : "text.secondary",
        bgcolor: active ? alpha(theme.palette.primary.main, 0.13) : "transparent",
        "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
      })}
    >
      {icon}
      <Box component="span" sx={{ fontSize: 10, lineHeight: 1.2, fontWeight: active ? 700 : 500 }}>
        {label}
      </Box>
    </ButtonBase>
  );
}

interface MobileNavigationProps {
  currentView: AppCurrentView;
  onNavigate: (view: AppCurrentView) => void;
  onOpenProfile: () => void;
  onOpenNewTransaction: () => void;
}

export default function MobileNavigation({
  currentView,
  onNavigate,
  onOpenProfile,
  onOpenNewTransaction,
}: MobileNavigationProps) {
  const { t } = useTranslation();

  return (
    <Box
      component="nav"
      aria-label={t("nav.menu")}
      sx={{
        position: "fixed",
        insetInline: 12,
        mx: "auto",
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        maxWidth: 376,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        gap: 1,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          display: "flex",
          p: 0.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "32px",
          bgcolor: alpha(theme.palette.background.paper, 0.96),
          backdropFilter: "blur(16px)",
          boxShadow: `0 6px 24px ${alpha(theme.palette.text.primary, 0.12)}, 0 2px 6px ${alpha(theme.palette.text.primary, 0.08)}`,
          pointerEvents: "auto",
        })}
      >
        <NavItem label={t("nav.dashboard")} icon={<HomeOutlined />} active={currentView === "dashboard"} onClick={() => onNavigate("dashboard")} />
        <NavItem label={t("nav.transactions")} icon={<ReceiptLongOutlined />} active={currentView === "transactions"} onClick={() => onNavigate("transactions")} />
        <NavItem label="Categorias" icon={<CategoryOutlined />} active={currentView === "categories"} onClick={() => onNavigate("categories")} />
        <NavItem label="Perfil" icon={<PersonOutline />} onClick={onOpenProfile} />
      </Box>

      <ButtonBase
        aria-label={t("dashboard.newTransaction")}
        onClick={onOpenNewTransaction}
        sx={(theme) => ({
          width: 52,
          height: 52,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          boxShadow: `0 5px 16px ${alpha(theme.palette.primary.main, 0.32)}`,
          pointerEvents: "auto",
          "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "text.primary", outlineOffset: 3 },
        })}
      >
        <Add />
      </ButtonBase>
    </Box>
  );
}
