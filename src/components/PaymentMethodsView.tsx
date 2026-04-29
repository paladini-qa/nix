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
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  InputLabel,
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
  Edit as EditIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  AccountBalanceWallet as WalletIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { Transaction, ColorConfig, PaymentMethodColors, PaymentMethodConfig } from "../types";
import { useLayoutSpacing } from "../hooks";
import { getEffectiveReportDate } from "../utils/transactionUtils";
import { generateRecurringTransactions } from "../utils/recurringUtils";
import { useSettings } from "../contexts";
import DateFilter from "./DateFilter";
import ColorPicker from "./ColorPicker";

// Cores padrão para novos métodos
const DEFAULT_PAYMENT_COLORS: ColorConfig = {
  primary: "#6366f1",
  secondary: "#4f46e5",
};

interface PaymentMethodsViewProps {
  transactions: Transaction[];
  paymentMethods: string[];
  paymentMethodColors: PaymentMethodColors;
  paymentMethodConfigs?: PaymentMethodConfig[];
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
  onSelectPaymentMethod: (method: string) => void;
  onPayAll: (paymentMethod: string, month: number, year: number) => void;
  onAddPaymentMethod: (method: string) => void;
  onRemovePaymentMethod: (method: string) => void;
  onUpdatePaymentMethodColor: (method: string, colors: ColorConfig) => void;
  getPaymentMethodPaymentDay?: (method: string) => number | undefined;
  onUpdatePaymentMethodPaymentDay?: (method: string, day: number | null) => void;
  onAddPaymentMethodConfig?: (config: Omit<PaymentMethodConfig, "id">) => Promise<void>;
  onUpdatePaymentMethodConfig?: (config: PaymentMethodConfig) => Promise<void>;
  onRemovePaymentMethodConfig?: (id: string) => Promise<void>;
}

interface PaymentMethodSummary {
  name: string;
  totalExpense: number;
  totalIncome: number;
  transactionCount: number;
  unpaidCount: number;
  unpaidAmount: number;
}

const EMPTY_CONFIG: Omit<PaymentMethodConfig, "id"> = {
  name: "",
  type: "cash",
  closingDay: undefined,
  paymentDay: undefined,
};

