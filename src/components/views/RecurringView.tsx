import React, { useState, useMemo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  alpha,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import TransactionOptionsPanel, { ActionType, OptionType } from "../panels/TransactionOptionsPanel";
import {
  Repeat as RepeatIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UnpaidIcon,
  Refresh as RefreshIcon,
  AllInclusive as InfiniteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import SearchBar from "../ui/SearchBar";
import { Transaction } from "../../types";
import { useLayoutSpacing } from "../../hooks";
import EmptyState from "../ui/EmptyState";
import { useSettings } from "../../contexts";
import PaymentMethodIcon from "../ui/PaymentMethodIcon";
import PaymentMethodImagePicker from "../ui/PaymentMethodImagePicker";
import { extractDominantColor, hashColor } from "../../utils/imageColorUtils";
import { Image as ImageIcon } from "@mui/icons-material";

interface RecurringViewProps {
  transactions: Transaction[];
  onEditSeries: (transaction: Transaction) => void;
  onEditWithScope: (tx: Transaction, scope: OptionType, virtualDate?: string) => void;
  onDeleteWithScope: (tx: Transaction, scope: OptionType, virtualDate?: string) => Promise<void>;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onNewTransaction: () => void;
  onRefreshData?: () => Promise<void>;
}

interface OptionsPanelState {
  open: boolean;
  displayTransaction: Transaction | null;
  baseTransaction: Transaction | null;
  occurrence: RecurringOccurrence | null;
  actionType: ActionType;
}

interface DeleteConfirmState {
  open: boolean;
  displayTransaction: Transaction | null;
  baseTransaction: Transaction | null;
  occurrence: RecurringOccurrence | null;
  scope: OptionType;
  isLoading: boolean;
}

interface RecurringOccurrence {
  date: string;
  formattedDate: string;
  month: string;
  year: number;
  isPast: boolean;
  isCurrent: boolean;
  occurrenceNumber: number;
  isModified?: boolean;
  modifiedTransaction?: Transaction;
  isIndividuallyEdited?: boolean;
}

const RecurringView: React.FC<RecurringViewProps> = ({
  transactions,
  onEditSeries,
  onEditWithScope,
  onDeleteWithScope,
  onTogglePaid,
  onNewTransaction,
  onRefreshData,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const { gridSpacing } = useLayoutSpacing();
  const { getSubscriptionImage, updateSubscriptionImage, getSubscriptionColor, updateSubscriptionColor } = useSettings();

  const [imgPickerOpen, setImgPickerOpen] = useState(false);
  const [imgPickerTarget, setImgPickerTarget] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [filterFrequency, setFilterFrequency] = useState<
    "all" | "monthly" | "yearly"
  >("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecurringId, setSelectedRecurringId] = useState<string | null>(null);

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  const [mobileOccurrenceMenuAnchor, setMobileOccurrenceMenuAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
    occurrence: RecurringOccurrence | null;
  }>({ element: null, transaction: null, occurrence: null });

  const [optionsPanel, setOptionsPanel] = useState<OptionsPanelState>({
    open: false,
    displayTransaction: null,
    baseTransaction: null,
    occurrence: null,
    actionType: "edit",
  });

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    displayTransaction: null,
    baseTransaction: null,
    occurrence: null,
    scope: "single",
    isLoading: false,
  });

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

  const openEditOptions = (baseTransaction: Transaction, occurrence?: RecurringOccurrence) => {
    const displayTx = occurrence
      ? (occurrence.isModified && occurrence.modifiedTransaction
          ? occurrence.modifiedTransaction
          : createVirtualTransaction(baseTransaction, occurrence))
      : baseTransaction;
    setOptionsPanel({ open: true, displayTransaction: displayTx, baseTransaction, occurrence: occurrence ?? null, actionType: "edit" });
  };

  const openDeleteOptions = (baseTransaction: Transaction, occurrence?: RecurringOccurrence) => {
    const displayTx = occurrence
      ? (occurrence.isModified && occurrence.modifiedTransaction
          ? occurrence.modifiedTransaction
          : createVirtualTransaction(baseTransaction, occurrence))
      : baseTransaction;
    setOptionsPanel({ open: true, displayTransaction: displayTx, baseTransaction, occurrence: occurrence ?? null, actionType: "delete" });
  };

  const handleOptionSelect = (scope: OptionType) => {
    const { displayTransaction, occurrence, actionType } = optionsPanel;
    setOptionsPanel((prev) => ({ ...prev, open: false }));
    if (!displayTransaction) return;
    if (actionType === "edit") {
      onEditWithScope(displayTransaction, scope, occurrence?.date);
    } else {
      setDeleteConfirm({
        open: true,
        displayTransaction,
        baseTransaction: optionsPanel.baseTransaction,
        occurrence: occurrence ?? null,
        scope,
        isLoading: false,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    const { displayTransaction, baseTransaction, occurrence, scope } = deleteConfirm;
    if (!displayTransaction) return;
    setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
    try {
      await onDeleteWithScope(displayTransaction, scope, occurrence?.date);
      if (scope !== "single" && baseTransaction && selectedRecurringId === baseTransaction.id) {
        setSelectedRecurringId(null);
      }
    } finally {
      setDeleteConfirm({ open: false, displayTransaction: null, baseTransaction: null, occurrence: null, scope: "single", isLoading: false });
    }
  };

  const getDeleteConfirmText = () => {
    const { displayTransaction, occurrence, scope } = deleteConfirm;
    if (!displayTransaction) return "";
    const name = `"${displayTransaction.description}"`;
    switch (scope) {
      case "single":
        return `A ocorrência de ${name}${occurrence ? ` em ${occurrence.formattedDate}` : ""} será excluída permanentemente.`;
      case "all_future":
        return `Esta e todas as ocorrências futuras de ${name} serão excluídas permanentemente.`;
      case "all":
        return `Todas as ocorrências de ${name} (passadas e futuras) serão excluídas. Esta ação não pode ser desfeita.`;
    }
  };

  // Lista de todas as categorias únicas
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions
      .filter((t) => t.isRecurring && !t.isVirtual)
      .forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  // IDs de transações relacionadas (shared)
  const relatedTransactionIds = useMemo(() => {
    const ids = new Set<string>();
    transactions
      .filter(
        (t) =>
          t.isRecurring &&
          !t.isVirtual &&
          t.isShared &&
          t.relatedTransactionId &&
          t.type === "expense"
      )
      .forEach((t) => {
        if (t.relatedTransactionId) {
          ids.add(t.relatedTransactionId);
        }
      });
    return ids;
  }, [transactions]);

  // Helper para encontrar a transação relacionada
  const getRelatedTransaction = useCallback(
    (transaction: Transaction): Transaction | null => {
      if (!transaction.isShared || !transaction.relatedTransactionId)
        return null;
      return (
        transactions.find((t) => t.id === transaction.relatedTransactionId) ||
        null
      );
    },
    [transactions]
  );

  // Filtra transações recorrentes
  const recurringTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.isRecurring && !t.isVirtual)
      .filter((t) => !relatedTransactionIds.has(t.id))
      .filter((t) => {
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || t.type === filterType;
        const matchesFrequency =
          filterFrequency === "all" || t.frequency === filterFrequency;
        const matchesCategory =
          filterCategory === "all" || t.category === filterCategory;
        return (
          matchesSearch && matchesType && matchesFrequency && matchesCategory
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    searchTerm,
    filterType,
    filterFrequency,
    filterCategory,
    relatedTransactionIds,
  ]);

  // Virtualização do grid de cards para listas longas
  const RECURRING_VIRTUALIZE_THRESHOLD = 20;
  const cols = isMobile ? 1 : isLargeDesktop ? 3 : 2;
  const shouldVirtualize = recurringTransactions.length > RECURRING_VIRTUALIZE_THRESHOLD;

  const virtualGridRows = useMemo(() => {
    if (!shouldVirtualize) return [];
    const rows: Transaction[][] = [];
    for (let i = 0; i < recurringTransactions.length; i += cols) {
      rows.push(recurringTransactions.slice(i, i + cols));
    }
    return rows;
  }, [recurringTransactions, cols, shouldVirtualize]);

  const listParentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: virtualGridRows.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 220,
    overscan: 2,
  });

  // Estatísticas
  const stats = useMemo(() => {
    const recurring = transactions.filter((t) => t.isRecurring && !t.isVirtual);
    const monthlyIncome = recurring
      .filter((t) => t.type === "income" && t.frequency === "monthly")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthlyExpense = recurring
      .filter((t) => t.type === "expense" && t.frequency === "monthly")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const yearlyOnlyIncome = recurring
      .filter((t) => t.type === "income" && t.frequency === "yearly")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const yearlyOnlyExpense = recurring
      .filter((t) => t.type === "expense" && t.frequency === "yearly")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const annualizedIncome = monthlyIncome * 12 + yearlyOnlyIncome;
    const annualizedExpense = monthlyExpense * 12 + yearlyOnlyExpense;

    return {
      total: recurring.length,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
      annualizedIncome,
      annualizedExpense,
      annualizedBalance: annualizedIncome - annualizedExpense,
      incomeCount: recurring.filter((t) => t.type === "income").length,
      expenseCount: recurring.filter((t) => t.type === "expense").length,
    };
  }, [transactions]);

  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const calculateOccurrences = (transaction: Transaction): number => {
    const startDate = parseLocalDate(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate > today) return 0;

    const monthsDiff =
      (today.getFullYear() - startDate.getFullYear()) * 12 +
      (today.getMonth() - startDate.getMonth());

    if (transaction.frequency === "monthly") {
      return Math.max(1, monthsDiff + 1);
    } else if (transaction.frequency === "yearly") {
      return Math.max(1, today.getFullYear() - startDate.getFullYear() + 1);
    }
    return 1;
  };

  const getNextOccurrence = (transaction: Transaction): string => {
    const startDate = parseLocalDate(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextDate = new Date(startDate);

    if (transaction.frequency === "monthly") {
      while (nextDate <= today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else if (transaction.frequency === "yearly") {
      while (nextDate <= today) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }

    return nextDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  // Gera lista de ocorrências futuras (12 meses/anos)
  const getOccurrencesList = (
    transaction: Transaction
  ): RecurringOccurrence[] => {
    const startDate = parseLocalDate(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const occurrences: RecurringOccurrence[] = [];
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const modifiedTransactions = transactions.filter(
      (t) => t.recurringGroupId === transaction.id && !t.isRecurring
    );

    const excludedDatesSet = new Set(transaction.excludedDates || []);

    const modifiedByMonthYear = new Map<string, Transaction>();
    modifiedTransactions.forEach((t) => {
      const tDate = parseLocalDate(t.date);
      const monthYearKey = `${tDate.getFullYear()}-${String(
        tDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const existing = modifiedByMonthYear.get(monthYearKey);
      if (
        !existing ||
        new Date(t.createdAt).getTime() > new Date(existing.createdAt).getTime()
      ) {
        modifiedByMonthYear.set(monthYearKey, t);
      }
    });

    const processedMonths = new Set<string>();

    // Adiciona transações passadas materializadas
    modifiedTransactions
      .filter((t) => {
        const tDate = parseLocalDate(t.date);
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        return (
          tDate.getFullYear() < startYear ||
          (tDate.getFullYear() === startYear && tDate.getMonth() < startMonth)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((t, idx) => {
        const tDate = parseLocalDate(t.date);
        const monthYearKey = `${tDate.getFullYear()}-${String(
          tDate.getMonth() + 1
        ).padStart(2, "0")}`;

        if (processedMonths.has(monthYearKey)) return;
        processedMonths.add(monthYearKey);

        const txToUse = modifiedByMonthYear.get(monthYearKey) || t;
        const txDate = parseLocalDate(txToUse.date);
        const isIndividuallyEdited = excludedDatesSet.has(txToUse.date);

        occurrences.push({
          date: txToUse.date,
          formattedDate: txDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          month: months[txDate.getMonth()],
          year: txDate.getFullYear(),
          isPast: txDate < today,
          isCurrent:
            txDate.getMonth() === today.getMonth() &&
            txDate.getFullYear() === today.getFullYear(),
          occurrenceNumber: idx + 1,
          isModified: true,
          modifiedTransaction: txToUse,
          isIndividuallyEdited,
        });
      });

    const pastOccurrencesCount = occurrences.length;
    let nextOccurrence = new Date(startDate);

    const formatLocalDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (transaction.frequency === "monthly") {
      while (nextOccurrence < today) {
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
      }

      const currentMonthOcc = new Date(nextOccurrence);
      if (
        currentMonthOcc.getMonth() !== today.getMonth() ||
        currentMonthOcc.getFullYear() !== today.getFullYear()
      ) {
        const thisMonthOcc = new Date(startDate);
        while (
          thisMonthOcc.getFullYear() < today.getFullYear() ||
          (thisMonthOcc.getFullYear() === today.getFullYear() &&
            thisMonthOcc.getMonth() < today.getMonth())
        ) {
          thisMonthOcc.setMonth(thisMonthOcc.getMonth() + 1);
        }
        if (
          thisMonthOcc.getMonth() === today.getMonth() &&
          thisMonthOcc.getFullYear() === today.getFullYear()
        ) {
          nextOccurrence = thisMonthOcc;
        }
      }

      const startOccurrenceNumber = pastOccurrencesCount + 1;
      const excludedDates = transaction.excludedDates || [];
      let occurrenceCount = 0;
      let monthOffset = 0;

      while (occurrenceCount < 12) {
        const occDate = new Date(nextOccurrence);
        occDate.setMonth(nextOccurrence.getMonth() + monthOffset);

        const occDateString = formatLocalDate(occDate);
        const monthYearKey = `${occDate.getFullYear()}-${String(
          occDate.getMonth() + 1
        ).padStart(2, "0")}`;

        if (processedMonths.has(monthYearKey)) {
          monthOffset++;
          continue;
        }

        const modifiedTx = modifiedByMonthYear.get(monthYearKey);

        if (excludedDates.includes(occDateString) && !modifiedTx) {
          monthOffset++;
          continue;
        }

        processedMonths.add(monthYearKey);

        const isPast =
          occDate <
          new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isCurrent =
          occDate.getMonth() === today.getMonth() &&
          occDate.getFullYear() === today.getFullYear();

        const finalDate = modifiedTx ? modifiedTx.date : occDateString;
        const finalDateObj = modifiedTx
          ? parseLocalDate(modifiedTx.date)
          : occDate;
        const isIndividuallyEdited =
          modifiedTx && excludedDatesSet.has(modifiedTx.date);

        occurrences.push({
          date: finalDate,
          formattedDate: finalDateObj.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          month: months[finalDateObj.getMonth()],
          year: finalDateObj.getFullYear(),
          isPast,
          isCurrent,
          occurrenceNumber: startOccurrenceNumber + occurrenceCount,
          isModified: !!modifiedTx,
          modifiedTransaction: modifiedTx,
          isIndividuallyEdited,
        });

        occurrenceCount++;
        monthOffset++;
      }
    } else if (transaction.frequency === "yearly") {
      const modifiedByYear = new Map<number, Transaction>();
      modifiedTransactions.forEach((t) => {
        const tDate = parseLocalDate(t.date);
        const year = tDate.getFullYear();
        const existing = modifiedByYear.get(year);
        if (
          !existing ||
          new Date(t.createdAt).getTime() >
            new Date(existing.createdAt).getTime()
        ) {
          modifiedByYear.set(year, t);
        }
      });

      while (nextOccurrence < today) {
        nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
      }

      const startOccurrenceNumber = pastOccurrencesCount + 1;
      const excludedDatesYearly = transaction.excludedDates || [];
      let yearlyCount = 0;
      let yearOffset = 0;

      while (yearlyCount < 12) {
        const occDate = new Date(nextOccurrence);
        occDate.setFullYear(nextOccurrence.getFullYear() + yearOffset);

        const occDateString = formatLocalDate(occDate);
        const yearKey = occDate.getFullYear();

        if (processedMonths.has(`year-${yearKey}`)) {
          yearOffset++;
          continue;
        }

        const modifiedTxYearly = modifiedByYear.get(yearKey);

        if (excludedDatesYearly.includes(occDateString) && !modifiedTxYearly) {
          yearOffset++;
          continue;
        }

        processedMonths.add(`year-${yearKey}`);

        const finalDate = modifiedTxYearly
          ? modifiedTxYearly.date
          : occDateString;
        const finalDateObj = modifiedTxYearly
          ? parseLocalDate(modifiedTxYearly.date)
          : occDate;

        const isPast = finalDateObj < today;
        const isCurrent =
          finalDateObj.getFullYear() === today.getFullYear() &&
          finalDateObj.getMonth() === today.getMonth();
        const isIndividuallyEditedYearly =
          modifiedTxYearly && excludedDatesSet.has(modifiedTxYearly.date);

        occurrences.push({
          date: finalDate,
          formattedDate: finalDateObj.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          month: months[finalDateObj.getMonth()],
          year: finalDateObj.getFullYear(),
          isPast,
          isCurrent,
          occurrenceNumber: startOccurrenceNumber + yearlyCount,
          isModified: !!modifiedTxYearly,
          modifiedTransaction: modifiedTxYearly,
          isIndividuallyEdited: isIndividuallyEditedYearly,
        });

        yearlyCount++;
        yearOffset++;
      }
    }

    return occurrences;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const createVirtualTransaction = (
    baseTransaction: Transaction,
    occurrence: RecurringOccurrence
  ): Transaction => {
    const [year, month] = occurrence.date.split("-");
    const virtualId = `${baseTransaction.id}_recurring_${year}-${month}`;

    return {
      ...baseTransaction,
      id: virtualId,
      date: occurrence.date,
      isVirtual: true,
      originalTransactionId: baseTransaction.id,
      currentInstallment: occurrence.occurrenceNumber,
    };
  };

  const handleCloseMobileOccurrenceMenu = () => {
    setMobileOccurrenceMenuAnchor({
      element: null,
      transaction: null,
      occurrence: null,
    });
  };

  // =============================================
  // CARD
  // =============================================
  const renderRecurringCard = (t: Transaction) => {
    const isIncome = t.type === "income";
    const savedColor = getSubscriptionColor(t.description);
    const palette = savedColor ?? hashColor(t.description);

    return (
      <Grid key={t.id} size={{ xs: 12, sm: 6, lg: 4 }}>
        <Paper
          elevation={0}
          onClick={() => setSelectedRecurringId(t.id)}
          sx={{
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRadius: "16px",
            cursor: "pointer",
            background: isDarkMode
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha("#fff", 0.95),
            border: `1.5px solid ${alpha(palette.primary, isDarkMode ? 0.45 : 0.25)}`,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: `0 10px 28px -6px ${alpha(palette.primary, 0.3)}`,
              border: `1.5px solid ${alpha(palette.primary, 0.65)}`,
            },
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
              <Box
                sx={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); setImgPickerTarget(t.description); setImgPickerOpen(true); }}
              >
                <PaymentMethodIcon
                  imageUrl={getSubscriptionImage(t.description)}
                  colors={palette}
                  size={36}
                  borderRadius="10px"
                  iconSize={18}
                />
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, borderRadius: "10px", bgcolor: "rgba(0,0,0,0.35)", transition: "opacity 0.15s", "&:hover": { opacity: 1 } }}>
                  <ImageIcon sx={{ color: "#fff", fontSize: 14 }} />
                </Box>
              </Box>
              <Tooltip title={t.description}>
                <Typography
                  fontWeight={700}
                  sx={{
                    fontSize: 14,
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.description}
                </Typography>
              </Tooltip>
            </Box>
            <Chip
              label={t.frequency === "monthly" ? "Mensal" : "Anual"}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 600,
                borderRadius: "8px",
                flexShrink: 0,
                ml: 1,
                bgcolor: alpha(palette.primary, isDarkMode ? 0.2 : 0.1),
                color: palette.primary,
                "& .MuiChip-label": { px: 1.25 },
              }}
            />
          </Box>

          {/* Amount section */}
          <Box sx={{ mb: 1.5, flex: 1 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: "text.disabled",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                mb: 0.5,
              }}
            >
              {t.category}
            </Typography>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                color: isIncome ? "#10b981" : "text.primary",
              }}
            >
              {isIncome ? "+" : ""}{formatCurrency(t.amount || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Próx: {getNextOccurrence(t)} · {calculateOccurrences(t)} ocorrências
            </Typography>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              pt: 1.5,
            }}
          >
            {/* Paid/Pending chip */}
            <Chip
              label={t.isPaid ? "Pago" : "Pendente"}
              size="small"
              onClick={(e) => { e.stopPropagation(); onTogglePaid(t.id, !t.isPaid); }}
              sx={{
                height: 24,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: "8px",
                cursor: "pointer",
                border: "none",
                bgcolor: t.isPaid
                  ? alpha("#10b981", isDarkMode ? 0.2 : 0.12)
                  : alpha("#f59e0b", isDarkMode ? 0.2 : 0.12),
                color: t.isPaid ? "#10b981" : "#f59e0b",
                "& .MuiChip-label": { px: 1.25 },
                "&:hover": { opacity: 0.8 },
              }}
            />

            {/* Edit + Delete */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Editar série">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onEditSeries(t); }}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    color: "text.secondary",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Excluir">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); openDeleteOptions(t); }}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    color: "text.secondary",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: "error.main",
                    },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Grid>
    );
  };

  // =============================================
  // DETAIL VIEW
  // =============================================
  const selectedRecurring = selectedRecurringId
    ? transactions.find((t) => t.id === selectedRecurringId) ?? null
    : null;

  if (selectedRecurring) {
    const isIncome = selectedRecurring.type === "income";
    const palette = getSubscriptionColor(selectedRecurring.description) ?? hashColor(selectedRecurring.description);
    const occurrencesList = getOccurrencesList(selectedRecurring);

    return (
      <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          px: { xs: 0, md: "28px" },
          pt: { xs: 0, md: "24px" },
          pb: { xs: "180px", md: "60px" },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <IconButton
            onClick={() => setSelectedRecurringId(null)}
            sx={{ bgcolor: "action.hover", borderRadius: "10px" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isIncome ? (
                <TrendingUpIcon sx={{ color: "#fff", fontSize: 20 }} />
              ) : (
                <TrendingDownIcon sx={{ color: "#fff", fontSize: 20 }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {selectedRecurring.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRecurring.category} · {selectedRecurring.frequency === "monthly" ? "Monthly" : "Yearly"} · {formatCurrency(selectedRecurring.amount || 0)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => onEditSeries(selectedRecurring)}
              sx={{ borderRadius: "10px", textTransform: "none" }}
            >
              Editar série
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => openDeleteOptions(selectedRecurring)}
              sx={{ borderRadius: "10px", textTransform: "none" }}
            >
              Excluir
            </Button>
          </Box>
        </Box>

        {/* Occurrences list */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: `1px solid ${isDarkMode ? alpha("#fff", 0.08) : alpha("#000", 0.06)}`,
            overflow: "hidden",
            bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.7) : "#fff",
          }}
        >
          {occurrencesList.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No occurrences found</Typography>
            </Box>
          ) : (
            occurrencesList.map((occ, index) => {
              const isPaid = occ.isModified
                ? !!occ.modifiedTransaction?.isPaid
                : occ.isCurrent && selectedRecurring.isPaid;
              const amount = occ.modifiedTransaction?.amount ?? selectedRecurring.amount ?? 0;
              const isLast = index === occurrencesList.length - 1;

              return (
                <React.Fragment key={index}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: isMobile ? 2 : 2.5,
                      py: 1.75,
                      gap: 2,
                      opacity: occ.isPast && !occ.isCurrent ? 0.55 : 1,
                      transition: "background 0.15s",
                      "&:hover": {
                        bgcolor: isDarkMode ? alpha("#fff", 0.03) : alpha("#000", 0.02),
                      },
                    }}
                  >
                    {/* Date */}
                    <Box sx={{ minWidth: isMobile ? 70 : 110, flexShrink: 0 }}>
                      <Typography fontWeight={occ.isCurrent ? 700 : 500} sx={{ fontSize: 13 }}>
                        {occ.formattedDate}
                      </Typography>
                      {occ.isCurrent && (
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: theme.palette.primary.main, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Current
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }} />

                    {/* Amount */}
                    <Typography
                      fontWeight={700}
                      sx={{
                        fontSize: isMobile ? 13 : 15,
                        letterSpacing: "-0.01em",
                        color: isIncome ? "#10b981" : "text.primary",
                      }}
                    >
                      {isIncome ? "+" : ""}{formatCurrency(amount)}
                    </Typography>

                    {/* Paid/Pending chip */}
                    <Chip
                      label={isPaid ? "Paid" : "Pending"}
                      size="small"
                      onClick={() => {
                        if (occ.isModified && occ.modifiedTransaction) {
                          onTogglePaid(occ.modifiedTransaction.id, !occ.modifiedTransaction.isPaid);
                        } else if (occ.isCurrent) {
                          onTogglePaid(selectedRecurring.id, !selectedRecurring.isPaid);
                        }
                      }}
                      sx={{
                        height: 24,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: "8px",
                        cursor: occ.isCurrent || occ.isModified ? "pointer" : "default",
                        border: "none",
                        bgcolor: isPaid
                          ? alpha("#10b981", isDarkMode ? 0.2 : 0.12)
                          : alpha("#f59e0b", isDarkMode ? 0.2 : 0.12),
                        color: isPaid ? "#10b981" : "#f59e0b",
                        "& .MuiChip-label": { px: 1.25 },
                        "&:hover": { opacity: occ.isCurrent || occ.isModified ? 0.8 : 1 },
                      }}
                    />

                    {/* Edit */}
                    <Tooltip title="Editar ocorrência">
                      <IconButton
                        size="small"
                        onClick={() => openEditOptions(selectedRecurring, occ)}
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: "8px",
                          color: "text.secondary",
                          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>

                    {/* Delete */}
                    <Tooltip title="Excluir ocorrência">
                      <IconButton
                        size="small"
                        onClick={() => openDeleteOptions(selectedRecurring, occ)}
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: "8px",
                          color: "text.secondary",
                          "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1), color: "error.main" },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {!isLast && <Divider sx={{ mx: isMobile ? 2 : 2.5 }} />}
                </React.Fragment>
              );
            })
          )}
        </Paper>
      </Box>

      {/* Modais — presentes tanto na detail view quanto na lista */}
      <TransactionOptionsPanel
        open={optionsPanel.open}
        onClose={() => setOptionsPanel((prev) => ({ ...prev, open: false }))}
        transaction={optionsPanel.displayTransaction}
        actionType={optionsPanel.actionType}
        onSelect={handleOptionSelect}
      />
      <Dialog
        open={deleteConfirm.open}
        onClose={() => !deleteConfirm.isLoading && setDeleteConfirm((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.95) : alpha("#FFFFFF", 0.98),
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            boxShadow: isDarkMode
              ? `0 24px 60px -12px ${alpha("#000000", 0.6)}`
              : `0 24px 60px -12px ${alpha(theme.palette.error.main, 0.18)}`,
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: isDarkMode ? alpha("#0F172A", 0.7) : alpha("#64748B", 0.35),
              backdropFilter: "blur(6px)",
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                bgcolor: alpha(theme.palette.error.main, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <DeleteIcon sx={{ fontSize: 28, color: "error.main" }} />
            </Box>
            <Typography variant="h6" fontWeight={700} fontSize="1rem" lineHeight={1.3}>
              {deleteConfirm.scope === "single" ? "Excluir ocorrência" :
               deleteConfirm.scope === "all_future" ? "Excluir esta e futuras" :
               "Excluir toda a série"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, pb: 1 }}>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
            {getDeleteConfirmText()}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1.5 }}>
          <Button
            onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
            disabled={deleteConfirm.isLoading}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              color: "text.secondary",
              bgcolor: alpha(theme.palette.text.secondary, 0.08),
              "&:hover": { bgcolor: alpha(theme.palette.text.secondary, 0.14) },
              px: 2.5,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteConfirm.isLoading}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: `0 4px 12px -2px ${alpha(theme.palette.error.main, 0.4)}`,
              "&:hover": { boxShadow: `0 6px 16px -2px ${alpha(theme.palette.error.main, 0.5)}`, transform: "translateY(-1px)" },
              px: 2.5,
            }}
          >
            {deleteConfirm.isLoading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
      </>
    );
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 2 : 3,
        px: { xs: 0, md: "28px" },
        pt: { xs: 0, md: "24px" },
        pb: { xs: "180px", md: "60px" },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: "14px", flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Recurring
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Income & expenses that repeat each cycle
          </Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
          >
            Nova recorrente
          </Button>
          {onRefreshData && (
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  width: 38, height: 38,
                  borderRadius: "10px",
                  border: `1px solid`,
                  borderColor: "divider",
                }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: 16,
                    animation: isRefreshing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={gridSpacing}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              border: `1px solid ${
                isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
              }`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.7
                  )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha(
                    "#FFFFFF",
                    0.6
                  )} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <RepeatIcon
                sx={{ color: theme.palette.primary.main, fontSize: 20 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Total
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
              {stats.total}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#059669" }}>
                {stats.incomeCount} receitas
              </Typography>
              <Typography variant="caption" sx={{ color: "#DC2626" }}>
                {stats.expenseCount} despesas
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              border: `1px solid ${
                isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
              }`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.7
                  )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha(
                    "#FFFFFF",
                    0.6
                  )} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <CalendarIcon sx={{ color: "#06B6D4", fontSize: 20 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Mensal
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              fontWeight={700}
              color={stats.monthlyBalance >= 0 ? "#059669" : "#DC2626"}
            >
              {formatCurrency(stats.monthlyBalance)}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                mt: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ color: "#059669" }}>
                +{formatCurrency(stats.monthlyIncome)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#DC2626" }}>
                -{formatCurrency(stats.monthlyExpense)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              border: `1px solid ${
                isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
              }`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.7
                  )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha(
                    "#FFFFFF",
                    0.6
                  )} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <InfiniteIcon sx={{ color: "#F59E0B", fontSize: 20 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Anual
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              fontWeight={700}
              color={stats.annualizedBalance >= 0 ? "#059669" : "#DC2626"}
            >
              {formatCurrency(stats.annualizedBalance)}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                mt: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ color: "#059669" }}>
                +{formatCurrency(stats.annualizedIncome)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#DC2626" }}>
                -{formatCurrency(stats.annualizedExpense)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              background: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`,
              boxShadow: `0 8px 32px -8px ${alpha("#6366f1", 0.4)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingUpIcon
                sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }}
              />
              <Typography
                variant="caption"
                sx={{ color: alpha("#FFFFFF", 0.8) }}
                fontWeight={600}
              >
                Impacto Total
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              fontWeight={700}
              color="#FFFFFF"
            >
              {formatCurrency(stats.annualizedBalance)}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.7) }}>
              (Mensal × 12) + Anuais
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          overflow: "hidden",
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha("#FFFFFF", 0.9),
          backdropFilter: "blur(20px)",
          border: `1px solid ${
            isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)
          }`,
          p: 2,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          gap: 2,
          alignItems: isMobile ? "stretch" : "center",
        }}
      >
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar..."
          minWidth={180}
        />

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", flex: 1 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filterType}
              label="Tipo"
              onChange={(e: SelectChangeEvent) =>
                setFilterType(e.target.value as "all" | "income" | "expense")
              }
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="income">Receita</MenuItem>
              <MenuItem value="expense">Despesa</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Frequência</InputLabel>
            <Select
              value={filterFrequency}
              label="Frequência"
              onChange={(e: SelectChangeEvent) =>
                setFilterFrequency(
                  e.target.value as "all" | "monthly" | "yearly"
                )
              }
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="monthly">Mensal</MenuItem>
              <MenuItem value="yearly">Anual</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={filterCategory}
              label="Categoria"
              onChange={(e: SelectChangeEvent) =>
                setFilterCategory(e.target.value)
              }
            >
              <MenuItem value="all">Todas</MenuItem>
              {allCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Recurring Items List */}
      {recurringTransactions.length === 0 ? (
        <EmptyState
          type="recurring"
          title="Nenhuma recorrência encontrada"
          description="Crie uma transação recorrente para gerenciá-la aqui"
          compact
        />
      ) : shouldVirtualize ? (
        <Box
          ref={listParentRef}
          sx={{ maxHeight: "70vh", overflow: "auto", pr: 0.5 }}
        >
          <Box sx={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <Box
                key={virtualRow.index}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  pb: gridSpacing,
                }}
              >
                <Grid container spacing={gridSpacing}>
                  {virtualGridRows[virtualRow.index].map((t) => renderRecurringCard(t))}
                </Grid>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Grid container spacing={gridSpacing}>
          {recurringTransactions.map((t) => renderRecurringCard(t))}
        </Grid>
      )}


      {/* Mobile Menus */}
      <Menu
        anchorEl={mobileMenuAnchor.element}
        open={Boolean(mobileMenuAnchor.element)}
        onClose={() =>
          setMobileMenuAnchor({ element: null, transaction: null })
        }
      >
        <MenuItem
          onClick={() => {
            if (mobileMenuAnchor.transaction) {
              onTogglePaid(
                mobileMenuAnchor.transaction.id,
                !mobileMenuAnchor.transaction.isPaid
              );
            }
            setMobileMenuAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon>
            {mobileMenuAnchor.transaction?.isPaid ? (
              <UnpaidIcon fontSize="small" />
            ) : (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {mobileMenuAnchor.transaction?.isPaid
              ? "Marcar como Pendente"
              : "Marcar como Pago"}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const tx = mobileMenuAnchor.transaction;
            setMobileMenuAnchor({ element: null, transaction: null });
            if (tx) onEditSeries(tx);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar série</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const tx = mobileMenuAnchor.transaction;
            setMobileMenuAnchor({ element: null, transaction: null });
            if (tx) openDeleteOptions(tx);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={mobileOccurrenceMenuAnchor.element}
        open={Boolean(mobileOccurrenceMenuAnchor.element)}
        onClose={handleCloseMobileOccurrenceMenu}
      >
        {mobileOccurrenceMenuAnchor.occurrence?.isCurrent && (
          <MenuItem
            onClick={() => {
              if (mobileOccurrenceMenuAnchor.transaction) {
                onTogglePaid(
                  mobileOccurrenceMenuAnchor.transaction.id,
                  !mobileOccurrenceMenuAnchor.transaction.isPaid
                );
              }
              handleCloseMobileOccurrenceMenu();
            }}
          >
            <ListItemIcon>
              {mobileOccurrenceMenuAnchor.transaction?.isPaid ? (
                <UnpaidIcon fontSize="small" />
              ) : (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
            </ListItemIcon>
            <ListItemText>
              {mobileOccurrenceMenuAnchor.transaction?.isPaid
                ? "Marcar como Pendente"
                : "Marcar como Pago"}
            </ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            const { transaction, occurrence } = mobileOccurrenceMenuAnchor;
            handleCloseMobileOccurrenceMenu();
            if (transaction && occurrence) openEditOptions(transaction, occurrence);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const { transaction, occurrence } = mobileOccurrenceMenuAnchor;
            handleCloseMobileOccurrenceMenu();
            if (transaction && occurrence) openDeleteOptions(transaction, occurrence);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      <PaymentMethodImagePicker
        open={imgPickerOpen}
        onClose={() => setImgPickerOpen(false)}
        methodName={imgPickerTarget}
        currentUrl={getSubscriptionImage(imgPickerTarget)}
        onSelect={async (url) => {
          if (!imgPickerTarget) return;
          await updateSubscriptionImage(imgPickerTarget, url);
          if (url) {
            extractDominantColor(url).then((colors) => {
              updateSubscriptionColor(imgPickerTarget, colors ?? hashColor(imgPickerTarget));
            });
          }
        }}
      />

      {/* Options Panel — escopo de edição/deleção */}
      <TransactionOptionsPanel
        open={optionsPanel.open}
        onClose={() => setOptionsPanel((prev) => ({ ...prev, open: false }))}
        transaction={optionsPanel.displayTransaction}
        actionType={optionsPanel.actionType}
        onSelect={handleOptionSelect}
      />

      {/* Confirmação de deleção */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => !deleteConfirm.isLoading && setDeleteConfirm((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.95) : alpha("#FFFFFF", 0.98),
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            boxShadow: isDarkMode
              ? `0 24px 60px -12px ${alpha("#000000", 0.6)}`
              : `0 24px 60px -12px ${alpha(theme.palette.error.main, 0.18)}`,
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: isDarkMode ? alpha("#0F172A", 0.7) : alpha("#64748B", 0.35),
              backdropFilter: "blur(6px)",
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                bgcolor: alpha(theme.palette.error.main, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <DeleteIcon sx={{ fontSize: 28, color: "error.main" }} />
            </Box>
            <Typography variant="h6" fontWeight={700} fontSize="1rem" lineHeight={1.3}>
              {deleteConfirm.scope === "single" ? "Excluir ocorrência" :
               deleteConfirm.scope === "all_future" ? "Excluir esta e futuras" :
               "Excluir toda a série"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, pb: 1 }}>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
            {getDeleteConfirmText()}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1.5 }}>
          <Button
            onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
            disabled={deleteConfirm.isLoading}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              color: "text.secondary",
              bgcolor: alpha(theme.palette.text.secondary, 0.08),
              "&:hover": { bgcolor: alpha(theme.palette.text.secondary, 0.14) },
              px: 2.5,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteConfirm.isLoading}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: `0 4px 12px -2px ${alpha(theme.palette.error.main, 0.4)}`,
              "&:hover": { boxShadow: `0 6px 16px -2px ${alpha(theme.palette.error.main, 0.5)}`, transform: "translateY(-1px)" },
              px: 2.5,
            }}
          >
            {deleteConfirm.isLoading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecurringView;
