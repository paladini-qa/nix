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
import { motion } from "framer-motion";
import { FinancialSummary, Transaction } from "../types";
import { CountUp, formatBRL, formatBRLFull } from "./motion";

// Create motion-enabled components
const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface SummaryCardsProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  selectedMonth?: number;
  selectedYear?: number;
}

// ============================================
// PALETA NIX - Cores do Brand Book
// ============================================
const NIX_COLORS = {
  purple: "#8A2BE2",
  purpleLight: "#9D4EDD",
  purpleDark: "#6A0DAD",
  teal: "#00D4FF",
  success: "#2ECC71",
  successLight: "#A9DFBF",
  error: "#FF6B6B",
  errorLight: "#FDEDEC",
};

// Configuração de cores para os cards - Paleta Nix
const cardStyles = {
  balance: {
    positive: {
      iconBg: NIX_COLORS.success,
      iconBgLight: NIX_COLORS.successLight,
      accentColor: NIX_COLORS.success,
      gradientLight: "linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(46, 204, 113, 0.04) 100%)",
      gradientDark: "linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(46, 204, 113, 0.08) 100%)",
    },
    negative: {
      iconBg: NIX_COLORS.error,
      iconBgLight: NIX_COLORS.errorLight,
      accentColor: NIX_COLORS.error,
      gradientLight: "linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(255, 107, 107, 0.04) 100%)",
      gradientDark: "linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.08) 100%)",
    },
  },
  income: {
    iconBg: NIX_COLORS.success,
    iconBgLight: NIX_COLORS.successLight,
    accentColor: NIX_COLORS.success,
    gradientLight: "linear-gradient(135deg, rgba(46, 204, 113, 0.06) 0%, rgba(46, 204, 113, 0.02) 100%)",
    gradientDark: "linear-gradient(135deg, rgba(46, 204, 113, 0.12) 0%, rgba(46, 204, 113, 0.06) 100%)",
  },
  expense: {
    iconBg: NIX_COLORS.error,
    iconBgLight: NIX_COLORS.errorLight,
    accentColor: NIX_COLORS.error,
    gradientLight: "linear-gradient(135deg, rgba(255, 107, 107, 0.06) 0%, rgba(255, 107, 107, 0.02) 100%)",
    gradientDark: "linear-gradient(135deg, rgba(255, 107, 107, 0.12) 0%, rgba(255, 107, 107, 0.06) 100%)",
  },
};

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, transactions, selectedMonth, selectedYear }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

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

  // Calcula o fluxo mensal (apenas do mês selecionado, não acumulado)
  const monthlyFlow = summary.totalIncome - summary.totalExpense;
  const isPositiveFlow = monthlyFlow >= 0;

  // Estilos base do card - Simplificado (sem glassmorphism)
  const getGlassCardStyles = (accentColor: string) => ({
    height: "100%",
    minHeight: isMobile ? 120 : 140,
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    // Background sólido (removido glassmorphism)
    background: isDarkMode
      ? theme.palette.background.paper
      : "#FFFFFF",
    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.08)}`,
    // Sombra com tonalidade
    boxShadow: isDarkMode
      ? `0 8px 32px -8px ${alpha(accentColor, 0.2)}, 0 4px 16px -4px ${alpha("#000000", 0.3)}`
      : `0 8px 32px -8px ${alpha(accentColor, 0.15)}, 0 4px 16px -4px ${alpha("#64748B", 0.08)}`,
  });

  // Estilo do container do ícone - visual premium 3D-ish
  const getIconContainerStyles = (bgColor: string, lightBgColor: string) => ({
    width: isMobile ? 36 : 52,
    height: isMobile ? 36 : 52,
    minWidth: isMobile ? 36 : 52,
    borderRadius: isMobile ? "14px" : "20px",
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

  const flowStyles = isPositiveFlow
    ? cardStyles.balance.positive
    : cardStyles.balance.negative;

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        // Previne overflow horizontal em telas pequenas
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Grid container spacing={isMobile ? 1.5 : 2.5} sx={{ mx: 0, width: "100%" }}>
        {/* Monthly Flow Card - Fluxo do mês selecionado */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <MotionCard
            variants={cardVariants}
            whileHover={{ 
              y: -4,
              scale: 1.01,
              boxShadow: isDarkMode
                ? `0 16px 48px -8px ${alpha(flowStyles.accentColor, 0.3)}, 0 8px 24px -4px ${alpha("#000000", 0.4)}`
                : `0 16px 48px -8px ${alpha(flowStyles.accentColor, 0.25)}, 0 8px 24px -4px ${alpha("#64748B", 0.12)}`,
            }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            sx={getGlassCardStyles(flowStyles.accentColor)}
            elevation={0}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.5 : 3,
                "&:last-child": { pb: isMobile ? 1.5 : 3 },
              }}
            >
              {/* Título dinâmico baseado no fluxo mensal */}
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: "0.08em",
                  fontSize: isMobile ? 10 : 12,
                  fontWeight: 600,
                  display: "block",
                  mb: 0.5,
                }}
              >
                {isPositiveFlow ? "Sobras do Mês" : "Défice Mensal"}
              </Typography>
              
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {/* Animated Monthly Flow Counter */}
                  <CountUp
                    value={Math.abs(monthlyFlow)}
                    formatter={isMobile ? formatBRL : formatBRLFull}
                    duration={1.2}
                    delay={0.3}
                    variant={isMobile ? "h5" : "h4"}
                    sx={{
                      fontWeight: 700,
                      color: flowStyles.accentColor,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                      minHeight: isMobile ? 28 : 36,
                      display: "block",
                    }}
                  />
                  
                  {/* Indicador visual do estado - Simplificado (sem pulso) */}
                  <MotionBox
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, type: "spring" }}
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
                        bgcolor: flowStyles.accentColor,
                        boxShadow: `0 0 8px ${alpha(flowStyles.accentColor, 0.5)}`,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: flowStyles.accentColor,
                        fontWeight: 600,
                      }}
                    >
                      {/* UX Writing amigável - Tom Nix */}
                      {isPositiveFlow ? "Mandou bem! Sobrando ✨" : "Gastando mais que ganha"}
                    </Typography>
                  </MotionBox>
                </Box>
                
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                  sx={getIconContainerStyles(
                    flowStyles.iconBg,
                    flowStyles.iconBgLight
                  )}
                >
                  <WalletIcon
                    sx={{
                      fontSize: isMobile ? 20 : 26,
                      color: flowStyles.accentColor,
                    }}
                  />
                </MotionBox>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Income Card */}
        <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
          <MotionCard
            variants={cardVariants}
            whileHover={{ 
              y: -4,
              scale: 1.01,
              boxShadow: isDarkMode
                ? `0 16px 48px -8px ${alpha(cardStyles.income.accentColor, 0.3)}, 0 8px 24px -4px ${alpha("#000000", 0.4)}`
                : `0 16px 48px -8px ${alpha(cardStyles.income.accentColor, 0.25)}, 0 8px 24px -4px ${alpha("#64748B", 0.12)}`,
            }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            sx={getGlassCardStyles(cardStyles.income.accentColor)}
            elevation={0}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.5 : 3,
                "&:last-child": { pb: isMobile ? 1.5 : 3 },
              }}
            >
              {/* Título acima de tudo */}
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: "0.08em",
                  fontSize: isMobile ? 10 : 12,
                  fontWeight: 600,
                  display: "block",
                  mb: 0.5,
                }}
              >
                Receitas
              </Typography>
              
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {/* Animated Income Counter */}
                  <CountUp
                    value={summary.totalIncome}
                    formatter={isMobile ? formatBRL : formatBRLFull}
                    duration={1.2}
                    delay={0.4}
                    variant={isMobile ? "h6" : "h4"}
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                      minHeight: isMobile ? 24 : 36,
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  />
                  
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
                        borderRadius: "20px",
                        bgcolor: isDarkMode
                          ? alpha(cardStyles.income.accentColor, 0.1)
                          : alpha(cardStyles.income.accentColor, 0.15),
                        mt: 1.5,
                        overflow: "hidden",
                      }}
                    >
                      <MotionBox
                        initial={{ width: 0 }}
                        animate={{ width: `${comparison.incomeProgress}%` }}
                        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                        sx={{
                          height: "100%",
                          borderRadius: "20px",
                          bgcolor: cardStyles.income.accentColor,
                          boxShadow: `0 0 8px ${alpha(cardStyles.income.accentColor, 0.4)}`,
                        }}
                      />
                    </Box>
                  </Tooltip>
                  
                  {/* Indicador de mudança - espaço reservado para manter altura consistente */}
                  <Box sx={{ minHeight: 18, mt: 0.5 }}>
                    {comparison.prevIncome > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: comparison.incomeChange >= 0 ? "success.main" : "error.main",
                          fontWeight: 600,
                        }}
                      >
                        {comparison.incomeChange >= 0 ? "+" : ""}{comparison.incomeChange}% vs mês anterior
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
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
                </MotionBox>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Expense Card */}
        <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
          <MotionCard
            variants={cardVariants}
            whileHover={{ 
              y: -4,
              scale: 1.01,
              boxShadow: isDarkMode
                ? `0 16px 48px -8px ${alpha(cardStyles.expense.accentColor, 0.3)}, 0 8px 24px -4px ${alpha("#000000", 0.4)}`
                : `0 16px 48px -8px ${alpha(cardStyles.expense.accentColor, 0.25)}, 0 8px 24px -4px ${alpha("#64748B", 0.12)}`,
            }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            sx={getGlassCardStyles(cardStyles.expense.accentColor)}
            elevation={0}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.5 : 3,
                "&:last-child": { pb: isMobile ? 1.5 : 3 },
              }}
            >
              {/* Título acima de tudo */}
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: "0.08em",
                  fontSize: isMobile ? 10 : 12,
                  fontWeight: 600,
                  display: "block",
                  mb: 0.5,
                }}
              >
                Despesas
              </Typography>
              
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {/* Animated Expense Counter */}
                  <CountUp
                    value={summary.totalExpense}
                    formatter={isMobile ? formatBRL : formatBRLFull}
                    duration={1.2}
                    delay={0.5}
                    variant={isMobile ? "h6" : "h4"}
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                      minHeight: isMobile ? 24 : 36,
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  />
                  
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
                        borderRadius: "20px",
                        bgcolor: isDarkMode
                          ? alpha(cardStyles.expense.accentColor, 0.1)
                          : alpha(cardStyles.expense.accentColor, 0.15),
                        mt: 1.5,
                        overflow: "hidden",
                      }}
                    >
                      <MotionBox
                        initial={{ width: 0 }}
                        animate={{ width: `${comparison.expenseProgress}%` }}
                        transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                        sx={{
                          height: "100%",
                          borderRadius: "20px",
                          bgcolor: cardStyles.expense.accentColor,
                          boxShadow: `0 0 8px ${alpha(cardStyles.expense.accentColor, 0.4)}`,
                        }}
                      />
                    </Box>
                  </Tooltip>
                  
                  {/* Indicador de mudança - espaço reservado para manter altura consistente */}
                  <Box sx={{ minHeight: 18, mt: 0.5 }}>
                    {comparison.prevExpense > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: comparison.expenseChange <= 0 ? "success.main" : "error.main",
                          fontWeight: 600,
                        }}
                      >
                        {comparison.expenseChange >= 0 ? "+" : ""}{comparison.expenseChange}% vs mês anterior
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
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
                </MotionBox>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </MotionBox>
  );
};

export default SummaryCards;
