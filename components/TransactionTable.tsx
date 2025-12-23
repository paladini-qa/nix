import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  LinearProgress,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ShoppingBag as ShoppingIcon,
  Restaurant as FoodIcon,
  DirectionsCar as TransportIcon,
  Home as HomeIcon,
  Paid as SalaryIcon,
  Savings as SavingsIcon,
  HealthAndSafety as HealthIcon,
  School as EducationIcon,
  SportsEsports as EntertainmentIcon,
  MoreHoriz as OtherIcon,
} from "@mui/icons-material";
import TransactionTags from "./TransactionTags";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "../types";
import EmptyState from "./EmptyState";

// Create motion-enabled components
const MotionPaper = motion.create(Paper);
const MotionTableRow = motion.create(TableRow);
const MotionBox = motion.create(Box);

interface TransactionTableProps {
  transactions: Transaction[];
}

// Mapeamento de categorias para ícones e cores
const categoryConfig: Record<string, { icon: React.ElementType; color: string; bgLight: string }> = {
  // Despesas
  "Alimentação": { icon: FoodIcon, color: "#EA580C", bgLight: "#FFF7ED" },
  "Transporte": { icon: TransportIcon, color: "#0284C7", bgLight: "#F0F9FF" },
  "Moradia": { icon: HomeIcon, color: "#7C3AED", bgLight: "#F5F3FF" },
  "Saúde": { icon: HealthIcon, color: "#DC2626", bgLight: "#FEF2F2" },
  "Educação": { icon: EducationIcon, color: "#2563EB", bgLight: "#EFF6FF" },
  "Lazer": { icon: EntertainmentIcon, color: "#DB2777", bgLight: "#FDF2F8" },
  "Compras": { icon: ShoppingIcon, color: "#9333EA", bgLight: "#FAF5FF" },
  // Receitas
  "Salário": { icon: SalaryIcon, color: "#059669", bgLight: "#ECFDF5" },
  "Investimentos": { icon: SavingsIcon, color: "#0D9488", bgLight: "#F0FDFA" },
  "Freelance": { icon: SalaryIcon, color: "#10B981", bgLight: "#D1FAE5" },
  // Default
  "default": { icon: OtherIcon, color: "#64748B", bgLight: "#F8FAFC" },
};

const getCategoryConfig = (category: string) => {
  return categoryConfig[category] || categoryConfig["default"];
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const rowVariants = {
  hidden: { 
    opacity: 0, 
    y: 10,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.15,
    },
  },
};

