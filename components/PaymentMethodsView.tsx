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
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
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

  // Tab state: 0 = Overview, 1 = Manage
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

        // Verifica se esta data está no excluded_dates da transação original
        const excludedDates = t.excludedDates || [];
        if (excludedDates.includes(virtualDate)) {
          return; // Não gera a transação virtual para esta data
        }

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
      
      // Para transações recorrentes originais (não virtuais), verifica se a data está excluída
      // Isso acontece quando o usuário exclui a primeira ocorrência com "apenas esta"
      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) {
        return false;
      }
      
      return true;
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
        // Conta não pagas (todas as transações, incluindo receitas e virtuais)
        if (!tx.isPaid) {
          summary.unpaidCount++;
          // Valor a pagar é apenas de despesas
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
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: isMobile ? 2 : 3,
      // Extra padding para bottom navigation
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
                borderRadius: "20px",
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

      {/* Tabs */}
      <Paper sx={{ px: isMobile ? 1 : 2 }}>
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
                  label={paymentMethodsSummary.filter(s => s.transactionCount > 0).length}
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}>
        {/* Summary Card */}
        <Paper
        elevation={0}
        sx={{
          p: isMobile ? 1.5 : 2,
          position: "relative",
          overflow: "hidden",
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          boxShadow: `0 6px 24px -6px ${alpha("#DC2626", 0.15)}`,
          borderRadius: "16px",
          transition: "all 0.2s ease-in-out",
          "&:hover": { transform: "translateY(-2px)" },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              width: isMobile ? 44 : 52,
              height: isMobile ? 44 : 52,
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha("#DC2626", 0.2)} 0%, ${alpha("#DC2626", 0.1)} 100%)`
                : `linear-gradient(135deg, #FEE2E2 0%, ${alpha("#FEE2E2", 0.6)} 100%)`,
              border: `1px solid ${isDarkMode ? alpha("#DC2626", 0.2) : alpha("#DC2626", 0.15)}`,
              boxShadow: isDarkMode
                ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}`
                : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}`,
            }}
          >
            <TrendingDownIcon sx={{ color: "#DC2626", fontSize: isMobile ? 24 : 28 }} />
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
              Total de Despesas no Mês
            </Typography>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: "#DC2626", letterSpacing: "-0.02em" }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: "20px",
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
                        borderRadius: "20px",
                        bgcolor: alpha(colors.primary, 0.1),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: "20px",
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
                      label={summary.unpaidCount === 1 ? "1 não paga" : `${summary.unpaidCount} não pagas`}
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
                        borderRadius: "20px",
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
                Adicione métodos de pagamento na aba "Gerenciar"
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      </Box>
      </Collapse>

      {/* Tab Content: Manage */}
      <Collapse in={tabValue === 1} unmountOnExit>
        {/* Add Payment Method */}
        <Paper
          sx={{
            p: isMobile ? 2 : 3,
            mb: 3,
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
                  borderRadius: "20px",
                },
              }}
            />
            <IconButton
              onClick={handleAddMethod}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                borderRadius: "20px",
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.8) },
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Payment Methods List */}
        <Grid container spacing={2}>
          {paymentMethods.map((method) => {
            const colors = paymentMethodColors[method] || DEFAULT_PAYMENT_COLORS;
            return (
              <Grid key={method} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    transition: "all 0.2s ease",
                    border: `1px solid ${alpha(colors.primary, 0.2)}`,
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
                    <CreditCardIcon
                      fontSize="small"
                      sx={{ color: colors.primary }}
                    />
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
                  </Box>
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
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Empty State */}
        {paymentMethods.length === 0 && (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <PaymentIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum método de pagamento
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Adicione um método usando o campo acima
            </Typography>
          </Paper>
        )}
      </Collapse>
    </Box>
  );
};

export default PaymentMethodsView;


