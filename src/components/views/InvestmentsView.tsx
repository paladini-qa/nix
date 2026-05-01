import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  SwipeableDrawer,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
  Avatar,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BalanceIcon,
  Percent as PercentIcon,
  KeyboardArrowDown as ChevronDownIcon,
  KeyboardArrowUp as ChevronUpIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import dayjs from "dayjs";
import type { Transaction } from "../../types";
import { getReportDate } from "../../utils/transactionUtils";
import { useLayoutSpacing } from "../../hooks";
import EmptyState from "../ui/EmptyState";

interface InvestmentsViewProps {
  transactions: Transaction[];
  isMobile: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

type PeriodFilter = "3m" | "6m" | "1y" | "all";
type TypeFilter = "all" | "expense" | "income";

const INVESTMENT_CATEGORY = "Investments";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (dateStr: string) => dayjs(dateStr).format("DD/MM/YYYY");

const getMonthLabel = (key: string) => {
  const [year, month] = key.split("-");
  return dayjs(`${year}-${month}-01`).format("MMM/YY");
};

interface InvestmentGroup {
  name: string;
  totalDeposited: number;
  totalReturns: number;
  netBalance: number;
  roi: number;
  txsByMonth: {
    monthKey: string;
    month: string;
    deposits: number;
    returns: number;
    txs: Transaction[];
  }[];
}

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: "20px",
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: "primary.main",
          display: "flex",
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
    </Box>
  );
};

