import React, { useState, useMemo } from "react";
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
  useMediaQuery,
  useTheme,
  Fab,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Checkbox,
  Tooltip,
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
  MoreVert as MoreVertIcon,
  AutorenewOutlined as AutorenewIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";
import { MONTHS } from "../constants";
import DateFilter from "./DateFilter";

interface TransactionsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onNewTransaction,
  onEdit,
  onDelete,
  onTogglePaid,
  selectedMonth,
  selectedYear,
  onDateChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterShared, setFilterShared] = useState<"all" | "shared" | "not_shared">("all");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Extrai categorias únicas das transações
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions.forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  const filteredData = useMemo(() => {
    return transactions
      .filter((t) => {
        const [y, m] = t.date.split("-");
        const matchesDate =
          parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || t.type === filterType;
        const matchesCategory =
          filterCategory === "all" || t.category === filterCategory;
        const matchesShared =
          filterShared === "all" ||
          (filterShared === "shared" && t.isShared) ||
          (filterShared === "not_shared" && !t.isShared);
        return matchesDate && matchesSearch && matchesType && matchesCategory && matchesShared;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    selectedMonth,
    selectedYear,
    searchTerm,
    filterType,
    filterCategory,
    filterShared,
  ]);

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

  const formatDateShort = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}`;
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              All Transactions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {MONTHS[selectedMonth]} {selectedYear}
            </Typography>
          </Box>

          {/* Desktop New Transaction Button */}
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewTransaction}
            >
              New Transaction
            </Button>
          )}
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

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
        }}
      >
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
          sx={{ flex: 1, minWidth: 150 }}
        />

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            label="Type"
            onChange={(e: SelectChangeEvent) =>
              setFilterType(e.target.value as "all" | "income" | "expense")
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filterCategory}
            label="Category"
            onChange={(e: SelectChangeEvent) =>
              setFilterCategory(e.target.value)
            }
          >
            <MenuItem value="all">All</MenuItem>
            {availableCategories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Shared</InputLabel>
          <Select
            value={filterShared}
            label="Shared"
            onChange={(e: SelectChangeEvent) =>
              setFilterShared(e.target.value as "all" | "shared" | "not_shared")
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="shared">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <GroupIcon fontSize="small" color="info" />
                Shared
              </Box>
            </MenuItem>
            <MenuItem value="not_shared">Not Shared</MenuItem>
          </Select>
        </FormControl>

        <DateFilter
          month={selectedMonth}
          year={selectedYear}
          onDateChange={onDateChange}
          compact
        />

        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={isExporting || filteredData.length === 0}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          {isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
        </IconButton>

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
      </Paper>

      {/* Mobile Card View */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {filteredData.length > 0 ? (
            <>
              {filteredData.map((t) => {
                const isIncome = t.type === "income";
                return (
                  <Paper
                    key={t.id}
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      opacity: t.isPaid !== false ? 0.5 : 1,
                      bgcolor: t.isPaid === false ? "background.paper" : "action.hover",
                    }}
                  >
                    {/* Checkbox */}
                    {!t.isVirtual && (
                      <Checkbox
                        checked={t.isPaid !== false}
                        onChange={(e) => onTogglePaid(t.id, e.target.checked)}
                        size="small"
                        color="success"
                        sx={{ mt: -0.5, ml: -1 }}
                      />
                    )}
                    {/* Icon */}
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: isIncome ? "success.light" : "error.light",
                        color: isIncome ? "success.dark" : "error.dark",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isIncome ? (
                        <ArrowUpIcon fontSize="small" />
                      ) : (
                        <ArrowDownIcon fontSize="small" />
                      )}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.description}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={isIncome ? "success.main" : "error.main"}
                          sx={{ flexShrink: 0 }}
                        >
                          {isIncome ? "+" : "-"} {formatCurrency(t.amount)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {formatDateShort(t.date)}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.category}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.paymentMethod}
                        </Typography>
                      </Box>

                      {/* Tags */}
                      {(t.isRecurring ||
                        t.isVirtual ||
                        t.isShared ||
                        (t.installments && t.installments > 1)) && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            mt: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          {t.isShared && (
                            <Chip
                              icon={<GroupIcon sx={{ fontSize: 12 }} />}
                              label="50/50"
                              size="small"
                              color="info"
                              variant="filled"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                "& .MuiChip-icon": { ml: 0.5 },
                              }}
                            />
                          )}
                          {t.isRecurring && (
                            <Chip
                              icon={<RepeatIcon sx={{ fontSize: 12 }} />}
                              label={
                                t.frequency === "monthly" ? "Mensal" : "Anual"
                              }
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                "& .MuiChip-icon": { ml: 0.5 },
                              }}
                            />
                          )}
                          {t.isVirtual && (
                            <Chip
                              icon={<AutorenewIcon sx={{ fontSize: 12 }} />}
                              label="Auto"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                "& .MuiChip-icon": { ml: 0.5 },
                              }}
                            />
                          )}
                          {t.installments && t.installments > 1 && (
                            <Chip
                              icon={<CreditCardIcon sx={{ fontSize: 12 }} />}
                              label={`${t.currentInstallment || 1}/${
                                t.installments
                              }x`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                "& .MuiChip-icon": { ml: 0.5 },
                              }}
                            />
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Actions */}
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        setMobileActionAnchor({
                          element: e.currentTarget,
                          transaction: t,
                        })
                      }
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                );
              })}

              {/* Summary Footer */}
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "action.hover",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Balance
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  color={balance >= 0 ? "success.main" : "error.main"}
                >
                  {formatCurrency(balance)}
                </Typography>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary" fontStyle="italic">
                No transactions found.
              </Typography>
            </Paper>
          )}

          {/* Mobile Action Menu */}
          <Menu
            anchorEl={mobileActionAnchor.element}
            open={Boolean(mobileActionAnchor.element)}
            onClose={() =>
              setMobileActionAnchor({ element: null, transaction: null })
            }
          >
            {mobileActionAnchor.transaction?.isVirtual ? (
              <MenuItem disabled>
                <ListItemIcon>
                  <AutorenewIcon fontSize="small" color="disabled" />
                </ListItemIcon>
                <ListItemText
                  primary="Auto-generated"
                  secondary="Edit the original transaction"
                />
              </MenuItem>
            ) : (
              <>
                <MenuItem
                  onClick={() => {
                    if (mobileActionAnchor.transaction) {
                      onEdit(mobileActionAnchor.transaction);
                    }
                    setMobileActionAnchor({ element: null, transaction: null });
                  }}
                >
                  <ListItemIcon>
                    <EditIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (mobileActionAnchor.transaction) {
                      onDelete(mobileActionAnchor.transaction.id);
                    }
                    setMobileActionAnchor({ element: null, transaction: null });
                  }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </>
            )}
          </Menu>

          {/* Mobile FAB */}
          <Fab
            color="primary"
            onClick={onNewTransaction}
            sx={{
              position: "fixed",
              bottom: 80,
              right: 16,
              zIndex: 1100,
            }}
          >
            <AddIcon />
          </Fab>
        </Box>
      ) : (
        /* Desktop Table View */
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell
                  sx={{ fontWeight: 600, width: 50, textAlign: "center" }}
                >
                  Paid
                </TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>
                  Method
                </TableCell>
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
                      bgcolor: t.isPaid !== false 
                        ? "action.disabledBackground" 
                        : (index % 2 === 0 ? "transparent" : "action.hover"),
                      opacity: t.isPaid !== false ? 0.6 : 1,
                      "& td": {
                        textDecoration: t.isPaid !== false ? "line-through" : "none",
                        textDecorationColor: "text.disabled",
                      },
                    }}
                  >
                    <TableCell sx={{ textAlign: "center" }}>
                      {!t.isVirtual && (
                        <Tooltip
                          title={t.isPaid !== false ? "Paid" : "Not paid"}
                        >
                          <Checkbox
                            checked={t.isPaid !== false}
                            onChange={(e) =>
                              onTogglePaid(t.id, e.target.checked)
                            }
                            size="small"
                            color="success"
                          />
                        </Tooltip>
                      )}
                    </TableCell>
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
                          {t.isVirtual && (
                            <Chip
                              icon={<AutorenewIcon />}
                              label="Auto"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{
                                height: 18,
                                fontSize: 10,
                              }}
                            />
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
                        {t.isShared && (
                          <Chip
                            icon={<GroupIcon />}
                            label="50/50"
                            size="small"
                            color="info"
                            variant="filled"
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
                      <Chip
                        label={t.category}
                        size="small"
                        variant="outlined"
                      />
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
                      {t.isVirtual ? (
                        <Chip
                          label="Auto-generated"
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontSize: 10 }}
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}>
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
                    colSpan={6}
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
      )}
    </Box>
  );
};

export default TransactionsView;
