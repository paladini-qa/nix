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
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  SwapHoriz as SwapIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction, SharedEditOption } from "../types";

const MotionBox = motion.create(Box);

interface SharedOptionsDialogProps {
  open: boolean;
  transaction: Transaction | null;
  relatedTransaction: Transaction | null;
  actionType: "edit" | "delete";
  onSelect: (option: SharedEditOption) => void;
  onCancel: () => void;
}

// Padronizado com TransactionOptionsPanel
const SIDE_PANEL_WIDTH = 520;
const SIDE_PANEL_WIDTH_MOBILE = "100vw";

/**
 * Side Panel para escolher como editar/deletar transações compartilhadas.
 * UI padronizada com TransactionOptionsPanel.
 */
const SharedOptionsDialog: React.FC<SharedOptionsDialogProps> = ({
  open,
  transaction,
  relatedTransaction,
  actionType,
  onSelect,
  onCancel,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  if (!transaction) return null;

  const isExpense = transaction.type === "expense";
  const isEdit = actionType === "edit";
  const actionColor = isEdit ? theme.palette.primary.main : theme.palette.error.main;

  // Descrições das transações
  const thisDescription = transaction.description;
  const thisAmount = transaction.amount;
  const relatedDescription = relatedTransaction?.description || "";
  const relatedAmount = relatedTransaction?.amount || 0;

  const options = [
    {
      id: "this_only" as SharedEditOption,
      icon: <PersonIcon />,
      color: theme.palette.info.main,
      title: isEdit ? "Editar apenas esta" : "Excluir apenas esta",
      description: `Apenas a ${isExpense ? "despesa" : "receita"} será ${isEdit ? "editada" : "excluída"}, a relacionada permanece inalterada`,
      warning: null,
    },
    {
      id: "related_only" as SharedEditOption,
      icon: <SwapIcon />,
      color: theme.palette.warning.main,
      title: isEdit ? "Editar apenas a relacionada" : "Excluir apenas a relacionada",
      description: `Apenas a ${isExpense ? "receita do amigo" : "despesa original"} será ${isEdit ? "editada" : "excluída"}`,
      warning: null,
    },
    {
      id: "both" as SharedEditOption,
      icon: <PeopleIcon />,
      color: theme.palette.error.main,
      title: isEdit ? "Editar as duas" : "Excluir as duas",
      description: `Ambas as transações vinculadas serão ${isEdit ? "editadas" : "excluídas"} simultaneamente`,
      warning: isEdit ? null : "Esta ação não pode ser desfeita",
    },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          width: isMobile ? SIDE_PANEL_WIDTH_MOBILE : SIDE_PANEL_WIDTH,
          maxWidth: "100vw",
          bgcolor: isDarkMode ? theme.palette.background.default : "#FAFBFC",
          backgroundImage: "none",
          borderLeft: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
          boxShadow: isDarkMode
            ? `-24px 0 80px -20px ${alpha("#000000", 0.5)}`
            : `-24px 0 80px -20px ${alpha(theme.palette.primary.main, 0.12)}`,
          display: "flex",
          flexDirection: "column",
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
                      bgcolor: alpha(actionColor, isDarkMode ? 0.15 : 0.1),
                      color: isEdit ? "primary.main" : "error.main",
                    }}
                  >
                    <PeopleIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {isEdit ? "Editar Compartilhada" : "Excluir Compartilhada"}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      color="text.secondary"
                    >
                      Transação vinculada com amigo
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={onCancel}
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
                    ? "transparent"
                    : alpha("#FFFFFF", 0.8),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Chip
                    size="small"
                    icon={<SwapIcon sx={{ fontSize: 14 }} />}
                    label="Transação Compartilhada"
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, isDarkMode ? 0.15 : 0.1),
                      color: "secondary.main",
                      fontWeight: 500,
                      fontSize: 12,
                      "& .MuiChip-icon": {
                        color: "inherit",
                      },
                    }}
                  />
                  <Chip
                    size="small"
                    label={isExpense ? "Despesa" : "Receita"}
                    sx={{
                      bgcolor: alpha(
                        isExpense ? theme.palette.error.main : theme.palette.success.main,
                        isDarkMode ? 0.15 : 0.1
                      ),
                      color: isExpense ? "error.main" : "success.main",
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  />
                </Stack>

                {/* Duas transações lado a lado */}
                <Box 
                  sx={{ 
                    display: "flex", 
                    alignItems: "stretch", 
                    gap: 1.5,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                  }}
                >
                  {/* Minha transação */}
                  <Box 
                    sx={{ 
                      flex: 1, 
                      minWidth: { xs: "100%", sm: 0 },
                      p: 1.5, 
                      borderRadius: "16px",
                      bgcolor: alpha(isExpense ? theme.palette.error.main : theme.palette.success.main, 0.08),
                      border: `1px solid ${alpha(isExpense ? theme.palette.error.main : theme.palette.success.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 11 }}>
                      {isExpense ? "Minha Despesa" : "Minha Receita"}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      sx={{ 
                        mt: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {thisDescription}
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={700} 
                      color={isExpense ? "error.main" : "success.main"}
                      sx={{ mt: 0.5 }}
                    >
                      {isExpense ? "-" : "+"}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(thisAmount)}
                    </Typography>
                  </Box>

                  {/* Ícone de conexão - oculto em mobile */}
                  <Box 
                    sx={{ 
                      display: { xs: "none", sm: "flex" }, 
                      alignItems: "center", 
                      px: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    <SwapIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                  </Box>

                  {/* Transação relacionada */}
                  <Box 
                    sx={{ 
                      flex: 1, 
                      minWidth: { xs: "100%", sm: 0 },
                      p: 1.5, 
                      borderRadius: "16px",
                      bgcolor: alpha(!isExpense ? theme.palette.error.main : theme.palette.success.main, 0.08),
                      border: `1px solid ${alpha(!isExpense ? theme.palette.error.main : theme.palette.success.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 11 }}>
                      {isExpense ? "Receita do Amigo" : "Despesa Original"}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      sx={{ 
                        mt: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {relatedDescription}
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={700} 
                      color={!isExpense ? "error.main" : "success.main"}
                      sx={{ mt: 0.5 }}
                    >
                      {!isExpense ? "-" : "+"}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(relatedAmount)}
                    </Typography>
                  </Box>
                </Box>
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
                Escolha uma opção
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
                        bgcolor: isDarkMode
                          ? "transparent"
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
                  Transações compartilhadas mantêm o vínculo com o saldo do seu amigo. Alterações podem afetar o valor a receber/pagar.
                </Typography>
              </Box>

              <Button
                onClick={onCancel}
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
                Cancelar
              </Button>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Drawer>
  );
};

export default SharedOptionsDialog;
