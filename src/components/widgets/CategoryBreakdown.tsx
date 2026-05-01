import React, { useContext, useLayoutEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Transaction, TransactionType } from "../../types";
import { useSettings } from "../../contexts";
import { useLayoutSpacing } from "../../hooks";

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  secondaryColor: string;
}

interface CategoryBreakdownProps {
  transactions: Transaction[];
  onPaymentMethodClick?: (paymentMethod: string) => void;
  onCategoryClick?: (category: string, type: TransactionType) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);


// ─── Card reutilizável ────────────────────────────────────────────────────────

interface PieChartCardProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  data: PieDataItem[];
  total: number;
  centerLabel: string;
  emptyMessage: string;
  totalLabel?: string;
  totalColor?: string;
  onSliceClick?: (name: string) => void;
}

const PieChartCard: React.FC<PieChartCardProps> = ({
  title,
  icon,
  accentColor,
  data,
  total,
  centerLabel,
  emptyMessage,
  totalLabel = "Total",
  totalColor = "text.primary",
  onSliceClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Medir largura real do container para passar ao PieChart diretamente
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = isMobile ? 190 : 230;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width || el.offsetWidth;
      if (w > 0) setChartWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tooltipStyle = {
    borderRadius: "12px",
    border: "none",
    backgroundColor: isDarkMode ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.98)",
    color: isDarkMode ? "#f1f5f9" : "#0f172a",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
    fontSize: 13,
    padding: "8px 12px",
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 1.5 : 2.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: isDarkMode
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
          : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
        backdropFilter: "blur(16px)",
        border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        borderRadius: isMobile ? "16px" : "20px",
        boxShadow: `0 6px 24px -6px ${alpha(accentColor, 0.18)}`,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 1.5, mb: 2 }}>
        <Box
          sx={{
            p: isMobile ? 0.75 : 1,
            borderRadius: isMobile ? "12px" : "20px",
            bgcolor: alpha(accentColor, 0.12),
            display: "flex",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ fontSize: isMobile ? 14 : undefined }}
        >
          {title}
        </Typography>
      </Box>

      {/* Container do chart sempre no DOM para que o useLayoutEffect meça corretamente */}
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          height: data.length === 0 ? "auto" : chartHeight,
          minHeight: data.length === 0 ? 80 : undefined,
          width: "100%",
          flexShrink: 0,
          display: data.length === 0 ? "flex" : "block",
          alignItems: "center",
          justifyContent: "center",
          py: data.length === 0 ? 3 : 0,
        }}
      >
        {data.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {emptyMessage}
          </Typography>
        ) : (
          <>
            {chartWidth > 0 && (
              <PieChart width={chartWidth} height={chartHeight} style={{ position: "absolute", top: 0, left: 0 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 52 : 68}
                  outerRadius={isMobile ? 78 : 98}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_entry, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(entry) => onSliceClick?.(entry.name as string)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                      style={{ cursor: onSliceClick ? "pointer" : "default", outline: "none" }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [formatCurrency(value as number), ""]}
                  separator=""
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: isDarkMode ? "#e2e8f0" : "#334155" }}
                  wrapperStyle={{ zIndex: 9999 }}
                  cursor={false}
                />
              </PieChart>
            )}

            {/* Total no centro do donut */}
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                {centerLabel}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ fontSize: isMobile ? 13 : 15, color: accentColor, lineHeight: 1.3 }}
              >
                {formatCurrency(total)}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Legenda interativa - só quando há dados */}
      {data.length > 0 && (
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.25, flex: 1 }}>
          {data.map((item, index) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              const isActive = activeIndex === index;

              return (
                <Box
                  key={item.name}
                  onClick={() => onSliceClick?.(item.name)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.6,
                    px: 1,
                    borderRadius: "10px",
                    cursor: onSliceClick ? "pointer" : "default",
                    transition: "all 0.15s ease",
                    bgcolor: isActive ? alpha(item.color, 0.1) : "transparent",
                    border: `1px solid ${isActive ? alpha(item.color, 0.25) : "transparent"}`,
                    "&:hover": onSliceClick
                      ? { bgcolor: alpha(item.color, 0.1), border: `1px solid ${alpha(item.color, 0.25)}` }
                      : {},
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: `linear-gradient(135deg, ${item.color}, ${item.secondaryColor})`,
                        boxShadow: isActive ? `0 0 6px ${alpha(item.color, 0.6)}` : "none",
                        transition: "box-shadow 0.15s ease",
                      }}
                    />
                    <Typography
                      variant="caption"
                      fontWeight={isActive ? 600 : 500}
                      noWrap
                      sx={{ flex: 1, color: isActive ? item.color : "text.primary", transition: "color 0.15s ease" }}
                    >
                      {item.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ color: item.color, fontSize: 12 }}
                    >
                      {formatCurrency(item.value)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        minWidth: 28,
                        textAlign: "right",
                        fontSize: 11,
                      }}
                    >
                      {pct.toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {/* Linha de total */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 1,
                mt: 0.5,
                borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              }}
            >
              <Typography
                variant="caption"
                fontWeight={500}
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10 }}
              >
                {totalLabel}
              </Typography>
              <Typography variant="body2" fontWeight={700} color={totalColor}>
                {formatCurrency(total)}
              </Typography>
            </Box>
          </Box>
        )}
    </Paper>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  onPaymentMethodClick,
  onCategoryClick,
}) => {
  const { getCategoryColor, getPaymentMethodColor } = useSettings();
  const { gridSpacing } = useLayoutSpacing();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ── Income by category ──
  const incomeByCategory = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  const incomeData: PieDataItem[] = Object.entries(incomeByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => {
      const c = getCategoryColor("income", name);
      return { name, value, color: c.primary, secondaryColor: c.secondary };
    });

  const totalIncome = incomeData.reduce((s, d) => s + d.value, 0);

  // ── Expense by category ──
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  const expenseData: PieDataItem[] = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => {
      const c = getCategoryColor("expense", name);
      return { name, value, color: c.primary, secondaryColor: c.secondary };
    });

  const totalExpense = expenseData.reduce((s, d) => s + d.value, 0);

  // ── Expense by payment method ──
  const expenseByPaymentMethod = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      acc[curr.paymentMethod] = (acc[curr.paymentMethod] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);

  const paymentData: PieDataItem[] = Object.entries(expenseByPaymentMethod)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => {
      const c = getPaymentMethodColor(name);
      return { name, value, color: c.primary, secondaryColor: c.secondary };
    });

  const totalPayment = paymentData.reduce((s, d) => s + d.value, 0);

  return (
    <Grid container spacing={gridSpacing}>
      {/* Income by Category */}
      <Grid size={{ xs: 12, md: 6, xl: 4 }}>
        <PieChartCard
          title="Income by Category"
          icon={
            <TrendingUpIcon
              sx={{ fontSize: isMobile ? 18 : 22, color: "#059669" }}
            />
          }
          accentColor="#059669"
          data={incomeData}
          total={totalIncome}
          centerLabel="Receitas"
          emptyMessage="Nenhuma receita neste período"
          totalLabel="Total receitas"
          totalColor="success.main"
          onSliceClick={
            onCategoryClick
              ? (name) => onCategoryClick(name, "income")
              : undefined
          }
        />
      </Grid>

      {/* Expense by Category */}
      <Grid size={{ xs: 12, md: 6, xl: 4 }}>
        <PieChartCard
          title="Expenses by Category"
          icon={
            <TrendingDownIcon
              sx={{ fontSize: isMobile ? 18 : 22, color: "#DC2626" }}
            />
          }
          accentColor="#DC2626"
          data={expenseData}
          total={totalExpense}
          centerLabel="Despesas"
          emptyMessage="Nenhuma despesa neste período"
          totalLabel="Total despesas"
          totalColor="error.main"
          onSliceClick={
            onCategoryClick
              ? (name) => onCategoryClick(name, "expense")
              : undefined
          }
        />
      </Grid>

      {/* Expense by Payment Method */}
      <Grid size={{ xs: 12, md: 12, xl: 4 }}>
        <PieChartCard
          title="Expenses by Payment Method"
          icon={
            <CreditCardIcon
              sx={{ fontSize: isMobile ? 18 : 22, color: "#6366f1" }}
            />
          }
          accentColor="#6366f1"
          data={paymentData}
          total={totalPayment}
          centerLabel="Pagamentos"
          emptyMessage="Nenhuma despesa neste período"
          totalLabel="Total pagamentos"
          totalColor="primary.main"
          onSliceClick={onPaymentMethodClick}
        />
      </Grid>
    </Grid>
  );
};

export default CategoryBreakdown;
