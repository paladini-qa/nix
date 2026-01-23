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
  Card,
  CardContent,
  Checkbox,
  Button,
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
  AccountBalance as BalanceIcon,
} from "@mui/icons-material";
import TransactionTags from "./TransactionTags";
import {
  getTableContainerSx,
  getHeaderCellSx,
  getRowSx,
} from "../utils/tableStyles";
import { Transaction, TransactionType, ColorConfig, CategoryColors } from "../types";
import { ColorsContext } from "../App";
import ColorPicker from "./ColorPicker";
import DateFilter from "./DateFilter";

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

  const [tabValue, setTabValue] = useState(0);
  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; type: TransactionType } | null>(null);

  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  useEffect(() => {
    if (initialSelectedCategory) {
      setSelectedCategory(initialSelectedCategory);
      onClearInitialCategory?.();
    }
  }, [initialSelectedCategory, onClearInitialCategory]);

  // Gera transações recorrentes virtuais
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

        const excludedDates = t.excludedDates || [];
        if (excludedDates.includes(virtualDate)) return;

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

  // Filtra transações do mês
  const monthTransactions = useMemo(() => {
    const baseTransactions = transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      const isCurrentMonth = parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
      
      if (!isCurrentMonth) return false;
      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) return false;
      
      return true;
    });

    return [...baseTransactions, ...generateRecurringTransactions];
  }, [transactions, selectedMonth, selectedYear, generateRecurringTransactions]);

  // Resumo por categoria
  const categorySummaries = useMemo(() => {
    const incomeMap = new Map<string, CategorySummary>();
    const expenseMap = new Map<string, CategorySummary>();

    categories.income.forEach((cat) => {
      const colors = categoryColors.income?.[cat] || DEFAULT_INCOME_COLORS;
      incomeMap.set(cat, { name: cat, type: "income", total: 0, transactionCount: 0, colors, unpaidCount: 0, unpaidAmount: 0 });
    });
    categories.expense.forEach((cat) => {
      const colors = categoryColors.expense?.[cat] || DEFAULT_EXPENSE_COLORS;
      expenseMap.set(cat, { name: cat, type: "expense", total: 0, transactionCount: 0, colors, unpaidCount: 0, unpaidAmount: 0 });
    });

    monthTransactions.forEach((tx) => {
      const map = tx.type === "income" ? incomeMap : expenseMap;
      const summary = map.get(tx.category);
      if (summary) {
        summary.total += tx.amount || 0;
        summary.transactionCount++;
        if (!tx.isPaid) {
          summary.unpaidCount++;
          summary.unpaidAmount += tx.amount || 0;
        }
      }
    });

    return {
      income: Array.from(incomeMap.values()).sort((a, b) => b.total - a.total),
      expense: Array.from(expenseMap.values()).sort((a, b) => b.total - a.total),
    };
  }, [monthTransactions, categories, categoryColors]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalIncome = categorySummaries.income.reduce((sum, s) => sum + s.total, 0);
    const totalExpense = categorySummaries.expense.reduce((sum, s) => sum + s.total, 0);
    const incomeWithActivity = categorySummaries.income.filter(s => s.transactionCount > 0).length;
    const expenseWithActivity = categorySummaries.expense.filter(s => s.transactionCount > 0).length;
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCategories: categories.income.length,
      expenseCategories: categories.expense.length,
      incomeWithActivity,
      expenseWithActivity,
    };
  }, [categorySummaries, categories]);

  // Transações da categoria selecionada
  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return monthTransactions
      .filter((tx) => tx.category === selectedCategory.name && tx.type === selectedCategory.type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthTransactions, selectedCategory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

  // =============================================
  // CATEGORY CARD COMPONENT
  // =============================================
  const renderCategoryCard = (summary: CategorySummary, total: number) => {
    const percentage = total > 0 ? (summary.total / total) * 100 : 0;
    const isIncome = summary.type === "income";
    const accentColor = summary.colors.primary;

    return (
      <Paper
        key={summary.name}
        elevation={0}
        onClick={() => setSelectedCategory({ name: summary.name, type: summary.type })}
        sx={{
          p: isMobile ? 2 : 2.5,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
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
              ? `linear-gradient(135deg, ${alpha(accentColor, 0.08)} 0%, ${alpha(summary.colors.secondary, 0.02)} 100%)`
              : `linear-gradient(135deg, ${alpha(accentColor, 0.04)} 0%, ${alpha(summary.colors.secondary, 0.01)} 100%)`,
            pointerEvents: "none",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${accentColor}, ${summary.colors.secondary})`,
                display: "flex",
                flexShrink: 0,
              }}
            >
              {isIncome ? (
                <TrendingUpIcon sx={{ color: "#fff", fontSize: 18 }} />
              ) : (
                <TrendingDownIcon sx={{ color: "#fff", fontSize: 18 }} />
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle1" 
                fontWeight={600}
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {summary.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary.transactionCount} transaç{summary.transactionCount === 1 ? "ão" : "ões"}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Ver detalhes">
            <IconButton 
              size="small" 
              sx={{ 
                color: accentColor,
                bgcolor: alpha(accentColor, 0.1),
                "&:hover": { bgcolor: alpha(accentColor, 0.2) }
              }}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Amount */}
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          sx={{ 
            color: accentColor, 
            mb: 1.5,
            fontFamily: "monospace",
            letterSpacing: "-0.02em",
          }}
        >
          {isIncome ? "+" : "-"}{formatCurrency(summary.total)}
        </Typography>

        {/* Progress */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: "4px",
              bgcolor: alpha(accentColor, 0.1),
              "& .MuiLinearProgress-bar": {
                borderRadius: "4px",
                background: `linear-gradient(90deg, ${accentColor}, ${summary.colors.secondary})`,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
            {percentage.toFixed(0)}%
          </Typography>
        </Box>

        {/* Unpaid indicator */}
        {summary.unpaidCount > 0 && (
          <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
            <Chip
              icon={<WarningIcon />}
              label={summary.unpaidCount === 1 ? "1 pendente" : `${summary.unpaidCount} pendentes`}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ height: 22, fontSize: 10, borderRadius: "8px" }}
            />
          </Box>
        )}
      </Paper>
    );
  };

  // =============================================
  // MANAGE ITEM COMPONENT
  // =============================================
  const renderManageItem = (cat: string, type: TransactionType) => {
    const defaultColors = type === "income" ? DEFAULT_INCOME_COLORS : DEFAULT_EXPENSE_COLORS;
    const colorKey = type === "income" ? categoryColors.income : categoryColors.expense;
    const colors = colorKey?.[cat] || defaultColors;
    const summary = (type === "income" ? categorySummaries.income : categorySummaries.expense).find(s => s.name === cat);

    return (
      <Paper
        key={cat}
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderRadius: "16px",
          transition: "all 0.2s ease",
          border: `1px solid ${alpha(colors.primary, 0.2)}`,
          borderLeft: `3px solid ${colors.primary}`,
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(colors.primary, 0.1)} 0%, ${alpha(colors.secondary, 0.05)} 100%)`
            : `linear-gradient(135deg, ${alpha(colors.primary, 0.06)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 8px 16px -4px ${alpha(colors.primary, 0.2)}`,
          },
        }}
      >
        <ColorPicker
          value={colors}
          onChange={(newColors) => onUpdateCategoryColor(type, cat, newColors)}
          size="small"
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
          {type === "income" ? (
            <TrendingUpIcon fontSize="small" sx={{ color: colors.primary }} />
          ) : (
            <TrendingDownIcon fontSize="small" sx={{ color: colors.primary }} />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
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
            {summary && summary.transactionCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {summary.transactionCount} transações este mês
              </Typography>
            )}
          </Box>
        </Box>
        <Tooltip title="Remover categoria">
          <IconButton
            size="small"
            onClick={() => onRemoveCategory(type, cat)}
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: "error.main",
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    );
  };

  // =============================================
  // DETAIL VIEW
  // =============================================
  if (selectedCategory) {
    const categoryColors2 = getCategoryColor(selectedCategory.type, selectedCategory.name);
    const isIncome = selectedCategory.type === "income";
    const accentColor = isIncome ? "#059669" : "#DC2626";
    const categoryTotal = selectedCategoryTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const unpaidTransactions = selectedCategoryTransactions.filter((tx) => !tx.isPaid);
    const unpaidCount = unpaidTransactions.length;
    const unpaidAmount = unpaidTransactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + (tx.amount || 0), 0);

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
            <IconButton 
              onClick={() => setSelectedCategory(null)} 
              sx={{ 
                border: 1, 
                borderColor: "divider",
                borderRadius: "10px",
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box
              sx={{
                p: 1,
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${categoryColors2.primary}, ${categoryColors2.secondary})`,
                display: "flex",
              }}
            >
              {isIncome ? <TrendingUpIcon sx={{ color: "#fff" }} /> : <TrendingDownIcon sx={{ color: "#fff" }} />}
            </Box>
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                {selectedCategory.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isIncome ? "Categoria de Receita" : "Categoria de Despesa"}
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

        {/* Summary Cards */}
        <Grid container spacing={isMobile ? 1.5 : 2}>
          <Grid size={{ xs: 6, md: 4 }}>
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
                {isIncome ? <TrendingUpIcon sx={{ color: accentColor, fontSize: 20 }} /> : <TrendingDownIcon sx={{ color: accentColor, fontSize: 20 }} />}
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Total no Mês
                </Typography>
              </Box>
              <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color={accentColor}>
                {isIncome ? "+" : "-"}{formatCurrency(categoryTotal)}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, md: 4 }}>
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
                <ReceiptIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Transações
                </Typography>
              </Box>
              <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700}>
                {selectedCategoryTransactions.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? 1.5 : 2,
                borderRadius: "16px",
                background: unpaidCount > 0
                  ? `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`
                  : `linear-gradient(135deg, #059669 0%, #047857 100%)`,
                boxShadow: `0 8px 32px -8px ${alpha(unpaidCount > 0 ? "#f59e0b" : "#059669", 0.4)}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                {unpaidCount > 0 ? (
                  <WarningIcon sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }} />
                ) : (
                  <CheckCircleIcon sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }} />
                )}
                <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.8) }} fontWeight={600}>
                  Status
                </Typography>
              </Box>
              <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#FFFFFF">
                {unpaidCount > 0 ? `${unpaidCount} pendente${unpaidCount > 1 ? "s" : ""}` : "Tudo em dia!"}
              </Typography>
              {unpaidAmount > 0 && (
                <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.7) }}>
                  {formatCurrency(unpaidAmount)} a pagar
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Transactions */}
        {isMobile ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {selectedCategoryTransactions.length > 0 ? (
              selectedCategoryTransactions.map((tx) => (
                <Card
                  key={tx.id}
                  elevation={0}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    opacity: tx.isPaid !== false ? 0.6 : 1,
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                      : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.05)}`,
                    borderLeft: `3px solid ${accentColor}`,
                    borderRadius: "14px",
                  }}
                >
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Checkbox
                      checked={tx.isPaid !== false}
                      onChange={(e) => onTogglePaid(tx.isVirtual && tx.originalTransactionId ? tx.originalTransactionId : tx.id, e.target.checked)}
                      size="small"
                      color={isIncome ? "success" : "error"}
                      sx={{ mt: -0.5, ml: -1 }}
                    />
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: `linear-gradient(135deg, ${alpha(accentColor, 0.2)} 0%, ${alpha(accentColor, 0.1)} 100%)`,
                      }}
                    >
                      {isIncome ? <TrendingUpIcon sx={{ fontSize: 16, color: accentColor }} /> : <TrendingDownIcon sx={{ fontSize: 16, color: accentColor }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tx.description}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color={isIncome ? "success.main" : "error.main"} sx={{ flexShrink: 0 }}>
                          {isIncome ? "+" : "-"} {formatCurrency(tx.amount || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{formatDate(tx.date)}</Typography>
                        <Typography variant="caption" color="text.disabled">•</Typography>
                        <Typography variant="caption" color="text.secondary">{tx.paymentMethod}</Typography>
                      </Box>
                      <TransactionTags transaction={tx} />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => setMobileActionAnchor({ element: e.currentTarget, transaction: tx })}
                      sx={{ color: "text.secondary", mt: -0.5, mr: -1 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: "16px" }}>
                <ReceiptIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography color="text.secondary">Nenhuma transação nesta categoria</Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <TableContainer component={Paper} sx={getTableContainerSx(theme, isDarkMode)}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Data</TableCell>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Descrição</TableCell>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Método</TableCell>
                  <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>Status</TableCell>
                  <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "right" }}>Valor</TableCell>
                  <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedCategoryTransactions.length > 0 ? (
                  selectedCategoryTransactions.map((tx, index) => (
                    <TableRow key={tx.id} sx={{ ...getRowSx(theme, isDarkMode, index), opacity: tx.isPaid ? 0.7 : 1 }}>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{formatDate(tx.date)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="body2" fontWeight={500} sx={{ textDecoration: tx.isPaid ? "line-through" : "none" }}>
                            {tx.description}
                          </Typography>
                          <TransactionTags transaction={tx} showShared={false} />
                        </Box>
                      </TableCell>
                      <TableCell><Chip label={tx.paymentMethod} size="small" variant="outlined" /></TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip title={tx.isPaid ? "Marcar como não pago" : "Marcar como pago"}>
                          <IconButton
                            size="small"
                            onClick={() => onTogglePaid(tx.id, !tx.isPaid)}
                            sx={{ color: tx.isPaid ? "#10b981" : "text.disabled" }}
                          >
                            {tx.isPaid ? <CheckCircleIcon fontSize="small" /> : <UnpaidIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: accentColor }}>
                        {isIncome ? "+" : "-"}{formatCurrency(tx.amount || 0)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => onEditTransaction(tx)} color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!tx.isVirtual && (
                          <Tooltip title="Excluir">
                            <IconButton size="small" onClick={() => onDeleteTransaction(tx.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                      <ReceiptIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                      <Typography color="text.secondary">Nenhuma transação nesta categoria</Typography>
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
                    <TableCell sx={{ textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: accentColor }}>
                      {isIncome ? "+" : "-"}{formatCurrency(categoryTotal)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        )}

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileActionAnchor.element}
          open={Boolean(mobileActionAnchor.element)}
          onClose={() => setMobileActionAnchor({ element: null, transaction: null })}
        >
          <MenuItem onClick={() => { if (mobileActionAnchor.transaction) onEditTransaction(mobileActionAnchor.transaction); setMobileActionAnchor({ element: null, transaction: null }); }}>
            <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          {!mobileActionAnchor.transaction?.isVirtual && (
            <MenuItem onClick={() => { if (mobileActionAnchor.transaction) onDeleteTransaction(mobileActionAnchor.transaction.id); setMobileActionAnchor({ element: null, transaction: null }); }}>
              <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </Box>
    );
  }

  // =============================================
  // MAIN VIEW
  // =============================================
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3, pb: { xs: "140px", md: 0 } }}>
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
            <Box sx={{ p: 1, borderRadius: "12px", bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex" }}>
              <CategoryIcon color="primary" />
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              Categorias
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie suas categorias de receitas e despesas
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {tabValue === 0 && (
            <DateFilter month={selectedMonth} year={selectedYear} onDateChange={onDateChange} showIcon compact={isMobile} />
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
              <TrendingUpIcon sx={{ color: "#059669", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Receitas
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#059669">
              {formatCurrency(stats.totalIncome)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.incomeWithActivity} de {stats.incomeCategories} categorias
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
                Despesas
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#DC2626">
              {formatCurrency(stats.totalExpense)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.expenseWithActivity} de {stats.expenseCategories} categorias
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
              <CategoryIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total Categorias
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700}>
              {stats.incomeCategories + stats.expenseCategories}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.incomeCategories} receitas • {stats.expenseCategories} despesas
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              background: stats.balance >= 0
                ? `linear-gradient(135deg, #059669 0%, #047857 100%)`
                : `linear-gradient(135deg, #DC2626 0%, #b91c1c 100%)`,
              boxShadow: `0 8px 32px -8px ${alpha(stats.balance >= 0 ? "#059669" : "#DC2626", 0.4)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <BalanceIcon sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.8) }} fontWeight={600}>
                Saldo
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color="#FFFFFF">
              {formatCurrency(stats.balance)}
            </Typography>
            <Typography variant="caption" sx={{ color: alpha("#FFFFFF", 0.7) }}>
              receitas - despesas
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper 
        elevation={0}
        sx={{ 
          px: isMobile ? 1 : 2,
          borderRadius: "16px",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 48 } }}
        >
          <Tab
            icon={<AssessmentIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Visão Geral
                <Chip
                  label={stats.incomeWithActivity + stats.expenseWithActivity}
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
                  label={stats.incomeCategories + stats.expenseCategories}
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

      {/* Tab: Overview */}
      <Collapse in={tabValue === 0} unmountOnExit>
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Income */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 1.5 : 2,
                  borderRadius: "16px",
                  border: `1px solid ${alpha("#059669", 0.2)}`,
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${alpha("#059669", 0.1)} 0%, ${alpha("#059669", 0.05)} 100%)`
                    : `linear-gradient(135deg, ${alpha("#059669", 0.08)} 0%, ${alpha("#059669", 0.02)} 100%)`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #059669, #047857)",
                      display: "flex",
                    }}
                  >
                    <TrendingUpIcon sx={{ color: "#fff" }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} color="#059669">
                      Receitas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {categorySummaries.income.filter(s => s.transactionCount > 0).length} categorias ativas
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#059669" sx={{ ml: "auto" }}>
                    {formatCurrency(stats.totalIncome)}
                  </Typography>
                </Box>
              </Paper>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {categorySummaries.income.filter(s => s.transactionCount > 0).map((summary) => renderCategoryCard(summary, stats.totalIncome))}
                {categorySummaries.income.filter(s => s.transactionCount > 0).length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center", borderRadius: "16px", border: `1px dashed ${alpha("#059669", 0.2)}` }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Nenhuma transação de receita</Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Expense */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 1.5 : 2,
                  borderRadius: "16px",
                  border: `1px solid ${alpha("#DC2626", 0.2)}`,
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${alpha("#DC2626", 0.1)} 0%, ${alpha("#DC2626", 0.05)} 100%)`
                    : `linear-gradient(135deg, ${alpha("#DC2626", 0.08)} 0%, ${alpha("#DC2626", 0.02)} 100%)`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #DC2626, #b91c1c)",
                      display: "flex",
                    }}
                  >
                    <TrendingDownIcon sx={{ color: "#fff" }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} color="#DC2626">
                      Despesas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {categorySummaries.expense.filter(s => s.transactionCount > 0).length} categorias ativas
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#DC2626" sx={{ ml: "auto" }}>
                    {formatCurrency(stats.totalExpense)}
                  </Typography>
                </Box>
              </Paper>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {categorySummaries.expense.filter(s => s.transactionCount > 0).map((summary) => renderCategoryCard(summary, stats.totalExpense))}
                {categorySummaries.expense.filter(s => s.transactionCount > 0).length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center", borderRadius: "16px", border: `1px dashed ${alpha("#DC2626", 0.2)}` }}>
                    <TrendingDownIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Nenhuma transação de despesa</Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Collapse>

      {/* Tab: Manage */}
      <Collapse in={tabValue === 1} unmountOnExit>
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Income */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 2.5,
                  borderRadius: "16px",
                  background: isDarkMode ? alpha("#10b981", 0.08) : alpha("#10b981", 0.04),
                  border: `1px solid ${alpha("#10b981", 0.15)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <TrendingUpIcon sx={{ color: "#10b981" }} />
                  <Typography variant="subtitle1" fontWeight={600} color="#10b981">
                    Categorias de Receita
                  </Typography>
                  <Chip label={categories.income.length} size="small" sx={{ bgcolor: alpha("#10b981", 0.15), color: "#10b981", ml: "auto" }} />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nova categoria..."
                    value={newIncomeCat}
                    onChange={(e) => setNewIncomeCat(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCat("income")}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                  />
                  <Button onClick={() => handleAddCat("income")} variant="contained" sx={{ minWidth: 48, borderRadius: "10px", bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
                    <AddIcon />
                  </Button>
                </Box>
              </Paper>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {categories.income.map((cat) => renderManageItem(cat, "income"))}
                {categories.income.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center", borderRadius: "16px", border: `1px dashed ${alpha("#10b981", 0.2)}` }}>
                    <CategoryIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Nenhuma categoria</Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Expense */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 2.5,
                  borderRadius: "16px",
                  background: isDarkMode ? alpha("#ef4444", 0.08) : alpha("#ef4444", 0.04),
                  border: `1px solid ${alpha("#ef4444", 0.15)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <TrendingDownIcon sx={{ color: "#ef4444" }} />
                  <Typography variant="subtitle1" fontWeight={600} color="#ef4444">
                    Categorias de Despesa
                  </Typography>
                  <Chip label={categories.expense.length} size="small" sx={{ bgcolor: alpha("#ef4444", 0.15), color: "#ef4444", ml: "auto" }} />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nova categoria..."
                    value={newExpenseCat}
                    onChange={(e) => setNewExpenseCat(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCat("expense")}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                  />
                  <Button onClick={() => handleAddCat("expense")} variant="contained" sx={{ minWidth: 48, borderRadius: "10px", bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
                    <AddIcon />
                  </Button>
                </Box>
              </Paper>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {categories.expense.map((cat) => renderManageItem(cat, "expense"))}
                {categories.expense.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: "center", borderRadius: "16px", border: `1px dashed ${alpha("#ef4444", 0.2)}` }}>
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
