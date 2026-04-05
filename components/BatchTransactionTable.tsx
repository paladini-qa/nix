import React, { useState } from "react";
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
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { ParsedTransaction, TransactionType } from "../types";

const MotionPaper = motion.create(Paper);

const NIX_BRAND = {
  purple: "#8A2BE2",
  gradient: "linear-gradient(135deg, #8A2BE2 0%, #6A0DAD 100%)",
};

/** Editable row for batch table; confidence kept for UI warnings only */
export type EditableBatchRow = {
  description: string;
  amount: number | null;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  date: string;
  /** 0–1 from IA; optional for rows added manually */
  confidence?: number;
  /**
   * Data de vencimento da fatura (YYYY-MM-DD). Quando definida, a transação
   * entra no relatório/mês da fatura correto (cartão, etc.).
   */
  invoiceDueDate?: string;
};

export interface BatchTransactionTableProps {
  transactions: ParsedTransaction[];
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  onConfirmAll: (rows: EditableBatchRow[]) => void;
  onCancel: () => void;
  /** When true, confirm is disabled if any row has missing amount */
  requireAmount?: boolean;
  /**
   * Dia de vencimento por método (1–31). Usado para montar invoiceDueDate
   * quando o usuário escolhe mês/ano da fatura (igual ao formulário manual).
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
  const lowConfidence =
    row.confidence !== undefined && row.confidence < CONFIDENCE_LOW;
  const missingAmount = row.amount == null || row.amount === 0;
  return lowConfidence || missingAmount;
}

// ─── Mobile Card Component ────────────────────────────────────────────────────

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
      {/* Barra lateral colorida de tipo */}
      <Box sx={{ display: "flex" }}>
        <Box
          sx={{
            width: 4,
            flexShrink: 0,
            bgcolor: isIncome ? "success.main" : "error.main",
            borderRadius: "4px 0 0 4px",
          }}
        />

        <Box sx={{ flex: 1, p: 1.5 }}>
          {/* Linha 1: Descrição + botão excluir */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={row.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              placeholder="Descrição"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: 14,
                },
              }}
            />
            <IconButton
              size="small"
              onClick={onRemove}
              sx={{
                color: "text.secondary",
                flexShrink: 0,
                mt: 0.25,
                "&:hover": { color: "error.main" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Linha 2: Valor + Tipo */}
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
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
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

          {/* Linha 3: Resumo / botão expandir */}
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
              {row.confidence !== undefined && (
                <Chip
                  size="small"
                  label={`IA ${Math.round(row.confidence * 100)}%`}
                  color={row.confidence < CONFIDENCE_LOW ? "warning" : "default"}
                  sx={{ height: 18, fontSize: 9, "& .MuiChip-label": { px: 0.75 } }}
                />
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

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const initialY = initialDate
    ? parseInt(initialDate.slice(0, 4), 10)
    : new Date().getFullYear();
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
          const cats =
            value === "income" ? categories.income : categories.expense;
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
    requireAmount &&
    validRows.some((r) => r.amount == null || r.amount <= 0);

  const handleConfirm = () => {
    if (validRows.length === 0) return;
    if (hasInvalidAmount) return;
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

  // ── Header comum ──────────────────────────────────────────────────────────

  const headerSection = (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {rows.length} transação(ões) para revisar
        </Typography>
        <Chip
          size="small"
          label="Edite e confirme para salvar"
          sx={{
            bgcolor: alpha(NIX_BRAND.purple, 0.12),
            color: NIX_BRAND.purple,
            fontWeight: 500,
            fontSize: 11,
          }}
        />
      </Box>

      {hasInvalidAmount && (
        <Chip
          size="small"
          icon={<WarningIcon />}
          label="Preencha o valor em todas as linhas antes de confirmar"
          color="warning"
          sx={{ mb: 1.5 }}
        />
      )}

      {/* Mês/ano da fatura */}
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: "12px",
          bgcolor: alpha(NIX_BRAND.purple, 0.06),
          border: `1px solid ${alpha(NIX_BRAND.purple, 0.15)}`,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.secondary"
          display="block"
          sx={{ mb: 0.5 }}
        >
          Vencimento da fatura (opcional)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Marque para que todas as transações entrem na fatura correta.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              value={useBatchInvoice ? 1 : 0}
              onChange={(e) => setUseBatchInvoice(Number(e.target.value) === 1)}
              sx={{ fontSize: 13, borderRadius: "10px" }}
            >
              <MenuItem value={0}>Não definir</MenuItem>
              <MenuItem value={1}>Definir mês/ano</MenuItem>
            </Select>
          </FormControl>
          {useBatchInvoice && (
            <>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={batchInvoiceMonth}
                  onChange={(e) => setBatchInvoiceMonth(Number(e.target.value))}
                  sx={{ fontSize: 13, borderRadius: "10px" }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <MenuItem key={m} value={m}>
                      {String(m).padStart(2, "0")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                /
              </Typography>
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <Select
                  value={batchInvoiceYear}
                  onChange={(e) => setBatchInvoiceYear(Number(e.target.value))}
                  sx={{ fontSize: 13, borderRadius: "10px" }}
                >
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Box>
      </Box>
    </>
  );

  // ── Footer de ações ───────────────────────────────────────────────────────

  const actionFooter = (
    <Box sx={{ display: "flex", gap: 1.5, pt: isMobile ? 2 : 0, mt: isMobile ? 0 : 2 }}>
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
          background: NIX_BRAND.gradient,
          boxShadow: `0 4px 16px ${alpha(NIX_BRAND.purple, 0.35)}`,
          "&:hover": {
            boxShadow: `0 6px 20px ${alpha(NIX_BRAND.purple, 0.45)}`,
          },
        }}
      >
        Confirmar todas ({validRows.length})
      </Button>
    </Box>
  );

  // ── Mobile: cards ─────────────────────────────────────────────────────────

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
        {headerSection}

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

  // ── Desktop: tabela ───────────────────────────────────────────────────────

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
        bgcolor: isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#FFFFFF", 0.95),
        border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
        overflow: "auto",
        maxHeight: "65vh",
      }}
    >
      {headerSection}

      <TableContainer sx={{ overflowX: "auto", mb: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Descrição</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Valor</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Categoria</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Pagamento</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Data</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }} align="center">
                IA
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }} align="right">
                Ação
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  bgcolor: rowNeedsAttention(row)
                    ? alpha(theme.palette.warning.main, 0.06)
                    : undefined,
                }}
              >
                <TableCell padding="none" sx={{ minWidth: 120 }}>
                  <TextField
                    size="small"
                    value={row.description}
                    onChange={(e) => updateRow(index, "description", e.target.value)}
                    placeholder="Descrição"
                    fullWidth
                    sx={{ "& .MuiInput-root": { fontSize: 13 } }}
                  />
                </TableCell>
                <TableCell padding="none" sx={{ minWidth: 90 }}>
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
                    placeholder="0"
                    inputProps={{ min: 0, step: 0.01 }}
                    error={requireAmount && (row.amount == null || row.amount <= 0)}
                    sx={{ "& .MuiInput-root": { fontSize: 13 } }}
                  />
                </TableCell>
                <TableCell padding="none" sx={{ minWidth: 95 }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={row.type}
                      onChange={(e) =>
                        updateRow(index, "type", e.target.value as TransactionType)
                      }
                      sx={{ fontSize: 13, py: 0.25 }}
                    >
                      <MenuItem value="expense">Despesa</MenuItem>
                      <MenuItem value="income">Receita</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell padding="none" sx={{ minWidth: 110 }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={row.category}
                      onChange={(e) => updateRow(index, "category", e.target.value)}
                      sx={{ fontSize: 13, py: 0.25 }}
                    >
                      {(row.type === "income"
                        ? categories.income
                        : categories.expense
                      ).map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell padding="none" sx={{ minWidth: 100 }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={row.paymentMethod}
                      onChange={(e) =>
                        updateRow(index, "paymentMethod", e.target.value)
                      }
                      sx={{ fontSize: 13, py: 0.25 }}
                    >
                      {paymentMethods.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell padding="none" sx={{ minWidth: 125 }}>
                  <TextField
                    size="small"
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(index, "date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiInput-root": { fontSize: 13 } }}
                  />
                </TableCell>
                <TableCell padding="none" align="center" sx={{ minWidth: 56 }}>
                  <Tooltip
                    title={
                      row.confidence !== undefined
                        ? `Confiança IA: ${Math.round(row.confidence * 100)}%`
                        : "Sem dado de confiança"
                    }
                  >
                    <span>
                      {row.confidence !== undefined &&
                      row.confidence < CONFIDENCE_LOW ? (
                        <Chip
                          size="small"
                          label={`${Math.round(row.confidence * 100)}%`}
                          color="warning"
                          sx={{ height: 22, fontSize: 10 }}
                        />
                      ) : row.confidence !== undefined ? (
                        <Chip
                          size="small"
                          label={`${Math.round(row.confidence * 100)}%`}
                          variant="outlined"
                          sx={{ height: 22, fontSize: 10 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          –
                        </Typography>
                      )}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell padding="none" align="right">
                  <IconButton
                    size="small"
                    onClick={() => removeRow(index)}
                    sx={{ color: "text.secondary" }}
                    aria-label="Remover linha"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {actionFooter}
    </MotionPaper>
  );
};

export default BatchTransactionTable;
