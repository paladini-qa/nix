import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  useTheme,
  alpha,
  Button,
} from "@mui/material";
import {
  ArrowUpward as IncomeIcon,
  ArrowDownward as ExpenseIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { Transaction } from "../types";
import { usePrivacyMode } from "../hooks";

const MotionPaper = motion.create(Paper);

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  transactions,
  onViewAll,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { isPrivacyMode, privacyStyles } = usePrivacyMode();

  // Pegar as 5 transações mais recentes (por createdAt, independente do filtro de data)
  const recentTransactions = [...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  if (recentTransactions.length === 0) return null;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11 }}>
          Lançamentos Recentes
        </Typography>
        {onViewAll && (
          <Button
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            onClick={onViewAll}
            sx={{ fontSize: 12, fontWeight: 600, py: 0.25, px: 1, borderRadius: "8px", textTransform: "none", color: "primary.main" }}
          >
            Ver todos
          </Button>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          overflow: "hidden",
          border: `1px solid ${isDark ? alpha("#FFFFFF", 0.07) : alpha("#000000", 0.06)}`,
          background: isDark
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha("#FFFFFF", 0.85),
          backdropFilter: "blur(12px)",
        }}
      >
        {recentTransactions.map((tx, index) => {
          const isIncome = tx.type === "income";
          return (
            <MotionPaper
              key={tx.id}
              elevation={0}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28, delay: index * 0.06 }}
              whileHover={{ x: 4, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)" }}
              whileTap={{ scale: 0.99 }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.25,
                borderRadius: 0,
                background: "transparent",
                borderBottom: index < recentTransactions.length - 1
                  ? `1px solid ${isDark ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.04)}`
                  : "none",
                "&:hover": {
                  bgcolor: isDark ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02),
                },
                transition: "background 0.15s ease",
              }}
            >
              {/* Ícone de tipo */}
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  bgcolor: isIncome
                    ? alpha(theme.palette.success.main, isDark ? 0.2 : 0.1)
                    : alpha(theme.palette.error.main, isDark ? 0.2 : 0.1),
                }}
              >
                {isIncome ? (
                  <IncomeIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                ) : (
                  <ExpenseIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
                )}
              </Box>

              {/* Descrição e categoria */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {tx.description}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                    {formatDate(tx.date)}
                  </Typography>
                  <Chip
                    label={tx.category}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: 9,
                      fontWeight: 600,
                      bgcolor: isIncome
                        ? alpha(theme.palette.success.main, 0.08)
                        : alpha(theme.palette.primary.main, 0.08),
                      color: isIncome ? theme.palette.success.main : theme.palette.primary.main,
                      border: "none",
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                </Box>
              </Box>

              {/* Valor */}
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{
                  flexShrink: 0,
                  color: isIncome ? theme.palette.success.main : theme.palette.error.main,
                  ...privacyStyles,
                }}
              >
                {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
              </Typography>
            </MotionPaper>
          );
        })}
      </Paper>
    </Box>
  );
};

export default RecentTransactionsWidget;
