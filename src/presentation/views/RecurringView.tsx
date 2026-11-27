import { categoryLabel } from "@/shared/i18n/labels";
import { getRecurringMonthTransactions, getRecurringOccurrenceId, getRecurringOccurrenceValue } from "@/domain/usecases/recurringUtils";
import NixButton from "@/presentation/components/radix/Button";
import React, { useState, useMemo, useCallback } from "react";
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
  FormControl,
  TableCell,
  TableRow,
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
import TransactionOptionsPanel, { ActionType, OptionType } from "@/presentation/panels/TransactionOptionsPanel";
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
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import SearchBar from "@/presentation/components/ui/SearchBar";
import type { FilterState, PaymentMethodConfig, Transaction } from "@/domain/entities";
import { useSettings } from "@/presentation/contexts";
import PaymentMethodIcon from "@/presentation/components/ui/PaymentMethodIcon";
import PaymentMethodImagePicker from "@/presentation/components/ui/PaymentMethodImagePicker";
import { extractDominantColor, hashColor } from "@/shared/utils/imageColorUtils";
import { Image as ImageIcon } from "@mui/icons-material";
import { orbitColors } from "@/shared/theme/colors";
import { formatCurrency } from "@/shared/utils/formatters";
import { OverviewBreakdown, OverviewHeader, OverviewStatCard, overviewPageStyles, overviewStatGridStyles } from "@/presentation/widgets/FinancialOverview";
import { OverviewRowTitle, OverviewTable, overviewDesktopCell, overviewMoneyCell } from "@/presentation/widgets/FinancialOverviewTable";

