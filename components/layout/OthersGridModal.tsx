import React from "react";
import {
  Drawer,
  Box,
  Grid,
  Typography,
  IconButton,
  useTheme,
  alpha,
  Button,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  People as PeopleIcon,
  Repeat as RepeatIcon,
  Category as CategoryIcon,
  AutoAwesome as SparklesIcon,
  PlaylistAdd as BatchIcon,
  EmojiEvents as GoalsIcon,
  AccountBalance as BudgetsIcon,
  BarChart as AnalyticsIcon,
  CalendarMonth as PlanningIcon,
  Upload as ImportIcon,
  Description as FiscalIcon,
  Calculate as DebtCalcIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion.create(Box);

type ViewType =
  | "splits"
  | "shared"
  | "recurring"
  | "categories"
  | "nixai"
  | "batchRegistration"
  | "goals"
  | "budgets"
  | "analytics"
  | "planning"
  | "import"
  | "fiscal-report"
  | "debt-calculator";

interface OthersGridModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
}

interface GridItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
}

const mainGridItems: GridItem[] = [
  { id: "splits", label: "Splits", icon: CreditCardIcon },
  { id: "shared", label: "Divididos", icon: PeopleIcon },
  { id: "recurring", label: "Recorrentes", icon: RepeatIcon },
  { id: "categories", label: "Categorias", icon: CategoryIcon },
  { id: "batchRegistration", label: "Cadastro em Lote", icon: BatchIcon },
];

const planningGridItems: GridItem[] = [
  { id: "goals", label: "Metas", icon: GoalsIcon },
  { id: "budgets", label: "Orçamentos", icon: BudgetsIcon },
  { id: "analytics", label: "Analytics", icon: AnalyticsIcon },
  { id: "planning", label: "Planejamento", icon: PlanningIcon },
];

const toolsGridItems: GridItem[] = [
  { id: "import", label: "Importar", icon: ImportIcon },
  { id: "fiscal-report", label: "Rel. Fiscal", icon: FiscalIcon },
  { id: "debt-calculator", label: "Calc. Dívidas", icon: DebtCalcIcon },
];

/**
 * OthersGridModal - Modal que exibe grid com outras telas do app
 */
const OthersGridModal: React.FC<OthersGridModalProps> = ({
  open,
  onClose,
  onNavigate,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const handleItemClick = (view: ViewType) => {
    onNavigate(view);
    onClose();
  };

  const renderGrid = (items: GridItem[], startIndex: number = 0) => (
    <Grid container spacing={1.5}>
      {items.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Grid size={{ xs: 4 }} key={item.id}>
            <MotionBox
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: (startIndex + index) * 0.04,
                type: "spring",
                stiffness: 400,
              }}
              onClick={() => handleItemClick(item.id)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                p: 1.5,
                borderRadius: "14px",
                bgcolor: isDarkMode
                  ? alpha(theme.palette.primary.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.07),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.12)}`,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                minHeight: 76,
                "&:hover": {
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.22)
                    : alpha(theme.palette.primary.main, 0.13),
                  transform: "translateY(-3px)",
                  boxShadow: `0 6px 20px -4px ${alpha(theme.palette.primary.main, 0.22)}`,
                },
                "&:active": {
                  transform: "translateY(-1px) scale(0.97)",
                },
              }}
            >
              <IconComponent sx={{ fontSize: 24, color: theme.palette.primary.main }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  textAlign: "center",
                  color: theme.palette.primary.main,
                  fontSize: "0.65rem",
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </Typography>
            </MotionBox>
          </Grid>
        );
      })}
    </Grid>
  );

  const sectionLabelSx = {
    fontWeight: 700,
    color: "text.disabled",
    letterSpacing: "0.08em",
    fontSize: "0.6rem",
    textTransform: "uppercase" as const,
    mb: 1,
    display: "block",
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "100%",
          maxHeight: "85vh",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          bgcolor: isDarkMode
            ? theme.palette.background.paper
            : alpha("#FFFFFF", 0.98),
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: isDarkMode
            ? `0 -4px 24px -8px ${alpha("#000000", 0.5)}`
            : `0 -4px 24px -8px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: isDarkMode
              ? alpha("#000000", 0.5)
              : alpha("#000000", 0.25),
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      <AnimatePresence>
        {open && (
          <MotionBox
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            sx={{ p: 3, pb: 4 }}
          >
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  letterSpacing: "-0.02em",
                }}
              >
                Outras Telas
              </Typography>
              <IconButton
                onClick={onClose}
                sx={{
                  width: 40,
                  height: 40,
                  color: "text.secondary",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.main, 0.08),
                    transform: "scale(1.05)",
                  },
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Grid — Geral */}
            {renderGrid(mainGridItems, 0)}

            {/* Planejamento */}
            <Box sx={{ mt: 2.5 }}>
              <Divider sx={{ mb: 1.5, opacity: 0.4 }} />
              <Typography variant="caption" sx={sectionLabelSx}>Planejamento</Typography>
              {renderGrid(planningGridItems, mainGridItems.length)}
            </Box>

            {/* Ferramentas */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Divider sx={{ mb: 1.5, opacity: 0.4 }} />
              <Typography variant="caption" sx={sectionLabelSx}>Ferramentas</Typography>
              {renderGrid(toolsGridItems, mainGridItems.length + planningGridItems.length)}
            </Box>

            {/* NixAI Button */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
            >
              <Button
                fullWidth
                onClick={() => handleItemClick("nixai")}
                startIcon={<SparklesIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: "16px",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main ?? theme.palette.primary.dark})`,
                  color: "white",
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: "1rem",
                  boxShadow: `0 4px 16px -4px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 8px 24px -4px ${alpha(
                      theme.palette.primary.main,
                      0.5
                    )}`,
                  },
                  "&:active": {
                    transform: "translateY(0) scale(0.98)",
                  },
                }}
              >
                NixAI — Análise Inteligente
              </Button>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Drawer>
  );
};

export default OthersGridModal;