const PaymentMethodsView: React.FC<PaymentMethodsViewProps> = ({
  transactions,
  paymentMethods,
  paymentMethodColors,
  paymentMethodConfigs = [],
  selectedMonth,
  selectedYear,
  onDateChange,
  onSelectPaymentMethod,
  onPayAll,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onUpdatePaymentMethodColor,
  getPaymentMethodPaymentDay,
  onUpdatePaymentMethodPaymentDay,
  onAddPaymentMethodConfig,
  onUpdatePaymentMethodConfig,
  onRemovePaymentMethodConfig,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { gridSpacing } = useLayoutSpacing();
  const isDarkMode = theme.palette.mode === "dark";
  const { getPaymentMethodColor } = useSettings();

  const [tabValue, setTabValue] = useState(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  // Estado do formulário de adição/edição de métodos
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formConfig, setFormConfig] = useState<Omit<PaymentMethodConfig, "id">>(EMPTY_CONFIG);
  const [editingConfig, setEditingConfig] = useState<PaymentMethodConfig | null>(null);

  const useConfigSystem = onAddPaymentMethodConfig !== undefined;

  const handleOpenAddDialog = () => {
    setFormConfig(EMPTY_CONFIG);
    setAddDialogOpen(true);
  };

  const handleOpenEditDialog = (config: PaymentMethodConfig) => {
    setEditingConfig(config);
    setEditingConfig({ ...config });
    setEditDialogOpen(true);
  };

  const handleAddMethod = async () => {
    if (useConfigSystem) {
      if (!formConfig.name.trim()) return;
      await onAddPaymentMethodConfig!({
        ...formConfig,
        name: formConfig.name.trim(),
        closingDay: formConfig.type === "card" ? formConfig.closingDay : undefined,
        paymentDay: formConfig.type === "card" ? formConfig.paymentDay : undefined,
      });
      setAddDialogOpen(false);
      setFormConfig(EMPTY_CONFIG);
    } else {
      if (newPaymentMethod.trim()) {
        onAddPaymentMethod(newPaymentMethod.trim());
        setNewPaymentMethod("");
      }
    }
  };

  const handleUpdateMethod = async () => {
    if (!editingConfig || !onUpdatePaymentMethodConfig) return;
    await onUpdatePaymentMethodConfig({
      ...editingConfig,
      closingDay: editingConfig.type === "card" ? editingConfig.closingDay : undefined,
      paymentDay: editingConfig.type === "card" ? editingConfig.paymentDay : undefined,
    });
    setEditDialogOpen(false);
    setEditingConfig(null);
  };

  const handleRemoveMethod = async (method: string) => {
    if (useConfigSystem) {
      const config = paymentMethodConfigs.find((c) => c.name === method);
      if (config) {
        await onRemovePaymentMethodConfig!(config.id);
      }
    } else {
      onRemovePaymentMethod(method);
    }
  };

  const getConfigForMethod = (name: string): PaymentMethodConfig | undefined =>
    paymentMethodConfigs.find((c) => c.name === name);

  // Filtra transações do mês selecionado usando invoiceDueDate calculado pelo config do método
  const monthTransactions = useMemo(() => {
    const baseTransactions = (transactions || []).filter((t) => {
      const [y, m] = getEffectiveReportDate(t, paymentMethodConfigs).split("-");
      const isCurrentMonth =
        parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;

      if (!isCurrentMonth) return false;
      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date))
        return false;

      return true;
    });

    const virtualTransactions = generateRecurringTransactions(
      transactions || [],
      { month: selectedMonth, year: selectedYear },
      paymentMethodConfigs
    );

    return [...baseTransactions, ...virtualTransactions];
  }, [transactions, selectedMonth, selectedYear, paymentMethodConfigs]);

  // Calcula resumo por método de pagamento
  const paymentMethodsSummary = useMemo<PaymentMethodSummary[]>(() => {
    const summaryMap = new Map<string, PaymentMethodSummary>();

    (paymentMethods || []).forEach((method) => {
      summaryMap.set(method, {
        name: method,
        totalExpense: 0,
        totalIncome: 0,
        transactionCount: 0,
        unpaidCount: 0,
        unpaidAmount: 0,
      });
    });

    (monthTransactions || []).forEach((tx) => {
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
    const totalExpenses = paymentMethodsSummary.reduce(
      (sum, s) => sum + s.totalExpense,
      0
    );
    const totalIncome = paymentMethodsSummary.reduce(
      (sum, s) => sum + s.totalIncome,
      0
    );
    const totalUnpaid = paymentMethodsSummary.reduce(
      (sum, s) => sum + s.unpaidAmount,
      0
    );
    const totalTransactions = paymentMethodsSummary.reduce(
      (sum, s) => sum + s.transactionCount,
      0
    );
    const methodsWithActivity = paymentMethodsSummary.filter(
      (s) => s.transactionCount > 0
    ).length;

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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 2 : 3,
        pb: { xs: "140px", md: 0 },
      }}
    >
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
      <Grid container spacing={gridSpacing}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              border: `1px solid ${
                isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
              }`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.7
                  )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha(
                    "#FFFFFF",
                    0.6
                  )} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <CreditCardIcon
                sx={{ color: theme.palette.primary.main, fontSize: 20 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
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
              border: `1px solid ${
                isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
              }`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.7
                  )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha(
                    "#FFFFFF",
                    0.6
                  )} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingDownIcon sx={{ color: "#DC2626", fontSize: 20 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Total Despesas
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              fontWeight={700}
              color="#DC2626"
            >
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
              background:
                stats.totalUnpaid > 0
                  ? `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`
                  : `linear-gradient(135deg, #059669 0%, #047857 100%)`,
              boxShadow: `0 8px 32px -8px ${alpha(
                stats.totalUnpaid > 0 ? "#f59e0b" : "#059669",
                0.4
              )}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {stats.totalUnpaid > 0 ? (
                <WarningIcon
                  sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }}
                />
              ) : (
                <CheckCircleIcon
                  sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }}
                />
              )}
              <Typography
                variant="caption"
                sx={{ color: alpha("#FFFFFF", 0.8) }}
                fontWeight={600}
              >
                {stats.totalUnpaid > 0 ? "A Pagar" : "Status"}
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              fontWeight={700}
              color="#FFFFFF"
            >
              {stats.totalUnpaid > 0
                ? formatCurrency(stats.totalUnpaid)
                : "Tudo em dia!"}
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
          border: `1px solid ${
            isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
          }`,
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
                    bgcolor:
                      tabValue === 0
                        ? alpha(theme.palette.primary.main, 0.15)
                        : "action.hover",
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
                    bgcolor:
                      tabValue === 1
                        ? alpha(theme.palette.primary.main, 0.15)
                        : "action.hover",
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
          {paymentMethodsSummary.filter((s) => s.transactionCount > 0).length >
          0 ? (
            <Grid container spacing={gridSpacing}>
              {paymentMethodsSummary
                .filter((s) => s.transactionCount > 0)
                .map((summary) => {
                  const colors = getPaymentMethodColor(summary.name);
                  const percentage =
                    stats.totalExpenses > 0
                      ? (summary.totalExpense / stats.totalExpenses) * 100
                      : 0;
                  const hasUnpaid = summary.unpaidCount > 0;

                  return (
                    <Grid key={summary.name} size={{ xs: 12, sm: 6, lg: 4 }} sx={{ display: "flex" }}>
                      <Paper
                        elevation={0}
                        onClick={() => onSelectPaymentMethod(summary.name)}
                        sx={{
                          p: isMobile ? 2 : 2.5,
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          width: "100%",
                          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                          background: isDarkMode
                            ? `linear-gradient(135deg, ${alpha(
                                theme.palette.background.paper,
                                0.7
                              )} 0%, ${alpha(
                                theme.palette.background.paper,
                                0.5
                              )} 100%)`
                            : `linear-gradient(135deg, ${alpha(
                                "#FFFFFF",
                                0.85
                              )} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                          backdropFilter: "blur(16px)",
                          border: `1px solid ${
                            isDarkMode
                              ? alpha("#FFFFFF", 0.08)
                              : alpha("#000000", 0.06)
                          }`,
                          borderLeft: `3px solid ${colors.primary}`,
                          borderRadius: "16px",
                          boxShadow: isDarkMode
                            ? `0 6px 24px -6px ${alpha(colors.primary, 0.2)}`
                            : `0 6px 24px -6px ${alpha(colors.primary, 0.15)}`,
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: isDarkMode
                              ? `0 12px 32px -6px ${alpha(colors.primary, 0.3)}`
                              : `0 12px 32px -6px ${alpha(
                                  colors.primary,
                                  0.25
                                )}`,
                          },
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: isDarkMode
                              ? `linear-gradient(135deg, ${alpha(
                                  colors.primary,
                                  0.08
                                )} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
                              : `linear-gradient(135deg, ${alpha(
                                  colors.primary,
                                  0.04
                                )} 0%, ${alpha(colors.secondary, 0.01)} 100%)`,
                            pointerEvents: "none",
                          },
                        }}
                      >
                        {/* Header */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1.5,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: "12px",
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                display: "flex",
                                flexShrink: 0,
                              }}
                            >
                              <CreditCardIcon
                                sx={{ color: "#fff", fontSize: 20 }}
                              />
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
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
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
                                "&:hover": {
                                  bgcolor: alpha(colors.primary, 0.2),
                                },
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 1,
                            }}
                          >
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
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ minWidth: 35 }}
                            >
                              {percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* Status & Actions */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                            mt: "auto",
                          }}
                        >
                          {hasUnpaid ? (
                            <Chip
                              icon={<WarningIcon />}
                              label={
                                summary.unpaidCount === 1
                                  ? "1 pendente"
                                  : `${summary.unpaidCount} pendentes`
                              }
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{
                                fontSize: 11,
                                height: 24,
                                borderRadius: "8px",
                              }}
                            />
                          ) : (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Todas pagas"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{
                                fontSize: 11,
                                height: 24,
                                borderRadius: "8px",
                              }}
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
                              borderTop: `1px solid ${alpha(
                                theme.palette.divider,
                                0.5
                              )}`,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Valor pendente:
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color="warning.main"
                              >
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
              <ReceiptIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma transação neste mês
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Não há transações registradas para os métodos de pagamento
                cadastrados
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
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1.5 }}
            >
              Adicionar Novo Método de Pagamento
            </Typography>
            {useConfigSystem ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
                sx={{ borderRadius: "10px", textTransform: "none" }}
              >
                Novo método
              </Button>
            ) : (
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
                      bgcolor: isDarkMode
                        ? alpha("#000", 0.2)
                        : alpha("#fff", 0.8),
                    },
                  }}
                />
                <Button
                  onClick={handleAddMethod}
                  variant="contained"
                  sx={{ minWidth: 48, borderRadius: "10px" }}
                >
                  <AddIcon />
                </Button>
              </Box>
            )}
          </Paper>

          {/* Payment Methods List */}
          {paymentMethods.length > 0 ? (
            <Grid container spacing={gridSpacing}>
              {paymentMethods.map((method) => {
                const colors =
                  paymentMethodColors[method] || DEFAULT_PAYMENT_COLORS;
                const summary = paymentMethodsSummary.find(
                  (s) => s.name === method
                );

                const config = getConfigForMethod(method);
                const isCard = config?.type === "card";

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
                        onChange={(newColors) =>
                          onUpdatePaymentMethodColor(method, newColors)
                        }
                        size="small"
                      />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
                        {isCard ? (
                          <CreditCardIcon fontSize="small" sx={{ color: colors.primary }} />
                        ) : (
                          <WalletIcon fontSize="small" sx={{ color: colors.primary }} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
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
                            <Chip
                              label={isCard ? "Cartão" : "À vista"}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: 10,
                                fontWeight: 600,
                                bgcolor: isCard
                                  ? alpha(theme.palette.primary.main, 0.12)
                                  : alpha(theme.palette.success.main, 0.12),
                                color: isCard ? "primary.main" : "success.main",
                                border: "none",
                                "& .MuiChip-label": { px: 0.75 },
                              }}
                            />
                          </Box>
                          {isCard && config?.closingDay && config?.paymentDay ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                              <CalendarIcon sx={{ fontSize: 11, color: "text.disabled" }} />
                              <Typography variant="caption" color="text.secondary">
                                Fecha dia {config.closingDay} · Paga dia {config.paymentDay}
                              </Typography>
                            </Box>
                          ) : isCard ? (
                            <Typography variant="caption" color="warning.main">
                              Configure os dias de fechamento e pagamento
                            </Typography>
                          ) : (
                            summary && summary.transactionCount > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {summary.transactionCount} transações este mês
                              </Typography>
                            )
                          )}
                        </Box>
                      </Box>

                      {useConfigSystem && config ? (
                        <Tooltip title="Editar método">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(config)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        getPaymentMethodPaymentDay && onUpdatePaymentMethodPaymentDay && (
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                              Dia
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 56 }}>
                              <Select
                                value={getPaymentMethodPaymentDay(method) ?? ""}
                                displayEmpty
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const day = v === "" ? null : Number(v);
                                  if (day === null || (day >= 1 && day <= 31)) {
                                    onUpdatePaymentMethodPaymentDay(method, day);
                                  }
                                }}
                                sx={{
                                  fontSize: "0.8rem",
                                  height: 32,
                                  "& .MuiSelect-select": { py: 0.5 },
                                }}
                              >
                                <MenuItem value=""><em>—</em></MenuItem>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                  <MenuItem key={d} value={d}>{d}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        )
                      )}

                      <Tooltip title="Remover método">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveMethod(method)}
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
              <WalletIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
              />
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

      {/* Dialog: Adicionar método */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Novo método de pagamento</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "12px !important" }}>
          <TextField
            label="Nome"
            fullWidth
            size="small"
            value={formConfig.name}
            onChange={(e) => setFormConfig((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Nubank, Bradesco..."
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Tipo
            </Typography>
            <ToggleButtonGroup
              value={formConfig.type}
              exclusive
              onChange={(_, v) => v && setFormConfig((p) => ({ ...p, type: v }))}
              size="small"
              sx={{ width: "100%" }}
            >
              <ToggleButton value="cash" sx={{ flex: 1, borderRadius: "10px 0 0 10px", textTransform: "none" }}>
                <WalletIcon fontSize="small" sx={{ mr: 0.75 }} />
                À vista
              </ToggleButton>
              <ToggleButton value="card" sx={{ flex: 1, borderRadius: "0 10px 10px 0", textTransform: "none" }}>
                <CreditCardIcon fontSize="small" sx={{ mr: 0.75 }} />
                Cartão
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {formConfig.type === "card" && (
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Dia de fechamento</InputLabel>
                <Select
                  value={formConfig.closingDay ?? ""}
                  label="Dia de fechamento"
                  onChange={(e) =>
                    setFormConfig((p) => ({ ...p, closingDay: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  sx={{ borderRadius: "10px" }}
                >
                  <MenuItem value=""><em>Selecionar</em></MenuItem>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <MenuItem key={d} value={d}>Dia {d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Dia de pagamento</InputLabel>
                <Select
                  value={formConfig.paymentDay ?? ""}
                  label="Dia de pagamento"
                  onChange={(e) =>
                    setFormConfig((p) => ({ ...p, paymentDay: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  sx={{ borderRadius: "10px" }}
                >
                  <MenuItem value=""><em>Selecionar</em></MenuItem>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <MenuItem key={d} value={d}>Dia {d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          {formConfig.type === "card" && (
            <Typography variant="caption" color="text.secondary">
              A fatura de cada transação será calculada automaticamente com base nesses dias.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ borderRadius: "10px", textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAddMethod}
            disabled={!formConfig.name.trim() || (formConfig.type === "card" && (!formConfig.closingDay || !formConfig.paymentDay))}
            sx={{ borderRadius: "10px", textTransform: "none" }}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Editar método */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Editar método de pagamento</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "12px !important" }}>
          {editingConfig && (
            <>
              <TextField
                label="Nome"
                fullWidth
                size="small"
                value={editingConfig.name}
                onChange={(e) => setEditingConfig((p) => p ? { ...p, name: e.target.value } : p)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  Tipo
                </Typography>
                <ToggleButtonGroup
                  value={editingConfig.type}
                  exclusive
                  onChange={(_, v) => v && setEditingConfig((p) => p ? { ...p, type: v } : p)}
                  size="small"
                  sx={{ width: "100%" }}
                >
                  <ToggleButton value="cash" sx={{ flex: 1, borderRadius: "10px 0 0 10px", textTransform: "none" }}>
                    <WalletIcon fontSize="small" sx={{ mr: 0.75 }} />
                    À vista
                  </ToggleButton>
                  <ToggleButton value="card" sx={{ flex: 1, borderRadius: "0 10px 10px 0", textTransform: "none" }}>
                    <CreditCardIcon fontSize="small" sx={{ mr: 0.75 }} />
                    Cartão
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {editingConfig.type === "card" && (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Dia de fechamento</InputLabel>
                    <Select
                      value={editingConfig.closingDay ?? ""}
                      label="Dia de fechamento"
                      onChange={(e) =>
                        setEditingConfig((p) => p ? { ...p, closingDay: e.target.value ? Number(e.target.value) : undefined } : p)
                      }
                      sx={{ borderRadius: "10px" }}
                    >
                      <MenuItem value=""><em>Selecionar</em></MenuItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <MenuItem key={d} value={d}>Dia {d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Dia de pagamento</InputLabel>
                    <Select
                      value={editingConfig.paymentDay ?? ""}
                      label="Dia de pagamento"
                      onChange={(e) =>
                        setEditingConfig((p) => p ? { ...p, paymentDay: e.target.value ? Number(e.target.value) : undefined } : p)
                      }
                      sx={{ borderRadius: "10px" }}
                    >
                      <MenuItem value=""><em>Selecionar</em></MenuItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <MenuItem key={d} value={d}>Dia {d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ borderRadius: "10px", textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateMethod}
            disabled={!editingConfig?.name.trim() || (editingConfig?.type === "card" && (!editingConfig?.closingDay || !editingConfig?.paymentDay))}
            sx={{ borderRadius: "10px", textTransform: "none" }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentMethodsView;