const mobileCardVariants = {
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
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [, month, day] = dateString.split("-");
    return `${day}/${month}`;
  };

  const formatDateFull = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const maxAmount = Math.max(...transactions.map((t) => t.amount || 0), 0.01);

  // Estilo base do Chip modernizado - cores mais suaves
  const getModernChipSx = (color: string) => ({
    height: 22,
    fontSize: 10,
    fontWeight: 600,
    borderRadius: "11px",
    bgcolor: isDarkMode ? alpha(color, 0.15) : alpha(color, 0.1),
    color: isDarkMode ? alpha(color, 0.9) : color,
    border: "none",
    "& .MuiChip-icon": {
      ml: 0.5,
      fontSize: 12,
      color: "inherit",
    },
    "& .MuiChip-label": {
      px: 1,
    },
  });

  if (transactions.length === 0) {
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        elevation={0}
        sx={{
          borderRadius: 2.5,
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha("#FFFFFF", 0.8),
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        }}
      >
        <EmptyState
          type="transactions"
          title="Nenhuma transação encontrada"
          description="Adicione sua primeira transação para começar a acompanhar suas finanças."
          compact
        />
      </MotionPaper>
    );
  }

  // Mobile Card View - Glassmorphism Style with Animations
  if (isMobile) {
    return (
      <MotionBox
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
      >
        <AnimatePresence mode="popLayout">
          {transactions.map((transaction, index) => {
            const isIncome = transaction.type === "income";
            const catConfig = getCategoryConfig(transaction.category);
            const CategoryIcon = catConfig.icon;

            return (
              <MotionPaper
                key={transaction.id}
                variants={mobileCardVariants}
                layout
                whileHover={{ 
                  y: -2,
                  boxShadow: isDarkMode
                    ? `0 8px 24px -4px ${alpha("#000000", 0.4)}`
                    : `0 8px 24px -4px ${alpha(catConfig.color, 0.2)}`,
                }}
                whileTap={{ scale: 0.99 }}
                elevation={0}
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  borderRadius: 2.5,
                  cursor: "pointer",
                  // Glassmorphism
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.background.paper, 0.6)
                    : alpha("#FFFFFF", 0.8),
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                  boxShadow: isDarkMode
                    ? `0 4px 16px -4px ${alpha("#000000", 0.3)}`
                    : `0 4px 16px -4px ${alpha(catConfig.color, 0.1)}`,
                }}
              >
                {/* Category Icon Avatar */}
                <MotionBox
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.02 + 0.1, type: "spring" }}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    bgcolor: isDarkMode
                      ? alpha(catConfig.color, 0.15)
                      : catConfig.bgLight,
                    boxShadow: `inset 0 1px 0 ${alpha("#FFFFFF", isDarkMode ? 0.1 : 0.6)}`,
                  }}
                >
                  <CategoryIcon
                    sx={{
                      fontSize: 22,
                      color: catConfig.color,
                    }}
                  />
                </MotionBox>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {transaction.description}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        flexShrink: 0,
                        color: isIncome
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                      }}
                    >
                      {isIncome ? "+" : "-"} {formatCurrency(transaction.amount || 0)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0.75,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {formatDate(transaction.date)}
                    </Typography>
                    <Box
                      sx={{
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        bgcolor: "text.disabled",
                      }}
                    />
                    <Chip
                      label={transaction.category}
                      size="small"
                      sx={{
                        ...getModernChipSx(catConfig.color),
                        height: 20,
                        fontSize: 10,
                      }}
                    />
                  </Box>
                  {/* Tags - Componente padronizado em formato pílula */}
                  <TransactionTags transaction={transaction} />
                </Box>
              </MotionPaper>
            );
          })}
        </AnimatePresence>
      </MotionBox>
    );
  }

  // Desktop Table View - Clean Card-Table Hybrid with Animations
  return (
    <TableContainer
      component={MotionPaper}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      elevation={0}
      sx={{
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: isDarkMode
          ? alpha(theme.palette.background.paper, 0.6)
          : alpha("#FFFFFF", 0.9),
        backdropFilter: "blur(20px)",
        border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        boxShadow: isDarkMode
          ? `0 8px 32px -8px ${alpha("#000000", 0.3)}`
          : `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.08)}`,
      }}
    >
      <Table>
        <TableHead>
          <TableRow
            sx={{
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.default, 0.5)
                : alpha(theme.palette.grey[50], 0.8),
              "& th": {
                borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
              },
            }}
          >
            <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12, letterSpacing: "0.05em", py: 2.5 }}>
              DATA
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12, letterSpacing: "0.05em", py: 2.5 }}>
              DESCRIÇÃO
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12, letterSpacing: "0.05em", py: 2.5 }}>
              CATEGORIA
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12, letterSpacing: "0.05em", py: 2.5 }}>
              PAGAMENTO
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12, letterSpacing: "0.05em", py: 2.5, width: 200 }}>
              VALOR
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          component={motion.tbody}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {transactions.map((transaction, index) => {
              const barWidth = ((transaction.amount || 0) / maxAmount) * 100;
              const isIncome = transaction.type === "income";
              const catConfig = getCategoryConfig(transaction.category);
              const CategoryIcon = catConfig.icon;
              const isLastRow = index === transactions.length - 1;

              return (
                <MotionTableRow
                  key={transaction.id}
                  variants={rowVariants}
                  layout
                  whileHover={{
                    backgroundColor: isDarkMode
                      ? alpha(catConfig.color, 0.06)
                      : alpha(catConfig.color, 0.04),
                    scale: 1.002,
                  }}
                  sx={{
                    cursor: "pointer",
                    "& td": {
                      borderBottom: isLastRow
                        ? "none"
                        : `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.04) : alpha("#000000", 0.04)}`,
                      py: 2.5,
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} color="text.primary">
                      {formatDateFull(transaction.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {/* Type Indicator com ícone sutil */}
                      <MotionBox
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.02, type: "spring" }}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isIncome
                            ? isDarkMode
                              ? alpha(theme.palette.success.main, 0.15)
                              : alpha(theme.palette.success.main, 0.1)
                            : isDarkMode
                              ? alpha(theme.palette.error.main, 0.15)
                              : alpha(theme.palette.error.main, 0.1),
                        }}
                      >
                        {isIncome ? (
                          <ArrowUpIcon
                            sx={{
                              fontSize: 16,
                              color: theme.palette.success.main,
                            }}
                          />
                        ) : (
                          <ArrowDownIcon
                            sx={{
                              fontSize: 16,
                              color: theme.palette.error.main,
                            }}
                          />
                        )}
                      </MotionBox>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {transaction.description}
                        </Typography>
                        {/* Tags - Componente padronizado em formato pílula */}
                        <TransactionTags transaction={transaction} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {/* Category com Soft Icon Avatar */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <MotionBox
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.02 + 0.1, type: "spring" }}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isDarkMode
                            ? alpha(catConfig.color, 0.15)
                            : catConfig.bgLight,
                          boxShadow: `inset 0 1px 0 ${alpha("#FFFFFF", isDarkMode ? 0.08 : 0.5)}`,
                        }}
                      >
                        <CategoryIcon
                          sx={{
                            fontSize: 18,
                            color: catConfig.color,
                          }}
                        />
                      </MotionBox>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ color: catConfig.color }}
                      >
                        {transaction.category}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {transaction.paymentMethod}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          mb: 1,
                          color: isIncome
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                        }}
                      >
                        {isIncome ? "+" : "-"} {formatCurrency(transaction.amount || 0)}
                      </Typography>
                      <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 2.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={100}
                          sx={{
                            height: 4,
                            borderRadius: 2.5,
                            bgcolor: isDarkMode
                              ? alpha(isIncome ? theme.palette.success.main : theme.palette.error.main, 0.1)
                              : alpha(isIncome ? theme.palette.success.main : theme.palette.error.main, 0.08),
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 2.5,
                              bgcolor: "transparent",
                            },
                          }}
                        />
                        <MotionBox
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: index * 0.02 + 0.2, duration: 0.5, ease: "easeOut" }}
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: 4,
                            borderRadius: 2.5,
                            bgcolor: isIncome
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            boxShadow: `0 0 8px ${alpha(isIncome ? theme.palette.success.main : theme.palette.error.main, 0.4)}`,
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                </MotionTableRow>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionTable;
