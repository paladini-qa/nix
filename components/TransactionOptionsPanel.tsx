import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  useTheme,
  alpha,
  Divider,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  AllInclusive as AllIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  AutorenewOutlined as AutorenewIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Transaction } from "../types";

const MotionBox = motion.create(Box);

export type ActionType = "edit" | "delete";
export type OptionType = "single" | "all_future" | "all";

interface TransactionOptionsPanelProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  actionType: ActionType;
  onSelect: (option: OptionType) => void;
}

const PANEL_WIDTH = 380;

const TransactionOptionsPanel: React.FC<TransactionOptionsPanelProps> = ({
  open,
  onClose,
  transaction,
  actionType,
  onSelect,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  if (!transaction) return null;

  const isVirtual = transaction.isVirtual;
  const isRecurring = transaction.isRecurring || isVirtual;
  const isInstallment = transaction.installments && transaction.installments > 1;
  const isEdit = actionType === "edit";

  // Determina o tipo de transação para exibição
  const getTransactionTypeInfo = () => {
    if (isVirtual) {
      return {
        icon: <AutorenewIcon />,
        label: t("transactionOptions.types.virtualOccurrence"),
        color: theme.palette.info.main,
        description: t("transactionOptions.types.virtualDescription"),
      };
    }
    if (isInstallment) {
      return {
        icon: <CreditCardIcon />,
        label: t("transactionOptions.types.installment"),
        color: theme.palette.warning.main,
        description: t("transactionOptions.types.installmentDescription", {
          current: transaction.currentInstallment || 1,
          total: transaction.installments,
        }),
      };
    }
    if (isRecurring) {
      return {
        icon: <RepeatIcon />,
        label: t("transactionOptions.types.recurring"),
        color: theme.palette.primary.main,
        description: transaction.frequency === "monthly" 
          ? t("transactionOptions.types.monthlyDescription")
          : t("transactionOptions.types.yearlyDescription"),
      };
    }
    return {
      icon: <TodayIcon />,
      label: t("transactionOptions.types.single"),
      color: theme.palette.text.secondary,
      description: "",
    };
  };

  const typeInfo = getTransactionTypeInfo();

  // Opções disponíveis baseadas no tipo de transação
  const getOptions = () => {
    if (isInstallment) {
      return [
        {
          id: "single" as OptionType,
          icon: <TodayIcon />,
          color: theme.palette.info.main,
          title: isEdit
            ? t("transactionOptions.installment.editSingle.title")
            : t("transactionOptions.installment.deleteSingle.title"),
          description: isEdit
            ? t("transactionOptions.installment.editSingle.description", {
                current: transaction.currentInstallment || 1,
                total: transaction.installments,
              })
            : t("transactionOptions.installment.deleteSingle.description", {
                current: transaction.currentInstallment || 1,
                total: transaction.installments,
              }),
          warning: null,
        },
        {
          id: "all_future" as OptionType,
          icon: <DateRangeIcon />,
          color: theme.palette.warning.main,
          title: isEdit
            ? t("transactionOptions.installment.editFuture.title")
            : t("transactionOptions.installment.deleteFuture.title"),
          description: isEdit
            ? t("transactionOptions.installment.editFuture.description", {
                from: transaction.currentInstallment || 1,
                to: transaction.installments,
              })
            : t("transactionOptions.installment.deleteFuture.description", {
                from: transaction.currentInstallment || 1,
                to: transaction.installments,
              }),
          warning: isEdit ? null : t("transactionOptions.warnings.affectsFuture"),
        },
        {
          id: "all" as OptionType,
          icon: <AllIcon />,
          color: theme.palette.error.main,
          title: isEdit
            ? t("transactionOptions.installment.editAll.title")
            : t("transactionOptions.installment.deleteAll.title"),
          description: isEdit
            ? t("transactionOptions.installment.editAll.description", {
                total: transaction.installments,
              })
            : t("transactionOptions.installment.deleteAll.description", {
                total: transaction.installments,
              }),
          warning: t("transactionOptions.warnings.affectsAll"),
        },
      ];
    }

    // Para recorrentes (incluindo virtuais)
    return [
      {
        id: "single" as OptionType,
        icon: <TodayIcon />,
        color: theme.palette.info.main,
        title: isEdit
          ? t("transactionOptions.recurring.editSingle.title")
          : t("transactionOptions.recurring.deleteSingle.title"),
        description: isEdit
          ? isVirtual
            ? t("transactionOptions.recurring.editSingle.virtualDescription")
            : t("transactionOptions.recurring.editSingle.description")
          : isVirtual
            ? t("transactionOptions.recurring.deleteSingle.virtualDescription")
            : t("transactionOptions.recurring.deleteSingle.description"),
        warning: null,
      },
      {
        id: "all_future" as OptionType,
        icon: <DateRangeIcon />,
        color: theme.palette.warning.main,
        title: isEdit
          ? t("transactionOptions.recurring.editFuture.title")
          : t("transactionOptions.recurring.deleteFuture.title"),
        description: isEdit
          ? t("transactionOptions.recurring.editFuture.description")
          : t("transactionOptions.recurring.deleteFuture.description"),
        warning: isEdit ? null : t("transactionOptions.warnings.stopRecurring"),
      },
      {
        id: "all" as OptionType,
        icon: <AllIcon />,
        color: theme.palette.error.main,
        title: isEdit
          ? t("transactionOptions.recurring.editAll.title")
          : t("transactionOptions.recurring.deleteAll.title"),
        description: isEdit
          ? t("transactionOptions.recurring.editAll.description")
          : t("transactionOptions.recurring.deleteAll.description"),
        warning: t("transactionOptions.warnings.permanent"),
      },
    ];
  };

  const options = getOptions();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: PANEL_WIDTH },
          maxWidth: "100%",
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.98)
            : "#FAFBFC",
          backdropFilter: "blur(20px)",
          borderLeft: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
          boxShadow: isDarkMode
            ? `-8px 0 40px -10px ${alpha("#000000", 0.5)}`
            : `-8px 0 40px -10px ${alpha("#64748B", 0.15)}`,
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(4px)",
          bgcolor: alpha("#000000", 0.4),
        },
      }}
    >
      <AnimatePresence>
        {open && (
          <MotionBox
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 3,
                pb: 2,
                borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(isEdit ? theme.palette.primary.main : theme.palette.error.main, isDarkMode ? 0.15 : 0.1),
                      color: isEdit ? "primary.main" : "error.main",
                    }}
                  >
                    {isEdit ? <EditIcon /> : <DeleteIcon />}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {isEdit
                        ? t("transactionOptions.editTitle")
                        : t("transactionOptions.deleteTitle")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("transactionOptions.selectOption")}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={onClose}
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "text.primary",
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Transaction Info Card */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: "20px",
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha("#FFFFFF", 0.8),
                  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.04)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Chip
                    size="small"
                    icon={typeInfo.icon}
                    label={typeInfo.label}
                    sx={{
                      bgcolor: alpha(typeInfo.color, isDarkMode ? 0.15 : 0.1),
                      color: typeInfo.color,
                      fontWeight: 500,
                      fontSize: 12,
                      "& .MuiChip-icon": {
                        color: "inherit",
                      },
                    }}
                  />
                  <Chip
                    size="small"
                    label={transaction.type === "income" ? t("transactions.income") : t("transactions.expense")}
                    sx={{
                      bgcolor: alpha(
                        transaction.type === "income" ? theme.palette.success.main : theme.palette.error.main,
                        isDarkMode ? 0.15 : 0.1
                      ),
                      color: transaction.type === "income" ? "success.main" : "error.main",
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  />
                </Stack>
                <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
                  {transaction.description}
                </Typography>
                <Typography variant="h5" fontWeight={700} color={transaction.type === "income" ? "success.main" : "error.main"}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(transaction.amount)}
                </Typography>
                {typeInfo.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    {typeInfo.description}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Options List */}
            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 1,
                  color: "text.secondary",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  fontSize: 11,
                }}
              >
                {t("transactionOptions.chooseAction")}
              </Typography>

              <List sx={{ mt: 1 }}>
                {options.map((option, index) => (
                  <MotionBox
                    key={option.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ListItemButton
                      onClick={() => onSelect(option.id)}
                      sx={{
                        borderRadius: "20px",
                        mb: 1.5,
                        p: 2,
                        border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                        bgcolor: isDarkMode
                          ? alpha(theme.palette.background.default, 0.3)
                          : alpha("#FFFFFF", 0.8),
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: alpha(option.color, 0.5),
                          bgcolor: alpha(option.color, isDarkMode ? 0.08 : 0.04),
                          transform: "translateX(-4px)",
                          boxShadow: `4px 0 0 0 ${option.color}`,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: alpha(option.color, isDarkMode ? 0.15 : 0.1),
                            color: option.color,
                          }}
                        >
                          {option.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                            {option.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {option.description}
                            </Typography>
                            {option.warning && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  mt: 1,
                                  p: 1,
                                  borderRadius: "20px",
                                  bgcolor: alpha(theme.palette.warning.main, isDarkMode ? 0.1 : 0.08),
                                }}
                              >
                                <WarningIcon
                                  sx={{
                                    fontSize: 14,
                                    color: "warning.main",
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "warning.main",
                                    fontWeight: 500,
                                  }}
                                >
                                  {option.warning}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </MotionBox>
                ))}
              </List>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                p: 3,
                pt: 2,
                borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                bgcolor: isDarkMode
                  ? alpha(theme.palette.background.default, 0.5)
                  : alpha(theme.palette.grey[50], 0.8),
              }}
            >
              {/* Info tip */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  p: 1.5,
                  mb: 2,
                  borderRadius: "20px",
                  bgcolor: alpha(theme.palette.info.main, isDarkMode ? 0.1 : 0.08),
                }}
              >
                <InfoIcon sx={{ fontSize: 18, color: "info.main", mt: 0.25 }} />
                <Typography variant="caption" color="info.main" sx={{ lineHeight: 1.4 }}>
                  {isInstallment
                    ? t("transactionOptions.tips.installment")
                    : t("transactionOptions.tips.recurring")}
                </Typography>
              </Box>

              <Button
                onClick={onClose}
                fullWidth
                variant="outlined"
                sx={{
                  borderRadius: "20px",
                  py: 1.5,
                  borderColor: isDarkMode ? alpha("#FFFFFF", 0.15) : alpha("#000000", 0.15),
                  color: "text.secondary",
                  "&:hover": {
                    borderColor: isDarkMode ? alpha("#FFFFFF", 0.3) : alpha("#000000", 0.3),
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                {t("common.cancel")}
              </Button>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Drawer>
  );
};

export default TransactionOptionsPanel;

