import React from "react";
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CreditCard as CreditCardIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

interface CategoryBreakdownProps {
  transactions: Transaction[];
  onPaymentMethodClick?: (paymentMethod: string) => void;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  onPaymentMethodClick,
}) => {
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
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  // Calculate expense by category
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  // Calculate by payment method
  const byPaymentMethod = transactions.reduce((acc, curr) => {
    if (!acc[curr.paymentMethod]) {
      acc[curr.paymentMethod] = { income: 0, expense: 0 };
    }
    if (curr.type === "income") {
      acc[curr.paymentMethod].income += curr.amount;
    } else {
      acc[curr.paymentMethod].expense += curr.amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const sortedIncome = Object.entries(incomeByCategory).sort(
    ([, a], [, b]) => b - a
  );
  const sortedExpense = Object.entries(expenseByCategory).sort(
    ([, a], [, b]) => b - a
  );
  const sortedPaymentMethods = Object.entries(byPaymentMethod).sort(
    ([, a], [, b]) => b.expense + b.income - (a.expense + a.income)
  );

  const totalIncome = sortedIncome.reduce((sum, [, val]) => sum + val, 0);
  const totalExpense = sortedExpense.reduce((sum, [, val]) => sum + val, 0);

  const INCOME_COLORS = ["#10b981", "#34d399", "#14b8a6", "#22c55e", "#84cc16"];
  const EXPENSE_COLORS = [
    "#ef4444",
    "#dc2626",
    "#f43f5e",
    "#e11d48",
    "#f87171",
    "#fb7185",
    "#b91c1c",
    "#be123c",
  ];
  const PAYMENT_COLORS = [
    "#6366f1",
    "#3b82f6",
    "#06b6d4",
    "#0ea5e9",
    "#8b5cf6",
    "#a855f7",
  ];

  return (
    <Grid container spacing={3}>
      {/* Income by Category */}
      <Grid size={{ xs: 12, md: 6, xl: 4 }}>
        <Paper sx={{ p: 2.5, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "success.light",
                display: "flex",
              }}
            >
              <TrendingUpIcon fontSize="small" sx={{ color: "success.dark" }} />
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sortedIncome.map(([category, amount], index) => {
                const percentage =
                  totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                return (
                  <Box key={category}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              INCOME_COLORS[index % INCOME_COLORS.length],
                          }}
                        />
                        <Typography variant="body2">{category}</Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="success.main"
                        >
                          {formatCurrency(amount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {percentage.toFixed(0)}%
                        </Typography>
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
                          bgcolor: INCOME_COLORS[index % INCOME_COLORS.length],
                          opacity: 0.7,
                        },
                      }}
                    />
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
        <Paper sx={{ p: 2.5, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "error.light",
                display: "flex",
              }}
            >
              <TrendingDownIcon fontSize="small" sx={{ color: "error.dark" }} />
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sortedExpense.map(([category, amount], index) => {
                const percentage =
                  totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                return (
                  <Box key={category}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              EXPENSE_COLORS[index % EXPENSE_COLORS.length],
                          }}
                        />
                        <Typography variant="body2">{category}</Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="error.main"
                        >
                          {formatCurrency(amount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {percentage.toFixed(0)}%
                        </Typography>
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
                          bgcolor:
                            EXPENSE_COLORS[index % EXPENSE_COLORS.length],
                          opacity: 0.7,
                        },
                      }}
                    />
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

      {/* By Payment Method */}
      <Grid size={{ xs: 12, md: 12, xl: 4 }}>
        <Paper sx={{ p: 2.5, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "primary.light",
                display: "flex",
              }}
            >
              <CreditCardIcon fontSize="small" sx={{ color: "primary.dark" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600}>
              By Payment Method
            </Typography>
          </Box>

          {sortedPaymentMethods.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No transactions for this period
            </Typography>
          ) : (
            <List disablePadding>
              {sortedPaymentMethods.map(([method, data], index) => {
                const total = data.income + data.expense;
                return (
                  <ListItemButton
                    key={method}
                    onClick={() => onPaymentMethodClick?.(method)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      border: 1,
                      borderColor: "divider",
                      "&:hover": {
                        bgcolor: "primary.50",
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor:
                            PAYMENT_COLORS[index % PAYMENT_COLORS.length],
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={method}
                      secondary={
                        <Box
                          component="span"
                          sx={{ display: "flex", gap: 2, mt: 0.5 }}
                        >
                          {data.income > 0 && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="success.main"
                            >
                              +{formatCurrency(data.income)}
                            </Typography>
                          )}
                          {data.expense > 0 && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="error.main"
                            >
                              -{formatCurrency(data.expense)}
                            </Typography>
                          )}
                        </Box>
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(total)}
                    </Typography>
                    <ChevronRightIcon
                      fontSize="small"
                      color="action"
                      sx={{ ml: 1 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default CategoryBreakdown;
