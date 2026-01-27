import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  IconButton,
  useMediaQuery,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { PendingTransaction, TransactionType } from "../types";
import { openFinanceService } from "../services/api";
import { useNotification } from "../contexts";
import { Transaction } from "../types";

interface PendingTransactionFormProps {
  open: boolean;
  onClose: () => void;
  transaction: PendingTransaction;
  paymentMethods: string[];
  categories: { income: string[]; expense: string[] };
  userId: string;
  onTransactionCreate?: (transaction: any) => void;
}

const PendingTransactionForm: React.FC<PendingTransactionFormProps> = ({
  open,
  onClose,
  transaction,
  paymentMethods,
  categories,
  userId,
  onTransactionCreate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { showNotification } = useNotification();

  // Estados do formulário
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Dayjs | null>(null);
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Inicializa formulário com dados da transação pendente
  useEffect(() => {
    if (transaction && open) {
      setDescription(transaction.description || transaction.rawDescription);
      setAmount(String(transaction.amount || transaction.rawAmount));
      setDate(
        transaction.date
          ? dayjs(transaction.date)
          : dayjs(transaction.rawDate)
      );
      setType(
        transaction.type ||
          (transaction.rawType === "DEBIT" ? "expense" : "income")
      );
      setCategory(transaction.category || "");
      setPaymentMethod(transaction.paymentMethod || "");
    }
  }, [transaction, open]);

  // Validação
  const isValid = () => {
    return (
      description.trim() !== "" &&
      amount !== "" &&
      parseFloat(amount) > 0 &&
      date !== null &&
      category !== "" &&
      paymentMethod !== ""
    );
  };

  // Confirma transação
  const handleConfirm = async () => {
    if (!isValid()) {
      showNotification({ message: "Preencha todos os campos obrigatórios", severity: "error" });
      return;
    }

    try {
      setIsSaving(true);

      // Atualiza transação pendente
      await openFinanceService.updatePendingTransaction(
        transaction.id,
        userId,
        {
          description,
          amount: parseFloat(amount),
          date: date!.format("YYYY-MM-DD"),
          type,
          category,
          paymentMethod,
          status: "confirmed",
        }
      );

      // Cria transação normal
      const newTransaction: Omit<Transaction, "id" | "createdAt"> = {
        description,
        amount: parseFloat(amount),
        type,
        category,
        paymentMethod,
        date: date!.format("YYYY-MM-DD"),
        isPaid: true,
      };

      if (onTransactionCreate) {
        await onTransactionCreate(newTransaction);
      }

      showNotification({ message: "Transação confirmada com sucesso", severity: "success" });
      onClose();
    } catch (error: any) {
      console.error("Error confirming transaction:", error);
      showNotification(
        error.message || "Erro ao confirmar transação",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Cancela transação
  const handleCancel = async () => {
    try {
      setIsSaving(true);
      await openFinanceService.updatePendingTransaction(
        transaction.id,
        userId,
        {
          status: "cancelled",
        }
      );
      showNotification({ message: "Transação cancelada", severity: "info" });
      onClose();
    } catch (error: any) {
      console.error("Error cancelling transaction:", error);
      showNotification({ message: "Erro ao cancelar transação", severity: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : "20px",
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.95)
            : alpha("#FFFFFF", 0.98),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isMobile
            ? "none"
            : `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
          boxShadow: isDarkMode
            ? `0 24px 80px -20px ${alpha("#000000", 0.6)}`
            : `0 24px 80px -20px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: isDarkMode
              ? alpha("#0F172A", 0.8)
              : alpha("#64748B", 0.4),
            backdropFilter: "blur(8px)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Confirmar Transação
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "text.primary",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Tipo de Transação */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tipo
            </Typography>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, newType) => {
                if (newType !== null) setType(newType);
              }}
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 500,
                  py: 1.5,
                },
              }}
            >
              <ToggleButton value="expense" color="error">
                <ArrowDownIcon sx={{ mr: 1 }} />
                Despesa
              </ToggleButton>
              <ToggleButton value="income" color="success">
                <ArrowUpIcon sx={{ mr: 1 }} />
                Receita
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Descrição */}
          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />

          {/* Valor */}
          <TextField
            label="Valor"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            required
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />

          {/* Data */}
          <DatePicker
            label="Data"
            value={date}
            onChange={(newValue) => setDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                sx: {
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  },
                },
              },
            }}
          />

          {/* Categoria */}
          <FormControl fullWidth required>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Categoria"
              sx={{
                borderRadius: "12px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderRadius: "12px",
                },
              }}
            >
              {(type === "income"
                ? categories.income
                : categories.expense
              ).map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Método de Pagamento */}
          <FormControl fullWidth required>
            <InputLabel>Método de Pagamento</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Método de Pagamento"
              sx={{
                borderRadius: "12px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderRadius: "12px",
                },
              }}
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          {/* Informações Originais */}
          <Box
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Dados originais do Open Finance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {transaction.rawDescription}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(transaction.rawAmount)}{" "}
              • {transaction.rawType === "DEBIT" ? "Débito" : "Crédito"} •{" "}
              {new Date(transaction.rawDate).toLocaleDateString("pt-BR")}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={handleCancel}
          disabled={isSaving}
          color="error"
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isSaving || !isValid()}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          {isSaving ? "Confirmando..." : "Confirmar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PendingTransactionForm;
