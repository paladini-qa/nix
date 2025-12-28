import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { availableLanguages } from "../i18n";

interface LanguageSelectorProps {
  compact?: boolean;
}

/**
 * Componente que exibe o idioma atual detectado do navegador.
 * Não permite alteração manual - sempre segue o idioma do navegador.
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { i18n, t } = useTranslation();

  // Encontra o idioma atual baseado no que foi detectado do navegador
  const currentLanguage = availableLanguages.find(
    (lang) => i18n.language.startsWith(lang.code.split("-")[0])
  ) || availableLanguages[0];

  return (
    <Tooltip title={`${t("settings.language")}: ${currentLanguage.name}`}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: compact ? 0.5 : 1,
          py: 0.5,
          borderRadius: "20px",
          cursor: "default",
        }}
      >
        <Typography variant="body2" sx={{ fontSize: 18, lineHeight: 1 }}>
          {currentLanguage.flag}
        </Typography>
        {!compact && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
            {currentLanguage.code.toUpperCase()}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

export default LanguageSelector;





