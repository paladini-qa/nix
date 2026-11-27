import { Avatar, Box, IconButton, Typography, alpha } from "@mui/material";
import { Eye, EyeOff, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import NixLogo from "@/presentation/components/ui/NixLogo";
import DateFilter from "@/presentation/components/ui/DateFilter";
import { usePrivacy, useSettings } from "@/presentation/contexts";
import { useAppStore } from "@/presentation/hooks/useAppStore";

interface MobileHeaderProps {
  isDashboard: boolean;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
}

export default function MobileHeader({ isDashboard, onOpenProfile, onOpenSearch }: MobileHeaderProps) {
  const { t } = useTranslation();
  const { displayName } = useSettings();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { filters, setFilters } = useAppStore();
  const firstName = displayName?.trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const privacyLabel = isPrivacyMode ? "Mostrar valores" : "Ocultar valores";

  return (
    <Box
      component="header"
      sx={(theme) => ({
        position: "fixed",
        top: 0,
        insetInline: 0,
        zIndex: 1100,
        bgcolor: alpha(theme.palette.background.default, 0.96),
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid",
        borderColor: alpha(theme.palette.text.primary, 0.06),
        paddingTop: "env(safe-area-inset-top, 0px)",
      })}
    >
      <Box sx={{
        mx: "auto", maxWidth: 640, px: 1.5, minHeight: 64, display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto", alignItems: "center",
      }}>
        {isDashboard ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
            <IconButton onClick={onOpenProfile} aria-label="Abrir perfil" sx={{ width: 44, height: 44, flexShrink: 0 }}>
              <Avatar sx={(theme) => ({
                width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: "primary.main", fontSize: 15, fontWeight: 700,
              })}>
                {firstName ? firstName[0].toLocaleUpperCase("pt-BR") : <NixLogo size={28} />}
              </Avatar>
            </IconButton>
            <Typography component="h1" fontWeight={700} sx={{ fontSize: 15, lineHeight: 1.25, overflowWrap: "anywhere", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>
              {greeting}{firstName ? `, ${firstName}` : ""}
            </Typography>
          </Box>
        ) : <NixLogo size={36} />}

        <DateFilter
          month={filters.month}
          year={filters.year}
          onDateChange={(month, year) => setFilters({ month, year })}
          pickerOnly
          headerStyle
        />

        <Box sx={{ display: "flex" }}>
          <IconButton color={isPrivacyMode ? "primary" : "default"} onClick={togglePrivacyMode} aria-label={privacyLabel} sx={{ width: 44, height: 44 }}>
            {isPrivacyMode ? <EyeOff size={19} /> : <Eye size={19} />}
          </IconButton>
          <IconButton onClick={onOpenSearch} aria-label={t("common.search")} sx={{ width: 44, height: 44 }}>
            <Search size={19} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
