import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  ReferenceLine,
} from "recharts";
import { Transaction } from "../types";
import type { Dayjs } from "dayjs";
import EmptyState from "./EmptyState";

interface AdvancedFiltersInfo {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  type: "all" | "income" | "expense";
  categories: string[];
  paymentMethods: string[];
}

interface AnalyticsViewProps {
  transactions: Transaction[];
  hasAdvancedFilters?: boolean;
  advancedFilters?: AdvancedFiltersInfo;
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

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  transactions, 
  hasAdvancedFilters = false,
  advancedFilters 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  
  // Hook para calcular largura dinâmica dos gráficos
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);
  
  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth - (isMobile ? 32 : 48); // Padding do Paper
      setChartWidth(Math.max(width, 300)); // Mínimo de 300px
    }
  }, [isMobile]);
  
  useEffect(() => {
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [updateWidth]);
  
  // Calcula o "mês atual" baseado na regra do dia 10
  // Até dia 10: mês corrente | Após dia 10: próximo mês
  const currentReferenceMonth = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    if (day <= 10) {
      return { month, year };
    } else {
      // Próximo mês
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      return { month: nextMonth, year: nextYear };
    }
  }, []);
  
  // Gera a chave do mês no formato YYYY-MM
  const getMonthKey = (year: number, month: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  };
  
  // Chave do mês atual de referência
  const currentMonthKey = getMonthKey(currentReferenceMonth.year, currentReferenceMonth.month);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Dados para gráfico de barras mensal
  // Sem filtro avançado: 3 meses antes + atual + 3 meses depois
  // Com filtro avançado: todos os meses com dados no período filtrado
  const monthlyData = useMemo(() => {
    const months: {
      month: string;
      monthKey: string;
      income: number;
      expense: number;
      balance: number;
      isCurrentMonth: boolean;
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

    let keysToShow: string[] = [];
    
    if (!hasAdvancedFilters) {
      // Sem filtro: gera 7 meses (3 antes + atual + 3 depois)
      const { month: refMonth, year: refYear } = currentReferenceMonth;
      
      for (let offset = -3; offset <= 3; offset++) {
        let targetMonth = refMonth + offset;
        let targetYear = refYear;
        
        // Ajusta o ano se necessário
        while (targetMonth < 0) {
          targetMonth += 12;
          targetYear -= 1;
        }
        while (targetMonth > 11) {
          targetMonth -= 12;
          targetYear += 1;
        }
        
        keysToShow.push(getMonthKey(targetYear, targetMonth));
      }
    } else if (advancedFilters?.startDate && advancedFilters?.endDate) {
      // Com filtro avançado com datas: gera meses entre as datas
      const startYear = advancedFilters.startDate.year();
      const startMonth = advancedFilters.startDate.month();
      const endYear = advancedFilters.endDate.year();
      const endMonth = advancedFilters.endDate.month();
      
      let currentYear = startYear;
      let currentMonth = startMonth;
      
      while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth)
      ) {
        keysToShow.push(getMonthKey(currentYear, currentMonth));
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    } else {
      // Com filtro avançado sem datas: mostra todos os meses com dados, ordenados
      keysToShow = Array.from(monthlyMap.keys()).sort();
    }
    
    keysToShow.forEach((key) => {
      const [year, month] = key.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthStr = d
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "");
      const data = monthlyMap.get(key) || { income: 0, expense: 0 };
      const isCurrentMonth = key === currentMonthKey;

      months.push({
        month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
        monthKey: key,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
        isCurrentMonth,
      });
    });

    return months;
  }, [transactions, hasAdvancedFilters, advancedFilters, currentReferenceMonth, currentMonthKey, getMonthKey]);

  // Evolução do saldo ao longo do tempo
  // Sem filtro avançado: 3 meses antes + atual + 3 meses depois
  // Com filtro avançado: todos os meses com dados
  const balanceEvolution = useMemo(() => {
    const data: { 
      date: string; 
      monthKey: string; 
      balance: number; 
      income: number;
      expense: number;
      monthBalance: number;
      isCurrentMonth: boolean 
    }[] = [];

    // Ordena transações por data
    const sortedTxs = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Agrupa por mês com detalhes de receita e despesa
    const monthlyData = new Map<string, { income: number; expense: number }>();

    sortedTxs.forEach((tx) => {
      const [year, month] = tx.date.split("-");
      const key = `${year}-${month}`;
      const current = monthlyData.get(key) || { income: 0, expense: 0 };
      
      if (tx.type === "income") {
        current.income += tx.amount || 0;
      } else {
        current.expense += tx.amount || 0;
      }
      
      monthlyData.set(key, current);
    });

    let keysToShow: string[] = [];
    
    if (!hasAdvancedFilters) {
      // Sem filtro: gera 7 meses (3 antes + atual + 3 depois)
      const { month: refMonth, year: refYear } = currentReferenceMonth;
      
      for (let offset = -3; offset <= 3; offset++) {
        let targetMonth = refMonth + offset;
        let targetYear = refYear;
        
        while (targetMonth < 0) {
          targetMonth += 12;
          targetYear -= 1;
        }
        while (targetMonth > 11) {
          targetMonth -= 12;
          targetYear += 1;
        }
        
        keysToShow.push(getMonthKey(targetYear, targetMonth));
      }
    } else if (advancedFilters?.startDate && advancedFilters?.endDate) {
      // Com filtro avançado com datas: gera meses entre as datas
      const startYear = advancedFilters.startDate.year();
      const startMonth = advancedFilters.startDate.month();
      const endYear = advancedFilters.endDate.year();
      const endMonth = advancedFilters.endDate.month();
      
      let currentYear = startYear;
      let currentMonth = startMonth;
      
      while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth)
      ) {
        keysToShow.push(getMonthKey(currentYear, currentMonth));
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    } else {
      // Com filtro avançado sem datas: mostra todos os meses com dados
      keysToShow = Array.from(monthlyData.keys()).sort();
    }

    // Calcula o saldo acumulado até o primeiro mês exibido
    const allKeys = Array.from(monthlyData.keys()).sort();
    let runningBalance = 0;
    
    // Soma os saldos dos meses anteriores ao primeiro mês exibido
    for (const key of allKeys) {
      if (keysToShow.includes(key)) break;
      const monthData = monthlyData.get(key);
      if (monthData) {
        runningBalance += monthData.income - monthData.expense;
      }
    }
    
    keysToShow.forEach((key) => {
      const [year, month] = key.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthLabel = d.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      const monthData = monthlyData.get(key) || { income: 0, expense: 0 };
      const monthBalance = monthData.income - monthData.expense;
      runningBalance += monthBalance;
      
      data.push({
        date: monthLabel,
        monthKey: key,
        balance: runningBalance,
        income: monthData.income,
        expense: monthData.expense,
        monthBalance,
        isCurrentMonth: key === currentMonthKey,
      });
    });

    return data;
  }, [transactions, hasAdvancedFilters, advancedFilters, currentReferenceMonth, currentMonthKey, getMonthKey]);

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

  return (
    <Box
      ref={containerRef}
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: isMobile ? 2 : 3,
        // Extra padding para bottom navigation
        pb: { xs: "140px", md: 0 },
        // Fix para ResponsiveContainer funcionar corretamente em flexbox
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Summary Stats */}
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
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
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600, position: "relative", zIndex: 1 }}>
              Média Mensal (Receita)
            </Typography>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#059669", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {formatCurrency(stats.avgMonthlyIncome)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
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
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600, position: "relative", zIndex: 1 }}>
              Média Mensal (Despesa)
            </Typography>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#DC2626", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {formatCurrency(stats.avgMonthlyExpense)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
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
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600, position: "relative", zIndex: 1 }}>
              Taxa de Economia
            </Typography>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#6366f1", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {stats.savingsRate.toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 1.5 : 2,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#8b5cf6", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(167, 139, 250, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600, position: "relative", zIndex: 1 }}>
              Total de Transações
            </Typography>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#8b5cf6", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              {stats.transactionCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Monthly Comparison Bar Chart */}
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          borderRadius: "20px",
          boxShadow: `0 6px 24px -6px ${alpha("#6366f1", 0.1)}`,
        }}
      >
        <SectionHeader icon={<BarChartIcon />} title="Comparativo Mensal" />
        <Box sx={{ width: "100%", height: isMobile ? 250 : 300, overflowX: "auto" }}>
          <BarChart data={monthlyData} barGap={4} width={chartWidth} height={isMobile ? 250 : 300}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}
              />
              <XAxis
                dataKey="month"
                tick={(props) => {
                  const { x, y, payload } = props;
                  const dataIndex = monthlyData.findIndex(d => d.month === payload.value);
                  const isCurrentMonth = dataIndex >= 0 && monthlyData[dataIndex]?.isCurrentMonth;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="middle"
                        fill={isCurrentMonth ? "#6366f1" : theme.palette.text.secondary}
                        fontSize={12}
                        fontWeight={isCurrentMonth ? 700 : 400}
                      >
                        {payload.value}
                        {isCurrentMonth && " •"}
                      </text>
                    </g>
                  );
                }}
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
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  <span style={{ color: name === "Despesas" ? "#ef4444" : "#10b981" }}>{name}</span>
                ]}
                contentStyle={{
                  backgroundColor: isDarkMode ? alpha("#1e1e2e", 0.95) : alpha("#ffffff", 0.95),
                  border: `1px solid ${isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}`,
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
                labelStyle={{ color: theme.palette.text.primary, fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ padding: "2px 0" }}
              />
              <Legend 
                content={() => (
                  <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 12, backgroundColor: "#ef4444", borderRadius: 2 }} />
                      <span style={{ color: "#ef4444", fontSize: 12 }}>Despesas</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 12, backgroundColor: "#10b981", borderRadius: 2 }} />
                      <span style={{ color: "#10b981", fontSize: 12 }}>Receitas</span>
                    </div>
                  </div>
                )}
              />
              <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell 
                    key={`expense-${index}`} 
                    fill={entry.isCurrentMonth ? "#dc2626" : "#ef4444"}
                    stroke={entry.isCurrentMonth ? "#6366f1" : "none"}
                    strokeWidth={entry.isCurrentMonth ? 2 : 0}
                  />
                ))}
              </Bar>
              <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell 
                    key={`income-${index}`} 
                    fill={entry.isCurrentMonth ? "#059669" : "#10b981"}
                    stroke={entry.isCurrentMonth ? "#6366f1" : "none"}
                    strokeWidth={entry.isCurrentMonth ? 2 : 0}
                  />
                ))}
              </Bar>
          </BarChart>
        </Box>
      </Paper>

      {/* Balance Evolution Line Chart */}
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          borderRadius: "20px",
          boxShadow: `0 6px 24px -6px ${alpha("#6366f1", 0.1)}`,
        }}
      >
        <SectionHeader icon={<LineChartIcon />} title="Evolução do Saldo" />
        <Box sx={{ width: "100%", height: isMobile ? 250 : 300, overflowX: "auto" }}>
          <LineChart data={balanceEvolution} width={chartWidth} height={isMobile ? 250 : 300}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}
              />
              <XAxis
                dataKey="date"
                tick={(props) => {
                  const { x, y, payload } = props;
                  const dataIndex = balanceEvolution.findIndex(d => d.date === payload.value);
                  const isCurrentMonth = dataIndex >= 0 && balanceEvolution[dataIndex]?.isCurrentMonth;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="middle"
                        fill={isCurrentMonth ? "#6366f1" : theme.palette.text.secondary}
                        fontSize={11}
                        fontWeight={isCurrentMonth ? 700 : 400}
                      >
                        {payload.value}
                        {isCurrentMonth && " •"}
                      </text>
                    </g>
                  );
                }}
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
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      backgroundColor: isDarkMode ? alpha("#1e1e2e", 0.95) : alpha("#ffffff", 0.95),
                      border: `1px solid ${isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}`,
                      borderRadius: "12px",
                      padding: "12px 16px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, color: theme.palette.text.primary }}>
                        {label} {data.isCurrentMonth && "• Mês Atual"}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                        <div style={{ color: "#10b981" }}>
                          Receitas: {formatCurrency(data.income)}
                        </div>
                        <div style={{ color: "#ef4444" }}>
                          Despesas: {formatCurrency(data.expense)}
                        </div>
                        <div style={{ 
                          color: data.monthBalance >= 0 ? "#10b981" : "#ef4444",
                          borderTop: `1px solid ${isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}`,
                          paddingTop: 4,
                          marginTop: 4,
                        }}>
                          Saldo do Mês: {formatCurrency(data.monthBalance)}
                        </div>
                        <div style={{ 
                          color: data.balance >= 0 ? "#6366f1" : "#ef4444",
                          fontWeight: 600,
                        }}>
                          Saldo Acumulado: {formatCurrency(data.balance)}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              {/* Linha de referência vertical para o mês atual */}
              {balanceEvolution.find(d => d.isCurrentMonth) && (
                <ReferenceLine
                  x={balanceEvolution.find(d => d.isCurrentMonth)?.date}
                  stroke="#6366f1"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: "Atual",
                    position: "top",
                    fill: "#6366f1",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="balance"
                name="Saldo"
                stroke="#6366f1"
                strokeWidth={3}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isCurrentMonth = payload?.isCurrentMonth;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isCurrentMonth ? 8 : 4}
                      fill={isCurrentMonth ? "#6366f1" : "#6366f1"}
                      stroke={isCurrentMonth ? "#fff" : "none"}
                      strokeWidth={isCurrentMonth ? 3 : 0}
                    />
                  );
                }}
                activeDot={{ r: 8, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
              />
          </LineChart>
        </Box>
      </Paper>

      {/* Cash Flow Area Chart */}
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          borderRadius: "20px",
          boxShadow: `0 6px 24px -6px ${alpha("#6366f1", 0.1)}`,
        }}
      >
        <SectionHeader
          icon={<TimelineIcon />}
          title="Fluxo de Caixa"
        />
        <Box sx={{ width: "100%", height: isMobile ? 250 : 300, overflowX: "auto" }}>
          <AreaChart data={cashFlow} width={chartWidth} height={isMobile ? 250 : 300}>
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
        </Box>
      </Paper>

      {/* Pie Charts Row */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ minWidth: 0 }}>
        {/* Expenses by Category */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 2 : 3,
              position: "relative",
              overflow: "hidden",
              minWidth: 0,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              borderRadius: "20px",
              boxShadow: `0 6px 24px -6px ${alpha("#DC2626", 0.1)}`,
            }}
          >
            <SectionHeader
              icon={<PieChartIcon />}
              title="Despesas por Categoria"
            />
            {categoryData.length > 0 ? (
              <Box sx={{ width: "100%", height: 280, display: "flex", justifyContent: "center" }}>
                <PieChart width={isMobile ? chartWidth : Math.min(chartWidth / 2 - 24, 400)} height={280}>
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
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0];
                        const color = data.payload?.fill || COLORS[0];
                        return (
                          <div style={{
                            backgroundColor: isDarkMode ? alpha("#1e1e2e", 0.95) : alpha("#ffffff", 0.95),
                            border: `1px solid ${isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}`,
                            borderRadius: "12px",
                            padding: "10px 14px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 2 }} />
                              <span style={{ color, fontWeight: 600 }}>{data.name}</span>
                            </div>
                            <div style={{ color: theme.palette.text.primary, marginTop: 4 }}>
                              {formatCurrency(data.value as number)}
                            </div>
                          </div>
                        );
                      }}
                    />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
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
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 2 : 3,
              position: "relative",
              overflow: "hidden",
              minWidth: 0,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              borderRadius: "20px",
              boxShadow: `0 6px 24px -6px ${alpha("#059669", 0.1)}`,
            }}
          >
            <SectionHeader
              icon={<TrendingUpIcon />}
              title="Receitas por Categoria"
            />
            {incomeByCategory.length > 0 ? (
              <Box sx={{ width: "100%", height: 280, display: "flex", justifyContent: "center" }}>
                <PieChart width={isMobile ? chartWidth : Math.min(chartWidth / 2 - 24, 400)} height={280}>
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
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0];
                      const color = data.payload?.fill || COLORS[2];
                      return (
                        <div style={{
                          backgroundColor: isDarkMode ? alpha("#1e1e2e", 0.95) : alpha("#ffffff", 0.95),
                          border: `1px solid ${isDarkMode ? alpha("#fff", 0.1) : alpha("#000", 0.1)}`,
                          borderRadius: "12px",
                          padding: "10px 14px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 2 }} />
                            <span style={{ color, fontWeight: 600 }}>{data.name}</span>
                          </div>
                          <div style={{ color: theme.palette.text.primary, marginTop: 4 }}>
                            {formatCurrency(data.value as number)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
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
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          position: "relative",
          overflow: "hidden",
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(16px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          borderRadius: "20px",
          boxShadow: `0 6px 24px -6px ${alpha("#DC2626", 0.1)}`,
        }}
      >
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
                borderRadius: "20px",
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
            <Box sx={{ py: 2 }}>
              <EmptyState
                type="transactions"
                title="Nenhuma despesa registrada"
                description="Não há despesas para exibir no gráfico"
                compact
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AnalyticsView;
