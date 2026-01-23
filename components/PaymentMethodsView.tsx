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
  TextField,
  Tabs,
  Tab,
  Collapse,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Receipt as ReceiptIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { Transaction, ColorConfig, PaymentMethodColors } from "../types";
import { ColorsContext } from "../App";
import DateFilter from "./DateFilter";
import ColorPicker from "./ColorPicker";

// Cores padrão para novos métodos
const DEFAULT_PAYMENT_COLORS: ColorConfig = { primary: "#6366f1", secondary: "#4f46e5" };

interface PaymentMethodsViewProps {
  transactions: Transaction[];
  paymentMethods: string[];
  paymentMethodColors: PaymentMethodColors;
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
  onSelectPaymentMethod: (method: string) => void;
  onPayAll: (paymentMethod: string, month: number, year: number) => void;
  onAddPaymentMethod: (method: string) => void;
  onRemovePaymentMethod: (method: string) => void;
  onUpdatePaymentMethodColor: (method: string, colors: ColorConfig) => void;
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
  paymentMethodColors,
  selectedMonth,
  selectedYear,
  onDateChange,
  onSelectPaymentMethod,
  onPayAll,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onUpdatePaymentMethodColor,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { getPaymentMethodColor } = useContext(ColorsContext);

  const [tabValue, setTabValue] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  const handleAddMethod = () => {
    if (newPaymentMethod.trim()) {
      onAddPaymentMethod(newPaymentMethod.trim());
      setNewPaymentMethod("");
    }
  };

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

        const excludedDates = t.excludedDates || [];
        if (excludedDates.includes(virtualDate)) return;

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
      const isCurrentMonth = parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
      
