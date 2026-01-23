import React, { useState, useMemo, useCallback } from "react";
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
  Fab,
  Collapse,
  Card,
  CardContent,
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
  CreditCard as CreditCardIcon,
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
import TransactionTags from "./TransactionTags";
import SearchBar from "./SearchBar";
import { getHeaderCellSx } from "../utils/tableStyles";
import { Transaction } from "../types";

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
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<SplitStatus>("in_progress");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSharedTab, setSelectedSharedTab] = useState<Record<string, number>>({});

  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Estado para o Dialog de alteração de datas
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [selectedGroupForDateChange, setSelectedGroupForDateChange] = useState<InstallmentGroup | null>(null);
  const [newDueDay, setNewDueDay] = useState<number>(1);
  const [newStartMonth, setNewStartMonth] = useState<number>(new Date().getMonth() + 1);
  const [newStartYear, setNewStartYear] = useState<number>(new Date().getFullYear());
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
  const calculateNewDates = useCallback((
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

      const newDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

      return { id: inst.id, date: newDate };
    });
  }, []);

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

      const installmentIds = selectedGroupForDateChange.installments.map((i) => i.id);
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
  }, [selectedGroupForDateChange, newDueDay, newStartMonth, newStartYear, calculateNewDates]);

  // IDs de transações relacionadas
  const relatedTransactionIds = useMemo(() => {
    const ids = new Set<string>();
    transactions
      .filter((t) => t.installments && t.installments > 1 && t.isShared && t.relatedTransactionId)
      .forEach((t) => {
        if (t.relatedTransactionId) ids.add(t.relatedTransactionId);
      });
    return ids;
  }, [transactions]);

  const getRelatedTransaction = useCallback((transaction: Transaction): Transaction | null => {
    if (!transaction.isShared || !transaction.relatedTransactionId) return null;
    return transactions.find((t) => t.id === transaction.relatedTransactionId) || null;
  }, [transactions]);

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
        const installmentDiff = (a.currentInstallment || 1) - (b.currentInstallment || 1);
        if (installmentDiff !== 0) return installmentDiff;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      const descriptionCounts = new Map<string, number>();
      group.installments.forEach((inst) => {
        descriptionCounts.set(inst.description, (descriptionCounts.get(inst.description) || 0) + 1);
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

        const isCompleted = group.paidCount >= group.totalInstallments;
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "in_progress" && !isCompleted) ||
          (filterStatus === "completed" && isCompleted);

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [groupedSplits, searchTerm, filterType, filterStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const inProgressGroups = groupedSplits.filter((g) => g.paidCount < g.totalInstallments);
    const completedGroups = groupedSplits.filter((g) => g.paidCount >= g.totalInstallments);

    const totalRemaining = inProgressGroups.reduce((sum, g) => sum + (g.totalAmount - g.paidAmount), 0);
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
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDateShort = (dateString: string) => {
    const [year, month] = dateString.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const formatDateFull = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isCurrentMonth = (dateString: string) => {
    const today = new Date();
    const [year, month] = dateString.split("-").map(Number);
    return year === today.getFullYear() && month === today.getMonth() + 1;
  };

  const getPeriod = (dateString: string) => {
    const [year, month] = dateString.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
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
    const isCompleted = group.paidCount >= group.totalInstallments;
    const progress = (group.paidCount / group.totalInstallments) * 100;
    const isIncome = group.type === "income";
    const accentColor = isIncome ? "#059669" : "#F59E0B";
    
    // Transações relacionadas (shared)
    const relatedTransactions = group.installments
      .map((inst) => getRelatedTransaction(inst))
      .filter((t): t is Transaction => t !== null);

    return (
      <Card
        key={group.key}
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: "16px",
          boxShadow: isDarkMode
            ? `0 6px 24px -6px ${alpha(accentColor, 0.2)}`
            : `0 6px 24px -6px ${alpha(accentColor, 0.15)}`,
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: isDarkMode
              ? `0 12px 32px -6px ${alpha(accentColor, 0.3)}`
              : `0 12px 32px -6px ${alpha(accentColor, 0.25)}`,
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(accentColor, 0.08)} 0%, ${alpha(accentColor, 0.02)} 100%)`
              : `linear-gradient(135deg, ${alpha(accentColor, 0.04)} 0%, ${alpha(accentColor, 0.01)} 100%)`,
            pointerEvents: "none",
          },
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 2.5, "&:last-child": { pb: isMobile ? 2 : 2.5 } }}>
          {/* Header Row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              cursor: "pointer",
            }}
            onClick={() => toggleGroup(group.key)}
          >
            {/* Left: Icon + Info */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: "12px",
                  background: `linear-gradient(135deg, ${accentColor}, ${alpha(accentColor, 0.7)})`,
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <CreditCardIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600}
                    sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {group.description}
                  </Typography>
                  {group.descriptions.length > 1 && (
                    <Chip 
                      label={`+${group.descriptions.length - 1}`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ height: 18, fontSize: 10 }}
                    />
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.25 }}>
                  <Typography variant="caption" color="text.secondary">
                    {group.category}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">•</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {group.paymentMethod}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right: Amount + Status */}
            <Box sx={{ textAlign: "right", flexShrink: 0, ml: 1 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color={isIncome ? "success.main" : "warning.main"}
                sx={{ fontFamily: "monospace", letterSpacing: "-0.02em" }}
              >
                {isIncome ? "+" : "-"}{formatCurrency(group.totalAmount)}
              </Typography>
              <Chip
                icon={isCompleted ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <ScheduleIcon sx={{ fontSize: 14 }} />}
                label={`${group.paidCount}/${group.totalInstallments}x`}
                size="small"
                color={isCompleted ? "success" : "warning"}
                sx={{ height: 22, fontSize: 11, borderRadius: "8px", mt: 0.5 }}
              />
            </Box>
          </Box>

          {/* Progress + Period */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {formatDateShort(group.startDate)} → {formatDateShort(group.endDate)}
              </Typography>
              <Typography variant="caption" fontWeight={600} color={accentColor}>
                {Math.round(progress)}% pago
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: "4px",
                bgcolor: alpha(accentColor, 0.1),
                "& .MuiLinearProgress-bar": {
                  borderRadius: "4px",
                  background: `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.7)})`,
                },
              }}
            />
          </Box>

          {/* Shared Info (if applicable) */}
          {relatedTransactions.length > 0 && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: "10px",
                bgcolor: alpha(theme.palette.success.main, 0.08),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ArrowUpIcon fontSize="small" color="success" />
                  <Typography variant="body2" fontWeight={500}>
                    Compartilhado com {group.sharedWith}
                  </Typography>
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

          {/* Action Buttons */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleGroup(group.key);
              }}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ 
                textTransform: "none", 
                color: "text.secondary",
                fontSize: 12,
                "&:hover": { bgcolor: alpha(accentColor, 0.08) }
              }}
            >
              {isExpanded ? "Ocultar parcelas" : `Ver ${group.totalInstallments} parcelas`}
            </Button>
            
            {onUpdateInstallmentDates && (
              <Tooltip title="Alterar datas de vencimento">
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDateDialog(group);
                  }}
                  startIcon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                  sx={{ 
                    textTransform: "none", 
                    color: "text.secondary",
                    fontSize: 12,
                    "&:hover": { 
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main"
                    }
                  }}
                >
                  Alterar Datas
                </Button>
              </Tooltip>
            )}
          </Box>
        </CardContent>

        {/* Expanded Content */}
        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: isMobile ? 2 : 2.5, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            {/* Tabs for shared transactions */}
            {relatedTransactions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Tabs
                  value={selectedSharedTab[group.key] || 0}
                  onChange={(_, newValue) => setSelectedSharedTab((prev) => ({ ...prev, [group.key]: newValue }))}
                  variant="fullWidth"
                  sx={{
                    bgcolor: alpha(theme.palette.action.hover, 0.04),
                    borderRadius: "10px",
                    p: 0.5,
                    minHeight: 36,
                    "& .MuiTabs-indicator": { display: "none" },
                    "& .MuiTab-root": {
                      minHeight: 32,
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
                  <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><ArrowDownIcon fontSize="small" />Despesa</Box>} />
                  <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><ArrowUpIcon fontSize="small" />Compartilhado</Box>} />
                </Tabs>
              </Box>
            )}

            {/* Tab: Expense Installments */}
            {(selectedSharedTab[group.key] || 0) === 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <VisibilityIcon fontSize="small" color="primary" />
                  Todas as {group.totalInstallments} parcelas
                </Typography>

                {isMobile ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {group.installments.map((t) => {
                      const isPaid = t.isPaid !== false;
                      const isCurrent = isCurrentMonth(t.date);
                      
                      return (
                        <Paper
                          key={t.id}
                          sx={{
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            opacity: isPaid ? 0.6 : 1,
                            bgcolor: isCurrent && !isPaid ? alpha(theme.palette.primary.main, 0.08) : "background.paper",
                            border: isCurrent && !isPaid ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                            borderRadius: "10px",
                          }}
                        >
                          <Checkbox
                            checked={isPaid}
                            onChange={(e) => onTogglePaid(t.id, e.target.checked)}
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
                              bgcolor: isCurrent && !isPaid ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.action.hover, 0.1),
                            }}
                          >
                            <Typography variant="caption" fontWeight={700} color={isCurrent && !isPaid ? "primary.main" : "text.secondary"} sx={{ fontSize: 10 }}>
                              #{t.currentInstallment}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={isCurrent ? 600 : 500} sx={{ textDecoration: isPaid ? "line-through" : "none" }}>
                              {formatDateFull(t.date)}
                            </Typography>
                            {isCurrent && !isPaid && <Chip label="Atual" size="small" color="primary" sx={{ height: 16, fontSize: 9, mt: 0.5 }} />}
                          </Box>
                          <Typography variant="body2" fontWeight={600} color={isIncome ? "success.main" : "warning.main"} sx={{ fontFamily: "monospace", fontSize: 12 }}>
                            {formatCurrency(t.amount || 0)}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileActionAnchor({ element: e.currentTarget, transaction: t });
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
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)} padding="checkbox">Pago</TableCell>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>#</TableCell>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Data</TableCell>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Período</TableCell>
                        <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "right" }}>Valor</TableCell>
                        <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>Status</TableCell>
                        <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.installments.map((t) => {
                        const isPaid = t.isPaid !== false;
                        const isCurrent = isCurrentMonth(t.date);
                        
                        return (
                          <TableRow
                            key={t.id}
                            sx={{
                              opacity: isPaid ? 0.6 : 1,
                              bgcolor: isCurrent && !isPaid ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isPaid}
                                onChange={(e) => onTogglePaid(t.id, e.target.checked)}
                                size="small"
                                color="success"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`#${t.currentInstallment}`}
                                size="small"
                                variant="outlined"
                                color={isCurrent && !isPaid ? "primary" : "default"}
                                sx={{ fontWeight: 600, height: 22 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={isCurrent ? 600 : 400}>
                                {formatDateFull(t.date)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {getPeriod(t.date)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color={isIncome ? "success.main" : "warning.main"}>
                                {formatCurrency(t.amount || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {isPaid ? (
                                <Chip label="Pago" size="small" color="success" sx={{ height: 22 }} />
                              ) : isCurrent ? (
                                <Chip label="Atual" size="small" color="primary" sx={{ height: 22 }} />
                              ) : (
                                <Chip label="Pendente" size="small" variant="outlined" sx={{ height: 22, opacity: 0.7 }} />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => onEdit(t)} color="primary">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir">
                                <IconButton size="small" onClick={() => onDelete(t.id)} color="error">
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
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Resumo do Parcelamento
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {group.paidCount}/{group.totalInstallments} parcelas pagas
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Restante: {formatCurrency(group.totalAmount - group.paidAmount)}
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color={isIncome ? "success.main" : "warning.main"}>
                        Total: {formatCurrency(group.totalAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </>
            )}

            {/* Tab: Shared (related income) */}
            {(selectedSharedTab[group.key] || 0) === 1 && relatedTransactions.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <VisibilityIcon fontSize="small" color="success" />
                  Parcelas Compartilhadas
                </Typography>

                {isMobile ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {relatedTransactions.map((t) => {
                      const isPaid = t.isPaid !== false;
                      const isCurrent = isCurrentMonth(t.date);
                      
                      return (
                        <Paper
                          key={t.id}
                          sx={{
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            opacity: isPaid ? 0.6 : 1,
                            bgcolor: isCurrent && !isPaid ? alpha(theme.palette.success.main, 0.08) : "background.paper",
                            border: isCurrent && !isPaid ? `2px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.divider}`,
                            borderRadius: "10px",
                          }}
                        >
                          <Checkbox
                            checked={isPaid}
                            onChange={(e) => onTogglePaid(t.id, e.target.checked)}
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
                              bgcolor: isCurrent && !isPaid ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.action.hover, 0.1),
                            }}
                          >
                            <Typography variant="caption" fontWeight={700} color={isCurrent && !isPaid ? "success.main" : "text.secondary"} sx={{ fontSize: 10 }}>
                              #{t.currentInstallment}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={isCurrent ? 600 : 500}>
                              {formatDateFull(t.date)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={600} color="success.main" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                            +{formatCurrency(t.amount || 0)}
                          </Typography>
                          <Chip label={isPaid ? "Recebido" : "Pendente"} size="small" color={isPaid ? "success" : "warning"} sx={{ height: 20, fontSize: 10 }} />
                        </Paper>
                      );
                    })}
                  </Box>
                ) : (
                  <Table size="small" sx={{ "& td, & th": { py: 1 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)} padding="checkbox">Recebido</TableCell>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>#</TableCell>
                        <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Data</TableCell>
                        <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "right" }}>Valor</TableCell>
                        <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {relatedTransactions.map((t) => {
                        const isPaid = t.isPaid !== false;
                        const isCurrent = isCurrentMonth(t.date);
                        
                        return (
                          <TableRow key={t.id} sx={{ opacity: isPaid ? 0.6 : 1, bgcolor: isCurrent && !isPaid ? alpha(theme.palette.success.main, 0.08) : "transparent" }}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={isPaid} onChange={(e) => onTogglePaid(t.id, e.target.checked)} size="small" color="success" />
                            </TableCell>
                            <TableCell>
                              <Chip label={`#${t.currentInstallment}`} size="small" variant="outlined" color={isCurrent && !isPaid ? "success" : "default"} sx={{ fontWeight: 600, height: 22 }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={isCurrent ? 600 : 400}>{formatDateFull(t.date)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="success.main">+{formatCurrency(t.amount || 0)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={isPaid ? "Recebido" : isCurrent ? "Atual" : "Pendente"} size="small" color={isPaid ? "success" : isCurrent ? "warning" : "default"} variant={isPaid || isCurrent ? "filled" : "outlined"} sx={{ height: 22 }} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                <Paper 
                  elevation={0}
                  sx={{ p: 2, mt: 2, borderRadius: "12px", bgcolor: alpha("#059669", 0.05), border: `1px solid ${alpha("#059669", 0.15)}` }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {relatedTransactions.filter(t => t.isPaid).length}/{relatedTransactions.length} parcelas recebidas
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      +{formatCurrency(relatedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0))}
                    </Typography>
                  </Box>
                </Paper>
              </>
            )}
          </Box>
        </Collapse>
      </Card>
    );
  };

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: isMobile ? 2 : 3,
      pb: { xs: "180px", md: 0 },
    }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                bgcolor: alpha("#F59E0B", 0.1),
                display: "flex",
              }}
            >
              <PaymentsIcon sx={{ color: "#F59E0B" }} />
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              Parcelamentos
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie suas compras parceladas
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {onRefreshData && (
            <Tooltip title="Atualizar dados">
              <IconButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: "10px",
                  "&:hover": { borderColor: theme.palette.primary.main },
                }}
              >
                <RefreshIcon
                  sx={{
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
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewTransaction}
              sx={{ borderRadius: "10px" }}
            >
              Nova Transação
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <ScheduleIcon sx={{ color: "#F59E0B", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Em Andamento
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="#F59E0B">
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
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <CheckCircleIcon sx={{ color: "#059669", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Concluídos
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="#059669">
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
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingDownIcon sx={{ color: "#DC2626", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                A Pagar
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#DC2626">
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
              <CheckCircleIcon sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.8) }} fontWeight={600}>
                Total Pago
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#FFFFFF">
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
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
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
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e: SelectChangeEvent) => setFilterStatus(e.target.value as SplitStatus)}
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
              onChange={(e: SelectChangeEvent) => setFilterType(e.target.value as "all" | "income" | "expense")}
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredGroups.map((group) => renderInstallmentCard(group))}
        </Box>
      ) : (
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: "center",
            borderRadius: "16px",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha("#FFFFFF", 0.9),
            backdropFilter: "blur(20px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          }}
        >
          <CreditCardIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum parcelamento encontrado
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Crie uma transação parcelada para gerenciá-la aqui
          </Typography>
        </Paper>
      )}

      {/* Mobile Action Menu */}
      <Menu
        anchorEl={mobileActionAnchor.element}
        open={Boolean(mobileActionAnchor.element)}
        onClose={() => setMobileActionAnchor({ element: null, transaction: null })}
      >
        <MenuItem
          onClick={() => {
            if (mobileActionAnchor.transaction) onEdit(mobileActionAnchor.transaction);
            setMobileActionAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileActionAnchor.transaction) onDelete(mobileActionAnchor.transaction.id);
            setMobileActionAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={onNewTransaction}
          sx={{
            position: "fixed",
            bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            right: 16,
            zIndex: 1100,
          }}
        >
          <AddIcon />
        </Fab>
      )}

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
            borderLeft: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
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
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, isDarkMode ? 0.15 : 0.1),
                  color: "primary.main",
                }}
              >
                <EventRepeatIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Alterar Datas de Vencimento
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }} noWrap>
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
              Configure o dia de vencimento e o mês de início para recalcular as datas de todas as{" "}
              <Typography component="span" fontWeight={600} color="primary.main">
                {selectedGroupForDateChange?.totalInstallments} parcelas
              </Typography>.
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
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Preview das novas datas */}
            {previewDates.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
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
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Parcela</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Data Atual</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Nova Data</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedGroupForDateChange?.installments
                        .sort((a, b) => (a.currentInstallment || 1) - (b.currentInstallment || 1))
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
                                  sx={{ textDecoration: hasChanged ? "line-through" : "none", fontSize: 12 }}
                                >
                                  {formatDateFull(currentDate)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  fontWeight={hasChanged ? 600 : 400}
                                  color={hasChanged ? "primary.main" : "text.secondary"}
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
          <Button
            onClick={handleCloseDateDialog}
            disabled={isUpdatingDates}
            sx={{
              textTransform: "none",
              borderRadius: "12px",
              px: 3,
              color: "text.secondary",
              "&:hover": {
                bgcolor: alpha(theme.palette.action.hover, 0.08),
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDates}
            disabled={isUpdatingDates || !onUpdateInstallmentDates}
            startIcon={isUpdatingDates ? <CircularProgress size={18} color="inherit" /> : <CalendarMonthIcon />}
            sx={{
              textTransform: "none",
              borderRadius: "12px",
              px: 3,
              boxShadow: `0 4px 14px -4px ${alpha(theme.palette.primary.main, 0.4)}`,
              "&:hover": {
                boxShadow: `0 6px 20px -4px ${alpha(theme.palette.primary.main, 0.5)}`,
              },
            }}
          >
            {isUpdatingDates ? "Atualizando..." : "Salvar Alterações"}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default SplitsView;
