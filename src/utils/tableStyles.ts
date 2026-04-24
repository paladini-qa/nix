import { Theme, alpha } from "@mui/material";
import type { SxProps } from "@mui/material";

/**
 * Estilos reutilizáveis para tabelas padronizadas do Nix.
 * Baseado no padrão estabelecido em TransactionsView.tsx.
 * 
 * Características do padrão:
 * - Container: borderRadius 20px, glassmorphism, shadow com tint primary
 * - Header: uppercase, fontSize 11, letterSpacing 0.08em, fontWeight 600
 * - Rows: transições suaves, hover com alpha do primary
 * - Mobile Cards: glassmorphism, borda colorida por tipo
 */

/**
 * Estilos para o Paper container da tabela.
 * Inclui glassmorphism e bordas suaves.
 */
export const getTableContainerSx = (
  theme: Theme,
  isDarkMode: boolean
): SxProps<Theme> => ({
  borderRadius: "20px",
  overflow: "hidden",
  bgcolor: isDarkMode
    ? alpha(theme.palette.background.paper, 0.7)
    : alpha("#FFFFFF", 0.9),
  backdropFilter: "blur(20px)",
  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
  boxShadow: `0 10px 40px -10px ${alpha(theme.palette.primary.main, 0.1)}`,
});

/**
 * Estilos para células de cabeçalho (TableCell em TableHead).
 * Tipografia uppercase, cor secundária, background sutil.
 */
export const getHeaderCellSx = (
  theme: Theme,
  isDarkMode: boolean
): SxProps<Theme> => ({
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "text.secondary",
  py: 2,
  bgcolor: isDarkMode
    ? alpha(theme.palette.background.default, 0.5)
    : alpha(theme.palette.grey[50], 0.95),
  borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.08)}`,
  whiteSpace: "nowrap" as const,
});

/**
 * Estilos para linhas de tabela (TableRow).
 * Inclui hover, alternating rows opcionais, e bordas sutis.
 * 
 * @param isHighlighted - Se a linha deve ter destaque especial (ex: virtual/recurring)
 * @param index - Índice da linha para alternating rows
 */
export const getRowSx = (
  theme: Theme,
  isDarkMode: boolean,
  index: number,
  isHighlighted?: boolean
): SxProps<Theme> => ({
  transition: "all 0.15s ease",
  opacity: isHighlighted ? 0.75 : 1,
  bgcolor: isHighlighted
    ? isDarkMode
      ? alpha(theme.palette.info.main, 0.08)
      : alpha(theme.palette.info.main, 0.05)
    : index % 2 === 0
      ? "transparent"
      : isDarkMode
        ? alpha(theme.palette.action.hover, 0.08)
        : alpha(theme.palette.action.hover, 0.06),
  "&:hover": {
    bgcolor: isDarkMode
      ? alpha(theme.palette.primary.main, 0.08)
      : alpha(theme.palette.primary.main, 0.04),
  },
  "& td": {
    borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.04) : alpha("#000000", 0.04)}`,
    py: 1.5,
  },
});

/**
 * Estilos para TableSortLabel (cabeçalhos ordenáveis).
 */
export const getSortLabelSx = (isActive: boolean): SxProps<Theme> => ({
  "& .MuiTableSortLabel-icon": {
    opacity: isActive ? 1 : 0.4,
    color: isActive ? "primary.main" : "text.disabled",
  },
  "&:hover": {
    color: "primary.main",
    "& .MuiTableSortLabel-icon": { opacity: 1 },
  },
});

/**
 * Estilos para cards mobile com glassmorphism.
 * Usado quando a tabela é convertida para layout de cards em mobile.
 * 
 * @param type - Tipo de transação para cor da borda lateral ("income" | "expense")
 */
export const getMobileCardSx = (
  theme: Theme,
  isDarkMode: boolean,
  type?: "income" | "expense"
): SxProps<Theme> => {
  const borderColor = type
    ? type === "income"
      ? theme.palette.success.main
      : theme.palette.error.main
    : theme.palette.primary.main;

  return {
    borderRadius: "20px",
    overflow: "hidden",
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.paper, 0.7)
      : alpha("#FFFFFF", 0.95),
    backdropFilter: "blur(12px)",
    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
    borderLeft: `4px solid ${borderColor}`,
    boxShadow: `0 4px 20px -4px ${alpha(theme.palette.primary.main, 0.08)}`,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: `0 8px 30px -6px ${alpha(theme.palette.primary.main, 0.12)}`,
    },
    "& .MuiCardContent-root": {
      p: 2,
    },
  };
};

/**
 * Estilos para avatares de ícone (usados em células de categoria/tipo).
 */
export const getIconAvatarSx = (
  theme: Theme,
  isDarkMode: boolean,
  color?: string
): SxProps<Theme> => ({
  width: 36,
  height: 36,
  borderRadius: "12px",
  bgcolor: alpha(color || theme.palette.primary.main, isDarkMode ? 0.2 : 0.1),
  color: color || theme.palette.primary.main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

/**
 * Estilos para chips de status/tipo.
 */
export const getStatusChipSx = (
  theme: Theme,
  variant: "income" | "expense" | "pending" | "completed" | "info"
): SxProps<Theme> => {
  const colorMap = {
    income: theme.palette.success.main,
    expense: theme.palette.error.main,
    pending: theme.palette.warning.main,
    completed: theme.palette.success.main,
    info: theme.palette.info.main,
  };

  const color = colorMap[variant];

  return {
    height: 24,
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: 11,
    bgcolor: alpha(color, 0.12),
    color: color,
    border: `1px solid ${alpha(color, 0.3)}`,
  };
};

/**
 * Estilos para paginação de tabela.
 */
export const getTablePaginationSx = (
  theme: Theme,
  isDarkMode: boolean
): SxProps<Theme> => ({
  borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.08)}`,
  bgcolor: isDarkMode
    ? alpha(theme.palette.background.default, 0.3)
    : alpha(theme.palette.grey[50], 0.5),
  "& .MuiTablePagination-toolbar": {
    minHeight: 48,
  },
  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
    fontSize: 12,
    color: "text.secondary",
  },
});

/**
 * Estilos para toolbar de tabela (busca, filtros, ações).
 */
export const getTableToolbarSx = (
  theme: Theme,
  isDarkMode: boolean
): SxProps<Theme> => ({
  p: 2,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 2,
  bgcolor: isDarkMode
    ? alpha(theme.palette.background.default, 0.3)
    : alpha(theme.palette.grey[50], 0.5),
  borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.04)}`,
});

