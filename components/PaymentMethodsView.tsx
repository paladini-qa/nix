import React, { useMemo, useContext, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  useMediaQuery,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Receipt as ReceiptIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";
import { ColorsContext } from "../App";
import DateFilter from "./DateFilter";

interface PaymentMethodsViewProps {
  transactions: Transaction[];
  paymentMethods: string[];
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
  onSelectPaymentMethod: (method: string) => void;
  onPayAll: (paymentMethod: string, month: number, year: number) => void;
}

interface PaymentMethodSummary {
  name: string;
  totalExpense: number;
  totalIncome: number;
  transactionCount: number;
  unpaidCount: number;
  unpaidAmount: number;
}

const PaymentMethodsView: React.FC<PaymentMethodsViewProps> = ({
  transactions,
  paymentMethods,
  selectedMonth,
  selectedYear,
  onDateChange,
  onSelectPaymentMethod,
  onPayAll,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { getPaymentMethodColor } = useContext(ColorsContext);

  // Gera transações recorrentes virtuais para o mês
  const generateRecurringTransactions = useMemo(() => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = selectedMonth + 1;
    const targetYear = selectedYear;

    transactions.forEach((t) => {
      if (!t.isRecurring || !t.frequency) return;
      if (t.installments && t.installments > 1) return;

      const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
      const targetDate = new Date(targetYear, targetMonth - 1, 1);

      if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

      const isOriginalMonth = origYear === targetYear && origMonth === targetMonth;
      if (isOriginalMonth) return;

      let shouldAppear = false;

      if (t.frequency === "monthly") {
        shouldAppear = true;
      } else if (t.frequency === "yearly") {
        shouldAppear = origMonth === targetMonth && targetYear > origYear;
      }

      if (shouldAppear) {
        const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
        const adjustedDay = Math.min(origDay, daysInTargetMonth);
        const virtualDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

        virtualTransactions.push({
          ...t,
          id: `${t.id}_recurring_${targetYear}-${String(targetMonth).padStart(2, "0")}`,
          date: virtualDate,
          isVirtual: true,
          originalTransactionId: t.id,
        });
      }
    });

    return virtualTransactions;
  }, [transactions, selectedMonth, selectedYear]);

  // Filtra transações do mês selecionado
  const monthTransactions = useMemo(() => {
    const baseTransactions = transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      return parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
    });

    return [...baseTransactions, ...generateRecurringTransactions];
  }, [transactions, selectedMonth, selectedYear, generateRecurringTransactions]);

  // Calcula resumo por método de pagamento
  const paymentMethodsSummary = useMemo<PaymentMethodSummary[]>(() => {
    const summaryMap = new Map<string, PaymentMethodSummary>();

    // Inicializa todos os métodos de pagamento
    paymentMethods.forEach((method) => {
      summaryMap.set(method, {
        name: method,
        totalExpense: 0,
        totalIncome: 0,
        transactionCount: 0,
        unpaidCount: 0,
        unpaidAmount: 0,
      });
    });

    // Processa transações do mês
    monthTransactions.forEach((tx) => {
      const summary = summaryMap.get(tx.paymentMethod);
      if (summary) {
        summary.transactionCount++;
        if (tx.type === "expense") {
          summary.totalExpense += tx.amount || 0;
          // Conta não pagas (apenas despesas reais, não virtuais)
          if (!tx.isPaid && !tx.isVirtual) {
            summary.unpaidCount++;
            summary.unpaidAmount += tx.amount || 0;
          }
        } else {
          summary.totalIncome += tx.amount || 0;
        }
      }
    });

    // Converte para array e ordena por despesas
    return Array.from(summaryMap.values())
      .filter((s) => s.transactionCount > 0 || paymentMethods.includes(s.name))
      .sort((a, b) => b.totalExpense - a.totalExpense);
  }, [monthTransactions, paymentMethods]);

  // Total geral de despesas do mês
  const totalExpenses = paymentMethodsSummary.reduce((sum, s) => sum + s.totalExpense, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handlePayAll = (method: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onPayAll(method, selectedMonth, selectedYear);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
              }}
            >
              <PaymentIcon color="primary" />
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              Payment Methods
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie seus métodos de pagamento e visualize as faturas
          </Typography>
        </Box>

        <DateFilter
          month={selectedMonth}
          year={selectedYear}
          onDateChange={onDateChange}
          showIcon
          compact={isMobile}
        />
      </Box>

      {/* Summary Card */}
      <Paper
        sx={{
          p: isMobile ? 2 : 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.1),
            }}
          >
            <TrendingDownIcon sx={{ color: "error.main", fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total de Despesas no Mês
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="error.main">
              {formatCurrency(totalExpenses)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Payment Methods Grid */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {paymentMethodsSummary.map((summary) => {
          const colors = getPaymentMethodColor(summary.name);
          const percentage = totalExpenses > 0 ? (summary.totalExpense / totalExpenses) * 100 : 0;
          const hasUnpaid = summary.unpaidCount > 0;

          return (
            <Grid key={summary.name} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Paper
                onClick={() => onSelectPaymentMethod(summary.name)}
                sx={{
                  p: isMobile ? 2 : 2.5,
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: `1px solid ${alpha(colors.primary, 0.15)}`,
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${alpha(colors.primary, 0.08)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
                    : `linear-gradient(135deg, ${alpha(colors.primary, 0.06)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 12px 24px -8px ${alpha(colors.primary, 0.25)}`,
                    border: `1px solid ${alpha(colors.primary, 0.3)}`,
                  },
                }}
              >
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        display: "flex",
                      }}
                    >
                      <CreditCardIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {summary.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {summary.transactionCount} transações
                      </Typography>
                    </Box>
                  </Box>
                  <Tooltip title="Ver detalhes">
                    <IconButton size="small" sx={{ color: colors.primary }}>
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Amount */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: colors.primary }}>
                    {formatCurrency(summary.totalExpense)}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: alpha(colors.primary, 0.1),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 3,
                          background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
                      {percentage.toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>

                {/* Unpaid Info & Actions */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {hasUnpaid ? (
                    <Chip
                      icon={<WarningIcon />}
                      label={`${summary.unpaidCount} não paga${summary.unpaidCount > 1 ? "s" : ""}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ fontSize: 11 }}
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Todas pagas"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontSize: 11 }}
                    />
                  )}

                  {hasUnpaid && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={(e) => handlePayAll(summary.name, e)}
                      sx={{
                        textTransform: "none",
                        fontSize: 12,
                        py: 0.5,
                        px: 1.5,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
                        },
                      }}
                    >
                      Pagar Tudo
                    </Button>
                  )}
                </Box>

                {/* Unpaid Amount */}
                {hasUnpaid && (
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        Valor a pagar:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="warning.main">
                        {formatCurrency(summary.unpaidAmount)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}

        {/* Empty State */}
        {paymentMethodsSummary.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <ReceiptIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Nenhum método de pagamento
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Adicione métodos de pagamento nas configurações
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PaymentMethodsView;


