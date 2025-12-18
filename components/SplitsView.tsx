import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Checkbox,
  Tooltip,
  LinearProgress,
  Button,
  Fab,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CreditCard as CreditCardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

interface SplitsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
}

type SplitStatus = "all" | "in_progress" | "completed";

const SplitsView: React.FC<SplitsViewProps> = ({
  transactions,
  onNewTransaction,
  onEdit,
  onDelete,
  onTogglePaid,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<SplitStatus>("in_progress");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Filtra apenas transações com parcelas
  const splitsTransactions = useMemo(() => {
    return transactions.filter((t) => t.installments && t.installments > 1);
  }, [transactions]);

  // Agrupa transações por descrição + método de pagamento + categoria (mesma compra parcelada)
  const groupedSplits = useMemo(() => {
    const groups: Map<
      string,
      {
        description: string;
        category: string;
        paymentMethod: string;
        type: "income" | "expense";
        totalInstallments: number;
        totalAmount: number;
        installments: Transaction[];
      }
    > = new Map();

    splitsTransactions.forEach((t) => {
      // Cria uma chave única para agrupar parcelas da mesma compra
      const key = `${t.description}-${t.paymentMethod}-${t.category}-${t.type}-${t.installments}`;

      if (!groups.has(key)) {
        groups.set(key, {
          description: t.description,
          category: t.category,
          paymentMethod: t.paymentMethod,
          type: t.type,
          totalInstallments: t.installments!,
          totalAmount: 0,
          installments: [],
        });
      }

      const group = groups.get(key)!;
      group.installments.push(t);
      group.totalAmount += t.amount;
    });

    // Ordena as parcelas de cada grupo por data
    groups.forEach((group) => {
      group.installments.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    return Array.from(groups.values());
  }, [splitsTransactions]);

  // Filtra as transações
  const filteredData = useMemo(() => {
    return splitsTransactions
      .filter((t) => {
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || t.type === filterType;

        // Verifica status: em andamento ou concluído
        const isInProgress =
          (t.currentInstallment || 1) < (t.installments || 1);
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "in_progress" && isInProgress) ||
          (filterStatus === "completed" && !isInProgress);

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [splitsTransactions, searchTerm, filterType, filterStatus]);

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

  const formatDateShort = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}`;
  };

  // Estatísticas
  const stats = useMemo(() => {
    const inProgress = splitsTransactions.filter(
      (t) => (t.currentInstallment || 1) < (t.installments || 1)
    );
    const completed = splitsTransactions.filter(
      (t) => (t.currentInstallment || 1) >= (t.installments || 1)
    );

    const totalInProgress = inProgress.reduce(
      (sum, t) => sum + t.amount * ((t.installments || 1) - (t.currentInstallment || 1)),
      0
    );

    const totalPaid = splitsTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      inProgressCount: new Set(inProgress.map((t) => `${t.description}-${t.installments}`)).size,
      completedCount: new Set(completed.map((t) => `${t.description}-${t.installments}`)).size,
      totalRemaining: totalInProgress,
      totalPaid,
    };
  }, [splitsTransactions]);

  const totalFiltered = filteredData.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Installments (Splits)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your installment purchases
          </Typography>
        </Box>

        {/* Desktop New Installment Button */}
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
          >
            New Installment
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "warning.50",
              border: 1,
              borderColor: "warning.light",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <ScheduleIcon fontSize="small" color="warning" />
              <Typography variant="overline" color="warning.main">
                In Progress
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" color="warning.dark">
              {stats.inProgressCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "success.50",
              border: 1,
              borderColor: "success.light",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <CheckCircleIcon fontSize="small" color="success" />
              <Typography variant="overline" color="success.main">
                Completed
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" color="success.dark">
              {stats.completedCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "error.50",
              border: 1,
              borderColor: "error.light",
            }}
          >
            <Typography variant="overline" color="error.main">
              Remaining
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="error.dark">
              {formatCurrency(stats.totalRemaining)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "primary.50",
              border: 1,
              borderColor: "primary.light",
            }}
          >
            <Typography variant="overline" color="primary.main">
              Total Paid
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary.dark">
              {formatCurrency(stats.totalPaid)}
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

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e: SelectChangeEvent) =>
              setFilterStatus(e.target.value as SplitStatus)
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="in_progress">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleIcon fontSize="small" color="warning" />
                In Progress
              </Box>
            </MenuItem>
            <MenuItem value="completed">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleIcon fontSize="small" color="success" />
                Completed
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

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
      </Paper>

      {/* Mobile Card View */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {filteredData.length > 0 ? (
            <>
              {filteredData.map((t) => {
                const isIncome = t.type === "income";
                const isInProgress =
                  (t.currentInstallment || 1) < (t.installments || 1);
                const progress =
                  ((t.currentInstallment || 1) / (t.installments || 1)) * 100;

                return (
                  <Paper
                    key={t.id}
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      opacity: t.isPaid === false ? 0.6 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={t.isPaid !== false}
                      onChange={(e) => onTogglePaid(t.id, e.target.checked)}
                      size="small"
                      color="success"
                      sx={{ mt: -0.5, ml: -1 }}
                    />

                    {/* Icon */}
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: isIncome ? "success.light" : "warning.light",
                        color: isIncome ? "success.dark" : "warning.dark",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CreditCardIcon fontSize="small" />
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.description}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={isIncome ? "success.main" : "error.main"}
                          sx={{ flexShrink: 0 }}
                        >
                          {isIncome ? "+" : "-"} {formatCurrency(t.amount)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {formatDateShort(t.date)}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.category}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.paymentMethod}
                        </Typography>
                      </Box>

                      {/* Progress */}
                      <Box sx={{ mt: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Chip
                            icon={<CreditCardIcon sx={{ fontSize: 12 }} />}
                            label={`${t.currentInstallment || 1}/${t.installments}x`}
                            size="small"
                            color={isInProgress ? "warning" : "success"}
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              "& .MuiChip-icon": { ml: 0.5 },
                            }}
                          />
                          <Chip
                            icon={
                              isInProgress ? (
                                <ScheduleIcon sx={{ fontSize: 12 }} />
                              ) : (
                                <CheckCircleIcon sx={{ fontSize: 12 }} />
                              )
                            }
                            label={isInProgress ? "In Progress" : "Completed"}
                            size="small"
                            color={isInProgress ? "warning" : "success"}
                            sx={{
                              height: 20,
                              fontSize: 10,
                              "& .MuiChip-icon": { ml: 0.5 },
                            }}
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          color={isInProgress ? "warning" : "success"}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Box>

                    {/* Actions */}
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
                  </Paper>
                );
              })}

              {/* Summary Footer */}
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "action.hover",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Total ({filteredData.length} installments)
                </Typography>
                <Typography variant="body1" fontWeight={700} color="primary.main">
                  {formatCurrency(totalFiltered)}
                </Typography>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <CreditCardIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
              />
              <Typography color="text.secondary" fontStyle="italic">
                No installment purchases found.
              </Typography>
            </Paper>
          )}

          {/* Mobile Action Menu */}
          <Menu
            anchorEl={mobileActionAnchor.element}
            open={Boolean(mobileActionAnchor.element)}
            onClose={() =>
              setMobileActionAnchor({ element: null, transaction: null })
            }
          >
            <MenuItem
              onClick={() => {
                if (mobileActionAnchor.transaction) {
                  onEdit(mobileActionAnchor.transaction);
                }
                setMobileActionAnchor({ element: null, transaction: null });
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (mobileActionAnchor.transaction) {
                  onDelete(mobileActionAnchor.transaction.id);
                }
                setMobileActionAnchor({ element: null, transaction: null });
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>

          {/* Mobile FAB */}
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
        </Box>
      ) : (
        /* Desktop Table View */
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell
                  sx={{ fontWeight: 600, width: 50, textAlign: "center" }}
                >
                  Paid
                </TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>
                  Method
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, width: 100, textAlign: "center" }}
                >
                  Installment
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, width: 120, textAlign: "center" }}
                >
                  Progress
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, width: 80, textAlign: "center" }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, width: 130, textAlign: "right" }}
                >
                  Amount
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, width: 100, textAlign: "center" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((t, index) => {
                  const isInProgress =
                    (t.currentInstallment || 1) < (t.installments || 1);
                  const progress =
                    ((t.currentInstallment || 1) / (t.installments || 1)) * 100;

                  return (
                    <TableRow
                      key={t.id}
                      hover
                      sx={{
                        bgcolor: index % 2 === 0 ? "transparent" : "action.hover",
                        opacity: t.isPaid === false ? 0.6 : 1,
                      }}
                    >
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip
                          title={t.isPaid !== false ? "Paid" : "Not paid"}
                        >
                          <Checkbox
                            checked={t.isPaid !== false}
                            onChange={(e) =>
                              onTogglePaid(t.id, e.target.checked)
                            }
                            size="small"
                            color="success"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {t.type === "income" ? (
                            <ArrowUpIcon fontSize="small" color="success" />
                          ) : (
                            <ArrowDownIcon fontSize="small" color="error" />
                          )}
                          <Typography variant="body2" fontWeight={500}>
                            {t.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.category}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {t.paymentMethod}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Chip
                          icon={<CreditCardIcon />}
                          label={`${t.currentInstallment || 1}/${t.installments}x`}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{
                            height: 24,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={`${Math.round(progress)}%`}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            color={isInProgress ? "warning" : "success"}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Chip
                          icon={
                            isInProgress ? (
                              <ScheduleIcon />
                            ) : (
                              <CheckCircleIcon />
                            )
                          }
                          label={isInProgress ? "In Progress" : "Done"}
                          size="small"
                          color={isInProgress ? "warning" : "success"}
                          sx={{ height: 24, fontSize: 10 }}
                        />
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
                      <TableCell sx={{ textAlign: "center" }}>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(t)}
                          color="primary"
                        >
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
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: "center", py: 6 }}>
                    <CreditCardIcon
                      sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                    />
                    <Typography color="text.secondary" fontStyle="italic">
                      No installment purchases found with the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {filteredData.length > 0 && (
              <TableFooter>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell
                    colSpan={8}
                    sx={{ textAlign: "right", fontWeight: 600 }}
                  >
                    Total ({filteredData.length} installments):
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(totalFiltered)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SplitsView;

