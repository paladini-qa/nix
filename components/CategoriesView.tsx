import React, { useState, useMemo, useContext, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Grid,
  useMediaQuery,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Chip,
  Collapse,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Category as CategoryIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UnpaidIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import TransactionTags from "./TransactionTags";
import { Transaction, TransactionType, ColorConfig, CategoryColors } from "../types";
import { ColorsContext } from "../App";
import ColorPicker from "./ColorPicker";
import DateFilter from "./DateFilter";

// Cores padrão para novas categorias
const DEFAULT_INCOME_COLORS: ColorConfig = { primary: "#10b981", secondary: "#059669" };
const DEFAULT_EXPENSE_COLORS: ColorConfig = { primary: "#ef4444", secondary: "#dc2626" };

interface CategoriesViewProps {
  transactions: Transaction[];
  categories: { income: string[]; expense: string[] };
  categoryColors: CategoryColors;
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
  onAddCategory: (type: TransactionType, category: string) => void;
  onRemoveCategory: (type: TransactionType, category: string) => void;
  onUpdateCategoryColor: (type: TransactionType, category: string, colors: ColorConfig) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  initialSelectedCategory?: { name: string; type: TransactionType } | null;
  onClearInitialCategory?: () => void;
}

interface CategorySummary {
  name: string;
  type: TransactionType;
  total: number;
  transactionCount: number;
  colors: ColorConfig;
  unpaidCount: number;
  unpaidAmount: number;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({
  transactions,
  categories,
  categoryColors,
  selectedMonth,
  selectedYear,
  onDateChange,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategoryColor,
  onTogglePaid,
  onEditTransaction,
  onDeleteTransaction,
  initialSelectedCategory,
  onClearInitialCategory,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { getCategoryColor } = useContext(ColorsContext);

  // Tab state: 0 = Overview, 1 = Manage
  const [tabValue, setTabValue] = useState(0);
  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  
  // Estado para categoria selecionada (detalhes)
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; type: TransactionType } | null>(null);

  // Sincroniza com categoria inicial externa
  useEffect(() => {
    if (initialSelectedCategory) {
      setSelectedCategory(initialSelectedCategory);
      onClearInitialCategory?.();
    }
  }, [initialSelectedCategory, onClearInitialCategory]);
  
  // Estado para menu de ações mobile
  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Gera transações recorrentes virtuais para o mês
  const generateRecurringTransactions = useMemo(() => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = selectedMonth + 1;
    const targetYear = selectedYear;

    transactions.forEach((t) => {
      if (!t.isRecurring || !t.frequency) return;
      if (t.installments && t.installments > 1) return;

      const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
      const targetDate = new Date(targetYear, targetMonth - 1, 1);

      if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

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
        });
      }
    });

    return virtualTransactions;
  }, [transactions, selectedMonth, selectedYear]);

  // Filtra transações do mês selecionado
  const monthTransactions = useMemo(() => {
    const baseTransactions = transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      return parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
    });

    return [...baseTransactions, ...generateRecurringTransactions];
  }, [transactions, selectedMonth, selectedYear, generateRecurringTransactions]);

  // Calcula resumo por categoria
  const categorySummaries = useMemo(() => {
    const incomeMap = new Map<string, CategorySummary>();
    const expenseMap = new Map<string, CategorySummary>();

    // Inicializa todas as categorias
    categories.income.forEach((cat) => {
      const colors = categoryColors.income?.[cat] || DEFAULT_INCOME_COLORS;
      incomeMap.set(cat, { name: cat, type: "income", total: 0, transactionCount: 0, colors, unpaidCount: 0, unpaidAmount: 0 });
    });
    categories.expense.forEach((cat) => {
      const colors = categoryColors.expense?.[cat] || DEFAULT_EXPENSE_COLORS;
      expenseMap.set(cat, { name: cat, type: "expense", total: 0, transactionCount: 0, colors, unpaidCount: 0, unpaidAmount: 0 });
    });

    // Processa transações do mês
    monthTransactions.forEach((tx) => {
      if (tx.type === "income") {
        const summary = incomeMap.get(tx.category);
        if (summary) {
          summary.total += tx.amount || 0;
          summary.transactionCount++;
          // Conta não pagas
          if (!tx.isPaid) {
            summary.unpaidCount++;
            summary.unpaidAmount += tx.amount || 0;
          }
        }
      } else {
        const summary = expenseMap.get(tx.category);
        if (summary) {
          summary.total += tx.amount || 0;
          summary.transactionCount++;
          // Conta não pagas
          if (!tx.isPaid) {
            summary.unpaidCount++;
            summary.unpaidAmount += tx.amount || 0;
          }
        }
      }
    });

    return {
      income: Array.from(incomeMap.values()).sort((a, b) => b.total - a.total),
      expense: Array.from(expenseMap.values()).sort((a, b) => b.total - a.total),
    };
  }, [monthTransactions, categories, categoryColors]);

  // Totais
  const totalIncome = categorySummaries.income.reduce((sum, s) => sum + s.total, 0);
  const totalExpense = categorySummaries.expense.reduce((sum, s) => sum + s.total, 0);

  // Transações da categoria selecionada
  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return monthTransactions
      .filter((tx) => tx.category === selectedCategory.name && tx.type === selectedCategory.type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthTransactions, selectedCategory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleAddCat = (type: TransactionType) => {
    const val = type === "income" ? newIncomeCat : newExpenseCat;
    const setVal = type === "income" ? setNewIncomeCat : setNewExpenseCat;

    if (val.trim()) {
      onAddCategory(type, val.trim());
      setVal("");
    }
  };

  // Renderiza card de categoria para visão geral
  const renderCategoryCard = (summary: CategorySummary, total: number) => {
    const percentage = total > 0 ? (summary.total / total) * 100 : 0;
    const IconComponent = summary.type === "income" ? TrendingUpIcon : TrendingDownIcon;

    return (
      <Paper
        key={summary.name}
        elevation={0}
        onClick={() => setSelectedCategory({ name: summary.name, type: summary.type })}
        sx={{
          p: isMobile ? 1.5 : 2,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          borderLeft: `3px solid ${summary.colors.primary}`,
          borderRadius: "12px",
          boxShadow: isDarkMode
            ? `0 4px 16px -4px ${alpha(summary.colors.primary, 0.2)}`
            : `0 4px 16px -4px ${alpha(summary.colors.primary, 0.15)}`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: isDarkMode
              ? `0 8px 24px -4px ${alpha(summary.colors.primary, 0.3)}`
              : `0 8px 24px -4px ${alpha(summary.colors.primary, 0.25)}`,
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(summary.colors.primary, 0.08)} 0%, ${alpha(summary.colors.secondary, 0.02)} 100%)`
              : `linear-gradient(135deg, ${alpha(summary.colors.primary, 0.04)} 0%, ${alpha(summary.colors.secondary, 0.01)} 100%)`,
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${summary.colors.primary}, ${summary.colors.secondary})`,
                display: "flex",
              }}
            >
              <IconComponent sx={{ color: "#fff", fontSize: 16 }} />
            </Box>
            <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ maxWidth: 120 }}>
              {summary.name}
            </Typography>
          </Box>
          <Tooltip title="Ver detalhes">
            <IconButton size="small" sx={{ color: summary.colors.primary, p: 0.5 }}>
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="h6" fontWeight="bold" sx={{ color: summary.colors.primary, mb: 0.5 }}>
          {formatCurrency(summary.total)}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: "20px",
              bgcolor: alpha(summary.colors.primary, 0.1),
              "& .MuiLinearProgress-bar": {
                borderRadius: "20px",
                background: `linear-gradient(90deg, ${summary.colors.primary}, ${summary.colors.secondary})`,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 30 }}>
            {percentage.toFixed(0)}%
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {summary.transactionCount} transaç{summary.transactionCount === 1 ? "ão" : "ões"}
          </Typography>
          {summary.unpaidCount > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={summary.unpaidCount === 1 ? "1 pendente" : `${summary.unpaidCount} pendentes`}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ height: 18, fontSize: "0.6rem", "& .MuiChip-icon": { fontSize: 12 } }}
            />
          )}
        </Box>
      </Paper>
    );
  };

  // Renderiza item de categoria para gerenciamento
  const renderManageItem = (cat: string, type: TransactionType) => {
    const defaultColors = type === "income" ? DEFAULT_INCOME_COLORS : DEFAULT_EXPENSE_COLORS;
    const colorKey = type === "income" ? categoryColors.income : categoryColors.expense;
    const colors = colorKey?.[cat] || defaultColors;
    const IconComponent = type === "income" ? TrendingUpIcon : TrendingDownIcon;

    return (
      <Paper
        key={cat}
        sx={{
          p: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          transition: "all 0.2s ease",
          border: `1px solid ${alpha(colors.primary, 0.2)}`,
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(colors.primary, 0.1)} 0%, ${alpha(colors.secondary, 0.05)} 100%)`
            : `linear-gradient(135deg, ${alpha(colors.primary, 0.06)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 6px 12px -3px ${alpha(colors.primary, 0.2)}`,
          },
        }}
      >
        <ColorPicker
          value={colors}
          onChange={(newColors) => onUpdateCategoryColor(type, cat, newColors)}
          size="small"
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1, minWidth: 0 }}>
          <IconComponent fontSize="small" sx={{ color: colors.primary }} />
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cat}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => onRemoveCategory(type, cat)}
          sx={{
            color: "text.secondary",
            p: 0.5,
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: "error.main",
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Paper>
    );
  };

  // View de detalhes da categoria
  if (selectedCategory) {
    const categoryColors2 = getCategoryColor(selectedCategory.type, selectedCategory.name);
    const IconComponent = selectedCategory.type === "income" ? TrendingUpIcon : TrendingDownIcon;
    const categoryTotal = selectedCategoryTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    // Cor baseada no tipo (verde para receita, vermelho para despesa)
    const typeColor = selectedCategory.type === "income" ? "#10b981" : "#ef4444";
    
    // Calcula transações não pagas da categoria selecionada
    const categoryUnpaidTransactions = selectedCategoryTransactions.filter((tx) => !tx.isPaid);
    const categoryUnpaidCount = categoryUnpaidTransactions.length;
    const categoryUnpaidAmount = categoryUnpaidTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton onClick={() => setSelectedCategory(null)} sx={{ mr: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box
              sx={{
                p: 1,
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${categoryColors2.primary}, ${categoryColors2.secondary})`,
                display: "flex",
              }}
            >
              <IconComponent sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                {selectedCategory.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCategory.type === "income" ? "Categoria de Receita" : "Categoria de Despesa"}
              </Typography>
            </Box>
          </Box>

          <DateFilter
            month={selectedMonth}
            year={selectedYear}
            onDateChange={onDateChange}
            showIcon
            compact={isMobile}
          />
        </Box>

        {/* Summary Card */}
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.5 : 2,
            position: "relative",
            overflow: "hidden",
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
              : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
            backdropFilter: "blur(16px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            boxShadow: `0 6px 24px -6px ${alpha(typeColor, 0.15)}`,
            borderRadius: "16px",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(135deg, ${alpha(typeColor, 0.06)} 0%, ${alpha(typeColor, 0.02)} 100%)`,
              pointerEvents: "none",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
            <Box
              sx={{
                width: isMobile ? 44 : 52,
                height: isMobile ? 44 : 52,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${alpha(typeColor, 0.2)} 0%, ${alpha(typeColor, 0.1)} 100%)`,
                border: `1px solid ${alpha(typeColor, 0.2)}`,
              }}
            >
              <IconComponent sx={{ color: typeColor, fontSize: isMobile ? 24 : 28 }} />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Total no Mês
              </Typography>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: typeColor, letterSpacing: "-0.02em" }}>
                {selectedCategory.type === "income" ? "" : "- "}{formatCurrency(categoryTotal)}
              </Typography>
            </Box>
            <Chip
              label={`${selectedCategoryTransactions.length} transações`}
              size="small"
              sx={{
                ml: "auto",
                bgcolor: alpha(typeColor, 0.1),
                color: typeColor,
              }}
            />
          </Box>
        </Paper>

        {/* Banner de transações não pagas */}
        {categoryUnpaidCount > 0 && (
          <Paper
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha("#f59e0b", 0.15)} 0%, ${alpha("#f59e0b", 0.05)} 100%)`
                : `linear-gradient(135deg, ${alpha("#f59e0b", 0.1)} 0%, ${alpha("#f59e0b", 0.03)} 100%)`,
              border: `1px solid ${alpha("#f59e0b", 0.3)}`,
              borderRadius: "12px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: "20px",
                  bgcolor: alpha("#f59e0b", 0.2),
                  display: "flex",
                }}
              >
                <WarningIcon sx={{ color: "#f59e0b" }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {categoryUnpaidCount === 1 ? "1 transação não paga" : `${categoryUnpaidCount} transações não pagas`}
                </Typography>
                {categoryUnpaidAmount > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Total a pagar: <strong style={{ color: "#f59e0b" }}>{formatCurrency(categoryUnpaidAmount)}</strong>
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Banner de todas pagas */}
        {categoryUnpaidCount === 0 && selectedCategoryTransactions.length > 0 && (
          <Paper
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha("#10b981", 0.15)} 0%, ${alpha("#10b981", 0.05)} 100%)`
                : `linear-gradient(135deg, ${alpha("#10b981", 0.1)} 0%, ${alpha("#10b981", 0.03)} 100%)`,
              border: `1px solid ${alpha("#10b981", 0.3)}`,
              borderRadius: "12px",
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: "20px",
                bgcolor: alpha("#10b981", 0.2),
                display: "flex",
              }}
            >
              <CheckCircleIcon sx={{ color: "#10b981" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600} color="#10b981">
              Todas as transações deste mês estão pagas!
            </Typography>
          </Paper>
        )}

        {/* Transactions Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Método</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Valor</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "center", width: 100 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedCategoryTransactions.length > 0 ? (
                selectedCategoryTransactions.map((tx, index) => (
                  <TableRow
                    key={tx.id}
                    hover
                    sx={{
                      bgcolor: index % 2 === 0 ? "transparent" : "action.hover",
                      opacity: tx.isPaid ? 0.7 : 1,
                    }}
                  >
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            textDecoration: tx.isPaid ? "line-through" : "none",
                            color: tx.isPaid ? "text.secondary" : "text.primary",
                          }}
                        >
                          {tx.description}
                        </Typography>
                        {/* Tags - Componente padronizado em formato pílula */}
                        <TransactionTags transaction={tx} showShared={false} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={tx.paymentMethod} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Tooltip title={tx.isPaid ? "Marcar como não pago" : "Marcar como pago"}>
                        <IconButton
                          size="small"
                          onClick={() => onTogglePaid(tx.id, !tx.isPaid)}
                          sx={{
                            color: tx.isPaid ? "#10b981" : "text.disabled",
                            "&:hover": {
                              bgcolor: tx.isPaid
                                ? alpha("#ef4444", 0.1)
                                : alpha("#10b981", 0.1),
                            },
                          }}
                        >
                          {tx.isPaid ? (
                            <CheckCircleIcon fontSize="small" />
                          ) : (
                            <UnpaidIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: typeColor,
                      }}
                    >
                      {selectedCategory.type === "income" ? "" : "- "}{formatCurrency(tx.amount || 0)}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {isMobile ? (
                        <IconButton
                          size="small"
                          onClick={(e) =>
                            setMobileActionAnchor({
                              element: e.currentTarget,
                              transaction: tx,
                            })
                          }
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                          <Tooltip title={
                            tx.isVirtual 
                              ? "Editar recorrência" 
                              : tx.isRecurring 
                                ? "Editar transação recorrente"
                                : tx.installments && tx.installments > 1
                                  ? "Editar parcelas"
                                  : "Editar"
                          }>
                            <IconButton
                              size="small"
                              onClick={() => onEditTransaction(tx)}
                              sx={{
                                color: categoryColors2.primary,
                                "&:hover": {
                                  bgcolor: alpha(categoryColors2.primary, 0.1),
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!tx.isVirtual && (
                            <Tooltip title="Excluir">
                              <IconButton
                                size="small"
                                onClick={() => onDeleteTransaction(tx.id)}
                                sx={{
                                  color: "#ef4444",
                                  "&:hover": {
                                    bgcolor: alpha("#ef4444", 0.1),
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                    <Typography color="text.secondary" fontStyle="italic">
                      Nenhuma transação nesta categoria para o mês selecionado.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {selectedCategoryTransactions.length > 0 && (
              <TableFooter>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell colSpan={4} sx={{ textAlign: "right", fontWeight: 600 }}>
                    Total ({selectedCategoryTransactions.length} transações):
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: typeColor,
                    }}
                  >
                    {selectedCategory.type === "income" ? "" : "- "}{formatCurrency(categoryTotal)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>

        {/* Mobile Action Menu */}
        <Menu
          anchorEl={mobileActionAnchor.element}
          open={Boolean(mobileActionAnchor.element)}
          onClose={() => setMobileActionAnchor({ element: null, transaction: null })}
          PaperProps={{
            sx: {
              borderRadius: "20px",
              minWidth: 160,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              if (mobileActionAnchor.transaction) {
                onEditTransaction(mobileActionAnchor.transaction);
              }
              setMobileActionAnchor({ element: null, transaction: null });
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: categoryColors2.primary }} />
            </ListItemIcon>
            <ListItemText>
              {mobileActionAnchor.transaction?.isVirtual 
                ? "Editar Recorrência" 
                : mobileActionAnchor.transaction?.isRecurring 
                  ? "Editar Recorrente"
                  : mobileActionAnchor.transaction?.installments && mobileActionAnchor.transaction.installments > 1
                    ? "Editar Parcelas"
                    : "Editar"}
            </ListItemText>
          </MenuItem>
          {!mobileActionAnchor.transaction?.isVirtual && (
            <MenuItem
              onClick={() => {
                if (mobileActionAnchor.transaction) {
                  onDeleteTransaction(mobileActionAnchor.transaction.id);
                }
                setMobileActionAnchor({ element: null, transaction: null });
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}>
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
                borderRadius: "20px",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
              }}
            >
              <CategoryIcon color="primary" />
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              Categorias
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie as categorias de receitas e despesas
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {tabValue === 0 && (
            <DateFilter
              month={selectedMonth}
              year={selectedYear}
              onDateChange={onDateChange}
              showIcon
              compact={isMobile}
            />
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ px: isMobile ? 1 : 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 48,
            },
          }}
        >
          <Tab
            icon={<AssessmentIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Visão Geral
                <Chip
                  label={categories.income.length + categories.expense.length}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: tabValue === 0 ? alpha(theme.palette.primary.main, 0.15) : "action.hover",
                    color: tabValue === 0 ? "primary.main" : "text.secondary",
                  }}
                />
              </Box>
            }
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Gerenciar
                <Chip
                  label={categories.income.length + categories.expense.length}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: tabValue === 1 ? alpha(theme.palette.primary.main, 0.15) : "action.hover",
                    color: tabValue === 1 ? "primary.main" : "text.secondary",
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Tab Content: Overview */}
      <Collapse in={tabValue === 0} unmountOnExit>
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Income Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Income Header */}
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 1.5 : 2,
                  position: "relative",
                  overflow: "hidden",
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                    : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                  boxShadow: `0 6px 24px -6px ${alpha("#059669", 0.15)}`,
                  borderRadius: "16px",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)",
                    pointerEvents: "none",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
                  <Box
                    sx={{
                      width: isMobile ? 40 : 48,
                      height: isMobile ? 40 : 48,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDarkMode
                        ? `linear-gradient(135deg, ${alpha("#059669", 0.2)} 0%, ${alpha("#059669", 0.1)} 100%)`
                        : `linear-gradient(135deg, #D1FAE5 0%, ${alpha("#D1FAE5", 0.6)} 100%)`,
                      border: `1px solid ${isDarkMode ? alpha("#059669", 0.2) : alpha("#059669", 0.15)}`,
                    }}
                  >
                    <TrendingUpIcon sx={{ color: "#059669", fontSize: isMobile ? 22 : 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                      Receitas
                    </Typography>
                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: "#059669", letterSpacing: "-0.02em" }}>
                      {formatCurrency(totalIncome)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Income Categories */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {categorySummaries.income.map((summary) => renderCategoryCard(summary, totalIncome))}
                {categorySummaries.income.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center", bgcolor: alpha("#059669", 0.02), border: `1px dashed ${alpha("#059669", 0.2)}` }}>
                    <Typography variant="body2" color="text.secondary">Nenhuma categoria de receita</Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Expense Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Expense Header */}
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 1.5 : 2,
                  position: "relative",
                  overflow: "hidden",
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                    : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                  boxShadow: `0 6px 24px -6px ${alpha("#DC2626", 0.15)}`,
                  borderRadius: "16px",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
                    pointerEvents: "none",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
                  <Box
                    sx={{
                      width: isMobile ? 40 : 48,
                      height: isMobile ? 40 : 48,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDarkMode
                        ? `linear-gradient(135deg, ${alpha("#DC2626", 0.2)} 0%, ${alpha("#DC2626", 0.1)} 100%)`
                        : `linear-gradient(135deg, #FEE2E2 0%, ${alpha("#FEE2E2", 0.6)} 100%)`,
                      border: `1px solid ${isDarkMode ? alpha("#DC2626", 0.2) : alpha("#DC2626", 0.15)}`,
                    }}
                  >
                    <TrendingDownIcon sx={{ color: "#DC2626", fontSize: isMobile ? 22 : 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                      Despesas
                    </Typography>
                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: "#DC2626", letterSpacing: "-0.02em" }}>
                      {formatCurrency(totalExpense)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Expense Categories */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {categorySummaries.expense.map((summary) => renderCategoryCard(summary, totalExpense))}
                {categorySummaries.expense.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center", bgcolor: alpha("#DC2626", 0.02), border: `1px dashed ${alpha("#DC2626", 0.2)}` }}>
                    <Typography variant="body2" color="text.secondary">Nenhuma categoria de despesa</Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Collapse>

      {/* Tab Content: Manage */}
      <Collapse in={tabValue === 1} unmountOnExit>
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Income Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Income Header */}
              <Paper
                sx={{
                  p: isMobile ? 2 : 2.5,
                  background: isDarkMode
                    ? alpha("#10b981", 0.08)
                    : alpha("#10b981", 0.04),
                  border: `1px solid ${alpha("#10b981", 0.15)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <TrendingUpIcon sx={{ color: "#10b981" }} />
                  <Typography variant="subtitle1" fontWeight={600} color="#10b981">
                    Categorias de Receita
                  </Typography>
                  <Chip
                    label={categories.income.length}
                    size="small"
                    sx={{ bgcolor: alpha("#10b981", 0.15), color: "#10b981", ml: "auto" }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nova categoria..."
                    value={newIncomeCat}
                    onChange={(e) => setNewIncomeCat(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCat("income")}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "20px" } }}
                  />
                  <IconButton
                    onClick={() => handleAddCat("income")}
                    sx={{
                      bgcolor: "#10b981",
                      color: "white",
                      borderRadius: "20px",
                      "&:hover": { bgcolor: alpha("#10b981", 0.8) },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Paper>

              {/* Income Categories List */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {categories.income.map((cat) => renderManageItem(cat, "income"))}
                {categories.income.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center", bgcolor: alpha("#10b981", 0.02), border: `1px dashed ${alpha("#10b981", 0.2)}` }}>
                    <CategoryIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Nenhuma categoria</Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Expense Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Expense Header */}
              <Paper
                sx={{
                  p: isMobile ? 2 : 2.5,
                  background: isDarkMode
                    ? alpha("#ef4444", 0.08)
                    : alpha("#ef4444", 0.04),
                  border: `1px solid ${alpha("#ef4444", 0.15)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <TrendingDownIcon sx={{ color: "#ef4444" }} />
                  <Typography variant="subtitle1" fontWeight={600} color="#ef4444">
                    Categorias de Despesa
                  </Typography>
                  <Chip
                    label={categories.expense.length}
                    size="small"
                    sx={{ bgcolor: alpha("#ef4444", 0.15), color: "#ef4444", ml: "auto" }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nova categoria..."
                    value={newExpenseCat}
                    onChange={(e) => setNewExpenseCat(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCat("expense")}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "20px" } }}
                  />
                  <IconButton
                    onClick={() => handleAddCat("expense")}
                    sx={{
                      bgcolor: "#ef4444",
                      color: "white",
                      borderRadius: "20px",
                      "&:hover": { bgcolor: alpha("#ef4444", 0.8) },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Paper>

              {/* Expense Categories List */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {categories.expense.map((cat) => renderManageItem(cat, "expense"))}
                {categories.expense.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center", bgcolor: alpha("#ef4444", 0.02), border: `1px dashed ${alpha("#ef4444", 0.2)}` }}>
                    <CategoryIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Nenhuma categoria</Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Box>
  );
};

export default CategoriesView;
