import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Checkbox,
  Tooltip,
  alpha,
  SwipeableDrawer,
  Divider,
  Stack,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as FileTextIcon,
  TableChart as FileSpreadsheetIcon,
  UnfoldMore as UnsortedIcon,
  FilterList as FilterIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Group as GroupIcon,
  CheckCircleOutline as PaidIcon,
  AccessTime as PendingIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import TransactionTags from "@/presentation/components/ui/TransactionTags";
import SearchBar from "@/presentation/components/ui/SearchBar";
import MobileTransactionRow from "@/presentation/components/ui/MobileTransactionRow";
import { Transaction, PaymentMethodConfig } from "@/domain/entities";
import { MONTHS, CREATE_TRANSACTION_BUTTON } from "@/shared/constants";
import { useNotification } from "@/presentation/contexts";
import { useCurrency, usePrivacyMode, useLayoutSpacing } from "@/presentation/hooks";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import EmptyState from "@/presentation/components/ui/EmptyState";
import NixButton from "@/presentation/components/radix/Button";
import { getEffectiveReportDate } from "@/domain/usecases/transactionUtils";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";

interface TransactionsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (idOrTx: string | Transaction) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void | Promise<void>;
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
  onRefreshData?: () => Promise<void>;
  paymentMethodConfigs?: PaymentMethodConfig[];
}

