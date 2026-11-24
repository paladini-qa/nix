import { categoryLabel } from "@/shared/i18n/labels";
import React from "react";
import {
  Box,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { Transaction, TransactionType } from "@/domain/entities";
import { useSettings } from "@/presentation/contexts";

interface CategoryBreakdownProps {
  transactions: Transaction[];
  onPaymentMethodClick?: (paymentMethod: string) => void;
  onCategoryClick?: (category: string, type: TransactionType) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value);

// ─── Componente interno — barra de categoria ─────────────────────────────────

interface BarRowProps {
  name: string;
  amount: number;
  total: number;
  color: string;
  icon?: string;
  onClick?: () => void;
}

const BarRow: React.FC<BarRowProps> = ({ name, amount, total, color, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const bgSubtle = isDark ? "#1c1c22" : "#f4f4f5";
  const pct = total > 0 ? (amount / total) * 100 : 0;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "grid",
        gridTemplateColumns: "36px 110px 1fr 80px",
        gap: "12px",
        alignItems: "center",
        py: "8px",
        cursor: onClick ? "pointer" : "default",
        transition: "opacity 0.12s",
        "&:hover": onClick ? { opacity: 0.8 } : {},
      }}
    >
      {/* Ícone */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "10px",
          background: alpha(color, isDark ? 0.2 : 0.14),
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <TrendingDownIcon sx={{ fontSize: 14, color }} />
      </Box>

      {/* Label */}
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: isDark ? "#fafafa" : "#18181b",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {categoryLabel(name)}
      </Typography>

      {/* Barra de progresso */}
      <Box
        sx={{
          height: "8px",
          background: bgSubtle,
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            borderRadius: "99px",
            background: color,
            width: `${pct}%`,
            transition: "width 0.6s ease",
          }}
        />
      </Box>

      {/* Valor */}
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          color: isDark ? "#fafafa" : "#18181b",
          whiteSpace: "nowrap",
        }}
      >
        {formatCompact(amount)}
      </Typography>
    </Box>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  onCategoryClick,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { getCategoryColor } = useSettings();

  const bgElev   = isDark ? "#131317" : "#ffffff";
  const border   = isDark ? "#27272d" : "#e4e4e7";
  const borderSub = isDark ? "#1c1c22" : "#f1f1f4";
  const shadowSm = isDark
    ? "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)"
    : "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)";

  // Despesas por categoria
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  const expenseRows = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, amount]) => ({
      name,
      amount,
      color: getCategoryColor("expense", name).primary,
    }));

  const totalExpense = expenseRows.reduce((s, r) => s + r.amount, 0);

  if (expenseRows.length === 0) return null;

  return (
    <Box
      sx={{
        background: bgElev,
        border: `1px solid ${border}`,
        borderRadius: "14px",
        boxShadow: shadowSm,
        overflow: "hidden",
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          px: "18px",
          pt: "16px",
          pb: "14px",
          borderBottom: `1px solid ${borderSub}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: isDark ? "#fafafa" : "#18181b",
          }}
        >
          Despesas por categoria
        </Typography>
      </Box>

      {/* Linhas de barra */}
      <Box sx={{ px: "18px", py: "6px" }}>
        {expenseRows.map((row) => (
          <BarRow
            key={row.name}
            name={row.name}
            amount={row.amount}
            total={totalExpense}
            color={row.color}
            onClick={onCategoryClick ? () => onCategoryClick(row.name, "expense") : undefined}
          />
        ))}
      </Box>

      {/* Rodapé — total */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: "18px",
          py: "12px",
          borderTop: `1px solid ${borderSub}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: isDark ? "#71717a" : "#a1a1aa",
          }}
        >
          Total despesas
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: "#ef4444",
          }}
        >
          {formatCurrency(totalExpense)}
        </Typography>
      </Box>
    </Box>
  );
};

export default CategoryBreakdown;
