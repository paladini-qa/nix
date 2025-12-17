import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Alert,
} from "@mui/material";
import {
  Repeat as RepeatIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  AllInclusive as InfiniteIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

interface RecurringViewProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const RecurringView: React.FC<RecurringViewProps> = ({
  transactions,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterFrequency, setFilterFrequency] = useState<"all" | "monthly" | "yearly">("all");
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Filtra apenas transações recorrentes (não virtuais)
  const recurringTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.isRecurring && !t.isVirtual)
      .filter((t) => {
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || t.type === filterType;
        const matchesFrequency = filterFrequency === "all" || t.frequency === filterFrequency;
        return matchesSearch && matchesType && matchesFrequency;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterType, filterFrequency]);

  // Estatísticas
  const stats = useMemo(() => {
    const recurring = transactions.filter((t) => t.isRecurring && !t.isVirtual);
    const monthlyIncome = recurring
      .filter((t) => t.type === "income" && t.frequency === "monthly")
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = recurring
      .filter((t) => t.type === "expense" && t.frequency === "monthly")
      .reduce((sum, t) => sum + t.amount, 0);
    const yearlyOnlyIncome = recurring
      .filter((t) => t.type === "income" && t.frequency === "yearly")
      .reduce((sum, t) => sum + t.amount, 0);
    const yearlyOnlyExpense = recurring
      .filter((t) => t.type === "expense" && t.frequency === "yearly")
      .reduce((sum, t) => sum + t.amount, 0);

    // Impacto anualizado: mensais × 12 + anuais
    const annualizedIncome = monthlyIncome * 12 + yearlyOnlyIncome;
    const annualizedExpense = monthlyExpense * 12 + yearlyOnlyExpense;

    return {
      total: recurring.length,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
      annualizedIncome,
      annualizedExpense,
      annualizedBalance: annualizedIncome - annualizedExpense,
      incomeCount: recurring.filter((t) => t.type === "income").length,
      expenseCount: recurring.filter((t) => t.type === "expense").length,
    };
  }, [transactions]);

  // Helper para parsear data YYYY-MM-DD sem problemas de timezone
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Calcula quantas vezes a transação já ocorreu
  const calculateOccurrences = (transaction: Transaction): number => {
    const startDate = parseLocalDate(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate > today) return 0;

    const monthsDiff =
      (today.getFullYear() - startDate.getFullYear()) * 12 +
      (today.getMonth() - startDate.getMonth());

    if (transaction.frequency === "monthly") {
      return Math.max(1, monthsDiff + 1);
    } else if (transaction.frequency === "yearly") {
      return Math.max(1, today.getFullYear() - startDate.getFullYear() + 1);
    }
    return 1;
  };

  // Calcula próxima ocorrência
  const getNextOccurrence = (transaction: Transaction): string => {
    const startDate = parseLocalDate(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextDate = new Date(startDate);

    if (transaction.frequency === "monthly") {
      while (nextDate <= today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else if (transaction.frequency === "yearly") {
      while (nextDate <= today) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }

    return nextDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Recurring Transactions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your recurring income and expenses
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <RepeatIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Total Recurring
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {stats.total}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                <Typography variant="caption" color="success.main">
                  {stats.incomeCount} income
                </Typography>
                <Typography variant="caption" color="error.main">
                  {stats.expenseCount} expense
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <CalendarIcon color="info" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Monthly Balance
                </Typography>
              </Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                color={stats.monthlyBalance >= 0 ? "success.main" : "error.main"}
              >
                {formatCurrency(stats.monthlyBalance)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                <Typography variant="caption" color="success.main">
                  +{formatCurrency(stats.monthlyIncome)} income
                </Typography>
                <Typography variant="caption" color="error.main">
                  -{formatCurrency(stats.monthlyExpense)} expense
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <InfiniteIcon color="warning" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Yearly Balance
                </Typography>
              </Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                color={stats.annualizedBalance >= 0 ? "success.main" : "error.main"}
              >
                {formatCurrency(stats.annualizedBalance)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                <Typography variant="caption" color="success.main">
                  +{formatCurrency(stats.annualizedIncome)} income
                </Typography>
                <Typography variant="caption" color="error.main">
                  -{formatCurrency(stats.annualizedExpense)} expense
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <TrendingUpIcon fontSize="small" />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Annual Impact
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(stats.annualizedBalance)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Monthly × 12 + Yearly
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  &nbsp;
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
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
          sx={{ minWidth: 200, flex: 1 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
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
          <InputLabel>Frequency</InputLabel>
          <Select
            value={filterFrequency}
            label="Frequency"
            onChange={(e: SelectChangeEvent) =>
              setFilterFrequency(e.target.value as "all" | "monthly" | "yearly")
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table / List */}
      {recurringTransactions.length === 0 ? (
        <Alert severity="info" icon={<RepeatIcon />}>
          No recurring transactions found. Create a transaction and mark it as
          recurring to see it here.
        </Alert>
      ) : isMobile ? (
        // Mobile Card View
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recurringTransactions.map((t) => (
            <Card
              key={t.id}
              sx={{
                border: 1,
                borderColor: "divider",
                borderLeft: 4,
                borderLeftColor: t.type === "income" ? "success.main" : "error.main",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t.category} • {t.paymentMethod}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) =>
                      setMobileMenuAnchor({ element: e.currentTarget, transaction: t })
                    }
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color={t.type === "income" ? "success.main" : "error.main"}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Frequency
                    </Typography>
                    <Chip
                      size="small"
                      label={t.frequency === "monthly" ? "Monthly" : "Yearly"}
                      color={t.frequency === "monthly" ? "info" : "warning"}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Started
                    </Typography>
                    <Typography variant="body2">{formatDate(t.date)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Occurrences
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {calculateOccurrences(t)}x
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Next Occurrence
                    </Typography>
                    <Typography variant="body2" color="primary.main">
                      {getNextOccurrence(t)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Desktop Table View
        <TableContainer component={Paper} sx={{ border: 1, borderColor: "divider" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Started</TableCell>
                <TableCell align="center">Occurrences</TableCell>
                <TableCell>Next</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recurringTransactions.map((t) => (
                <TableRow
                  key={t.id}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    borderLeft: 4,
                    borderLeftColor: t.type === "income" ? "success.main" : "error.main",
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {t.type === "income" ? (
                        <TrendingUpIcon fontSize="small" color="success" />
                      ) : (
                        <TrendingDownIcon fontSize="small" color="error" />
                      )}
                      <Typography variant="body2" fontWeight={500}>
                        {t.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={t.category} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={t.type === "income" ? "success.main" : "error.main"}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={<RepeatIcon sx={{ fontSize: 14 }} />}
                      label={t.frequency === "monthly" ? "Monthly" : "Yearly"}
                      color={t.frequency === "monthly" ? "info" : "warning"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(t.date)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Total occurrences since start">
                      <Chip
                        size="small"
                        label={`${calculateOccurrences(t)}x`}
                        color="default"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary.main" fontWeight={500}>
                      {getNextOccurrence(t)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => onEdit(t)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(t.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Mobile Action Menu */}
      <Menu
        anchorEl={mobileMenuAnchor.element}
        open={Boolean(mobileMenuAnchor.element)}
        onClose={() => setMobileMenuAnchor({ element: null, transaction: null })}
      >
        <MenuItem
          onClick={() => {
            if (mobileMenuAnchor.transaction) {
              onEdit(mobileMenuAnchor.transaction);
            }
            setMobileMenuAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (mobileMenuAnchor.transaction) {
              onDelete(mobileMenuAnchor.transaction.id);
            }
            setMobileMenuAnchor({ element: null, transaction: null });
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default RecurringView;