interface RecurringViewProps {
  transactions: Transaction[];
  period: FilterState;
  paymentMethodConfigs: PaymentMethodConfig[];
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
  period,
  paymentMethodConfigs,
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
        return `Todas as ocorrências passadas e futuras de ${name} serão excluídas. Essa ação não pode ser desfeita.`;
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
      annualizedIncome,
      annualizedBalance: annualizedIncome - annualizedExpense,
      incomeCount: recurring.filter((t) => t.type === "income").length,
      expenseCount: recurring.filter((t) => t.type === "expense").length,
    };
  }, [transactions]);

  const monthStats = useMemo(() => {
    const categoryExpenses = new Map<string, number>();
    let income = 0;
    let expense = 0;

    for (const transaction of getRecurringMonthTransactions(transactions, period, paymentMethodConfigs)) {
      const cents = Math.round((transaction.amount || 0) * 100);
      if (transaction.type === "income") {
        income += cents;
      } else {
        expense += cents;
        const label = categoryLabel(transaction.category);
        categoryExpenses.set(label, (categoryExpenses.get(label) ?? 0) + cents);
      }
    }

    return {
      categoryExpenses: Array.from(categoryExpenses, ([label, cents]) => ({ label, value: cents / 100 })),
      income: income / 100,
      expense: expense / 100,
      balance: (income - expense) / 100,
    };
  }, [transactions, period, paymentMethodConfigs]);

  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const getNextOccurrence = (transaction: Transaction): Date => {
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

    return nextDate;
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
      "Maio",
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
    const offsetOccurrence = (date: Date, months: number): Date => {
      const year = date.getFullYear();
      const month = date.getMonth() + months;
      const lastDay = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, Math.min(startDate.getDate(), lastDay));
    };

    const formatLocalDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (transaction.frequency === "monthly") {
      while (nextOccurrence < today) {
        nextOccurrence = offsetOccurrence(nextOccurrence, 1);
      }

      const currentMonthOcc = new Date(nextOccurrence);
      if (
        currentMonthOcc.getMonth() !== today.getMonth() ||
        currentMonthOcc.getFullYear() !== today.getFullYear()
      ) {
        let thisMonthOcc = new Date(startDate);
        while (
          thisMonthOcc.getFullYear() < today.getFullYear() ||
          (thisMonthOcc.getFullYear() === today.getFullYear() &&
            thisMonthOcc.getMonth() < today.getMonth())
        ) {
          thisMonthOcc = offsetOccurrence(thisMonthOcc, 1);
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
        const occDate = offsetOccurrence(nextOccurrence, monthOffset);

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
        nextOccurrence = offsetOccurrence(nextOccurrence, 12);
      }

      const startOccurrenceNumber = pastOccurrencesCount + 1;
      const excludedDatesYearly = transaction.excludedDates || [];
      let yearlyCount = 0;
      let yearOffset = 0;

      while (yearlyCount < 12) {
        const occDate = offsetOccurrence(nextOccurrence, yearOffset * 12);

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

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const createVirtualTransaction = (
    baseTransaction: Transaction,
    occurrence: RecurringOccurrence
  ): Transaction => {
    const stored = getRecurringOccurrenceValue(baseTransaction, occurrence.date);

    return {
      ...baseTransaction,
      id: getRecurringOccurrenceId(baseTransaction.id, occurrence.date),
      date: occurrence.date,
      amount: stored.amount,
      isPaid: stored.isPaid,
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
                {categoryLabel(selectedRecurring.category)} · {selectedRecurring.frequency === "monthly" ? "Mensal" : "Anual"} · {formatCurrency(selectedRecurring.amount || 0)}
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
              <Typography color="text.secondary">Nenhuma ocorrência encontrada</Typography>
            </Box>
          ) : (
            occurrencesList.map((occ, index) => {
              const stored = getRecurringOccurrenceValue(selectedRecurring, occ.date);
              const isPaid = occ.isModified
                ? !!occ.modifiedTransaction?.isPaid
                : stored.isPaid;
              const amount = occ.modifiedTransaction?.amount ?? stored.amount;
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
                          Atual
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
                      label={isPaid ? "Pago" : "Pendente"}
                      size="small"
                      onClick={() => {
                        if (occ.isModified && occ.modifiedTransaction) {
                          onTogglePaid(occ.modifiedTransaction.id, !occ.modifiedTransaction.isPaid);
                        } else {
                          const id = occ.date === selectedRecurring.date
                            ? selectedRecurring.id
                            : getRecurringOccurrenceId(selectedRecurring.id, occ.date);
                          onTogglePaid(id, !isPaid);
                        }
                      }}
                      sx={{
                        height: 24,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: "8px",
                        cursor: "pointer",
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
               deleteConfirm.scope === "all_future" ? "Excluir esta e as futuras" :
               "Excluir a série inteira"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, pb: 1 }}>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
            {getDeleteConfirmText()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <NixButton
            autoFocus
            variant="soft"
            color="gray"
            onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
            disabled={deleteConfirm.isLoading}
          >
            Cancelar
          </NixButton>
          <NixButton
            onClick={handleDeleteConfirm}
            color="red"
            variant="solid"
            disabled={deleteConfirm.isLoading}
          >
            {deleteConfirm.isLoading ? "Excluindo..." : "Excluir"}
          </NixButton>
        </DialogActions>
      </Dialog>
      </>
    );
  }

  // =============================================
  // MAIN RENDER
  // =============================================
  const { palette } = theme;
  const accent = isDarkMode ? orbitColors.lavender : palette.primary.dark;
  const expenseColor = isDarkMode ? palette.error.main : palette.error.dark;
  const incomeColor = isDarkMode ? palette.success.main : palette.success.dark;
  const monthLabel = new Date(period.year, period.month, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <Box sx={overviewPageStyles}>
      <OverviewHeader title="Recorrentes" description="Receitas e despesas que se repetem a cada ciclo"
        actionLabel="Nova recorrência" onAdd={onNewTransaction}
        onRefresh={onRefreshData ? handleRefresh : undefined} refreshing={isRefreshing}
      />
      <Box sx={overviewStatGridStyles}>
        <OverviewStatCard title="Recorrências" value={stats.total} caption={`${stats.incomeCount} ${stats.incomeCount === 1 ? "receita" : "receitas"} · ${stats.expenseCount} ${stats.expenseCount === 1 ? "despesa" : "despesas"}`} icon={<RepeatIcon fontSize="small" />} color={accent} />
        <OverviewStatCard title="Despesas do mês" value={formatCurrency(monthStats.expense)} caption={monthLabel} icon={<TrendingDownIcon fontSize="small" />} color={expenseColor} />
        <OverviewStatCard title="Saldo estimado do mês" value={formatCurrency(monthStats.balance)} caption={`Entradas de ${formatCurrency(monthStats.income)}`} icon={<TrendingUpIcon fontSize="small" />} color={monthStats.balance >= 0 ? incomeColor : expenseColor} />
        <OverviewStatCard title="Saldo anual estimado" value={formatCurrency(stats.annualizedBalance)} caption={`Entradas de ${formatCurrency(stats.annualizedIncome)}`} icon={<CalendarIcon fontSize="small" />} color={stats.annualizedBalance >= 0 ? incomeColor : expenseColor} />
      </Box>
      <OverviewBreakdown
        data={monthStats.categoryExpenses} total={monthStats.expense}
        title="Distribuição das despesas recorrentes"
        description={`Ocorrências de ${monthLabel}`}
        comparisonTitle="Despesas por categoria"
        comparisonDescription={`Despesas recorrentes de ${monthLabel} (R$)`}
        emptyMessage="Sem despesas recorrentes no mês selecionado."
        valueLabel="Despesas do mês"
        renderInsight={(label, share) => <><strong>{label}</strong> concentra {share} das despesas recorrentes do mês.</>}
      />
      <OverviewTable
        title="Transações recorrentes" description="Abra uma série para consultar suas ocorrências" icon={<RepeatIcon fontSize="small" />}
        filters={
          <>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar..."
              minWidth={180}
            />

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel id="recurring-filter-type">Tipo</InputLabel>
              <Select
                labelId="recurring-filter-type"
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
              <InputLabel id="recurring-filter-frequency">Frequência</InputLabel>
              <Select
                labelId="recurring-filter-frequency"
                value={filterFrequency}
                label="Frequência"
                onChange={(e: SelectChangeEvent) =>
                  setFilterFrequency(
                    e.target.value as "all" | "monthly" | "yearly"
                  )
                }
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="monthly">Mensal</MenuItem>
                <MenuItem value="yearly">Anual</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="recurring-filter-category">Categoria</InputLabel>
              <Select
                labelId="recurring-filter-category"
                value={filterCategory}
                label="Categoria"
                onChange={(e: SelectChangeEvent) =>
                  setFilterCategory(e.target.value)
                }
              >
                <MenuItem value="all">Todos</MenuItem>
                {allCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {categoryLabel(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        }
        filterKey={JSON.stringify([searchTerm, filterType, filterFrequency, filterCategory])}
        rows={recurringTransactions}
        emptyMessage="Nenhuma transação recorrente encontrada."
        columns={[
          { title: "Transação", sortBy: (transaction) => transaction.description },
          { title: "Frequência", desktopOnly: true, sortBy: (transaction) => transaction.frequency ?? "" },
          { title: "Próxima", desktopOnly: true, sortBy: (transaction) => getNextOccurrence(transaction).getTime() },
          { title: "Valor", sortBy: (transaction) => transaction.type === "income" ? transaction.amount : -transaction.amount },
          { title: "Ações" },
        ]}
        renderRow={(transaction, index) => {
          const isIncome = transaction.type === "income";
          const frequency = transaction.frequency === "monthly" ? "Mensal" : transaction.frequency === "yearly" ? "Anual" : "—";
          const colors = getSubscriptionColor(transaction.description) ?? hashColor(transaction.description);
          const openOccurrences = () => setSelectedRecurringId(transaction.id);
          return (
            <TableRow key={transaction.id} className="overview-row" data-striped={index % 2 === 1} onClick={openOccurrences} sx={{ cursor: "pointer" }}>
              <TableCell className="overview-cell" component="th" scope="row">
                <OverviewRowTitle
                  title={transaction.description}
                  subtitle={categoryLabel(transaction.category)}
                  mobileDetail={frequency}
                  icon={<PaymentMethodIcon imageUrl={getSubscriptionImage(transaction.description)} colors={colors} size={29} borderRadius="6px" iconSize={16} />}
                  onClick={openOccurrences}
                />
              </TableCell>
              <TableCell className="overview-cell" sx={overviewDesktopCell}>{frequency}</TableCell>
              <TableCell className="overview-cell" sx={overviewDesktopCell}>{getNextOccurrence(transaction).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</TableCell>
              <TableCell className="overview-cell" sx={{ ...overviewMoneyCell, color: isIncome ? incomeColor : "text.primary" }}>
                {formatCurrency(isIncome ? transaction.amount : -transaction.amount)}
                <Typography display="block" variant="caption" color="text.secondary">{transaction.isPaid ? "Pago" : "Pendente"}</Typography>
              </TableCell>
              <TableCell className="overview-cell" align="right">
                <IconButton
                  size="small" aria-label={`Ações de ${transaction.description}`} aria-haspopup="menu"
                  aria-expanded={mobileMenuAnchor.transaction?.id === transaction.id}
                  sx={{ width: { xs: 44, sm: 30 }, height: { xs: 44, sm: 30 } }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMobileMenuAnchor({ element: event.currentTarget, transaction });
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        }}
      />

      {/* Ações da série */}
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
              ? "Marcar como pendente"
              : "Marcar como pago"}
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
            const transaction = mobileMenuAnchor.transaction;
            setMobileMenuAnchor({ element: null, transaction: null });
            if (transaction) {
              setImgPickerTarget(transaction.description);
              setImgPickerOpen(true);
            }
          }}
        >
          <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Alterar imagem</ListItemText>
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
                ? "Marcar como pendente"
                : "Marcar como pago"}
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
               deleteConfirm.scope === "all_future" ? "Excluir esta e as futuras" :
               "Excluir a série inteira"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, pb: 1 }}>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
            {getDeleteConfirmText()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <NixButton
            autoFocus
            variant="soft"
            color="gray"
            onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
            disabled={deleteConfirm.isLoading}
          >
            Cancelar
          </NixButton>
          <NixButton
            onClick={handleDeleteConfirm}
            color="red"
            variant="solid"
            disabled={deleteConfirm.isLoading}
          >
            {deleteConfirm.isLoading ? "Excluindo..." : "Excluir"}
          </NixButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecurringView;
