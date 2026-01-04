import React, { useState, useMemo, useContext } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  alpha,
  useTheme,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Card,
  CardContent,
  Checkbox,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  RadioButtonUnchecked as UnpaidIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import TransactionTags from "./TransactionTags";
import SearchBar from "./SearchBar";
import {
  getTableContainerSx,
  getHeaderCellSx,
  getRowSx,
  getMobileCardSx,
} from "../utils/tableStyles";
import { Transaction } from "../types";
import { MONTHS } from "../constants";
import { ColorsContext } from "../App";
import DateFilter from "./DateFilter";

interface PaymentMethodDetailViewProps {
  paymentMethod: string;
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (month: number, year: number) => void;
  onBack: () => void;
  onPayAll?: (paymentMethod: string, month: number, year: number) => void;
  onTogglePaid?: (id: string, isPaid: boolean) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

const PaymentMethodDetailView: React.FC<PaymentMethodDetailViewProps> = ({
  paymentMethod,
  transactions,
  selectedMonth,
  selectedYear,
  onDateChange,
  onBack,
  onPayAll,
  onTogglePaid,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { getPaymentMethodColor } = useContext(ColorsContext);
  const colors = getPaymentMethodColor(paymentMethod);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<"all" | "paid" | "unpaid">("all");
  
  // Estado para menu de ações mobile
  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Gera transações recorrentes virtuais para este método de pagamento (apenas não-parceladas)
  const generateRecurringForMethod = (): Transaction[] => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = selectedMonth + 1; // 1-12
    const targetYear = selectedYear;

    transactions.forEach((t) => {
      if (!t.isRecurring || !t.frequency || t.paymentMethod !== paymentMethod) return;
      if (t.installments && t.installments > 1) return;

      const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
      const targetDate = new Date(targetYear, targetMonth - 1, 1);

      if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

      const isOriginalMonth = origYear === targetYear && origMonth === targetMonth;
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

        // Verifica se esta data está no excluded_dates da transação original
        const excludedDates = t.excludedDates || [];
        if (excludedDates.includes(virtualDate)) {
          return; // Não gera a transação virtual para esta data
        }

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
        const matchesPaid =
          filterPaid === "all" ||
          (filterPaid === "paid" && t.isPaid) ||
          (filterPaid === "unpaid" && !t.isPaid);
        return matchesSearch && matchesType && matchesCategory && matchesPaid;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, selectedYear, paymentMethod, searchTerm, filterType, filterCategory, filterPaid]);

  // Calcula transações não pagas (todas, incluindo receitas e virtuais)
  const unpaidTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => !t.isPaid);
  }, [filteredTransactions]);

  // Apenas despesas não pagas (para o valor a pagar)
  const unpaidExpenses = useMemo(() => {
    return unpaidTransactions.filter((t) => t.type === "expense");
  }, [unpaidTransactions]);

  const unpaidCount = unpaidTransactions.length;
  const unpaidExpenseAmount = unpaidExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);

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

  const handlePayAll = () => {
    if (onPayAll) {
      onPayAll(paymentMethod, selectedMonth, selectedYear);
    }
  };

  const handleTogglePaid = (tx: Transaction) => {
    if (onTogglePaid) {
      onTogglePaid(tx.id, !tx.isPaid);
    }
  };

  const handleEdit = (tx: Transaction) => {
    if (onEdit) {
      // Passa a transação diretamente para o handler
      // O App.tsx vai tratar se é virtual/recorrente/parcelada e mostrar o dialog de opções
      onEdit(tx);
    }
  };

  const handleDelete = (tx: Transaction) => {
    if (onDelete && !tx.isVirtual) {
      onDelete(tx.id);
    }
  };

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
                  borderRadius: "20px",
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  display: "flex",
                }}
              >
                <CreditCardIcon sx={{ color: "#fff" }} />
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

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DateFilter
            month={selectedMonth}
            year={selectedYear}
            onDateChange={onDateChange}
            showIcon
          />
        </Box>
      </Box>

      {/* Pay All Banner */}
      {unpaidCount > 0 && onPayAll && (
        <Paper
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha("#f59e0b", 0.15)} 0%, ${alpha("#f59e0b", 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha("#f59e0b", 0.1)} 0%, ${alpha("#f59e0b", 0.02)} 100%)`,
            border: `1px solid ${alpha("#f59e0b", 0.3)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: "20px",
                bgcolor: alpha("#f59e0b", 0.15),
              }}
            >
              <WarningIcon sx={{ color: "#f59e0b" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {unpaidCount === 1 ? "1 transação não paga" : `${unpaidCount} transações não pagas`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total a pagar: <strong style={{ color: "#f59e0b" }}>{formatCurrency(unpaidExpenseAmount)}</strong>
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={handlePayAll}
            sx={{
              textTransform: "none",
              borderRadius: "20px",
              px: 3,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              "&:hover": {
                background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
              },
            }}
          >
            Pagar Fatura Completa
          </Button>
        </Paper>
      )}

      {/* All Paid Banner */}
      {unpaidCount === 0 && filteredTransactions.length > 0 && (
        <Paper
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha("#10b981", 0.15)} 0%, ${alpha("#10b981", 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha("#10b981", 0.1)} 0%, ${alpha("#10b981", 0.02)} 100%)`,
            border: `1px solid ${alpha("#10b981", 0.3)}`,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: "20px",
              bgcolor: alpha("#10b981", 0.15),
            }}
          >
            <CheckCircleIcon sx={{ color: "#10b981" }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={600} color="#10b981">
            Todas as transações deste mês estão pagas!
          </Typography>
        </Paper>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: balance >= 0 ? alpha("#10b981", 0.08) : alpha("#ef4444", 0.08),
              border: `1px solid ${balance >= 0 ? alpha("#10b981", 0.2) : alpha("#ef4444", 0.2)}`,
            }}
          >
            <Typography
              variant="overline"
              color={balance >= 0 ? "#10b981" : "#ef4444"}
            >
              Current Balance
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              color={balance >= 0 ? "#10b981" : "#ef4444"}
            >
              {formatCurrency(balance)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha("#10b981", 0.08),
              border: `1px solid ${alpha("#10b981", 0.2)}`,
            }}
          >
            <Typography variant="overline" color="#10b981">
              Income
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#10b981">
              {formatCurrency(totalIncome)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha("#ef4444", 0.08),
              border: `1px solid ${alpha("#ef4444", 0.2)}`,
            }}
          >
            <Typography variant="overline" color="#ef4444">
              Expenses
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#ef4444">
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
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search..."
          minWidth={150}
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

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterPaid}
            label="Status"
            onChange={(e: SelectChangeEvent) =>
              setFilterPaid(e.target.value as "all" | "paid" | "unpaid")
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="unpaid">Unpaid</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Transactions - Mobile Cards or Desktop Table */}
      {isMobile ? (
        // Mobile Card View
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => {
              const isIncome = t.type === "income";
              const accentColor = isIncome ? "#10b981" : "#ef4444";
              return (
                <Card
                  key={t.id}
                  elevation={0}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    opacity: t.isPaid !== false ? 0.6 : 1,
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                      : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.05)}`,
                    borderLeft: `3px solid ${accentColor}`,
                    borderRadius: "14px",
                    transition: "all 0.15s ease-in-out",
                  }}
                >
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, display: "flex", alignItems: "flex-start", gap: 1 }}>
                    {/* Checkbox */}
                    <Checkbox
                      checked={t.isPaid !== false}
                      onChange={(e) => handleTogglePaid({ ...t, isPaid: e.target.checked } as Transaction)}
                      size="small"
                      color={isIncome ? "success" : "error"}
                      sx={{ mt: -0.5, ml: -1 }}
                    />
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: isDarkMode
                          ? `linear-gradient(135deg, ${alpha(accentColor, 0.2)} 0%, ${alpha(accentColor, 0.1)} 100%)`
                          : `linear-gradient(135deg, ${isIncome ? "#D1FAE5" : "#FEE2E2"} 0%, ${alpha(isIncome ? "#D1FAE5" : "#FEE2E2", 0.6)} 100%)`,
                        border: `1px solid ${isDarkMode ? alpha(accentColor, 0.2) : alpha(accentColor, 0.15)}`,
                      }}
                    >
                      {isIncome ? (
                        <ArrowUpIcon sx={{ fontSize: 16, color: accentColor }} />
                      ) : (
                        <ArrowDownIcon sx={{ fontSize: 16, color: accentColor }} />
                      )}
                    </Box>
                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.description}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color={isIncome ? "success.main" : "error.main"} sx={{ flexShrink: 0 }}>
                          {isIncome ? "+" : "-"} {formatCurrency(t.amount || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary">{formatDate(t.date)}</Typography>
                        <Typography variant="caption" color="text.disabled">•</Typography>
                        <Typography variant="caption" color="text.secondary">{t.category}</Typography>
                      </Box>
                      <TransactionTags transaction={t} />
                    </Box>
                    {/* Actions */}
                    {(onEdit || onDelete) && (
                      <IconButton
                        size="small"
                        onClick={(e) => setMobileActionAnchor({ element: e.currentTarget, transaction: t })}
                        sx={{ color: "text.secondary", mt: -0.5, mr: -1 }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: "16px" }}>
              <Typography color="text.secondary" fontStyle="italic">
                No transactions with {paymentMethod} for this period.
              </Typography>
            </Card>
          )}
          {/* Total Summary for Mobile */}
          {filteredTransactions.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: alpha(colors.primary, 0.05), border: `1px solid ${alpha(colors.primary, 0.15)}` }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" fontWeight={600}>
                  Total ({filteredTransactions.length} transactions)
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  color={balance >= 0 ? "#10b981" : "#ef4444"}
                  sx={{ fontFamily: "monospace" }}
                >
                  {formatCurrency(balance)}
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      ) : (
        // Desktop Table View
        <TableContainer component={Paper} sx={getTableContainerSx(theme, isDarkMode)}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Date</TableCell>
                <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Description</TableCell>
                <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Category</TableCell>
                <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>
                  Type
                </TableCell>
                <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center" }}>
                  Status
                </TableCell>
                <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "right" }}>
                  Amount
                </TableCell>
                {(onEdit || onDelete) && (
                  <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center", width: 100 }}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, index) => (
                <TableRow
                  key={t.id}
                  sx={{
                    ...getRowSx(theme, isDarkMode, index),
                    opacity: t.isPaid ? 0.7 : 1,
                  }}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {formatDate(t.date)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          textDecoration: t.isPaid ? "line-through" : "none",
                          color: t.isPaid ? "text.secondary" : "text.primary",
                        }}
                      >
                        {t.description}
                      </Typography>
                      {/* Tags - Componente padronizado em formato pílula */}
                      <TransactionTags transaction={t} showShared={false} />
                    </Box>
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
                  <TableCell sx={{ textAlign: "center" }}>
                    <Tooltip title={t.isPaid ? "Marcar como não pago" : "Marcar como pago"}>
                      <IconButton
                        size="small"
                        onClick={() => handleTogglePaid(t)}
                        sx={{
                          color: t.isPaid ? "#10b981" : "text.disabled",
                          "&:hover": {
                            bgcolor: t.isPaid
                              ? alpha("#ef4444", 0.1)
                              : alpha("#10b981", 0.1),
                          },
                        }}
                      >
                        {t.isPaid ? (
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
                      color: t.type === "income" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {t.type === "expense" && "- "}
                    {formatCurrency(t.amount || 0)}
                  </TableCell>
                  {(onEdit || onDelete) && (
                    <TableCell sx={{ textAlign: "center" }}>
                      {isMobile ? (
                        <IconButton
                          size="small"
                          onClick={(e) =>
                            setMobileActionAnchor({
                              element: e.currentTarget,
                              transaction: t,
                            })
                          }
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                          {onEdit && (
                            <Tooltip title={
                              t.isVirtual 
                                ? "Editar recorrência" 
                                : t.isRecurring 
                                  ? "Editar transação recorrente"
                                  : t.installments && t.installments > 1
                                    ? "Editar parcelas"
                                    : "Editar"
                            }>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(t)}
                                sx={{
                                  color: colors.primary,
                                  "&:hover": {
                                    bgcolor: alpha(colors.primary, 0.1),
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onDelete && !t.isVirtual && (
                            <Tooltip title="Excluir">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(t)}
                                sx={{
                                  color: "#ef4444",
                                  "&:hover": {
                                    bgcolor: alpha("#ef4444", 0.1),
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={onEdit || onDelete ? 7 : 6} sx={{ textAlign: "center", py: 6 }}>
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
                  colSpan={5}
                  sx={{ textAlign: "right", fontWeight: 600 }}
                >
                  Total ({filteredTransactions.length} transactions):
                </TableCell>
                <TableCell
                  sx={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: balance >= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  {formatCurrency(balance)}
                </TableCell>
                {(onEdit || onDelete) && <TableCell />}
              </TableRow>
            </TableFooter>
          )}
          </Table>
        </TableContainer>
      )}

      {/* Mobile Action Menu */}
      <Menu
        anchorEl={mobileActionAnchor.element}
        open={Boolean(mobileActionAnchor.element)}
        onClose={() => setMobileActionAnchor({ element: null, transaction: null })}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            minWidth: 160,
          },
        }}
      >
        {onEdit && (
          <MenuItem
            onClick={() => {
              if (mobileActionAnchor.transaction) {
                handleEdit(mobileActionAnchor.transaction);
              }
              setMobileActionAnchor({ element: null, transaction: null });
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: colors.primary }} />
            </ListItemIcon>
            <ListItemText>
              {mobileActionAnchor.transaction?.isVirtual 
                ? "Editar Recorrência" 
                : mobileActionAnchor.transaction?.isRecurring 
                  ? "Editar Recorrente"
                  : mobileActionAnchor.transaction?.installments && mobileActionAnchor.transaction.installments > 1
                    ? "Editar Parcelas"
                    : "Editar"}
            </ListItemText>
          </MenuItem>
        )}
        {onDelete && !mobileActionAnchor.transaction?.isVirtual && (
          <MenuItem
            onClick={() => {
              if (mobileActionAnchor.transaction) {
                handleDelete(mobileActionAnchor.transaction);
              }
              setMobileActionAnchor({ element: null, transaction: null });
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default PaymentMethodDetailView;
