import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Checkbox,
  Tooltip,
  LinearProgress,
  Button,
  Collapse,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  alpha,
  Tabs,
  Tab,
  Drawer,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Payments as PaymentsIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarMonthIcon,
  EventRepeat as EventRepeatIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import TransactionTags from "../ui/TransactionTags";
import SearchBar from "../ui/SearchBar";
import { getHeaderCellSx } from "../../utils/tableStyles";
import { Transaction } from "../../types";
import { useLayoutSpacing } from "../../hooks";
import { TOUCH_TARGET_MIN } from "../../layoutConstants";
import { getReportDate } from "../../utils/transactionUtils";
import EmptyState from "../ui/EmptyState";
import NixButton from "../radix/Button";
import { CREATE_TRANSACTION_BUTTON } from "../../constants";
import PaymentMethodIcon from "../ui/PaymentMethodIcon";
import { useSettings } from "../../contexts";
import { hashColor } from "../../utils/imageColorUtils";

interface SplitsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onRefreshData?: () => Promise<void>;
  onUpdateInstallmentDates?: (
    installmentIds: string[],
    newDates: { id: string; date: string }[]
  ) => Promise<boolean>;
}

type SplitStatus = "all" | "in_progress" | "completed";

interface InstallmentGroup {
  key: string;
  installmentGroupId?: string;
  description: string;
  originalDescription: string;
  descriptions: string[];
  category: string;
  paymentMethod: string;
  type: "income" | "expense";
  totalInstallments: number;
  totalAmount: number;
  paidAmount: number;
  paidCount: number;
  installments: Transaction[];
  startDate: string;
  endDate: string;
  isShared?: boolean;
  sharedWith?: string;
  relatedTransactionId?: string;
}

