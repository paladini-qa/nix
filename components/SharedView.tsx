import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
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
  CircularProgress,
} from "@mui/material";
import {
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
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import TransactionTags from "./TransactionTags";
import DateFilter from "./DateFilter";
import SearchBar from "./SearchBar";
import {
  getTableContainerSx,
  getHeaderCellSx,
  getRowSx,
  getMobileCardSx,
} from "../utils/tableStyles";
import { Transaction } from "../types";
import { generateFriendReport, prepareFriendReportData } from "../services/pdfService";

interface SharedViewProps {
  transactions: Transaction[];
  friends: string[];
  userName?: string; // Nome do usuário para o relatório PDF
  onNewTransaction: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onRefreshData?: () => Promise<void>;
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
  userName = "Usuário",
  onNewTransaction,
  onEdit,
  onDelete,
  onTogglePaid,
  onRefreshData,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus>("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handler de refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshData, isRefreshing]);
  const [mobileActionAnchor, setMobileActionAnchor] = useState<{
    element: HTMLElement | null;
    transaction: Transaction | null;
  }>({ element: null, transaction: null });
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null); // friendName sendo gerado

  // Handler para mudança de data
  const handleDateChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Gera o relatório PDF para um amigo específico
  const handleGeneratePdf = async (friendName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Previne seleção do card
    setGeneratingPdf(friendName);

    try {
      // Pequeno delay para mostrar o loading
      await new Promise((resolve) => setTimeout(resolve, 300));

      const reportData = prepareFriendReportData(
        friendName,
        userName,
        transactions,
        transactions
      );

      generateFriendReport(reportData);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setGeneratingPdf(null);
    }
  };

  // Filtra transações vinculadas a amigos (tanto expenses quanto incomes) e pelo mês selecionado
  const sharedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.isShared || !t.sharedWith) return false;
      
      // Filtra pelo mês e ano selecionados
      const transactionDate = new Date(t.date);
      const transactionMonth = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();
      
      return transactionMonth === selectedMonth && transactionYear === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

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
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: isMobile ? 2 : 3,
      // Extra padding para bottom navigation + FABs
      pb: { xs: "180px", md: 0 },
    }}>
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
            Transaction
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
                      {/* Botão de gerar relatório PDF */}
                      <Tooltip title="Gerar relatório PDF" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => handleGeneratePdf(friend.name, e)}
                          disabled={generatingPdf === friend.name}
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              transform: "translateY(-2px)",
                            },
                            "&:disabled": {
                              bgcolor: alpha(theme.palette.action.disabled, 0.1),
                            },
                          }}
                        >
                          {generatingPdf === friend.name ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <PdfIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
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
                        borderRadius: "20px",
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
        elevation={0}
        sx={{
          borderRadius: "20px",
          overflow: "hidden",
          bgcolor: theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha("#FFFFFF", 0.9),
          backdropFilter: "blur(20px)",
          border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          p: 2,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          alignItems: isMobile ? "stretch" : "center",
          gap: 2,
        }}
      >
        {/* Date Filter */}
        <DateFilter
          month={selectedMonth}
          year={selectedYear}
          onDateChange={handleDateChange}
          compact={isMobile}
        />

        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search..."
          minWidth={150}
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

          {/* Refresh Button */}
          {onRefreshData && (
            <Tooltip title="Atualizar dados">
              <IconButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: "20px",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <RefreshIcon
                  sx={{
                    animation: isRefreshing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Paper>

      {/* Selected Friend Stats */}
      {selectedFriendStats && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            backdropFilter: "blur(20px)",
            p: 2,
            bgcolor: alpha(
              selectedFriendStats.netBalance >= 0 
                ? theme.palette.success.main 
                : theme.palette.error.main, 
              0.08
            ),
            border: `1px solid ${alpha(
              selectedFriendStats.netBalance >= 0 
                ? theme.palette.success.main 
                : theme.palette.error.main,
              0.2
            )}`,
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
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={
                  generatingPdf === selectedFriendStats.name ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PdfIcon />
                  )
                }
                disabled={generatingPdf === selectedFriendStats.name}
                onClick={(e) => handleGeneratePdf(selectedFriendStats.name, e)}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                {isMobile ? "PDF" : "Gerar Relatório PDF"}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedFriend("all")}
              >
                Limpar Filtro
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Transactions Table/List */}
      {filteredTransactions.length > 0 ? (
        <Paper elevation={0} sx={getTableContainerSx(theme, isDarkMode)}>
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
                    elevation={0}
                    sx={getMobileCardSx(theme, isDarkMode, isPositive ? "income" : "expense")}
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
                        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", alignItems: "center" }}>
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
                        {/* Tags adicionais - Componente padronizado em formato pílula */}
                        <TransactionTags 
                          transaction={t} 
                          showShared={false} 
                          showPaymentStatus={false}
                        />
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
            <Table size="small">
                <TableHead>
                <TableRow>
                  <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), width: 50 }}>Pago</TableCell>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Descrição</TableCell>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Amigo</TableCell>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Categoria</TableCell>
                  <TableCell sx={getHeaderCellSx(theme, isDarkMode)}>Data</TableCell>
                  <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "right" }}>Valor</TableCell>
                  <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center", width: 120 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ ...getHeaderCellSx(theme, isDarkMode), textAlign: "center", width: 100 }}>
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

                  const rowIndex = filteredTransactions.indexOf(t);
                  return (
                    <TableRow
                      key={t.id}
                      sx={{
                        ...getRowSx(theme, isDarkMode, rowIndex),
                        opacity: isPaid ? 0.6 : 1,
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
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: "center",
            borderRadius: "20px",
            bgcolor: theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha("#FFFFFF", 0.9),
            backdropFilter: "blur(20px)",
            border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          }}
        >
          <PeopleIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography color="text.secondary" fontStyle="italic">
            No shared transactions found with the current filters.
          </Typography>
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
            bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
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

