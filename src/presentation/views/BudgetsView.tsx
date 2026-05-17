import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  IconButton,
  Drawer,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  useMediaQuery,
  useTheme,
  Tooltip,
  Alert,
  Switch,
  alpha,
} from "@mui/material";
import NixButton from "@/presentation/components/radix/Button";
import NixCard from "@/presentation/components/radix/Card";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingDown as TrendingDownIcon,
  Repeat as RepeatIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Budget, BudgetWithSpending, Transaction, TransactionType } from "@/domain/entities";
import { getReportDate } from "@/domain/usecases/transactionUtils";
import { budgetService } from "@/application/services";
import { useNotification } from "@/presentation/contexts";
import { useConfirmDialog } from "@/presentation/contexts";
import { useLayoutSpacing } from "@/presentation/hooks";
import DateFilter from "@/presentation/components/ui/DateFilter";
import EmptyState from "@/presentation/components/ui/EmptyState";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 28, delay: i * 0.06 },
  }),
};

interface BudgetsViewProps {
  transactions: Transaction[];
  categories: { income: string[]; expense: string[] };
  userId: string;
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
}

const BudgetsView: React.FC<BudgetsViewProps> = ({
  transactions,
  categories,
  userId,
  selectedMonth,
  selectedYear,
  onDateChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { gridSpacing } = useLayoutSpacing();
  const { showSuccess, showError, showWarning } = useNotification();
  const { confirmDelete } = useConfirmDialog();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Controle de alerta de orçamento (dispara apenas uma vez por sessão)
  const alertShownRef = useRef(false);

  // Form state
  const [formCategory, setFormCategory] = useState("");
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [formLimit, setFormLimit] = useState("");
  const [formIsRecurring, setFormIsRecurring] = useState(true);

  // Fetch budgets
  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getByMonth(selectedMonth + 1, selectedYear);
      setBudgets(data);
    } catch (err) {
      console.error("Error fetching budgets:", err);
      showError("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions for current month (usa data de relatório)
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const [y, m] = getReportDate(t).split("-");
      const isCurrentMonth = parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
      
      if (!isCurrentMonth) return false;
      
      // Para transações recorrentes originais (não virtuais), verifica se a data está excluída
      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) {
        return false;
      }
      
      return true;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate budgets with spending
  const budgetsWithSpending = useMemo((): BudgetWithSpending[] => {
    return budgetService.calculateWithSpending(budgets, monthTransactions);
  }, [budgets, monthTransactions]);

  // Alerta de orçamentos próximos ou estourados (uma vez por sessão)
  useEffect(() => {
    if (alertShownRef.current || loading || budgetsWithSpending.length === 0) return;
    const overBudget = budgetsWithSpending.filter((b) => b.isOverBudget);
    const nearLimit = budgetsWithSpending.filter((b) => b.percentage >= 80 && !b.isOverBudget);
    if (overBudget.length > 0) {
      showWarning(
        `${overBudget.length} orçamento${overBudget.length > 1 ? "s" : ""} estourado${overBudget.length > 1 ? "s" : ""}! Revise seus gastos.`,
        "️ Orçamento estourado"
      );
      alertShownRef.current = true;
    } else if (nearLimit.length > 0) {
      showWarning(
        `${nearLimit.length} orçamento${nearLimit.length > 1 ? "s" : ""} acima de 80% do limite.`,
        " Atenção ao orçamento"
      );
      alertShownRef.current = true;
    }
  }, [budgetsWithSpending, loading, showWarning]);

  // Calcula streak de meses consecutivos dentro do orçamento por categoria
  const streakByCategory = useMemo((): Record<string, number> => {
    const result: Record<string, number> = {};
    const now = new Date();

    budgets.forEach((budget) => {
      let streak = 0;
      for (let offset = 1; offset <= 12; offset++) {
        let targetMonth = (selectedMonth + 1) - offset;
        let targetYear = selectedYear;
        while (targetMonth <= 0) {
          targetMonth += 12;
          targetYear -= 1;
        }

        const monthTxs = transactions.filter((t) => {
          const [y, m] = getReportDate(t).split("-");
          return parseInt(y) === targetYear && parseInt(m) === targetMonth && t.category === budget.category && t.type === budget.type;
        });
        const spent = monthTxs.reduce((sum, t) => sum + (t.amount || 0), 0);

        if (spent <= budget.limitAmount) {
          streak++;
        } else {
          break;
        }
      }
      result[budget.category] = streak;
    });

    return result;
  }, [budgets, transactions, selectedMonth, selectedYear]);

  // Get available categories (not yet budgeted)
  const availableCategories = useMemo(() => {
    const budgetedCategories = new Set(
      budgets
        .filter((b) => b.type === formType)
        .map((b) => b.category)
    );
    return categories[formType].filter((c) => !budgetedCategories.has(c));
  }, [budgets, categories, formType]);

  // Summary stats
  const summary = useMemo(() => {
    const expenseBudgets = budgetsWithSpending.filter((b) => b.type === "expense");
    const totalBudgeted = expenseBudgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalSpent = expenseBudgets.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = expenseBudgets.filter((b) => b.isOverBudget).length;
    const warningCount = expenseBudgets.filter(
      (b) => b.percentage >= 80 && !b.isOverBudget
    ).length;

    return { totalBudgeted, totalSpent, overBudgetCount, warningCount };
  }, [budgetsWithSpending]);

  const handleOpenForm = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setFormCategory(budget.category);
      setFormType(budget.type);
      setFormLimit(budget.limitAmount.toString());
      setFormIsRecurring(budget.isRecurring ?? true);
    } else {
      setEditingBudget(null);
      setFormCategory("");
      setFormType("expense");
      setFormLimit("");
      setFormIsRecurring(true);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBudget(null);
    setFormCategory("");
    setFormLimit("");
    setFormIsRecurring(true);
  };

  const handleSave = async () => {
    if (!formCategory || !formLimit) return;

    try {
      if (editingBudget) {
        await budgetService.update(editingBudget.id, {
          limitAmount: parseFloat(formLimit),
          isRecurring: formIsRecurring,
        });
        showSuccess("Budget updated successfully");
      } else {
        await budgetService.create(userId, {
          category: formCategory,
          type: formType,
          limitAmount: parseFloat(formLimit),
          month: selectedMonth + 1,
          year: selectedYear,
          isRecurring: formIsRecurring,
        });
        showSuccess("Budget created successfully");
      }
      handleCloseForm();
      fetchBudgets();
    } catch (err: any) {
      console.error("Error saving budget:", err);
      showError(err.message || "Failed to save budget");
    }
  };

  const handleDelete = async (budget: Budget) => {
    const confirmed = await confirmDelete(`budget for "${budget.category}"`);
    if (!confirmed) return;

    try {
      await budgetService.delete(budget.id);
      setBudgets((prev) => prev.filter((b) => b.id !== budget.id));
      showSuccess("Budget deleted");
    } catch (err) {
      console.error("Error deleting budget:", err);
      showError("Failed to delete budget");
    }
  };

  const handleCopyFromPreviousMonth = async () => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    try {
      const copied = await budgetService.copyToMonth(
        userId,
        prevMonth + 1,
        prevYear,
        selectedMonth + 1,
        selectedYear
      );
      if (copied.length > 0) {
        showSuccess(`Copied ${copied.length} budgets from previous month`);
        fetchBudgets();
      } else {
        showError("No budgets to copy from previous month");
      }
    } catch (err) {
      console.error("Error copying budgets:", err);
      showError("Failed to copy budgets");
    }
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return "error";
    if (percentage >= 80) return "warning";
    return "primary";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? 2 : 3,
      px: { xs: 0, md: "28px" },
      pt: { xs: 0, md: "24px" },
      pb: { xs: "180px", md: "60px" },
    }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: "14px", flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Budgets
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Set spending limits per category
          </Typography>
        </Box>

        {!isMobile && (
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
            <NixButton
              size="small"
              variant="soft"
              color="purple"
              onClick={handleCopyFromPreviousMonth}
            >
              <CopyIcon /> Copy Previous
            </NixButton>
            <DateFilter
              month={selectedMonth}
              year={selectedYear}
              onDateChange={onDateChange}
              compact={isMobile}
            />
            <NixButton
              size="medium"
              variant="solid"
              color="purple"
              onClick={() => handleOpenForm()}
            >
              <AddIcon /> New Budget
            </NixButton>
          </Box>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={gridSpacing}>
        {[
          {
            label: "Limite Total",
            value: formatCurrency(summary.totalBudgeted),
            color: "#a855f7",
            bgColor: alpha("#a855f7", 0.12),
            icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
          },
          {
            label: "Gasto",
            value: formatCurrency(summary.totalSpent),
            color: "#ef4444",
            bgColor: alpha("#ef4444", 0.12),
            icon: <TrendingDownIcon sx={{ fontSize: 20 }} />,
          },
          {
            label: "Disponível",
            value: formatCurrency(Math.max(0, summary.totalBudgeted - summary.totalSpent)),
            color: "#10b981",
            bgColor: alpha("#10b981", 0.12),
            icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
          },
          {
            label: "Estourados",
            value: String(summary.overBudgetCount),
            color: summary.overBudgetCount > 0 ? "#ef4444" : "#a855f7",
            bgColor: summary.overBudgetCount > 0 ? alpha("#ef4444", 0.12) : alpha("#a855f7", 0.12),
            icon: <WarningIcon sx={{ fontSize: 20 }} />,
          },
        ].map((card, idx) => (
          <Grid key={idx} size={{ xs: 6, md: 3 }}>
            <Box
              sx={{
                position: "relative",
                p: "18px",
                borderRadius: "14px",
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.9),
                overflow: "hidden",
                boxShadow: `0 4px 14px ${alpha("#000000", 0.04)}`,
              }}
            >
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: card.color }}>
                {card.value}
              </Typography>
              {/* Icon badge */}
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 38,
                  height: 38,
                  borderRadius: "11px",
                  bgcolor: card.bgColor,
                  color: card.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {card.icon}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Budgets List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography color="text.secondary">Loading budgets...</Typography>
        </Box>
      ) : budgetsWithSpending.length === 0 ? (
        <EmptyState
          type="budgets"
          title="Nenhum orçamento definido para este mês"
          description="Crie orçamentos para acompanhar seus gastos em relação aos limites"
          actionLabel="Criar Orçamento"
          onAction={() => handleOpenForm()}
        />
      ) : (
        <Grid container spacing={gridSpacing}>
          {budgetsWithSpending.map((budget, i) => {
            const budgetColor = budget.isOverBudget ? "#DC2626" : budget.percentage >= 80 ? "#F59E0B" : "#6366f1";
            return (
              <Grid key={budget.id} size={{ xs: 12, sm: 6, lg: 4 }}
                component={motion.div}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                layout
              >
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{ height: "100%" }}
                >
                <Box
                  sx={{
                    p: "18px",
                    borderRadius: "14px",
                    border: `1px solid ${budget.isOverBudget ? alpha("#ef4444", 0.4) : theme.palette.divider}`,
                    bgcolor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.9),
                    boxShadow: `0 4px 14px ${alpha("#000000", 0.04)}`,
                    height: "100%",
                  }}
                >
                  {/* Card header row */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: "12px", mb: "12px" }}>
                    {/* Category icon */}
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        bgcolor: alpha(budgetColor, 0.12),
                        color: budgetColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 20 }} />
                    </Box>

                    {/* Name + chips */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: "4px" }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{budget.category}</Typography>
                        <Chip
                          label={budget.type === "income" ? "Receita" : "Despesa"}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            bgcolor: alpha(budget.type === "income" ? "#10b981" : "#ef4444", 0.1),
                            color: budget.type === "income" ? "#10b981" : "#ef4444",
                            border: "none",
                          }}
                        />
                        {budget.isRecurring && (
                          <Tooltip title="Repete todo mês">
                            <Chip
                              icon={<RepeatIcon sx={{ fontSize: 10 }} />}
                              label="Mensal"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                bgcolor: alpha("#a855f7", 0.1),
                                color: "#a855f7",
                                border: "none",
                                "& .MuiChip-icon": { color: "#a855f7", ml: 0.5 },
                              }}
                            />
                          </Tooltip>
                        )}
                        {(streakByCategory[budget.category] ?? 0) >= 2 && !budget.isOverBudget && (
                          <Tooltip title={`${streakByCategory[budget.category]} meses consecutivos dentro do orçamento`}>
                            <Chip
                              label={`🔥 ${streakByCategory[budget.category]}m`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                bgcolor: alpha("#10b981", 0.1),
                                color: "#10b981",
                                border: "none",
                                cursor: "default",
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                      {/* Limit / Spent / Remaining mini-labels */}
                      <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                          Limite: <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>{formatCurrency(budget.limitAmount)}</Box>
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                          Gasto: <Box component="span" sx={{ fontWeight: 700, color: "#ef4444" }}>{formatCurrency(budget.spent)}</Box>
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                          Disponível: <Box component="span" sx={{ fontWeight: 700, color: "#10b981" }}>{formatCurrency(budget.remaining)}</Box>
                        </Typography>
                      </Box>
                    </Box>

                    {/* Percentage + Edit button */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 22,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          color: budget.isOverBudget ? "#ef4444" : budgetColor,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {Math.round(budget.percentage)}%
                      </Typography>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenForm(budget)}
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Progress Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(budget.percentage, 100)}
                    sx={{
                      height: 8,
                      borderRadius: "99px",
                      bgcolor: alpha(budgetColor, 0.1),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: budgetColor,
                        borderRadius: "99px",
                      },
                    }}
                  />
                </Box>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Mobile FAB - padronizado 64px, border-radius 20px */}
      {isMobile && (
        <NixButton
          size="fab"
          variant="solid"
          color="purple"
          onClick={() => handleOpenForm()}
          className="nix-fab-create"
          style={{
            position: "fixed",
            bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            right: 16,
            zIndex: 1100,
          }}
        >
          <AddIcon />
        </NixButton>
      )}

      {/* Side Panel Form */}
      <Drawer
        anchor="right"
        open={isFormOpen}
        onClose={handleCloseForm}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: theme.palette.mode === "dark"
                ? alpha("#0F172A", 0.6)
                : alpha("#64748B", 0.25),
              backdropFilter: "blur(4px)",
            },
          },
        }}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 420 },
            maxWidth: "100vw",
            bgcolor: theme.palette.mode === "dark" ? theme.palette.background.default : "#FAFBFC",
            backgroundImage: "none",
            borderLeft: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
            boxShadow: theme.palette.mode === "dark"
              ? `-24px 0 80px -20px ${alpha("#000000", 0.5)}`
              : `-24px 0 80px -20px ${alpha(theme.palette.primary.main, 0.12)}`,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {editingBudget ? "Editar Orçamento" : "Novo Orçamento"}
          </Typography>
          <IconButton onClick={handleCloseForm} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2.5, flex: 1, overflow: "auto" }}>
          {!editingBudget && (
            <>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formType}
                  label="Tipo"
                  onChange={(e) => {
                    setFormType(e.target.value as TransactionType);
                    setFormCategory("");
                  }}
                >
                  <MenuItem value="expense">Despesa</MenuItem>
                  <MenuItem value="income">Receita</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formCategory}
                  label="Categoria"
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {availableCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {availableCategories.length === 0 && (
                <Alert severity="info" sx={{ mt: -1 }}>
                  Todas as categorias já têm orçamento neste mês
                </Alert>
              )}
            </>
          )}

          {editingBudget && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Categoria
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {editingBudget.category}
              </Typography>
            </Box>
          )}

          <TextField
            label="Limite Mensal"
            type="number"
            value={formLimit}
            onChange={(e) => setFormLimit(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">R$</InputAdornment>
              ),
            }}
            inputProps={{ min: 0.01, step: 0.01 }}
            fullWidth
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderRadius: 2,
              bgcolor: formIsRecurring
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.action.disabled, 0.05),
              border: 1,
              borderColor: formIsRecurring
                ? alpha(theme.palette.primary.main, 0.2)
                : "divider",
              transition: "all 0.2s ease-in-out",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <RepeatIcon
                sx={{
                  color: formIsRecurring ? "primary.main" : "text.disabled",
                  transition: "color 0.2s",
                }}
              />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  Repetir todo mês
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formIsRecurring
                    ? "Este orçamento será criado automaticamente nos próximos meses"
                    : "Este orçamento é apenas para o mês selecionado"}
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={formIsRecurring}
              onChange={(e) => setFormIsRecurring(e.target.checked)}
              color="primary"
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2.5,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            gap: 1.5,
          }}
        >
          <NixButton size="medium" variant="soft" color="gray" onClick={handleCloseForm} style={{ flex: 1 }}>
            Cancelar
          </NixButton>
          <NixButton
            size="medium"
            variant="solid"
            color="purple"
            onClick={handleSave}
            disabled={!formLimit || (!editingBudget && !formCategory)}
            style={{ flex: 1 }}
          >
            {editingBudget ? "Atualizar" : "Criar"}
          </NixButton>
        </Box>
      </Drawer>
    </Box>
  );
};

export default BudgetsView;


