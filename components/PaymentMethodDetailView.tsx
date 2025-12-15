import React from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Chip,
  Grid,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Repeat as RepeatIcon,
  AutorenewOutlined as AutorenewIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";
import { MONTHS } from "../constants";
import DateFilter from "./DateFilter";

interface PaymentMethodDetailViewProps {
  paymentMethod: string;
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
  onBack: () => void;
}

const PaymentMethodDetailView: React.FC<PaymentMethodDetailViewProps> = ({
  paymentMethod,
  transactions,
  selectedMonth,
  selectedYear,
  onDateChange,
  onBack,
}) => {
  // Gera transações recorrentes virtuais para este método de pagamento
  const generateRecurringForMethod = (): Transaction[] => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = selectedMonth + 1; // 1-12
    const targetYear = selectedYear;

    transactions.forEach((t) => {
      // Só processa transações recorrentes deste método de pagamento
      if (!t.isRecurring || !t.frequency || t.paymentMethod !== paymentMethod) return;

      const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
      const origDate = new Date(origYear, origMonth - 1, origDay);
      const targetDate = new Date(targetYear, targetMonth - 1, 1);

      // Não gera ocorrências para datas anteriores à transação original
      if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

      // Verifica se já existe a transação original para este mês
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
        const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
        const adjustedDay = Math.min(origDay, daysInTargetMonth);
        const virtualDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

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
  };

  const filteredTransactions = [
    ...transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      const matchesDate =
        parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
      return t.paymentMethod === paymentMethod && matchesDate;
    }),
    ...generateRecurringForMethod(),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={onBack} sx={{ bgcolor: "action.hover" }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "primary.light",
                  display: "flex",
                }}
              >
                <CreditCardIcon color="primary" />
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {paymentMethod}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Transactions for {MONTHS[selectedMonth]} {selectedYear}
            </Typography>
          </Box>
        </Box>

        <DateFilter
          month={selectedMonth}
          year={selectedYear}
          onDateChange={onDateChange}
          showIcon
        />
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: balance >= 0 ? "success.50" : "error.50",
              border: 1,
              borderColor: balance >= 0 ? "success.light" : "error.light",
            }}
          >
            <Typography
              variant="overline"
              color={balance >= 0 ? "success.main" : "error.main"}
            >
              Current Balance
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              color={balance >= 0 ? "success.dark" : "error.dark"}
            >
              {formatCurrency(balance)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "success.50",
              border: 1,
              borderColor: "success.light",
            }}
          >
            <Typography variant="overline" color="success.main">
              Income
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.dark">
              {formatCurrency(totalIncome)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "error.50",
              border: 1,
              borderColor: "error.light",
            }}
          >
            <Typography variant="overline" color="error.main">
              Expenses
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="error.dark">
              {formatCurrency(totalExpense)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                Type
              </TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, index) => (
                <TableRow
                  key={t.id}
                  hover
                  sx={{
                    bgcolor: index % 2 === 0 ? "transparent" : "action.hover",
                  }}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {formatDate(t.date)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {t.description}
                      </Typography>
                      {t.isRecurring && (
                        <RepeatIcon fontSize="small" color="primary" />
                      )}
                      {t.isVirtual && (
                        <Chip
                          icon={<AutorenewIcon />}
                          label="Auto"
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      )}
                    </Box>
                    {t.installments && t.installments > 1 && (
                      <Chip
                        icon={<CreditCardIcon />}
                        label={`${t.currentInstallment || 1}/${
                          t.installments
                        }x`}
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10, mt: 0.5 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={t.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {t.type === "income" ? (
                      <ArrowUpIcon color="success" />
                    ) : (
                      <ArrowDownIcon color="error" />
                    )}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color:
                        t.type === "income" ? "success.main" : "error.main",
                    }}
                  >
                    {t.type === "expense" && "- "}
                    {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 6 }}>
                  <Typography color="text.secondary" fontStyle="italic">
                    No transactions with {paymentMethod} for this period.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {filteredTransactions.length > 0 && (
            <TableFooter>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell
                  colSpan={4}
                  sx={{ textAlign: "right", fontWeight: 600 }}
                >
                  Total ({filteredTransactions.length} transactions):
                </TableCell>
                <TableCell
                  sx={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: balance >= 0 ? "success.main" : "error.main",
                  }}
                >
                  {formatCurrency(balance)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PaymentMethodDetailView;
