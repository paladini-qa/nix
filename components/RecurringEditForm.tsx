import React, { useState, useEffect } from "react";
import {
  Drawer,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
  IconButton,
  Divider,
  Alert,
  alpha,
  Chip,
  keyframes,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  Close as CloseIcon,
  SaveAlt as SaveIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  AllInclusive as AllIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Transaction, TransactionType } from "../types";
import { OptionType as EditOption } from "./TransactionOptionsPanel";

// Animação de entrada suave
const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Largura do Side Panel
const SIDE_PANEL_WIDTH = 520;
const SIDE_PANEL_WIDTH_MOBILE = "100vw";

interface RecurringEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    transaction: Omit<Transaction, "id" | "createdAt">,
    editId?: string,
    editMode?: EditOption
  ) => Promise<void> | void;
  transaction: Transaction | null;
  editMode: EditOption;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  // Data da ocorrência virtual (para all_future)
  virtualDate?: string;
}

const RecurringEditForm: React.FC<RecurringEditFormProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  editMode,
  categories,
  paymentMethods,
  virtualDate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  // Form states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("monthly");

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction && isOpen) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setCategory(transaction.category);
      setPaymentMethod(transaction.paymentMethod);
      setFrequency(transaction.frequency || "monthly");
      
      // Para "all_future", usa a data da ocorrência virtual
      if (editMode === "all_future" && virtualDate) {
        setDate(dayjs(virtualDate));
      } else if (editMode === "single" && virtualDate) {
        setDate(dayjs(virtualDate));
      } else {
        setDate(dayjs(transaction.date));
      }
    }
  }, [transaction, isOpen, editMode, virtualDate]);

  const handleSave = async () => {
    if (!transaction) return;

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newTx: Omit<Transaction, "id" | "createdAt"> = {
      description,
      amount: parsedAmount,
      type,
      category,
      paymentMethod,
      date: date?.format("YYYY-MM-DD") || transaction.date,
      // Para "single", não é mais recorrente
      isRecurring: editMode === "single" ? false : transaction.isRecurring,
      frequency: editMode === "single" ? undefined : frequency,
      // Mantém outros campos
      isShared: transaction.isShared,
      sharedWith: transaction.sharedWith,
      iOwe: transaction.iOwe,
    };

    // Para "single" de virtual, passa undefined como editId para criar nova transação
    const editId = editMode === "single" && transaction.isVirtual 
      ? undefined 
      : transaction.id;

    // Aguarda onSave completar antes de fechar (onSave é assíncrono)
    await onSave(newTx, editId, editMode);
    onClose();
  };

  const getEditModeInfo = () => {
    const isVirtual = transaction?.isVirtual;
    const isRecurring = transaction?.isRecurring;
    const isInstallment = transaction?.installments && transaction.installments > 1;

    switch (editMode) {
      case "single":
        if (isVirtual) {
          return {
            icon: <TodayIcon color="info" />,
            title: "Editar Esta Ocorrência",
            description: "As alterações serão aplicadas apenas para esta data. A recorrência original continuará normalmente.",
            color: theme.palette.info.main,
          };
        }
        return {
          icon: <TodayIcon color="info" />,
          title: "Editar Apenas Esta",
          description: isInstallment 
            ? `Apenas a parcela ${transaction?.currentInstallment}/${transaction?.installments} será alterada.`
            : "Apenas esta ocorrência será alterada.",
          color: theme.palette.info.main,
        };
      case "all_future":
        return {
          icon: <DateRangeIcon color="warning" />,
          title: "Editar Esta e Futuras",
          description: isRecurring || isVirtual
            ? `As mudanças serão aplicadas a partir de ${date?.format("DD/MM/YYYY")}. Ocorrências anteriores serão preservadas com os valores originais.`
            : `Parcelas a partir da ${transaction?.currentInstallment}ª serão alteradas.`,
          color: theme.palette.warning.main,
        };
      case "all":
        return {
          icon: <AllIcon color="error" />,
          title: "Editar Todas",
          description: isRecurring || isVirtual
            ? "Todas as ocorrências (passadas e futuras) serão alteradas."
            : `Todas as ${transaction?.installments} parcelas serão alteradas.`,
          color: theme.palette.error.main,
        };
      default:
        return {
          icon: <RepeatIcon color="primary" />,
          title: "Editar Transação",
          description: "",
          color: theme.palette.primary.main,
        };
    }
  };

  const modeInfo = getEditModeInfo();
  const categoryList = type === "income" ? categories.income : categories.expense;

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "20px",
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.default, 0.5)
        : alpha(theme.palette.primary.main, 0.02),
      transition: "all 0.2s ease-in-out",
      "& fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.1)
          : alpha(theme.palette.primary.main, 0.12),
        borderWidth: 1.5,
      },
      "&:hover fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.2)
          : alpha(theme.palette.primary.main, 0.25),
      },
      "&.Mui-focused fieldset": {
        border: "none",
      },
    },
  };

  if (!transaction) return null;

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      elevation={0}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: isDarkMode
              ? alpha("#0F172A", 0.6)
              : alpha("#64748B", 0.25),
            backdropFilter: "blur(4px)",
          },
        },
      }}
      PaperProps={{
        sx: {
          width: isMobile ? SIDE_PANEL_WIDTH_MOBILE : SIDE_PANEL_WIDTH,
          maxWidth: "100vw",
          bgcolor: isDarkMode ? theme.palette.background.default : "#FAFBFC",
          backgroundImage: "none", // Remove o overlay do MUI
          borderLeft: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
          boxShadow: isDarkMode
            ? `-24px 0 80px -20px ${alpha("#000000", 0.5)}`
            : `-24px 0 80px -20px ${alpha(theme.palette.primary.main, 0.12)}`,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ====== NOTION-STYLE HEADER ====== */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.default, 0.85)
            : alpha("#FAFBFC", 0.9),
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.04)}`,
        }}
      >
        {/* Top Bar com Breadcrumb e Fechar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.5,
            minHeight: 52,
          }}
        >
          {/* Breadcrumb estilo Notion */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              animation: `${slideInRight} 0.3s ease-out`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                transition: "color 0.15s ease",
                "&:hover": {
                  color: "text.primary",
                },
              }}
              onClick={onClose}
            >
              {transaction.isRecurring ? "Recorrentes" : "Parceladas"}
            </Typography>
            <ChevronRightIcon sx={{ fontSize: 16, color: "text.disabled" }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Editar
            </Typography>
          </Box>

          {/* Botão Fechar */}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              bgcolor: isDarkMode
                ? alpha("#FFFFFF", 0.05)
                : alpha("#000000", 0.04),
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: isDarkMode
                  ? alpha("#FFFFFF", 0.1)
                  : alpha("#000000", 0.08),
                transform: "scale(1.05)",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Título principal com ícone */}
        <Box
          sx={{
            px: 3,
            pb: 2.5,
            pt: 0.5,
            animation: `${slideInRight} 0.35s ease-out`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${alpha(modeInfo.color, 0.15)} 0%, ${alpha(modeInfo.color, 0.25)} 100%)`,
                border: `1px solid ${alpha(modeInfo.color, 0.2)}`,
                transition: "all 0.2s ease",
              }}
            >
              <EditIcon
                sx={{
                  fontSize: 22,
                  color: modeInfo.color,
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="h5"
                fontWeight={700}
                letterSpacing="-0.02em"
                sx={{
                  background: isDarkMode
                    ? "linear-gradient(135deg, #fff 0%, #94A3B8 100%)"
                    : "linear-gradient(135deg, #1A1A2E 0%, #475569 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {modeInfo.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {transaction.description}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ====== FORM CONTENT ====== */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          px: 3,
          pt: 2,
          pb: isMobile ? 14 : 3,
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: isDarkMode
              ? alpha("#FFFFFF", 0.1)
              : alpha("#000000", 0.1),
            borderRadius: 3,
            "&:hover": {
              bgcolor: isDarkMode
                ? alpha("#FFFFFF", 0.2)
                : alpha("#000000", 0.2),
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Edit Mode Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "20px",
              bgcolor: alpha(modeInfo.color, 0.08),
              border: `1px solid ${alpha(modeInfo.color, 0.2)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: "12px",
                  bgcolor: alpha(modeInfo.color, 0.15),
                  display: "flex",
                }}
              >
                {modeInfo.icon}
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {modeInfo.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {modeInfo.description}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Transaction Type Chip */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Chip
              icon={transaction.isRecurring ? <RepeatIcon /> : <CreditCardIcon />}
              label={transaction.isRecurring ? "Recorrente" : `Parcela ${transaction.currentInstallment}/${transaction.installments}`}
              color={transaction.isRecurring ? "primary" : "warning"}
              variant="outlined"
              sx={{ borderRadius: "12px" }}
            />
            <Chip
              label={transaction.type === "income" ? "Receita" : "Despesa"}
              color={transaction.type === "income" ? "success" : "error"}
              size="small"
              sx={{ borderRadius: "12px" }}
            />
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Description */}
          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            sx={inputSx}
          />

          {/* Amount */}
          <TextField
            label="Valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            type="text"
            inputMode="decimal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography fontWeight={600} color="text.secondary">R$</Typography>
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />

          {/* Category */}
          <FormControl fullWidth sx={inputSx}>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={category}
              label="Categoria"
              onChange={(e) => setCategory(e.target.value)}
            >
              {categoryList.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Payment Method */}
          <FormControl fullWidth sx={inputSx}>
            <InputLabel>Método de Pagamento</InputLabel>
            <Select
              value={paymentMethod}
              label="Método de Pagamento"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {paymentMethods.map((pm) => (
                <MenuItem key={pm} value={pm}>
                  {pm}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date - Only show for single or all_future */}
          {(editMode === "single" || editMode === "all_future") && (
            <DatePicker
              label={editMode === "all_future" ? "Aplicar a partir de" : "Data"}
              value={date}
              onChange={(newDate) => setDate(newDate)}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: inputSx,
                },
              }}
            />
          )}

          {/* Frequency - Only for recurring and not single */}
          {transaction.isRecurring && editMode !== "single" && (
            <FormControl fullWidth sx={inputSx}>
              <InputLabel>Frequência</InputLabel>
              <Select
                value={frequency}
                label="Frequência"
                onChange={(e) => setFrequency(e.target.value as "monthly" | "yearly")}
              >
                <MenuItem value="monthly">Mensal</MenuItem>
                <MenuItem value="yearly">Anual</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Warning for all_future */}
          {editMode === "all_future" && (transaction.isRecurring || transaction.isVirtual) && (
            <Alert severity="info" sx={{ borderRadius: "16px" }}>
              As ocorrências anteriores a {date?.format("DD/MM/YYYY")} serão preservadas como transações independentes com os valores originais.
            </Alert>
          )}
        </Box>
      </Box>

      {/* ====== BOTTOM ACTION BAR ====== */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          p: 2.5,
          pb: isMobile ? "calc(20px + env(safe-area-inset-bottom, 0px))" : 2.5,
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.default, 0.95)
            : alpha("#FAFBFC", 0.98),
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.04)}`,
          boxShadow: isDarkMode
            ? `0 -8px 32px -8px ${alpha("#000000", 0.3)}`
            : `0 -8px 32px -8px ${alpha(theme.palette.primary.main, 0.08)}`,
          display: "flex",
          gap: 1.5,
        }}
      >
        {!isMobile && (
          <Button
            onClick={onClose}
            color="inherit"
            sx={{
              borderRadius: "14px",
              px: 3,
              py: 1.25,
              fontWeight: 500,
              color: "text.secondary",
              bgcolor: isDarkMode
                ? alpha("#FFFFFF", 0.05)
                : alpha("#000000", 0.04),
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: isDarkMode
                  ? alpha("#FFFFFF", 0.1)
                  : alpha("#000000", 0.08),
              },
            }}
          >
            Cancelar
          </Button>
        )}
        <Button
          variant="contained"
          size="large"
          fullWidth={isMobile}
          onClick={handleSave}
          startIcon={<SaveIcon />}
          sx={{
            flex: 1,
            borderRadius: "14px",
            py: 1.5,
            fontWeight: 600,
            background: `linear-gradient(135deg, ${modeInfo.color} 0%, ${alpha(modeInfo.color, 0.8)} 100%)`,
            boxShadow: `0 8px 24px -8px ${alpha(modeInfo.color, 0.5)}`,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 12px 32px -8px ${alpha(modeInfo.color, 0.6)}`,
            },
            "&:active": {
              transform: isMobile ? "scale(0.98)" : "translateY(0)",
            },
          }}
        >
          Salvar Alterações
        </Button>
      </Box>
    </Drawer>
  );
};

export default RecurringEditForm;
