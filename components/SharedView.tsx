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
  totalOwed: number; // Quanto o amigo me deve (eu paguei)
  totalIOwe: number; // Quanto eu devo ao amigo (amigo pagou)
  totalPaid: number; // Quanto já foi pago/recebido (reembolsos recebidos)
  totalIPaid: number; // Quanto eu já paguei (minhas dívidas quitadas)
  pendingAmount: number; // Quanto ainda está pendente (amigo me deve)
  pendingIOwe: number; // Quanto eu ainda devo (minhas dívidas pendentes)
  netBalance: number; // Saldo líquido: positivo = amigo me deve, negativo = eu devo
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

  // Filtra transações vinculadas a amigos (tanto expenses quanto incomes)
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
          totalIOwe: 0,
          totalPaid: 0,
          totalIPaid: 0,
          pendingAmount: 0,
          pendingIOwe: 0,
          netBalance: 0,
          transactionCount: 0,
          expenses: [],
          incomes: [],
        });
      }

      const balance = balances.get(friendName)!;

      const transactionAmount = t.amount || 0;
      balance.transactionCount++;

      if (t.type === "expense") {
        balance.expenses.push(t);

        if (t.iOwe) {
          // EXPENSE + Conta Única: EU devo ao amigo - valor integral (100%)
          balance.totalIOwe += transactionAmount;
          
          // Verifica se eu já paguei (isPaid na própria transação)
          if (t.isPaid) {
            balance.totalIPaid += transactionAmount;
          } else {
            balance.pendingIOwe += transactionAmount;
          }
        } else {
          // EXPENSE + Conta Dividida: Amigo me deve - 50% do valor
          const halfAmount = transactionAmount / 2;
          balance.totalOwed += halfAmount;
          
          // Se a transação relacionada (income do reembolso) está paga
          const relatedIncome = transactions.find(
            (inc) => inc.id === t.relatedTransactionId
          );
          if (relatedIncome?.isPaid) {
            balance.totalPaid += halfAmount;
          } else {
            balance.pendingAmount += halfAmount;
          }
        }
      } else if (t.type === "income") {
        balance.incomes.push(t);
        
        // INCOME vinculada a amigo: Amigo está me pagando
        const paymentAmount = t.iOwe ? transactionAmount : transactionAmount / 2;
        
        if (t.isPaid) {
          // Já recebi o pagamento
          balance.totalPaid += paymentAmount;
        } else {
          // Ainda pendente de receber
          balance.pendingAmount += paymentAmount;
        }
        // Aumenta o que o amigo me deve (será zerado quando marcar como pago)
        balance.totalOwed += paymentAmount;
      }
    });

    // Calcula o saldo líquido para cada amigo
    balances.forEach((balance) => {
      // Positivo = amigo me deve | Negativo = eu devo ao amigo
      balance.netBalance = balance.pendingAmount - balance.pendingIOwe;
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
    const totalIOwe = friendBalances.reduce((sum, f) => sum + f.totalIOwe, 0);
    const totalPaid = friendBalances.reduce((sum, f) => sum + f.totalPaid, 0);
    const totalIPaid = friendBalances.reduce((sum, f) => sum + f.totalIPaid, 0);
    const totalPending = friendBalances.reduce(
      (sum, f) => sum + f.pendingAmount,
      0
    );
    const totalPendingIOwe = friendBalances.reduce(
      (sum, f) => sum + f.pendingIOwe,
      0
    );
    const netBalance = totalPending - totalPendingIOwe; // Positivo = a receber, Negativo = a pagar
    const friendCount = friendBalances.length;

    return {
      totalOwed,
      totalIOwe,
      totalPaid,
      totalIPaid,
      totalPending,
      totalPendingIOwe,
      netBalance,
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
        totalIOwe: 0,
        totalPaid: 0,
        totalIPaid: 0,
        pendingAmount: 0,
        pendingIOwe: 0,
        netBalance: 0,
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
    if (transaction.type === "income") {
      // Para INCOME, o status está na própria transação
      return transaction.isPaid ?? false;
    }
    if (transaction.iOwe) {
      // EXPENSE + Conta Única: status está na própria transação
      return transaction.isPaid ?? false;
    }
    // EXPENSE + Conta Dividida: verifica a income relacionada
    const relatedIncome = transactions.find(
      (inc) => inc.id === transaction.relatedTransactionId
    );
    return relatedIncome?.isPaid ?? false;
  };

  const handleToggleTransactionPaid = (transaction: Transaction) => {
    if (transaction.type === "income") {
      // Para INCOME, atualiza a própria transação
      onTogglePaid(transaction.id, !transaction.isPaid);
    } else if (transaction.iOwe) {
      // EXPENSE + Conta Única: atualiza a própria transação
      onTogglePaid(transaction.id, !transaction.isPaid);
    } else if (transaction.relatedTransactionId) {
      // EXPENSE + Conta Dividida: atualiza a income relacionada
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
            Despesas Compartilhadas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie contas divididas com amigos
          </Typography>
        </Box>

        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
          >
            Nova Despesa Compartilhada
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#059669", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, position: "relative", zIndex: 1 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha("#059669", 0.1), border: `1px solid ${alpha("#059669", 0.2)}` }}>
                <TrendingUpIcon sx={{ fontSize: 14, color: "#059669" }} />
              </Box>
              <Typography variant="overline" sx={{ color: "#059669", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                A Receber
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#059669", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {formatCurrency(stats.totalPending)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ position: "relative", zIndex: 1 }}>
              Amigos me devem
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#DC2626", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, position: "relative", zIndex: 1 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha("#DC2626", 0.1), border: `1px solid ${alpha("#DC2626", 0.2)}` }}>
                <TrendingDownIcon sx={{ fontSize: 14, color: "#DC2626" }} />
              </Box>
              <Typography variant="overline" sx={{ color: "#DC2626", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                A Pagar
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#DC2626", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {formatCurrency(stats.totalPendingIOwe)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ position: "relative", zIndex: 1 }}>
              Eu devo
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha(stats.netBalance >= 0 ? "#059669" : "#DC2626", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: stats.netBalance >= 0
                  ? "linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, position: "relative", zIndex: 1 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(stats.netBalance >= 0 ? "#059669" : "#DC2626", 0.1), border: `1px solid ${alpha(stats.netBalance >= 0 ? "#059669" : "#DC2626", 0.2)}` }}>
                <BalanceIcon sx={{ fontSize: 14, color: stats.netBalance >= 0 ? "#059669" : "#DC2626" }} />
              </Box>
              <Typography variant="overline" sx={{ color: stats.netBalance >= 0 ? "#059669" : "#DC2626", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                Saldo
              </Typography>
            </Box>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: stats.netBalance >= 0 ? "#059669" : "#DC2626", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {stats.netBalance >= 0 ? "+" : ""}{formatCurrency(stats.netBalance)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ position: "relative", zIndex: 1 }}>
              {stats.netBalance >= 0 ? "A seu favor" : "Você deve"}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#6366f1", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, position: "relative", zIndex: 1 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha("#6366f1", 0.1), border: `1px solid ${alpha("#6366f1", 0.2)}` }}>
                <PeopleIcon sx={{ fontSize: 14, color: "#6366f1" }} />
              </Box>
              <Typography variant="overline" sx={{ color: "#6366f1", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                Amigos
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: "text.primary", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {stats.friendCount}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ position: "relative", zIndex: 1 }}>
              Com transações
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Friend Balance Cards */}
      {friendBalances.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Saldo por Amigo
          </Typography>
          <Grid container spacing={2}>
            {friendBalances.map((friend) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={friend.name}>
                <Card
                  elevation={0}
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    background: theme.palette.mode === "dark"
                      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                      : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                    backdropFilter: "blur(16px)",
                    border: selectedFriend === friend.name
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                    borderLeft: `3px solid ${getAvatarColor(friend.name)}`,
                    borderRadius: "16px",
                    boxShadow: theme.palette.mode === "dark"
                      ? `0 6px 24px -6px ${alpha(getAvatarColor(friend.name), 0.2)}`
                      : `0 6px 24px -6px ${alpha(getAvatarColor(friend.name), 0.15)}`,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: theme.palette.mode === "dark"
                        ? `0 10px 32px -6px ${alpha(getAvatarColor(friend.name), 0.3)}`
                        : `0 10px 32px -6px ${alpha(getAvatarColor(friend.name), 0.25)}`,
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
                          {friend.transactionCount} despesa
                          {friend.transactionCount !== 1 ? "s" : ""} compartilhada
                          {friend.transactionCount !== 1 ? "s" : ""}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Saldo líquido em destaque */}
                    <Box 
                      sx={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        mb: 2,
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: alpha(
                          friend.netBalance >= 0 
                            ? theme.palette.success.main 
                            : theme.palette.error.main,
                          0.1
                        ),
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {friend.netBalance >= 0 ? "A receber:" : "Você deve:"}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight={700} 
                        color={friend.netBalance >= 0 ? "success.main" : "error.main"}
                      >
                        {formatCurrency(Math.abs(friend.netBalance))}
                      </Typography>
                    </Box>

                    {/* Detalhes */}
                    {friend.pendingAmount > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {friend.name} me deve:
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color="success.main">
                          {formatCurrency(friend.pendingAmount)}
                        </Typography>
                      </Box>
                    )}

                    {friend.pendingIOwe > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Eu devo a {friend.name}:
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color="error.main">
                          {formatCurrency(friend.pendingIOwe)}
                        </Typography>
                      </Box>
                    )}

                    {(friend.totalPaid > 0 || friend.totalIPaid > 0) && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary">
                          Já acertado:
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(friend.totalPaid + friend.totalIPaid)}
                        </Typography>
                      </Box>
                    )}
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
            <InputLabel>Amigo</InputLabel>
            <Select
              value={selectedFriend}
              label="Amigo"
              onChange={(e: SelectChangeEvent) =>
                setSelectedFriend(e.target.value)
              }
            >
              <MenuItem value="all">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleIcon fontSize="small" />
                  Todos os Amigos
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
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ScheduleIcon fontSize="small" color="warning" />
                  Pendentes
                </Box>
              </MenuItem>
              <MenuItem value="paid">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                  Quitados
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
            bgcolor: alpha(
              selectedFriendStats.netBalance >= 0 
                ? theme.palette.success.main 
                : theme.palette.error.main, 
              0.05
            ),
            border: 1,
            borderColor: selectedFriendStats.netBalance >= 0 
              ? "success.light" 
              : "error.light",
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
                {selectedFriendStats.transactionCount} despesa
                {selectedFriendStats.transactionCount !== 1 ? "s" : ""} • Saldo:{" "}
                <Typography
                  component="span"
                  fontWeight={600}
                  color={
                    selectedFriendStats.netBalance >= 0
                      ? "success.main"
                      : "error.main"
                  }
                >
                  {selectedFriendStats.netBalance >= 0 ? "+" : ""}
                  {formatCurrency(selectedFriendStats.netBalance)}
                </Typography>
                {selectedFriendStats.netBalance >= 0 
                  ? " (a receber)" 
                  : " (você deve)"}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedFriend("all")}
            >
              Limpar Filtro
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
                const transactionAmount = t.amount || 0;
                
                // Calcula o valor de impacto no saldo
                let displayAmount: number;
                let isPositive: boolean;
                let typeLabel: string;
                
                if (t.type === "income") {
                  displayAmount = t.iOwe ? transactionAmount : transactionAmount / 2;
                  isPositive = true;
                  typeLabel = "Receber";
                } else if (t.iOwe) {
                  displayAmount = transactionAmount;
                  isPositive = false;
                  typeLabel = "Devo";
                } else {
                  displayAmount = transactionAmount / 2;
                  isPositive = true;
                  typeLabel = "Receber";
                }

                return (
                  <Paper
                    key={t.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: "divider",
                      borderLeft: 4,
                      borderLeftColor: isPaid ? "success.main" : (isPositive ? "warning.main" : "error.main"),
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
                          {t.type === "income" && (
                            <Chip 
                              label="Receita" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                              sx={{ ml: 1, height: 16, fontSize: "0.6rem" }}
                            />
                          )}
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
                            label={
                              isPaid 
                                ? (isPositive ? "Recebido" : "Pago")
                                : (isPositive ? "A receber" : "A pagar")
                            }
                            size="small"
                            color={isPaid ? "success" : (isPositive ? "warning" : "error")}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color={isPositive ? "success.main" : "error.main"}
                        >
                          {typeLabel}: {formatCurrency(displayAmount)}
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
                  <TableCell sx={{ width: 50 }}>Pago</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Amigo</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ width: 100 }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((t) => {
                  const isPaid = isTransactionPaid(t);
                  const transactionAmount = t.amount || 0;
                  
                  // Calcula o valor de impacto no saldo
                  let displayAmount: number;
                  let isPositive: boolean;
                  let typeLabel: string;
                  
                  if (t.type === "income") {
                    // INCOME: amigo está me pagando
                    displayAmount = t.iOwe ? transactionAmount : transactionAmount / 2;
                    isPositive = true;
                    typeLabel = t.iOwe ? "Pagamento" : "Pagamento (50%)";
                  } else if (t.iOwe) {
                    // EXPENSE + Conta Única: eu devo ao amigo
                    displayAmount = transactionAmount;
                    isPositive = false;
                    typeLabel = "Eu devo";
                  } else {
                    // EXPENSE + Conta Dividida: amigo me deve 50%
                    displayAmount = transactionAmount / 2;
                    isPositive = true;
                    typeLabel = "Me devem (50%)";
                  }

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
                        {t.type === "income" && (
                          <Chip 
                            label="Receita" 
                            size="small" 
                            color="success" 
                            variant="outlined"
                            sx={{ ml: 1, height: 18, fontSize: "0.65rem" }}
                          />
                        )}
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
                      <TableCell
                        align="right"
                        sx={{ fontFamily: "monospace", fontWeight: 600 }}
                      >
                        <Typography 
                          color={isPositive ? "success.main" : "error.main"} 
                          fontWeight={600}
                        >
                          {isPositive ? "+" : "-"}{formatCurrency(displayAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {typeLabel}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={isPaid ? <CheckCircleIcon /> : <ScheduleIcon />}
                          label={
                            isPaid 
                              ? (isPositive ? "Recebido" : "Pago")
                              : (isPositive ? "A receber" : "A pagar")
                          }
                          size="small"
                          color={isPaid ? "success" : (isPositive ? "warning" : "error")}
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
              ? "Nenhuma despesa compartilhada ainda. Crie uma para gerenciar contas com amigos!"
              : "Nenhuma despesa encontrada com os filtros atuais."}
          </Typography>
          {sharedTransactions.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewTransaction}
              sx={{ mt: 2 }}
            >
              Criar Despesa Compartilhada
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