const SplitsView: React.FC<SplitsViewProps> = ({
  transactions,
  onNewTransaction,
  onEdit,
  onDelete,
  onTogglePaid,
  onRefreshData,
  onUpdateInstallmentDates,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { gridSpacing } = useLayoutSpacing();
  const { getPaymentMethodColor, getPaymentMethodConfig } = useSettings();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<SplitStatus>("in_progress");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSharedTab, setSelectedSharedTab] = useState<
    Record<string, number>
  >({});

  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Estado para o Dialog de alteração de datas
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [selectedGroupForDateChange, setSelectedGroupForDateChange] =
    useState<InstallmentGroup | null>(null);
  const [newDueDay, setNewDueDay] = useState<number>(1);
  const [newStartMonth, setNewStartMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [newStartYear, setNewStartYear] = useState<number>(
    new Date().getFullYear()
  );
  const [isUpdatingDates, setIsUpdatingDates] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshData, isRefreshing]);

  // Abre o Dialog para alterar datas das parcelas
  const handleOpenDateDialog = useCallback((group: InstallmentGroup) => {
    setSelectedGroupForDateChange(group);
    // Define valores iniciais baseados na primeira parcela
    const firstInstallment = group.installments[0];
    if (firstInstallment) {
      const [year, month, day] = firstInstallment.date.split("-").map(Number);
      setNewDueDay(day);
      setNewStartMonth(month);
      setNewStartYear(year);
    }
    setDateDialogOpen(true);
  }, []);

  // Fecha o Dialog
  const handleCloseDateDialog = useCallback(() => {
    setDateDialogOpen(false);
    setSelectedGroupForDateChange(null);
    setIsUpdatingDates(false);
  }, []);

  // Calcula as novas datas das parcelas
  const calculateNewDates = useCallback(
    (
      installments: Transaction[],
      dueDay: number,
      startMonth: number,
      startYear: number
    ): { id: string; date: string }[] => {
      const sortedInstallments = [...installments].sort(
        (a, b) => (a.currentInstallment || 1) - (b.currentInstallment || 1)
      );

      return sortedInstallments.map((inst, index) => {
        let targetMonth = startMonth + index;
        let targetYear = startYear;

        // Ajusta ano se passar de dezembro
        while (targetMonth > 12) {
          targetMonth -= 12;
          targetYear += 1;
        }

        // Ajusta o dia para o último dia do mês se necessário
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        const adjustedDay = Math.min(dueDay, daysInMonth);

        const newDate = `${targetYear}-${String(targetMonth).padStart(
          2,
          "0"
        )}-${String(adjustedDay).padStart(2, "0")}`;

        return { id: inst.id, date: newDate };
      });
    },
    []
  );

  // Salva as novas datas
  const handleSaveDates = useCallback(async () => {
    if (!selectedGroupForDateChange || !onUpdateInstallmentDates) return;

    setIsUpdatingDates(true);
    try {
      const newDates = calculateNewDates(
        selectedGroupForDateChange.installments,
        newDueDay,
        newStartMonth,
        newStartYear
      );

      const installmentIds = selectedGroupForDateChange.installments.map(
        (i) => i.id
      );
      await onUpdateInstallmentDates(installmentIds, newDates);

      handleCloseDateDialog();

      // Refresh data após atualização
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (error) {
      console.error("Erro ao atualizar datas:", error);
    } finally {
      setIsUpdatingDates(false);
    }
  }, [
    selectedGroupForDateChange,
    onUpdateInstallmentDates,
    newDueDay,
    newStartMonth,
    newStartYear,
    calculateNewDates,
    handleCloseDateDialog,
    onRefreshData,
  ]);

  // Preview das novas datas
  const previewDates = useMemo(() => {
    if (!selectedGroupForDateChange) return [];
    return calculateNewDates(
      selectedGroupForDateChange.installments,
      newDueDay,
      newStartMonth,
      newStartYear
    );
  }, [
    selectedGroupForDateChange,
    newDueDay,
    newStartMonth,
    newStartYear,
    calculateNewDates,
  ]);

  // IDs de transações relacionadas
  const relatedTransactionIds = useMemo(() => {
    const ids = new Set<string>();
    transactions
      .filter(
        (t) =>
          t.installments &&
          t.installments > 1 &&
          t.isShared &&
          t.relatedTransactionId
      )
      .forEach((t) => {
        if (t.relatedTransactionId) ids.add(t.relatedTransactionId);
      });
    return ids;
  }, [transactions]);

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

  // Filtra apenas transações com parcelas
  const splitsTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.installments && t.installments > 1)
      .filter((t) => !relatedTransactionIds.has(t.id));
  }, [transactions, relatedTransactionIds]);

  // Agrupa transações por installmentGroupId
  const groupedSplits = useMemo(() => {
    const groups: Map<string, InstallmentGroup> = new Map();

    splitsTransactions.forEach((t) => {
      const key = t.installmentGroupId
        ? t.installmentGroupId
        : `${t.description}-${t.paymentMethod}-${t.category}-${t.type}-${t.installments}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          installmentGroupId: t.installmentGroupId,
          description: t.description,
          originalDescription: t.description,
          descriptions: [t.description],
          category: t.category,
          paymentMethod: t.paymentMethod,
          type: t.type,
          totalInstallments: t.installments!,
          totalAmount: 0,
          paidAmount: 0,
          paidCount: 0,
          installments: [],
          startDate: t.date,
          endDate: t.date,
          isShared: t.isShared,
          sharedWith: t.sharedWith,
          relatedTransactionId: t.relatedTransactionId,
        });
      }

      const group = groups.get(key)!;
      group.installments.push(t);
      group.totalAmount += t.amount;

      if (!group.descriptions.includes(t.description)) {
        group.descriptions.push(t.description);
      }

      if (t.isPaid !== false) {
        group.paidAmount += t.amount;
        group.paidCount++;
      }

      if (t.date < group.startDate) group.startDate = t.date;
      if (t.date > group.endDate) group.endDate = t.date;
    });

    // Ordena parcelas e encontra descrição principal
    groups.forEach((group) => {
      group.installments.sort((a, b) => {
        const installmentDiff =
          (a.currentInstallment || 1) - (b.currentInstallment || 1);
        if (installmentDiff !== 0) return installmentDiff;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      const descriptionCounts = new Map<string, number>();
      group.installments.forEach((inst) => {
        descriptionCounts.set(
          inst.description,
          (descriptionCounts.get(inst.description) || 0) + 1
        );
      });

      let maxCount = 0;
      let originalDesc = group.installments[0]?.description || "";
      descriptionCounts.forEach((count, desc) => {
        if (count > maxCount) {
          maxCount = count;
          originalDesc = desc;
        }
      });
      group.originalDescription = originalDesc;
      group.description = originalDesc;
    });

    return Array.from(groups.values());
  }, [splitsTransactions]);

  // Filtra os grupos
  const filteredGroups = useMemo(() => {
    return groupedSplits
      .filter((group) => {
        const matchesSearch =
          group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || group.type === filterType;

        // Usa o número real de parcelas existentes para determinar se está completo
        const actualInstallmentCount = group.installments.length;
        const isCompleted = group.paidCount >= actualInstallmentCount;
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "in_progress" && !isCompleted) ||
          (filterStatus === "completed" && isCompleted);

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
  }, [groupedSplits, searchTerm, filterType, filterStatus]);

  const SPLITS_VIRTUALIZE_THRESHOLD = 30;
  const splitsListRef = useRef<HTMLDivElement>(null);
  const splitsVirtualizer = useVirtualizer({
    count: filteredGroups.length,
    getScrollElement: () => splitsListRef.current,
    estimateSize: () => 180,
    overscan: 3,
    enabled: filteredGroups.length > SPLITS_VIRTUALIZE_THRESHOLD,
  });

  // Estatísticas
  const stats = useMemo(() => {
    // Usa o número real de parcelas existentes para determinar status
    const inProgressGroups = groupedSplits.filter(
      (g) => g.paidCount < g.installments.length
    );
    const completedGroups = groupedSplits.filter(
      (g) => g.paidCount >= g.installments.length
    );

    const totalRemaining = inProgressGroups.reduce(
      (sum, g) => sum + (g.totalAmount - g.paidAmount),
      0
    );
    const totalPaid = groupedSplits.reduce((sum, g) => sum + g.paidAmount, 0);
    const totalAll = groupedSplits.reduce((sum, g) => sum + g.totalAmount, 0);

    return {
      inProgressCount: inProgressGroups.length,
      completedCount: completedGroups.length,
      totalRemaining,
      totalPaid,
      totalAll,
    };
  }, [groupedSplits]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDateShort = (dateString: string) => {
    const [year, month] = dateString.split("-");
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
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const formatDateFull = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isCurrentMonth = (dateString: string) => {
    const today = new Date();
    const [year, month] = dateString.split("-").map(Number);
    return year === today.getFullYear() && month === today.getMonth() + 1;
  };

  const getPeriod = (dateString: string) => {
    const [year, month] = dateString.split("-");
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
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // =============================================
  // CARD COMPONENT - Design alinhado
  // =============================================
  const renderInstallmentCard = (group: InstallmentGroup) => {
    const isExpanded = expandedGroups.has(group.key);
    // Usa o número real de parcelas existentes para calcular progresso e status
    const actualInstallmentCount = group.installments.length;
    const isCompleted = group.paidCount >= actualInstallmentCount;
    const progress =
      actualInstallmentCount > 0
        ? (group.paidCount / actualInstallmentCount) * 100
        : 0;
    const isIncome = group.type === "income";

    const palette = getPaymentMethodColor(group.paymentMethod);
    const accentColor = isIncome ? "#059669" : palette.primary;

    // Transações relacionadas (shared)
    const relatedTransactions = group.installments
      .map((inst) => getRelatedTransaction(inst))
      .filter((t): t is Transaction => t !== null);

    return (
      <Grid key={group.key} size={{ xs: 12, sm: 6, lg: 4 }}>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRadius: "16px",
            cursor: "default",
            background: isDarkMode ? alpha(theme.palette.background.paper, 0.7) : alpha("#fff", 0.95),
            border: `1.5px solid ${alpha(accentColor, isDarkMode ? 0.45 : 0.25)}`,
            transition: "all 0.2s ease-in-out",
            overflow: "hidden",
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: `0 10px 28px -6px ${alpha(accentColor, 0.3)}`,
              border: `1.5px solid ${alpha(accentColor, 0.65)}`,
            },
          }}
        >
          {/* Main content — clickable for expand */}
          <Box sx={{ p: 2.5, flex: 1 }} onClick={() => toggleGroup(group.key)} style={{ cursor: "pointer" }}>
            {/* Header row */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                <PaymentMethodIcon
                  imageUrl={getPaymentMethodConfig(group.paymentMethod)?.imageUrl}
                  colors={palette}
                  size={36}
                  borderRadius="10px"
                  iconSize={18}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Tooltip title={group.description}>
                    <Typography
                      fontWeight={700}
                      sx={{ fontSize: 14, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {group.description}
                    </Typography>
                  </Tooltip>
                  {group.descriptions.length > 1 && (
                    <Chip label={`+${group.descriptions.length - 1}`} size="small" color="info" variant="outlined" sx={{ height: 16, fontSize: 10, mt: 0.25 }} />
                  )}
                </Box>
              </Box>
              <Chip
                icon={isCompleted ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : <ScheduleIcon sx={{ fontSize: 13 }} />}
                label={`${group.paidCount}/${actualInstallmentCount}x`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: "8px",
                  flexShrink: 0,
                  ml: 1,
                  bgcolor: isCompleted ? alpha("#059669", isDarkMode ? 0.2 : 0.1) : alpha("#F59E0B", isDarkMode ? 0.2 : 0.1),
                  color: isCompleted ? "#059669" : "#F59E0B",
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            </Box>

            {/* Amount section */}
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.5 }}>
                {group.category}
              </Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, color: isIncome ? "#10b981" : "text.primary" }}>
                {isIncome ? "+" : "-"}{formatCurrency(group.totalAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {formatDateShort(group.startDate)} → {formatDateShort(group.endDate)}
                {!isCompleted && ` · Restante: ${formatCurrency(group.totalAmount - group.paidAmount)}`}
              </Typography>
            </Box>

            {/* Progress bar */}
            <Box sx={{ mb: relatedTransactions.length > 0 ? 1.5 : 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{group.paymentMethod}</Typography>
                <Typography variant="caption" fontWeight={600} color={accentColor}>{Math.round(progress)}% pago</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: "4px",
                  bgcolor: alpha(accentColor, 0.1),
                  "& .MuiLinearProgress-bar": { borderRadius: "4px", background: `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.7)})` },
                }}
              />
            </Box>

            {/* Shared info */}
            {relatedTransactions.length > 0 && (
              <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: alpha("#059669", 0.08), border: `1px solid ${alpha("#059669", 0.2)}` }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ArrowUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" fontWeight={500}>Compartilhado com {group.sharedWith}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    +{formatCurrency(relatedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0))}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Tags */}
            <TransactionTags
              transaction={{
                isRecurring: false,
                frequency: undefined,
                isVirtual: false,
                installments: undefined,
                currentInstallment: undefined,
                isShared: group.isShared,
                sharedWith: group.sharedWith,
                type: group.type,
                relatedTransactionId: group.relatedTransactionId,
                isPaid: undefined,
              }}
              showRecurring={false}
              showInstallments={false}
            />
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              px: 2.5,
              py: 1.5,
            }}
          >
            <Button
              size="small"
              onClick={(e) => { e.stopPropagation(); toggleGroup(group.key); }}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none", color: "text.secondary", fontSize: 12, p: 0, minWidth: 0, "&:hover": { background: "none", opacity: 0.75 } }}
            >
              {isExpanded ? "Ocultar" : `Ver ${actualInstallmentCount} parcelas`}
            </Button>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {onUpdateInstallmentDates && (
                <Tooltip title="Alterar datas de vencimento">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleOpenDateDialog(group); }}
                    sx={{ width: 28, height: 28, borderRadius: "8px", color: "text.secondary", "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" } }}
                  >
                    <CalendarMonthIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Expanded Content */}
          <Collapse in={isExpanded}>
            <Divider />
            <Box
              sx={{
                p: isMobile ? 2 : 2.5,
                bgcolor: alpha(theme.palette.background.default, 0.5),
              }}
            >
            {/* Tabs for shared transactions */}
            {relatedTransactions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Tabs
                  value={selectedSharedTab[group.key] || 0}
                  onChange={(_, newValue) =>
                    setSelectedSharedTab((prev) => ({
                      ...prev,
                      [group.key]: newValue,
                    }))
                  }
                  variant="fullWidth"
                  sx={{
                    bgcolor: alpha(theme.palette.action.hover, 0.04),
                    borderRadius: "10px",
                    p: 0.5,
                    minHeight: TOUCH_TARGET_MIN,
                    "& .MuiTabs-indicator": { display: "none" },
                    "& .MuiTab-root": {
                      minHeight: TOUCH_TARGET_MIN,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      "&.Mui-selected": {
                        bgcolor: isDarkMode
                          ? alpha(theme.palette.primary.main, 0.2)
                          : alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      },
                    },
                  }}
                >
                  <Tab
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <ArrowDownIcon fontSize="small" />
                        Despesa
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <ArrowUpIcon fontSize="small" />
                        Compartilhado
                      </Box>
                    }
                  />
                </Tabs>
              </Box>
            )}

            {/* Tab: Expense Installments */}
            {(selectedSharedTab[group.key] || 0) === 0 && (
              <>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <VisibilityIcon fontSize="small" color="primary" />
                  Todas as {actualInstallmentCount} parcelas
                </Typography>

                {isMobile ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {group.installments.map((t) => {
                      const isPaid = t.isPaid !== false;
                      const isCurrent = isCurrentMonth(getReportDate(t));

                      return (
                        <Paper
                          key={t.id}
                          sx={{
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            opacity: isPaid ? 0.6 : 1,
                            bgcolor:
                              isCurrent && !isPaid
                                ? alpha(theme.palette.primary.main, 0.08)
                                : "background.paper",
                            border:
                              isCurrent && !isPaid
                                ? `2px solid ${theme.palette.primary.main}`
                                : `1px solid ${theme.palette.divider}`,
                            borderRadius: "10px",
                          }}
                        >
                          <Checkbox
                            checked={isPaid}
                            onChange={(e) =>
                              onTogglePaid(t.id, e.target.checked)
                            }
                            size="small"
                            color="success"
                            sx={{ p: 0.5 }}
                          />
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor:
                                isCurrent && !isPaid
                                  ? alpha(theme.palette.primary.main, 0.15)
                                  : alpha(theme.palette.action.hover, 0.1),
                            }}
                          >
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              color={
                                isCurrent && !isPaid
                                  ? "primary.main"
                                  : "text.secondary"
                              }
                              sx={{ fontSize: 10 }}
                            >
                              #{t.currentInstallment}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={isCurrent ? 600 : 500}
                              sx={{
                                textDecoration: isPaid
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              {formatDateFull(t.date)}
                            </Typography>
                            {isCurrent && !isPaid && (
                              <Chip
                                label="Atual"
                                size="small"
                                color="primary"
                                sx={{ height: 16, fontSize: 9, mt: 0.5 }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={isIncome ? "success.main" : "warning.main"}
                            sx={{ fontFamily: "monospace", fontSize: 12 }}
                          >
                            {formatCurrency(t.amount || 0)}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileActionAnchor({
                                element: e.currentTarget,
                                transaction: t,
                              });
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      );
                    })}
                  </Box>
                ) : (
                  <Table size="small" sx={{ "& td, & th": { py: 1 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={getHeaderCellSx(theme, isDarkMode)}
                          padding="checkbox"
                        >
                          Pago
                        </TableCell>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>
                          #
                        </TableCell>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>
                          Data
                        </TableCell>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>
                          Período
                        </TableCell>
                        <TableCell
                          sx={{
                            ...getHeaderCellSx(theme, isDarkMode),
                            textAlign: "right",
                          }}
                        >
                          Valor
                        </TableCell>
                        <TableCell
                          sx={{
                            ...getHeaderCellSx(theme, isDarkMode),
                            textAlign: "center",
                          }}
                        >
                          Status
                        </TableCell>
                        <TableCell
                          sx={{
                            ...getHeaderCellSx(theme, isDarkMode),
                            textAlign: "center",
                          }}
                        >
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.installments.map((t) => {
                        const isPaid = t.isPaid !== false;
                        const isCurrent = isCurrentMonth(getReportDate(t));

                        return (
                          <TableRow
                            key={t.id}
                            sx={{
                              opacity: isPaid ? 0.6 : 1,
                              bgcolor:
                                isCurrent && !isPaid
                                  ? alpha(theme.palette.primary.main, 0.08)
                                  : "transparent",
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isPaid}
                                onChange={(e) =>
                                  onTogglePaid(t.id, e.target.checked)
                                }
                                size="small"
                                color="success"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`#${t.currentInstallment}`}
                                size="small"
                                variant="outlined"
                                color={
                                  isCurrent && !isPaid ? "primary" : "default"
                                }
                                sx={{ fontWeight: 600, height: 22 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                fontWeight={isCurrent ? 600 : 400}
                              >
                                {formatDateFull(t.date)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {getPeriod(t.date)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color={
                                  isIncome ? "success.main" : "warning.main"
                                }
                              >
                                {formatCurrency(t.amount || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {isPaid ? (
                                <Chip
                                  label="Pago"
                                  size="small"
                                  color="success"
                                  sx={{ height: 22 }}
                                />
                              ) : isCurrent ? (
                                <Chip
                                  label="Atual"
                                  size="small"
                                  color="primary"
                                  sx={{ height: 22 }}
                                />
                              ) : (
                                <Chip
                                  label="Pendente"
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, opacity: 0.7 }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => onEdit(t)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir">
                                <IconButton
                                  size="small"
                                  onClick={() => onDelete(t.id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                {/* Summary */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mt: 2,
                    borderRadius: "12px",
                    bgcolor: alpha(accentColor, 0.05),
                    border: `1px solid ${alpha(accentColor, 0.15)}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        Resumo do Parcelamento
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {group.paidCount}/{actualInstallmentCount} parcelas
                        pagas
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Restante:{" "}
                        {formatCurrency(group.totalAmount - group.paidAmount)}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={isIncome ? "success.main" : "warning.main"}
                      >
                        Total: {formatCurrency(group.totalAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </>
            )}

            {/* Tab: Shared (related income) */}
            {(selectedSharedTab[group.key] || 0) === 1 &&
              relatedTransactions.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <VisibilityIcon fontSize="small" color="success" />
                    Parcelas Compartilhadas
                  </Typography>

                  {isMobile ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {relatedTransactions.map((t) => {
                        const isPaid = t.isPaid !== false;
                        const isCurrent = isCurrentMonth(getReportDate(t));

                        return (
                          <Paper
                            key={t.id}
                            sx={{
                              p: 1.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              opacity: isPaid ? 0.6 : 1,
                              bgcolor:
                                isCurrent && !isPaid
                                  ? alpha(theme.palette.success.main, 0.08)
                                  : "background.paper",
                              border:
                                isCurrent && !isPaid
                                  ? `2px solid ${theme.palette.success.main}`
                                  : `1px solid ${theme.palette.divider}`,
                              borderRadius: "10px",
                            }}
                          >
                            <Checkbox
                              checked={isPaid}
                              onChange={(e) =>
                                onTogglePaid(t.id, e.target.checked)
                              }
                              size="small"
                              color="success"
                              sx={{ p: 0.5 }}
                            />
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor:
                                  isCurrent && !isPaid
                                    ? alpha(theme.palette.success.main, 0.15)
                                    : alpha(theme.palette.action.hover, 0.1),
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                color={
                                  isCurrent && !isPaid
                                    ? "success.main"
                                    : "text.secondary"
                                }
                                sx={{ fontSize: 10 }}
                              >
                                #{t.currentInstallment}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body2"
                                fontWeight={isCurrent ? 600 : 500}
                              >
                                {formatDateFull(t.date)}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="success.main"
                              sx={{ fontFamily: "monospace", fontSize: 12 }}
                            >
                              +{formatCurrency(t.amount || 0)}
                            </Typography>
                            <Chip
                              label={isPaid ? "Recebido" : "Pendente"}
                              size="small"
                              color={isPaid ? "success" : "warning"}
                              sx={{ height: 20, fontSize: 10 }}
                            />
                          </Paper>
                        );
                      })}
                    </Box>
                  ) : (
                    <Table size="small" sx={{ "& td, & th": { py: 1 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={getHeaderCellSx(theme, isDarkMode)}
                            padding="checkbox"
                          >
                            Recebido
                          </TableCell>
                          <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>
                            #
                          </TableCell>
                          <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>
                            Data
                          </TableCell>
                          <TableCell
                            sx={{
                              ...getHeaderCellSx(theme, isDarkMode),
                              textAlign: "right",
                            }}
                          >
                            Valor
                          </TableCell>
                          <TableCell
                            sx={{
                              ...getHeaderCellSx(theme, isDarkMode),
                              textAlign: "center",
                            }}
                          >
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relatedTransactions.map((t) => {
                          const isPaid = t.isPaid !== false;
                          const isCurrent = isCurrentMonth(getReportDate(t));

                          return (
                            <TableRow
                              key={t.id}
                              sx={{
                                opacity: isPaid ? 0.6 : 1,
                                bgcolor:
                                  isCurrent && !isPaid
                                    ? alpha(theme.palette.success.main, 0.08)
                                    : "transparent",
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={isPaid}
                                  onChange={(e) =>
                                    onTogglePaid(t.id, e.target.checked)
                                  }
                                  size="small"
                                  color="success"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`#${t.currentInstallment}`}
                                  size="small"
                                  variant="outlined"
                                  color={
                                    isCurrent && !isPaid ? "success" : "default"
                                  }
                                  sx={{ fontWeight: 600, height: 22 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  fontWeight={isCurrent ? 600 : 400}
                                >
                                  {formatDateFull(t.date)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="success.main"
                                >
                                  +{formatCurrency(t.amount || 0)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={
                                    isPaid
                                      ? "Recebido"
                                      : isCurrent
                                      ? "Atual"
                                      : "Pendente"
                                  }
                                  size="small"
                                  color={
                                    isPaid
                                      ? "success"
                                      : isCurrent
                                      ? "warning"
                                      : "default"
                                  }
                                  variant={
                                    isPaid || isCurrent ? "filled" : "outlined"
                                  }
                                  sx={{ height: 22 }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mt: 2,
                      borderRadius: "12px",
                      bgcolor: alpha("#059669", 0.05),
                      border: `1px solid ${alpha("#059669", 0.15)}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {relatedTransactions.filter((t) => t.isPaid).length}/
                        {relatedTransactions.length} parcelas recebidas
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color="success.main"
                      >
                        +
                        {formatCurrency(
                          relatedTransactions.reduce(
                            (sum, t) => sum + (t.amount || 0),
                            0
                          )
                        )}
                      </Typography>
                    </Box>
                  </Paper>
                </>
              )}
            </Box>
          </Collapse>
        </Paper>
      </Grid>
    );
  };

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
            Splits
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Manage your installment purchases
          </Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
          >
            {isMobile ? "Nova" : "Nova compra"}
          </Button>
          {onRefreshData && (
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{ width: 38, height: 38, borderRadius: "10px", border: `1px solid`, borderColor: "divider" }}
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
              <ScheduleIcon sx={{ color: "#F59E0B", fontSize: 20 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Em Andamento
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight={700}
              color="#F59E0B"
            >
              {stats.inProgressCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              parcelamentos ativos
            </Typography>
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
              <CheckCircleIcon sx={{ color: "#059669", fontSize: 20 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Concluídos
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight={700}
              color="#059669"
            >
              {stats.completedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              parcelamentos quitados
            </Typography>
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
              <TrendingDownIcon sx={{ color: "#DC2626", fontSize: 20 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                A Pagar
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              fontWeight={700}
              color="#DC2626"
            >
              {formatCurrency(stats.totalRemaining)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              restante total
            </Typography>
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
              <CheckCircleIcon
                sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }}
              />
              <Typography
                variant="caption"
                sx={{ color: alpha("#FFFFFF", 0.8) }}
                fontWeight={600}
              >
                Total Pago
              </Typography>
            </Box>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              fontWeight={700}
              color="#FFFFFF"
            >
              {formatCurrency(stats.totalPaid)}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.7) }}>
              de {formatCurrency(stats.totalAll)}
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

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            flex: 1,
            alignItems: "center",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e: SelectChangeEvent) =>
                setFilterStatus(e.target.value as SplitStatus)
              }
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="in_progress">Em Andamento</MenuItem>
              <MenuItem value="completed">Concluídos</MenuItem>
            </Select>
          </FormControl>

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

        </Box>
      </Paper>

      {/* Installment Groups */}
      {filteredGroups.length > 0 ? (
        filteredGroups.length > SPLITS_VIRTUALIZE_THRESHOLD ? (
          <Box ref={splitsListRef} sx={{ maxHeight: "70vh", overflow: "auto" }}>
            <Box sx={{ height: splitsVirtualizer.getTotalSize(), position: "relative" }}>
              {splitsVirtualizer.getVirtualItems().map((virtualRow) => (
                <Box
                  key={filteredGroups[virtualRow.index].key}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    pb: 2,
                  }}
                >
                  {renderInstallmentCard(filteredGroups[virtualRow.index])}
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
        <Grid container spacing={gridSpacing}>
          {filteredGroups.map((group) => renderInstallmentCard(group))}
        </Grid>
        )
      ) : (
        <EmptyState
          type="recurring"
          title="Nenhum parcelamento encontrado"
          description="Crie uma transação parcelada para gerenciá-la aqui"
          compact
        />
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
            if (mobileActionAnchor.transaction)
              onEdit(mobileActionAnchor.transaction);
            setMobileActionAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileActionAnchor.transaction)
              onDelete(mobileActionAnchor.transaction.id);
            setMobileActionAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>


      {/* Painel lateral para alterar datas de vencimento */}
      <Drawer
        anchor="right"
        open={dateDialogOpen}
        onClose={handleCloseDateDialog}
        PaperProps={{
          sx: {
            width: isMobile ? "100vw" : 520,
            maxWidth: "100vw",
            bgcolor: isDarkMode ? theme.palette.background.default : "#FAFBFC",
            backgroundImage: "none",
            borderLeft: `1px solid ${
              isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)
            }`,
            boxShadow: isDarkMode
              ? `-24px 0 80px -20px ${alpha("#000000", 0.5)}`
              : `-24px 0 80px -20px ${alpha(theme.palette.primary.main, 0.12)}`,
            display: "flex",
            flexDirection: "column",
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: isDarkMode
                ? alpha("#000000", 0.5)
                : alpha("#000000", 0.25),
              backdropFilter: "blur(4px)",
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    isDarkMode ? 0.15 : 0.1
                  ),
                  color: "primary.main",
                }}
              >
                <EventRepeatIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Alterar Datas de Vencimento
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 280 }}
                  noWrap
                >
                  {selectedGroupForDateChange?.description}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleCloseDateDialog}
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "text.primary",
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Info Card */}
          <Box
            sx={{
              p: 2,
              borderRadius: "16px",
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Configure o dia de vencimento e o mês de início para recalcular as
              datas de todas as{" "}
              <Typography
                component="span"
                fontWeight={600}
                color="primary.main"
              >
                {selectedGroupForDateChange?.totalInstallments} parcelas
              </Typography>
              .
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Content - Scrollable */}
        <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
          <Stack spacing={3}>
            {/* Dia de vencimento */}
            <FormControl fullWidth>
              <InputLabel>Dia de Vencimento</InputLabel>
              <Select
                value={newDueDay}
                label="Dia de Vencimento"
                onChange={(e) => setNewDueDay(Number(e.target.value))}
                sx={{ borderRadius: "12px" }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <MenuItem key={day} value={day}>
                    Dia {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Mês de início */}
            <FormControl fullWidth>
              <InputLabel>Mês de Início</InputLabel>
              <Select
                value={newStartMonth}
                label="Mês de Início"
                onChange={(e) => setNewStartMonth(Number(e.target.value))}
                sx={{ borderRadius: "12px" }}
              >
                <MenuItem value={1}>Janeiro</MenuItem>
                <MenuItem value={2}>Fevereiro</MenuItem>
                <MenuItem value={3}>Março</MenuItem>
                <MenuItem value={4}>Abril</MenuItem>
                <MenuItem value={5}>Maio</MenuItem>
                <MenuItem value={6}>Junho</MenuItem>
                <MenuItem value={7}>Julho</MenuItem>
                <MenuItem value={8}>Agosto</MenuItem>
                <MenuItem value={9}>Setembro</MenuItem>
                <MenuItem value={10}>Outubro</MenuItem>
                <MenuItem value={11}>Novembro</MenuItem>
                <MenuItem value={12}>Dezembro</MenuItem>
              </Select>
            </FormControl>

            {/* Ano de início */}
            <FormControl fullWidth>
              <InputLabel>Ano de Início</InputLabel>
              <Select
                value={newStartYear}
                label="Ano de Início"
                onChange={(e) => setNewStartYear(Number(e.target.value))}
                sx={{ borderRadius: "12px" }}
              >
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - 2 + i
                ).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Preview das novas datas */}
            {previewDates.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <VisibilityIcon fontSize="small" color="primary" />
                  Prévia das Novas Datas
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    maxHeight: 300,
                    overflow: "auto",
                    borderRadius: "16px",
                    bgcolor: isDarkMode
                      ? alpha(theme.palette.background.paper, 0.5)
                      : alpha("#FFFFFF", 0.8),
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                          Parcela
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                          Data Atual
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                          Nova Data
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedGroupForDateChange?.installments
                        .sort(
                          (a, b) =>
                            (a.currentInstallment || 1) -
                            (b.currentInstallment || 1)
                        )
                        .map((inst, idx) => {
                          const preview = previewDates[idx];
                          const currentDate = inst.date;
                          const hasChanged = currentDate !== preview?.date;

                          return (
                            <TableRow key={inst.id}>
                              <TableCell>
                                <Chip
                                  label={`#${inst.currentInstallment}`}
                                  size="small"
                                  variant="outlined"
                                  color={hasChanged ? "primary" : "default"}
                                  sx={{ height: 22, fontSize: 11 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    textDecoration: hasChanged
                                      ? "line-through"
                                      : "none",
                                    fontSize: 12,
                                  }}
                                >
                                  {formatDateFull(currentDate)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  fontWeight={hasChanged ? 600 : 400}
                                  color={
                                    hasChanged
                                      ? "primary.main"
                                      : "text.secondary"
                                  }
                                  sx={{ fontSize: 12 }}
                                >
                                  {preview ? formatDateFull(preview.date) : "-"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Footer */}
        <Divider />
        <Box
          sx={{
            p: 3,
            display: "flex",
            gap: 2,
            justifyContent: "flex-end",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.paper, 0.5)
              : alpha("#FFFFFF", 0.8),
          }}
        >
          <NixButton
            size="medium"
            variant="soft"
            color="gray"
            onClick={handleCloseDateDialog}
            disabled={isUpdatingDates}
          >
            Cancelar
          </NixButton>
          <NixButton
            size="medium"
            variant="solid"
            color="purple"
            onClick={handleSaveDates}
            disabled={isUpdatingDates || !onUpdateInstallmentDates}
          >
            {isUpdatingDates ? (
              "Atualizando..."
            ) : (
              <>
                <CalendarMonthIcon /> Salvar Alterações
              </>
            )}
          </NixButton>
        </Box>
      </Drawer>
    </Box>
  );
};

export default SplitsView;
