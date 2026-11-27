import { categoryLabel, paymentMethodLabel } from "@/shared/i18n/labels";
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
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Checkbox,
  Tooltip,
  LinearProgress,
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
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Payments as PaymentsIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarMonthIcon,
  EventRepeat as EventRepeatIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import SearchBar from "@/presentation/components/ui/SearchBar";
import { getHeaderCellSx } from "@/shared/utils/tableStyles";
import { Transaction } from "@/domain/entities";
import { TOUCH_TARGET_MIN } from "@/shared/constants/layout";
import { getReportDate } from "@/domain/usecases/transactionUtils";
import NixButton from "@/presentation/components/radix/Button";
import PaymentMethodIcon from "@/presentation/components/ui/PaymentMethodIcon";
import { useSettings } from "@/presentation/contexts";
import type { InstallmentDateChange } from "@/domain/usecases/transactionUtils";

import { orbitColors } from "@/shared/theme/colors";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";
import { OverviewBreakdown, OverviewHeader, OverviewStatCard, overviewPageStyles, overviewStatGridStyles } from "@/presentation/widgets/FinancialOverview";
import { OverviewRowTitle, OverviewTable, overviewDesktopCell, overviewMoneyCell } from "@/presentation/widgets/FinancialOverviewTable";

interface SplitsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onRefreshData?: () => Promise<void>;
  onUpdateInstallmentDates?: (
    newDates: InstallmentDateChange[]
  ) => Promise<void>;
}

type SplitStatus = "all" | "in_progress" | "completed";

interface InstallmentGroup {
  key: string;
  installmentGroupId?: string;
  description: string;
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
  const isCompactTable = useMediaQuery(theme.breakpoints.down("sm"));
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
  const pendingDateUpdate = useRef(false);

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

  const [dateUpdateError, setDateUpdateError] = useState(false);

  // Fecha o Dialog
  const handleCloseDateDialog = useCallback(() => {
    setDateDialogOpen(false);
    setSelectedGroupForDateChange(null);
    setIsUpdatingDates(false);
    setDateUpdateError(false);
  }, []);

