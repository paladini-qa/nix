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
  Tooltip,
  LinearProgress,
  Button,
  Fab,
  Collapse,
  Card,
  CardContent,
  CardActions,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  alpha,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  People as PeopleIcon,
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

interface InstallmentGroup {
  key: string;
  description: string;
  category: string;
  paymentMethod: string;
  type: "income" | "expense";
  totalInstallments: number;
  totalAmount: number;
  paidAmount: number;
  paidCount: number;
  installments: Transaction[];
  startDate: string;
  endDate: string;
  isShared?: boolean;
  sharedWith?: string;
  relatedTransactionId?: string;
}

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
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
    const groups: Map<string, InstallmentGroup> = new Map();

    splitsTransactions.forEach((t) => {
      const key = `${t.description}-${t.paymentMethod}-${t.category}-${t.type}-${t.installments}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          description: t.description,
          category: t.category,
          paymentMethod: t.paymentMethod,
          type: t.type,
          totalInstallments: t.installments!,
          totalAmount: 0,
          paidAmount: 0,
          paidCount: 0,
          installments: [],
          startDate: t.date,
          endDate: t.date,
          isShared: t.isShared,
          sharedWith: t.sharedWith,
          relatedTransactionId: t.relatedTransactionId,
        });
      }

      const group = groups.get(key)!;
      group.installments.push(t);
      group.totalAmount += t.amount;
      
      if (t.isPaid !== false) {
        group.paidAmount += t.amount;
        group.paidCount++;
      }
      
      if (t.date < group.startDate) group.startDate = t.date;
      if (t.date > group.endDate) group.endDate = t.date;
    });

    // Ordena as parcelas de cada grupo por data
    groups.forEach((group) => {
      group.installments.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    return Array.from(groups.values());
  }, [splitsTransactions]);

  // Filtra os grupos
  const filteredGroups = useMemo(() => {
    return groupedSplits
      .filter((group) => {
        const matchesSearch =
          group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || group.type === filterType;

        const isCompleted = group.paidCount >= group.totalInstallments;
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "in_progress" && !isCompleted) ||
          (filterStatus === "completed" && isCompleted);

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [groupedSplits, searchTerm, filterType, filterStatus]);

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
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Estatísticas
  const stats = useMemo(() => {
    const inProgressGroups = groupedSplits.filter((g) => g.paidCount < g.totalInstallments);
    const completedGroups = groupedSplits.filter((g) => g.paidCount >= g.totalInstallments);

    const totalRemaining = inProgressGroups.reduce(
      (sum, g) => sum + (g.totalAmount - g.paidAmount),
      0
    );
    const totalPaid = groupedSplits.reduce((sum, g) => sum + g.paidAmount, 0);

    return {
      inProgressCount: inProgressGroups.length,
      completedCount: completedGroups.length,
      totalRemaining,
      totalPaid,
      sharedCount: groupedSplits.filter((g) => g.isShared).length,
    };
  }, [groupedSplits]);

  const renderInstallmentCard = (group: InstallmentGroup) => {
    const isExpanded = expandedGroups.has(group.key);
    const isCompleted = group.paidCount >= group.totalInstallments;
    const progress = (group.paidCount / group.totalInstallments) * 100;
    const isIncome = group.type === "income";

    return (
      <Card
        key={group.key}
        elevation={0}
        sx={{
          mb: 2,
          position: "relative",
          overflow: "visible",
          background: theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          borderLeft: `3px solid ${isIncome ? "#059669" : "#F59E0B"}`,
          borderRadius: "16px",
          boxShadow: theme.palette.mode === "dark"
            ? `0 6px 24px -6px ${alpha(isIncome ? "#059669" : "#F59E0B", 0.2)}`
            : `0 6px 24px -6px ${alpha(isIncome ? "#059669" : "#F59E0B", 0.15)}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.palette.mode === "dark"
              ? `0 10px 32px -6px ${alpha(isIncome ? "#059669" : "#F59E0B", 0.3)}`
              : `0 10px 32px -6px ${alpha(isIncome ? "#059669" : "#F59E0B", 0.25)}`,
          },
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
            onClick={() => toggleGroup(group.key)}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <CreditCardIcon
                  fontSize="small"
                  color={isIncome ? "success" : "warning"}
                />
                <Typography variant="subtitle1" fontWeight={600}>
                  {group.description}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={group.category} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {group.paymentMethod}
                </Typography>
                {group.isShared && group.sharedWith && (
                  <Chip
                    icon={<PeopleIcon sx={{ fontSize: 14 }} />}
                    label={group.sharedWith}
                    size="small"
                    color="info"
                    variant="filled"
                  />
                )}
                {/* Income gerada de despesa compartilhada */}
                {group.type === "income" && group.relatedTransactionId && (
                  <Chip
                    icon={<PeopleIcon sx={{ fontSize: 14 }} />}
                    label="Shared"
                    size="small"
                    color="info"
                    variant="filled"
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ textAlign: "right", minWidth: 120 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color={isIncome ? "success.main" : "error.main"}
              >
                {isIncome ? "+" : "-"}{formatCurrency(group.totalAmount)}
              </Typography>
              <Chip
                icon={isCompleted ? <CheckCircleIcon /> : <ScheduleIcon />}
                label={`${group.paidCount}/${group.totalInstallments}x`}
                size="small"
                color={isCompleted ? "success" : "warning"}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {formatDateShort(group.startDate)} → {formatDateShort(group.endDate)}
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {Math.round(progress)}% paid
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={isCompleted ? "success" : "warning"}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Expand/Collapse Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <Button
              size="small"
              onClick={() => toggleGroup(group.key)}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none" }}
            >
              {isExpanded ? "Hide installments" : `View ${group.totalInstallments} installments`}
            </Button>
          </Box>
        </CardContent>

        {/* Installments List */}
        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.08) }}>
            {isMobile ? (
              // Mobile: Cards compactos
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {group.installments.map((t) => (
                  <Paper
                    key={t.id}
                    sx={{
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      opacity: t.isPaid !== false ? 0.6 : 1,
                      bgcolor: t.isPaid !== false ? "action.disabledBackground" : "background.paper",
                    }}
                  >
                    <Checkbox
                      checked={t.isPaid !== false}
                      onChange={(e) => onTogglePaid(t.id, e.target.checked)}
                      size="small"
                      color="success"
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          textDecoration: t.isPaid !== false ? "line-through" : "none",
                        }}
                      >
                        {t.currentInstallment}/{t.installments}x • {formatDate(t.date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(t.amount || 0)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileActionAnchor({ element: e.currentTarget, transaction: t });
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            ) : (
              // Desktop: Tabela
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 50 }}>Paid</TableCell>
                    <TableCell>Installment</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.installments.map((t) => (
                    <TableRow
                      key={t.id}
                      sx={{
                        opacity: t.isPaid !== false ? 0.6 : 1,
                        bgcolor: t.isPaid !== false ? "action.disabledBackground" : "transparent",
                        "& td": {
                          textDecoration: t.isPaid !== false ? "line-through" : "none",
                          textDecorationColor: "text.disabled",
                        },
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={t.isPaid !== false}
                          onChange={(e) => onTogglePaid(t.id, e.target.checked)}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${t.currentInstallment}/${t.installments}x`}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                      </TableCell>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                        {formatCurrency(t.amount || 0)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => onEdit(t)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => onDelete(t.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </Collapse>
      </Card>
    );
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
            Installments (Splits)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your installment purchases
          </Typography>
        </Box>

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
              boxShadow: `0 6px 24px -6px ${alpha("#F59E0B", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, position: "relative", zIndex: 1 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha("#F59E0B", 0.1), border: `1px solid ${alpha("#F59E0B", 0.2)}` }}>
                <ScheduleIcon sx={{ fontSize: 14, color: "#F59E0B" }} />
              </Box>
              <Typography variant="overline" sx={{ color: "#F59E0B", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                In Progress
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: "#F59E0B", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {stats.inProgressCount}
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
                <CheckCircleIcon sx={{ fontSize: 14, color: "#059669" }} />
              </Box>
              <Typography variant="overline" sx={{ color: "#059669", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600 }}>
                Completed
              </Typography>
            </Box>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: "#059669", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {stats.completedCount}
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
            <Typography variant="overline" sx={{ color: "#DC2626", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600, position: "relative", zIndex: 1 }}>
              Remaining
            </Typography>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#DC2626", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {formatCurrency(stats.totalRemaining)}
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
            <Typography variant="overline" sx={{ color: "#6366f1", letterSpacing: "0.08em", fontSize: 9, fontWeight: 600, position: "relative", zIndex: 1 }}>
              Total Paid
            </Typography>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#6366f1", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
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
        </Box>
      </Paper>

      {/* Installment Groups */}
      {filteredGroups.length > 0 ? (
        <Box>
          {filteredGroups.map((group) => renderInstallmentCard(group))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CreditCardIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography color="text.secondary" fontStyle="italic">
            No installment purchases found with the current filters.
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

export default SplitsView;
