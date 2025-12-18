import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  useMediaQuery,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { FinancialSummary, Transaction } from "../types";

interface SummaryCardsProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  selectedMonth?: number;
  selectedYear?: number;
}

// Configuração de cores para os cards - paleta sofisticada
const cardStyles = {
  balance: {
    positive: {
      iconBg: "#059669", // Emerald
      iconBgLight: "#D1FAE5",
      accentColor: "#059669",
      gradientLight: "linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)",
      gradientDark: "linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)",
    },
    negative: {
      iconBg: "#DC2626", // Red
      iconBgLight: "#FEE2E2",
      accentColor: "#DC2626",
      gradientLight: "linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)",
      gradientDark: "linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)",
    },
  },
  income: {
    iconBg: "#059669",
    iconBgLight: "#D1FAE5",
    accentColor: "#059669",
    gradientLight: "linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)",
    gradientDark: "linear-gradient(135deg, rgba(5, 150, 105, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)",
  },
  expense: {
    iconBg: "#DC2626",
    iconBgLight: "#FEE2E2",
    accentColor: "#DC2626",
    gradientLight: "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
    gradientDark: "linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%)",
  },
};

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, transactions, selectedMonth, selectedYear }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calcula comparação com mês anterior
  const comparison = useMemo(() => {
    const now = new Date();
    const currentMonth = selectedMonth ?? now.getMonth();
    const currentYear = selectedYear ?? now.getFullYear();
    
    // Mês anterior
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Transações do mês anterior
    const prevMonthTxs = transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      return parseInt(y) === prevYear && parseInt(m) === prevMonth + 1;
    });

    const prevIncome = prevMonthTxs
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    const prevExpense = prevMonthTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    // Porcentagem de mudança
    const incomeChange = prevIncome > 0 
      ? Math.round(((summary.totalIncome - prevIncome) / prevIncome) * 100) 
      : summary.totalIncome > 0 ? 100 : 0;
    
    const expenseChange = prevExpense > 0 
      ? Math.round(((summary.totalExpense - prevExpense) / prevExpense) * 100) 
      : summary.totalExpense > 0 ? 100 : 0;

    // Progresso relativo ao mês anterior (para barras)
    const incomeProgress = prevIncome > 0 
      ? Math.min((summary.totalIncome / prevIncome) * 100, 100) 
      : summary.totalIncome > 0 ? 100 : 0;
    
    const expenseProgress = prevExpense > 0 
      ? Math.min((summary.totalExpense / prevExpense) * 100, 100) 
      : summary.totalExpense > 0 ? 100 : 0;

    return {
      prevIncome,
      prevExpense,
      incomeChange,
      expenseChange,
      incomeProgress,
      expenseProgress,
    };
  }, [transactions, summary, selectedMonth, selectedYear]);

  const isPositiveBalance = summary.balance >= 0;

  // Estilos base do card com Glassmorphism
  const getGlassCardStyles = (accentColor: string, gradient: string) => ({
    height: "100%",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    // Glassmorphism
    background: isDarkMode
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
      : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
    // Sombra com tonalidade
    boxShadow: isDarkMode
      ? `0 8px 32px -8px ${alpha(accentColor, 0.2)}, 0 4px 16px -4px ${alpha("#000000", 0.3)}`
      : `0 8px 32px -8px ${alpha(accentColor, 0.15)}, 0 4px 16px -4px ${alpha("#64748B", 0.08)}`,
    // Hover effects
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: isDarkMode
        ? `0 16px 48px -8px ${alpha(accentColor, 0.3)}, 0 8px 24px -4px ${alpha("#000000", 0.4)}`
        : `0 16px 48px -8px ${alpha(accentColor, 0.25)}, 0 8px 24px -4px ${alpha("#64748B", 0.12)}`,
      border: `1px solid ${isDarkMode ? alpha(accentColor, 0.2) : alpha(accentColor, 0.15)}`,
    },
    "&:active": {
      transform: "translateY(-2px)",
    },
    // Gradiente decorativo interno
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: gradient,
      pointerEvents: "none",
      zIndex: 0,
    },
  });

  // Estilo do container do ícone - visual premium 3D-ish
  const getIconContainerStyles = (bgColor: string, lightBgColor: string) => ({
    width: isMobile ? 40 : 52,
    height: isMobile ? 40 : 52,
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    // Fundo com gradiente suave
    background: isDarkMode
      ? `linear-gradient(135deg, ${alpha(bgColor, 0.2)} 0%, ${alpha(bgColor, 0.1)} 100%)`
      : `linear-gradient(135deg, ${lightBgColor} 0%, ${alpha(lightBgColor, 0.6)} 100%)`,
    // Bordas sutis
    border: `1px solid ${isDarkMode ? alpha(bgColor, 0.2) : alpha(bgColor, 0.15)}`,
    // Sombra interna para efeito 3D
    boxShadow: isDarkMode
      ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}, 0 4px 12px -4px ${alpha(bgColor, 0.3)}`
      : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}, 0 4px 12px -4px ${alpha(bgColor, 0.2)}`,
    transition: "all 0.3s ease-in-out",
  });

  const balanceStyles = isPositiveBalance
    ? cardStyles.balance.positive
    : cardStyles.balance.negative;

  return (
    <Grid container spacing={isMobile ? 1.5 : 2.5}>
      {/* Balance Card */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card
          sx={getGlassCardStyles(
            balanceStyles.accentColor,
            isDarkMode ? balanceStyles.gradientDark : balanceStyles.gradientLight
          )}
          elevation={0}
        >
          <CardContent
            sx={{
              position: "relative",
              zIndex: 1,
              p: isMobile ? 2 : 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    letterSpacing: "0.1em",
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 600,
                  }}
                >
                  Saldo Atual
                </Typography>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    mt: 0.5,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {isMobile
                    ? formatCurrency(summary.balance)
                    : formatCurrencyFull(summary.balance)}
                </Typography>
                {/* Indicador visual do estado */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: balanceStyles.accentColor,
                      boxShadow: `0 0 8px ${alpha(balanceStyles.accentColor, 0.5)}`,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: balanceStyles.accentColor,
                      fontWeight: 600,
                    }}
                  >
                    {isPositiveBalance ? "Você está no verde!" : "Atenção ao saldo"}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={getIconContainerStyles(
                  balanceStyles.iconBg,
                  balanceStyles.iconBgLight
                )}
              >
                <WalletIcon
                  sx={{
                    fontSize: isMobile ? 20 : 26,
                    color: balanceStyles.accentColor,
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Income Card */}
      <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
        <Card
          sx={getGlassCardStyles(
            cardStyles.income.accentColor,
            isDarkMode
              ? cardStyles.income.gradientDark
              : cardStyles.income.gradientLight
          )}
          elevation={0}
        >
          <CardContent
            sx={{
              position: "relative",
              zIndex: 1,
              p: isMobile ? 2 : 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    letterSpacing: "0.1em",
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 600,
                  }}
                >
                  Receitas
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h4"}
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    mt: 0.5,
                    letterSpacing: "-0.02em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isMobile
                    ? formatCurrency(summary.totalIncome)
                    : formatCurrencyFull(summary.totalIncome)}
                </Typography>
                {/* Barra de progresso comparativa */}
                <Tooltip 
                  title={comparison.prevIncome > 0 
                    ? `${comparison.incomeChange >= 0 ? '+' : ''}${comparison.incomeChange}% vs mês anterior` 
                    : 'Sem dados do mês anterior'}
                  arrow
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: 4,
                      borderRadius: 2.5,
                      bgcolor: isDarkMode
                        ? alpha(cardStyles.income.accentColor, 0.1)
                        : alpha(cardStyles.income.accentColor, 0.15),
                      mt: 1.5,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${comparison.incomeProgress}%`,
                        height: "100%",
                        borderRadius: 2.5,
                        bgcolor: cardStyles.income.accentColor,
                        boxShadow: `0 0 8px ${alpha(cardStyles.income.accentColor, 0.4)}`,
                        transition: "width 0.5s ease-in-out",
                      }}
                    />
                  </Box>
                </Tooltip>
                {/* Indicador de mudança */}
                {comparison.prevIncome > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: "block",
                      color: comparison.incomeChange >= 0 ? "success.main" : "error.main",
                      fontWeight: 600,
                    }}
                  >
                    {comparison.incomeChange >= 0 ? "+" : ""}{comparison.incomeChange}% vs mês anterior
                  </Typography>
                )}
              </Box>
              <Box
                sx={getIconContainerStyles(
                  cardStyles.income.iconBg,
                  cardStyles.income.iconBgLight
                )}
              >
                <TrendingUpIcon
                  sx={{
                    fontSize: isMobile ? 20 : 26,
                    color: cardStyles.income.accentColor,
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Expense Card */}
      <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
        <Card
          sx={getGlassCardStyles(
            cardStyles.expense.accentColor,
            isDarkMode
              ? cardStyles.expense.gradientDark
              : cardStyles.expense.gradientLight
          )}
          elevation={0}
        >
          <CardContent
            sx={{
              position: "relative",
              zIndex: 1,
              p: isMobile ? 2 : 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "text.secondary",
                    letterSpacing: "0.1em",
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 600,
                  }}
                >
                  Despesas
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h4"}
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    mt: 0.5,
                    letterSpacing: "-0.02em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isMobile
                    ? formatCurrency(summary.totalExpense)
                    : formatCurrencyFull(summary.totalExpense)}
                </Typography>
                {/* Barra de progresso comparativa */}
                <Tooltip 
                  title={comparison.prevExpense > 0 
                    ? `${comparison.expenseChange >= 0 ? '+' : ''}${comparison.expenseChange}% vs mês anterior` 
                    : 'Sem dados do mês anterior'}
                  arrow
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: 4,
                      borderRadius: 2.5,
                      bgcolor: isDarkMode
                        ? alpha(cardStyles.expense.accentColor, 0.1)
                        : alpha(cardStyles.expense.accentColor, 0.15),
                      mt: 1.5,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${comparison.expenseProgress}%`,
                        height: "100%",
                        borderRadius: 2.5,
                        bgcolor: cardStyles.expense.accentColor,
                        boxShadow: `0 0 8px ${alpha(cardStyles.expense.accentColor, 0.4)}`,
                        transition: "width 0.5s ease-in-out",
                      }}
                    />
                  </Box>
                </Tooltip>
                {/* Indicador de mudança */}
                {comparison.prevExpense > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: "block",
                      color: comparison.expenseChange <= 0 ? "success.main" : "error.main",
                      fontWeight: 600,
                    }}
                  >
                    {comparison.expenseChange >= 0 ? "+" : ""}{comparison.expenseChange}% vs mês anterior
                  </Typography>
                )}
              </Box>
              <Box
                sx={getIconContainerStyles(
                  cardStyles.expense.iconBg,
                  cardStyles.expense.iconBgLight
                )}
              >
                <TrendingDownIcon
                  sx={{
                    fontSize: isMobile ? 20 : 26,
                    color: cardStyles.expense.accentColor,
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SummaryCards;
