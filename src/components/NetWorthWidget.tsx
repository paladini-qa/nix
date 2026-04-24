import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  Chip,
} from "@mui/material";
import {
  AccountBalance as NetWorthIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { Transaction } from "../types";
import { usePrivacyMode } from "../hooks";
import dayjs from "dayjs";

const MotionBox = motion.create(Box);

interface NetWorthWidgetProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const NetWorthWidget: React.FC<NetWorthWidgetProps> = ({ transactions }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { privacyStyles } = usePrivacyMode();

  const { netWorth, thisMonthBalance, lastMonthBalance, trend } = useMemo(() => {
    const now = dayjs();
    const thisMonth = now.month(); // 0-indexed
    const thisYear = now.year();
    const lastMonth = now.subtract(1, "month").month();
    const lastYear = now.subtract(1, "month").year();

    let totalIncome = 0;
    let totalExpense = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    let lastMonthIncome = 0;
    let lastMonthExpense = 0;

    // Ignorar transações virtuais (recorrentes geradas) para evitar duplicação
    const realTransactions = transactions.filter((t) => !t.isVirtual);

    realTransactions.forEach((t) => {
      const txDate = dayjs(t.date);
      const txMonth = txDate.month();
      const txYear = txDate.year();
      const amount = t.amount || 0;

      if (t.type === "income") {
        totalIncome += amount;
        if (txYear === thisYear && txMonth === thisMonth) thisMonthIncome += amount;
        if (txYear === lastYear && txMonth === lastMonth) lastMonthIncome += amount;
      } else {
        totalExpense += amount;
        if (txYear === thisYear && txMonth === thisMonth) thisMonthExpense += amount;
        if (txYear === lastYear && txMonth === lastMonth) lastMonthExpense += amount;
      }
    });

    const netWorth = totalIncome - totalExpense;
    const thisMonthBalance = thisMonthIncome - thisMonthExpense;
    const lastMonthBalance = lastMonthIncome - lastMonthExpense;
    const trend = lastMonthBalance !== 0
      ? ((thisMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100
      : thisMonthBalance > 0 ? 100 : 0;

    return { netWorth, thisMonthBalance, lastMonthBalance, trend };
  }, [transactions]);

  const isPositive = netWorth >= 0;
  const isTrendUp = trend >= 0;
  const primaryColor = isPositive ? theme.palette.success.main : theme.palette.error.main;
  const trendColor = isTrendUp ? theme.palette.success.main : theme.palette.error.main;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      whileHover={{ y: -2 }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          p: 2.5,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(primaryColor, 0.12)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
            : `linear-gradient(135deg, ${alpha(primaryColor, 0.06)} 0%, ${alpha("#FFFFFF", 0.9)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${isDark ? alpha(primaryColor, 0.2) : alpha(primaryColor, 0.15)}`,
          boxShadow: `0 8px 32px -8px ${alpha(primaryColor, 0.15)}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background icon decoration */}
        <Box
          sx={{
            position: "absolute",
            right: -16,
            bottom: -16,
            opacity: 0.04,
            color: primaryColor,
          }}
        >
          <NetWorthIcon sx={{ fontSize: 120 }} />
        </Box>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                bgcolor: alpha(primaryColor, isDark ? 0.25 : 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NetWorthIcon sx={{ fontSize: 17, color: primaryColor }} />
            </Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "text.secondary", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 10 }}
            >
              Balanço Total
            </Typography>
          </Box>

          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ letterSpacing: "-0.02em", color: primaryColor, mb: 0.5, ...privacyStyles }}
          >
            {formatCurrency(netWorth)}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary">
              Este mês:{" "}
              <span style={{ fontWeight: 600, color: thisMonthBalance >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                {thisMonthBalance >= 0 ? "+" : ""}{formatCurrency(thisMonthBalance)}
              </span>
            </Typography>
            {Math.abs(trend) > 0.1 && (
              <Chip
                icon={isTrendUp ? <TrendingUpIcon sx={{ fontSize: 12 }} /> : <TrendingDownIcon sx={{ fontSize: 12 }} />}
                label={`${isTrendUp ? "+" : ""}${trend.toFixed(0)}% vs mês ant.`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 9,
                  fontWeight: 600,
                  bgcolor: alpha(trendColor, 0.1),
                  color: trendColor,
                  border: `1px solid ${alpha(trendColor, 0.2)}`,
                  "& .MuiChip-label": { px: 0.75 },
                  "& .MuiChip-icon": { color: trendColor, ml: 0.5 },
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>
    </MotionBox>
  );
};

export default NetWorthWidget;
