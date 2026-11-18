import React, { useState, useMemo, useContext, useEffect, useRef } from "react";
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
  Chip,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Category as CategoryIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UnpaidIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  AccountBalance as BalanceIcon,
} from "@mui/icons-material";
import PaymentMethodIcon from "@/presentation/components/ui/PaymentMethodIcon";
import PaymentMethodImagePicker from "@/presentation/components/ui/PaymentMethodImagePicker";
import { extractDominantColor, hashColor } from "@/shared/utils/imageColorUtils";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";
import TransactionTags from "@/presentation/components/ui/TransactionTags";
import {
  getTableContainerSx,
  getHeaderCellSx,
  getRowSx,
} from "@/shared/utils/tableStyles";
import {
  Transaction,
  TransactionType,
  ColorConfig,
  CategoryColors,
} from "@/domain/entities";
import { useLayoutSpacing } from "@/presentation/hooks";
import { getReportDate } from "@/domain/usecases/transactionUtils";
import { useSettings } from "@/presentation/contexts";
import EmptyState from "@/presentation/components/ui/EmptyState";
import AutoCategorizationRules from "@/presentation/components/ui/AutoCategorizationRules";


interface CategoriesViewProps {
  transactions: Transaction[];
  categories: { income: string[]; expense: string[] };
  categoryColors: CategoryColors;
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
  onAddCategory: (type: TransactionType, category: string) => void;
  onRemoveCategory: (type: TransactionType, category: string) => void;
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
  onTogglePaid,
  onEditTransaction,
  onDeleteTransaction,
  initialSelectedCategory,
  onClearInitialCategory,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { gridSpacing } = useLayoutSpacing();
  const isDarkMode = theme.palette.mode === "dark";
  const { getCategoryColor, getCategoryImage, updateCategoryImage, updateCategoryColor } = useSettings();

  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [addCategoryType, setAddCategoryType] = useState<TransactionType>("expense");
  const [addCategoryName, setAddCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<{
    name: string;
    type: TransactionType;
  } | null>(null);

  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<{ type: TransactionType; name: string } | null>(null);

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

    transactions?.forEach((t) => {
      if (!t.isRecurring || !t.frequency) return;
      if (t.installments && t.installments > 1) return;

      const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
      const targetDate = new Date(targetYear, targetMonth - 1, 1);

      if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

      const isOriginalMonth =
        origYear === targetYear && origMonth === targetMonth;
      if (isOriginalMonth) return;

      let shouldAppear = false;

      if (t.frequency === "monthly") {
        shouldAppear = true;
      } else if (t.frequency === "yearly") {
        shouldAppear = origMonth === targetMonth && targetYear > origYear;
      }

      if (shouldAppear) {
        const daysInTargetMonth = new Date(
          targetYear,
          targetMonth,
          0
        ).getDate();
        const adjustedDay = Math.min(origDay, daysInTargetMonth);
        const virtualDate = `${targetYear}-${String(targetMonth).padStart(
          2,
          "0"
        )}-${String(adjustedDay).padStart(2, "0")}`;

        const excludedDates = t.excludedDates || [];
        if (excludedDates.includes(virtualDate)) return;

        const hasRealInTargetMonth = transactions.some(
          (tx) =>
            !tx.isVirtual &&
            tx.date?.startsWith(
              `${targetYear}-${String(targetMonth).padStart(2, "0")}`
            ) &&
            (tx.recurringGroupId === t.id ||
              (tx.description === t.description &&
                tx.category === t.category &&
                Number(tx.amount) === Number(t.amount) &&
                tx.type === t.type))
        );
        if (hasRealInTargetMonth) return;

        const occurrence = t.occurrences?.find((item) => item.dueDate === virtualDate);
        virtualTransactions.push({
          ...t,
          id: `${t.id}_recurring_${targetYear}-${String(targetMonth).padStart(
            2,
            "0"
          )}`,
          date: virtualDate,
          amount: occurrence?.amount ?? t.amount,
          isPaid: occurrence?.isPaid ?? false,
          isVirtual: true,
          originalTransactionId: t.id,
        });
      }
    });

    return virtualTransactions;
  }, [transactions, selectedMonth, selectedYear]);

  // Filtra transações do mês (usa data de relatório)
  const monthTransactions = useMemo(() => {
    const baseTransactions = (transactions || []).filter((t) => {
      const [y, m] = getReportDate(t).split("-");
      const isCurrentMonth =
        parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;

      if (!isCurrentMonth) return false;
      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date))
        return false;

      return true;
    });

    return [...baseTransactions, ...generateRecurringTransactions];
  }, [
    transactions,
    selectedMonth,
    selectedYear,
    generateRecurringTransactions,
  ]);

  // Resumo por categoria
  const categorySummaries = useMemo(() => {
    const incomeMap = new Map<string, CategorySummary>();
    const expenseMap = new Map<string, CategorySummary>();

    // Inicializa com categorias cadastradas
    (categories?.income || []).forEach((cat) => {
      const colors = categoryColors.income?.[cat] || hashColor(cat);
      incomeMap.set(cat, {
        name: cat,
        type: "income",
        total: 0,
        transactionCount: 0,
        colors,
        unpaidCount: 0,
        unpaidAmount: 0,
      });
    });
    (categories?.expense || []).forEach((cat) => {
      const colors = categoryColors.expense?.[cat] || hashColor(cat);
      expenseMap.set(cat, {
        name: cat,
        type: "expense",
        total: 0,
        transactionCount: 0,
        colors,
        unpaidCount: 0,
        unpaidAmount: 0,
      });
    });

    // Processa todas as transações, criando categorias dinamicamente se necessário
    (monthTransactions || []).forEach((tx) => {
      const map = tx.type === "income" ? incomeMap : expenseMap;

      // Se a categoria não existe no mapa, cria dinamicamente
      if (!map.has(tx.category)) {
        const colors =
          (tx.type === "income"
            ? categoryColors.income
            : categoryColors.expense)?.[tx.category] || hashColor(tx.category);
        map.set(tx.category, {
          name: tx.category,
          type: tx.type,
          total: 0,
          transactionCount: 0,
          colors,
          unpaidCount: 0,
          unpaidAmount: 0,
        });
      }

      const summary = map.get(tx.category)!;
      summary.total += tx.amount || 0;
      summary.transactionCount++;
      if (!tx.isPaid) {
        summary.unpaidCount++;
        summary.unpaidAmount += tx.amount || 0;
      }
    });

    return {
      income: Array.from(incomeMap.values()).sort((a, b) => b.total - a.total),
      expense: Array.from(expenseMap.values()).sort(
        (a, b) => b.total - a.total
      ),
    };
  }, [monthTransactions, categories, categoryColors]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalIncome = categorySummaries.income.reduce(
      (sum, s) => sum + s.total,
      0
    );
    const totalExpense = categorySummaries.expense.reduce(
      (sum, s) => sum + s.total,
      0
    );
    const incomeWithActivity = categorySummaries.income.filter(
      (s) => s.transactionCount > 0
    ).length;
    const expenseWithActivity = categorySummaries.expense.filter(
      (s) => s.transactionCount > 0
    ).length;

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
      .filter(
        (tx) =>
          tx.category === selectedCategory.name &&
          tx.type === selectedCategory.type
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthTransactions, selectedCategory]);

  const CATEGORIES_VIRTUALIZE_THRESHOLD = 40;
  const categoryListRef = useRef<HTMLDivElement>(null);
  const categoryVirtualizer = useVirtualizer({
    count: selectedCategoryTransactions.length,
    getScrollElement: () => categoryListRef.current,
    estimateSize: () => 56,
    overscan: 5,
    enabled: selectedCategoryTransactions.length > CATEGORIES_VIRTUALIZE_THRESHOLD,
  });

  const handleAddCategory = () => {
    if (addCategoryName.trim()) {
      onAddCategory(addCategoryType, addCategoryName.trim());
      setAddCategoryName("");
      setAddCategoryDialogOpen(false);
    }
  };

  // =============================================
  // CATEGORY CARD COMPONENT
  // =============================================
  const renderCategoryCard = (summary: CategorySummary, total: number) => {
    const percentage = total > 0 ? (summary.total / total) * 100 : 0;
    const isIncome = summary.type === "income";
    const colors = summary.colors;

    return (
      <Grid key={summary.name} size={{ xs: 12, sm: 6, lg: 4 }}>
        <Paper
          elevation={0}
          onClick={() => setSelectedCategory({ name: summary.name, type: summary.type })}
          sx={{
            p: isMobile ? "12px" : "16px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRadius: "14px",
            background: isDarkMode ? alpha(theme.palette.background.paper, 0.8) : "#ffffff",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 10px 28px -6px ${alpha(colors.primary, 0.25)}`,
            },
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 1.25, mb: isMobile ? "6px" : "10px" }}>
            <Box
              sx={{
                width: isMobile ? 32 : 40,
                height: isMobile ? 32 : 40,
                borderRadius: "10px",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(colors.primary, 0.15),
                color: colors.primary,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <PaymentMethodIcon
                imageUrl={getCategoryImage(isIncome ? "income" : "expense", summary.name)}
                colors={colors}
                size={isMobile ? 32 : 40}
                borderRadius={isMobile ? "10px" : "12px"}
                iconSize={isMobile ? 15 : 18}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                <Typography
                  fontWeight={700}
                  sx={{
                    fontSize: isMobile ? 13 : 14,
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {summary.name}
                </Typography>
                <Chip
                  label={`${summary.transactionCount}`}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 9.5,
                    fontWeight: 700,
                    borderRadius: "5px",
                    bgcolor: alpha(colors.primary, 0.12),
                    color: colors.primary,
                    "& .MuiChip-label": { px: 0.5 },
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 10.5, color: "text.secondary", mt: "1px" }}>
                {summary.transactionCount === 1 ? "transaction" : "transactions"}
              </Typography>
            </Box>
          </Box>

          {/* Amount & Percentage Horizontally on Mobile */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: isMobile ? "6px" : "10px" }}>
            <Typography sx={{ fontSize: isMobile ? 15.5 : 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {formatCurrency(summary.total, "en-US", "USD", 2)}
            </Typography>
            {isMobile && (
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                {percentage.toFixed(0)}% of total
              </Typography>
            )}
          </Box>

          {/* Progress bar */}
          <Box sx={{ height: isMobile ? 4 : 6, borderRadius: "99px", bgcolor: alpha(colors.primary, 0.12), overflow: "hidden", mb: "8px" }}>
            <Box sx={{ height: "100%", borderRadius: "99px", width: `${Math.min(percentage, 100)}%`, bgcolor: colors.primary, transition: "width 0.3s" }} />
          </Box>

          {/* Footer */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {!isMobile && (
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                {percentage.toFixed(0)}% of total
              </Typography>
            )}
            {isMobile && <Box />}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
              <Tooltip title="Edit image">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setImagePickerTarget({ type: summary.type, name: summary.name }); setImagePickerOpen(true); }}
                  sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
                >
                  <EditIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete category">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onRemoveCategory(summary.type, summary.name); }}
                  sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.08) } }}
                >
                  <DeleteIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                onClick={(e) => { e.stopPropagation(); setSelectedCategory({ name: summary.name, type: summary.type }); }}
                sx={{
                  color: "text.secondary",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 11.5,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: "6px",
                  minWidth: 0,
                  "&:hover": { bgcolor: alpha(colors.primary, 0.08), color: colors.primary },
                }}
              >
                Details
              </Button>
            </Box>
          </Box>
        </Paper>
      </Grid>
    );
  };

  // =============================================
  // DETAIL VIEW
  // =============================================
  if (selectedCategory) {
    const categoryColors2 = getCategoryColor(
      selectedCategory.type,
      selectedCategory.name
    );
    const isIncome = selectedCategory.type === "income";
    const accentColor = isIncome ? "#059669" : "#DC2626";
    const categoryTotal = selectedCategoryTransactions.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0
    );

    const unpaidTransactions = selectedCategoryTransactions.filter(
      (tx) => !tx.isPaid
    );
    const unpaidCount = unpaidTransactions.length;
    const unpaidAmount = unpaidTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3, px: { xs: 0, md: "28px" }, pt: { xs: 0, md: "24px" }, pb: { xs: 0, md: "60px" } }}
      >
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
              {isIncome ? (
                <TrendingUpIcon sx={{ color: "#fff" }} />
              ) : (
                <TrendingDownIcon sx={{ color: "#fff" }} />
              )}
            </Box>
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                {selectedCategory.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isIncome ? "Income Category" : "Expense Category"}
              </Typography>
            </Box>
          </Box>

        </Box>

        {/* Summary Cards */}
        <Grid container spacing={gridSpacing}>
          <Grid size={{ xs: 6, md: 4 }}>
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
                  : `linear-gradient(135deg, ${alpha(
                      "#FFFFFF",
                      0.8
                    )} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
                backdropFilter: "blur(16px)",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                {isIncome ? (
                  <TrendingUpIcon sx={{ color: accentColor, fontSize: 20 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: accentColor, fontSize: 20 }} />
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  Total no Mês
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "body1" : "h6"}
                fontWeight={700}
                color={accentColor}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(categoryTotal, "pt-BR", "BRL", 2)}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, md: 4 }}>
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
                  : `linear-gradient(135deg, ${alpha(
                      "#FFFFFF",
                      0.8
                    )} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
                backdropFilter: "blur(16px)",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <ReceiptIcon
                  sx={{ color: theme.palette.primary.main, fontSize: 20 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
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
                background:
                  unpaidCount > 0
                    ? `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`
                    : `linear-gradient(135deg, #059669 0%, #047857 100%)`,
                boxShadow: `0 8px 32px -8px ${alpha(
                  unpaidCount > 0 ? "#f59e0b" : "#059669",
                  0.4
                )}`,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                {unpaidCount > 0 ? (
                  <WarningIcon
                    sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }}
                  />
                ) : (
                  <CheckCircleIcon
                    sx={{ color: alpha("#FFFFFF", 0.9), fontSize: 20 }}
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#FFFFFF", 0.8) }}
                  fontWeight={600}
                >
                  Status
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "body1" : "h6"}
                fontWeight={700}
                color="#FFFFFF"
              >
                {unpaidCount > 0
                  ? `${unpaidCount} pendente${unpaidCount > 1 ? "s" : ""}`
                  : "Tudo em dia!"}
              </Typography>
              {unpaidAmount > 0 && (
                <Typography
                  variant="caption"
                  sx={{ color: alpha("#FFFFFF", 0.7) }}
                >
                  {formatCurrency(unpaidAmount, "pt-BR", "BRL", 2)} a pagar
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
                      isDarkMode
                        ? alpha("#FFFFFF", 0.06)
                        : alpha("#000000", 0.05)
                    }`,
                    borderLeft: `3px solid ${accentColor}`,
                    borderRadius: "14px",
                  }}
                >
                  <CardContent
                    sx={{
                      p: 1.5,
                      "&:last-child": { pb: 1.5 },
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                    }}
                  >
                    <Checkbox
                      checked={tx.isPaid !== false}
                      onChange={(e) =>
                        onTogglePaid(
                          tx.isVirtual && tx.originalTransactionId
                            ? tx.originalTransactionId
                            : tx.id,
                          e.target.checked
                        )
                      }
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
                        background: `linear-gradient(135deg, ${alpha(
                          accentColor,
                          0.2
                        )} 0%, ${alpha(accentColor, 0.1)} 100%)`,
                      }}
                    >
                      {isIncome ? (
                        <TrendingUpIcon
                          sx={{ fontSize: 16, color: accentColor }}
                        />
                      ) : (
                        <TrendingDownIcon
                          sx={{ fontSize: 16, color: accentColor }}
                        />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tx.description}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={isIncome ? "success.main" : "error.main"}
                          sx={{ flexShrink: 0 }}
                        >
                          {isIncome ? "+" : "-"}{" "}
                          {formatCurrency(tx.amount || 0, "pt-BR", "BRL", 2)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(tx.date)}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tx.paymentMethod}
                        </Typography>
                      </Box>
                      <TransactionTags transaction={tx} />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        setMobileActionAnchor({
                          element: e.currentTarget,
                          transaction: tx,
                        })
                      }
                      sx={{ color: "text.secondary", mt: -0.5, mr: -1 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                type="transactions"
                title="No transactions in this category"
                description="There are no registered transactions for this category"
                compact
              />
            )}
          </Box>
        ) : (
          <Box
            ref={categoryListRef}
            sx={
              selectedCategoryTransactions.length >
              CATEGORIES_VIRTUALIZE_THRESHOLD
                ? { maxHeight: 480, overflow: "auto" }
                : undefined
            }
          >
          <TableContainer
            component={Paper}
            sx={getTableContainerSx(theme, isDarkMode)}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>
                    Data
                  </TableCell>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>
                    Descrição
                  </TableCell>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>
                    Método
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
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedCategoryTransactions.length > 0 ? (
                  selectedCategoryTransactions.map((tx, index) => (
                    <TableRow
                      key={tx.id}
                      sx={{
                        ...getRowSx(theme, isDarkMode, index),
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
                              textDecoration: tx.isPaid
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {tx.description}
                          </Typography>
                          <TransactionTags
                            transaction={tx}
                            showShared={false}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.paymentMethod}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip
                          title={
                            tx.isPaid
                              ? "Marcar como não pago"
                              : "Marcar como pago"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => onTogglePaid(tx.id, !tx.isPaid)}
                            sx={{
                              color: tx.isPaid ? "#10b981" : "text.disabled",
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
                          color: accentColor,
                        }}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(tx.amount || 0, "pt-BR", "BRL", 2)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onEditTransaction(tx)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!tx.isVirtual && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => onDeleteTransaction(tx.id)}
                              color="error"
                            >
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
                      <EmptyState
                        type="transactions"
                        title="No transactions in this category"
                        description="There are no registered transactions for this category"
                        compact
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {selectedCategoryTransactions.length > 0 && (
                <TableFooter>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell
                      colSpan={4}
                      sx={{ textAlign: "right", fontWeight: 600 }}
                    >
                      Total ({selectedCategoryTransactions.length} transações):
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: accentColor,
                      }}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(categoryTotal, "pt-BR", "BRL", 2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
          </Box>
        )}

        {/* Mobile Menu */}
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
                onEditTransaction(mobileActionAnchor.transaction);
              setMobileActionAnchor({ element: null, transaction: null });
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          {!mobileActionAnchor.transaction?.isVirtual && (
            <MenuItem
              onClick={() => {
                if (mobileActionAnchor.transaction)
                  onDeleteTransaction(mobileActionAnchor.transaction.id);
                setMobileActionAnchor({ element: null, transaction: null });
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 2 : 3,
        px: { xs: 0, md: "28px" },
        pt: { xs: 0, md: "24px" },
        pb: { xs: "140px", md: "60px" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "14px",
          mb: "22px",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Categories
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Manage your income and expense categories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddCategoryDialogOpen(true)}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
        >
          Nova Category
        </Button>
      </Box>

      {/* Summary Cards — income tinted + expense tinted (2-col wide) */}
      <Grid container spacing={gridSpacing}>
        {/* Income total */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? "12px" : "18px",
              borderRadius: "14px",
              border: `1px solid ${alpha("#10b981", 0.2)}`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha("#10b981", 0.1)} 0%, transparent 100%)`
                : `linear-gradient(135deg, ${alpha("#10b981", 0.05)} 0%, transparent 100%)`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1.25 : 1.5 }}>
              <Box
                sx={{
                  width: isMobile ? 34 : 40,
                  height: isMobile ? 34 : 40,
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#10b981", 0.18),
                  color: "#10b981",
                  flexShrink: 0,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: isMobile ? 15 : 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "text.secondary", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Income
                </Typography>
                <Typography sx={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#10b981" }}>
                  {formatCurrency(stats.totalIncome, "en-US", "USD", 2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? 10.5 : 12 }}>
                  {stats.incomeWithActivity} of {stats.incomeCategories} categories · {categorySummaries.income.reduce((s, c) => s + c.transactionCount, 0)} transactions
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Expense total */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? "12px" : "18px",
              borderRadius: "14px",
              border: `1px solid ${alpha("#ef4444", 0.2)}`,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha("#ef4444", 0.1)} 0%, transparent 100%)`
                : `linear-gradient(135deg, ${alpha("#ef4444", 0.05)} 0%, transparent 100%)`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1.25 : 1.5 }}>
              <Box
                sx={{
                  width: isMobile ? 34 : 40,
                  height: isMobile ? 34 : 40,
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha("#ef4444", 0.18),
                  color: "#ef4444",
                  flexShrink: 0,
                }}
              >
                <TrendingDownIcon sx={{ fontSize: isMobile ? 15 : 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "text.secondary", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Expenses
                </Typography>
                <Typography sx={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#ef4444" }}>
                  {formatCurrency(stats.totalExpense, "en-US", "USD", 2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? 10.5 : 12 }}>
                  {stats.expenseWithActivity} of {stats.expenseCategories} categories · {categorySummaries.expense.reduce((s, c) => s + c.transactionCount, 0)} transactions
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>


      {/* Income Section */}
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.5 : 2,
            borderRadius: "16px",
            border: `1px solid ${alpha("#059669", 0.2)}`,
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha("#059669", 0.1)} 0%, ${alpha("#059669", 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha("#059669", 0.08)} 0%, ${alpha("#059669", 0.02)} 100%)`,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: "12px", background: "linear-gradient(135deg, #059669, #047857)", display: "flex" }}>
              <TrendingUpIcon sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="#059669">Income</Typography>
              <Typography variant="body2" color="text.secondary">
                {categorySummaries.income.filter((s) => s.transactionCount > 0).length} active of {categorySummaries.income.length}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color="#059669" sx={{ ml: "auto" }}>
              {formatCurrency(stats.totalIncome, "en-US", "USD", 2)}
            </Typography>
          </Box>
        </Paper>

        {categorySummaries.income.length === 0 ? (
          <EmptyState
            type="transactions"
            title="No income categories"
            description="Click on '+ New category' to add"
            compact
          />
        ) : (
          <Grid container spacing={gridSpacing}>
            {categorySummaries.income.map((summary) => renderCategoryCard(summary, stats.totalIncome))}
          </Grid>
        )}
      </Box>

      <Divider sx={{ opacity: 0.4 }} />

      {/* Expense Section */}
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 1.5 : 2,
            borderRadius: "16px",
            border: `1px solid ${alpha("#DC2626", 0.2)}`,
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha("#DC2626", 0.1)} 0%, ${alpha("#DC2626", 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha("#DC2626", 0.08)} 0%, ${alpha("#DC2626", 0.02)} 100%)`,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: "12px", background: "linear-gradient(135deg, #DC2626, #b91c1c)", display: "flex" }}>
              <TrendingDownIcon sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="#DC2626">Expenses</Typography>
              <Typography variant="body2" color="text.secondary">
                {categorySummaries.expense.filter((s) => s.transactionCount > 0).length} active of {categorySummaries.expense.length}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color="#DC2626" sx={{ ml: "auto" }}>
              {formatCurrency(stats.totalExpense, "en-US", "USD", 2)}
            </Typography>
          </Box>
        </Paper>

        {categorySummaries.expense.length === 0 ? (
          <EmptyState
            type="transactions"
            title="No expense categories"
            description="Click on '+ New category' to add"
            compact
          />
        ) : (
          <Grid container spacing={gridSpacing}>
            {categorySummaries.expense.map((summary) => renderCategoryCard(summary, stats.totalExpense))}
          </Grid>
        )}
      </Box>


      {/* Auto-Categorização */}
      <Box
        sx={{
          p: isMobile ? 2 : 3,
          borderRadius: "20px",
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === "dark"
            ? `rgba(255,255,255,0.02)`
            : `rgba(255,255,255,0.8)`,
          backdropFilter: "blur(12px)",
        }}
      >
        <AutoCategorizationRules categories={categories} />
      </Box>

      {/* Add Category Dialog */}
      <Dialog
        open={addCategoryDialogOpen}
        onClose={() => { setAddCategoryDialogOpen(false); setAddCategoryName(""); }}
        PaperProps={{ sx: { borderRadius: "20px", minWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <ToggleButtonGroup
              value={addCategoryType}
              exclusive
              onChange={(_, v) => v && setAddCategoryType(v)}
              fullWidth
              size="small"
            >
              <ToggleButton value="income" sx={{ borderRadius: "10px 0 0 10px", fontWeight: 600, textTransform: "none" }}>
                <TrendingUpIcon sx={{ mr: 1, fontSize: 18, color: addCategoryType === "income" ? "#059669" : "text.secondary" }} />
                Income
              </ToggleButton>
              <ToggleButton value="expense" sx={{ borderRadius: "0 10px 10px 0", fontWeight: 600, textTransform: "none" }}>
                <TrendingDownIcon sx={{ mr: 1, fontSize: 18, color: addCategoryType === "expense" ? "#DC2626" : "text.secondary" }} />
                Expense
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Category name"
              value={addCategoryName}
              onChange={(e) => setAddCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setAddCategoryDialogOpen(false); setAddCategoryName(""); }} sx={{ borderRadius: "10px", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddCategory}
            disabled={!addCategoryName.trim()}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <PaymentMethodImagePicker
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        methodName={imagePickerTarget?.name ?? ""}
        currentUrl={imagePickerTarget ? getCategoryImage(imagePickerTarget.type, imagePickerTarget.name) : undefined}
        onSelect={async (url) => {
          if (!imagePickerTarget) return;
          await updateCategoryImage(imagePickerTarget.type, imagePickerTarget.name, url);
          if (url) {
            extractDominantColor(url).then((extracted) => {
              updateCategoryColor(imagePickerTarget.type, imagePickerTarget.name, extracted ?? hashColor(imagePickerTarget.name));
            });
          }
        }}
      />
    </Box>
  );
};

export default CategoriesView;