type SortDirection = "asc" | "desc";
type SortColumn =
  | "date"
  | "description"
  | "category"
  | "paymentMethod"
  | "type"
  | "amount";

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
  onRefreshData,
  paymentMethodConfigs = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { gridSpacing } = useLayoutSpacing();
  const { showWarning, showError } = useNotification();
  const { showTransactionsFilters, setTransactionsFiltersCount } = useAppStore();

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterShared, setFilterShared] = useState<
    "all" | "shared" | "not_shared"
  >("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<
    "all" | "paid" | "pending"
  >("all");
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const { formatWithSign } = useCurrency();
  const { formatPrivateValue } = usePrivacyMode();

  // Combina transações reais + virtuais, usando invoiceDueDate (ou data calculada
  // pelo config do método de pagamento) para determinar o mês de cada transação.
  const allTransactions = useMemo(() => {
    const currentMonthTransactions = transactions.filter((t) => {
      const [y, m] = getEffectiveReportDate(t, paymentMethodConfigs).split("-");
      const isCurrentMonth =
        parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;

      if (!isCurrentMonth) return false;

      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) {
        return false;
      }

      return true;
    });

    const virtualTransactions = generateRecurringTransactions(
      transactions,
      { month: selectedMonth, year: selectedYear },
      paymentMethodConfigs
    );

    return [...currentMonthTransactions, ...virtualTransactions];
  }, [transactions, selectedMonth, selectedYear, paymentMethodConfigs]);

  // Extrai categorias únicas das transações
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allTransactions.forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }, [allTransactions]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(selectedYear);
    transactions.forEach((t) => {
      const year = parseInt(t.date.split("-")[0]);
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, selectedYear]);

  // Conta filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterType !== "all") count++;
    if (filterCategory !== "all") count++;
    if (filterShared !== "all") count++;
    if (filterPaymentStatus !== "all") count++;
    return count;
  }, [filterType, filterCategory, filterShared, filterPaymentStatus]);

  useEffect(() => {
    setTransactionsFiltersCount(activeFiltersCount);
  }, [activeFiltersCount, setTransactionsFiltersCount]);

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
        (filterPaymentStatus === "paid" && t.isPaid === true) ||
        (filterPaymentStatus === "pending" && t.isPaid !== true);
      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesShared &&
        matchesPaymentStatus
      );
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

  const DESKTOP_ROW_HEIGHT = 34;
  const VIRTUALIZE_THRESHOLD = 40;
  const isDesktopVirtualized = !isMobile && paginatedData.length > VIRTUALIZE_THRESHOLD;
  const desktopTableParentRef = useRef<HTMLDivElement>(null);
  const desktopRowVirtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => desktopTableParentRef.current,
    estimateSize: () => DESKTOP_ROW_HEIGHT,
    overscan: 5,
    enabled: isDesktopVirtualized,
  });

  const mobileListParentRef = useRef<HTMLDivElement>(null);
  const CARD_ESTIMATE_HEIGHT = 61;
  const mobileListVirtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => mobileListParentRef.current,
    estimateSize: () => CARD_ESTIMATE_HEIGHT,
    measureElement: (el) => el?.getBoundingClientRect().height ?? CARD_ESTIMATE_HEIGHT,
    overscan: 3,
    enabled: isMobile && paginatedData.length > 30,
  });

  const desktopRows = desktopRowVirtualizer.getVirtualItems();
  const desktopTopSpace = desktopRows[0]?.start ?? 0;
  const desktopBottomSpace = Math.max(0, desktopRowVirtualizer.getTotalSize() - (desktopRows.at(-1)?.end ?? 0));

  // Handler de ordenação
  const handleSort = useCallback((column: SortColumn) => {
    setSortConfig((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Handler de refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshData, isRefreshing]);

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
          `Generated by Finance Control - Page ${i} of ${pageCount}`,
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

  const selectedTransaction = allTransactions.find((transaction) => transaction.id === detailId);
  const detailInvoiceDate = selectedTransaction && getEffectiveReportDate(selectedTransaction, paymentMethodConfigs);
  const mobileAmount = (transaction: Transaction) =>
    formatPrivateValue(formatWithSign(transaction.type === "income" ? transaction.amount : -transaction.amount));

  const handleDetailPaymentChange = async (transaction: Transaction, isPaid: boolean) => {
    setIsUpdatingPayment(true);
    try {
      await onTogglePaid(transaction.id, isPaid);
    } catch {
      showError("Unable to update the payment status. Please try again.");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const renderMobileRow = (transaction: Transaction, index: number) => (
    <MobileTransactionRow
      key={transaction.id}
      transaction={transaction}
      amount={mobileAmount(transaction)}
      onOpenDetails={setDetailId}
      isLast={index === paginatedData.length - 1}
    />
  );

  // Header com estilo de ordenação
  const headerCellSx = {
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "text.secondary",
    py: 0.75,
    px: 1,
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.default, 0.5)
      : alpha(theme.palette.grey[50], 0.95),
    borderBottom: `1px solid ${
      isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.08)
    }`,
    whiteSpace: "nowrap" as const,
  };

  const renderSortableHeader = (
    column: SortColumn,
    label: string,
    width?: number | string
  ) => (
    <TableCell sx={{ ...headerCellSx, width }}>
      <TableSortLabel
        active={sortConfig.column === column}
        direction={sortConfig.column === column ? sortConfig.direction : "asc"}
        onClick={() => handleSort(column)}
        IconComponent={sortConfig.column === column ? undefined : UnsortedIcon}
        sx={{
          "& .MuiTableSortLabel-icon": {
            opacity: sortConfig.column === column ? 1 : 0.4,
            color:
              sortConfig.column === column ? "primary.main" : "text.disabled",
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

  // Estilos de linha - transações recorrentes/auto usam apenas tags para identificação
  const getRowSx = (index: number) => ({
    transition: "all 0.15s ease",
    cursor: "pointer",
    bgcolor:
      index % 2 === 0
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
      borderBottom: `1px solid ${
        isDarkMode ? alpha("#FFFFFF", 0.04) : alpha("#000000", 0.04)
      }`,
      py: 0,
      px: 1,
      height: DESKTOP_ROW_HEIGHT,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  });

  const renderDesktopRow = (t: Transaction, index: number) => (
    <TableRow key={t.id} onClick={() => onEdit(t)} sx={getRowSx(index)}>
      <TableCell align="center" onClick={(event) => event.stopPropagation()}>
        <Tooltip title={t.isVirtual ? "Mark recurring occurrence" : t.isPaid !== false ? "Paid" : "Not paid"}>
          <Checkbox
            checked={t.isPaid !== false}
            onChange={(event) => onTogglePaid(t.id, event.target.checked)}
            inputProps={{ "aria-label": `Payment status for ${t.description}` }}
            size="small"
            color={t.isVirtual ? "info" : "success"}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
      </TableCell>
      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{formatDate(t.date)}</TableCell>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={500} noWrap title={t.description}>
            {t.description}
          </Typography>
          <TransactionTags transaction={t} compact />
        </Box>
      </TableCell>
      <TableCell>
        <Chip label={t.category} title={t.category} size="small" variant="outlined" sx={{ height: 20 }} />
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary" display="block" noWrap title={t.paymentMethod}>
          {t.paymentMethod}
        </Typography>
      </TableCell>
      <TableCell align="center">
        {t.type === "income" ? <ArrowUpIcon titleAccess="Income" sx={{ fontSize: 16, color: "success.main" }} /> : <ArrowDownIcon titleAccess="Expense" sx={{ fontSize: 16, color: "error.main" }} />}
      </TableCell>
      <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600, color: t.type === "income" ? "success.main" : "error.main" }}>
        {formatPrivateValue((t.type === "expense" ? "- " : "") + formatCurrency(t.amount || 0))}
      </TableCell>
      <TableCell align="center" onClick={(event) => event.stopPropagation()}>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
          <Tooltip title={t.isVirtual ? "Edit recurring transaction" : "Edit"}>
            <IconButton size="small" aria-label={`Edit ${t.description}`} onClick={() => onEdit(t)} color="primary">
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.isVirtual ? "Delete recurring transaction" : "Delete"}>
            <IconButton size="small" aria-label={`Delete ${t.description}`} onClick={() => onDelete(t)} color="error">
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 2 : 3,
        px: { xs: 0, md: "28px" },
        pt: { xs: 0, md: "24px" },
        pb: { xs: "24px", md: "60px" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: "14px",
          flexWrap: "wrap",
          mb: { xs: 0, md: "6px" },
        }}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, letterSpacing: "-0.02em" }}>
            All Transactions
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            {MONTHS[selectedMonth]} {selectedYear} • {filteredData.length} transactions
          </Typography>
        </Box>

        {isMobile && (
          <NixButton size="md" onClick={onNewTransaction} style={{ marginInlineStart: "auto" }}>
            <AddIcon fontSize="small" /> New
          </NixButton>
        )}
      </Box>

      {/* Summary Cards */}
      {isMobile ? (
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            p: "16px",
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.75)} 100%)`
              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.07)}`,
            boxShadow: isDarkMode
              ? `0 10px 30px -10px ${alpha(balance >= 0 ? "#a855f7" : "#ef4444", 0.2)}`
              : `0 10px 30px -10px ${alpha(balance >= 0 ? "#a855f7" : "#ef4444", 0.1)}`,
            borderRadius: "20px",
            transition: "all 0.2s ease-in-out",
            "&:hover": { transform: "translateY(-2px)" },
            mb: 2,
          }}
        >
          {/* Top row: Current Balance */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Box>
              <Typography
                sx={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  mb: "2px",
                }}
              >
                Current Balance
              </Typography>
              <Typography
                sx={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#a855f7",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatPrivateValue(formatCurrency(balance))}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha("#a855f7", isDarkMode ? 0.2 : 0.12),
                color: "#a855f7",
              }}
            >
              <WalletIcon sx={{ fontSize: 20 }} />
            </Box>
          </Stack>

          <Divider sx={{ borderStyle: "dashed", my: 1.5, borderColor: isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06) }} />

          {/* Bottom row: Income and Expenses side by side */}
          <Grid container spacing={2}>
            {/* Income Section */}
            <Grid size={{ xs: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha("#10b981", isDarkMode ? 0.2 : 0.12),
                    color: "#10b981",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      lineHeight: 1.2,
                    }}
                  >
                    Income
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: "#10b981",
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.3,
                    }}
                  >
                    {formatPrivateValue(formatCurrency(totalIncome))}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Expense Section */}
            <Grid size={{ xs: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha("#ef4444", isDarkMode ? 0.2 : 0.12),
                    color: "#ef4444",
                    flexShrink: 0,
                  }}
                >
                  <TrendingDownIcon sx={{ fontSize: 16 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      lineHeight: 1.2,
                    }}
                  >
                    Expenses
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: "#ef4444",
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.3,
                    }}
                  >
                    {formatPrivateValue(formatCurrency(totalExpense))}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Grid container spacing={gridSpacing}>
          {/* Balance Card */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                position: "relative",
                overflow: "hidden",
                p: isMobile ? "14px" : "18px",
                background: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.8)
                  : "#ffffff",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.07)}`,
                boxShadow: isDarkMode
                  ? `0 4px 16px -4px ${alpha(balance >= 0 ? "#a855f7" : "#ef4444", 0.25)}`
                  : `0 4px 16px -4px ${alpha(balance >= 0 ? "#a855f7" : "#ef4444", 0.15)}`,
                borderRadius: "14px",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              {/* Absolute icon — top-right */}
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 38,
                  height: 38,
                  borderRadius: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#a855f7", isDarkMode ? 0.2 : 0.12),
                  color: "#a855f7",
                }}
              >
                <WalletIcon sx={{ fontSize: 20 }} />
              </Box>

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  mb: "6px",
                }}
              >
                Current Balance
              </Typography>
              <Typography
                sx={{
                  fontSize: isMobile ? 22 : 26,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#a855f7",
                  fontVariantNumeric: "tabular-nums",
                  pr: 6,
                }}
              >
                {formatPrivateValue(formatCurrency(balance))}
              </Typography>
            </Paper>
          </Grid>

          {/* Income Card */}
          <Grid size={{ xs: 6, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                position: "relative",
                overflow: "hidden",
                p: isMobile ? "14px" : "18px",
                background: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.8)
                  : "#ffffff",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.07)}`,
                boxShadow: isDarkMode
                  ? `0 4px 16px -4px ${alpha("#10b981", 0.25)}`
                  : `0 4px 16px -4px ${alpha("#10b981", 0.15)}`,
                borderRadius: "14px",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 38,
                  height: 38,
                  borderRadius: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#10b981", isDarkMode ? 0.2 : 0.12),
                  color: "#10b981",
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 20 }} />
              </Box>

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  mb: "6px",
                }}
              >
                Income
              </Typography>
              <Typography
                sx={{
                  fontSize: isMobile ? 22 : 26,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#10b981",
                  fontVariantNumeric: "tabular-nums",
                  pr: 6,
                }}
              >
                {formatPrivateValue(formatCurrency(totalIncome))}
              </Typography>
            </Paper>
          </Grid>

          {/* Expense Card */}
          <Grid size={{ xs: 6, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                position: "relative",
                overflow: "hidden",
                p: isMobile ? "14px" : "18px",
                background: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.8)
                  : "#ffffff",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.07)}`,
                boxShadow: isDarkMode
                  ? `0 4px 16px -4px ${alpha("#ef4444", 0.25)}`
                  : `0 4px 16px -4px ${alpha("#ef4444", 0.15)}`,
                borderRadius: "14px",
                transition: "all 0.2s ease-in-out",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 38,
                  height: 38,
                  borderRadius: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#ef4444", isDarkMode ? 0.2 : 0.12),
                  color: "#ef4444",
                }}
              >
                <TrendingDownIcon sx={{ fontSize: 20 }} />
              </Box>

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  mb: "6px",
                }}
              >
                Expenses
              </Typography>
              <Typography
                sx={{
                  fontSize: isMobile ? 22 : 26,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#ef4444",
                  fontVariantNumeric: "tabular-nums",
                  pr: 6,
                }}
              >
                {formatPrivateValue(formatCurrency(totalExpense))}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Search & Filters Toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: isMobile ? "16px" : "20px",
          overflow: "hidden",
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha("#FFFFFF", 0.9),
          backdropFilter: "blur(20px)",
          border: `1px solid ${
            isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
          }`,
        }}
      >
        {/* Date Filter Toolbar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: isMobile ? 1.5 : 2,
            py: 1.5,
            borderBottom: `1px solid ${
              isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
            }`,
          }}
        >
          {/* Year Dropdown */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={selectedYear}
              onChange={(e) => onDateChange(selectedMonth, Number(e.target.value))}
              sx={{
                bgcolor: isDarkMode ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 700,
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                borderRadius: "10px",
              }}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Month Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              overflowX: "auto",
              pb: 0.5,
              "&::-webkit-scrollbar": { height: "4px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { background: alpha(theme.palette.primary.main, 0.2), borderRadius: "4px" },
            }}
          >
            {MONTHS.map((month, index) => {
              const isSelected = selectedMonth === index;
              return (
                <Button
                  key={month}
                  onClick={() => onDateChange(index, selectedYear)}
                  variant={isSelected ? "contained" : "text"}
                  disableElevation
                  sx={{
                    minWidth: "auto",
                    px: 2,
                    py: 0.5,
                    borderRadius: "10px",
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#fff" : "text.secondary",
                    bgcolor: isSelected ? "primary.main" : "transparent",
                    textTransform: "capitalize",
                    "&:hover": {
                      bgcolor: isSelected ? "primary.dark" : isDarkMode ? alpha("#fff", 0.05) : alpha("#000", 0.05),
                    },
                  }}
                >
                  {month.slice(0, 3)}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Toolbar principal */}
        <Box
          sx={{
            p: isMobile ? 1 : 2,
            display: "flex",
            flexWrap: isMobile ? "nowrap" : "wrap",
            alignItems: "center",
            gap: isMobile ? 1 : 2,
          }}
        >
          {/* Campo de busca - flex-grow no mobile para ocupar espaço restante */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search transactions..."
            minWidth={isMobile ? 0 : 200}
            maxWidth={isMobile ? 9999 : 320}
            fullWidth={false}
            flex={1}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 0.75 : 1,
              minWidth: 0,
              flex: "0 0 auto",
              justifyContent: isMobile ? "flex-end" : undefined,
            }}
          >
            {isMobile ? (
              /* ── Mobile: pílula única filtro + download ── */
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "stretch",
                  height: 38,
                  border: "1px solid",
                  borderColor: activeFiltersCount > 0 ? "primary.main" : "divider",
                  borderRadius: "12px",
                  overflow: "hidden",
                  flexShrink: 0,
                  transition: "border-color 0.2s",
                  ...(activeFiltersCount > 0 && {
                    background: `linear-gradient(135deg, ${alpha("#6366f1", 0.08)} 0%, ${alpha("#8b5cf6", 0.06)} 100%)`,
                  }),
                }}
              >
                {/* Botão de filtros */}
                <Box
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    cursor: "pointer",
                    transition: "background 0.15s",
                    "&:active": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                  }}
                >
                  <FilterIcon sx={{ fontSize: 16, color: activeFiltersCount > 0 ? "primary.main" : "text.secondary" }} />
                  {activeFiltersCount > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >
                      {activeFiltersCount}
                    </Box>
                  )}
                </Box>

                {/* Divisor */}
                <Box sx={{ width: "1px", bgcolor: "divider", flexShrink: 0 }} />

                {/* Botão de download */}
                <Box
                  onClick={isExporting || filteredData.length === 0 ? undefined : (e) => setAnchorEl(e.currentTarget as HTMLElement)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    cursor: isExporting || filteredData.length === 0 ? "default" : "pointer",
                    opacity: filteredData.length === 0 ? 0.35 : 1,
                    transition: "background 0.15s",
                    "&:active": filteredData.length === 0 ? undefined : { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                  }}
                >
                  {isExporting ? (
                    <CircularProgress size={12} />
                  ) : (
                    <DownloadIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  )}
                </Box>
              </Box>
            ) : (
              /* ── Desktop: botões separados ── */
              <>

                {/* Export Button */}
                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  disabled={isExporting || filteredData.length === 0}
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: "20px",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {isExporting ? (
                    <CircularProgress size={14} />
                  ) : (
                    <DownloadIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </>
            )}

            {/* Refresh Button — apenas desktop */}
            {onRefreshData && !isMobile && (
              <Tooltip title="Atualizar dados">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  size="small"
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: "20px",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <RefreshIcon
                    sx={{
                      fontSize: 20,
                      animation: isRefreshing ? "spin 1s linear infinite" : "none",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </IconButton>
              </Tooltip>
            )}
          </Box>

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

        {/* ── Filtros: bottom sheet no mobile, inline no desktop ── */}
        {isMobile ? (
          <SwipeableDrawer
            anchor="bottom"
            open={showFilters}
            onClose={() => setShowFilters(false)}
            onOpen={() => setShowFilters(true)}
            disableSwipeToOpen
            PaperProps={{
              sx: {
                borderRadius: "20px 20px 0 0",
                maxHeight: "80vh",
                overflowY: "auto",
                background: isDarkMode
                  ? `linear-gradient(160deg, ${alpha("#1e293b", 0.98)} 0%, ${alpha("#0f172a", 1)} 100%)`
                  : "linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)",
              },
            }}
          >
            {/* Alça */}
            <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}>
              <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.text.primary, 0.15) }} />
            </Box>

            {/* Header do drawer */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterIcon fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Filtros
                </Typography>
                {activeFiltersCount > 0 && (
                  <Chip
                    label={activeFiltersCount}
                    size="small"
                    color="primary"
                    sx={{ height: 20, minWidth: 20, fontSize: 11, "& .MuiChip-label": { px: 0.75 } }}
                  />
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {activeFiltersCount > 0 && (
                  <Button
                    size="small"
                    onClick={() => { setFilterType("all"); setFilterCategory("all"); setFilterShared("all"); setFilterPaymentStatus("all"); }}
                    sx={{ textTransform: "none", fontSize: 12, color: "error.main", minWidth: "auto" }}
                  >
                    Limpar
                  </Button>
                )}
                <IconButton size="small" onClick={() => setShowFilters(false)} sx={{ color: "text.secondary" }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Divider />

            {/* Conteúdo dos filtros */}
            <Stack spacing={2} sx={{ p: 2.5, pb: 4 }}>
              {/* Chips de filtros ativos */}
              {activeFiltersCount > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {filterType !== "all" && (
                    <Chip
                      label={filterType === "income" ? "Receita" : "Despesa"}
                      onDelete={() => setFilterType("all")}
                      size="small"
                      sx={{ bgcolor: alpha(filterType === "income" ? "#10b981" : "#ef4444", 0.1), color: filterType === "income" ? "#10b981" : "#ef4444" }}
                    />
                  )}
                  {filterCategory !== "all" && (
                    <Chip label={filterCategory} onDelete={() => setFilterCategory("all")} size="small" sx={{ bgcolor: alpha("#8b5cf6", 0.1) }} />
                  )}
                  {filterShared !== "all" && (
                    <Chip label={filterShared === "shared" ? "Shared" : "Not shared"} onDelete={() => setFilterShared("all")} size="small" sx={{ bgcolor: alpha("#06b6d4", 0.1) }} />
                  )}
                  {filterPaymentStatus !== "all" && (
                    <Chip label={filterPaymentStatus === "paid" ? "Paid" : "Pending"} onDelete={() => setFilterPaymentStatus("all")} size="small" sx={{ bgcolor: alpha("#f59e0b", 0.1), color: "#f59e0b" }} />
                  )}
                </Stack>
              )}

              {/* Type */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
                  Type
                </Typography>
                <Stack direction="row" gap={1}>
                  {(["all", "income", "expense"] as const).map((val) => (
                    <Chip
                      key={val}
                      label={val === "all" ? "All" : val === "income" ? "Income" : "Expenses"}
                      onClick={() => setFilterType(val)}
                      variant={filterType === val ? "filled" : "outlined"}
                      size="medium"
                      sx={{
                        borderRadius: "10px",
                        flex: 1,
                        cursor: "pointer",
                        fontWeight: filterType === val ? 600 : 400,
                        ...(filterType === val && val === "income" && { bgcolor: alpha("#10b981", 0.15), color: "#10b981", border: "none" }),
                        ...(filterType === val && val === "expense" && { bgcolor: alpha("#ef4444", 0.15), color: "#ef4444", border: "none" }),
                        ...(filterType === val && val === "all" && { bgcolor: "primary.main", color: "#fff", border: "none" }),
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Status */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
                  Status
                </Typography>
                <Stack direction="row" gap={1}>
                  {(["all", "paid", "pending"] as const).map((val) => (
                    <Chip
                      key={val}
                      label={val === "all" ? "All" : val === "paid" ? "Paid" : "Pending"}
                      onClick={() => setFilterPaymentStatus(val)}
                      variant={filterPaymentStatus === val ? "filled" : "outlined"}
                      size="medium"
                      sx={{
                        borderRadius: "10px",
                        flex: 1,
                        cursor: "pointer",
                        fontWeight: filterPaymentStatus === val ? 600 : 400,
                        ...(filterPaymentStatus === val && val === "paid" && { bgcolor: alpha("#10b981", 0.15), color: "#10b981", border: "none" }),
                        ...(filterPaymentStatus === val && val === "pending" && { bgcolor: alpha("#f59e0b", 0.15), color: "#f59e0b", border: "none" }),
                        ...(filterPaymentStatus === val && val === "all" && { bgcolor: "primary.main", color: "#fff", border: "none" }),
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Category */}
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e: SelectChangeEvent) => setFilterCategory(e.target.value)}
                  sx={{ borderRadius: "12px" }}
                >
                  <MenuItem value="all">All categories</MenuItem>
                  {availableCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Shared */}
              <FormControl fullWidth size="small">
                <InputLabel>Shared</InputLabel>
                <Select
                  value={filterShared}
                  label="Shared"
                  onChange={(e: SelectChangeEvent) => setFilterShared(e.target.value as "all" | "shared" | "not_shared")}
                  sx={{ borderRadius: "12px" }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="shared">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <GroupIcon fontSize="small" color="info" />
                      Shared
                    </Box>
                  </MenuItem>
                  <MenuItem value="not_shared">Not shared</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </SwipeableDrawer>
        ) : (
          /* ── Desktop: filtros inline ── */
          showTransactionsFilters && (
            <Box
              sx={{
                p: 2,
                pt: 0,
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
                bgcolor: isDarkMode ? alpha(theme.palette.background.default, 0.3) : alpha(theme.palette.grey[50], 0.5),
              }}
            >
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e: SelectChangeEvent) => setFilterType(e.target.value as "all" | "income" | "expense")}
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
                <Select value={filterCategory} label="Category" onChange={(e: SelectChangeEvent) => setFilterCategory(e.target.value)}>
                  <MenuItem value="all">All Categories</MenuItem>
                  {availableCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Shared</InputLabel>
                <Select value={filterShared} label="Shared" onChange={(e: SelectChangeEvent) => setFilterShared(e.target.value as "all" | "shared" | "not_shared")}>
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
                <Select value={filterPaymentStatus} label="Status" onChange={(e: SelectChangeEvent) => setFilterPaymentStatus(e.target.value as "all" | "paid" | "pending")}>
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
                  onClick={() => { setFilterType("all"); setFilterCategory("all"); setFilterShared("all"); setFilterPaymentStatus("all"); }}
                  sx={{ textTransform: "none" }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
          )
        )}
      </Paper>

      {isMobile ? (
        <Box>
          {paginatedData.length > 0 ? (
            <>
              {isMobile && paginatedData.length > 30 ? (
                <Paper
                  ref={mobileListParentRef}
                  elevation={0}
                  sx={{
                    maxHeight: "70vh",
                    overflow: "auto",
                    borderRadius: "20px",
                    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.07)}`,
                    bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.4) : "#ffffff",
                    boxShadow: isDarkMode 
                      ? "0 4px 20px -4px rgba(0,0,0,0.3)" 
                      : "0 4px 20px -4px rgba(99,102,241,0.05)",
                  }}
                >
                  <Box
                    sx={{
                      height: `${mobileListVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {mobileListVirtualizer.getVirtualItems().map((virtualRow) => {
                      const t = paginatedData[virtualRow.index];
                      return (
                        <Box
                          key={t.id}
                          ref={mobileListVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                            pb: 0,
                          }}
                        >
                          {renderMobileRow(t, virtualRow.index)}
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.07)}`,
                    bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.4) : "#ffffff",
                    boxShadow: isDarkMode 
                      ? "0 4px 20px -4px rgba(0,0,0,0.3)" 
                      : "0 4px 20px -4px rgba(99,102,241,0.05)",
                  }}
                >
                  {paginatedData.map(renderMobileRow)}
                </Paper>
              )}

              {/* Summary Footer */}
              <Card
                elevation={0}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  mt: 1,
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.7
                      )} 0%, ${alpha(
                        theme.palette.background.paper,
                        0.5
                      )} 100%)`
                    : `linear-gradient(135deg, ${alpha(
                        "#FFFFFF",
                        0.85
                      )} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${
                    isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
                  }`,
                  borderRadius: "14px",
                  boxShadow: isDarkMode
                    ? `0 4px 16px -4px ${alpha(
                        balance >= 0 ? "#059669" : "#DC2626",
                        0.2
                      )}`
                    : `0 4px 16px -4px ${alpha(
                        balance >= 0 ? "#059669" : "#DC2626",
                        0.15
                      )}`,
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      balance >= 0
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
                    {formatPrivateValue(formatCurrency(balance))}
                  </Typography>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              type="transactions"
              title="No transactions found"
              description="No transactions found with the current filters."
              compact
            />
          )}

          <Dialog
            open={Boolean(selectedTransaction)}
            onClose={() => setDetailId(null)}
            fullWidth
            maxWidth="xs"
            aria-labelledby="mobile-transaction-title"
          >
            {selectedTransaction && (
              <>
                <DialogTitle id="mobile-transaction-title" sx={{ overflowWrap: "anywhere" }}>
                  {selectedTransaction.description}
                </DialogTitle>
                <DialogContent dividers>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color={selectedTransaction.type === "income" ? "success.main" : "error.main"}
                  >
                    {mobileAmount(selectedTransaction)}
                  </Typography>
                  <Box
                    component="dl"
                    sx={{
                      my: 2,
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr)",
                      gap: 1.25,
                      "& dt": { color: "text.secondary" },
                      "& dd": { m: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
                    }}
                  >
                    <dt>Type</dt><dd>{selectedTransaction.type === "income" ? "Income" : "Expense"}</dd>
                    <dt>Category</dt><dd>{selectedTransaction.category}</dd>
                    <dt>Payment method</dt><dd>{selectedTransaction.paymentMethod}</dd>
                    <dt>Date</dt><dd>{formatDate(selectedTransaction.date)}</dd>
                    {detailInvoiceDate && (selectedTransaction.invoiceDueDate || detailInvoiceDate !== selectedTransaction.date) && (
                      <><dt>Invoice due</dt><dd>{formatDate(detailInvoiceDate)}</dd></>
                    )}
                    {selectedTransaction.installments && selectedTransaction.installments > 1 && (
                      <><dt>Installment</dt><dd>{selectedTransaction.currentInstallment ?? 1} / {selectedTransaction.installments}</dd></>
                    )}
                    {(selectedTransaction.isRecurring || selectedTransaction.isVirtual) && (
                      <><dt>Recurrence</dt><dd>{selectedTransaction.frequency === "yearly" ? "Yearly" : selectedTransaction.frequency === "monthly" ? "Monthly" : "Recurring"}</dd></>
                    )}
                    {selectedTransaction.isShared && (
                      <><dt>Shared</dt><dd>{selectedTransaction.sharedWith || "Yes"}</dd></>
                    )}
                    {selectedTransaction.notes && <><dt>Notes</dt><dd>{selectedTransaction.notes}</dd></>}
                  </Box>
                  <TransactionTags transaction={selectedTransaction} />
                  <FormControlLabel
                    label="Paid"
                    control={<Checkbox
                      checked={selectedTransaction.isPaid !== false}
                      disabled={isUpdatingPayment}
                      onChange={(event) => void handleDetailPaymentChange(selectedTransaction, event.target.checked)}
                    />}
                  />
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2, flexWrap: "wrap", gap: 1 }}>
                  <NixButton variant="ghost" color="gray" onClick={() => setDetailId(null)}>Close</NixButton>
                  <NixButton variant="soft" color="red" onClick={() => {
                    setDetailId(null);
                    onDelete(selectedTransaction);
                  }}>Delete</NixButton>
                  <NixButton onClick={() => {
                    setDetailId(null);
                    onEdit(selectedTransaction);
                  }}>Edit</NixButton>
                </DialogActions>
              </>
            )}
          </Dialog>

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
            border: `1px solid ${
              isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
            }`,
          }}
        >
          <TableContainer ref={desktopTableParentRef} sx={{ maxHeight: isDesktopVirtualized ? 552 : undefined }}>
            <Table size="small" stickyHeader={isDesktopVirtualized} sx={{ tableLayout: "fixed", minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, width: 48, textAlign: "center" }}>Paid</TableCell>
                  {renderSortableHeader("date", "Date", 86)}
                  {renderSortableHeader("description", "Description")}
                  {renderSortableHeader("category", "Category", 108)}
                  {renderSortableHeader("paymentMethod", "Method", 100)}
                  {renderSortableHeader("type", "Type", 64)}
                  {renderSortableHeader("amount", "Amount", 110)}
                  <TableCell sx={{ ...headerCellSx, width: 78, textAlign: "center" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDesktopVirtualized ? (
                  <>
                    {desktopTopSpace > 0 && (
                      <TableRow aria-hidden><TableCell colSpan={8} sx={{ height: desktopTopSpace, p: 0, border: 0 }} /></TableRow>
                    )}
                    {desktopRows.map(({ index }) => renderDesktopRow(paginatedData[index], index))}
                    {desktopBottomSpace > 0 && (
                      <TableRow aria-hidden><TableCell colSpan={8} sx={{ height: desktopBottomSpace, p: 0, border: 0 }} /></TableRow>
                    )}
                  </>
                ) : paginatedData.length ? (
                  paginatedData.map(renderDesktopRow)
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}>
                      <WalletIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2, display: "block", mx: "auto" }} />
                      <Typography color="text.secondary" fontStyle="italic">
                        No transactions found with the current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {!isDesktopVirtualized && filteredData.length > 0 && (
                <TableFooter>
                  <TableRow sx={{ bgcolor: isDarkMode ? alpha(theme.palette.background.default, 0.3) : alpha(theme.palette.grey[50], 0.5) }}>
                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 600 }}>Filtered Total:</TableCell>
                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600, color: balance >= 0 ? "success.main" : "error.main" }}>
                      {formatPrivateValue(formatCurrency(balance))}
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
                borderTop: `1px solid ${
                  isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)
                }`,
              }}
            />
          )}
        </Paper>
      )}
    </Box>
  );
};

export default TransactionsView;