  // Calcula as novas datas das parcelas
  const calculateNewDates = useCallback(
    (
      installments: Transaction[],
      dueDay: number,
      startMonth: number,
      startYear: number
    ): InstallmentDateChange[] => {
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

        return {
          id: inst.id,
          date: newDate,
          previousDate: inst.date,
          previousInvoiceDueDate: inst.invoiceDueDate,
        };
      });
    },
    []
  );

  // Salva as novas datas
  const handleSaveDates = useCallback(async () => {
    if (pendingDateUpdate.current || !selectedGroupForDateChange || !onUpdateInstallmentDates) return;
    pendingDateUpdate.current = true;

    setDateUpdateError(false);
    setIsUpdatingDates(true);
    try {
      const newDates = calculateNewDates(
        selectedGroupForDateChange.installments,
        newDueDay,
        newStartMonth,
        newStartYear
      );

      await onUpdateInstallmentDates(newDates);

      handleCloseDateDialog();
    } catch {
      setDateUpdateError(true);
    } finally {
      pendingDateUpdate.current = false;
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

    const remainingByMethod = new Map<string, number>();
    for (const group of inProgressGroups) {
      const label = paymentMethodLabel(group.paymentMethod);
      const remaining = group.totalAmount - group.paidAmount;
      remainingByMethod.set(label, (remainingByMethod.get(label) ?? 0) + remaining);
    }

    return {
      remainingByMethod: Array.from(remainingByMethod, ([label, value]) => ({ label, value })),
      inProgressCount: inProgressGroups.length,
      completedCount: completedGroups.length,
      totalRemaining,
      totalPaid,
      totalAll,
    };
  }, [groupedSplits]);

  const formatDateShort = (dateString: string) => {
    const [year, month] = dateString.split("-");
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
      "Maio",
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

  const { palette: themePalette } = theme;
  const accent = isDarkMode ? orbitColors.lavender : themePalette.primary.dark;
  const expenseColor = isDarkMode ? themePalette.error.main : themePalette.error.dark;
  const incomeColor = isDarkMode ? themePalette.success.main : themePalette.success.dark;
  const warningColor = isDarkMode ? themePalette.warning.main : themePalette.warning.dark;

  const renderInstallmentRow = (group: InstallmentGroup, index: number) => {
    const isExpanded = expandedGroups.has(group.key);
    const actualInstallmentCount = group.installments.length;
    const isIncome = group.type === "income";
    const colors = getPaymentMethodColor(group.paymentMethod);
    const config = getPaymentMethodConfig(group.paymentMethod);
    const accentColor = isIncome ? incomeColor : colors.primary;
    const relatedTransactions = isExpanded ? group.installments
      .map((installment) => getRelatedTransaction(installment))
      .filter((transaction): transaction is Transaction => transaction !== null) : [];
    const openGroup = () => toggleGroup(group.key);
    const method = paymentMethodLabel(group.paymentMethod);
    const subtitle = group.descriptions.length > 1
      ? `${method} · ${group.descriptions.length} descrições`
      : `${method} · ${categoryLabel(group.category)}`;

    return (
      <React.Fragment key={group.key}>
        <TableRow
          className="overview-row"
          data-striped={index % 2 === 1}
          onClick={openGroup}
          sx={{ cursor: "pointer" }}
        >
          <TableCell className="overview-cell" component="th" scope="row">
            <OverviewRowTitle
              title={group.description}
              subtitle={subtitle}
              icon={<PaymentMethodIcon imageUrl={config?.imageUrl} colors={colors} type={config?.type} size={29} borderRadius="6px" iconSize={16} />}
              expanded={isExpanded}
              onClick={openGroup}
            />
          </TableCell>
          <TableCell className="overview-cell" sx={overviewDesktopCell}>
            {formatDateShort(group.startDate)} — {formatDateShort(group.endDate)}
          </TableCell>
          <TableCell className="overview-cell" sx={overviewDesktopCell}>
            <Stack direction="row" alignItems="center" gap={1}>
              <LinearProgress
                variant="determinate"
                aria-label={`Progresso de ${group.description}`}
                value={group.paidCount / actualInstallmentCount * 100}
                sx={{ flex: 1, height: 8, borderRadius: 8, bgcolor: alpha(accentColor, 0.14), "& .MuiLinearProgress-bar": { bgcolor: accentColor, borderRadius: 8 } }}
              />
              <Typography variant="caption" color="text.secondary">{group.paidCount}/{actualInstallmentCount} pagas</Typography>
            </Stack>
          </TableCell>
          <TableCell className="overview-cell" sx={{ ...overviewMoneyCell, color: isIncome ? incomeColor : "text.primary" }}>
            {formatCurrency(isIncome ? group.totalAmount : -group.totalAmount)}
            <Typography display="block" variant="caption" color="text.secondary" sx={{ display: { xs: "block", sm: "none" } }}>
              {group.paidCount}/{actualInstallmentCount} pagas
            </Typography>
          </TableCell>
          <TableCell className="overview-cell" align="right">
            <Stack direction="row" alignItems="center" justifyContent="flex-end">
              {onUpdateInstallmentDates && (
                <Tooltip title="Alterar vencimentos">
                  <IconButton size="small" aria-label="Alterar vencimentos" onClick={(event) => { event.stopPropagation(); handleOpenDateDialog(group); }}
                    sx={{ width: { xs: 42, sm: 30 }, height: { xs: 42, sm: 30 } }}
                  >
                    <CalendarMonthIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton
                size="small" aria-label={isExpanded ? `Ocultar parcelas de ${group.description}` : `Ver ${actualInstallmentCount} parcelas de ${group.description}`}
                aria-expanded={isExpanded} onClick={(event) => { event.stopPropagation(); openGroup(); }}
                sx={{ width: 30, height: 30, display: { xs: "none", sm: "inline-flex" } }}
              >
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Stack>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <TableRow>
            <TableCell colSpan={isCompactTable ? 3 : 5} sx={{ p: 0, borderColor: "divider" }}>
            <Box
              sx={{
                p: isMobile ? 2 : 2.5,
                bgcolor: alpha(theme.palette.background.default, 0.5),
              }}
            >
            {group.isShared && group.sharedWith && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Compartilhada com {group.sharedWith}
              </Typography>
            )}
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
                        Compartilhada
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
                            gap: { xs: 0.5, sm: 1 },
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
                              flexShrink: 0,
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
                              component="time"
                              dateTime={t.date}
                              variant="body2"
                              fontWeight={isCurrent ? 600 : 500}
                              sx={{
                                textDecoration: isPaid
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              {formatDate(t.date)}
                            </Typography>
                            {isCurrent && !isPaid && (
                              <Chip
                                label="Atual"
                                size="small"
                                color="primary"
                                sx={{ height: 16, fontSize: 9, mt: 0.5 }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={isIncome ? "success.main" : "warning.main"}
                              sx={{ ...overviewMoneyCell, fontSize: 12 }}
                            >
                              {formatCurrency(t.amount || 0)}
                            </Typography>
                          </Box>
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
                        Resumo das parcelas
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {group.paidCount}/{actualInstallmentCount} parcelas pagas
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
                    Parcelas compartilhadas
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
                              gap: { xs: 0.5, sm: 1 },
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
                                flexShrink: 0,
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
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                component="time"
                                dateTime={t.date}
                                variant="body2"
                                fontWeight={isCurrent ? 600 : 500}
                              >
                                {formatDate(t.date)}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color="success.main"
                                sx={{ ...overviewMoneyCell, fontSize: 12 }}
                              >
                                +{formatCurrency(t.amount || 0)}
                              </Typography>
                            </Box>
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
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <Box sx={overviewPageStyles}>
      <OverviewHeader title="Parcelas" description="Gerencie suas compras parceladas"
        actionLabel="Nova compra" onAdd={onNewTransaction}
        onRefresh={onRefreshData ? handleRefresh : undefined} refreshing={isRefreshing}
      />
      <Box sx={overviewStatGridStyles}>
        <OverviewStatCard title="Em andamento" value={stats.inProgressCount} caption="Grupos com parcelas em aberto" icon={<ScheduleIcon fontSize="small" />} color={warningColor} />
        <OverviewStatCard title="Concluídas" value={stats.completedCount} caption="Grupos com parcelas quitadas" icon={<CheckCircleIcon fontSize="small" />} color={incomeColor} />
        <OverviewStatCard title="Saldo em aberto" value={formatCurrency(stats.totalRemaining)} caption="Valor das parcelas pendentes" icon={<TrendingDownIcon fontSize="small" />} color={expenseColor} />
        <OverviewStatCard title="Total pago" value={formatCurrency(stats.totalPaid)} caption={`de ${formatCurrency(stats.totalAll)}`} icon={<PaymentsIcon fontSize="small" />} color={accent} />
      </Box>
      <OverviewBreakdown
        data={stats.remainingByMethod} total={stats.totalRemaining}
        title="Distribuição do saldo em aberto"
        description="Participação de cada método nas parcelas pendentes"
        comparisonTitle="Parcelas em aberto por método"
        comparisonDescription="Valores pendentes em todos os períodos (R$)"
        emptyMessage="Sem parcelas em aberto."
        valueLabel="Saldo em aberto"
        renderInsight={(label, share) => <><strong>{label}</strong> concentra {share} do valor das parcelas em aberto.</>}
      />
      <OverviewTable
        title="Compras parceladas" description="Acompanhe o progresso e consulte cada parcela" icon={<PaymentsIcon fontSize="small" />}
        filters={
          <>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar..."
              minWidth={180}
            />

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel id="splits-filter-status">Status</InputLabel>
              <Select
                labelId="splits-filter-status"
                value={filterStatus}
                label="Status"
                onChange={(e: SelectChangeEvent) =>
                  setFilterStatus(e.target.value as SplitStatus)
                }
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="in_progress">Em andamento</MenuItem>
                <MenuItem value="completed">Concluídas</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel id="splits-filter-type">Tipo</InputLabel>
              <Select
                labelId="splits-filter-type"
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

          </>
        }
        filterKey={JSON.stringify([searchTerm, filterStatus, filterType])}
        rows={filteredGroups}
        emptyMessage="Nenhuma parcela encontrada."
        columns={[
          { title: "Compra", sortBy: (group) => group.description },
          { title: "Período", desktopOnly: true, sortBy: (group) => group.startDate },
          { title: "Progresso", desktopOnly: true, sortBy: (group) => group.paidCount / group.installments.length },
          { title: "Valor total", sortBy: (group) => group.type === "income" ? group.totalAmount : -group.totalAmount },
          { title: "Ações" },
        ]}
        renderRow={renderInstallmentRow}
      />

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
        onClose={isUpdatingDates ? undefined : handleCloseDateDialog}
        PaperProps={{
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": "installment-dates-title",
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
                <Typography id="installment-dates-title" variant="h6" fontWeight={600}>
                  Alterar vencimentos
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
              aria-label="Fechar vencimentos"
              disabled={isUpdatingDates}
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
              Defina o dia do vencimento e o mês inicial para recalcular as datas de todas as{" "}
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
              <InputLabel id="installment-due-day">Dia do vencimento</InputLabel>
              <Select
                labelId="installment-due-day"
                value={newDueDay}
                label="Dia do vencimento"
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
              <InputLabel id="installment-start-month">Mês inicial</InputLabel>
              <Select
                labelId="installment-start-month"
                value={newStartMonth}
                label="Mês inicial"
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
              <InputLabel id="installment-start-year">Ano inicial</InputLabel>
              <Select
                labelId="installment-start-year"
                value={newStartYear}
                label="Ano inicial"
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
                  Prévia das novas datas
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
                          Data atual
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                          Nova data
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

        {dateUpdateError && (
          <Box role="alert" sx={{ px: 3, pb: 1, color: "error.main" }}>
            Não foi possível confirmar o reagendamento. Atualize a lista e confira as datas antes de tentar novamente.
          </Box>
        )}
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
              "Updating..."
            ) : (
              <>
                <CalendarMonthIcon /> Salvar alterações
              </>
            )}
          </NixButton>
        </Box>
      </Drawer>
    </Box>
  );
};

export default SplitsView;
