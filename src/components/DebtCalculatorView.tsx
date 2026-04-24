import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
} from "recharts";
import { InfoOutlined as InfoIcon } from "@mui/icons-material";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type AmortizationType = "price" | "sac";

interface AmortizationRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

function calcPrice(principal: number, monthlyRate: number, months: number): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  if (monthlyRate === 0) {
    const payment = principal / months;
    let balance = principal;
    for (let i = 1; i <= months; i++) {
      balance -= payment;
      rows.push({ month: i, payment, interest: 0, principal: payment, balance: Math.max(0, balance) });
    }
    return rows;
  }
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const principalPart = payment - interest;
    balance -= principalPart;
    rows.push({ month: i, payment, interest, principal: principalPart, balance: Math.max(0, balance) });
  }
  return rows;
}

function calcSAC(principal: number, monthlyRate: number, months: number): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const principalPart = principal / months;
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const payment = principalPart + interest;
    balance -= principalPart;
    rows.push({ month: i, payment, interest, principal: principalPart, balance: Math.max(0, balance) });
  }
  return rows;
}

const DebtCalculatorView: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setChartWidth(Math.max(el.offsetWidth - 48, 280));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [principal, setPrincipal] = useState("10000");
  const [annualRate, setAnnualRate] = useState("12");
  const [months, setMonths] = useState("24");
  const [amortType, setAmortType] = useState<AmortizationType>("price");
  const [showAllRows, setShowAllRows] = useState(false);

  const parsedPrincipal = parseFloat(principal.replace(",", ".")) || 0;
  const parsedAnnualRate = parseFloat(annualRate.replace(",", ".")) || 0;
  const parsedMonths = parseInt(months) || 0;
  const monthlyRate = parsedAnnualRate / 100 / 12;

  const priceRows = useMemo(
    () => parsedPrincipal > 0 && parsedMonths > 0 ? calcPrice(parsedPrincipal, monthlyRate, parsedMonths) : [],
    [parsedPrincipal, monthlyRate, parsedMonths]
  );

  const sacRows = useMemo(
    () => parsedPrincipal > 0 && parsedMonths > 0 ? calcSAC(parsedPrincipal, monthlyRate, parsedMonths) : [],
    [parsedPrincipal, monthlyRate, parsedMonths]
  );

  const activeRows = amortType === "price" ? priceRows : sacRows;

  const totalPaid = activeRows.reduce((s, r) => s + r.payment, 0);
  const totalInterest = activeRows.reduce((s, r) => s + r.interest, 0);
  const firstPayment = activeRows[0]?.payment || 0;
  const lastPayment = activeRows[activeRows.length - 1]?.payment || 0;

  // Comparativo Price vs SAC
  const compareData = useMemo(() => {
    if (priceRows.length === 0) return [];
    return Array.from({ length: parsedMonths }, (_, i) => ({
      month: i + 1,
      price: priceRows[i]?.balance || 0,
      sac: sacRows[i]?.balance || 0,
    }));
  }, [priceRows, sacRows, parsedMonths]);

  // Chart data — first 12 or all months
  const chartData = useMemo(() => {
    const rows = activeRows.slice(0, Math.min(24, activeRows.length));
    return rows.map((r) => ({
      month: `M${r.month}`,
      Juros: parseFloat(r.interest.toFixed(2)),
      Amortização: parseFloat(r.principal.toFixed(2)),
      Saldo: parseFloat(r.balance.toFixed(2)),
    }));
  }, [activeRows]);

  const displayRows = showAllRows ? activeRows : activeRows.slice(0, 12);

  const cardSx = {
    p: 2.5,
    borderRadius: "16px",
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: isDark ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.9),
    flex: 1,
    minWidth: 130,
  };

  const legendDot = (color: string, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: color }} />
      <span style={{ fontSize: 11, color: theme.palette.text.secondary }}>{label}</span>
    </div>
  );

  return (
    <Box ref={containerRef} sx={{ display: "flex", flexDirection: "column", gap: 3, pb: { xs: "140px", md: 0 } }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight="bold">Calculadora de Dívidas</Typography>
        <Typography variant="body2" color="text.secondary">
          Compare amortização Price e SAC, simule pagamentos e visualize a evolução do saldo
        </Typography>
      </Box>

      {/* Inputs */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle2" fontWeight={700} mb={2}>Parâmetros da Dívida</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Valor da dívida (R$)"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 160 }}
            inputProps={{ inputMode: "decimal" }}
          />
          <TextField
            label="Taxa de juros anual (%)"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 160 }}
            inputProps={{ inputMode: "decimal" }}
            helperText={`≈ ${(parsedAnnualRate / 100 / 12 * 100).toFixed(3)}% ao mês`}
          />
          <TextField
            label="Número de parcelas"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 140 }}
            inputProps={{ inputMode: "numeric" }}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Método</Typography>
            <ToggleButtonGroup
              value={amortType}
              exclusive
              onChange={(_, v) => v && setAmortType(v)}
              size="small"
            >
              <ToggleButton value="price" sx={{ px: 2, fontSize: 12 }}>
                Price
                <Tooltip title="Parcelas fixas. Maior custo total de juros.">
                  <InfoIcon sx={{ fontSize: 14, ml: 0.5, opacity: 0.5 }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="sac" sx={{ px: 2, fontSize: 12 }}>
                SAC
                <Tooltip title="Amortização constante. Parcelas decrescentes. Menor custo total.">
                  <InfoIcon sx={{ fontSize: 14, ml: 0.5, opacity: 0.5 }} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>

      {activeRows.length > 0 && (
        <>
          {/* Summary */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">1ª Parcela</Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">{formatCurrency(firstPayment)}</Typography>
              {amortType === "sac" && (
                <Typography variant="caption" color="text.secondary">Última: {formatCurrency(lastPayment)}</Typography>
              )}
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">Total Pago</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(totalPaid)}</Typography>
              <Typography variant="caption" color="text.secondary">Em {parsedMonths}x</Typography>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, borderColor: alpha(theme.palette.error.main, 0.25) }}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">Total Juros</Typography>
              <Typography variant="h6" fontWeight={700} color="error.main">{formatCurrency(totalInterest)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {parsedPrincipal > 0 ? ((totalInterest / parsedPrincipal) * 100).toFixed(1) : 0}% do principal
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, borderColor: alpha(theme.palette.success.main, 0.25) }}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">Economia SAC</Typography>
              {priceRows.length > 0 && sacRows.length > 0 ? (
                <>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {formatCurrency(
                      priceRows.reduce((s, r) => s + r.interest, 0) - sacRows.reduce((s, r) => s + r.interest, 0)
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">vs. Price</Typography>
                </>
              ) : <Typography variant="body2" color="text.disabled">—</Typography>}
            </Paper>
          </Box>

          {/* Balance evolution chart */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Evolução do Saldo Devedor</Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 1.5 }}>
              {legendDot(theme.palette.primary.main, "Price")}
              {legendDot(theme.palette.success.main, "SAC")}
            </Box>
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <LineChart width={chartWidth} height={200} data={compareData.slice(0, Math.min(48, compareData.length))}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={42} />
                <RechartsTooltip formatter={(v: number) => [formatCurrency(v)]} />
                <Line type="monotone" dataKey="price" stroke={theme.palette.primary.main} dot={false} name="Price" strokeWidth={2} />
                <Line type="monotone" dataKey="sac" stroke={theme.palette.success.main} dot={false} name="SAC" strokeWidth={2} />
              </LineChart>
            </Box>
          </Paper>

          {/* Interest/Principal breakdown */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Composição da Parcela — {amortType === "price" ? "Price" : "SAC"} (primeiros 24 meses)
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 1.5 }}>
              {legendDot(theme.palette.error.main, "Juros")}
              {legendDot(theme.palette.primary.main, "Amortização")}
            </Box>
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <BarChart width={chartWidth} height={200} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={42} />
                <RechartsTooltip formatter={(v: number) => [formatCurrency(v)]} />
                <Bar dataKey="Juros" stackId="a" fill={theme.palette.error.main} />
                <Bar dataKey="Amortização" stackId="a" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
              </BarChart>
            </Box>
          </Paper>

          {/* Amortization table */}
          <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ p: 2.5, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Tabela de Amortização — {amortType === "price" ? "Price" : "SAC"}
              </Typography>
              <Chip
                label={showAllRows ? "Ver menos" : `Ver todas ${parsedMonths} parcelas`}
                size="small"
                onClick={() => setShowAllRows((v) => !v)}
                sx={{ cursor: "pointer", height: 22, fontSize: 10 }}
              />
            </Box>
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" } }}>
                    <TableCell>#</TableCell>
                    <TableCell align="right">Parcela</TableCell>
                    <TableCell align="right">Juros</TableCell>
                    <TableCell align="right">Amortização</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayRows.map((row) => (
                    <TableRow key={row.month} sx={{ "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) } }}>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12, color: "text.secondary" }}>{row.month}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>
                        {formatCurrency(row.payment)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: 12, color: "error.main" }}>
                        {formatCurrency(row.interest)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: 12, color: "primary.main" }}>
                        {formatCurrency(row.principal)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        {formatCurrency(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {activeRows.length === 0 && (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Preencha os campos acima para simular a amortização.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DebtCalculatorView;
