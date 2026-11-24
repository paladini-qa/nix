import React, { useMemo } from "react";
import {
  Box,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { FinancialSummary, Transaction } from "@/domain/entities";
import { getReportDate } from "@/domain/usecases/transactionUtils";
import { CountUp, formatBRL, formatBRLFull } from "@/presentation/components/motion";
import { usePrivacyMode } from "@/presentation/hooks";

// Cores semânticas do design system
const COLORS = {
  primary: "#a855f7",
  income:  "#10b981",
  expense: "#ef4444",
  warning: "#f59e0b",
};

interface SummaryCardsProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  selectedMonth?: number;
  selectedYear?: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, transactions, selectedMonth, selectedYear }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { privacyStylesStrong } = usePrivacyMode();

  // Calcular comparação com mês anterior
  const comparison = useMemo(() => {
    const now = new Date();
    const currentMonth = selectedMonth ?? now.getMonth();
    const currentYear = selectedYear ?? now.getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear  = currentMonth === 0 ? currentYear - 1 : currentYear;

    const prevTxs = transactions.filter((t) => {
      const [y, m] = getReportDate(t).split("-");
      if (parseInt(y) !== prevYear || parseInt(m) !== prevMonth + 1) return false;
      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) return false;
      return true;
    });

    const prevIncome  = prevTxs.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
    const prevExpense = prevTxs.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);

    const MAX_PCT = 999;
    const calcChange = (cur: number, prev: number): number | null => {
      if (prev <= 0) return null;
      const pct = Math.round(((cur - prev) / prev) * 100);
      return Math.abs(pct) > MAX_PCT ? null : pct;
    };

    const incomeProgress  = prevIncome  > 0 ? Math.min((summary.totalIncome  / prevIncome)  * 100, 100) : summary.totalIncome  > 0 ? 100 : 0;
    const expenseProgress = prevExpense > 0 ? Math.min((summary.totalExpense / prevExpense) * 100, 100) : summary.totalExpense > 0 ? 100 : 0;

    return {
      incomeChange:    calcChange(summary.totalIncome,  prevIncome),
      expenseChange:   calcChange(summary.totalExpense, prevExpense),
      incomeProgress,
      expenseProgress,
    };
  }, [transactions, summary, selectedMonth, selectedYear]);

  const monthlyFlow   = summary.totalIncome - summary.totalExpense;
  const isPositive    = monthlyFlow >= 0;
  const balanceColor  = isPositive ? COLORS.income : COLORS.expense;

  // Tokens visuais compartilhados
  const bgElev   = isDark ? "#131317" : "#ffffff";
  const border   = isDark ? "#27272d" : "#e4e4e7";
  const bgSubtle = isDark ? "#1c1c22" : "#f4f4f5";
  const text2    = isDark ? "#a1a1aa" : "#52525b";
  const shadowSm = isDark
    ? "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)"
    : "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)";

  const cardBase = {
    position: "relative" as const,
    background: bgElev,
    border: `1px solid ${border}`,
    borderRadius: "14px",
    padding: "18px",
    boxShadow: shadowSm,
    overflow: "hidden",
    flex: 1,
    minWidth: 0,
  };

  const labelSx = {
    fontSize: "11.5px",
    color: text2,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    marginBottom: "6px",
    display: "block",
  };

  const metaSx = {
    fontSize: "12px",
    color: text2,
    marginTop: "6px",
    fontWeight: 500,
  };

  const iconBase = {
    position: "absolute" as const,
    top: "14px",
    right: "14px",
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const progressTrack = {
    marginTop: "8px",
    height: "4px",
    borderRadius: "99px",
    background: bgSubtle,
    overflow: "hidden",
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "14px",
        width: "100%",
      }}
    >
      {/* Card — Sobras/Défice */}
      <Box sx={cardBase}>
        <Typography sx={labelSx}>
          {isPositive ? "Sobras do Mês" : "Défice Mensal"}
        </Typography>

        <Typography
          sx={{
            fontSize: "26px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            color: balanceColor,
            ...privacyStylesStrong,
          }}
        >
          <CountUp
            value={Math.abs(monthlyFlow)}
            formatter={formatBRLFull}
          decimals={2}
            duration={1.0}
            delay={0.2}
            sx={{ color: balanceColor, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", ...privacyStylesStrong }}
          />
        </Typography>

        <Typography sx={{ ...metaSx, color: balanceColor }}>
          {isPositive ? "● Mandou bem!" : "● Gastando mais que ganha"}
        </Typography>

        {/* Ícone absoluto */}
        <Box sx={{ ...iconBase, background: alpha(balanceColor, 0.12), color: balanceColor }}>
          <WalletIcon sx={{ fontSize: 22 }} />
        </Box>
      </Box>

      {/* Card — Receitas */}
      <Box sx={cardBase}>
        <Typography sx={labelSx}>Receitas</Typography>

        <CountUp
          value={summary.totalIncome}
          formatter={formatBRLFull}
          decimals={2}
          duration={1.0}
          delay={0.3}
          sx={{ color: COLORS.income, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", display: "block", ...privacyStylesStrong }}
        />

        {/* Barra de progresso */}
        <Box sx={progressTrack}>
          <Box
            sx={{
              height: "100%",
              borderRadius: "99px",
              background: COLORS.income,
              width: `${comparison.incomeProgress}%`,
              transition: "width 0.8s ease",
            }}
          />
        </Box>

        <Typography sx={metaSx}>
          {comparison.incomeChange !== null
            ? `${comparison.incomeChange >= 0 ? "+" : ""}${comparison.incomeChange}% vs mês ant.`
            : "Sem dados anteriores"}
        </Typography>

        <Box sx={{ ...iconBase, background: alpha(COLORS.income, 0.12), color: COLORS.income }}>
          <TrendingUpIcon sx={{ fontSize: 22 }} />
        </Box>
      </Box>

      {/* Card — Despesas */}
      <Box sx={cardBase}>
        <Typography sx={labelSx}>Despesas</Typography>

        <CountUp
          value={summary.totalExpense}
          formatter={formatBRLFull}
          decimals={2}
          duration={1.0}
          delay={0.4}
          sx={{ color: COLORS.expense, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", display: "block", ...privacyStylesStrong }}
        />

        <Box sx={progressTrack}>
          <Box
            sx={{
              height: "100%",
              borderRadius: "99px",
              background: COLORS.expense,
              width: `${comparison.expenseProgress}%`,
              transition: "width 0.8s ease",
            }}
          />
        </Box>

        <Typography sx={metaSx}>
          {comparison.expenseChange !== null
            ? `${comparison.expenseChange >= 0 ? "+" : ""}${comparison.expenseChange}% vs mês ant.`
            : "Sem dados anteriores"}
        </Typography>

        <Box sx={{ ...iconBase, background: alpha(COLORS.expense, 0.12), color: COLORS.expense }}>
          <TrendingDownIcon sx={{ fontSize: 22 }} />
        </Box>
      </Box>
    </Box>
  );
};

export default SummaryCards;
