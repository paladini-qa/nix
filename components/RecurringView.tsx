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
  Alert,
  Button,
  Fab,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  alpha,
  LinearProgress,
  Switch,
  Tooltip,
  Checkbox,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Repeat as RepeatIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  AllInclusive as InfiniteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UnpaidIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import TransactionTags from "./TransactionTags";
import SearchBar from "./SearchBar";
import {
  getTableContainerSx,
  getHeaderCellSx,
  getRowSx,
  getMobileCardSx,
} from "../utils/tableStyles";
import { Transaction } from "../types";

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
  // Campos para ocorrências modificadas
  isModified?: boolean; // Indica que é uma transação modificada (não virtual)
  modifiedTransaction?: Transaction; // A transação modificada
  isIndividuallyEdited?: boolean; // Indica que foi editada via "Only this occurrence"
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

  // Estado para o menu mobile de ocorrências
  const [mobileOccurrenceMenuAnchor, setMobileOccurrenceMenuAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
    occurrence: RecurringOccurrence | null;
  }>({ element: null, transaction: null, occurrence: null });

  // Estado para controlar qual aba está selecionada em transações compartilhadas
  // 0 = Despesa (expense), 1 = Compartilhado (related income)
  const [selectedSharedTab, setSelectedSharedTab] = useState<Record<string, number>>({});

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

  // Lista de todas as categorias únicas das transações recorrentes
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions
      .filter((t) => t.isRecurring && !t.isVirtual)
      .forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  // Conjunto de IDs de transações relacionadas (incomes vinculadas a expenses compartilhados)
  // Essas transações serão exibidas junto com sua expense principal, não separadamente
  const relatedTransactionIds = useMemo(() => {
    const ids = new Set<string>();
    transactions
      .filter((t) => t.isRecurring && !t.isVirtual && t.isShared && t.relatedTransactionId)
      .forEach((t) => {
        if (t.relatedTransactionId) {
          ids.add(t.relatedTransactionId);
        }
      });
    return ids;
  }, [transactions]);

  // Helper para encontrar a transação relacionada (income de reembolso)
  const getRelatedTransaction = useCallback((transaction: Transaction): Transaction | null => {
    if (!transaction.isShared || !transaction.relatedTransactionId) return null;
    return transactions.find((t) => t.id === transaction.relatedTransactionId) || null;
  }, [transactions]);

  // Filtra apenas transações recorrentes (não virtuais)
  // Exclui transações que são a "parte relacionada" de uma transação compartilhada
  const recurringTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.isRecurring && !t.isVirtual)
      // Exclui incomes que são reembolsos vinculados a expenses (serão mostradas junto com a expense)
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
      sharedCount: recurring.filter((t) => t.isShared).length,
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
      year: "numeric",
    });
  };

  // Gera lista de ocorrências futuras para exibição (12 meses ou 1 ano à frente)
  // Agora também inclui transações modificadas/materializadas (com recurringGroupId)
  const getOccurrencesList = (transaction: Transaction): RecurringOccurrence[] => {
    const startDate = parseLocalDate(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const occurrences: RecurringOccurrence[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Busca transações modificadas/materializadas que pertencem a este grupo recorrente
    const modifiedTransactions = transactions.filter(
      (t) => t.recurringGroupId === transaction.id && !t.isRecurring
    );
    
    // Array de datas excluídas da recorrência (onde ocorrências individuais foram editadas)
    const excludedDatesSet = new Set(transaction.excludedDates || []);
    
    // Cria um mapa de mês/ano -> transação modificada para evitar duplicatas
    // Agrupa por mês/ano porque transações recorrentes mensais têm apenas uma ocorrência por mês
    const modifiedByMonthYear = new Map<string, Transaction>();
    modifiedTransactions.forEach((t) => {
      const tDate = parseLocalDate(t.date);
      const monthYearKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
      // Se já existe uma transação para este mês, mantém a mais recente (por data de criação ou data)
      const existing = modifiedByMonthYear.get(monthYearKey);
      if (!existing || new Date(t.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        modifiedByMonthYear.set(monthYearKey, t);
      }
    });
    
    // Cria um Set de meses/anos já processados para evitar duplicatas
    const processedMonths = new Set<string>();
    
    // PRIMEIRO: Adiciona as transações materializadas que são ANTERIORES à data de início atual
    // (estas são as ocorrências passadas que foram preservadas quando "all_future" foi usado)
    modifiedTransactions
      .filter((t) => {
        const tDate = parseLocalDate(t.date);
        // Verifica se é de um mês/ano ANTERIOR ao mês/ano da data de início
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();
        // Só inclui se o mês/ano é estritamente anterior
        return tYear < startYear || (tYear === startYear && tMonth < startMonth);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((t, idx) => {
        const tDate = parseLocalDate(t.date);
        const monthYearKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
        
        // Pula se já processamos este mês (para evitar múltiplas entradas do mesmo mês)
        if (processedMonths.has(monthYearKey)) return;
        processedMonths.add(monthYearKey);
        
        // Usa a transação mais recente para este mês
        const txToUse = modifiedByMonthYear.get(monthYearKey) || t;
        const txDate = parseLocalDate(txToUse.date);
        
        // Verifica se esta data está no excludedDates (indica edição individual via "Only this occurrence")
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
          isCurrent: txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear(),
          occurrenceNumber: idx + 1,
          isModified: true,
          modifiedTransaction: txToUse,
          isIndividuallyEdited, // Só mostra "edited" se foi edição individual
        });
      });
    
    // Calcula o offset para numeração das ocorrências futuras
    const pastOccurrencesCount = occurrences.length;
    
    // Calcula a próxima ocorrência a partir de hoje
    let nextOccurrence = new Date(startDate);
    
    if (transaction.frequency === "monthly") {
      // Avança até a próxima ocorrência que ainda não passou
      while (nextOccurrence < today) {
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
      }
      
      // Se a próxima ocorrência for este mês, voltamos uma posição para incluir o mês atual
      const currentMonthOcc = new Date(nextOccurrence);
      if (currentMonthOcc.getMonth() === today.getMonth() && currentMonthOcc.getFullYear() === today.getFullYear()) {
        // Já está no mês atual, começamos daqui
      } else {
        // Verifica se o mês atual tem uma ocorrência
        const thisMonthOcc = new Date(startDate);
        while (thisMonthOcc.getFullYear() < today.getFullYear() || 
               (thisMonthOcc.getFullYear() === today.getFullYear() && thisMonthOcc.getMonth() < today.getMonth())) {
          thisMonthOcc.setMonth(thisMonthOcc.getMonth() + 1);
        }
        if (thisMonthOcc.getMonth() === today.getMonth() && thisMonthOcc.getFullYear() === today.getFullYear()) {
          nextOccurrence = thisMonthOcc;
        }
      }
      
      // Calcula o número inicial para as ocorrências futuras
      // Leva em conta as ocorrências passadas materializadas
      const startOccurrenceNumber = pastOccurrencesCount + 1;
      
      // Gera 12 ocorrências a partir da próxima, ignorando datas excluídas
      const excludedDates = transaction.excludedDates || [];
      let occurrenceCount = 0;
      let monthOffset = 0;
      
      // Função auxiliar para formatar data local no formato YYYY-MM-DD
      const formatLocalDate = (d: Date): string => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      
      while (occurrenceCount < 12) {
        const occDate = new Date(nextOccurrence);
        occDate.setMonth(nextOccurrence.getMonth() + monthOffset);
        
        // Verifica se esta data está excluída (usando formato local)
        const occDateString = formatLocalDate(occDate);
        const monthYearKey = `${occDate.getFullYear()}-${String(occDate.getMonth() + 1).padStart(2, "0")}`;
        
        // Pula se este mês já foi processado (pelo primeiro bloco)
        if (processedMonths.has(monthYearKey)) {
          monthOffset++;
          continue;
        }
        
        // Verifica se existe uma transação modificada para este mês/ano
        const modifiedTx = modifiedByMonthYear.get(monthYearKey);
        
        // Se a data está excluída e não tem transação modificada para este mês, pula
        if (excludedDates.includes(occDateString) && !modifiedTx) {
          monthOffset++;
          continue;
        }
        
        // Marca o mês como processado
        processedMonths.add(monthYearKey);
        
        const isPast = occDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isCurrent = occDate.getMonth() === today.getMonth() && occDate.getFullYear() === today.getFullYear();
        
        // Se tem transação modificada, usa ela; senão usa a ocorrência virtual
        const finalDate = modifiedTx ? modifiedTx.date : occDateString;
        const finalDateObj = modifiedTx ? parseLocalDate(modifiedTx.date) : occDate;
        
        // Verifica se esta data está no excludedDates (indica edição individual via "Only this occurrence")
        const isIndividuallyEdited = modifiedTx && excludedDatesSet.has(modifiedTx.date);
        
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
          // Adiciona informação de modificação
          isModified: !!modifiedTx,
          modifiedTransaction: modifiedTx,
          isIndividuallyEdited, // Só mostra "edited" se foi edição individual
        });
        
        occurrenceCount++;
        monthOffset++;
      }
    } else if (transaction.frequency === "yearly") {
      // Cria um mapa de ano -> transação modificada para transações anuais
      const modifiedByYear = new Map<number, Transaction>();
      modifiedTransactions.forEach((t) => {
        const tDate = parseLocalDate(t.date);
        const year = tDate.getFullYear();
        // Se já existe uma transação para este ano, mantém a mais recente (por data de criação)
        const existing = modifiedByYear.get(year);
        if (!existing || new Date(t.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
          modifiedByYear.set(year, t);
        }
      });
      
      // Para anuais, mostra 12 ocorrências (12 anos à frente)
      while (nextOccurrence < today) {
        nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
      }
      
      // Calcula o número inicial para as ocorrências futuras
      // Leva em conta as ocorrências passadas materializadas
      const startOccurrenceNumber = pastOccurrencesCount + 1;
      
      // Gera 12 ocorrências anuais, ignorando datas excluídas
      const excludedDatesYearly = transaction.excludedDates || [];
      let yearlyCount = 0;
      let yearOffset = 0;
      
      // Função auxiliar para formatar data local no formato YYYY-MM-DD
      const formatLocalDateYearly = (d: Date): string => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      
      while (yearlyCount < 12) {
        const occDate = new Date(nextOccurrence);
        occDate.setFullYear(nextOccurrence.getFullYear() + yearOffset);
        
        // Verifica se esta data está excluída (usando formato local)
        const occDateString = formatLocalDateYearly(occDate);
        const yearKey = occDate.getFullYear();
        
        // Pula se este ano já foi processado (pelo primeiro bloco)
        if (processedMonths.has(`year-${yearKey}`)) {
          yearOffset++;
          continue;
        }
        
        // Verifica se existe uma transação modificada para este ano
        const modifiedTxYearly = modifiedByYear.get(yearKey);
        
        if (excludedDatesYearly.includes(occDateString) && !modifiedTxYearly) {
          yearOffset++;
          continue; // Pula esta ocorrência se está excluída E não tem modificada
        }
        
        // Marca o ano como processado
        processedMonths.add(`year-${yearKey}`);
        
        // Se tem transação modificada, usa ela; senão usa a ocorrência virtual
        const finalDate = modifiedTxYearly ? modifiedTxYearly.date : occDateString;
        const finalDateObj = modifiedTxYearly ? parseLocalDate(modifiedTxYearly.date) : occDate;
        
        const isPast = finalDateObj < today;
        const isCurrent = finalDateObj.getFullYear() === today.getFullYear() && 
          finalDateObj.getMonth() === today.getMonth();
        
        // Verifica se esta data está no excludedDates (indica edição individual via "Only this occurrence")
        const isIndividuallyEditedYearly = modifiedTxYearly && excludedDatesSet.has(modifiedTxYearly.date);
        
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
          // Adiciona informação de modificação
          isModified: !!modifiedTxYearly,
          modifiedTransaction: modifiedTxYearly,
          isIndividuallyEdited: isIndividuallyEditedYearly, // Só mostra "edited" se foi edição individual
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

  // Cria uma transação virtual para uma ocorrência específica
  const createVirtualTransaction = (
    baseTransaction: Transaction,
    occurrence: RecurringOccurrence
  ): Transaction => {
    // Extrai ano e mês da data da ocorrência para criar o ID virtual
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

  // Handlers para ações nas ocorrências
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

  const renderRecurringCard = (t: Transaction) => {
    const isExpanded = expandedItems.has(t.id);
    const isIncome = t.type === "income";
    const occurrences = calculateOccurrences(t);
    const occurrencesList = getOccurrencesList(t);

    return (
      <Card
        key={t.id}
        elevation={0}
        sx={{
          mb: 2,
          position: "relative",
          overflow: "hidden",
          background: theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          borderLeft: `3px solid ${isIncome ? "#059669" : "#DC2626"}`,
          borderRadius: "16px",
          boxShadow: theme.palette.mode === "dark"
            ? `0 6px 24px -6px ${alpha(isIncome ? "#059669" : "#DC2626", 0.2)}`
            : `0 6px 24px -6px ${alpha(isIncome ? "#059669" : "#DC2626", 0.15)}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.palette.mode === "dark"
              ? `0 10px 32px -6px ${alpha(isIncome ? "#059669" : "#DC2626", 0.3)}`
              : `0 10px 32px -6px ${alpha(isIncome ? "#059669" : "#DC2626", 0.25)}`,
          },
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              cursor: "pointer",
            }}
            onClick={() => toggleExpand(t.id)}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                {isIncome ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
                <Typography variant="subtitle1" fontWeight={600}>
                  {t.description}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={t.category} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {t.paymentMethod}
                </Typography>
              </Box>
              {/* Tags - Componente padronizado em formato pílula (só shared, recorrência exibida separadamente) */}
              <TransactionTags 
                transaction={t} 
                showRecurring={false} 
                showInstallments={false} 
              />
            </Box>

            <Box sx={{ textAlign: "right", minWidth: 120 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color={isIncome ? "success.main" : "error.main"}
              >
                {isIncome ? "+" : "-"}{formatCurrency(t.amount || 0)}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", mt: 0.5, flexWrap: "wrap" }}>
                <Chip
                  icon={<RepeatIcon sx={{ fontSize: 14 }} />}
                  label={t.frequency === "monthly" ? "Monthly" : "Yearly"}
                  size="small"
                  color={t.frequency === "monthly" ? "info" : "warning"}
                  variant="outlined"
                />
                <Tooltip title={t.isPaid ? "Paid" : "Unpaid"}>
                  <Chip
                    icon={t.isPaid ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <UnpaidIcon sx={{ fontSize: 14 }} />}
                    label={t.isPaid ? "Paid" : "Unpaid"}
                    size="small"
                    color={t.isPaid ? "success" : "default"}
                    variant={t.isPaid ? "filled" : "outlined"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePaid(t.id, !t.isPaid);
                    }}
                    sx={{ 
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.05)",
                      }
                    }}
                  />
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Info Row */}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Started: {formatDate(t.date)}
                </Typography>
              </Box>
              <Chip
                label={`${occurrences}x occurred`}
                size="small"
                color="default"
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ScheduleIcon fontSize="small" color="primary" />
              <Typography variant="body2" color="primary.main" fontWeight={500}>
                Next: {getNextOccurrence(t)}
              </Typography>
            </Box>
          </Box>

          {/* Related Transaction (Income) - Mostrar quando for compartilhado */}
          {(() => {
            const relatedTransaction = getRelatedTransaction(t);
            if (!relatedTransaction) return null;
            
            return (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" fontWeight={500}>
                      Compartilhado com {t.sharedWith}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" fontWeight={700} color="success.main">
                      +{formatCurrency(relatedTransaction.amount || 0)}
                    </Typography>
                    <Tooltip title={relatedTransaction.isPaid ? "Recebido" : "Pendente"}>
                      <Chip
                        icon={relatedTransaction.isPaid ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <UnpaidIcon sx={{ fontSize: 14 }} />}
                        label={relatedTransaction.isPaid ? "Recebido" : "Pendente"}
                        size="small"
                        color={relatedTransaction.isPaid ? "success" : "warning"}
                        variant={relatedTransaction.isPaid ? "filled" : "outlined"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePaid(relatedTransaction.id, !relatedTransaction.isPaid);
                        }}
                        sx={{ 
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "scale(1.05)",
                          }
                        }}
                      />
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Valor líquido: {formatCurrency((t.amount || 0) - (relatedTransaction.amount || 0))}
                </Typography>
              </Box>
            );
          })()}

          {/* Expand Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <Button
              size="small"
              onClick={() => toggleExpand(t.id)}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none" }}
            >
              {isExpanded ? "Hide transactions" : `View next 12 ${t.frequency === "monthly" ? "months" : "years"}`}
            </Button>
          </Box>
        </CardContent>

        {/* Occurrences List */}
        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: 2 }}>
            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2, flexWrap: "wrap" }}>
              <Button
                size="small"
                variant={t.isPaid ? "outlined" : "contained"}
                color={t.isPaid ? "inherit" : "success"}
                startIcon={t.isPaid ? <UnpaidIcon /> : <CheckCircleIcon />}
                onClick={() => onTogglePaid(t.id, !t.isPaid)}
                sx={{
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {t.isPaid ? "Mark as Unpaid" : "Mark as Paid"}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => onEdit(t)}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(t.id)}
              >
                Delete
              </Button>
            </Box>

            {/* Tabs para transações compartilhadas */}
            {(() => {
              const relatedTx = getRelatedTransaction(t);
              const hasRelated = !!relatedTx;
              const currentTab = selectedSharedTab[t.id] || 0;
              
              return hasRelated ? (
                <Box sx={{ mb: 2 }}>
                  <Tabs
                    value={currentTab}
                    onChange={(_, newValue) => setSelectedSharedTab((prev) => ({ ...prev, [t.id]: newValue }))}
                    variant="fullWidth"
                    sx={{
                      bgcolor: alpha(theme.palette.action.hover, 0.04),
                      borderRadius: "12px",
                      p: 0.5,
                      minHeight: 40,
                      "& .MuiTabs-indicator": {
                        display: "none",
                      },
                      "& .MuiTab-root": {
                        minHeight: 36,
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        transition: "all 0.2s ease-in-out",
                        "&.Mui-selected": {
                          bgcolor: theme.palette.mode === "dark" 
                            ? alpha(theme.palette.primary.main, 0.2)
                            : alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        },
                      },
                    }}
                  >
                    <Tab 
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <TrendingDownIcon fontSize="small" />
                          Despesa
                        </Box>
                      } 
                    />
                    <Tab 
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <TrendingUpIcon fontSize="small" />
                          Compartilhado com {t.sharedWith}
                        </Box>
                      } 
                    />
                  </Tabs>
                </Box>
              ) : null;
            })()}

            {/* Tabela de Ocorrências Futuras (similar ao SplitsView) */}
            {(selectedSharedTab[t.id] || 0) === 0 && (
              <>
            <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VisibilityIcon fontSize="small" color="primary" />
              Next 12 {t.frequency === "monthly" ? "Months" : "Years"}
            </Typography>
            
            {isMobile ? (
              // Mobile: Cards compactos com ações
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {occurrencesList.map((occ, idx) => {
                  const isPaidOccurrence = occ.isCurrent && t.isPaid;
                  
                  return (
                    <Paper
                      key={idx}
                      sx={{
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        opacity: isPaidOccurrence ? 0.6 : 1,
                        bgcolor: occ.isCurrent 
                          ? alpha(theme.palette.primary.main, 0.08) 
                          : isPaidOccurrence
                            ? "action.disabledBackground"
                            : "background.paper",
                        border: occ.isCurrent ? 2 : 1,
                        borderColor: occ.isCurrent ? "primary.main" : "divider",
                        borderRadius: "12px",
                      }}
                    >
                      <Checkbox
                        checked={isPaidOccurrence}
                        onChange={(e) => {
                          if (occ.isCurrent) {
                            onTogglePaid(t.id, e.target.checked);
                          }
                        }}
                        size="small"
                        color="success"
                        disabled={!occ.isCurrent}
                        sx={{
                          opacity: occ.isCurrent ? 1 : 0.3,
                          p: 0.5,
                        }}
                      />
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: occ.isCurrent 
                            ? alpha(theme.palette.primary.main, 0.15) 
                            : alpha(theme.palette.action.hover, 0.1),
                          border: `1px solid ${occ.isCurrent ? theme.palette.primary.main : "transparent"}`,
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          fontWeight={700}
                          color={occ.isCurrent ? "primary.main" : "text.secondary"}
                          sx={{ fontSize: 10 }}
                        >
                          #{occ.occurrenceNumber}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                          <Typography 
                            variant="body2" 
                            fontWeight={occ.isCurrent ? 600 : 500}
                            sx={{
                              textDecoration: isPaidOccurrence ? "line-through" : "none",
                            }}
                          >
                            {occ.formattedDate}
                          </Typography>
                          {occ.isCurrent && (
                            <Chip 
                              label={isPaidOccurrence ? "Paid" : "This Month"} 
                              size="small" 
                              color={isPaidOccurrence ? "success" : "primary"} 
                              sx={{ height: 18, fontSize: 9 }} 
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {occ.month} {occ.year}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={isIncome ? "success.main" : "error.main"}
                        sx={{ 
                          fontFamily: "monospace", 
                          fontSize: 12,
                          textDecoration: isPaidOccurrence ? "line-through" : "none",
                        }}
                      >
                        {isIncome ? "+" : "-"}{formatCurrency(t.amount || 0)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileOccurrenceMenuAnchor({ 
                            element: e.currentTarget, 
                            transaction: t, 
                            occurrence: occ 
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
              // Desktop: Tabela similar ao SplitsView
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), width: 50 }}>Paid</TableCell>
                    <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), width: 80 }}>#</TableCell>
                    {/* Mostra coluna de descrição se há transações modificadas */}
                    {occurrencesList.some(o => o.isModified) && (
                      <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Description</TableCell>
                    )}
                    <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Date</TableCell>
                    <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Period</TableCell>
                    <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "right" }}>Amount</TableCell>
                    <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center", width: 100 }}>Status</TableCell>
                    <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center", width: 100 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {occurrencesList.map((occ, idx) => {
                    // Verifica se esta ocorrência está paga (baseado no mês atual da transação base ou da modificada)
                    const isPaidOccurrence = occ.isModified 
                      ? occ.modifiedTransaction?.isPaid 
                      : (occ.isCurrent && t.isPaid);
                    
                    // Usa valores da transação modificada se existir
                    const displayAmount = occ.modifiedTransaction?.amount ?? t.amount;
                    const displayDescription = occ.modifiedTransaction?.description ?? t.description;
                    const displayType = occ.modifiedTransaction?.type ?? t.type;
                    const isModifiedIncome = displayType === "income";
                    
                    return (
                      <TableRow
                        key={idx}
                        sx={{
                          opacity: isPaidOccurrence ? 0.6 : 1,
                          bgcolor: occ.isCurrent 
                            ? alpha(theme.palette.primary.main, 0.08) 
                            : isPaidOccurrence
                              ? "action.disabledBackground"
                              : occ.isModified
                                ? alpha(theme.palette.warning.main, 0.05)
                                : "transparent",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.action.hover, 0.08),
                          },
                          "& td": {
                            textDecoration: isPaidOccurrence ? "line-through" : "none",
                            textDecorationColor: "text.disabled",
                          },
                        }}
                      >
                        <TableCell>
                          <Tooltip title={isPaidOccurrence ? "Mark as Unpaid" : "Mark as Paid"}>
                            <Checkbox
                              checked={!!isPaidOccurrence}
                              onChange={(e) => {
                                // Para transação modificada, usa o ID dela
                                if (occ.isModified && occ.modifiedTransaction) {
                                  onTogglePaid(occ.modifiedTransaction.id, e.target.checked);
                                } else if (occ.isCurrent) {
                                  onTogglePaid(t.id, e.target.checked);
                                }
                              }}
                              size="small"
                              color="success"
                              disabled={!occ.isCurrent && !occ.isModified}
                              sx={{
                                opacity: (occ.isCurrent || occ.isModified) ? 1 : 0.3,
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`#${occ.occurrenceNumber}`}
                            size="small"
                            variant="outlined"
                            color={occ.isCurrent ? "primary" : "default"}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        {/* Coluna de descrição (se há modificadas) */}
                        {occurrencesList.some(o => o.isModified) && (
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Typography 
                                variant="caption" 
                                fontWeight={occ.isModified ? 600 : 400}
                                color={occ.isModified ? "primary.main" : "text.secondary"}
                                sx={{ 
                                  overflow: "hidden", 
                                  textOverflow: "ellipsis", 
                                  whiteSpace: "nowrap",
                                  flex: 1,
                                }}
                              >
                                {displayDescription}
                              </Typography>
                              {occ.isIndividuallyEdited && (
                                <Chip
                                  label="edited"
                                  size="small"
                                  color="warning"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                    "& .MuiChip-label": { px: 0.75 },
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="body2" fontWeight={occ.isCurrent ? 600 : 400}>
                            {occ.formattedDate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {occ.month} {occ.year}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            color={isModifiedIncome ? "success.main" : "error.main"}
                          >
                            {isModifiedIncome ? "+" : "-"}{formatCurrency(displayAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {occ.isCurrent ? (
                            <Chip 
                              label={isPaidOccurrence ? "Paid" : "Current"} 
                              size="small" 
                              color={isPaidOccurrence ? "success" : "primary"} 
                              sx={{ fontWeight: 500 }}
                            />
                          ) : occ.isModified ? (
                            <Chip 
                              label={isPaidOccurrence ? "Paid" : "Modified"} 
                              size="small" 
                              color={isPaidOccurrence ? "success" : "warning"} 
                              sx={{ fontWeight: 500 }}
                            />
                          ) : (
                            <Chip 
                              label="Scheduled" 
                              size="small" 
                              variant="outlined" 
                              color="default"
                              sx={{ opacity: 0.7 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
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
                          <Tooltip title="Delete">
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
                borderRadius: "20px",
                bgcolor: theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.7)
                  : alpha("#FFFFFF", 0.9),
                backdropFilter: "blur(16px)",
                border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Annual Impact
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {t.frequency === "monthly" ? "12 months × " : "1 year × "}{formatCurrency(t.amount || 0)}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={isIncome ? "success.main" : "error.main"}
                >
                  {isIncome ? "+" : "-"}{formatCurrency((t.amount || 0) * (t.frequency === "monthly" ? 12 : 1))}
                </Typography>
              </Box>
            </Paper>
              </>
            )}

            {/* Tab: Compartilhado (transação relacionada) */}
            {(selectedSharedTab[t.id] || 0) === 1 && (() => {
              const relatedTx = getRelatedTransaction(t);
              if (!relatedTx) return null;
              
              // Gera lista de ocorrências para a transação relacionada
              const relatedOccurrencesList = getOccurrencesList(relatedTx);
              
              return (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <VisibilityIcon fontSize="small" color="success" />
                    Próximos 12 {relatedTx.frequency === "monthly" ? "Meses" : "Anos"} - Compartilhado
                  </Typography>
                  
                  {isMobile ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {relatedOccurrencesList.map((occ, idx) => {
                        const isPaidOccurrence = occ.isCurrent && relatedTx.isPaid;
                        
                        return (
                          <Paper
                            key={idx}
                            sx={{
                              p: 1.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              opacity: isPaidOccurrence ? 0.6 : 1,
                              bgcolor: occ.isCurrent 
                                ? alpha(theme.palette.success.main, 0.08) 
                                : isPaidOccurrence
                                  ? "action.disabledBackground"
                                  : "background.paper",
                              border: occ.isCurrent ? 2 : 1,
                              borderColor: occ.isCurrent ? "success.main" : "divider",
                              borderRadius: "12px",
                            }}
                          >
                            <Checkbox
                              checked={isPaidOccurrence}
                              onChange={(e) => {
                                if (occ.isCurrent) {
                                  onTogglePaid(relatedTx.id, e.target.checked);
                                }
                              }}
                              size="small"
                              color="success"
                              disabled={!occ.isCurrent}
                            />
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: occ.isCurrent
                                  ? alpha(theme.palette.success.main, 0.15) 
                                  : alpha(theme.palette.action.hover, 0.1),
                              }}
                            >
                              <Typography 
                                variant="caption" 
                                fontWeight={700}
                                color={occ.isCurrent ? "success.main" : "text.secondary"}
                                sx={{ fontSize: 10 }}
                              >
                                #{occ.occurrenceNumber}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={occ.isCurrent ? 600 : 500}
                              >
                                {occ.formattedDate}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {occ.month} {occ.year}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="success.main"
                              sx={{ fontFamily: "monospace", fontSize: 12 }}
                            >
                              +{formatCurrency(occ.modifiedTransaction?.amount ?? relatedTx.amount ?? 0)}
                            </Typography>
                          </Paper>
                        );
                      })}
                    </Box>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), width: 50 }}>Recebido</TableCell>
                          <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), width: 80 }}>#</TableCell>
                          <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Data</TableCell>
                          <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Período</TableCell>
                          <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "right" }}>Valor</TableCell>
                          <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center", width: 100 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relatedOccurrencesList.map((occ, idx) => {
                          const isPaidOccurrence = occ.isCurrent && relatedTx.isPaid;
                          
                          return (
                            <TableRow
                              key={idx}
                              sx={{
                                opacity: isPaidOccurrence ? 0.6 : 1,
                                bgcolor: occ.isCurrent
                                  ? alpha(theme.palette.success.main, 0.08) 
                                  : isPaidOccurrence
                                    ? "action.disabledBackground"
                                    : "transparent",
                                "&:hover": {
                                  bgcolor: alpha(theme.palette.action.hover, 0.08),
                                },
                              }}
                            >
                              <TableCell>
                                <Tooltip title={occ.isCurrent ? (isPaidOccurrence ? "Marcar como não recebido" : "Marcar como recebido") : "Só é possível alterar o mês atual"}>
                                  <span>
                                    <Checkbox
                                      checked={isPaidOccurrence}
                                      onChange={(e) => {
                                        if (occ.isCurrent) {
                                          onTogglePaid(relatedTx.id, e.target.checked);
                                        }
                                      }}
                                      size="small"
                                      color="success"
                                      disabled={!occ.isCurrent}
                                    />
                                  </span>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`#${occ.occurrenceNumber}`}
                                  size="small"
                                  variant="outlined"
                                  color={occ.isCurrent ? "success" : "default"}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={occ.isCurrent ? 600 : 400}>
                                  {occ.formattedDate}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {occ.month} {occ.year}
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                <Typography 
                                  variant="body2" 
                                  fontWeight={600}
                                  color="success.main"
                                >
                                  +{formatCurrency(occ.modifiedTransaction?.amount ?? relatedTx.amount ?? 0)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {isPaidOccurrence ? (
                                  <Chip 
                                    label="Recebido" 
                                    size="small" 
                                    color="success" 
                                    sx={{ fontWeight: 500 }}
                                  />
                                ) : occ.isCurrent ? (
                                  <Chip 
                                    label="Atual" 
                                    size="small" 
                                    color="warning" 
                                    sx={{ fontWeight: 500 }}
                                  />
                                ) : (
                                  <Chip 
                                    label="Agendado" 
                                    size="small" 
                                    variant="outlined" 
                                    color="default"
                                    sx={{ opacity: 0.7 }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {/* Annual Impact - Related */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      mt: 2, 
                      borderRadius: "20px",
                      bgcolor: theme.palette.mode === "dark"
                        ? alpha(theme.palette.background.paper, 0.7)
                        : alpha("#FFFFFF", 0.9),
                      backdropFilter: "blur(16px)",
                      border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Impacto Anual (Compartilhado)
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        {relatedTx.frequency === "monthly" ? "12 meses × " : "1 ano × "}{formatCurrency(relatedTx.amount || 0)}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color="success.main"
                      >
                        +{formatCurrency((relatedTx.amount || 0) * (relatedTx.frequency === "monthly" ? 12 : 1))}
                      </Typography>
                    </Box>
                  </Paper>
                </>
              );
            })()}
          </Box>
        </Collapse>
      </Card>
    );
  };

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: 3,
      // Extra padding para bottom navigation + FABs
      pb: { xs: "180px", md: 0 },
    }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Recurring Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your recurring income and expenses
          </Typography>
        </Box>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
          >
            Transaction
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={isMobile ? 1.5 : 2} sx={{ alignItems: "stretch" }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#6366f1", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ 
                  width: 28, height: 28, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: alpha("#6366f1", 0.1), border: `1px solid ${alpha("#6366f1", 0.2)}`
                }}>
                  <RepeatIcon sx={{ color: "#6366f1", fontSize: 16 }} />
                </Box>
                <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                  Total Recurring
                </Typography>
              </Box>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                {stats.total}
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, mt: 1, flexWrap: "wrap" }}>
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 500 }}>
                  {stats.incomeCount} income
                </Typography>
                <Typography variant="caption" sx={{ color: "#DC2626", fontWeight: 500 }}>
                  {stats.expenseCount} expense
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha(stats.monthlyBalance >= 0 ? "#059669" : "#DC2626", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: stats.monthlyBalance >= 0
                  ? "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ 
                  width: 28, height: 28, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: alpha("#06B6D4", 0.1), border: `1px solid ${alpha("#06B6D4", 0.2)}`
                }}>
                  <CalendarIcon sx={{ color: "#06B6D4", fontSize: 16 }} />
                </Box>
                <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                  Monthly
                </Typography>
              </Box>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: stats.monthlyBalance >= 0 ? "#059669" : "#DC2626", letterSpacing: "-0.02em" }}>
                {formatCurrency(stats.monthlyBalance)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 500 }}>
                  +{formatCurrency(stats.monthlyIncome)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#DC2626", fontWeight: 500 }}>
                  -{formatCurrency(stats.monthlyExpense)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha(stats.annualizedBalance >= 0 ? "#059669" : "#DC2626", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: stats.annualizedBalance >= 0
                  ? "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ 
                  width: 28, height: 28, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: alpha("#F59E0B", 0.1), border: `1px solid ${alpha("#F59E0B", 0.2)}`
                }}>
                  <InfiniteIcon sx={{ color: "#F59E0B", fontSize: 16 }} />
                </Box>
                <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                  Yearly
                </Typography>
              </Box>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: stats.annualizedBalance >= 0 ? "#059669" : "#DC2626", letterSpacing: "-0.02em" }}>
                {formatCurrency(stats.annualizedBalance)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 500 }}>
                  +{formatCurrency(stats.annualizedIncome)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#DC2626", fontWeight: 500 }}>
                  -{formatCurrency(stats.annualizedExpense)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`,
              borderRadius: "16px",
              boxShadow: `0 8px 32px -8px ${alpha("#6366f1", 0.4)}`,
              transition: "all 0.2s ease-in-out",
              "&:hover": { 
                transform: "translateY(-2px)",
                boxShadow: `0 12px 40px -8px ${alpha("#6366f1", 0.5)}`,
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ 
                  width: 28, height: 28, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: alpha("#FFFFFF", 0.2)
                }}>
                  <TrendingUpIcon sx={{ color: "#FFFFFF", fontSize: 16 }} />
                </Box>
                <Typography variant="overline" sx={{ color: alpha("#FFFFFF", 0.8), letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                  Annual Impact
                </Typography>
              </Box>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {formatCurrency(stats.annualizedBalance)}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.7), mt: 0.5, display: "block" }}>
                Monthly × 12 + Yearly
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          overflow: "hidden",
          bgcolor: theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha("#FFFFFF", 0.9),
          backdropFilter: "blur(20px)",
          border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
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
          placeholder="Search..."
          minWidth={200}
        />

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
            <InputLabel>Frequency</InputLabel>
            <Select
              value={filterFrequency}
              label="Frequency"
              onChange={(e: SelectChangeEvent) =>
                setFilterFrequency(e.target.value as "all" | "monthly" | "yearly")
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              label="Category"
              onChange={(e: SelectChangeEvent) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {allCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Refresh Button */}
          {onRefreshData && (
            <Tooltip title="Atualizar dados">
              <IconButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
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
      </Paper>

      {/* Recurring Items */}
      {recurringTransactions.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: "center",
            borderRadius: "20px",
            bgcolor: theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha("#FFFFFF", 0.9),
            backdropFilter: "blur(20px)",
            border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          }}
        >
          <RepeatIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography color="text.secondary" fontStyle="italic">
            No recurring transactions found with the current filters.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {recurringTransactions.map((t) => renderRecurringCard(t))}
        </Box>
      )}

      {/* Mobile Action Menu */}
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
            {mobileMenuAnchor.transaction?.isPaid ? (
              <UnpaidIcon fontSize="small" />
            ) : (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {mobileMenuAnchor.transaction?.isPaid ? "Mark as Unpaid" : "Mark as Paid"}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileMenuAnchor.transaction) {
              onEdit(mobileMenuAnchor.transaction);
            }
            setMobileMenuAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileMenuAnchor.transaction) {
              onDelete(mobileMenuAnchor.transaction.id);
            }
            setMobileMenuAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
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

      {/* Mobile Menu para Ocorrências */}
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
              {mobileOccurrenceMenuAnchor.transaction?.isPaid ? "Mark as Unpaid" : "Mark as Paid"}
            </ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            if (mobileOccurrenceMenuAnchor.transaction && mobileOccurrenceMenuAnchor.occurrence) {
              handleOccurrenceEdit(
                mobileOccurrenceMenuAnchor.transaction, 
                mobileOccurrenceMenuAnchor.occurrence
              );
            }
            handleCloseMobileOccurrenceMenu();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileOccurrenceMenuAnchor.transaction && mobileOccurrenceMenuAnchor.occurrence) {
              handleOccurrenceDelete(
                mobileOccurrenceMenuAnchor.transaction, 
                mobileOccurrenceMenuAnchor.occurrence
              );
            }
            handleCloseMobileOccurrenceMenu();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

    </Box>
  );
};

export default RecurringView;
