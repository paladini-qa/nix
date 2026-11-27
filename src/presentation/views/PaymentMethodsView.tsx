import NixButton from "@/presentation/components/radix/Button";
import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  useTheme,
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
  Add as AddIcon,
  AccountBalanceWallet as WalletIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { Transaction, ColorConfig, PaymentMethodConfig } from "@/domain/entities";
import { getEffectiveReportDate } from "@/domain/usecases/transactionUtils";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";
import { useSettings, useConfirmDialog } from "@/presentation/contexts";
import { extractDominantColor } from "@/shared/utils/imageColorUtils";
import PaymentMethodImagePicker from "@/presentation/components/ui/PaymentMethodImagePicker";
import PaymentMethodsOverview, { type PaymentMethodSummary } from "@/presentation/widgets/PaymentMethodsOverview";

interface PaymentMethodsViewProps {
  transactions: Transaction[];
  paymentMethods: string[];
  paymentMethodConfigs: PaymentMethodConfig[];
  selectedMonth: number;
  selectedYear: number;
  onSelectPaymentMethod: (method: string) => void;
  onPayAll: (ids: string[]) => void;
  onRemovePaymentMethod: (method: string) => void;
  onUpdatePaymentMethodColor: (method: string, colors: ColorConfig) => void;
  onAddPaymentMethodConfig: (config: Omit<PaymentMethodConfig, "id">) => Promise<void>;
  onUpdatePaymentMethodConfig: (config: PaymentMethodConfig) => Promise<void>;
  onRemovePaymentMethodConfig: (id: string) => Promise<void>;
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
  paymentMethodConfigs,
  selectedMonth,
  selectedYear,
  onSelectPaymentMethod,
  onPayAll,
  onRemovePaymentMethod,
  onUpdatePaymentMethodColor,
  onAddPaymentMethodConfig,
  onUpdatePaymentMethodConfig,
  onRemovePaymentMethodConfig,
}) => {
  const theme = useTheme();
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

  const handleOpenAddDialog = () => {
    setFormConfig(EMPTY_CONFIG);
    setAddDialogOpen(true);
  };

  const handleOpenEditDialog = (config: PaymentMethodConfig) => {
    setEditingConfig({ ...config });
    setEditDialogOpen(true);
  };

  const handleAddMethod = async () => {
    if (!formConfig.name.trim()) return;
    const methodName = formConfig.name.trim();
    await onAddPaymentMethodConfig({
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
  };

  const handleUpdateMethod = async () => {
    if (!editingConfig) return;
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
    const config = getConfigForMethod(method);
    if (config) {
      await onRemovePaymentMethodConfig(config.id);
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

  const paymentMethodsSummary = useMemo(() => {
    const summaryMap = new Map(paymentMethods.map((name): [string, PaymentMethodSummary] => [
      name,
      { name, totalExpense: 0, expenseCount: 0, unpaidCount: 0, unpaidAmount: 0, hasActivity: false, hasUnpaidTransactions: false },
    ]));

    for (const transaction of monthTransactions) {
      const summary = summaryMap.get(transaction.paymentMethod);
      if (!summary) continue;
      summary.hasActivity = true;
      if (!transaction.isPaid) summary.hasUnpaidTransactions = true;
      if (transaction.type !== "expense") continue;

      const amount = transaction.amount || 0;
      summary.expenseCount += 1;
      summary.totalExpense += amount;
      if (!transaction.isPaid) {
        summary.unpaidCount += 1;
        summary.unpaidAmount += amount;
      }
    }

    return [...summaryMap.values()];
  }, [monthTransactions, paymentMethods]);

  const handlePayAll = (method: string) => {
    const ids = monthTransactions
      .filter((transaction) => !transaction.isPaid && transaction.paymentMethod === method)
      .map((transaction) => transaction.id);
    onPayAll(ids);
  };

  return (
    <Box sx={{
      display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 },
      minWidth: 0, px: { xs: 0, md: 3 },
      pb: { xs: 2, md: 5 },
    }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 750, letterSpacing: "-0.025em" }}>
            Métodos de pagamento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie seus cartões e contas
          </Typography>
        </Box>
        <NixButton size="sm" onClick={handleOpenAddDialog} style={{ borderRadius: "var(--radius-button-md)" }}>
          <AddIcon sx={{ fontSize: 17 }} />
          Novo método
        </NixButton>
      </Box>

      <PaymentMethodsOverview
        methods={paymentMethodsSummary}
        getConfig={getConfigForMethod}
        getColors={getPaymentMethodColor}
        onSelect={onSelectPaymentMethod}
        onEdit={handleOpenEditDialog}
        onRemove={handleRemoveMethod}
        onPayAll={handlePayAll}
      />

      {/* Dialog: Adicionar método */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Novo método de pagamento</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "12px !important" }}>
          <TextField
            label="Nome"
            fullWidth
            size="small"
            value={formConfig.name}
            onChange={(e) => setFormConfig((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ex.: Nubank, Itaú..."
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
                <InputLabel>Dia do pagamento</InputLabel>
                <Select
                  value={formConfig.paymentDay ?? ""}
                  label="Dia do pagamento"
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
              A fatura de cada transação será calculada automaticamente com base nessas datas.
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
        <DialogActions>
          <NixButton variant="soft" color="gray" onClick={() => setAddDialogOpen(false)}>
            Cancelar
          </NixButton>
          <NixButton
            variant="solid"
            onClick={handleAddMethod}
            disabled={!formConfig.name.trim() || (formConfig.type === "card" && (!formConfig.closingDay || !formConfig.paymentDay))}
          >
            Adicionar
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
                    <InputLabel>Dia do pagamento</InputLabel>
                    <Select
                      value={editingConfig.paymentDay ?? ""}
                      label="Dia do pagamento"
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
        <DialogActions>
          <NixButton variant="soft" color="gray" onClick={() => setEditDialogOpen(false)}>
            Cancelar
          </NixButton>
          <NixButton
            variant="solid"
            onClick={handleUpdateMethod}
            disabled={!editingConfig?.name.trim() || (editingConfig?.type === "card" && (!editingConfig?.closingDay || !editingConfig?.paymentDay))}
          >
            Salvar
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
