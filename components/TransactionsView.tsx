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
  Card,
  CardContent,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as FileTextIcon,
  TableChart as FileSpreadsheetIcon,
  MoreVert as MoreVertIcon,
  UnfoldMore as UnsortedIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Group as GroupIcon,
  CheckCircleOutline as PaidIcon,
  AccessTime as PendingIcon,
} from "@mui/icons-material";
import TransactionTags from "./TransactionTags";
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
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<"all" | "paid" | "pending">("all");
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

        // Verifica se esta data está no excluded_dates da transação original
        const excludedDates = t.excludedDates || [];
        if (excludedDates.includes(virtualDate)) {
          return; // Não gera a transação virtual para esta data
        }

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
    if (filterPaymentStatus !== "all") count++;
    return count;
  }, [filterType, filterCategory, filterShared, filterPaymentStatus]);

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
      const matchesPaymentStatus =
        filterPaymentStatus === "all" ||
        (filterPaymentStatus === "paid" && t.isPaid !== false) ||
        (filterPaymentStatus === "pending" && t.isPaid === false);
      return matchesSearch && matchesType && matchesCategory && matchesShared && matchesPaymentStatus;
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
    filterPaymentStatus,
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
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: isMobile ? 2 : 3,
        // Extra padding para FABs + bottom navigation (64px + safe area + FAB height + margem)
        pb: { xs: "180px", md: 0 },
      }}
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

      {/* Summary Cards - Modern Compact Style */}
      <Grid container spacing={isMobile ? 1.5 : 2}>
        {/* Balance Card */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: isDarkMode
                ? `0 6px 24px -6px ${alpha(balance >= 0 ? "#059669" : "#DC2626", 0.2)}`
                : `0 6px 24px -6px ${alpha(balance >= 0 ? "#059669" : "#DC2626", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: isDarkMode
                  ? `0 10px 32px -6px ${alpha(balance >= 0 ? "#059669" : "#DC2626", 0.3)}`
                  : `0 10px 32px -6px ${alpha(balance >= 0 ? "#059669" : "#DC2626", 0.25)}`,
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: balance >= 0
                  ? isDarkMode
                    ? "linear-gradient(135deg, rgba(5, 150, 105, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)"
                    : "linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)"
                  : isDarkMode
                    ? "linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%)"
                    : "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
                pointerEvents: "none",
                zIndex: 0,
              },
            }}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.5 : 2,
                "&:last-child": { pb: isMobile ? 1.5 : 2 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: "0.08em",
                      fontSize: isMobile ? 9 : 10,
                      fontWeight: 600,
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    Current Balance
                  </Typography>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {formatCurrency(balance)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: isMobile ? 36 : 42,
                    height: isMobile ? 36 : 42,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${alpha(balance >= 0 ? "#059669" : "#DC2626", 0.2)} 0%, ${alpha(balance >= 0 ? "#059669" : "#DC2626", 0.1)} 100%)`
                      : `linear-gradient(135deg, ${balance >= 0 ? "#D1FAE5" : "#FEE2E2"} 0%, ${alpha(balance >= 0 ? "#D1FAE5" : "#FEE2E2", 0.6)} 100%)`,
                    border: `1px solid ${isDarkMode ? alpha(balance >= 0 ? "#059669" : "#DC2626", 0.2) : alpha(balance >= 0 ? "#059669" : "#DC2626", 0.15)}`,
                    boxShadow: isDarkMode
                      ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}`
                      : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}`,
                  }}
                >
                  <WalletIcon
                    sx={{
                      fontSize: isMobile ? 18 : 22,
                      color: balance >= 0 ? "#059669" : "#DC2626",
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Income Card */}
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: isDarkMode
                ? `0 6px 24px -6px ${alpha("#059669", 0.2)}`
                : `0 6px 24px -6px ${alpha("#059669", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: isDarkMode
                  ? `0 10px 32px -6px ${alpha("#059669", 0.3)}`
                  : `0 10px 32px -6px ${alpha("#059669", 0.25)}`,
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%)"
                  : "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                pointerEvents: "none",
                zIndex: 0,
              },
            }}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.5 : 2,
                "&:last-child": { pb: isMobile ? 1.5 : 2 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: "0.08em",
                      fontSize: isMobile ? 9 : 10,
                      fontWeight: 600,
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    Income
                  </Typography>
                  <Typography
                    variant={isMobile ? "body1" : "h6"}
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totalIncome)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: isMobile ? 32 : 38,
                    height: isMobile ? 32 : 38,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${alpha("#059669", 0.2)} 0%, ${alpha("#059669", 0.1)} 100%)`
                      : `linear-gradient(135deg, #D1FAE5 0%, ${alpha("#D1FAE5", 0.6)} 100%)`,
                    border: `1px solid ${isDarkMode ? alpha("#059669", 0.2) : alpha("#059669", 0.15)}`,
                    boxShadow: isDarkMode
                      ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}`
                      : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}`,
                  }}
                >
                  <TrendingUpIcon
                    sx={{
                      fontSize: isMobile ? 16 : 20,
                      color: "#059669",
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Expense Card */}
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: isDarkMode
                ? `0 6px 24px -6px ${alpha("#DC2626", 0.2)}`
                : `0 6px 24px -6px ${alpha("#DC2626", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: isDarkMode
                  ? `0 10px 32px -6px ${alpha("#DC2626", 0.3)}`
                  : `0 10px 32px -6px ${alpha("#DC2626", 0.25)}`,
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.04) 100%)"
                  : "linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)",
                pointerEvents: "none",
                zIndex: 0,
              },
            }}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.5 : 2,
                "&:last-child": { pb: isMobile ? 1.5 : 2 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: "0.08em",
                      fontSize: isMobile ? 9 : 10,
                      fontWeight: 600,
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    Expenses
                  </Typography>
                  <Typography
                    variant={isMobile ? "body1" : "h6"}
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totalExpense)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: isMobile ? 32 : 38,
                    height: isMobile ? 32 : 38,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${alpha("#DC2626", 0.2)} 0%, ${alpha("#DC2626", 0.1)} 100%)`
                      : `linear-gradient(135deg, #FEE2E2 0%, ${alpha("#FEE2E2", 0.6)} 100%)`,
                    border: `1px solid ${isDarkMode ? alpha("#DC2626", 0.2) : alpha("#DC2626", 0.15)}`,
                    boxShadow: isDarkMode
                      ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}`
                      : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}`,
                  }}
                >
                  <TrendingDownIcon
                    sx={{
                      fontSize: isMobile ? 16 : 20,
                      color: "#DC2626",
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
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

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterPaymentStatus}
                label="Status"
                onChange={(e: SelectChangeEvent) =>
                  setFilterPaymentStatus(e.target.value as "all" | "paid" | "pending")
                }
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="paid">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PaidIcon fontSize="small" color="success" />
                    Paid
                  </Box>
                </MenuItem>
                <MenuItem value="pending">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PendingIcon fontSize="small" color="warning" />
                    Pending
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {activeFiltersCount > 0 && (
              <Button
                size="small"
                onClick={() => {
                  setFilterType("all");
                  setFilterCategory("all");
                  setFilterShared("all");
                  setFilterPaymentStatus("all");
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
                const accentColor = isIncome ? "#059669" : "#DC2626";
                return (
                  <Card
                    key={t.id}
                    elevation={0}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      p: 0,
                      opacity: t.isPaid !== false ? 0.6 : 1,
                      background: isDarkMode
                        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                        : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                      backdropFilter: "blur(12px)",
                      border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.05)}`,
                      borderLeft: `3px solid ${accentColor}`,
                      borderRadius: "14px",
                      boxShadow: isDarkMode
                        ? `0 4px 16px -4px ${alpha(accentColor, 0.15)}`
                        : `0 4px 16px -4px ${alpha(accentColor, 0.1)}`,
                      transition: "all 0.15s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: isDarkMode
                          ? `0 6px 20px -4px ${alpha(accentColor, 0.2)}`
                          : `0 6px 20px -4px ${alpha(accentColor, 0.15)}`,
                      },
                      ...(t.isVirtual && {
                        borderStyle: "dashed",
                        borderLeftStyle: "solid",
                      }),
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 1.5,
                        "&:last-child": { pb: 1.5 },
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
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
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: isDarkMode
                          ? `linear-gradient(135deg, ${alpha(accentColor, 0.2)} 0%, ${alpha(accentColor, 0.1)} 100%)`
                          : `linear-gradient(135deg, ${isIncome ? "#D1FAE5" : "#FEE2E2"} 0%, ${alpha(isIncome ? "#D1FAE5" : "#FEE2E2", 0.6)} 100%)`,
                        border: `1px solid ${isDarkMode ? alpha(accentColor, 0.2) : alpha(accentColor, 0.15)}`,
                        boxShadow: isDarkMode
                          ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}`
                          : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}`,
                      }}
                    >
                      {isIncome ? (
                        <ArrowUpIcon sx={{ fontSize: 16, color: accentColor }} />
                      ) : (
                        <ArrowDownIcon sx={{ fontSize: 16, color: accentColor }} />
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

                      {/* Tags - Componente padronizado em formato pílula */}
                      <TransactionTags transaction={t} />
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
                      sx={{
                        bgcolor: isDarkMode
                          ? alpha(theme.palette.action.hover, 0.3)
                          : alpha(theme.palette.action.hover, 0.5),
                        "&:hover": {
                          bgcolor: isDarkMode
                            ? alpha(theme.palette.action.hover, 0.5)
                            : alpha(theme.palette.action.hover, 0.8),
                        },
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Summary Footer */}
              <Card
                elevation={0}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                    : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                  borderRadius: "14px",
                  boxShadow: isDarkMode
                    ? `0 4px 16px -4px ${alpha(balance >= 0 ? "#059669" : "#DC2626", 0.2)}`
                    : `0 4px 16px -4px ${alpha(balance >= 0 ? "#059669" : "#DC2626", 0.15)}`,
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: balance >= 0
                      ? isDarkMode
                        ? "linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%)"
                        : "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)"
                      : isDarkMode
                        ? "linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.04) 100%)"
                        : "linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)",
                    pointerEvents: "none",
                    zIndex: 0,
                  },
                }}
              >
                <CardContent
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    p: 1.5,
                    "&:last-child": { pb: 1.5 },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ color: "text.secondary" }}
                  >
                    Balance
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{
                      color: balance >= 0 ? "#059669" : "#DC2626",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatCurrency(balance)}
                  </Typography>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card
              elevation={0}
              sx={{
                position: "relative",
                overflow: "hidden",
                background: isDarkMode
                  ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                  : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                backdropFilter: "blur(12px)",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                borderRadius: "16px",
              }}
            >
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary" fontStyle="italic">
                  No transactions found.
                </Typography>
              </CardContent>
            </Card>
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
              // Posiciona acima da bottom navigation (64px) + safe area + margem
              bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
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
                          <Typography variant="body2" fontWeight={500}>
                            {t.description}
                          </Typography>
                          {/* Tags - Componente padronizado em formato pílula */}
                          <TransactionTags transaction={t} />
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
