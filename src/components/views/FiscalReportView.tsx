import React, { useMemo, useRef } from "react";
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
  Chip,
  Divider,
  useTheme,
  alpha,
  Button,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
} from "@mui/icons-material";
import { Transaction } from "../../types";

interface FiscalReportViewProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const FiscalReportView: React.FC<FiscalReportViewProps> = ({ transactions }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const printRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(currentYear);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach((t) => {
      const y = parseInt(t.date.split("-")[0]);
      if (!isNaN(y) && y >= 2026) years.add(y);
    });
    years.add(Math.max(currentYear, 2026));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const filteredTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(String(selectedYear))),
    [transactions, selectedYear]
  );

  // Totais anuais
  const annualTotals = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // Por categoria — expense
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  // Por categoria — income
  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter((t) => t.type === "income").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  // Resumo mensal
  const monthlyData = useMemo(() => {
    const months = MONTHS.map((name, idx) => {
      const monthTxs = filteredTransactions.filter((t) => {
        const m = parseInt(t.date.split("-")[1]);
        return m === idx + 1;
      });
      const income = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return { name, income, expense, balance: income - expense };
    });
    return months;
  }, [filteredTransactions]);

  // Export CSV
  const exportCSV = () => {
    const headers = ["Mês", "Receitas", "Despesas", "Saldo"];
    const rows = monthlyData.map((m) =>
      [m.name, m.income.toFixed(2), m.expense.toFixed(2), m.balance.toFixed(2)].join(";")
    );
    const totalsRow = `Total Anual;${annualTotals.income.toFixed(2)};${annualTotals.expense.toFixed(2)};${annualTotals.balance.toFixed(2)}`;
    const csv = [headers.join(";"), ...rows, "", totalsRow].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-fiscal-${selectedYear}.csv`;
    link.click();
  };

  const exportPDF = () => {
    window.print();
  };

  const cardSx = {
    p: 2.5,
    borderRadius: "16px",
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: isDark ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.9),
    flex: 1,
    minWidth: 140,
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#fiscal-report-root) { display: none !important; }
          #fiscal-report-root { display: block !important; }
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
        }
      `}</style>

      <Box id="fiscal-report-root" ref={printRef} sx={{ display: "flex", flexDirection: "column", gap: 3, px: { xs: 0, md: "28px" }, pt: { xs: 0, md: "24px" }, pb: { xs: "140px", md: "60px" } }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", mb: "22px" }}>
          <Box>
            <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, letterSpacing: "-0.02em" }}>Fiscal Report</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>Annual summary of income, expenses and balance</Typography>
          </Box>
          <Stack direction="row" spacing={1} className="no-print" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Ano</InputLabel>
              <Select value={selectedYear} label="Ano" onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {availableYears.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportCSV}
              size="small"
              sx={{ borderRadius: "10px" }}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={exportPDF}
              size="small"
              sx={{ borderRadius: "10px" }}
            >
              PDF
            </Button>
          </Stack>
        </Box>

        {/* Summary cards */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Paper elevation={0} sx={{ ...cardSx, borderColor: alpha(theme.palette.success.main, 0.3) }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <IncomeIcon sx={{ fontSize: 18, color: "success.main" }} />
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">Receitas</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color="success.main">{formatCurrency(annualTotals.income)}</Typography>
            <Typography variant="caption" color="text.secondary">Total em {selectedYear}</Typography>
          </Paper>
          <Paper elevation={0} sx={{ ...cardSx, borderColor: alpha(theme.palette.error.main, 0.3) }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <ExpenseIcon sx={{ fontSize: 18, color: "error.main" }} />
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">Despesas</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color="error.main">{formatCurrency(annualTotals.expense)}</Typography>
            <Typography variant="caption" color="text.secondary">Total em {selectedYear}</Typography>
          </Paper>
          <Paper elevation={0} sx={{ ...cardSx, borderColor: alpha(annualTotals.balance >= 0 ? theme.palette.primary.main : theme.palette.warning.main, 0.3) }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <BalanceIcon sx={{ fontSize: 18, color: annualTotals.balance >= 0 ? "primary.main" : "warning.main" }} />
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">Saldo</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color={annualTotals.balance >= 0 ? "primary.main" : "warning.main"}>
              {formatCurrency(annualTotals.balance)}
            </Typography>
            <Typography variant="caption" color="text.secondary">Resultado {selectedYear}</Typography>
          </Paper>
        </Box>

        {/* Monthly breakdown */}
        <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ p: 2.5, pb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>Resumo Mensal</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" } }}>
                  <TableCell>Mês</TableCell>
                  <TableCell align="right" sx={{ color: `${theme.palette.success.main} !important` }}>Receitas</TableCell>
                  <TableCell align="right" sx={{ color: `${theme.palette.error.main} !important` }}>Despesas</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyData.map((m, idx) => (
                  <TableRow
                    key={idx}
                    sx={{ "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) }, opacity: m.income === 0 && m.expense === 0 ? 0.4 : 1 }}
                  >
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{m.name}</TableCell>
                    <TableCell align="right" sx={{ color: "success.main", fontFamily: "monospace", fontSize: 13 }}>
                      {m.income > 0 ? formatCurrency(m.income) : "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "error.main", fontFamily: "monospace", fontSize: 13 }}>
                      {m.expense > 0 ? formatCurrency(m.expense) : "—"}
                    </TableCell>
                    <TableCell align="right" sx={{
                      color: m.balance > 0 ? "success.main" : m.balance < 0 ? "error.main" : "text.secondary",
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: 13,
                    }}>
                      {m.income === 0 && m.expense === 0 ? "—" : formatCurrency(m.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), "& td": { fontWeight: 700 } }}>
                  <TableCell>Total</TableCell>
                  <TableCell align="right" sx={{ color: "success.main", fontFamily: "monospace" }}>{formatCurrency(annualTotals.income)}</TableCell>
                  <TableCell align="right" sx={{ color: "error.main", fontFamily: "monospace" }}>{formatCurrency(annualTotals.expense)}</TableCell>
                  <TableCell align="right" sx={{ color: annualTotals.balance >= 0 ? "success.main" : "error.main", fontFamily: "monospace" }}>
                    {formatCurrency(annualTotals.balance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Breakdown by category */}
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {/* Expenses */}
          <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, flex: 1, minWidth: 260 }}>
            <Box sx={{ p: 2.5, pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <ExpenseIcon sx={{ fontSize: 18, color: "error.main" }} />
              <Typography variant="subtitle2" fontWeight={700}>Despesas por Categoria</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" } }}>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseByCategory.map(([cat, amount]) => (
                    <TableRow key={cat} sx={{ "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) } }}>
                      <TableCell sx={{ fontSize: 13 }}>
                        <Chip label={cat} size="small" sx={{ height: 20, fontSize: 10, borderRadius: "6px" }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: 13, color: "error.main" }}>
                        {formatCurrency(amount)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, color: "text.secondary" }}>
                        {annualTotals.expense > 0 ? ((amount / annualTotals.expense) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Income */}
          <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, flex: 1, minWidth: 260 }}>
            <Box sx={{ p: 2.5, pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <IncomeIcon sx={{ fontSize: 18, color: "success.main" }} />
              <Typography variant="subtitle2" fontWeight={700}>Receitas por Categoria</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" } }}>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeByCategory.map(([cat, amount]) => (
                    <TableRow key={cat} sx={{ "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) } }}>
                      <TableCell sx={{ fontSize: 13 }}>
                        <Chip label={cat} size="small" sx={{ height: 20, fontSize: 10, borderRadius: "6px" }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: 13, color: "success.main" }}>
                        {formatCurrency(amount)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, color: "text.secondary" }}>
                        {annualTotals.income > 0 ? ((amount / annualTotals.income) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default FiscalReportView;
