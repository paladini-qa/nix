import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  };

  const maxAmount = Math.max(...transactions.map((t) => t.amount), 0.01);

  if (transactions.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <Typography color="text.secondary">
          No transactions found for this period.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 200 }}>Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => {
            const barWidth = (transaction.amount / maxAmount) * 100;
            const isIncome = transaction.type === "income";

            return (
              <TableRow
                key={transaction.id}
                hover
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(transaction.date)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: "50%",
                        bgcolor: isIncome ? "success.light" : "error.light",
                        color: isIncome ? "success.dark" : "error.dark",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isIncome ? (
                        <ArrowUpIcon fontSize="small" />
                      ) : (
                        <ArrowDownIcon fontSize="small" />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {transaction.description}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        {transaction.isRecurring && (
                          <Chip
                            icon={<RepeatIcon />}
                            label={
                              transaction.frequency === "monthly"
                                ? "Monthly"
                                : "Yearly"
                            }
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: 10 }}
                          />
                        )}
                        {transaction.installments &&
                          transaction.installments > 1 && (
                            <Chip
                              icon={<CreditCardIcon />}
                              label={`${transaction.currentInstallment || 1}/${
                                transaction.installments
                              }x`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 10 }}
                            />
                          )}
                      </Box>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={transaction.category}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {transaction.paymentMethod}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={isIncome ? "success.main" : "error.main"}
                      sx={{ mb: 0.5 }}
                    >
                      {isIncome ? "+" : "-"}{" "}
                      {formatCurrency(transaction.amount)}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={barWidth}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 2,
                          bgcolor: isIncome ? "success.main" : "error.main",
                          opacity: 0.6,
                        },
                      }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionTable;
