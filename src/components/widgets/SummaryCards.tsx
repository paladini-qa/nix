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
import { FinancialSummary, Transaction } from "../../types";
import { getReportDate } from "../../utils/transactionUtils";
import { CountUp, formatBRL, formatBRLFull } from "../motion";
import { usePrivacyMode, useLayoutSpacing } from "../../hooks";

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
// PALETA COFFEE — Cozy Design System
// ============================================
const COFFEE = {
  // Sage green — receitas / saldo positivo
  sage: "#5B8A5A",
  sageDark: "#7AB87A",
  sageLight: "#8FBC8F",
  // Dusty rose — despesas / saldo negativo
  dustyRose: "#B85450",
  dustyRoseDark: "#E07870",
  dustyRoseLight: "#D4817D",
  // Caramel — saldo / balanço (neutro positivo)
  caramel: "#C4883A",
  caramelLight: "#DDB899",
};

// Configuração de cores dos cards — Paleta Coffee
const cardStyles = {
  balance: {
    positive: {
      iconBg: COFFEE.sage,
      iconBgLight: COFFEE.sageLight,
      accentColor: COFFEE.sage,
      accentDark: COFFEE.sageDark,
      gradientLight: "linear-gradient(135deg, rgba(91, 138, 90, 0.08) 0%, rgba(91, 138, 90, 0.03) 100%)",
      gradientDark: "linear-gradient(135deg, rgba(122, 184, 122, 0.14) 0%, rgba(122, 184, 122, 0.06) 100%)",
      emoji: "",
    },
    negative: {
      iconBg: COFFEE.dustyRose,
      iconBgLight: COFFEE.dustyRoseLight,
      accentColor: COFFEE.dustyRose,
      accentDark: COFFEE.dustyRoseDark,
      gradientLight: "linear-gradient(135deg, rgba(184, 84, 80, 0.08) 0%, rgba(184, 84, 80, 0.03) 100%)",
      gradientDark: "linear-gradient(135deg, rgba(224, 120, 112, 0.14) 0%, rgba(224, 120, 112, 0.06) 100%)",
      emoji: "",
    },
  },
  income: {
    iconBg: COFFEE.sage,
    iconBgLight: COFFEE.sageLight,
    accentColor: COFFEE.sage,
    accentDark: COFFEE.sageDark,
    gradientLight: "linear-gradient(135deg, rgba(91, 138, 90, 0.06) 0%, rgba(91, 138, 90, 0.02) 100%)",
    gradientDark: "linear-gradient(135deg, rgba(122, 184, 122, 0.12) 0%, rgba(122, 184, 122, 0.05) 100%)",
    emoji: "",
  },
  expense: {
    iconBg: COFFEE.dustyRose,
    iconBgLight: COFFEE.dustyRoseLight,
    accentColor: COFFEE.dustyRose,
    accentDark: COFFEE.dustyRoseDark,
    gradientLight: "linear-gradient(135deg, rgba(184, 84, 80, 0.06) 0%, rgba(184, 84, 80, 0.02) 100%)",
    gradientDark: "linear-gradient(135deg, rgba(224, 120, 112, 0.12) 0%, rgba(224, 120, 112, 0.05) 100%)",
    emoji: "",
  },
};

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 24,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 360,
      damping: 26,
    },
  },
};

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, transactions, selectedMonth, selectedYear }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";
  const { privacyStylesStrong } = usePrivacyMode();
  const { gridSpacing, cardMinHeight, iconSize } = useLayoutSpacing();

  // Calcula comparação com mês anterior
  const comparison = useMemo(() => {
    const now = new Date();
    const currentMonth = selectedMonth ?? now.getMonth();
    const currentYear = selectedYear ?? now.getFullYear();
    
    // Mês anterior
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Transações do mês anterior (usa data de relatório)
    const prevMonthTxs = transactions.filter((t) => {
      const [y, m] = getReportDate(t).split("-");
      const isPrevMonth = parseInt(y) === prevYear && parseInt(m) === prevMonth + 1;
      
      if (!isPrevMonth) return false;
      
      // Para transações recorrentes originais (não virtuais), verifica se a data está excluída
      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) {
        return false;
      }
      
      return true;
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

  // Estilos base do card — Cozy Coffee
  const getGlassCardStyles = (accentColor: string, gradient?: string) => ({
    height: "100%",
    minHeight: cardMinHeight,
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    background: isDarkMode
      ? `${gradient ?? theme.palette.background.paper}`
      : `${gradient ?? theme.palette.background.paper}`,
    border: `1px solid ${isDarkMode ? alpha(accentColor, 0.18) : alpha(accentColor, 0.12)}`,
    boxShadow: isDarkMode
      ? `0 8px 32px -8px ${alpha(accentColor, 0.22)}, 0 4px 16px -4px rgba(28, 16, 8, 0.35)`
      : `0 8px 32px -8px ${alpha(accentColor, 0.16)}, 0 4px 16px -4px rgba(44, 26, 17, 0.07)}`,
  });

  // Estilo do container do ícone - visual premium 3D-ish
  const getIconContainerStyles = (bgColor: string, lightBgColor: string) => ({
    width: iconSize,
    height: iconSize,
    minWidth: iconSize,
    borderRadius: isMobile ? "12px" : "20px",
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

  const flowAccent = isDarkMode ? flowStyles.accentDark : flowStyles.accentColor;

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        width: "100%",
        // overflow hidden aqui cortava as margens negativas do Grid e anulava o spacing
        overflowX: "clip",
      }}
    >
      <Grid container columnSpacing={{ xs: 1.5, sm: 2, md: 2.5, lg: 3 }} rowSpacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ width: "100%" }}>
        {/* Monthly Flow Card - Fluxo do mês selecionado */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <MotionCard
            variants={cardVariants}
            whileHover={{ 
              y: -4,
              scale: 1.01,
              boxShadow: isDarkMode
                ? `0 16px 48px -8px ${alpha(flowAccent, 0.32)}, 0 8px 24px -4px rgba(28, 16, 8, 0.45)`
                : `0 16px 48px -8px ${alpha(flowStyles.accentColor, 0.25)}, 0 8px 24px -4px rgba(44, 26, 17, 0.10)`,
            }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            sx={getGlassCardStyles(
              isDarkMode ? flowStyles.accentDark : flowStyles.accentColor,
              isDarkMode ? flowStyles.gradientDark : flowStyles.gradientLight
            )}
            elevation={0}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.25 : 3,
                "&:last-child": { pb: isMobile ? 1.25 : 3 },
              }}
            >
              {/* Emoji decorativo — canto superior direito */}
              <Box sx={{ position: "absolute", top: 10, right: 14, fontSize: isMobile ? 18 : 22, opacity: 0.35, userSelect: "none" }}>
                {flowStyles.emoji}
              </Box>

              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: "0.08em",
                  fontSize: isMobile ? 9 : 12,
                  fontWeight: 700,
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
                  <CountUp
                    value={Math.abs(monthlyFlow)}
                    formatter={isMobile ? formatBRL : formatBRLFull}
                    duration={1.2}
                    delay={0.3}
                    variant={isMobile ? "h5" : "h4"}
                    sx={{
                      fontWeight: 700,
                      color: flowAccent,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                      minHeight: isMobile ? 28 : 36,
                      display: "block",
                      ...privacyStylesStrong,
                    }}
                  />
                  
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
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        bgcolor: flowAccent,
                        boxShadow: `0 0 8px ${alpha(flowAccent, 0.5)}`,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: flowAccent, fontWeight: 700 }}
                    >
                      {isPositiveFlow ? "Mandou bem! Sobrando " : "Gastando mais que ganha"}
                    </Typography>
                  </MotionBox>
                </Box>
                
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                  sx={getIconContainerStyles(flowStyles.iconBg, flowStyles.iconBgLight)}
                >
                  <WalletIcon sx={{ fontSize: isMobile ? 18 : 26, color: flowAccent }} />
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
                ? `0 16px 48px -8px ${alpha(cardStyles.income.accentDark, 0.30)}, 0 8px 24px -4px rgba(28, 16, 8, 0.45)`
                : `0 16px 48px -8px ${alpha(cardStyles.income.accentColor, 0.22)}, 0 8px 24px -4px rgba(44, 26, 17, 0.10)`,
            }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            sx={getGlassCardStyles(
              isDarkMode ? cardStyles.income.accentDark : cardStyles.income.accentColor,
              isDarkMode ? cardStyles.income.gradientDark : cardStyles.income.gradientLight
            )}
            elevation={0}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.25 : 3,
                "&:last-child": { pb: isMobile ? 1.25 : 3 },
              }}
            >
              {/* Emoji decorativo */}
              <Box sx={{ position: "absolute", top: 10, right: 14, fontSize: isMobile ? 16 : 20, opacity: 0.35, userSelect: "none" }}>
                {cardStyles.income.emoji}
              </Box>

              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: "0.08em",
                  fontSize: isMobile ? 9 : 12,
                  fontWeight: 700,
                  display: "block",
                  mb: 0.5,
                }}
              >
                Receitas
              </Typography>
              
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
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
                      ...privacyStylesStrong,
                    }}
                  />
                  
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
                          ? alpha(cardStyles.income.accentDark, 0.12)
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
                          bgcolor: isDarkMode ? cardStyles.income.accentDark : cardStyles.income.accentColor,
                          boxShadow: `0 0 8px ${alpha(cardStyles.income.accentColor, 0.4)}`,
                        }}
                      />
                    </Box>
                  </Tooltip>
                  
                  <Box sx={{ minHeight: 18, mt: 0.5 }}>
                    {comparison.prevIncome > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: comparison.incomeChange >= 0 ? "success.main" : "error.main",
                          fontWeight: 700,
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
                  sx={getIconContainerStyles(cardStyles.income.iconBg, cardStyles.income.iconBgLight)}
                >
                  <TrendingUpIcon
                    sx={{
                      fontSize: isMobile ? 18 : 26,
                      color: isDarkMode ? cardStyles.income.accentDark : cardStyles.income.accentColor,
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
                ? `0 16px 48px -8px ${alpha(cardStyles.expense.accentDark, 0.30)}, 0 8px 24px -4px rgba(28, 16, 8, 0.45)`
                : `0 16px 48px -8px ${alpha(cardStyles.expense.accentColor, 0.22)}, 0 8px 24px -4px rgba(44, 26, 17, 0.10)`,
            }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            sx={getGlassCardStyles(
              isDarkMode ? cardStyles.expense.accentDark : cardStyles.expense.accentColor,
              isDarkMode ? cardStyles.expense.gradientDark : cardStyles.expense.gradientLight
            )}
            elevation={0}
          >
            <CardContent
              sx={{
                position: "relative",
                zIndex: 1,
                p: isMobile ? 1.25 : 3,
                "&:last-child": { pb: isMobile ? 1.25 : 3 },
              }}
            >
              {/* Emoji decorativo */}
              <Box sx={{ position: "absolute", top: 10, right: 14, fontSize: isMobile ? 16 : 20, opacity: 0.35, userSelect: "none" }}>
                {cardStyles.expense.emoji}
              </Box>

              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  letterSpacing: "0.08em",
                  fontSize: isMobile ? 9 : 12,
                  fontWeight: 700,
                  display: "block",
                  mb: 0.5,
                }}
              >
                Despesas
              </Typography>
              
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
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
                      ...privacyStylesStrong,
                    }}
                  />
                  
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
                          ? alpha(cardStyles.expense.accentDark, 0.12)
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
                          bgcolor: isDarkMode ? cardStyles.expense.accentDark : cardStyles.expense.accentColor,
                          boxShadow: `0 0 8px ${alpha(cardStyles.expense.accentColor, 0.4)}`,
                        }}
                      />
                    </Box>
                  </Tooltip>
                  
                  <Box sx={{ minHeight: 18, mt: 0.5 }}>
                    {comparison.prevExpense > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: comparison.expenseChange <= 0 ? "success.main" : "error.main",
                          fontWeight: 700,
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
                  sx={getIconContainerStyles(cardStyles.expense.iconBg, cardStyles.expense.iconBgLight)}
                >
                  <TrendingDownIcon
                    sx={{
                      fontSize: isMobile ? 18 : 26,
                      color: isDarkMode ? cardStyles.expense.accentDark : cardStyles.expense.accentColor,
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
