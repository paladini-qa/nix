import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  useMediaQuery,
  useTheme,
  Tooltip,
  Alert,
  Fab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { Budget, BudgetWithSpending, Transaction, TransactionType } from "../types";
import { budgetService } from "../services/api";
import { useNotification } from "../contexts";
import { useConfirmDialog } from "../contexts";
import DateFilter from "./DateFilter";

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
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirmDialog();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState("");
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [formLimit, setFormLimit] = useState("");

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

  // Filter transactions for current month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      return parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate budgets with spending
  const budgetsWithSpending = useMemo((): BudgetWithSpending[] => {
    return budgetService.calculateWithSpending(budgets, monthTransactions);
  }, [budgets, monthTransactions]);

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
    } else {
      setEditingBudget(null);
      setFormCategory("");
      setFormType("expense");
      setFormLimit("");
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBudget(null);
    setFormCategory("");
    setFormLimit("");
  };

  const handleSave = async () => {
    if (!formCategory || !formLimit) return;

    try {
      if (editingBudget) {
        await budgetService.update(editingBudget.id, {
          limitAmount: parseFloat(formLimit),
        });
        showSuccess("Budget updated successfully");
      } else {
        await budgetService.create(userId, {
          category: formCategory,
          type: formType,
          limitAmount: parseFloat(formLimit),
          month: selectedMonth + 1,
          year: selectedYear,
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Budgets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Set spending limits for each category
          </Typography>
        </Box>

        {!isMobile && (
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyFromPreviousMonth}
            size="small"
          >
            Copy Previous
          </Button>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <DateFilter
            month={selectedMonth}
            year={selectedYear}
            onDateChange={onDateChange}
            compact={isMobile}
          />
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
            >
              New Budget
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Total Budgeted
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              {formatCurrency(summary.totalBudgeted)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Total Spent
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(summary.totalSpent)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Over Budget
            </Typography>
            <Typography
              variant="h6"
              fontWeight="bold"
              color={summary.overBudgetCount > 0 ? "error.main" : "success.main"}
            >
              {summary.overBudgetCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Near Limit
            </Typography>
            <Typography
              variant="h6"
              fontWeight="bold"
              color={summary.warningCount > 0 ? "warning.main" : "text.primary"}
            >
              {summary.warningCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Budgets List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography color="text.secondary">Loading budgets...</Typography>
        </Box>
      ) : budgetsWithSpending.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <TrendingDownIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No budgets set for this month
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create budgets to track your spending against limits
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="outlined" onClick={handleCopyFromPreviousMonth}>
              Copy from Previous Month
            </Button>
            <Button variant="contained" onClick={() => handleOpenForm()}>
              Create Budget
            </Button>
          </Box>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {budgetsWithSpending.map((budget) => (
            <Grid key={budget.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Paper
                sx={{
                  p: 2.5,
                  border: budget.isOverBudget ? 2 : 0,
                  borderColor: "error.main",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {budget.category}
                      </Typography>
                      <Chip
                        label={budget.type === "income" ? "Income" : "Expense"}
                        size="small"
                        color={budget.type === "income" ? "success" : "error"}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Limit: {formatCurrency(budget.limitAmount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenForm(budget)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(budget)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mb: 1.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(budget.percentage, 100)}
                    color={getProgressColor(budget.percentage, budget.isOverBudget)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: "action.hover",
                    }}
                  />
                </Box>

                {/* Stats */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(budget.spent)} spent
                    </Typography>
                    <Typography
                      variant="caption"
                      color={budget.isOverBudget ? "error.main" : "text.secondary"}
                    >
                      {budget.isOverBudget
                        ? `${formatCurrency(Math.abs(budget.remaining))} over budget`
                        : `${formatCurrency(budget.remaining)} remaining`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {budget.isOverBudget ? (
                      <WarningIcon color="error" fontSize="small" />
                    ) : budget.percentage >= 80 ? (
                      <WarningIcon color="warning" fontSize="small" />
                    ) : null}
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={
                        budget.isOverBudget
                          ? "error.main"
                          : budget.percentage >= 80
                          ? "warning.main"
                          : "text.primary"
                      }
                    >
                      {Math.round(budget.percentage)}%
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={() => handleOpenForm()}
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            zIndex: 1100,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={handleCloseForm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingBudget ? "Edit Budget" : "New Budget"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            {!editingBudget && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formType}
                    label="Type"
                    onChange={(e) => {
                      setFormType(e.target.value as TransactionType);
                      setFormCategory("");
                    }}
                  >
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formCategory}
                    label="Category"
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
                    All categories have budgets set for this month
                  </Alert>
                )}
              </>
            )}

            {editingBudget && (
              <Typography variant="body2" color="text.secondary">
                Category: <strong>{editingBudget.category}</strong>
              </Typography>
            )}

            <TextField
              label="Monthly Limit"
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={handleCloseForm} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formLimit || (!editingBudget && !formCategory)}
          >
            {editingBudget ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetsView;


