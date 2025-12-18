import React, { useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
} from "@mui/material";
import { Language as LanguageIcon, Check as CheckIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { availableLanguages, changeLanguage, Language } from "../i18n";

interface LanguageSelectorProps {
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (language: Language) => {
    await changeLanguage(language);
    handleClose();
  };

  const currentLanguage = availableLanguages.find(
    (lang) => lang.code === i18n.language
  ) || availableLanguages[0];

  return (
    <>
      <Tooltip title={t("settings.language")}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            bgcolor: open ? "action.selected" : "transparent",
          }}
        >
          {compact ? (
            <LanguageIcon fontSize="small" />
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: 18 }}>
                {currentLanguage.flag}
              </Typography>
            </Box>
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: { minWidth: 180, borderRadius: 2 },
        }}
      >
        {availableLanguages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code as Language)}
            selected={i18n.language === lang.code}
          >
            <ListItemIcon sx={{ fontSize: 20 }}>{lang.flag}</ListItemIcon>
            <ListItemText>{lang.name}</ListItemText>
            {i18n.language === lang.code && (
              <CheckIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector;




