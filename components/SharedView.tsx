import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
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
  Button,
  Fab,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Avatar,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  AccountBalance as BalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

interface SharedViewProps {
  transactions: Transaction[];
  friends: string[];
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
}

type PaymentStatus = "all" | "pending" | "paid";

interface FriendBalance {
  name: string;
  totalOwed: number; // Quanto o amigo deve (despesas compartilhadas)
  totalPaid: number; // Quanto já foi pago/recebido
  pendingAmount: number; // Quanto ainda está pendente
  transactionCount: number;
  expenses: Transaction[]; // Despesas compartilhadas com esse amigo
  incomes: Transaction[]; // Reembolsos recebidos desse amigo
}

const SharedView: React.FC<SharedViewProps> = ({
  transactions,
  friends,
  onNewTransaction,
  onEdit,
  onDelete,
  onTogglePaid,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus>("all");
  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });

  // Filtra transações compartilhadas
  const sharedTransactions = useMemo(() => {
    return transactions.filter((t) => t.isShared && t.sharedWith);
  }, [transactions]);

  // Calcula o balanço por amigo
  const friendBalances = useMemo(() => {
    const balances: Map<string, FriendBalance> = new Map();

    sharedTransactions.forEach((t) => {
      if (!t.sharedWith) return;

      const friendName = t.sharedWith;

      if (!balances.has(friendName)) {
        balances.set(friendName, {
          name: friendName,
          totalOwed: 0,
          totalPaid: 0,
          pendingAmount: 0,
          transactionCount: 0,
          expenses: [],
          incomes: [],
        });
      }

      const balance = balances.get(friendName)!;

      if (t.type === "expense") {
        // Metade do gasto é o que o amigo deve
        const friendShare = t.amount / 2;
        balance.totalOwed += friendShare;
        balance.expenses.push(t);
        balance.transactionCount++;

        // Se a transação relacionada (income do reembolso) está paga
        const relatedIncome = transactions.find(
          (inc) => inc.id === t.relatedTransactionId
        );
        if (relatedIncome?.isPaid) {
          balance.totalPaid += friendShare;
        } else {
          balance.pendingAmount += friendShare;
        }
      }
    });

    return Array.from(balances.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [sharedTransactions, transactions]);

  // Combina amigos cadastrados com amigos de transações
  const allFriends = useMemo(() => {
    const friendsFromTransactions = friendBalances.map((f) => f.name);
    const allNames = new Set([...friends, ...friendsFromTransactions]);
    return Array.from(allNames).sort((a, b) => a.localeCompare(b));
  }, [friends, friendBalances]);

  // Helper para obter balanço de um amigo (pode não existir se não tem transações)
  const getFriendBalance = (friendName: string): FriendBalance | null => {
    return friendBalances.find((f) => f.name === friendName) || null;
  };

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    return sharedTransactions
      .filter((t) => {
        // Filtra por amigo
        if (selectedFriend !== "all" && t.sharedWith !== selectedFriend) {
          return false;
        }

        // Filtra por busca
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.sharedWith &&
            t.sharedWith.toLowerCase().includes(searchTerm.toLowerCase()));

        // Filtra por status de pagamento
        const relatedIncome = transactions.find(
          (inc) => inc.id === t.relatedTransactionId
        );
        const isPaid = relatedIncome?.isPaid ?? false;

        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "paid" && isPaid) ||
          (filterStatus === "pending" && !isPaid);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    sharedTransactions,
    selectedFriend,
    searchTerm,
    filterStatus,
    transactions,
  ]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalOwed = friendBalances.reduce((sum, f) => sum + f.totalOwed, 0);
    const totalPaid = friendBalances.reduce((sum, f) => sum + f.totalPaid, 0);
    const totalPending = friendBalances.reduce(
      (sum, f) => sum + f.pendingAmount,
      0
    );
    const friendCount = friendBalances.length;

    return {
      totalOwed,
      totalPaid,
      totalPending,
      friendCount,
    };
  }, [friendBalances]);

  // Estatísticas do amigo selecionado
  const selectedFriendStats = useMemo(() => {
    if (selectedFriend === "all") return null;
    const balance = friendBalances.find((f) => f.name === selectedFriend);
    // Se o amigo está cadastrado mas não tem transações, retorna um balanço vazio
    if (!balance && allFriends.includes(selectedFriend)) {
      return {
        name: selectedFriend,
        totalOwed: 0,
        totalPaid: 0,
        pendingAmount: 0,
        transactionCount: 0,
        expenses: [],
        incomes: [],
      } as FriendBalance;
    }
    return balance;
  }, [selectedFriend, friendBalances, allFriends]);

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#84cc16",
      "#22c55e",
      "#14b8a6",
      "#06b6d4",
      "#0ea5e9",
      "#3b82f6",
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#d946ef",
      "#ec4899",
      "#f43f5e",
    ];
    const index =
      name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  const isTransactionPaid = (transaction: Transaction) => {
    const relatedIncome = transactions.find(
      (inc) => inc.id === transaction.relatedTransactionId
    );
    return relatedIncome?.isPaid ?? false;
  };

  const handleToggleTransactionPaid = (transaction: Transaction) => {
    if (transaction.relatedTransactionId) {
      const relatedIncome = transactions.find(
        (inc) => inc.id === transaction.relatedTransactionId
      );
      if (relatedIncome) {
        onTogglePaid(relatedIncome.id, !relatedIncome.isPaid);
      }
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}>
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Shared Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track expenses shared with friends
          </Typography>
        </Box>

        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
          >
            New Shared Expense
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.3),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <PeopleIcon fontSize="small" color="primary" />
              <Typography variant="overline" color="primary.main">
                Friends
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" color="primary.dark">
              {stats.friendCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: 1,
              borderColor: alpha(theme.palette.info.main, 0.3),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <BalanceIcon fontSize="small" color="info" />
              <Typography variant="overline" color="info.main">
                Total Owed
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="info.dark">
              {formatCurrency(stats.totalOwed)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              border: 1,
              borderColor: alpha(theme.palette.success.main, 0.3),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <TrendingUpIcon fontSize="small" color="success" />
              <Typography variant="overline" color="success.main">
                Received
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="success.dark">
              {formatCurrency(stats.totalPaid)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              border: 1,
              borderColor: alpha(theme.palette.warning.main, 0.3),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <ScheduleIcon fontSize="small" color="warning" />
              <Typography variant="overline" color="warning.main">
                Pending
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="warning.dark">
              {formatCurrency(stats.totalPending)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Friend Balance Cards */}
      {friendBalances.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Balance by Friend
          </Typography>
          <Grid container spacing={2}>
            {friendBalances.map((friend) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={friend.name}>
                <Card
                  sx={{
                    cursor: "pointer",
                    border: 2,
                    borderColor:
                      selectedFriend === friend.name
                        ? "primary.main"
                        : "divider",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "primary.light",
                      transform: "translateY(-2px)",
                      boxShadow: 3,
                    },
                  }}
                  onClick={() =>
                    setSelectedFriend(
                      selectedFriend === friend.name ? "all" : friend.name
                    )
                  }
                >
                  <CardContent>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(friend.name),
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getInitials(friend.name)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {friend.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {friend.transactionCount} shared expense
                          {friend.transactionCount !== 1 ? "s" : ""}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Owed:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="info.main">
                        {formatCurrency(friend.totalOwed)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Received:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        {formatCurrency(friend.totalPaid)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">
                        Pending:
                      </Typography>
                      <Chip
                        size="small"
                        icon={
                          friend.pendingAmount > 0 ? (
                            <ScheduleIcon />
                          ) : (
                            <CheckCircleIcon />
                          )
                        }
                        label={formatCurrency(friend.pendingAmount)}
                        color={friend.pendingAmount > 0 ? "warning" : "success"}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          alignItems: isMobile ? "stretch" : "center",
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

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Friend</InputLabel>
            <Select
              value={selectedFriend}
              label="Friend"
              onChange={(e: SelectChangeEvent) =>
                setSelectedFriend(e.target.value)
              }
            >
              <MenuItem value="all">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleIcon fontSize="small" />
                  All Friends
                </Box>
              </MenuItem>
              {allFriends.map((friendName) => {
                const balance = getFriendBalance(friendName);
                return (
                  <MenuItem key={friendName} value={friendName}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          bgcolor: getAvatarColor(friendName),
                        }}
                      >
                        {getInitials(friendName)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>{friendName}</Box>
                      {balance && balance.transactionCount > 0 && (
                        <Chip
                          size="small"
                          label={balance.transactionCount}
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e: SelectChangeEvent) =>
                setFilterStatus(e.target.value as PaymentStatus)
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ScheduleIcon fontSize="small" color="warning" />
                  Pending
                </Box>
              </MenuItem>
              <MenuItem value="paid">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                  Received
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Selected Friend Stats */}
      {selectedFriendStats && (
        <Paper
          sx={{
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: 1,
            borderColor: "primary.light",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: getAvatarColor(selectedFriendStats.name),
                width: 56,
                height: 56,
              }}
            >
              {getInitials(selectedFriendStats.name)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {selectedFriendStats.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedFriendStats.transactionCount} shared expense
                {selectedFriendStats.transactionCount !== 1 ? "s" : ""} •
                Pending:{" "}
                <Typography
                  component="span"
                  fontWeight={600}
                  color={
                    selectedFriendStats.pendingAmount > 0
                      ? "warning.main"
                      : "success.main"
                  }
                >
                  {formatCurrency(selectedFriendStats.pendingAmount)}
                </Typography>
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedFriend("all")}
            >
              Clear Filter
            </Button>
          </Box>
        </Paper>
      )}

      {/* Transactions Table/List */}
      {filteredTransactions.length > 0 ? (
        <Paper sx={{ overflow: "hidden" }}>
          {isMobile ? (
            // Mobile: Cards
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredTransactions.map((t) => {
                const isPaid = isTransactionPaid(t);
                const friendShare = t.amount / 2;

                return (
                  <Paper
                    key={t.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: "divider",
                      borderLeft: 4,
                      borderLeftColor: isPaid ? "success.main" : "warning.main",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <Checkbox
                        checked={isPaid}
                        onChange={() => handleToggleTransactionPaid(t)}
                        size="small"
                        color="success"
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          sx={{
                            textDecoration: isPaid ? "line-through" : "none",
                            opacity: isPaid ? 0.7 : 1,
                          }}
                        >
                          {t.description}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 20,
                              height: 20,
                              fontSize: "0.625rem",
                              bgcolor: getAvatarColor(t.sharedWith || ""),
                            }}
                          >
                            {getInitials(t.sharedWith || "")}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {t.sharedWith} • {formatDate(t.date)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                          <Chip label={t.category} size="small" variant="outlined" />
                          <Chip
                            icon={isPaid ? <CheckCircleIcon /> : <ScheduleIcon />}
                            label={isPaid ? "Received" : "Pending"}
                            size="small"
                            color={isPaid ? "success" : "warning"}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Total: {formatCurrency(t.amount)}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="warning.main"
                        >
                          Owes: {formatCurrency(friendShare)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileActionAnchor({ element: e.currentTarget, transaction: t });
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            // Desktop: Table
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 50 }}>Paid</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Friend</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Friend Owes</TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ width: 100 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((t) => {
                  const isPaid = isTransactionPaid(t);
                  const friendShare = t.amount / 2;

                  return (
                    <TableRow
                      key={t.id}
                      sx={{
                        opacity: isPaid ? 0.6 : 1,
                        bgcolor: isPaid ? "action.disabledBackground" : "transparent",
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isPaid}
                          onChange={() => handleToggleTransactionPaid(t)}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            textDecoration: isPaid ? "line-through" : "none",
                          }}
                        >
                          {t.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: "0.75rem",
                              bgcolor: getAvatarColor(t.sharedWith || ""),
                            }}
                          >
                            {getInitials(t.sharedWith || "")}
                          </Avatar>
                          <Typography variant="body2">{t.sharedWith}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={t.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontFamily: "monospace", fontWeight: 600 }}
                      >
                        <Typography color="warning.main" fontWeight={600}>
                          {formatCurrency(friendShare)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={isPaid ? <CheckCircleIcon /> : <ScheduleIcon />}
                          label={isPaid ? "Received" : "Pending"}
                          size="small"
                          color={isPaid ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell align="center">
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
                })}
              </TableBody>
            </Table>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <PeopleIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography color="text.secondary" fontStyle="italic">
            {sharedTransactions.length === 0
              ? "No shared expenses yet. Create a shared expense to track balances with friends!"
              : "No shared expenses found with the current filters."}
          </Typography>
          {sharedTransactions.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewTransaction}
              sx={{ mt: 2 }}
            >
              Create Shared Expense
            </Button>
          )}
        </Paper>
      )}

      {/* Mobile Action Menu */}
      <Menu
        anchorEl={mobileActionAnchor.element}
        open={Boolean(mobileActionAnchor.element)}
        onClose={() => setMobileActionAnchor({ element: null, transaction: null })}
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

export default SharedView;

