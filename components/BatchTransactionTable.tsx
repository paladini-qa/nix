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
  Tooltip,
} from "@mui/material";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  WarningAmber as WarningIcon,
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

  // Mês/ano da fatura para todo o lote (opcional). Default: mês da 1ª transação ou atual.
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
        // not editable via form
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
        maxHeight: isMobile ? "70vh" : "65vh",
      }}
    >
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
          Cadastro em lote – {rows.length} transação(ões)
        </Typography>
        <Chip
          size="small"
          label="Edite e confirme para salvar todas"
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

      {/* Mês/ano da fatura: aplica a todas as linhas ao confirmar (dashboard/relatórios usam essa data) */}
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: "12px",
          bgcolor: alpha(NIX_BRAND.purple, 0.06),
          border: `1px solid ${alpha(NIX_BRAND.purple, 0.15)}`,
        }}
      >
        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
          Vencimento da fatura (opcional)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Marque e escolha mês/ano para que todas as transações entrem na fatura correta
          (cartão com dia de vencimento usa esse dia no mês escolhido; demais usam dia 1).
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={useBatchInvoice ? 1 : 0}
              onChange={(e) => setUseBatchInvoice(Number(e.target.value) === 1)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value={0}>Não definir</MenuItem>
              <MenuItem value={1}>Definir mês/ano</MenuItem>
            </Select>
          </FormControl>
          {useBatchInvoice && (
            <>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={batchInvoiceMonth}
                  onChange={(e) => setBatchInvoiceMonth(Number(e.target.value))}
                  sx={{ fontSize: 13 }}
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
                  sx={{ fontSize: 13 }}
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

      <TableContainer sx={{ overflowX: "auto", mb: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {isMobile && (
                <TableCell sx={{ fontWeight: 700, fontSize: 11, width: 40 }}>
                  {""}
                </TableCell>
              )}
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Descrição</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Valor</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Categoria</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Pagamento</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Data</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }} align="center">
                IA
              </TableCell>
              {!isMobile && (
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }} align="right">
                  Ação
                </TableCell>
              )}
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
                {isMobile && (
                  <TableCell padding="none" sx={{ verticalAlign: "middle" }}>
                    <IconButton
                      size="small"
                      onClick={() => removeRow(index)}
                      sx={{ color: "text.secondary" }}
                      aria-label="Remover linha"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
                <TableCell padding="none" sx={{ minWidth: 120 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TextField
                      size="small"
                      value={row.description}
                      onChange={(e) =>
                        updateRow(index, "description", e.target.value)
                      }
                      placeholder="Descrição"
                      fullWidth
                      sx={{ "& .MuiInput-root": { fontSize: 13 } }}
                    />
                  </Box>
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
                      onChange={(e) =>
                        updateRow(index, "category", e.target.value)
                      }
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
                {!isMobile && (
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
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", gap: 1.5 }}>
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
          disabled={
            validRows.length === 0 ||
            hasInvalidAmount
          }
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
    </MotionPaper>
  );
};

export default BatchTransactionTable;
