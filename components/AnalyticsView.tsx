import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  useMediaQuery,
  useTheme,
  alpha,
  Chip,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
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
import { Transaction } from "../types";

interface AnalyticsViewProps {
  transactions: Transaction[];
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Dados dos últimos 6 meses para gráfico de barras
  const monthlyData = useMemo(() => {
    const months: {
      month: string;
      income: number;
      expense: number;
      balance: number;
    }[] = [];

    // Agrupa por mês as transações
    const monthlyMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx) => {
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
    // Pega os últimos 6 meses
    const recentKeys = sortedKeys.slice(-6);
    
    recentKeys.forEach((key) => {
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
  }, [transactions]);

  // Evolução do saldo ao longo do tempo
  const balanceEvolution = useMemo(() => {
    const data: { date: string; balance: number }[] = [];
    let runningBalance = 0;

    // Ordena transações por data
    const sortedTxs = [...transactions].sort(
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

    const sortedKeys = Array.from(monthlyBalances.keys()).sort();
    // Pega os últimos 12 meses
    const recentKeys = sortedKeys.slice(-12);
    
    recentKeys.forEach((key) => {
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
  }, [transactions]);

  // Fluxo de caixa diário (últimos 30 dias)
  const cashFlow = useMemo(() => {
    const data: { day: string; inflow: number; outflow: number }[] = [];
    const dailyMap = new Map<string, { inflow: number; outflow: number }>();

    transactions.forEach((tx) => {
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
    // Pega os últimos 30 dias com dados
    const recentDates = sortedDates.slice(-30);
    
    recentDates.forEach((dateStr) => {
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
  }, [transactions]);

  // Gastos por categoria
  const categoryData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const dataMap = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [transactions]);

  // Receitas por categoria
  const incomeByCategory = useMemo(() => {
    const incomes = transactions.filter((t) => t.type === "income");
    const dataMap = incomes.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [transactions]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const totalExpense = transactions
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
      transactionCount: transactions.length,
    };
  }, [transactions, monthlyData]);

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
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}
    >
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
              Total de Transações
            </Typography>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: "#8b5cf6" }}
            >
              {stats.transactionCount}
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
          title="Fluxo de Caixa"
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
  );
};

export default AnalyticsView;