const InvestmentRow: React.FC<{
  group: InvestmentGroup;
  isSmall: boolean;
  typeFilter: TypeFilter;
  isDark: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}> = ({ group, isSmall, typeFilter, isDark, onEdit, onDelete }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const isPositive = group.netBalance >= 0;

  const filteredMonths = useMemo(() => {
    if (typeFilter === "all") return group.txsByMonth;
    return group.txsByMonth
      .map((m) => ({
        ...m,
        txs: m.txs.filter((tx) => tx.type === typeFilter),
        deposits: typeFilter === "expense" ? m.deposits : 0,
        returns: typeFilter === "income" ? m.returns : 0,
      }))
      .filter((m) => m.txs.length > 0);
  }, [group.txsByMonth, typeFilter]);

  return (
    <>
      <TableRow
        hover
        onClick={() => setOpen((v) => !v)}
        sx={{
          cursor: "pointer",
          transition: "background 0.15s",
          "& td": { borderBottom: open ? "none" : undefined },
        }}
      >
        <TableCell sx={{ width: 40, pr: 0 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          >
            {open ? (
              <ChevronUpIcon fontSize="small" />
            ) : (
              <ChevronDownIcon fontSize="small" />
            )}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
              }}
            >
              <ShowChartIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography variant="body2" fontWeight={600}>
              {group.name}
            </Typography>
          </Box>
        </TableCell>
        <TableCell
          align="right"
          sx={{ color: "success.main", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}
        >
          {formatCurrencyFull(group.totalDeposited)}
        </TableCell>
        <TableCell
          align="right"
          sx={{ color: "#6366f1", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}
        >
          {formatCurrencyFull(group.totalReturns)}
        </TableCell>
        {!isSmall && (
          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
            <Typography
              variant="body2"
              fontWeight={700}
              color={isPositive ? "success.main" : "error.main"}
            >
              {isPositive ? "+" : ""}
              {formatCurrencyFull(group.netBalance)}
            </Typography>
          </TableCell>
        )}
        {!isSmall && (
          <TableCell align="right">
            <Chip
              label={`${group.roi >= 0 ? "+" : ""}${group.roi.toFixed(1)}%`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: 12,
                bgcolor: alpha(
                  isPositive ? theme.palette.success.main : theme.palette.error.main,
                  0.12
                ),
                color: isPositive ? "success.main" : "error.main",
              }}
            />
          </TableCell>
        )}
      </TableRow>

      <TableRow>
        <TableCell colSpan={isSmall ? 4 : 6} sx={{ p: 0, borderBottom: open ? undefined : "none" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                bgcolor: isDark ? alpha("#fff", 0.03) : alpha("#000", 0.02),
                borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                mx: 1,
                mb: 1,
                borderRadius: "12px",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: 600, fontSize: 11, color: "text.secondary" }}
                    >
                      Mês
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, fontSize: 11, color: "success.main" }}
                    >
                      Aportes
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, fontSize: 11, color: "#6366f1" }}
                    >
                      Rendimentos
                    </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11, color: "text.secondary" }}>
                      Transações
                    </TableCell>
                    <TableCell sx={{ width: 80 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMonths.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ color: "text.secondary", fontSize: 12, py: 2 }}
                      >
                        Nenhuma transação para o filtro selecionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMonths.map((m) => (
                      <TableRow key={m.monthKey} sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{m.month}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontSize: 12,
                            color: m.deposits > 0 ? "success.main" : "text.disabled",
                          }}
                        >
                          {m.deposits > 0 ? formatCurrencyFull(m.deposits) : "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontSize: 12,
                            color: m.returns > 0 ? "#6366f1" : "text.disabled",
                          }}
                        >
                          {m.returns > 0 ? formatCurrencyFull(m.returns) : "—"}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.3}>
                            {m.txs.map((tx) => (
                              <Box
                                key={tx.id}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                gap={1}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(tx.date)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontWeight={600}
                                  sx={{
                                    color: tx.type === "income" ? "#6366f1" : "success.main",
                                  }}
                                >
                                  {tx.type === "income" ? "+" : "−"}
                                  {formatCurrencyFull(tx.amount)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: "top", pt: 0.5 }}>
                          <Stack spacing={0.3}>
                            {m.txs.map((tx) => (
                              <Box
                                key={tx.id}
                                display="flex"
                                alignItems="center"
                                gap={0.25}
                                sx={{ height: 20 }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(tx);
                                  }}
                                  sx={{
                                    p: 0.25,
                                    color: "text.secondary",
                                    "&:hover": { color: "primary.main" },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(tx);
                                  }}
                                  sx={{
                                    p: 0.25,
                                    color: "text.secondary",
                                    "&:hover": { color: "error.main" },
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const InvestmentsView: React.FC<InvestmentsViewProps> = ({ transactions, isMobile, onEdit, onDelete }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark";
  const { gridSpacing } = useLayoutSpacing();

  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const updateWidth = () => {
      setChartWidth(Math.max(el.offsetWidth - (isMobile ? 32 : 48), 280));
    };

    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(updateWidth);
      }, 100);
    };

    updateWidth();
    const ro = new ResizeObserver(debouncedUpdate);
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (period !== "all") count++;
    if (typeFilter !== "all") count++;
    return count;
  }, [period, typeFilter]);

  const allInvestmentTxs = useMemo(
    () => transactions.filter((tx) => tx.category === INVESTMENT_CATEGORY),
    [transactions]
  );

  const periodStart = useMemo(() => {
    if (period === "all") return null;
    const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    return dayjs().subtract(months, "month").startOf("month");
  }, [period]);

  const periodFiltered = useMemo(() => {
    if (!periodStart) return allInvestmentTxs;
    return allInvestmentTxs.filter(
      (tx) => tx.date >= periodStart.format("YYYY-MM-DD")
    );
  }, [allInvestmentTxs, periodStart]);

  const { totalDeposited, totalReturns, netBalance, roi } = useMemo(() => {
    const deposits = periodFiltered.filter((tx) => tx.type === "expense");
    const returns = periodFiltered.filter((tx) => tx.type === "income");
    const totalDeposited = deposits.reduce((s, tx) => s + tx.amount, 0);
    const totalReturns = returns.reduce((s, tx) => s + tx.amount, 0);
    const netBalance = totalReturns - totalDeposited;
    const roi = totalDeposited > 0 ? (netBalance / totalDeposited) * 100 : 0;
    return { totalDeposited, totalReturns, netBalance, roi };
  }, [periodFiltered]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { deposits: number; returns: number }>();
    allInvestmentTxs.forEach((tx) => {
      const key = getReportDate(tx).slice(0, 7);
      const cur = map.get(key) || { deposits: 0, returns: 0 };
      if (tx.type === "expense") cur.deposits += tx.amount;
      else cur.returns += tx.amount;
      map.set(key, cur);
    });
    const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    return sorted.map(([key, { deposits, returns }]) => {
      // Aportes (deposits/expense) aumentam o patrimônio investido;
      // rendimentos (returns/income) são ganhos adicionais sobre o capital.
      cumulative += deposits + returns;
      return { monthKey: key, month: getMonthLabel(key), deposits, returns, balance: cumulative };
    });
  }, [allInvestmentTxs]);

  const barData = useMemo(() => {
    if (period === "all") return monthlyData;
    const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    return monthlyData.slice(-months);
  }, [monthlyData, period]);

  const investmentGroups = useMemo((): InvestmentGroup[] => {
    const map = new Map<
      string,
      { txsByMonth: Map<string, { deposits: number; returns: number; txs: Transaction[] }> }
    >();

    periodFiltered.forEach((tx) => {
      const name = tx.description || "Sem nome";
      if (!map.has(name)) map.set(name, { txsByMonth: new Map() });
      const group = map.get(name)!;
      const key = getReportDate(tx).slice(0, 7);
      const cur = group.txsByMonth.get(key) || { deposits: 0, returns: 0, txs: [] };
      if (tx.type === "expense") cur.deposits += tx.amount;
      else cur.returns += tx.amount;
      cur.txs.push(tx);
      group.txsByMonth.set(key, cur);
    });

    return Array.from(map.entries())
      .map(([name, { txsByMonth }]) => {
        const txsByMonthArr = Array.from(txsByMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, data]) => ({
            monthKey: key,
            month: getMonthLabel(key),
            ...data,
            txs: data.txs.sort((a, b) => (a.date < b.date ? 1 : -1)),
          }));

        const totalDeposited = txsByMonthArr.reduce((s, m) => s + m.deposits, 0);
        const totalReturns = txsByMonthArr.reduce((s, m) => s + m.returns, 0);
        const netBalance = totalReturns - totalDeposited;
        const roi = totalDeposited > 0 ? (netBalance / totalDeposited) * 100 : 0;
        return { name, totalDeposited, totalReturns, netBalance, roi, txsByMonth: txsByMonthArr };
      })
      .sort((a, b) => b.totalDeposited - a.totalDeposited);
  }, [periodFiltered]);

  const hasData = allInvestmentTxs.length > 0;

  const paperSx = (accentColor = theme.palette.primary.main) => ({
    p: isMobile ? 2 : 3,
    position: "relative",
    overflow: "hidden",
    minWidth: 0,
    background: isDark
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
      : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
    backdropFilter: "blur(16px)",
    border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
    borderRadius: "20px",
    boxShadow: `0 6px 24px -6px ${alpha(accentColor, 0.12)}`,
  });

  const tooltipContentStyle = {
    backgroundColor: isDark ? alpha("#1e1e2e", 0.95) : alpha("#ffffff", 0.95),
    border: `1px solid ${isDark ? alpha("#fff", 0.1) : alpha("#000", 0.1)}`,
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    fontSize: 13,
    padding: "10px 14px",
  };

  const summaryCards = [
    {
      label: "Total Aportado",
      value: formatCurrency(totalDeposited),
      icon: <TrendingUpIcon />,
      color: "#10b981",
      accent: "#10b981",
    },
    {
      label: "Total Rendimentos",
      value: formatCurrency(totalReturns),
      icon: <TrendingUpIcon />,
      color: "#6366f1",
      accent: "#6366f1",
    },
    {
      label: "Saldo Líquido",
      value: `${netBalance >= 0 ? "+" : ""}${formatCurrency(netBalance)}`,
      icon: <BalanceIcon />,
      color: netBalance >= 0 ? "#10b981" : "#ef4444",
      accent: netBalance >= 0 ? "#10b981" : "#ef4444",
    },
    {
      label: "ROI",
      value: `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`,
      icon: <PercentIcon />,
      color: roi >= 0 ? "#6366f1" : "#ef4444",
      accent: roi >= 0 ? "#6366f1" : "#ef4444",
    },
  ];

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 2 : 3,
        pb: { xs: "140px", md: 0 },
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box
          sx={{
            p: 1,
            borderRadius: "20px",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            display: "flex",
          }}
        >
          <TrendingUpIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Investimentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhe aportes, rendimentos e evolução do portfólio
          </Typography>
        </Box>
      </Box>

      {/* Filter toggle button */}
      <Box display="flex" alignItems="center" gap={1}>
        {isMobile ? (
          <Box
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 36,
              px: 1.5,
              gap: 0.75,
              border: "1px solid",
              borderColor: activeFiltersCount > 0 ? "primary.main" : "divider",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s",
              ...(activeFiltersCount > 0 && {
                background: `linear-gradient(135deg, ${alpha("#6366f1", 0.08)} 0%, ${alpha("#8b5cf6", 0.06)} 100%)`,
              }),
            }}
          >
            <FilterIcon sx={{ fontSize: 16, color: activeFiltersCount > 0 ? "primary.main" : "text.secondary" }} />
            <Typography variant="caption" fontWeight={600} color={activeFiltersCount > 0 ? "primary.main" : "text.secondary"}>
              Filtros
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                color="primary"
                sx={{ height: 16, minWidth: 16, fontSize: 10, "& .MuiChip-label": { px: 0.5 } }}
              />
            )}
          </Box>
        ) : (
          <Button
            variant={activeFiltersCount > 0 ? "contained" : "outlined"}
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<FilterIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: "20px",
              height: 40,
              px: 2,
              "& .MuiButton-startIcon": { mr: 1 },
              ...(activeFiltersCount > 0 && {
                background: `linear-gradient(135deg, ${alpha("#6366f1", 0.9)} 0%, ${alpha("#8b5cf6", 0.9)} 100%)`,
              }),
            }}
          >
            Filtros
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                sx={{ ml: 1, height: 18, minWidth: 18, fontSize: 10, bgcolor: "rgba(255,255,255,0.2)", color: "inherit", "& .MuiChip-label": { px: 0.5 } }}
              />
            )}
          </Button>
        )}

        {/* Active filter chips */}
        {activeFiltersCount > 0 && (
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            {period !== "all" && (
              <Chip
                label={period === "3m" ? "3 meses" : period === "6m" ? "6 meses" : "1 ano"}
                onDelete={() => setPeriod("all")}
                size="small"
                sx={{ borderRadius: "10px", bgcolor: alpha("#6366f1", 0.1), color: "#6366f1" }}
              />
            )}
            {typeFilter !== "all" && (
              <Chip
                label={typeFilter === "expense" ? "Aportes" : "Rendimentos"}
                onDelete={() => setTypeFilter("all")}
                size="small"
                sx={{
                  borderRadius: "10px",
                  bgcolor: alpha(typeFilter === "expense" ? "#10b981" : "#6366f1", 0.1),
                  color: typeFilter === "expense" ? "#10b981" : "#6366f1",
                }}
              />
            )}
          </Stack>
        )}
      </Box>

      {/* Mobile: bottom sheet */}
      {isMobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={showFilters}
          onClose={() => setShowFilters(false)}
          onOpen={() => setShowFilters(true)}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              borderRadius: "20px 20px 0 0",
              maxHeight: "80vh",
              overflowY: "auto",
              background: isDark
                ? `linear-gradient(160deg, ${alpha("#1e293b", 0.98)} 0%, ${alpha("#0f172a", 1)} 100%)`
                : "linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.text.primary, 0.15) }} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterIcon fontSize="small" color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>Filtros</Typography>
              {activeFiltersCount > 0 && (
                <Chip label={activeFiltersCount} size="small" color="primary" sx={{ height: 20, minWidth: 20, fontSize: 11, "& .MuiChip-label": { px: 0.75 } }} />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {activeFiltersCount > 0 && (
                <Button size="small" onClick={() => { setPeriod("all"); setTypeFilter("all"); }} sx={{ textTransform: "none", fontSize: 12, color: "error.main", minWidth: "auto" }}>
                  Limpar
                </Button>
              )}
              <IconButton size="small" onClick={() => setShowFilters(false)} sx={{ color: "text.secondary" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Divider />
          <Stack spacing={2.5} sx={{ p: 2.5, pb: 5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
                Período
              </Typography>
              <Stack direction="row" gap={1}>
                {(["3m", "6m", "1y", "all"] as PeriodFilter[]).map((p) => (
                  <Chip
                    key={p}
                    label={p === "3m" ? "3 meses" : p === "6m" ? "6 meses" : p === "1y" ? "1 ano" : "Tudo"}
                    onClick={() => setPeriod(p)}
                    variant={period === p ? "filled" : "outlined"}
                    size="medium"
                    sx={{
                      borderRadius: "10px",
                      flex: 1,
                      cursor: "pointer",
                      fontWeight: period === p ? 600 : 400,
                      ...(period === p && p !== "all" && { bgcolor: alpha("#6366f1", 0.15), color: "#6366f1", border: "none" }),
                      ...(period === p && p === "all" && { bgcolor: "primary.main", color: "#fff", border: "none" }),
                    }}
                  />
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
                Tipo
              </Typography>
              <Stack direction="row" gap={1}>
                {(["all", "expense", "income"] as TypeFilter[]).map((val) => (
                  <Chip
                    key={val}
                    label={val === "all" ? "Todos" : val === "expense" ? "Aportes" : "Rendimentos"}
                    onClick={() => setTypeFilter(val)}
                    variant={typeFilter === val ? "filled" : "outlined"}
                    size="medium"
                    sx={{
                      borderRadius: "10px",
                      flex: 1,
                      cursor: "pointer",
                      fontWeight: typeFilter === val ? 600 : 400,
                      ...(typeFilter === val && val === "expense" && { bgcolor: alpha("#10b981", 0.15), color: "#10b981", border: "none" }),
                      ...(typeFilter === val && val === "income" && { bgcolor: alpha("#6366f1", 0.15), color: "#6366f1", border: "none" }),
                      ...(typeFilter === val && val === "all" && { bgcolor: "primary.main", color: "#fff", border: "none" }),
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </SwipeableDrawer>
      ) : (
        /* Desktop: inline collapsible */
        showFilters && (
          <Paper
            elevation={0}
            sx={{
              ...paperSx(),
              p: 2,
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
                Período
              </Typography>
              <Stack direction="row" gap={1}>
                {(["3m", "6m", "1y", "all"] as PeriodFilter[]).map((p) => (
                  <Chip
                    key={p}
                    label={p === "3m" ? "3 meses" : p === "6m" ? "6 meses" : p === "1y" ? "1 ano" : "Tudo"}
                    onClick={() => setPeriod(p)}
                    variant={period === p ? "filled" : "outlined"}
                    size="medium"
                    sx={{
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: period === p ? 600 : 400,
                      ...(period === p && p !== "all" && { bgcolor: alpha("#6366f1", 0.15), color: "#6366f1", border: "none" }),
                      ...(period === p && p === "all" && { bgcolor: "primary.main", color: "#fff", border: "none" }),
                    }}
                  />
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
                Tipo
              </Typography>
              <Stack direction="row" gap={1}>
                {(["all", "expense", "income"] as TypeFilter[]).map((val) => (
                  <Chip
                    key={val}
                    label={val === "all" ? "Todos" : val === "expense" ? "Aportes" : "Rendimentos"}
                    onClick={() => setTypeFilter(val)}
                    variant={typeFilter === val ? "filled" : "outlined"}
                    size="medium"
                    sx={{
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: typeFilter === val ? 600 : 400,
                      ...(typeFilter === val && val === "expense" && { bgcolor: alpha("#10b981", 0.15), color: "#10b981", border: "none" }),
                      ...(typeFilter === val && val === "income" && { bgcolor: alpha("#6366f1", 0.15), color: "#6366f1", border: "none" }),
                      ...(typeFilter === val && val === "all" && { bgcolor: "primary.main", color: "#fff", border: "none" }),
                    }}
                  />
                ))}
              </Stack>
            </Box>
            {activeFiltersCount > 0 && (
              <Box sx={{ display: "flex", alignItems: "flex-end", height: "100%" }}>
                <Button size="small" onClick={() => { setPeriod("all"); setTypeFilter("all"); }} sx={{ textTransform: "none", fontSize: 12, color: "error.main" }}>
                  Limpar filtros
                </Button>
              </Box>
            )}
          </Paper>
        )
      )}

      {!hasData ? (
        <EmptyState
          type="generic"
          title="Nenhum investimento encontrado"
          description="Adicione transações com a categoria 'Investments' para acompanhar seu portfólio."
        />
      ) : (
        <>
          {/* Summary cards */}
          <Grid container spacing={gridSpacing}>
            {summaryCards.map((card) => (
              <Grid key={card.label} size={{ xs: 6, md: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: isMobile ? 1.5 : 2,
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                    background: isDark
                      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                      : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
                    backdropFilter: "blur(16px)",
                    border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                    boxShadow: `0 6px 24px -6px ${alpha(card.accent, 0.15)}`,
                    borderRadius: "16px",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": { transform: "translateY(-2px)" },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: `linear-gradient(135deg, ${alpha(card.accent, 0.06)} 0%, ${alpha(card.accent, 0.02)} 100%)`,
                      pointerEvents: "none",
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" mb={0.5} sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: "0.08em",
                      fontSize: isMobile ? 9 : 10,
                      fontWeight: 600,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    variant={isMobile ? "body1" : "h6"}
                    sx={{
                      fontWeight: 700,
                      color: card.color,
                      letterSpacing: "-0.02em",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {card.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Charts */}
          <Grid container spacing={gridSpacing}>
            {/* Evolution chart */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={0} sx={paperSx("#6366f1")}>
                <SectionHeader icon={<TimelineIcon />} title="Patrimônio Acumulado" />
                {monthlyData.length > 0 ? (
                  <Box sx={{ width: "100%", height: isMobile ? 220 : 260, overflowX: "auto" }}>
                    <AreaChart
                      data={monthlyData}
                      width={isMobile ? chartWidth : Math.max(chartWidth * 0.565 - 48, 260)}
                      height={isMobile ? 220 : 260}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={theme.palette.primary.main}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={theme.palette.primary.main}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? alpha("#fff", 0.1) : alpha("#000", 0.1)}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                        tickLine={false}
                        axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.2) }}
                      />
                      <YAxis
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                        tickLine={false}
                        axisLine={false}
                        width={52}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [formatCurrency(value), "Patrimônio Acumulado"]}
                        contentStyle={tooltipContentStyle}
                        labelStyle={{ color: theme.palette.text.primary, fontWeight: 600, marginBottom: 4 }}
                        wrapperStyle={{ zIndex: 9999 }}
                        allowEscapeViewBox={{ x: true, y: true }}
                      />
                      <ReferenceLine
                        y={0}
                        stroke={alpha(theme.palette.divider, 0.6)}
                        strokeDasharray="3 3"
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        name="Patrimônio Acumulado"
                        stroke={theme.palette.primary.main}
                        fill="url(#balanceGradient)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: theme.palette.primary.main, stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                    <Typography variant="body2" color="text.secondary">
                      Sem dados suficientes
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Monthly bar chart */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={0} sx={paperSx("#10b981")}>
                <SectionHeader icon={<BarChartIcon />} title="Aportes vs Rendimentos" />
                {barData.length > 0 ? (
                  <Box sx={{ width: "100%", height: isMobile ? 220 : 260, overflowX: "auto" }}>
                    <BarChart
                      data={barData}
                      width={isMobile ? chartWidth : Math.max(chartWidth * 0.405 - 48, 200)}
                      height={isMobile ? 220 : 260}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? alpha("#fff", 0.1) : alpha("#000", 0.1)}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                        tickLine={false}
                        axisLine={{ stroke: alpha(theme.palette.text.secondary, 0.2) }}
                      />
                      <YAxis
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name,
                        ]}
                        contentStyle={tooltipContentStyle}
                        labelStyle={{ color: theme.palette.text.primary, fontWeight: 600, marginBottom: 4 }}
                        wrapperStyle={{ zIndex: 9999 }}
                        allowEscapeViewBox={{ x: true, y: true }}
                      />
                      <Legend
                        content={() => (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 24,
                              marginTop: 8,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor: "#10b981",
                                  borderRadius: 2,
                                }}
                              />
                              <span style={{ color: "#10b981", fontSize: 12 }}>
                                Aportes
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor: "#6366f1",
                                  borderRadius: 2,
                                }}
                              />
                              <span style={{ color: "#6366f1", fontSize: 12 }}>
                                Rendimentos
                              </span>
                            </div>
                          </div>
                        )}
                      />
                      <Bar
                        dataKey="deposits"
                        name="Aportes"
                        fill={isDark ? alpha("#10b981", 0.7) : "#10b981"}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="returns"
                        name="Rendimentos"
                        fill={isDark ? alpha("#6366f1", 0.7) : "#6366f1"}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                    <Typography variant="body2" color="text.secondary">
                      Sem dados no período
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Investment groups table */}
          <Paper elevation={0} sx={{ ...paperSx(), p: 0, overflow: "hidden" }}>
            <Box
              px={isMobile ? 2 : 3}
              py={1.5}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "20px",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    display: "flex",
                  }}
                >
                  <ShowChartIcon />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Investimentos
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {investmentGroups.length} ativo{investmentGroups.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
            <Divider />
            {investmentGroups.length === 0 ? (
              <Box p={4} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Nenhum investimento para o filtro selecionado
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Ativo</TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, fontSize: 12, color: "success.main" }}
                      >
                        Aportado
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, fontSize: 12, color: "#6366f1" }}
                      >
                        Rendimentos
                      </TableCell>
                      {!isSmall && (
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>
                          Saldo
                        </TableCell>
                      )}
                      {!isSmall && (
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>
                          ROI
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {investmentGroups.map((group) => (
                      <InvestmentRow
                        key={group.name}
                        group={group}
                        isSmall={isSmall}
                        typeFilter={typeFilter}
                        isDark={isDark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default InvestmentsView;
