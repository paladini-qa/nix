import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
  Chip,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  Stack,
} from "@mui/material";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  WarningAmber as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingDown as ExpenseIcon,
  TrendingUp as IncomeIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { ParsedTransaction, TransactionType } from "../types";

const MotionPaper = motion.create(Paper);

const NIX_PURPLE = "#6366F1";
const NIX_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";

/** Linha editável para o lote; confidence mantida para avisos de UI */
export type EditableBatchRow = {
  description: string;
  amount: number | null;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  date: string;
  /** 0–1 da IA; opcional para linhas adicionadas manualmente */
  confidence?: number;
  /**
   * Data de vencimento da fatura (YYYY-MM-DD). Quando definida, a transação
   * entra no relatório/mês da fatura correto.
   */
  invoiceDueDate?: string;
};

export interface BatchTransactionTableProps {
  transactions: ParsedTransaction[];
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  onConfirmAll: (rows: EditableBatchRow[]) => void;
  onCancel: () => void;
  /** Quando true, confirmar é bloqueado se alguma linha sem valor */
  requireAmount?: boolean;
  /**
   * Dia de vencimento por método (1–31). Usado para montar invoiceDueDate
   * quando o usuário escolhe mês/ano da fatura.
   */
  getPaymentMethodPaymentDay?: (method: string) => number | undefined;
}

