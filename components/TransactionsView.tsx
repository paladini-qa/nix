import React, { useState, useMemo, useCallback } from "react";
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
  TableSortLabel,
  TablePagination,
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
  alpha,
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
  MoreVert as MoreVertIcon,
  AutorenewOutlined as AutorenewIcon,
  Group as GroupIcon,
  UnfoldMore as UnsortedIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";
import { MONTHS } from "../constants";
import DateFilter from "./DateFilter";
import { useNotification } from "../contexts";

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

type SortDirection = "asc" | "desc";
type SortColumn = "date" | "description" | "category" | "paymentMethod" | "type" | "amount";

interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
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
  const isDarkMode = theme.palette.mode === "dark";
  const { showWarning, showError } = useNotification();

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterShared, setFilterShared] = useState<"all" | "shared" | "not_shared">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Estado de ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "date",
    direction: "desc",
  });

  // Estado de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Menus
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Gera transações recorrentes virtuais para o mês/ano selecionado
  // Apenas para transações recorrentes SEM parcelas (parceladas já existem no banco)
  const generateRecurringTransactions = useMemo(() => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = selectedMonth + 1;
    const targetYear = selectedYear;

    transactions.forEach((t) => {
      // Ignora se não é recorrente, não tem frequência, ou é parcelada
      if (!t.isRecurring || !t.frequency) return;
      if (t.installments && t.installments > 1) return; // Parceladas não geram virtuais

      const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
      const targetDate = new Date(targetYear, targetMonth - 1, 1);

      // Não gera virtuais para datas anteriores à original
      if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

      // Não duplica no mês original
      const isOriginalMonth = origYear === targetYear && origMonth === targetMonth;
      if (isOriginalMonth) return;

      let shouldAppear = false;

      if (t.frequency === "monthly") {
        shouldAppear = true;
      } else if (t.frequency === "yearly") {
        shouldAppear = origMonth === targetMonth && targetYear > origYear;
      }

      if (shouldAppear) {
        const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
        const adjustedDay = Math.min(origDay, daysInTargetMonth);
        const virtualDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

        // Verifica se já existe uma transação materializada para esta data
        // (transação com mesma descrição, categoria, valor e data, mas não recorrente)
        const hasMaterialized = transactions.some((mt) => {
          if (mt.isRecurring || mt.isVirtual) return false;
          if (mt.id === t.id) return false;
          
          const sameDescription = mt.description === t.description;
          const sameCategory = mt.category === t.category;
          const sameAmount = mt.amount === t.amount;
          const sameDate = mt.date === virtualDate;
          const sameType = mt.type === t.type;
          
          return sameDescription && sameCategory && sameAmount && sameDate && sameType;
        });

        // Se já existe materializada, não gera a virtual
        if (hasMaterialized) return;

        virtualTransactions.push({
          ...t,
          id: `${t.id}_recurring_${targetYear}-${String(targetMonth).padStart(2, "0")}`,
          date: virtualDate,
          isVirtual: true,
          originalTransactionId: t.id,
          isPaid: false, // Transações virtuais sempre começam como não pagas
        });
      }
    });

    return virtualTransactions;
  }, [transactions, selectedMonth, selectedYear]);

  // Combina transações reais + virtuais
  const allTransactions = useMemo(() => {
    const currentMonthTransactions = transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      return parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
    });

    return [...currentMonthTransactions, ...generateRecurringTransactions];
  }, [transactions, selectedMonth, selectedYear, generateRecurringTransactions]);

  // Extrai categorias únicas das transações
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allTransactions.forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }, [allTransactions]);

  // Conta filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterType !== "all") count++;
    if (filterCategory !== "all") count++;
    if (filterShared !== "all") count++;
    return count;
  }, [filterType, filterCategory, filterShared]);

  // Filtra e ordena dados
  const filteredData = useMemo(() => {
    let result = allTransactions.filter((t) => {
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
      return matchesSearch && matchesType && matchesCategory && matchesShared;
    });

    // Ordenação
    result = [...result].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortConfig.column) {
        case "date":
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case "description":
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case "category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case "paymentMethod":
          aValue = a.paymentMethod.toLowerCase();
          bValue = b.paymentMethod.toLowerCase();
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "amount":
          aValue = a.type === "expense" ? -a.amount : a.amount;
          bValue = b.type === "expense" ? -b.amount : b.amount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    allTransactions,
    searchTerm,
    filterType,
    filterCategory,
    filterShared,
    sortConfig,
  ]);

  // Dados paginados
  const paginatedData = useMemo(() => {
    if (isMobile) return filteredData;
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage, isMobile]);

  // Handler de ordenação
  const handleSort = useCallback((column: SortColumn) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

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
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = filteredData
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

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
      showWarning("No transactions to export.", "Export Failed");
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
      showWarning("No transactions to export.", "Export Failed");
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
      showError("Error exporting to XLSX. Please try again.", "Export Error");
    } finally {
      setIsExporting(false);
      setAnchorEl(null);
    }
  };

  const exportToPDF = async () => {
    if (filteredData.length === 0) {
      showWarning("No transactions to export.", "Export Failed");
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
        (t.type === "expense" ? "- " : "+ ") + formatCurrency(t.amount || 0),
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
      showError("Error exporting to PDF. Please try again.", "Export Error");
    } finally {
      setIsExporting(false);
      setAnchorEl(null);
    }
  };

  const formatDateShort = (dateString: string) => {
    const [, month, day] = dateString.split("-");
    return `${day}/${month}`;
  };

  // Header com estilo de ordenação
  const headerCellSx = {
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "text.secondary",
    py: 2,
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.default, 0.5)
      : alpha(theme.palette.grey[50], 0.95),
    borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.08)}`,
    whiteSpace: "nowrap" as const,
  };

  const renderSortableHeader = (column: SortColumn, label: string, width?: number | string) => (
    <TableCell sx={{ ...headerCellSx, width }}>
      <TableSortLabel
        active={sortConfig.column === column}
        direction={sortConfig.column === column ? sortConfig.direction : "asc"}
        onClick={() => handleSort(column)}
        IconComponent={sortConfig.column === column ? undefined : UnsortedIcon}
        sx={{
          "& .MuiTableSortLabel-icon": {
            opacity: sortConfig.column === column ? 1 : 0.4,
            color: sortConfig.column === column ? "primary.main" : "text.disabled",
          },
          "&:hover": {
            color: "primary.main",
            "& .MuiTableSortLabel-icon": { opacity: 1 },
          },
        }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  // Estilos de linha
  const getRowSx = (t: Transaction, index: number) => ({
    transition: "all 0.15s ease",
    opacity: t.isVirtual ? 0.75 : 1,
    bgcolor: t.isVirtual
      ? isDarkMode
        ? alpha(theme.palette.info.main, 0.08)
        : alpha(theme.palette.info.main, 0.05)
      : index % 2 === 0
        ? "transparent"
        : isDarkMode
          ? alpha(theme.palette.action.hover, 0.08)
          : alpha(theme.palette.action.hover, 0.06),
    "&:hover": {
      bgcolor: isDarkMode
        ? alpha(theme.palette.primary.main, 0.08)
        : alpha(theme.palette.primary.main, 0.04),
    },
    "& td": {
      borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.04) : alpha("#000000", 0.04)}`,
      py: 1.5,
    },
  });

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
              {MONTHS[selectedMonth]} {selectedYear} • {filteredData.length} transactions
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

      {/* Search & Filters Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          overflow: "hidden",
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha("#FFFFFF", 0.9),
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        }}
      >
        {/* Toolbar principal */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* Campo de busca */}
          <TextField
            size="small"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 200,
              maxWidth: 320,
              "& .MuiOutlinedInput-root": {
                borderRadius: "20px",
                bgcolor: isDarkMode
                  ? alpha(theme.palette.background.default, 0.4)
                  : alpha(theme.palette.grey[100], 0.6),
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />

          {/* Botão de filtros */}
          <Button
            variant={showFilters ? "contained" : "outlined"}
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<FilterIcon />}
            sx={{
              borderRadius: "20px",
              minWidth: 100,
              ...(activeFiltersCount > 0 && !showFilters && {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
              }),
            }}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                color="primary"
                sx={{ ml: 1, height: 20, fontSize: 11 }}
              />
            )}
          </Button>

          {/* Date Filter */}
          <DateFilter
            month={selectedMonth}
            year={selectedYear}
            onDateChange={onDateChange}
            compact
          />

          {/* Export Button */}
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={isExporting || filteredData.length === 0}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: "20px",
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
        </Box>

        {/* Área de filtros expandíveis */}
        {showFilters && (
          <Box
            sx={{
              p: 2,
              pt: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.default, 0.3)
                : alpha(theme.palette.grey[50], 0.5),
            }}
          >
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={(e: SelectChangeEvent) =>
                  setFilterType(e.target.value as "all" | "income" | "expense")
                }
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="income">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ArrowUpIcon fontSize="small" color="success" />
                    Income
                  </Box>
                </MenuItem>
                <MenuItem value="expense">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ArrowDownIcon fontSize="small" color="error" />
                    Expense
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e: SelectChangeEvent) =>
                  setFilterCategory(e.target.value)
                }
              >
                <MenuItem value="all">All Categories</MenuItem>
                {availableCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
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

            {activeFiltersCount > 0 && (
              <Button
                size="small"
                onClick={() => {
                  setFilterType("all");
                  setFilterCategory("all");
                  setFilterShared("all");
                }}
                sx={{ textTransform: "none" }}
              >
                Clear filters
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* Mobile Card View */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {paginatedData.length > 0 ? (
            <>
              {paginatedData.map((t) => {
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
                    <Tooltip title={t.isVirtual ? "Mark recurring occurrence as paid" : (t.isPaid !== false ? "Paid" : "Not paid")}>
                      <Checkbox
                        checked={t.isPaid !== false}
                        onChange={(e) => onTogglePaid(t.isVirtual && t.originalTransactionId ? t.originalTransactionId : t.id, e.target.checked)}
                        size="small"
                        color={t.isVirtual ? "info" : "success"}
                        sx={{ mt: -0.5, ml: -1 }}
                      />
                    </Tooltip>
                    {/* Icon */}
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: "20px",
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
                          {isIncome ? "+" : "-"} {formatCurrency(t.amount || 0)}
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
                        (t.isShared && t.sharedWith) ||
                        (t.type === "income" && t.relatedTransactionId) ||
                        (t.installments && t.installments > 1)) && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            mt: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          {t.isShared && t.sharedWith && (
                            <Chip
                              icon={<GroupIcon sx={{ fontSize: 12 }} />}
                              label={t.sharedWith}
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
                          {t.type === "income" && t.relatedTransactionId && (
                            <Chip
                              icon={<GroupIcon sx={{ fontSize: 12 }} />}
                              label="Shared"
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
              <ListItemText>
                {mobileActionAnchor.transaction?.isVirtual ? "Edit Recurring" : "Edit"}
              </ListItemText>
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
              <ListItemText>
                {mobileActionAnchor.transaction?.isVirtual ? "Delete Recurring" : "Delete"}
              </ListItemText>
            </MenuItem>
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
        <Paper
          elevation={0}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha("#FFFFFF", 0.9),
            backdropFilter: "blur(20px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ ...headerCellSx, width: 50, textAlign: "center" }}
                  >
                    Paid
                  </TableCell>
                  {renderSortableHeader("date", "Date", 100)}
                  {renderSortableHeader("description", "Description")}
                  {renderSortableHeader("category", "Category", 140)}
                  {renderSortableHeader("paymentMethod", "Method", 140)}
                  {renderSortableHeader("type", "Type", 80)}
                  {renderSortableHeader("amount", "Amount", 130)}
                  <TableCell
                    sx={{ ...headerCellSx, width: 100, textAlign: "center" }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((t, index) => (
                    <TableRow key={t.id} sx={getRowSx(t, index)}>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip
                          title={t.isVirtual ? "Mark recurring occurrence" : (t.isPaid !== false ? "Paid" : "Not paid")}
                        >
                          <Checkbox
                            checked={t.isPaid !== false}
                            onChange={(e) =>
                              onTogglePaid(t.id, e.target.checked)
                            }
                            size="small"
                            color={t.isVirtual ? "info" : "success"}
                          />
                        </Tooltip>
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
                          {t.isShared && t.sharedWith && (
                            <Chip
                              icon={<GroupIcon />}
                              label={t.sharedWith}
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
                          {t.type === "income" && t.relatedTransactionId && (
                            <Chip
                              icon={<GroupIcon />}
                              label="Shared"
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
                        {formatCurrency(t.amount || 0)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                          <Tooltip title={t.isVirtual ? "Edit recurring transaction" : "Edit"}>
                            <IconButton
                              size="small"
                              onClick={() => onEdit(t)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t.isVirtual ? "Delete recurring transaction" : "Delete"}>
                            <IconButton
                              size="small"
                              onClick={() => onDelete(t.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
                  <TableRow
                    sx={{
                      bgcolor: isDarkMode
                        ? alpha(theme.palette.background.default, 0.3)
                        : alpha(theme.palette.grey[50], 0.5),
                    }}
                  >
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
                        color: balance >= 0 ? "success.main" : "error.main",
                      }}
                    >
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>

          {/* Paginação */}
          {filteredData.length > 0 && (
            <TablePagination
              component="div"
              count={filteredData.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              sx={{
                borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
              }}
            />
          )}
        </Paper>
      )}
    </Box>
  );
};

export default TransactionsView;
