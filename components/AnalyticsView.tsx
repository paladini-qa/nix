import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  useMediaQuery,
  useTheme,
  alpha,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
  Collapse,
  Stack,
  SelectChangeEvent,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useTranslation } from "react-i18next";
import { Transaction, TransactionType } from "../types";

interface AnalyticsViewProps {
  transactions: Transaction[];
}

interface AnalyticsFilters {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  type: "all" | TransactionType;
  categories: string[];
  paymentMethods: string[];
}

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  // Estado dos filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: null,
    endDate: null,
    type: "all",
    categories: [],
    paymentMethods: [],
  });

  // Extrair categorias e métodos de pagamento únicos das transações
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const availablePaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    transactions.forEach((t) => methods.add(t.paymentMethod));
    return Array.from(methods).sort();
  }, [transactions]);

  // Aplicar filtros às transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filtro por data
      if (filters.startDate) {
        const txDate = dayjs(tx.date);
        if (txDate.isBefore(filters.startDate, "day")) return false;
      }
      if (filters.endDate) {
        const txDate = dayjs(tx.date);
        if (txDate.isAfter(filters.endDate, "day")) return false;
      }

      // Filtro por tipo
      if (filters.type !== "all" && tx.type !== filters.type) return false;

      // Filtro por categoria
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(tx.category)
      ) {
        return false;
      }

      // Filtro por método de pagamento
      if (
        filters.paymentMethods.length > 0 &&
        !filters.paymentMethods.includes(tx.paymentMethod)
      ) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.startDate !== null ||
      filters.endDate !== null ||
      filters.type !== "all" ||
      filters.categories.length > 0 ||
      filters.paymentMethods.length > 0
    );
  }, [filters]);

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      type: "all",
      categories: [],
      paymentMethods: [],
    });
  };

  // Handlers para filtros
  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      categories: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handlePaymentMethodChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      paymentMethods: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Dados dos últimos 6 meses para gráfico de barras (ou período filtrado)
  const monthlyData = useMemo(() => {
    const months: {
      month: string;
      income: number;
      expense: number;
      balance: number;
    }[] = [];

    // Se há filtro de data, calcula com base nas transações filtradas
    if (filters.startDate || filters.endDate) {
      // Agrupa por mês as transações filtradas
      const monthlyMap = new Map<string, { income: number; expense: number }>();

      filteredTransactions.forEach((tx) => {
        const [year, month] = tx.date.split("-");
        const key = `${year}-${month}`;
        const current = monthlyMap.get(key) || { income: 0, expense: 0 };

        if (tx.type === "income") {
          current.income += tx.amount || 0;
        } else {
          current.expense += tx.amount || 0;
        }

        monthlyMap.set(key, current);
      });

      // Converte para array ordenado
      const sortedKeys = Array.from(monthlyMap.keys()).sort();
      sortedKeys.forEach((key) => {
        const [year, month] = key.split("-");
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthStr = d
          .toLocaleDateString("pt-BR", { month: "short" })
          .replace(".", "");
        const data = monthlyMap.get(key)!;

        months.push({
          month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
          income: data.income,
          expense: data.expense,
          balance: data.income - data.expense,
        });
      });

      return months;
    }

    // Comportamento padrão: últimos 6 meses
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthStr = d
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "");

      const monthTxs = filteredTransactions.filter((tx) => {
        const [y, m] = tx.date.split("-");
        return parseInt(y) === year && parseInt(m) === month + 1;
      });

      const income = monthTxs
        .filter((tx) => tx.type === "income")
        .reduce((acc, tx) => acc + (tx.amount || 0), 0);

      const expense = monthTxs
        .filter((tx) => tx.type === "expense")
        .reduce((acc, tx) => acc + (tx.amount || 0), 0);

      months.push({
        month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
        income,
        expense,
        balance: income - expense,
      });
    }

    return months;
  }, [filteredTransactions, filters.startDate, filters.endDate]);

  // Evolução do saldo ao longo do tempo
  const balanceEvolution = useMemo(() => {
    const data: { date: string; balance: number }[] = [];
    let runningBalance = 0;

    // Ordena transações por data
    const sortedTxs = [...filteredTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Agrupa por mês
    const monthlyBalances = new Map<string, number>();

    sortedTxs.forEach((tx) => {
      const [year, month] = tx.date.split("-");
      const key = `${year}-${month}`;
      const change = tx.type === "income" ? tx.amount || 0 : -(tx.amount || 0);
      monthlyBalances.set(key, (monthlyBalances.get(key) || 0) + change);
    });

    // Se há filtros de data, usa período filtrado
    if (filters.startDate || filters.endDate) {
      const sortedKeys = Array.from(monthlyBalances.keys()).sort();
      sortedKeys.forEach((key) => {
        const [year, month] = key.split("-");
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthLabel = d.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });

        runningBalance += monthlyBalances.get(key) || 0;
        data.push({
          date: monthLabel,
          balance: runningBalance,
        });
      });
      return data;
    }

    // Comportamento padrão: últimos 12 meses
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const monthLabel = d.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      runningBalance += monthlyBalances.get(key) || 0;
      data.push({
        date: monthLabel,
        balance: runningBalance,
      });
    }

    return data;
  }, [filteredTransactions, filters.startDate, filters.endDate]);

  // Fluxo de caixa diário (últimos 30 dias ou período filtrado)
  const cashFlow = useMemo(() => {
    const data: { day: string; inflow: number; outflow: number }[] = [];

    // Se há filtros de data, usa período filtrado
    if (filters.startDate || filters.endDate) {
      const dailyMap = new Map<string, { inflow: number; outflow: number }>();

      filteredTransactions.forEach((tx) => {
        const dateStr = tx.date;
        const current = dailyMap.get(dateStr) || { inflow: 0, outflow: 0 };

        if (tx.type === "income") {
          current.inflow += tx.amount || 0;
        } else {
          current.outflow += tx.amount || 0;
        }

        dailyMap.set(dateStr, current);
      });

      const sortedDates = Array.from(dailyMap.keys()).sort();
      sortedDates.forEach((dateStr) => {
        const d = new Date(dateStr + "T00:00:00");
        const dayLabel = d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        const values = dailyMap.get(dateStr)!;
        data.push({
          day: dayLabel,
          inflow: values.inflow,
          outflow: values.outflow,
        });
      });

      return data;
    }

    // Comportamento padrão: últimos 30 dias
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

      const dayTxs = filteredTransactions.filter((tx) => tx.date === dateStr);

      const inflow = dayTxs
        .filter((tx) => tx.type === "income")
        .reduce((acc, tx) => acc + (tx.amount || 0), 0);

      const outflow = dayTxs
        .filter((tx) => tx.type === "expense")
        .reduce((acc, tx) => acc + (tx.amount || 0), 0);

      data.push({ day: dayLabel, inflow, outflow });
    }

    return data;
  }, [filteredTransactions, filters.startDate, filters.endDate]);

  // Gastos por categoria
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === "expense");
    const dataMap = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [filteredTransactions]);

  // Receitas por categoria
  const incomeByCategory = useMemo(() => {
    const incomes = filteredTransactions.filter((t) => t.type === "income");
    const dataMap = incomes.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [filteredTransactions]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const monthCount = monthlyData.length || 1;
    const avgMonthlyIncome =
      monthlyData.reduce((acc, m) => acc + m.income, 0) / monthCount;
    const avgMonthlyExpense =
      monthlyData.reduce((acc, m) => acc + m.expense, 0) / monthCount;
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      avgMonthlyIncome,
      avgMonthlyExpense,
      savingsRate,
    };
  }, [filteredTransactions, monthlyData]);

  const tooltipStyle = {
    contentStyle: {
      borderRadius: "12px",
      border: "none",
      backgroundColor: isDarkMode
        ? "rgba(15, 23, 42, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      color: isDarkMode ? "#fff" : "#1e293b",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
      backdropFilter: "blur(8px)",
    },
  };

  const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({
    icon,
    title,
  }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}
      >
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
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
              Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualize suas finanças em detalhes
            </Typography>
          </Box>

          <Button
            variant={hasActiveFilters ? "contained" : "outlined"}
            startIcon={<FilterListIcon />}
            endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              ...(hasActiveFilters && {
                background: `linear-gradient(135deg, ${alpha(
                  "#6366f1",
                  0.9
                )} 0%, ${alpha("#8b5cf6", 0.9)} 100%)`,
              }),
            }}
          >
            Filtros
            {hasActiveFilters && (
              <Chip
                size="small"
                label={[
                  filters.startDate || filters.endDate ? 1 : 0,
                  filters.type !== "all" ? 1 : 0,
                  filters.categories.length > 0 ? filters.categories.length : 0,
                  filters.paymentMethods.length > 0
                    ? filters.paymentMethods.length
                    : 0,
                ].reduce((a, b) => a + b, 0)}
                sx={{
                  ml: 1,
                  height: 20,
                  minWidth: 20,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "inherit",
                }}
              />
            )}
          </Button>
        </Box>

        {/* Filtros */}
        <Collapse in={showFilters}>
          <Paper
            sx={{
              p: isMobile ? 2 : 3,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha("#1e293b", 0.8)} 0%, ${alpha(
                    "#0f172a",
                    0.9
                  )} 100%)`
                : `linear-gradient(135deg, ${alpha("#f8fafc", 0.9)} 0%, ${alpha(
                    "#e2e8f0",
                    0.5
                  )} 100%)`,
              backdropFilter: "blur(12px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterListIcon fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Filtrar dados
                </Typography>
              </Box>
              {hasActiveFilters && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ textTransform: "none" }}
                >
                  Limpar filtros
                </Button>
              )}
            </Box>

            <Grid container spacing={2}>
              {/* Período */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Data inicial"
                  value={filters.startDate}
                  onChange={(newValue) =>
                    setFilters((prev) => ({ ...prev, startDate: newValue }))
                  }
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      InputProps: {
                        sx: { borderRadius: 2 },
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Data final"
                  value={filters.endDate}
                  onChange={(newValue) =>
                    setFilters((prev) => ({ ...prev, endDate: newValue }))
                  }
                  minDate={filters.startDate || undefined}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      InputProps: {
                        sx: { borderRadius: 2 },
                      },
                    },
                  }}
                />
              </Grid>

              {/* Tipo */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filters.type}
                    label="Tipo"
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: e.target.value as AnalyticsFilters["type"],
                      }))
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="income">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#10b981",
                          }}
                        />
                        Receitas
                      </Box>
                    </MenuItem>
                    <MenuItem value="expense">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#ef4444",
                          }}
                        />
                        Despesas
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Categorias */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categorias</InputLabel>
                  <Select<string[]>
                    multiple
                    value={filters.categories}
                    onChange={handleCategoryChange}
                    input={<OutlinedInput label="Categorias" />}
                    renderValue={(selected) =>
                      selected.length === 0
                        ? ""
                        : `${selected.length} selecionada${
                            selected.length > 1 ? "s" : ""
                          }`
                    }
                    sx={{ borderRadius: 2 }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {availableCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        <Checkbox
                          checked={filters.categories.indexOf(category) > -1}
                          size="small"
                        />
                        <ListItemText primary={category} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Métodos de pagamento */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Pagamento</InputLabel>
                  <Select<string[]>
                    multiple
                    value={filters.paymentMethods}
                    onChange={handlePaymentMethodChange}
                    input={<OutlinedInput label="Pagamento" />}
                    renderValue={(selected) =>
                      selected.length === 0
                        ? ""
                        : `${selected.length} selecionado${
                            selected.length > 1 ? "s" : ""
                          }`
                    }
                    sx={{ borderRadius: 2 }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {availablePaymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        <Checkbox
                          checked={filters.paymentMethods.indexOf(method) > -1}
                          size="small"
                        />
                        <ListItemText primary={method} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Filtros ativos como chips */}
            {hasActiveFilters && (
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}
              >
                {(filters.startDate || filters.endDate) && (
                  <Chip
                    icon={<DateRangeIcon />}
                    label={`${
                      filters.startDate?.format("DD/MM/YY") || "..."
                    } - ${filters.endDate?.format("DD/MM/YY") || "..."}`}
                    onDelete={() =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: null,
                        endDate: null,
                      }))
                    }
                    size="small"
                    sx={{
                      bgcolor: alpha("#6366f1", 0.1),
                      "& .MuiChip-deleteIcon": { color: "primary.main" },
                    }}
                  />
                )}
                {filters.type !== "all" && (
                  <Chip
                    label={filters.type === "income" ? "Receitas" : "Despesas"}
                    onDelete={() =>
                      setFilters((prev) => ({ ...prev, type: "all" }))
                    }
                    size="small"
                    sx={{
                      bgcolor: alpha(
                        filters.type === "income" ? "#10b981" : "#ef4444",
                        0.1
                      ),
                      color: filters.type === "income" ? "#10b981" : "#ef4444",
                      "& .MuiChip-deleteIcon": {
                        color:
                          filters.type === "income" ? "#10b981" : "#ef4444",
                      },
                    }}
                  />
                )}
                {filters.categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    onDelete={() =>
                      setFilters((prev) => ({
                        ...prev,
                        categories: prev.categories.filter((c) => c !== cat),
                      }))
                    }
                    size="small"
                    sx={{ bgcolor: alpha("#8b5cf6", 0.1) }}
                  />
                ))}
                {filters.paymentMethods.map((method) => (
                  <Chip
                    key={method}
                    label={method}
                    onDelete={() =>
                      setFilters((prev) => ({
                        ...prev,
                        paymentMethods: prev.paymentMethods.filter(
                          (m) => m !== method
                        ),
                      }))
                    }
                    size="small"
                    sx={{ bgcolor: alpha("#06b6d4", 0.1) }}
                  />
                ))}
              </Stack>
            )}

            {/* Resumo do filtro */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 2 }}
            >
              {filteredTransactions.length} de {transactions.length} transações
            </Typography>
          </Paper>
        </Collapse>

        {/* Summary Stats */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                background: `linear-gradient(135deg, ${alpha(
                  "#10b981",
                  0.1
                )} 0%, ${alpha("#10b981", 0.02)} 100%)`,
                border: `1px solid ${alpha("#10b981", 0.2)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Média Mensal (Receita)
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(stats.avgMonthlyIncome)}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                background: `linear-gradient(135deg, ${alpha(
                  "#ef4444",
                  0.1
                )} 0%, ${alpha("#ef4444", 0.02)} 100%)`,
                border: `1px solid ${alpha("#ef4444", 0.2)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Média Mensal (Despesa)
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">
                {formatCurrency(stats.avgMonthlyExpense)}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                background: `linear-gradient(135deg, ${alpha(
                  "#6366f1",
                  0.1
                )} 0%, ${alpha("#6366f1", 0.02)} 100%)`,
                border: `1px solid ${alpha("#6366f1", 0.2)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Taxa de Economia
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {stats.savingsRate.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper
              sx={{
                p: 2,
                textAlign: "center",
                background: `linear-gradient(135deg, ${alpha(
                  "#8b5cf6",
                  0.1
                )} 0%, ${alpha("#8b5cf6", 0.02)} 100%)`,
                border: `1px solid ${alpha("#8b5cf6", 0.2)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {hasActiveFilters
                  ? "Transações Filtradas"
                  : "Total de Transações"}
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: "#8b5cf6" }}
              >
                {filteredTransactions.length}
                {hasActiveFilters && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    / {transactions.length}
                  </Typography>
                )}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Monthly Comparison Bar Chart */}
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <SectionHeader icon={<BarChartIcon />} title="Comparativo Mensal" />
          <Box sx={{ height: isMobile ? 250 : 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  axisLine={{
                    stroke: alpha(theme.palette.text.secondary, 0.2),
                  }}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  axisLine={{
                    stroke: alpha(theme.palette.text.secondary, 0.2),
                  }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  {...tooltipStyle}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Receitas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Despesas"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Balance Evolution Line Chart */}
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <SectionHeader icon={<LineChartIcon />} title="Evolução do Saldo" />
          <Box sx={{ height: isMobile ? 250 : 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceEvolution}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  axisLine={{
                    stroke: alpha(theme.palette.text.secondary, 0.2),
                  }}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  axisLine={{
                    stroke: alpha(theme.palette.text.secondary, 0.2),
                  }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  {...tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Saldo"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#6366f1" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Cash Flow Area Chart */}
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <SectionHeader
            icon={<TimelineIcon />}
            title="Fluxo de Caixa (30 dias)"
          />
          <Box sx={{ height: isMobile ? 250 : 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlow}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                  axisLine={{
                    stroke: alpha(theme.palette.text.secondary, 0.2),
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(value) =>
                    value > 0 ? `${(value / 1000).toFixed(1)}k` : "0"
                  }
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  axisLine={{
                    stroke: alpha(theme.palette.text.secondary, 0.2),
                  }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  {...tooltipStyle}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="inflow"
                  name="Entradas"
                  stroke="#10b981"
                  fill={alpha("#10b981", 0.3)}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outflow"
                  name="Saídas"
                  stroke="#ef4444"
                  fill={alpha("#ef4444", 0.3)}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Pie Charts Row */}
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Expenses by Category */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: isMobile ? 2 : 3 }}>
              <SectionHeader
                icon={<PieChartIcon />}
                title="Despesas por Categoria"
              />
              {categoryData.length > 0 ? (
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        {...tooltipStyle}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    Sem despesas no período
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Income by Category */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: isMobile ? 2 : 3 }}>
              <SectionHeader
                icon={<TrendingUpIcon />}
                title="Receitas por Categoria"
              />
              {incomeByCategory.length > 0 ? (
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {incomeByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[(index + 2) % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        {...tooltipStyle}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    Sem receitas no período
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Top Categories Table */}
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <SectionHeader icon={<TrendingDownIcon />} title="Maiores Gastos" />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {categoryData.slice(0, 5).map((cat, index) => (
              <Box
                key={cat.name}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(COLORS[index % COLORS.length], 0.08),
                  border: `1px solid ${alpha(
                    COLORS[index % COLORS.length],
                    0.15
                  )}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Chip
                    label={index + 1}
                    size="small"
                    sx={{
                      bgcolor: COLORS[index % COLORS.length],
                      color: "#fff",
                      fontWeight: 600,
                      minWidth: 32,
                    }}
                  />
                  <Typography fontWeight={500}>{cat.name}</Typography>
                </Box>
                <Typography fontWeight={600} color="error.main">
                  {formatCurrency(cat.value)}
                </Typography>
              </Box>
            ))}
            {categoryData.length === 0 && (
              <Typography
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                Nenhuma despesa registrada
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default AnalyticsView;
