import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Tooltip,
  Button,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import NixButton from "../radix/Button";
import { parseImportFile, ParsedTransactionRow } from "../../services/importService";
import { useNotification } from "../../contexts";
import { Transaction } from "../../types";

const MotionBox = motion.create(Box);

interface ImportViewProps {
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  onImport: (transactions: Omit<Transaction, "id" | "createdAt">[]) => Promise<void>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const ImportView: React.FC<ImportViewProps> = ({
  categories,
  paymentMethods,
  onImport,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { showSuccess, showError } = useNotification();

  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedTransactionRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0] || "");
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setParseError(null);
    setParsedRows([]);
    setSelectedRows(new Set());

    const text = await file.text();
    try {
      const rows = parseImportFile(text, file.name);
      if (rows.length === 0) {
        setParseError("Nenhuma transação encontrada. Verifique o formato do arquivo.");
        return;
      }
      setFileName(file.name);
      setParsedRows(rows);
      setSelectedRows(new Set(rows.map((_, i) => i)));
    } catch (err) {
      setParseError("Erro ao processar o arquivo. Verifique o formato.");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === parsedRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(parsedRows.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const toImport = parsedRows.filter((_, i) => selectedRows.has(i));
    if (toImport.length === 0) return;

    setIsImporting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const transactions = toImport.map((row) => ({
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.type === "income" ? (categories.income[0] || "Outros") : (categories.expense[0] || "Outros"),
        paymentMethod: selectedPaymentMethod,
        date: row.date || today,
        isRecurring: false,
        isPaid: true,
      }));
      await onImport(transactions);
      showSuccess(`${toImport.length} transaç${toImport.length === 1 ? "ão importada" : "ões importadas"} com sucesso!`);
      setParsedRows([]);
      setSelectedRows(new Set());
      setFileName("");
    } catch (err) {
      showError("Erro ao importar transações.");
    } finally {
      setIsImporting(false);
    }
  };

  const totalSelected = parsedRows.filter((_, i) => selectedRows.has(i));
  const totalAmount = totalSelected.reduce((sum, r) => sum + (r.type === "expense" ? -r.amount : r.amount), 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: { xs: "140px", md: 0 } }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight="bold">Importar Transações</Typography>
        <Typography variant="body2" color="text.secondary">
          Importe transações a partir de arquivos CSV ou OFX do seu banco
        </Typography>
      </Box>

      {/* Drop Zone */}
      <AnimatePresence>
        {parsedRows.length === 0 && (
          <MotionBox
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <Paper
              elevation={0}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                borderRadius: "20px",
                border: `2px dashed ${isDragging ? theme.palette.primary.main : isDark ? alpha("#FFFFFF", 0.15) : alpha("#000000", 0.12)}`,
                p: { xs: 4, sm: 6 },
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                bgcolor: isDragging
                  ? alpha(theme.palette.primary.main, 0.05)
                  : isDark ? alpha("#FFFFFF", 0.02) : alpha("#FAFAFA", 0.8),
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <UploadIcon sx={{ fontSize: 56, color: isDragging ? "primary.main" : "text.disabled", mb: 1.5 }} />
              <Typography variant="h6" fontWeight={600} color={isDragging ? "primary.main" : "text.primary"}>
                {isDragging ? "Solte o arquivo aqui" : "Arraste seu arquivo aqui"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                ou clique para selecionar — CSV, OFX, QFX
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.ofx,.qfx"
                style={{ display: "none" }}
                onChange={handleInputChange}
              />
            </Paper>
            {parseError && (
              <Alert severity="error" sx={{ mt: 1.5, borderRadius: "12px" }}>{parseError}</Alert>
            )}
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* File info + actions */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FileIcon sx={{ color: "primary.main", fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>{fileName}</Typography>
              <Chip label={`${parsedRows.length} transações`} size="small" sx={{ height: 20, fontSize: 10 }} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Forma de pagamento</InputLabel>
                <Select
                  value={selectedPaymentMethod}
                  label="Forma de pagamento"
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                >
                  {paymentMethods.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => { setParsedRows([]); setFileName(""); setSelectedRows(new Set()); }}
                color="inherit"
                sx={{ borderRadius: "8px" }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>

          {/* Summary strip */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary">
              {selectedRows.size} de {parsedRows.length} selecionadas
            </Typography>
            <Typography variant="caption" sx={{ color: totalAmount >= 0 ? theme.palette.success.main : theme.palette.error.main, fontWeight: 600 }}>
              Total: {totalAmount >= 0 ? "+" : ""}{formatCurrency(totalAmount)}
            </Typography>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" } }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.size === parsedRows.length}
                      indeterminate={selectedRows.size > 0 && selectedRows.size < parsedRows.length}
                      onChange={toggleAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Tipo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedRows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    selected={selectedRows.has(idx)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      opacity: selectedRows.has(idx) ? 1 : 0.5,
                    }}
                    onClick={() => toggleRow(idx)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedRows.has(idx)} size="small" onChange={() => toggleRow(idx)} onClick={(e) => e.stopPropagation()} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: "monospace", color: "text.secondary" }}>
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 13, color: row.type === "income" ? theme.palette.success.main : theme.palette.error.main }}>
                      {row.type === "income" ? "+" : "-"}{formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.type === "income" ? "Receita" : "Despesa"}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 9,
                          bgcolor: alpha(row.type === "income" ? "#059669" : "#DC2626", 0.1),
                          color: row.type === "income" ? "#059669" : "#DC2626",
                          border: "none",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <NixButton
              size="medium"
              variant="solid"
              color="purple"
              onClick={handleImport}
              disabled={selectedRows.size === 0 || isImporting}
            >
              {isImporting ? <CircularProgress size={16} sx={{ color: "white" }} /> : <CheckIcon />}
              {isImporting ? "Importando..." : `Importar ${selectedRows.size} transaç${selectedRows.size === 1 ? "ão" : "ões"}`}
            </NixButton>
          </Box>
        </MotionBox>
      )}
    </Box>
  );
};

export default ImportView;