/** Monta invoiceDueDate: método com dia → esse dia no mês/ano; senão dia 1. */
function buildInvoiceDueDate(
  paymentMethod: string,
  month: number,
  year: number,
  getDueDay?: (m: string) => number | undefined
): string {
  const dueDay = getDueDay?.(paymentMethod);
  if (dueDay != null && dueDay >= 1 && dueDay <= 31) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const d = Math.min(dueDay, daysInMonth);
    return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

const CONFIDENCE_LOW = 0.5;

function rowNeedsAttention(row: EditableBatchRow): boolean {
  const lowConfidence = row.confidence !== undefined && row.confidence < CONFIDENCE_LOW;
  const missingAmount = row.amount == null || row.amount === 0;
  return lowConfidence || missingAmount;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface MobileBatchRowProps {
  row: EditableBatchRow;
  index: number;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  requireAmount: boolean;
  onUpdate: (field: keyof EditableBatchRow, value: string | number | null) => void;
  onRemove: () => void;
}

const MobileBatchRow: React.FC<MobileBatchRowProps> = ({
  row,
  index,
  categories,
  paymentMethods,
  requireAmount,
  onUpdate,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const needsAttention = rowNeedsAttention(row);
  const isIncome = row.type === "income";
  const typeColor = isIncome ? theme.palette.success.main : theme.palette.error.main;

  const formattedDate = row.date
    ? new Date(row.date + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "—";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${
          needsAttention
            ? alpha(theme.palette.warning.main, 0.4)
            : isDarkMode
            ? alpha("#FFFFFF", 0.08)
            : alpha("#000000", 0.06)
        }`,
        bgcolor: needsAttention
          ? alpha(theme.palette.warning.main, isDarkMode ? 0.06 : 0.03)
          : isDarkMode
          ? alpha("#FFFFFF", 0.04)
          : "#FFFFFF",
        transition: "all 0.2s ease",
      }}
    >
      <Box sx={{ display: "flex" }}>
        {/* Barra lateral de tipo */}
        <Box
          sx={{
            width: 4,
            flexShrink: 0,
            bgcolor: typeColor,
            borderRadius: "4px 0 0 4px",
          }}
        />

        <Box sx={{ flex: 1, p: 1.5 }}>
          {/* Número + Descrição + excluir */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 22,
                height: 22,
                flexShrink: 0,
                borderRadius: "6px",
                bgcolor: alpha(typeColor, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mt: 0.75,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontSize: 10, fontWeight: 700, color: typeColor, lineHeight: 1 }}
              >
                {index + 1}
              </Typography>
            </Box>
            <TextField
              size="small"
              fullWidth
              value={row.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              placeholder="Descrição"
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 14 },
              }}
            />
            <IconButton
              size="small"
              onClick={onRemove}
              sx={{
                color: "text.secondary",
                flexShrink: 0,
                mt: 0.25,
                "&:hover": {
                  color: "error.main",
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Valor + Tipo */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
            <TextField
              size="small"
              type="number"
              value={row.amount ?? ""}
              onChange={(e) =>
                onUpdate("amount", e.target.value === "" ? null : e.target.value)
              }
              placeholder="0,00"
              error={requireAmount && (row.amount == null || row.amount <= 0)}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, fontSize: 11 }}
                    >
                      R$
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 130,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: isIncome ? "success.main" : "error.main",
                },
              }}
            />

            <ToggleButtonGroup
              value={row.type}
              exclusive
              size="small"
              onChange={(_, v) => v && onUpdate("type", v)}
              sx={{ height: 36, flex: 1 }}
            >
              <ToggleButton
                value="expense"
                sx={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "10px 0 0 10px !important",
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.error.main, 0.12),
                    color: "error.main",
                    borderColor: alpha(theme.palette.error.main, 0.3),
                  },
                }}
              >
                <ExpenseIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Despesa
              </ToggleButton>
              <ToggleButton
                value="income"
                sx={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "0 10px 10px 0 !important",
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.success.main, 0.12),
                    color: "success.main",
                    borderColor: alpha(theme.palette.success.main, 0.3),
                  },
                }}
              >
                <IncomeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                Receita
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Resumo / botão expandir */}
          <Box
            onClick={() => setExpanded(!expanded)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              py: 0.5,
              px: 0.5,
              borderRadius: "8px",
              color: "text.secondary",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: isDarkMode ? alpha("#FFFFFF", 0.04) : alpha("#000000", 0.03),
              },
            }}
          >
            <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1.3 }}>
              {expanded
                ? "Menos detalhes"
                : `${row.category} · ${row.paymentMethod} · ${formattedDate}`}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {row.confidence !== undefined && row.confidence < CONFIDENCE_LOW && (
                <Tooltip title={`Confiança IA: ${Math.round(row.confidence * 100)}%`}>
                  <WarningIcon sx={{ fontSize: 14, color: "warning.main" }} />
                </Tooltip>
              )}
              {expanded ? (
                <ExpandLessIcon sx={{ fontSize: 16 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              )}
            </Box>
          </Box>

          {/* Expansão: categoria, pagamento, data */}
          <Collapse in={expanded}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                mt: 1.25,
                pt: 1.25,
                borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.05)}`,
              }}
            >
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>Categoria</InputLabel>
                <Select
                  value={row.category}
                  onChange={(e) => onUpdate("category", e.target.value)}
                  label="Categoria"
                  sx={{ fontSize: 13, borderRadius: "10px" }}
                >
                  {(isIncome ? categories.income : categories.expense).map((c) => (
                    <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: 13 }}>Pagamento</InputLabel>
                <Select
                  value={row.paymentMethod}
                  onChange={(e) => onUpdate("paymentMethod", e.target.value)}
                  label="Pagamento"
                  sx={{ fontSize: 13, borderRadius: "10px" }}
                >
                  {paymentMethods.map((m) => (
                    <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                type="date"
                value={row.date}
                onChange={(e) => onUpdate("date", e.target.value)}
                label="Data"
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 },
                }}
              />
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Paper>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const BatchTransactionTable: React.FC<BatchTransactionTableProps> = ({
  transactions,
  categories,
  paymentMethods,
  onConfirmAll,
  onCancel,
  requireAmount = true,
  getPaymentMethodPaymentDay,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const initialDate = transactions[0]?.date;
  const initialY = initialDate ? parseInt(initialDate.slice(0, 4), 10) : new Date().getFullYear();
  const initialM = initialDate
    ? parseInt(initialDate.slice(5, 7), 10)
    : new Date().getMonth() + 1;
  const [batchInvoiceMonth, setBatchInvoiceMonth] = useState<number>(initialM);
  const [batchInvoiceYear, setBatchInvoiceYear] = useState<number>(initialY);
  const [useBatchInvoice, setUseBatchInvoice] = useState(false);

  const [rows, setRows] = useState<EditableBatchRow[]>(() =>
    transactions.map((t) => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod,
      date: t.date,
      confidence: t.confidence,
    }))
  );

  const summary = useMemo(() => {
    const expenses = rows
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    const income = rows
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    return { expenses, income, balance: income - expenses };
  }, [rows]);

  const updateRow = (
    index: number,
    field: keyof EditableBatchRow,
    value: string | number | null
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[index] };
      if (field === "amount") {
        row.amount = value === "" || value === null ? null : Number(value);
      } else if (field === "confidence") {
        // não editável via formulário
      } else {
        (row as Record<string, unknown>)[field] = value;
        if (field === "type") {
          const cats = value === "income" ? categories.income : categories.expense;
          if (!cats.includes(row.category)) row.category = cats[0] || "";
        }
      }
      next[index] = row;
      return next;
    });
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const validRows = rows.filter((r) => r.description.trim());
  const hasInvalidAmount =
    requireAmount && validRows.some((r) => r.amount == null || r.amount <= 0);

  const handleConfirm = () => {
    if (validRows.length === 0 || hasInvalidAmount) return;
    const payload = validRows.map(({ confidence: _c, ...rest }) => {
      const row = { ...rest } as EditableBatchRow;
      if (useBatchInvoice && batchInvoiceMonth >= 1 && batchInvoiceMonth <= 12) {
        row.invoiceDueDate = buildInvoiceDueDate(
          row.paymentMethod,
          batchInvoiceMonth,
          batchInvoiceYear,
          getPaymentMethodPaymentDay
        );
      }
      return row;
    });
    onConfirmAll(payload);
  };

  const yearOptions = Array.from({ length: 7 }, (_, i) => initialY - 2 + i);

  // ── Barra de sumário ───────────────────────────────────────────────────────

  const summaryBar = (
    <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 0.5 }}>
        {rows.length} {rows.length === 1 ? "transação" : "transações"}
      </Typography>
      {summary.expenses > 0 && (
        <Chip
          size="small"
          icon={<ExpenseIcon sx={{ fontSize: "14px !important" }} />}
          label={formatCurrency(summary.expenses)}
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.main,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            "& .MuiChip-icon": { color: theme.palette.error.main },
          }}
        />
      )}
      {summary.income > 0 && (
        <Chip
          size="small"
          icon={<IncomeIcon sx={{ fontSize: "14px !important" }} />}
          label={formatCurrency(summary.income)}
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            "& .MuiChip-icon": { color: theme.palette.success.main },
          }}
        />
      )}
      {summary.income > 0 && summary.expenses > 0 && (
        <>
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ color: summary.balance >= 0 ? "success.main" : "error.main" }}
          >
            {summary.balance >= 0 ? "+" : ""}
            {formatCurrency(summary.balance)}
          </Typography>
        </>
      )}
    </Box>
  );

  // ── Aviso de valores faltantes ─────────────────────────────────────────────

  const warningBanner = hasInvalidAmount && (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: "10px",
        bgcolor: alpha(theme.palette.warning.main, 0.1),
        border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
        mb: 1.5,
      }}
    >
      <WarningIcon sx={{ fontSize: 16, color: "warning.main" }} />
      <Typography variant="caption" color="warning.main" fontWeight={600}>
        Preencha o valor em todas as linhas antes de confirmar
      </Typography>
    </Box>
  );

  // ── Seção de fatura ────────────────────────────────────────────────────────

  const invoiceSection = (
    <Box
      sx={{
        mb: 2,
        p: 1.5,
        borderRadius: "12px",
        bgcolor: isDarkMode ? alpha(NIX_PURPLE, 0.06) : alpha(NIX_PURPLE, 0.04),
        border: `1px solid ${alpha(NIX_PURPLE, 0.15)}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReceiptIcon sx={{ fontSize: 16, color: NIX_PURPLE, opacity: 0.8 }} />
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.primary" display="block">
              Vincular à fatura
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              Opcional — define o mês/ano da fatura do cartão
            </Typography>
          </Box>
        </Box>
        <Switch
          checked={useBatchInvoice}
          onChange={(e) => setUseBatchInvoice(e.target.checked)}
          size="small"
          sx={{
            "& .MuiSwitch-thumb": { bgcolor: useBatchInvoice ? NIX_PURPLE : undefined },
            "& .MuiSwitch-track": {
              bgcolor: useBatchInvoice ? `${NIX_PURPLE} !important` : undefined,
            },
          }}
        />
      </Box>

      <Collapse in={useBatchInvoice}>
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel sx={{ fontSize: 12 }}>Mês</InputLabel>
            <Select
              value={batchInvoiceMonth}
              onChange={(e) => setBatchInvoiceMonth(Number(e.target.value))}
              label="Mês"
              sx={{ fontSize: 13, borderRadius: "10px" }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>
                  {String(m).padStart(2, "0")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            /
          </Typography>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel sx={{ fontSize: 12 }}>Ano</InputLabel>
            <Select
              value={batchInvoiceYear}
              onChange={(e) => setBatchInvoiceYear(Number(e.target.value))}
              label="Ano"
              sx={{ fontSize: 13, borderRadius: "10px" }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y} sx={{ fontSize: 13 }}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Collapse>
    </Box>
  );

  // ── Footer de ações ────────────────────────────────────────────────────────

  const actionFooter = (
    <Stack direction="row" spacing={1.5} sx={{ pt: isMobile ? 2 : 0, mt: isMobile ? 0 : 2 }}>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        startIcon={<CloseIcon />}
        onClick={onCancel}
        sx={{
          borderRadius: "12px",
          fontWeight: 600,
          textTransform: "none",
          borderColor: "divider",
          color: "text.secondary",
          px: 2,
        }}
      >
        Cancelar
      </Button>
      <Button
        variant="contained"
        size="small"
        startIcon={<CheckIcon />}
        onClick={handleConfirm}
        disabled={validRows.length === 0 || hasInvalidAmount}
        sx={{
          flex: 1,
          borderRadius: "12px",
          fontWeight: 600,
          textTransform: "none",
          background: NIX_GRADIENT,
          boxShadow: `0 4px 16px ${alpha(NIX_PURPLE, 0.35)}`,
          "&:hover": {
            boxShadow: `0 6px 20px ${alpha(NIX_PURPLE, 0.45)}`,
            transform: "translateY(-1px)",
          },
          transition: "all 0.2s ease",
        }}
      >
        Confirmar ({validRows.length})
        {validRows.length > 0 && summary.expenses + summary.income > 0 && (
          <Typography
            component="span"
            variant="caption"
            sx={{ ml: 1, opacity: 0.75, fontWeight: 400 }}
          >
            · {formatCurrency(summary.expenses + summary.income)}
          </Typography>
        )}
      </Button>
    </Stack>
  );

  // ── Mobile ─────────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <MotionPaper
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "20px",
          bgcolor: isDarkMode ? alpha("#FFFFFF", 0.04) : alpha("#FFFFFF", 0.95),
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Revisar lote
          </Typography>
          <Chip
            size="small"
            label="Edite e confirme para salvar"
            sx={{
              bgcolor: alpha(NIX_PURPLE, 0.1),
              color: NIX_PURPLE,
              fontWeight: 500,
              fontSize: 10,
            }}
          />
        </Box>

        {summaryBar}
        {warningBanner}
        {invoiceSection}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2 }}>
          {rows.map((row, index) => (
            <MobileBatchRow
              key={index}
              row={row}
              index={index}
              categories={categories}
              paymentMethods={paymentMethods}
              requireAmount={requireAmount}
              onUpdate={(field, value) => updateRow(index, field, value)}
              onRemove={() => removeRow(index)}
            />
          ))}

          {rows.length === 0 && (
            <Typography
              variant="body2"
              color="text.disabled"
              textAlign="center"
              sx={{ py: 3 }}
            >
              Nenhuma linha restante.
            </Typography>
          )}
        </Box>

        {actionFooter}
      </MotionPaper>
    );
  }

  // ── Desktop ────────────────────────────────────────────────────────────────

  const headerCellSx = {
    fontWeight: 700,
    fontSize: 11,
    color: "text.secondary",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
    bgcolor: isDarkMode ? alpha("#FFFFFF", 0.04) : alpha("#000000", 0.02),
    borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.07)}`,
  };

  return (
    <MotionPaper
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ type: "spring", damping: 22, stiffness: 300 }}
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "20px",
        bgcolor: isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#FFFFFF", 0.95),
        border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
        overflow: "auto",
        maxHeight: "65vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Revisar lote
        </Typography>
        <Chip
          size="small"
          label="Edite e confirme para salvar"
          sx={{
            bgcolor: alpha(NIX_PURPLE, 0.1),
            color: NIX_PURPLE,
            fontWeight: 500,
            fontSize: 11,
          }}
        />
      </Box>

      {summaryBar}
      {warningBanner}
      {invoiceSection}

      <TableContainer
        sx={{
          overflowX: "auto",
          mb: 2,
          borderRadius: "12px",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.07) : alpha("#000000", 0.07)}`,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {/* Coluna de cor de tipo */}
              <TableCell
                padding="none"
                sx={{ ...headerCellSx, width: 4, p: 0, minWidth: 4 }}
              />
              <TableCell sx={headerCellSx}>Descrição</TableCell>
              <TableCell sx={headerCellSx}>Valor</TableCell>
              <TableCell sx={headerCellSx}>Tipo</TableCell>
              <TableCell sx={headerCellSx}>Categoria</TableCell>
              <TableCell sx={headerCellSx}>Pagamento</TableCell>
              <TableCell sx={headerCellSx}>Data</TableCell>
              <TableCell sx={{ ...headerCellSx, width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const typeColor =
                row.type === "income"
                  ? theme.palette.success.main
                  : theme.palette.error.main;
              const needsAttention = rowNeedsAttention(row);
              return (
                <TableRow
                  key={index}
                  sx={{
                    bgcolor: needsAttention
                      ? alpha(theme.palette.warning.main, 0.04)
                      : undefined,
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? alpha("#FFFFFF", 0.03)
                        : alpha("#000000", 0.02),
                    },
                    transition: "background 0.15s ease",
                  }}
                >
                  {/* Barra de cor de tipo */}
                  <TableCell padding="none" sx={{ p: 0, width: 4 }}>
                    <Box
                      sx={{
                        width: 4,
                        minHeight: 44,
                        height: "100%",
                        bgcolor: typeColor,
                        opacity: 0.7,
                      }}
                    />
                  </TableCell>

                  {/* Descrição */}
                  <TableCell padding="none" sx={{ minWidth: 150, pl: 1, pr: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {needsAttention && (
                        <Tooltip
                          title={
                            row.confidence !== undefined && row.confidence < CONFIDENCE_LOW
                              ? `Baixa confiança IA: ${Math.round(row.confidence * 100)}%`
                              : "Valor não preenchido"
                          }
                        >
                          <WarningIcon
                            sx={{ fontSize: 14, color: "warning.main", flexShrink: 0 }}
                          />
                        </Tooltip>
                      )}
                      <TextField
                        size="small"
                        value={row.description}
                        onChange={(e) => updateRow(index, "description", e.target.value)}
                        placeholder="Descrição"
                        fullWidth
                        variant="standard"
                        sx={{
                          "& .MuiInput-root": {
                            fontSize: 13,
                            "&:before": { borderColor: "transparent" },
                          },
                          "& .MuiInput-root:hover:not(.Mui-disabled):before": {
                            borderColor: "divider",
                          },
                        }}
                      />
                    </Box>
                  </TableCell>

                  {/* Valor */}
                  <TableCell padding="none" sx={{ minWidth: 90, pl: 1 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={row.amount ?? ""}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "amount",
                          e.target.value === "" ? null : e.target.value
                        )
                      }
                      placeholder="0,00"
                      inputProps={{ min: 0, step: 0.01 }}
                      error={requireAmount && (row.amount == null || row.amount <= 0)}
                      variant="standard"
                      sx={{
                        "& .MuiInput-root": {
                          fontSize: 13,
                          fontWeight: 600,
                          color: typeColor,
                          "&:before": { borderColor: "transparent" },
                        },
                        "& .MuiInput-root:hover:not(.Mui-disabled):before": {
                          borderColor: "divider",
                        },
                      }}
                    />
                  </TableCell>

                  {/* Tipo */}
                  <TableCell padding="none" sx={{ minWidth: 100, pl: 0.5 }}>
                    <FormControl size="small" fullWidth variant="standard">
                      <Select
                        value={row.type}
                        onChange={(e) =>
                          updateRow(index, "type", e.target.value as TransactionType)
                        }
                        disableUnderline
                        sx={{ fontSize: 13 }}
                        renderValue={(v) => (
                          <Chip
                            size="small"
                            label={v === "income" ? "Receita" : "Despesa"}
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor:
                                v === "income"
                                  ? alpha(theme.palette.success.main, 0.12)
                                  : alpha(theme.palette.error.main, 0.12),
                              color: v === "income" ? "success.main" : "error.main",
                              border: "none",
                              cursor: "pointer",
                            }}
                          />
                        )}
                      >
                        <MenuItem value="expense" sx={{ fontSize: 13 }}>
                          Despesa
                        </MenuItem>
                        <MenuItem value="income" sx={{ fontSize: 13 }}>
                          Receita
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>

                  {/* Categoria */}
                  <TableCell padding="none" sx={{ minWidth: 110, pl: 0.5 }}>
                    <FormControl size="small" fullWidth variant="standard">
                      <Select
                        value={row.category}
                        onChange={(e) => updateRow(index, "category", e.target.value)}
                        disableUnderline
                        sx={{ fontSize: 13 }}
                      >
                        {(row.type === "income"
                          ? categories.income
                          : categories.expense
                        ).map((c) => (
                          <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>
                            {c}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  {/* Pagamento */}
                  <TableCell padding="none" sx={{ minWidth: 100, pl: 0.5 }}>
                    <FormControl size="small" fullWidth variant="standard">
                      <Select
                        value={row.paymentMethod}
                        onChange={(e) =>
                          updateRow(index, "paymentMethod", e.target.value)
                        }
                        disableUnderline
                        sx={{ fontSize: 13 }}
                      >
                        {paymentMethods.map((m) => (
                          <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>

                  {/* Data */}
                  <TableCell padding="none" sx={{ minWidth: 120, pl: 0.5 }}>
                    <TextField
                      size="small"
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(index, "date", e.target.value)}
                      variant="standard"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiInput-root": {
                          fontSize: 13,
                          "&:before": { borderColor: "transparent" },
                        },
                        "& .MuiInput-root:hover:not(.Mui-disabled):before": {
                          borderColor: "divider",
                        },
                      }}
                    />
                  </TableCell>

                  {/* Ação */}
                  <TableCell padding="none" align="right" sx={{ pr: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => removeRow(index)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "error.main",
                          bgcolor: alpha(theme.palette.error.main, 0.08),
                        },
                      }}
                      aria-label="Remover linha"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {actionFooter}
    </MotionPaper>
  );
};

export default BatchTransactionTable;
