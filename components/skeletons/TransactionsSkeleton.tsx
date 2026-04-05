import React from "react";
import { Box, Skeleton, Paper, useTheme, alpha, useMediaQuery } from "@mui/material";

/**
 * Skeleton para TransactionsView.
 *
 * Espelha exatamente o layout final do TransactionTable:
 * - Mobile: lista de cards com avatar 44px, description + amount, date + category chip
 * - Desktop: tabela com 5 colunas (data, descrição, categoria, pagamento, valor) + barra de progresso
 *
 * Garante que as dimensões sejam idênticas ao componente real para evitar layout shift.
 */
const TransactionsSkeleton: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const bg = isDarkMode ? alpha("#FFF", 0.06) : alpha("#000", 0.05);
  const paperBg = isDarkMode
    ? alpha(theme.palette.background.paper, 0.6)
    : alpha("#FFF", 0.9);
  const borderColor = isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06);

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: "20px",
              bgcolor: paperBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            {/* Avatar de categoria: 44x44px idêntico ao componente real */}
            <Skeleton
              variant="rounded"
              width={44}
              height={44}
              sx={{ borderRadius: "20px", flexShrink: 0, bgcolor: bg }}
            />

            {/* Conteúdo: descrição + amount */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
                <Skeleton variant="text" width="55%" height={20} sx={{ bgcolor: bg }} />
                <Skeleton variant="text" width={72} height={20} sx={{ bgcolor: bg, flexShrink: 0 }} />
              </Box>
              {/* Date + category chip */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="text" width={30} height={16} sx={{ bgcolor: bg }} />
                <Skeleton variant="rounded" width={70} height={20} sx={{ borderRadius: "11px", bgcolor: bg }} />
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }

  // Desktop: tabela com header + 8 linhas
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "20px",
        overflow: "hidden",
        bgcolor: paperBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Header da tabela */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "100px 1fr 140px 140px 160px",
          gap: 2,
          px: 2,
          py: 2.5,
          borderBottom: `1px solid ${borderColor}`,
          bgcolor: isDarkMode ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.grey[50], 0.8),
        }}
      >
        {["DATA", "DESCRIÇÃO", "CATEGORIA", "PAGAMENTO", "VALOR"].map((col) => (
          <Skeleton key={col} variant="text" width={col === "DESCRIÇÃO" ? "40%" : 70} height={16} sx={{ bgcolor: bg }} />
        ))}
      </Box>

      {/* Linhas */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: "grid",
            gridTemplateColumns: "100px 1fr 140px 140px 160px",
            gap: 2,
            px: 2,
            py: 2,
            alignItems: "center",
            borderBottom: `1px solid ${isDarkMode ? alpha("#FFF", 0.04) : alpha("#000", 0.04)}`,
          }}
        >
          {/* Data */}
          <Skeleton variant="text" width={60} height={18} sx={{ bgcolor: bg }} />

          {/* Descrição com ícone */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: "12px", flexShrink: 0, bgcolor: bg }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={18} sx={{ bgcolor: bg }} />
              <Skeleton variant="text" width="45%" height={14} sx={{ bgcolor: bg, mt: 0.5 }} />
            </Box>
          </Box>

          {/* Categoria chip */}
          <Skeleton variant="rounded" width={90} height={22} sx={{ borderRadius: "11px", bgcolor: bg }} />

          {/* Método de pagamento */}
          <Skeleton variant="rounded" width={100} height={22} sx={{ borderRadius: "11px", bgcolor: bg }} />

          {/* Valor + barra de progresso */}
          <Box>
            <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: bg }} />
            <Skeleton variant="rounded" width="90%" height={4} sx={{ mt: 0.5, borderRadius: 2, bgcolor: bg }} />
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

export default TransactionsSkeleton;
