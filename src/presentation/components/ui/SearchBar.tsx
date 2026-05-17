import React from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  fullWidth?: boolean;
}

/**
 * Componente de busca padronizado seguindo o design system Nix.
 * Estilo extraído do TransactionsView.tsx para garantir consistência.
 * 
 * Características:
 * - borderRadius: 20px (padrão Nix)
 * - Background com alpha() adaptado ao tema
 * - Bordas transparentes com transições suaves
 * - Ícone de busca (SearchIcon) no início
 * - Botão de limpar (CloseIcon) quando há texto
 * - Estados de hover/focus personalizados
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  minWidth = 200,
  maxWidth = 320,
  flex = 1,
  fullWidth = false,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const handleClear = () => {
    onChange("");
  };

  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth={fullWidth}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClear}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        flex: fullWidth ? undefined : flex,
        minWidth: fullWidth ? undefined : minWidth,
        maxWidth: fullWidth ? undefined : maxWidth,
        "& .MuiOutlinedInput-root": {
          borderRadius: "20px",
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.default, 0.4)
            : alpha(theme.palette.grey[100], 0.6),
          transition: "all 0.2s ease-in-out",
          "& fieldset": {
            borderColor: "transparent",
            transition: "border-color 0.2s ease-in-out",
          },
          "&:hover fieldset": {
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
          "&.Mui-focused fieldset": {
            borderColor: theme.palette.primary.main,
          },
        },
      }}
    />
  );
};

export default SearchBar;

