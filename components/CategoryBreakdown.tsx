import React, { useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CreditCard as CreditCardIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { Transaction, TransactionType } from "../types";
import { ColorsContext } from "../App";

interface CategoryBreakdownProps {
  transactions: Transaction[];
  onPaymentMethodClick?: (paymentMethod: string) => void;
  onCategoryClick?: (category: string, type: TransactionType) => void;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  onPaymentMethodClick,
  onCategoryClick,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { getCategoryColor, getPaymentMethodColor } = useContext(ColorsContext);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Calculate income by category
  const incomeByCategory = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  // Calculate expense by category
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  // Calculate by payment method
  const byPaymentMethod = transactions.reduce((acc, curr) => {
    if (!acc[curr.paymentMethod]) {
      acc[curr.paymentMethod] = { income: 0, expense: 0 };
    }
    if (curr.type === "income") {
      acc[curr.paymentMethod].income += curr.amount || 0;
    } else {
      acc[curr.paymentMethod].expense += curr.amount || 0;
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const sortedIncome = Object.entries(incomeByCategory).sort(
    ([, a], [, b]) => b - a
  );
  const sortedExpense = Object.entries(expenseByCategory).sort(
    ([, a], [, b]) => b - a
  );
  // Ordena por despesas (do maior para menor)
  const sortedPaymentMethods = Object.entries(byPaymentMethod).sort(
    ([, a], [, b]) => b.expense - a.expense
  );

  const totalIncome = sortedIncome.reduce((sum, [, val]) => sum + val, 0);
  const totalExpense = sortedExpense.reduce((sum, [, val]) => sum + val, 0);
  // Total de despesas por método de pagamento
  const totalPaymentMethodExpense = sortedPaymentMethods.reduce(
    (sum, [, data]) => sum + data.expense, 0
  );

  // Agrupa transações por categoria/método para exibição detalhada
  const incomeTransactionsByCategory = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push(curr);
      return acc;
    }, {} as Record<string, Transaction[]>);

  const expenseTransactionsByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push(curr);
      return acc;
    }, {} as Record<string, Transaction[]>);

  const transactionsByPaymentMethod = transactions.reduce((acc, curr) => {
    if (!acc[curr.paymentMethod]) acc[curr.paymentMethod] = [];
    acc[curr.paymentMethod].push(curr);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <Grid container spacing={3}>
      {/* Income by Category */}
      <Grid size={{ xs: 12, md: 6, xl: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            height: "100%",
            position: "relative",
            overflow: "hidden",
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
              : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
            backdropFilter: "blur(16px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            borderRadius: "20px",
            boxShadow: `0 6px 24px -6px ${alpha("#059669", 0.15)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha("#059669", 0.1),
                display: "flex",
              }}
            >
              <TrendingUpIcon fontSize="small" sx={{ color: "#059669" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Income by Category
            </Typography>
          </Box>

          {sortedIncome.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No income for this period
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {sortedIncome.map(([category, amount]) => {
                const percentage =
                  totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                const colors = getCategoryColor("income", category);
                const categoryTransactions = incomeTransactionsByCategory[category] || [];
                
                return (
                  <Box key={category}>
                    <Box
                      onClick={() => onCategoryClick && onCategoryClick(category, "income")}
                      sx={{
                        cursor: onCategoryClick ? "pointer" : "default",
                        p: 1.5,
                        borderRadius: 2,
                        border: 1,
                        borderColor: "divider",
                        bgcolor: "transparent",
                        transition: "all 0.2s ease",
                        "&:hover": onCategoryClick ? {
                          bgcolor: `${colors.primary}12`,
                          borderColor: colors.primary,
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px -4px ${colors.primary}30`,
                        } : {},
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 0.5,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            }}
                          />
                          <Typography variant="body2" fontWeight={500}>{category}</Typography>
                          <Chip 
                            label={categoryTransactions.length} 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: 11,
                              bgcolor: `${colors.primary}20`,
                              color: colors.primary,
                            }} 
                          />
                        </Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ color: colors.primary }}
                          >
                            {formatCurrency(amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {percentage.toFixed(0)}%
                          </Typography>
                          {onCategoryClick && (
                            <OpenInNewIcon fontSize="small" sx={{ color: colors.primary, ml: 0.5 }} />
                          )}
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "action.hover",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
              <Box
                sx={{
                  pt: 1.5,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase" }}
                >
                  Total
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="success.main"
                >
                  {formatCurrency(totalIncome)}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Expense by Category */}
      <Grid size={{ xs: 12, md: 6, xl: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            height: "100%",
            position: "relative",
            overflow: "hidden",
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
              : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
            backdropFilter: "blur(16px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            borderRadius: "20px",
            boxShadow: `0 6px 24px -6px ${alpha("#DC2626", 0.15)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha("#DC2626", 0.1),
                display: "flex",
              }}
            >
              <TrendingDownIcon fontSize="small" sx={{ color: "#DC2626" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Expenses by Category
            </Typography>
          </Box>

          {sortedExpense.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No expenses for this period
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {sortedExpense.map(([category, amount]) => {
                const percentage =
                  totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                const colors = getCategoryColor("expense", category);
                const categoryTransactions = expenseTransactionsByCategory[category] || [];
                
                return (
                  <Box key={category}>
                    <Box
                      onClick={() => onCategoryClick && onCategoryClick(category, "expense")}
                      sx={{
                        cursor: onCategoryClick ? "pointer" : "default",
                        p: 1.5,
                        borderRadius: 2,
                        border: 1,
                        borderColor: "divider",
                        bgcolor: "transparent",
                        transition: "all 0.2s ease",
                        "&:hover": onCategoryClick ? {
                          bgcolor: `${colors.primary}12`,
                          borderColor: colors.primary,
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px -4px ${colors.primary}30`,
                        } : {},
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 0.5,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            }}
                          />
                          <Typography variant="body2" fontWeight={500}>{category}</Typography>
                          <Chip 
                            label={categoryTransactions.length} 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: 11,
                              bgcolor: `${colors.primary}20`,
                              color: colors.primary,
                            }} 
                          />
                        </Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ color: colors.primary }}
                          >
                            {formatCurrency(amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {percentage.toFixed(0)}%
                          </Typography>
                          {onCategoryClick && (
                            <OpenInNewIcon fontSize="small" sx={{ color: colors.primary, ml: 0.5 }} />
                          )}
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "action.hover",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
              <Box
                sx={{
                  pt: 1.5,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase" }}
                >
                  Total
                </Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {formatCurrency(totalExpense)}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Expenses by Payment Method */}
      <Grid size={{ xs: 12, md: 12, xl: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            height: "100%",
            position: "relative",
            overflow: "hidden",
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
              : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
            backdropFilter: "blur(16px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            borderRadius: "20px",
            boxShadow: `0 6px 24px -6px ${alpha("#6366f1", 0.15)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha("#6366f1", 0.1),
                display: "flex",
              }}
            >
              <CreditCardIcon fontSize="small" sx={{ color: "#6366f1" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Expenses by Payment Method
            </Typography>
          </Box>

          {totalPaymentMethodExpense === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No expenses for this period
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {sortedPaymentMethods.map(([method, data]) => {
                // Mostra apenas despesas para métodos de pagamento
                const percentage =
                  totalPaymentMethodExpense > 0 ? (data.expense / totalPaymentMethodExpense) * 100 : 0;
                const colors = getPaymentMethodColor(method);
                // Filtra apenas transações de despesa para este método
                const methodExpenseTransactions = (transactionsByPaymentMethod[method] || [])
                  .filter(tx => tx.type === "expense");
                
                // Não mostra métodos de pagamento sem despesas
                if (data.expense === 0) return null;
                
                return (
                  <Box key={method}>
                    <Box
                      onClick={() => onPaymentMethodClick && onPaymentMethodClick(method)}
                      sx={{
                        cursor: onPaymentMethodClick ? "pointer" : "default",
                        p: 1.5,
                        borderRadius: 2,
                        border: 1,
                        borderColor: "divider",
                        bgcolor: "transparent",
                        transition: "all 0.2s ease",
                        "&:hover": onPaymentMethodClick ? {
                          bgcolor: `${colors.primary}12`,
                          borderColor: colors.primary,
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px -4px ${colors.primary}30`,
                        } : {},
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 0.5,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            }}
                          />
                          <Typography variant="body2" fontWeight={500}>{method}</Typography>
                          <Chip 
                            label={methodExpenseTransactions.length} 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: 11,
                              bgcolor: `${colors.primary}20`,
                              color: colors.primary,
                            }} 
                          />
                        </Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="error.main"
                          >
                            {formatCurrency(data.expense)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {percentage.toFixed(0)}%
                          </Typography>
                          {onPaymentMethodClick && (
                            <OpenInNewIcon fontSize="small" sx={{ color: colors.primary, ml: 0.5 }} />
                          )}
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "action.hover",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
              <Box
                sx={{
                  pt: 1.5,
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={500}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase" }}
                >
                  Total
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="error.main"
                >
                  {formatCurrency(totalPaymentMethodExpense)}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default CategoryBreakdown;
