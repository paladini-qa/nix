import React, { useState, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as FileTextIcon,
  TableChart as FileSpreadsheetIcon,
  ExpandMore as ChevronDownIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";
import { MONTHS } from "../constants";
import DateFilter from "./DateFilter";

interface TransactionsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onNewTransaction,
  onEdit,
  onDelete,
  selectedMonth,
  selectedYear,
  onDateChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredData = useMemo(() => {
    return transactions
      .filter((t) => {
        const [y, m] = t.date.split("-");
        const matchesDate =
          parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDate && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, selectedYear, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const totalIncome = filteredData
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredData
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const getFileName = () => {
    return `nix-transactions-${MONTHS[selectedMonth]}-${selectedYear}`;
  };

  const escapeCSVField = (field: string | number): string => {
    const str = String(field);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const headers = [
      "Date",
      "Description",
      "Category",
      "Payment Method",
      "Type",
      "Amount",
    ];
    const rows = filteredData.map((t) => [
      escapeCSVField(t.date),
      escapeCSVField(t.description),
      escapeCSVField(t.category),
      escapeCSVField(t.paymentMethod),
      escapeCSVField(t.type === "income" ? "Income" : "Expense"),
      escapeCSVField(t.type === "expense" ? -t.amount : t.amount),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${getFileName()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setAnchorEl(null);
  };

  const exportToXLSX = async () => {
    if (filteredData.length === 0) {
      alert("No transactions to export.");
      return;
    }

    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");

      const data = filteredData.map((t) => ({
        Date: t.date,
        Description: t.description,
        Category: t.category,
        "Payment Method": t.paymentMethod,
        Type: t.type === "income" ? "Income" : "Expense",
        Amount: t.type === "expense" ? -t.amount : t.amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      worksheet["!cols"] = [
        { wch: 12 },
        { wch: 40 },
        { wch: 15 },
        { wch: 18 },
        { wch: 10 },
        { wch: 15 },
      ];

      XLSX.writeFile(workbook, `${getFileName()}.xlsx`);
    } catch (error) {
      console.error("Error exporting to XLSX:", error);
      alert("Error exporting to XLSX. Please try again.");
    } finally {
      setIsExporting(false);
      setAnchorEl(null);
    }
  };

  const exportToPDF = async () => {
    if (filteredData.length === 0) {
      alert("No transactions to export.");
      return;
    }

    setIsExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.text("Nix - Financial Report", 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Period: ${MONTHS[selectedMonth]} ${selectedYear}`, 14, 32);

      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`Income: ${formatCurrency(totalIncome)}`, 14, 42);
      doc.setTextColor(236, 72, 153);
      doc.text(`Expenses: ${formatCurrency(totalExpense)}`, 70, 42);
      doc.setTextColor(
        balance >= 0 ? 16 : 239,
        balance >= 0 ? 185 : 68,
        balance >= 0 ? 129 : 68
      );
      doc.text(`Balance: ${formatCurrency(balance)}`, 140, 42);

      const tableData = filteredData.map((t) => [
        formatDate(t.date),
        t.description.substring(0, 35) +
          (t.description.length > 35 ? "..." : ""),
        t.category,
        t.paymentMethod,
        t.type === "income" ? "Income" : "Expense",
        (t.type === "expense" ? "- " : "+ ") + formatCurrency(t.amount),
      ]);

      (doc as any).autoTable({
        startY: 50,
        head: [["Date", "Description", "Category", "Method", "Type", "Amount"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 50 },
          2: { cellWidth: 28 },
          3: { cellWidth: 30 },
          4: { cellWidth: 18 },
          5: { cellWidth: 28, halign: "right" },
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated by Nix - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      doc.save(`${getFileName()}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Error exporting to PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setAnchorEl(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", xl: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", xl: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            All Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Transactions for {MONTHS[selectedMonth]} {selectedYear}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
          >
            New Transaction
          </Button>

          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", sm: 180 } }}
          />

          <DateFilter
            month={selectedMonth}
            year={selectedYear}
            onDateChange={onDateChange}
            compact
          />

          <Button
            variant="outlined"
            endIcon={
              isExporting ? <CircularProgress size={16} /> : <ChevronDownIcon />
            }
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={isExporting || filteredData.length === 0}
          >
            <DownloadIcon />
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={exportToCSV}>
              <ListItemIcon>
                <FileTextIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Export as CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={exportToXLSX}>
              <ListItemIcon>
                <FileSpreadsheetIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Export as XLSX</ListItemText>
            </MenuItem>
            <MenuItem onClick={exportToPDF}>
              <ListItemIcon>
                <FileTextIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Export as PDF</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: balance >= 0 ? "success.50" : "error.50",
              border: 1,
              borderColor: balance >= 0 ? "success.light" : "error.light",
            }}
          >
            <Typography
              variant="overline"
              color={balance >= 0 ? "success.main" : "error.main"}
            >
              Current Balance
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              color={balance >= 0 ? "success.dark" : "error.dark"}
            >
              {formatCurrency(balance)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "success.50",
              border: 1,
              borderColor: "success.light",
            }}
          >
            <Typography variant="overline" color="success.main">
              Income
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.dark">
              {formatCurrency(totalIncome)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "error.50",
              border: 1,
              borderColor: "error.light",
            }}
          >
            <Typography variant="overline" color="error.main">
              Expenses
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="error.dark">
              {formatCurrency(totalExpense)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140 }}>
                Category
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140 }}>Method</TableCell>
              <TableCell
                sx={{ fontWeight: 600, width: 80, textAlign: "center" }}
              >
                Type
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, width: 130, textAlign: "right" }}
              >
                Amount
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, width: 100, textAlign: "center" }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((t, index) => (
                <TableRow
                  key={t.id}
                  hover
                  sx={{
                    bgcolor: index % 2 === 0 ? "transparent" : "action.hover",
                  }}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {formatDate(t.date)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {t.description}
                        </Typography>
                        {t.isRecurring && (
                          <RepeatIcon fontSize="small" color="primary" />
                        )}
                      </Box>
                      {t.installments && t.installments > 1 && (
                        <Chip
                          icon={<CreditCardIcon />}
                          label={`${t.currentInstallment || 1}/${
                            t.installments
                          }x`}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{
                            height: 18,
                            fontSize: 10,
                            mt: 0.5,
                            width: "fit-content",
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={t.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {t.paymentMethod}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {t.type === "income" ? (
                      <ArrowUpIcon fontSize="small" color="success" />
                    ) : (
                      <ArrowDownIcon fontSize="small" color="error" />
                    )}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color:
                        t.type === "income" ? "success.main" : "error.main",
                    }}
                  >
                    {t.type === "expense" && "- "}
                    {formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => onEdit(t)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(t.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}>
                  <Typography color="text.secondary" fontStyle="italic">
                    No transactions found with the current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {filteredData.length > 0 && (
            <TableFooter>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell
                  colSpan={5}
                  sx={{ textAlign: "right", fontWeight: 600 }}
                >
                  Filtered Total:
                </TableCell>
                <TableCell
                  sx={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(
                    filteredData.reduce(
                      (acc, curr) =>
                        curr.type === "income"
                          ? acc + curr.amount
                          : acc - curr.amount,
                      0
                    )
                  )}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TransactionsView;
