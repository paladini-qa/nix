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
} from "@mui/material";
import {
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  People as PeopleIcon,
  Repeat as RepeatIcon,
  AccountBalance as AccountBalanceIcon,
  Category as CategoryIcon,
  PieChart as BudgetIcon,
  Flag as GoalIcon,
  EventNote as PlanningIcon,
  AutoAwesome as SparklesIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion.create(Box);

type ViewType =
  | "splits"
  | "shared"
  | "recurring"
  | "openFinance"
  | "categories"
  | "budgets"
  | "goals"
  | "planning"
  | "nixai";

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

const gridItems: GridItem[] = [
  { id: "splits", label: "Splits", icon: CreditCardIcon },
  { id: "shared", label: "Shared", icon: PeopleIcon },
  { id: "recurring", label: "Recurring", icon: RepeatIcon },
  { id: "openFinance", label: "Open Finance", icon: AccountBalanceIcon },
  { id: "categories", label: "Categorias", icon: CategoryIcon },
  { id: "budgets", label: "Budgets", icon: BudgetIcon },
  { id: "goals", label: "Goals", icon: GoalIcon },
  { id: "planning", label: "Planejamentos", icon: PlanningIcon },
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

            {/* Grid */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {gridItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Grid size={{ xs: 4 }} key={item.id}>
                    <MotionBox
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 400,
                      }}
                      onClick={() => handleItemClick(item.id)}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        p: 2,
                        borderRadius: 1,
                        bgcolor: theme.palette.primary.main,
                        color: "white",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        minHeight: 100,
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: `0 8px 24px -4px ${alpha(
                            theme.palette.primary.main,
                            0.4
                          )}`,
                        },
                        "&:active": {
                          transform: "translateY(-2px) scale(0.98)",
                        },
                      }}
                    >
                      <IconComponent
                        sx={{
                          fontSize: 32,
                          color: "white",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          textAlign: "center",
                          color: "white",
                          fontSize: "0.75rem",
                        }}
                      >
                        {item.label}
                      </Typography>
                    </MotionBox>
                  </Grid>
                );
              })}
            </Grid>

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
                  borderRadius: 1,
                  bgcolor: theme.palette.primary.main,
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1rem",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                    transform: "translateY(-2px)",
                    boxShadow: `0 8px 24px -4px ${alpha(
                      theme.palette.primary.main,
                      0.4
                    )}`,
                  },
                  "&:active": {
                    transform: "translateY(0) scale(0.98)",
                  },
                }}
              >
                NixAI
              </Button>
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>
    </Drawer>
  );
};

export default OthersGridModal;