      if (!isCurrentMonth) return false;
      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) return false;
      
      return true;
    });

    return [...baseTransactions, ...generateRecurringTransactions];
  }, [transactions, selectedMonth, selectedYear, generateRecurringTransactions]);

  // Calcula resumo por método de pagamento
  const paymentMethodsSummary = useMemo<PaymentMethodSummary[]>(() => {
    const summaryMap = new Map<string, PaymentMethodSummary>();

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

    monthTransactions.forEach((tx) => {
      const summary = summaryMap.get(tx.paymentMethod);
      if (summary) {
        summary.transactionCount++;
        if (!tx.isPaid) {
          summary.unpaidCount++;
          if (tx.type === "expense") {
            summary.unpaidAmount += tx.amount || 0;
          }
        }
        if (tx.type === "expense") {
          summary.totalExpense += tx.amount || 0;
        } else {
          summary.totalIncome += tx.amount || 0;
        }
      }
    });

    return Array.from(summaryMap.values())
      .filter((s) => s.transactionCount > 0 || paymentMethods.includes(s.name))
      .sort((a, b) => b.totalExpense - a.totalExpense);
  }, [monthTransactions, paymentMethods]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalExpenses = paymentMethodsSummary.reduce((sum, s) => sum + s.totalExpense, 0);
    const totalIncome = paymentMethodsSummary.reduce((sum, s) => sum + s.totalIncome, 0);
    const totalUnpaid = paymentMethodsSummary.reduce((sum, s) => sum + s.unpaidAmount, 0);
    const totalTransactions = paymentMethodsSummary.reduce((sum, s) => sum + s.transactionCount, 0);
    const methodsWithActivity = paymentMethodsSummary.filter(s => s.transactionCount > 0).length;
    
    return {
      totalExpenses,
      totalIncome,
      totalUnpaid,
      totalTransactions,
      methodsWithActivity,
      balance: totalIncome - totalExpenses,
    };
  }, [paymentMethodsSummary]);

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
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: isMobile ? 2 : 3,
      pb: { xs: "140px", md: 0 },
    }}>
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
                borderRadius: "12px",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
              }}
            >
              <PaymentIcon color="primary" />
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              Métodos de Pagamento
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie seus métodos e visualize as faturas
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {tabValue === 0 && (
            <DateFilter
              month={selectedMonth}
              year={selectedYear}
              onDateChange={onDateChange}
              showIcon
              compact={isMobile}
            />
          )}
        </Box>
      </Box>

      {/* Summary Cards - Always Visible */}
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <CreditCardIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Métodos Ativos
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
              {stats.methodsWithActivity}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              de {paymentMethods.length} cadastrados
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingDownIcon sx={{ color: "#DC2626", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total Despesas
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#DC2626">
              {formatCurrency(stats.totalExpenses)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.totalTransactions} transações
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingUpIcon sx={{ color: "#059669", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total Receitas
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#059669">
              {formatCurrency(stats.totalIncome)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              no mês
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              background: stats.totalUnpaid > 0
                ? `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`
                : `linear-gradient(135deg, #059669 0%, #047857 100%)`,
              boxShadow: `0 8px 32px -8px ${alpha(stats.totalUnpaid > 0 ? "#f59e0b" : "#059669", 0.4)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {stats.totalUnpaid > 0 ? (
                <WarningIcon sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }} />
              ) : (
                <CheckCircleIcon sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }} />
              )}
              <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.8) }} fontWeight={600}>
                {stats.totalUnpaid > 0 ? "A Pagar" : "Status"}
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#FFFFFF">
              {stats.totalUnpaid > 0 ? formatCurrency(stats.totalUnpaid) : "Tudo em dia!"}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.7) }}>
              {stats.totalUnpaid > 0 ? "pendente" : "todas as faturas pagas"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper 
        elevation={0}
        sx={{ 
          px: isMobile ? 1 : 2,
          borderRadius: "16px",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 48,
            },
          }}
        >
          <Tab
            icon={<AssessmentIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Visão Geral
                <Chip
                  label={stats.methodsWithActivity}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: tabValue === 0 ? alpha(theme.palette.primary.main, 0.15) : "action.hover",
                    color: tabValue === 0 ? "primary.main" : "text.secondary",
                  }}
                />
              </Box>
            }
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Gerenciar
                <Chip
                  label={paymentMethods.length}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: tabValue === 1 ? alpha(theme.palette.primary.main, 0.15) : "action.hover",
                    color: tabValue === 1 ? "primary.main" : "text.secondary",
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Tab Content: Overview */}
      <Collapse in={tabValue === 0} unmountOnExit>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Payment Methods Grid */}
          {paymentMethodsSummary.filter(s => s.transactionCount > 0).length > 0 ? (
            <Grid container spacing={isMobile ? 1.5 : 2}>
              {paymentMethodsSummary
                .filter(s => s.transactionCount > 0)
                .map((summary) => {
                  const colors = getPaymentMethodColor(summary.name);
                  const percentage = stats.totalExpenses > 0 ? (summary.totalExpense / stats.totalExpenses) * 100 : 0;
                  const hasUnpaid = summary.unpaidCount > 0;

                  return (
                    <Grid key={summary.name} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Paper
                        elevation={0}
                        onClick={() => onSelectPaymentMethod(summary.name)}
                        sx={{
                          p: isMobile ? 2 : 2.5,
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                          background: isDarkMode
                            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                          backdropFilter: "blur(16px)",
                          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                          borderLeft: `3px solid ${colors.primary}`,
                          borderRadius: "16px",
                          boxShadow: isDarkMode
                            ? `0 6px 24px -6px ${alpha(colors.primary, 0.2)}`
                            : `0 6px 24px -6px ${alpha(colors.primary, 0.15)}`,
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: isDarkMode
                              ? `0 12px 32px -6px ${alpha(colors.primary, 0.3)}`
                              : `0 12px 32px -6px ${alpha(colors.primary, 0.25)}`,
                          },
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: isDarkMode
                              ? `linear-gradient(135deg, ${alpha(colors.primary, 0.08)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
                              : `linear-gradient(135deg, ${alpha(colors.primary, 0.04)} 0%, ${alpha(colors.secondary, 0.01)} 100%)`,
                            pointerEvents: "none",
                          },
                        }}
                      >
                        {/* Header */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: "12px",
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                display: "flex",
                                flexShrink: 0,
                              }}
                            >
                              <CreditCardIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="subtitle1" 
                                fontWeight={600}
                                sx={{ 
                                  overflow: "hidden", 
                                  textOverflow: "ellipsis", 
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {summary.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {summary.transactionCount} transações
                              </Typography>
                            </Box>
                          </Box>
                          <Tooltip title="Ver detalhes">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: colors.primary,
                                bgcolor: alpha(colors.primary, 0.1),
                                "&:hover": { bgcolor: alpha(colors.primary, 0.2) }
                              }}
                            >
                              <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Amount */}
                        <Box sx={{ mb: 2 }}>
                          <Typography 
                            variant="h5" 
                            fontWeight="bold" 
                            sx={{ 
                              color: colors.primary,
                              fontFamily: "monospace",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {formatCurrency(summary.totalExpense)}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                flex: 1,
                                height: 4,
                                borderRadius: "4px",
                                bgcolor: alpha(colors.primary, 0.1),
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: "4px",
                                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                                },
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
                              {percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* Status & Actions */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                          {hasUnpaid ? (
                            <Chip
                              icon={<WarningIcon />}
                              label={summary.unpaidCount === 1 ? "1 pendente" : `${summary.unpaidCount} pendentes`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontSize: 11, height: 24, borderRadius: "8px" }}
                            />
                          ) : (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Todas pagas"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: 11, height: 24, borderRadius: "8px" }}
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
                                fontSize: 11,
                                py: 0.5,
                                px: 1.5,
                                borderRadius: "8px",
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                "&:hover": {
                                  background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
                                },
                              }}
                            >
                              Pagar
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
                                Valor pendente:
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
            </Grid>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: "16px",
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <ReceiptIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma transação neste mês
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Não há transações registradas para os métodos de pagamento cadastrados
              </Typography>
            </Paper>
          )}
        </Box>
      </Collapse>

      {/* Tab Content: Manage */}
      <Collapse in={tabValue === 1} unmountOnExit>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Add Payment Method */}
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 2 : 2.5,
              borderRadius: "16px",
              background: isDarkMode
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Adicionar Novo Método de Pagamento
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Nome do método de pagamento..."
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMethod()}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    bgcolor: isDarkMode ? alpha("#000", 0.2) : alpha("#fff", 0.8),
                  },
                }}
              />
              <Button
                onClick={handleAddMethod}
                variant="contained"
                sx={{
                  minWidth: 48,
                  borderRadius: "10px",
                }}
              >
                <AddIcon />
              </Button>
            </Box>
          </Paper>

          {/* Payment Methods List */}
          {paymentMethods.length > 0 ? (
            <Grid container spacing={isMobile ? 1.5 : 2}>
              {paymentMethods.map((method) => {
                const colors = paymentMethodColors[method] || DEFAULT_PAYMENT_COLORS;
                const summary = paymentMethodsSummary.find(s => s.name === method);
                
                return (
                  <Grid key={method} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        borderRadius: "16px",
                        transition: "all 0.2s ease",
                        border: `1px solid ${alpha(colors.primary, 0.2)}`,
                        borderLeft: `3px solid ${colors.primary}`,
                        background: isDarkMode
                          ? `linear-gradient(135deg, ${alpha(colors.primary, 0.1)} 0%, ${alpha(colors.secondary, 0.05)} 100%)`
                          : `linear-gradient(135deg, ${alpha(colors.primary, 0.06)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`,
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: `0 8px 16px -4px ${alpha(colors.primary, 0.2)}`,
                        },
                      }}
                    >
                      <ColorPicker
                        value={colors}
                        onChange={(newColors) => onUpdatePaymentMethodColor(method, newColors)}
                        size="small"
                      />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
                        <CreditCardIcon fontSize="small" sx={{ color: colors.primary }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            fontWeight={600}
                            sx={{
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {method}
                          </Typography>
                          {summary && summary.transactionCount > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {summary.transactionCount} transações este mês
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Tooltip title="Remover método">
                        <IconButton
                          size="small"
                          onClick={() => onRemovePaymentMethod(method)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": {
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              color: "error.main",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: "16px",
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <WalletIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum método cadastrado
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Adicione um método de pagamento usando o campo acima
              </Typography>
            </Paper>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default PaymentMethodsView;
