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
import { Transaction, ColorConfig, PaymentMethodColors, PaymentMethodConfig } from "../../types";
import { useLayoutSpacing } from "../../hooks";
import { getEffectiveReportDate } from "../../utils/transactionUtils";
import { generateRecurringTransactions } from "../../utils/recurringUtils";
import { useSettings, useConfirmDialog } from "../../contexts";
import PaymentMethodIcon from "../ui/PaymentMethodIcon";
import { extractDominantColor } from "../../utils/imageColorUtils";
import PaymentMethodImagePicker from "../ui/PaymentMethodImagePicker";

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
            Meios de Pagamento
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Gerencie seus cartões e contas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{ ml: "auto", borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
        >
          Novo método
        </Button>
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

      {/* Unified Payment Methods Grid */}
      {paymentMethods.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: "16px", bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}` }}>
          <WalletIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>Nenhum método cadastrado</Typography>
          <Typography variant="body2" color="text.disabled">Clique em "Novo método" para começar</Typography>
        </Paper>
      ) : (
        <Grid container spacing={gridSpacing}>
          {paymentMethods.map((method) => {
            const colors = getPaymentMethodColor(method);
            const summary = paymentMethodsSummary.find((s) => s.name === method);
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
                    p: 2.5, cursor: "pointer", display: "flex", flexDirection: "column",
                    height: "100%", borderRadius: "16px",
                    background: isDarkMode ? alpha(theme.palette.background.paper, 0.7) : alpha("#fff", 0.95),
                    border: `1.5px solid ${alpha(colors.primary, isDarkMode ? 0.45 : 0.25)}`,
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "translateY(-3px)", boxShadow: `0 10px 28px -6px ${alpha(colors.primary, 0.3)}`, border: `1.5px solid ${alpha(colors.primary, 0.65)}` },
                  }}
                >
                  {/* Header */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                      <PaymentMethodIcon imageUrl={config?.imageUrl} colors={colors} type={config?.type} size={36} borderRadius="10px" iconSize={18} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} sx={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {method}
                        </Typography>
                        <Chip label={isCard ? "Cartão" : "À vista"} size="small" sx={{ height: 16, fontSize: 10, fontWeight: 600, mt: 0.25, bgcolor: isCard ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.success.main, 0.12), color: isCard ? "primary.main" : "success.main", "& .MuiChip-label": { px: 0.75 } }} />
                      </Box>
                    </Box>
                    {hasUnpaid && (
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", whiteSpace: "nowrap", ml: 1 }}>
                        {summary!.unpaidCount} pendente{summary!.unpaidCount > 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Box>

                  {/* Amount */}
                  <Box sx={{ mb: 1.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.5 }}>
                      Este mês
                    </Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                      {summary ? formatCurrency(summary.totalExpense) : "—"}
                    </Typography>
                    {isCard && config?.closingDay && config?.paymentDay && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 11, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary">
                          Fecha {config.closingDay} · Paga {config.paymentDay}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Progress bar */}
                  <LinearProgress variant="determinate" value={Math.min(percentage, 100)} sx={{ height: 4, borderRadius: 2, mb: 2, bgcolor: alpha(colors.primary, 0.15), "& .MuiLinearProgress-bar": { borderRadius: 2, background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` } }} />

                  {/* Footer */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`, pt: 1.5 }}>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {useConfigSystem && config && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(config); }} sx={{ color: "text.secondary", "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" } }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Excluir">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveMethod(method); }} sx={{ color: "text.secondary", "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1), color: "error.main" } }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {hasUnpaid && (
                      <Button size="small" variant="contained" onClick={(e) => handlePayAll(method, e)} sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, px: 2, py: 0.5, borderRadius: "20px", lineHeight: 1.5, background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, boxShadow: `0 4px 12px -2px ${alpha(colors.primary, 0.4)}`, "&:hover": { background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})` } }}>
                        Pagar
                      </Button>
                    )}
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
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Imagem
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
                {formConfig.imageUrl ? "Alterar imagem" : "Selecionar imagem"}
              </Button>
            </Box>
          </Box>
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
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  Imagem
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
                    {editingConfig.imageUrl ? "Alterar imagem" : "Selecionar imagem"}
                  </Button>
                </Box>
              </Box>
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
