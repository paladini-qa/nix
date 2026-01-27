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
  Card,
  CardContent,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Button,
  Fab,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  alpha,
  Checkbox,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Repeat as RepeatIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UnpaidIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  AllInclusive as InfiniteIcon,
} from "@mui/icons-material";
import TransactionTags from "./TransactionTags";
import SearchBar from "./SearchBar";
import {
  getTableContainerSx,
  getHeaderCellSx,
  getRowSx,
} from "../utils/tableStyles";
import { Transaction } from "../types";
import EmptyState from "./EmptyState";

interface RecurringViewProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onNewTransaction: () => void;
  onRefreshData?: () => Promise<void>;
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
  onEdit,
  onDelete,
  onTogglePaid,
  onNewTransaction,
  onRefreshData,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterFrequency, setFilterFrequency] = useState<"all" | "monthly" | "yearly">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  const [mobileOccurrenceMenuAnchor, setMobileOccurrenceMenuAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
    occurrence: RecurringOccurrence | null;
  }>({ element: null, transaction: null, occurrence: null });

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
      .filter((t) => t.isRecurring && !t.isVirtual && t.isShared && t.relatedTransactionId && t.type === "expense")
      .forEach((t) => {
        if (t.relatedTransactionId) {
          ids.add(t.relatedTransactionId);
        }
      });
    return ids;
  }, [transactions]);

  // Helper para encontrar a transação relacionada
  const getRelatedTransaction = useCallback((transaction: Transaction): Transaction | null => {
    if (!transaction.isShared || !transaction.relatedTransactionId) return null;
    return transactions.find((t) => t.id === transaction.relatedTransactionId) || null;
  }, [transactions]);

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
        const matchesFrequency = filterFrequency === "all" || t.frequency === filterFrequency;
        const matchesCategory = filterCategory === "all" || t.category === filterCategory;
        return matchesSearch && matchesType && matchesFrequency && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterType, filterFrequency, filterCategory, relatedTransactionIds]);

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
  const getOccurrencesList = (transaction: Transaction): RecurringOccurrence[] => {
    const startDate = parseLocalDate(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const occurrences: RecurringOccurrence[] = [];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const modifiedTransactions = transactions.filter(
      (t) => t.recurringGroupId === transaction.id && !t.isRecurring
    );
    
    const excludedDatesSet = new Set(transaction.excludedDates || []);
    
    const modifiedByMonthYear = new Map<string, Transaction>();
    modifiedTransactions.forEach((t) => {
      const tDate = parseLocalDate(t.date);
      const monthYearKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
      const existing = modifiedByMonthYear.get(monthYearKey);
      if (!existing || new Date(t.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
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
        return tDate.getFullYear() < startYear || (tDate.getFullYear() === startYear && tDate.getMonth() < startMonth);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((t, idx) => {
        const tDate = parseLocalDate(t.date);
        const monthYearKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
        
        if (processedMonths.has(monthYearKey)) return;
        processedMonths.add(monthYearKey);
        
        const txToUse = modifiedByMonthYear.get(monthYearKey) || t;
        const txDate = parseLocalDate(txToUse.date);
        const isIndividuallyEdited = excludedDatesSet.has(txToUse.date);
        
        occurrences.push({
          date: txToUse.date,
          formattedDate: txDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
          month: months[txDate.getMonth()],
          year: txDate.getFullYear(),
          isPast: txDate < today,
          isCurrent: txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear(),
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
      if (currentMonthOcc.getMonth() !== today.getMonth() || currentMonthOcc.getFullYear() !== today.getFullYear()) {
        const thisMonthOcc = new Date(startDate);
        while (thisMonthOcc.getFullYear() < today.getFullYear() || 
               (thisMonthOcc.getFullYear() === today.getFullYear() && thisMonthOcc.getMonth() < today.getMonth())) {
          thisMonthOcc.setMonth(thisMonthOcc.getMonth() + 1);
        }
        if (thisMonthOcc.getMonth() === today.getMonth() && thisMonthOcc.getFullYear() === today.getFullYear()) {
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
        const monthYearKey = `${occDate.getFullYear()}-${String(occDate.getMonth() + 1).padStart(2, "0")}`;
        
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
        
        const isPast = occDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isCurrent = occDate.getMonth() === today.getMonth() && occDate.getFullYear() === today.getFullYear();
        
        const finalDate = modifiedTx ? modifiedTx.date : occDateString;
        const finalDateObj = modifiedTx ? parseLocalDate(modifiedTx.date) : occDate;
        const isIndividuallyEdited = modifiedTx && excludedDatesSet.has(modifiedTx.date);
        
        occurrences.push({
          date: finalDate,
          formattedDate: finalDateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
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
        if (!existing || new Date(t.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
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
        
        const finalDate = modifiedTxYearly ? modifiedTxYearly.date : occDateString;
        const finalDateObj = modifiedTxYearly ? parseLocalDate(modifiedTxYearly.date) : occDate;
        
        const isPast = finalDateObj < today;
        const isCurrent = finalDateObj.getFullYear() === today.getFullYear() && finalDateObj.getMonth() === today.getMonth();
        const isIndividuallyEditedYearly = modifiedTxYearly && excludedDatesSet.has(modifiedTxYearly.date);
        
        occurrences.push({
          date: finalDate,
          formattedDate: finalDateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
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
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
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

  const createVirtualTransaction = (baseTransaction: Transaction, occurrence: RecurringOccurrence): Transaction => {
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

  const handleOccurrenceEdit = (transaction: Transaction, occurrence: RecurringOccurrence) => {
    const virtualTransaction = createVirtualTransaction(transaction, occurrence);
    onEdit(virtualTransaction);
  };

  const handleOccurrenceDelete = (transaction: Transaction, occurrence: RecurringOccurrence) => {
    const virtualTransaction = createVirtualTransaction(transaction, occurrence);
    onDelete(virtualTransaction.id);
  };

  const handleCloseMobileOccurrenceMenu = () => {
    setMobileOccurrenceMenuAnchor({ element: null, transaction: null, occurrence: null });
  };

  // =============================================
  // CARD COMPONENT - Design alinhado com PaymentMethodsView
  // =============================================
  const renderRecurringCard = (t: Transaction) => {
    const isExpanded = expandedItems.has(t.id);
    const isIncome = t.type === "income";
    const occurrences = calculateOccurrences(t);
    const occurrencesList = getOccurrencesList(t);
    const accentColor = isIncome ? "#059669" : "#DC2626";
    const relatedTx = getRelatedTransaction(t);
    
    // Calcula progresso baseado em quantas já passaram
    const paidOccurrences = occurrencesList.filter(o => o.isPast || (o.isCurrent && t.isPaid)).length;
    const progressPercentage = occurrencesList.length > 0 ? (paidOccurrences / occurrencesList.length) * 100 : 0;

    return (
      <Card
        key={t.id}
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
            onClick={() => toggleExpand(t.id)}
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
                {isIncome ? (
                  <TrendingUpIcon sx={{ color: "#fff", fontSize: 20 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: "#fff", fontSize: 20 }} />
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600}
                  sx={{ 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    whiteSpace: "nowrap",
                    mb: 0.25,
                  }}
                >
                  {t.description}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="caption" color="text.secondary">
                    {t.category}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">•</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.paymentMethod}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right: Amount + Actions */}
            <Box sx={{ textAlign: "right", flexShrink: 0, ml: 1 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color={isIncome ? "success.main" : "error.main"}
                sx={{ fontFamily: "monospace", letterSpacing: "-0.02em" }}
              >
                {isIncome ? "+" : "-"}{formatCurrency(t.amount || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                /{t.frequency === "monthly" ? "mês" : "ano"}
              </Typography>
            </Box>
          </Box>

          {/* Info Row: Status Chips + Next Date */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
              <Chip
                icon={<RepeatIcon sx={{ fontSize: 14 }} />}
                label={t.frequency === "monthly" ? "Mensal" : "Anual"}
                size="small"
                variant="outlined"
                sx={{ 
                  height: 24, 
                  fontSize: 11,
                  borderRadius: "8px",
                  borderColor: alpha(accentColor, 0.3),
                  color: accentColor,
                }}
              />
              <Chip
                icon={t.isPaid ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <UnpaidIcon sx={{ fontSize: 14 }} />}
                label={t.isPaid ? "Pago" : "Pendente"}
                size="small"
                color={t.isPaid ? "success" : "default"}
                variant={t.isPaid ? "filled" : "outlined"}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePaid(t.id, !t.isPaid);
                }}
                sx={{ 
                  height: 24,
                  fontSize: 11,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": { transform: "scale(1.05)" }
                }}
              />
              {t.isShared && relatedTx && (
                <Chip
                  label={`÷ ${t.sharedWith}`}
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ height: 24, fontSize: 11, borderRadius: "8px" }}
                />
              )}
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ScheduleIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Próximo: {getNextOccurrence(t)}
              </Typography>
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mt: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {occurrences}× ocorrências desde {formatDate(t.date).split(" de ")[0]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progressPercentage.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
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

          {/* Tags */}
          <TransactionTags transaction={t} showRecurring={false} showInstallments={false} />

          {/* Expand Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(t.id);
              }}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ 
                textTransform: "none", 
                color: "text.secondary",
                fontSize: 12,
                "&:hover": { bgcolor: alpha(accentColor, 0.08) }
              }}
            >
              {isExpanded ? "Ocultar detalhes" : `Ver ${occurrencesList.length} ocorrências`}
            </Button>
          </Box>
        </CardContent>

        {/* Expanded Content */}
        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: isMobile ? 2 : 2.5, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2, flexWrap: "wrap" }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(t);
                }}
                sx={{ borderRadius: "10px", textTransform: "none" }}
              >
                Editar
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(t.id);
                }}
                sx={{ borderRadius: "10px", textTransform: "none" }}
              >
                Excluir
              </Button>
            </Box>

            {/* Occurrences Table/Cards */}
            <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VisibilityIcon fontSize="small" color="primary" />
              Próximas ocorrências
            </Typography>
            
            {isMobile ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {occurrencesList.slice(0, 6).map((occ, idx) => {
                  const isPaidOcc = occ.isModified 
                    ? occ.modifiedTransaction?.isPaid 
                    : (occ.isCurrent && t.isPaid);
                  
                  return (
                    <Paper
                      key={idx}
                      sx={{
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        opacity: isPaidOcc ? 0.6 : 1,
                        bgcolor: occ.isCurrent ? alpha(theme.palette.primary.main, 0.08) : "background.paper",
                        border: occ.isCurrent ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                        borderRadius: "10px",
                      }}
                    >
                      <Checkbox
                        checked={!!isPaidOcc}
                        onChange={(e) => {
                          if (occ.isModified && occ.modifiedTransaction) {
                            onTogglePaid(occ.modifiedTransaction.id, e.target.checked);
                          } else if (occ.isCurrent) {
                            onTogglePaid(t.id, e.target.checked);
                          }
                        }}
                        size="small"
                        color="success"
                        disabled={!occ.isCurrent && !occ.isModified}
                        sx={{ p: 0.5 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={occ.isCurrent ? 600 : 500}>
                          {occ.formattedDate}
                        </Typography>
                        {occ.isCurrent && (
                          <Chip label="Atual" size="small" color="primary" sx={{ height: 16, fontSize: 9, mt: 0.5 }} />
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight={600} color={isIncome ? "success.main" : "error.main"}>
                        {isIncome ? "+" : "-"}{formatCurrency(occ.modifiedTransaction?.amount ?? t.amount ?? 0)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileOccurrenceMenuAnchor({ element: e.currentTarget, transaction: t, occurrence: occ });
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
                    <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "right" }}>Valor</TableCell>
                    <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>Status</TableCell>
                    <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {occurrencesList.slice(0, 12).map((occ, idx) => {
                    const isPaidOcc = occ.isModified 
                      ? occ.modifiedTransaction?.isPaid 
                      : (occ.isCurrent && t.isPaid);
                    const displayAmount = occ.modifiedTransaction?.amount ?? t.amount;
                    const displayType = occ.modifiedTransaction?.type ?? t.type;
                    const isModifiedIncome = displayType === "income";
                    
                    return (
                      <TableRow
                        key={idx}
                        sx={{
                          opacity: isPaidOcc ? 0.6 : 1,
                          bgcolor: occ.isCurrent 
                            ? alpha(theme.palette.primary.main, 0.08) 
                            : occ.isModified 
                              ? alpha(theme.palette.warning.main, 0.05) 
                              : "transparent",
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={!!isPaidOcc}
                            onChange={(e) => {
                              if (occ.isModified && occ.modifiedTransaction) {
                                onTogglePaid(occ.modifiedTransaction.id, e.target.checked);
                              } else if (occ.isCurrent) {
                                onTogglePaid(t.id, e.target.checked);
                              }
                            }}
                            size="small"
                            color="success"
                            disabled={!occ.isCurrent && !occ.isModified}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`#${occ.occurrenceNumber}`}
                            size="small"
                            variant="outlined"
                            color={occ.isCurrent ? "primary" : "default"}
                            sx={{ fontWeight: 600, height: 22 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={occ.isCurrent ? 600 : 400}>
                            {occ.formattedDate}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color={isModifiedIncome ? "success.main" : "error.main"}>
                            {isModifiedIncome ? "+" : "-"}{formatCurrency(displayAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {isPaidOcc ? (
                            <Chip label="Pago" size="small" color="success" sx={{ height: 22 }} />
                          ) : occ.isCurrent ? (
                            <Chip label="Atual" size="small" color="primary" sx={{ height: 22 }} />
                          ) : occ.isModified ? (
                            <Chip label="Modificado" size="small" color="warning" sx={{ height: 22 }} />
                          ) : (
                            <Chip label="Agendado" size="small" variant="outlined" sx={{ height: 22, opacity: 0.7 }} />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => occ.isModified && occ.modifiedTransaction 
                                ? onEdit(occ.modifiedTransaction)
                                : handleOccurrenceEdit(t, occ)
                              } 
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton 
                              size="small" 
                              onClick={() => occ.isModified && occ.modifiedTransaction
                                ? onDelete(occ.modifiedTransaction.id)
                                : handleOccurrenceDelete(t, occ)
                              } 
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

            {/* Annual Impact */}
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
                    Impacto Anual
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.frequency === "monthly" ? "12 meses" : "1 ano"} × {formatCurrency(t.amount || 0)}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} color={isIncome ? "success.main" : "error.main"}>
                  {isIncome ? "+" : "-"}{formatCurrency((t.amount || 0) * (t.frequency === "monthly" ? 12 : 1))}
                </Typography>
              </Box>
            </Paper>
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
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
              }}
            >
              <RepeatIcon color="primary" />
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              Recorrentes
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie suas receitas e despesas que se repetem
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
              <RepeatIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
              {stats.total}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#059669" }}>{stats.incomeCount} receitas</Typography>
              <Typography variant="caption" sx={{ color: "#DC2626" }}>{stats.expenseCount} despesas</Typography>
            </Box>
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
              <CalendarIcon sx={{ color: "#06B6D4", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#059669" }}>+{formatCurrency(stats.monthlyIncome)}</Typography>
              <Typography variant="caption" sx={{ color: "#DC2626" }}>-{formatCurrency(stats.monthlyExpense)}</Typography>
            </Box>
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
              <InfiniteIcon sx={{ color: "#F59E0B", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#059669" }}>+{formatCurrency(stats.annualizedIncome)}</Typography>
              <Typography variant="caption" sx={{ color: "#DC2626" }}>-{formatCurrency(stats.annualizedExpense)}</Typography>
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
              <TrendingUpIcon sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.8) }} fontWeight={600}>
                Impacto Total
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#FFFFFF">
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
                setFilterFrequency(e.target.value as "all" | "monthly" | "yearly")
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
              onChange={(e: SelectChangeEvent) => setFilterCategory(e.target.value)}
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
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recurringTransactions.map((t) => renderRecurringCard(t))}
        </Box>
      )}

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

      {/* Mobile Menus */}
      <Menu
        anchorEl={mobileMenuAnchor.element}
        open={Boolean(mobileMenuAnchor.element)}
        onClose={() => setMobileMenuAnchor({ element: null, transaction: null })}
      >
        <MenuItem
          onClick={() => {
            if (mobileMenuAnchor.transaction) {
              onTogglePaid(mobileMenuAnchor.transaction.id, !mobileMenuAnchor.transaction.isPaid);
            }
            setMobileMenuAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon>
            {mobileMenuAnchor.transaction?.isPaid ? <UnpaidIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" color="success" />}
          </ListItemIcon>
          <ListItemText>{mobileMenuAnchor.transaction?.isPaid ? "Marcar como Pendente" : "Marcar como Pago"}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileMenuAnchor.transaction) onEdit(mobileMenuAnchor.transaction);
            setMobileMenuAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileMenuAnchor.transaction) onDelete(mobileMenuAnchor.transaction.id);
            setMobileMenuAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
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
                onTogglePaid(mobileOccurrenceMenuAnchor.transaction.id, !mobileOccurrenceMenuAnchor.transaction.isPaid);
              }
              handleCloseMobileOccurrenceMenu();
            }}
          >
            <ListItemIcon>
              {mobileOccurrenceMenuAnchor.transaction?.isPaid ? <UnpaidIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" color="success" />}
            </ListItemIcon>
            <ListItemText>{mobileOccurrenceMenuAnchor.transaction?.isPaid ? "Marcar como Pendente" : "Marcar como Pago"}</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            if (mobileOccurrenceMenuAnchor.transaction && mobileOccurrenceMenuAnchor.occurrence) {
              handleOccurrenceEdit(mobileOccurrenceMenuAnchor.transaction, mobileOccurrenceMenuAnchor.occurrence);
            }
            handleCloseMobileOccurrenceMenu();
          }}
        >
          <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileOccurrenceMenuAnchor.transaction && mobileOccurrenceMenuAnchor.occurrence) {
              handleOccurrenceDelete(mobileOccurrenceMenuAnchor.transaction, mobileOccurrenceMenuAnchor.occurrence);
            }
            handleCloseMobileOccurrenceMenu();
          }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default RecurringView;
