import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Alert,
  Button,
  Fab,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  alpha,
  LinearProgress,
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
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

interface RecurringViewProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onNewTransaction: () => void;
}

interface RecurringOccurrence {
  date: string;
  month: string;
  year: number;
  isPast: boolean;
  isCurrent: boolean;
}

const RecurringView: React.FC<RecurringViewProps> = ({
  transactions,
  onEdit,
  onDelete,
  onNewTransaction,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterFrequency, setFilterFrequency] = useState<"all" | "monthly" | "yearly">("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
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

  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

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

  // Gera lista de ocorrências para exibição
  const getOccurrencesList = (transaction: Transaction): RecurringOccurrence[] => {
    const startDate = parseLocalDate(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const occurrences: RecurringOccurrence[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Mostra 12 ocorrências (6 passadas se existirem + atual + 5 futuras)
    let currentDate = new Date(startDate);
    const maxOccurrences = 12;
    
    for (let i = 0; i < maxOccurrences; i++) {
      if (transaction.frequency === "monthly") {
        const occDate = new Date(startDate);
        occDate.setMonth(startDate.getMonth() + i);
        
        const isPast = occDate < new Date(today.getFullYear(), today.getMonth(), 1);
        const isCurrent = occDate.getMonth() === today.getMonth() && occDate.getFullYear() === today.getFullYear();
        
        occurrences.push({
          date: occDate.toISOString().split("T")[0],
          month: months[occDate.getMonth()],
          year: occDate.getFullYear(),
          isPast,
          isCurrent,
        });
      } else if (transaction.frequency === "yearly") {
        const occDate = new Date(startDate);
        occDate.setFullYear(startDate.getFullYear() + i);
        
        const isPast = occDate.getFullYear() < today.getFullYear() || 
          (occDate.getFullYear() === today.getFullYear() && occDate.getMonth() < today.getMonth());
        const isCurrent = occDate.getFullYear() === today.getFullYear() && occDate.getMonth() === today.getMonth();
        
        occurrences.push({
          date: occDate.toISOString().split("T")[0],
          month: months[occDate.getMonth()],
          year: occDate.getFullYear(),
          isPast,
          isCurrent,
        });
      }
    }
    
    return occurrences;
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

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderRecurringCard = (t: Transaction) => {
    const isExpanded = expandedItems.has(t.id);
    const isIncome = t.type === "income";
    const occurrences = calculateOccurrences(t);
    const occurrencesList = getOccurrencesList(t);

    return (
      <Card
        key={t.id}
        sx={{
          border: 1,
          borderColor: "divider",
          borderLeft: 4,
          borderLeftColor: isIncome ? "success.main" : "error.main",
          mb: 2,
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              cursor: "pointer",
            }}
            onClick={() => toggleExpand(t.id)}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                {isIncome ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
                <Typography variant="subtitle1" fontWeight={600}>
                  {t.description}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={t.category} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {t.paymentMethod}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: "right", minWidth: 120 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color={isIncome ? "success.main" : "error.main"}
              >
                {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
              </Typography>
              <Chip
                icon={<RepeatIcon sx={{ fontSize: 14 }} />}
                label={t.frequency === "monthly" ? "Monthly" : "Yearly"}
                size="small"
                color={t.frequency === "monthly" ? "info" : "warning"}
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          {/* Info Row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Started: {formatDate(t.date)}
                </Typography>
              </Box>
              <Chip
                label={`${occurrences}x occurred`}
                size="small"
                color="default"
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ScheduleIcon fontSize="small" color="primary" />
              <Typography variant="body2" color="primary.main" fontWeight={500}>
                Next: {getNextOccurrence(t)}
              </Typography>
            </Box>
          </Box>

          {/* Expand Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <Button
              size="small"
              onClick={() => toggleExpand(t.id)}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none" }}
            >
              {isExpanded ? "Hide occurrences" : "View occurrences"}
            </Button>
          </Box>
        </CardContent>

        {/* Occurrences List */}
        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.3) }}>
            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => onEdit(t)}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(t.id)}
              >
                Delete
              </Button>
            </Box>

            {/* Timeline/Grid of occurrences */}
            <Typography variant="subtitle2" gutterBottom>
              Upcoming occurrences
            </Typography>
            
            {isMobile ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {occurrencesList.slice(0, 6).map((occ, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      opacity: occ.isPast ? 0.5 : 1,
                      bgcolor: occ.isCurrent ? "primary.50" : "background.paper",
                      border: occ.isCurrent ? 2 : 1,
                      borderColor: occ.isCurrent ? "primary.main" : "divider",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <EventIcon fontSize="small" color={occ.isCurrent ? "primary" : "action"} />
                      <Typography
                        variant="body2"
                        fontWeight={occ.isCurrent ? 600 : 400}
                      >
                        {occ.month} {occ.year}
                      </Typography>
                      {occ.isCurrent && (
                        <Chip label="Current" size="small" color="primary" />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={isIncome ? "success.main" : "error.main"}
                    >
                      {formatCurrency(t.amount)}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Grid container spacing={1}>
                {occurrencesList.map((occ, idx) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={idx}>
                    <Paper
                      sx={{
                        p: 1.5,
                        textAlign: "center",
                        opacity: occ.isPast ? 0.5 : 1,
                        bgcolor: occ.isCurrent ? "primary.50" : "background.paper",
                        border: occ.isCurrent ? 2 : 1,
                        borderColor: occ.isCurrent ? "primary.main" : "divider",
                        textDecoration: occ.isPast ? "line-through" : "none",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={occ.isCurrent ? 700 : 500}
                        color={occ.isCurrent ? "primary.main" : "text.primary"}
                      >
                        {occ.month}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {occ.year}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Annual Impact */}
            <Paper sx={{ p: 2, mt: 2, bgcolor: "background.paper" }}>
              <Typography variant="subtitle2" gutterBottom>
                Annual Impact
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {t.frequency === "monthly" ? "12 months × " : "1 year × "}{formatCurrency(t.amount)}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={isIncome ? "success.main" : "error.main"}
                >
                  {isIncome ? "+" : "-"}{formatCurrency(t.amount * (t.frequency === "monthly" ? 12 : 1))}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Collapse>
      </Card>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Recurring Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your recurring income and expenses
          </Typography>
        </Box>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
          >
            New Recurring
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
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
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
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

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
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
                  Monthly
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                fontWeight="bold"
                color={stats.monthlyBalance >= 0 ? "success.main" : "error.main"}
              >
                {formatCurrency(stats.monthlyBalance)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 1 }}>
                <Typography variant="caption" color="success.main">
                  +{formatCurrency(stats.monthlyIncome)}
                </Typography>
                <Typography variant="caption" color="error.main">
                  -{formatCurrency(stats.monthlyExpense)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
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
                  Yearly
                </Typography>
              </Box>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                fontWeight="bold"
                color={stats.annualizedBalance >= 0 ? "success.main" : "error.main"}
              >
                {formatCurrency(stats.annualizedBalance)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 1 }}>
                <Typography variant="caption" color="success.main">
                  +{formatCurrency(stats.annualizedIncome)}
                </Typography>
                <Typography variant="caption" color="error.main">
                  -{formatCurrency(stats.annualizedExpense)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
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
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                {formatCurrency(stats.annualizedBalance)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 1 }}>
                Monthly × 12 + Yearly
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          gap: 2,
          alignItems: isMobile ? "stretch" : "center",
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

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
        </Box>
      </Paper>

      {/* Recurring Items */}
      {recurringTransactions.length === 0 ? (
        <Alert severity="info" icon={<RepeatIcon />}>
          No recurring transactions found. Create a transaction and mark it as
          recurring to see it here.
        </Alert>
      ) : (
        <Box>
          {recurringTransactions.map((t) => renderRecurringCard(t))}
        </Box>
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

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={onNewTransaction}
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
    </Box>
  );
};

export default RecurringView;
