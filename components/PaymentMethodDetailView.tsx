import React, { useState, useMemo } from "react";
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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Repeat as RepeatIcon,
  AutorenewOutlined as AutorenewIcon,
  Search as SearchIcon,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Gera transações recorrentes virtuais para este método de pagamento (apenas não-parceladas)
  const generateRecurringForMethod = (): Transaction[] => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = selectedMonth + 1; // 1-12
    const targetYear = selectedYear;

    transactions.forEach((t) => {
      // Só processa transações recorrentes deste método de pagamento
      if (!t.isRecurring || !t.frequency || t.paymentMethod !== paymentMethod) return;
      if (t.installments && t.installments > 1) return; // Parceladas não geram virtuais

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

  // Extrai categorias únicas das transações deste método de pagamento
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions
      .filter((t) => t.paymentMethod === paymentMethod)
      .forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }, [transactions, paymentMethod]);

  const filteredTransactions = useMemo(() => {
    const baseTransactions = [
      ...transactions.filter((t) => {
        const [y, m] = t.date.split("-");
        const matchesDate =
          parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
        return t.paymentMethod === paymentMethod && matchesDate;
      }),
      ...generateRecurringForMethod(),
    ];

    return baseTransactions
      .filter((t) => {
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || t.type === filterType;
        const matchesCategory = filterCategory === "all" || t.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, selectedYear, paymentMethod, searchTerm, filterType, filterCategory]);

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
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

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

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 150 }}
        />

        <FormControl size="small" sx={{ minWidth: 100 }}>
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
          <InputLabel>Category</InputLabel>
          <Select
            value={filterCategory}
            label="Category"
            onChange={(e: SelectChangeEvent) => setFilterCategory(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {availableCategories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

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
                    {formatCurrency(t.amount || 0)}
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






