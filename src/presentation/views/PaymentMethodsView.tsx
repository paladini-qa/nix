import NixButton from "@/presentation/components/radix/Button";
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
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  InputLabel,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccountBalanceWallet as WalletIcon,
  CalendarToday as CalendarIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { Transaction, ColorConfig, PaymentMethodColors, PaymentMethodConfig } from "@/domain/entities";
import { useLayoutSpacing } from "@/presentation/hooks";
import { getEffectiveReportDate } from "@/domain/usecases/transactionUtils";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";
import { useSettings, useConfirmDialog } from "@/presentation/contexts";
import PaymentMethodIcon from "@/presentation/components/ui/PaymentMethodIcon";
import { extractDominantColor } from "@/shared/utils/imageColorUtils";
import PaymentMethodImagePicker from "@/presentation/components/ui/PaymentMethodImagePicker";

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
  onPayAll: (ids: string[]) => void;
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
  const { confirmDelete } = useConfirmDialog();

  // Estado do formulário de adição/edição de métodos
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formConfig, setFormConfig] = useState<Omit<PaymentMethodConfig, "id">>(EMPTY_CONFIG);
  const [editingConfig, setEditingConfig] = useState<PaymentMethodConfig | null>(null);

  // Image picker
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<"add" | "edit">("add");

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
      const methodName = formConfig.name.trim();
      await onAddPaymentMethodConfig!({
        ...formConfig,
        name: methodName,
        closingDay: formConfig.type === "card" ? formConfig.closingDay : undefined,
        paymentDay: formConfig.type === "card" ? formConfig.paymentDay : undefined,
      });
      // Extrai cor dominante da imagem em segundo plano
      if (formConfig.imageUrl) {
        extractDominantColor(formConfig.imageUrl).then((extracted) => {
          if (extracted) onUpdatePaymentMethodColor(methodName, extracted);
        });
      }
      setAddDialogOpen(false);
      setFormConfig(EMPTY_CONFIG);
    }
  };

  const handleUpdateMethod = async () => {
    if (!editingConfig || !onUpdatePaymentMethodConfig) return;
    await onUpdatePaymentMethodConfig({
      ...editingConfig,
      closingDay: editingConfig.type === "card" ? editingConfig.closingDay : undefined,
      paymentDay: editingConfig.type === "card" ? editingConfig.paymentDay : undefined,
    });
    // Extrai cor dominante da imagem em segundo plano
    if (editingConfig.imageUrl) {
      extractDominantColor(editingConfig.imageUrl).then((extracted) => {
        if (extracted) onUpdatePaymentMethodColor(editingConfig.name, extracted);
      });
    }
    setEditDialogOpen(false);
    setEditingConfig(null);
  };

  const handleRemoveMethod = async (method: string) => {
    const confirmed = await confirmDelete(method);
    if (!confirmed) return;
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
      .sort((a, b) => {
        const aHasTx = a.transactionCount > 0 ? 1 : 0;
        const bHasTx = b.transactionCount > 0 ? 1 : 0;
        if (aHasTx !== bHasTx) return bHasTx - aHasTx;
        return b.totalExpense - a.totalExpense;
      });
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const handlePayAll = (method: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = monthTransactions
      .filter((t) => !t.isPaid && t.paymentMethod === method)
      .map((t) => (t.isVirtual && t.originalTransactionId ? t.originalTransactionId : t.id));
    onPayAll(ids);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 2 : 3,
        px: { xs: 0, md: "28px" },
        pt: { xs: 0, md: "24px" },
        pb: { xs: "140px", md: "60px" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "14px",
          mb: "22px",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Payment Methods
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Manage your cards and accounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{ ml: "auto", borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
        >
          New Method
        </Button>
      </Box>

      {/* Summary Cards - Always Visible */}
      {isMobile ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            position: "relative",
            overflow: "hidden",
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.75)} 100%)`
              : `linear-gradient(135deg, ${alpha("#ffffff", 0.95)} 0%, ${alpha("#f8fafc", 0.95)} 100%)`,
            backdropFilter: "blur(12px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.07)}`,
            borderRadius: "20px",
            boxShadow: isDarkMode
              ? "0 4px 20px -4px rgba(0,0,0,0.3)"
              : `0 4px 20px -4px ${alpha(stats.totalUnpaid > 0 ? "#ef4444" : "#10b981", 0.15)}`,
          }}
        >
          {/* A Pagar */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total to Pay
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: stats.totalUnpaid > 0 ? "#ef4444" : "#10b981", mt: 0.5, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                {formatCurrency(stats.totalUnpaid)}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(stats.totalUnpaid > 0 ? "#ef4444" : "#10b981", 0.12),
                color: stats.totalUnpaid > 0 ? "#ef4444" : "#10b981",
              }}
            >
              <WalletIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>

          <Divider sx={{ borderStyle: "dashed", my: 1.75, opacity: 0.6 }} />

          {/* Breakdown Section */}
          <Grid container spacing={2}>
            {/* Total Despesas */}
            <Grid size={{ xs: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha("#ef4444", 0.1),
                    color: "#ef4444",
                    flexShrink: 0,
                  }}
                >
                  <TrendingDownIcon sx={{ fontSize: 14 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 600, display: "block", lineHeight: 1.1 }}>
                    Expenses
                  </Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.primary", mt: 0.1, display: "block", lineHeight: 1.15 }}>
                    {formatCurrency(stats.totalExpenses)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem" }}>
                    {stats.totalTransactions} txs.
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Faturas Pendentes */}
            <Grid size={{ xs: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha("#f59e0b", 0.1),
                    color: "#f59e0b",
                    flexShrink: 0,
                  }}
                >
                  <WarningIcon sx={{ fontSize: 14 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 600, display: "block", lineHeight: 1.1 }}>
                    Pending
                  </Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.primary", mt: 0.1, display: "block", lineHeight: 1.15 }}>
                    {paymentMethodsSummary.reduce((s, m) => s + m.unpaidCount, 0)} bills
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem" }}>
                    open
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Métodos Ativos */}
            <Grid size={{ xs: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha("#a855f7", 0.1),
                    color: "#a855f7",
                    flexShrink: 0,
                  }}
                >
                  <CreditCardIcon sx={{ fontSize: 14 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 600, display: "block", lineHeight: 1.1 }}>
                    Active
                  </Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.primary", mt: 0.1, display: "block", lineHeight: 1.15 }}>
                    {stats.methodsWithActivity} active
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem" }}>
                    of {paymentMethods.length} reg.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Grid container spacing={gridSpacing}>
          {/* Active Methods */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: "18px",
                borderRadius: "14px",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                background: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.8)
                  : "#ffffff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 38,
                  height: 38,
                  borderRadius: "11px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#a855f7", 0.12),
                  color: "#a855f7",
                }}
              >
                <CreditCardIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
                Active Methods
              </Typography>
              <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#a855f7" }}>
                {stats.methodsWithActivity}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                of {paymentMethods.length} registered
              </Typography>
            </Paper>
          </Grid>

          {/* Total Expenses */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: "18px",
                borderRadius: "14px",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                background: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.8)
                  : "#ffffff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 38,
                  height: 38,
                  borderRadius: "11px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#ef4444", 0.12),
                  color: "#ef4444",
                }}
              >
                <TrendingDownIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
                Total Expenses
              </Typography>
              <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#ef4444" }}>
                {formatCurrency(stats.totalExpenses)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {stats.totalTransactions} transactions
              </Typography>
            </Paper>
          </Grid>

          {/* Pending Bills */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: "18px",
                borderRadius: "14px",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                background: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.8)
                  : "#ffffff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 38,
                  height: 38,
                  borderRadius: "11px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#f59e0b", 0.12),
                  color: "#f59e0b",
                }}
              >
                <WarningIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
                Pending Bills
              </Typography>
              <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {paymentMethodsSummary.reduce((s, m) => s + m.unpaidCount, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                open charges
              </Typography>
            </Paper>
          </Grid>

          {/* To Pay */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: "18px",
                borderRadius: "14px",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                background: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.8)
                  : "#ffffff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 38,
                  height: 38,
                  borderRadius: "11px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#10b981", 0.12),
                  color: "#10b981",
                }}
              >
                <WalletIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
                To Pay
              </Typography>
              <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#10b981" }}>
                {formatCurrency(stats.totalUnpaid)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {stats.totalUnpaid > 0 ? "pending" : "all paid"}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Unified Payment Methods Grid */}
      {paymentMethods.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: "16px", bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}` }}>
          <WalletIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No methods registered</Typography>
          <Typography variant="body2" color="text.disabled">Click on "New Method" to start</Typography>
        </Paper>
      ) : (
        <Grid container spacing={gridSpacing}>
          {paymentMethodsSummary.map((summaryItem) => {
            const method = summaryItem.name;
            const colors = getPaymentMethodColor(method);
            const summary = summaryItem;
            const config = getConfigForMethod(method);
            const isCard = config?.type === "card";
            const hasUnpaid = (summary?.unpaidCount ?? 0) > 0;
            const percentage = stats.totalExpenses > 0 && summary
              ? (summary.totalExpense / stats.totalExpenses) * 100 : 0;

            return (
              <Grid key={method} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Paper
                  elevation={0}
                  onClick={() => onSelectPaymentMethod(method)}
                  sx={{
                    p: "16px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    borderRadius: "14px",
                    background: isDarkMode ? alpha(theme.palette.background.paper, 0.8) : "#ffffff",
                    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: `0 10px 28px -6px ${alpha(colors.primary, 0.25)}` },
                  }}
                >
                  {/* Top color stripe */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: `linear-gradient(90deg, ${colors.primary}, ${alpha(colors.primary, 0.5)})`,
                    }}
                  />

                  {/* Header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: "10px", mt: "6px" }}>
                    <PaymentMethodIcon imageUrl={config?.imageUrl} colors={colors} type={config?.type} size={40} borderRadius="12px" iconSize={18} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} sx={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {method}
                      </Typography>
                      {hasUnpaid && (
                        <Typography sx={{ fontSize: 11, color: "#f59e0b" }}>
                          {summary!.unpaidCount} pending
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Amount */}
                  <Box sx={{ mb: "10px", flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      This month
                    </Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, mt: "2px" }}>
                      {summary ? formatCurrency(summary.totalExpense) : "—"}
                    </Typography>
                    {isCard && config?.closingDay && config?.paymentDay && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 11, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary">
                          Closes {config.closingDay} · Pays {config.paymentDay}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Progress bar */}
                  <Box sx={{ height: 6, borderRadius: "99px", bgcolor: alpha(colors.primary, 0.12), overflow: "hidden", mb: "12px" }}>
                    <Box sx={{ height: "100%", borderRadius: "99px", width: `${Math.min(percentage, 100)}%`, bgcolor: colors.primary, transition: "width 0.3s" }} />
                  </Box>

                  {/* Footer */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {useConfigSystem && config && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(config); }} sx={{ color: "text.secondary", "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" } }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveMethod(method); }} sx={{ color: "text.secondary", "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1), color: "error.main" } }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: "flex", gap: "6px" }}>
                      <Button
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onSelectPaymentMethod(method); }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: 12,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "10px",
                          bgcolor: alpha(colors.primary, 0.1),
                          color: colors.primary,
                          lineHeight: 1.5,
                          "&:hover": { bgcolor: alpha(colors.primary, 0.18) },
                        }}
                      >
                        Details
                      </Button>
                      {hasUnpaid && (
                        <Button size="small" variant="contained" onClick={(e) => handlePayAll(method, e)} sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, px: 1.5, py: 0.5, borderRadius: "10px", lineHeight: 1.5, background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, boxShadow: `0 4px 12px -2px ${alpha(colors.primary, 0.4)}`, "&:hover": { background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})` } }}>
                          Pay
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog: Adicionar método */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>New Payment Method</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "12px !important" }}>
          <TextField
            label="Name"
            fullWidth
            size="small"
            value={formConfig.name}
            onChange={(e) => setFormConfig((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Chase, Bank of America..."
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Type
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
                Cash
              </ToggleButton>
              <ToggleButton value="card" sx={{ flex: 1, borderRadius: "0 10px 10px 0", textTransform: "none" }}>
                <CreditCardIcon fontSize="small" sx={{ mr: 0.75 }} />
                Card
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {formConfig.type === "card" && (
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Closing day</InputLabel>
                <Select
                  value={formConfig.closingDay ?? ""}
                  label="Closing day"
                  onChange={(e) =>
                    setFormConfig((p) => ({ ...p, closingDay: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  sx={{ borderRadius: "10px" }}
                >
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <MenuItem key={d} value={d}>Day {d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Payment day</InputLabel>
                <Select
                  value={formConfig.paymentDay ?? ""}
                  label="Payment day"
                  onChange={(e) =>
                    setFormConfig((p) => ({ ...p, paymentDay: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  sx={{ borderRadius: "10px" }}
                >
                  <MenuItem value=""><em>Select</em></MenuItem>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <MenuItem key={d} value={d}>Day {d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          {formConfig.type === "card" && (
            <Typography variant="caption" color="text.secondary">
              The bill for each transaction will be automatically calculated based on these days.
            </Typography>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Image
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {formConfig.imageUrl && (
                <Box
                  component="img"
                  src={formConfig.imageUrl}
                  sx={{ width: 40, height: 40, borderRadius: "10px", objectFit: "contain", border: `1px solid ${theme.palette.divider}` }}
                />
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<ImageIcon />}
                onClick={() => { setImagePickerTarget("add"); setImagePickerOpen(true); }}
                sx={{ borderRadius: "10px", textTransform: "none" }}
              >
                {formConfig.imageUrl ? "Change image" : "Select image"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <NixButton variant="soft" color="gray" onClick={() => setAddDialogOpen(false)}>
            Cancel
          </NixButton>
          <NixButton
            variant="solid"
            onClick={handleAddMethod}
            disabled={!formConfig.name.trim() || (formConfig.type === "card" && (!formConfig.closingDay || !formConfig.paymentDay))}
          >
            Add
          </NixButton>
        </DialogActions>
      </Dialog>

      {/* Dialog: Editar método */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Payment Method</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "12px !important" }}>
          {editingConfig && (
            <>
              <TextField
                label="Name"
                fullWidth
                size="small"
                value={editingConfig.name}
                onChange={(e) => setEditingConfig((p) => p ? { ...p, name: e.target.value } : p)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  Type
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
                    Cash
                  </ToggleButton>
                  <ToggleButton value="card" sx={{ flex: 1, borderRadius: "0 10px 10px 0", textTransform: "none" }}>
                    <CreditCardIcon fontSize="small" sx={{ mr: 0.75 }} />
                    Card
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {editingConfig.type === "card" && (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Closing day</InputLabel>
                    <Select
                      value={editingConfig.closingDay ?? ""}
                      label="Closing day"
                      onChange={(e) =>
                        setEditingConfig((p) => p ? { ...p, closingDay: e.target.value ? Number(e.target.value) : undefined } : p)
                      }
                      sx={{ borderRadius: "10px" }}
                    >
                      <MenuItem value=""><em>Select</em></MenuItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <MenuItem key={d} value={d}>Day {d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment day</InputLabel>
                    <Select
                      value={editingConfig.paymentDay ?? ""}
                      label="Payment day"
                      onChange={(e) =>
                        setEditingConfig((p) => p ? { ...p, paymentDay: e.target.value ? Number(e.target.value) : undefined } : p)
                      }
                      sx={{ borderRadius: "10px" }}
                    >
                      <MenuItem value=""><em>Select</em></MenuItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <MenuItem key={d} value={d}>Day {d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  Image
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {editingConfig.imageUrl && (
                    <Box
                      component="img"
                      src={editingConfig.imageUrl}
                      sx={{ width: 40, height: 40, borderRadius: "10px", objectFit: "contain", border: `1px solid ${theme.palette.divider}` }}
                    />
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ImageIcon />}
                    onClick={() => { setImagePickerTarget("edit"); setImagePickerOpen(true); }}
                    sx={{ borderRadius: "10px", textTransform: "none" }}
                  >
                    {editingConfig.imageUrl ? "Change image" : "Select image"}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <NixButton variant="soft" color="gray" onClick={() => setEditDialogOpen(false)}>
            Cancel
          </NixButton>
          <NixButton
            variant="solid"
            onClick={handleUpdateMethod}
            disabled={!editingConfig?.name.trim() || (editingConfig?.type === "card" && (!editingConfig?.closingDay || !editingConfig?.paymentDay))}
          >
            Save
          </NixButton>
        </DialogActions>
      </Dialog>

      {/* Image Picker */}
      <PaymentMethodImagePicker
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        methodName={imagePickerTarget === "add" ? formConfig.name : (editingConfig?.name ?? "")}
        currentUrl={imagePickerTarget === "add" ? formConfig.imageUrl : (editingConfig?.imageUrl ?? undefined)}
        onSelect={(url) => {
          if (imagePickerTarget === "add") {
            setFormConfig((p) => ({ ...p, imageUrl: url || undefined }));
          } else {
            setEditingConfig((p) => p ? { ...p, imageUrl: url || undefined } : p);
          }
        }}
      />
    </Box>
  );
};

export default PaymentMethodsView;
