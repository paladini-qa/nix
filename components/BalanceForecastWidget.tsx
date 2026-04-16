import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { Transaction } from "../types";
import { usePrivacyMode } from "../hooks";
import dayjs from "dayjs";

const MotionBox = motion.create(Box);

interface BalanceForecastWidgetProps {
  transactions: Transaction[];
  selectedMonth: number; // 0-indexed
  selectedYear: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const BalanceForecastWidget: React.FC<BalanceForecastWidgetProps> = ({
  transactions,
  selectedMonth,
  selectedYear,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { privacyStyles } = usePrivacyMode();

  const forecast = useMemo(() => {
    const today = dayjs();
    const isCurrentMonth = today.month() === selectedMonth && today.year() === selectedYear;
    if (!isCurrentMonth) return null;

    const todayStr = today.format("YYYY-MM-DD");
    const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

    // Balanço atual: transações do mês já passadas (até hoje)
    let currentBalance = 0;
    transactions.forEach((t) => {
      if (!t.date.startsWith(monthStr)) return;
      if (t.date > todayStr) return;
      if (t.type === "income") currentBalance += t.amount || 0;
      else currentBalance -= t.amount || 0;
    });

    // Receitas/despesas recorrentes pendentes (após hoje, até fim do mês)
    let pendingIncome = 0;
    let pendingExpense = 0;

    transactions.forEach((t) => {
      if (!t.isRecurring && !t.isVirtual) return;
      if (!t.date.startsWith(monthStr)) return;
      if (t.date <= todayStr) return; // já passou
      if (t.type === "income") pendingIncome += t.amount || 0;
      else pendingExpense += t.amount || 0;
    });

    const forecastBalance = currentBalance + pendingIncome - pendingExpense;
    const remainingDays = dayjs(`${selectedYear}-${selectedMonth + 1}-01`).endOf("month").diff(today, "day");

    return { currentBalance, pendingIncome, pendingExpense, forecastBalance, remainingDays };
  }, [transactions, selectedMonth, selectedYear]);

  if (!forecast) return null;

  const isPositive = forecast.forecastBalance >= 0;
  const color = isPositive ? theme.palette.success.main : theme.palette.error.main;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 28, delay: 0.1 }}
      whileHover={{ y: -2 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "16px",
          background: isDark
            ? `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
            : `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha("#FFFFFF", 0.9)} 100%)`,
          border: `1px solid ${alpha(color, isDark ? 0.2 : 0.15)}`,
          boxShadow: `0 4px 20px -6px ${alpha(color, 0.12)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: alpha(color, isDark ? 0.25 : 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPositive ? (
              <TrendingUpIcon sx={{ fontSize: 15, color }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 15, color }} />
            )}
          </Box>
          <Typography variant="caption" fontWeight={700} sx={{ color: "text.secondary", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 9 }}>
            Previsão fim do mês
          </Typography>
          <Tooltip title="Baseado nas transações recorrentes pendentes para este mês" arrow>
            <InfoIcon sx={{ fontSize: 13, color: "text.disabled", ml: "auto", cursor: "help" }} />
          </Tooltip>
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ color, letterSpacing: "-0.02em", ...privacyStyles }}>
          {formatCurrency(forecast.forecastBalance)}
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, mt: 0.75, flexWrap: "wrap" }}>
          {forecast.pendingIncome > 0 && (
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 500, fontSize: 10 }}>
              +{formatCurrency(forecast.pendingIncome)} a receber
            </Typography>
          )}
          {forecast.pendingExpense > 0 && (
            <Typography variant="caption" sx={{ color: theme.palette.error.main, fontWeight: 500, fontSize: 10 }}>
              -{formatCurrency(forecast.pendingExpense)} a pagar
            </Typography>
          )}
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            {forecast.remainingDays}d restantes
          </Typography>
        </Box>
      </Paper>
    </MotionBox>
  );
};

export default BalanceForecastWidget;
