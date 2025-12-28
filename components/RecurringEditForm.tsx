import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Slide,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Alert,
  alpha,
  Chip,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  SaveAlt as SaveIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  AllInclusive as AllIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { Transaction, TransactionType } from "../types";
import { EditOption } from "./EditOptionsDialog";

// Mobile slide transition
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface RecurringEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    transaction: Omit<Transaction, "id" | "createdAt">,
    editId?: string,
    editMode?: EditOption
  ) => void;
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

  const handleSave = () => {
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

    onSave(newTx, editId, editMode);
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
            title: "Criar Nova Transação",
            description: "Uma nova transação será criada apenas para esta data. A recorrência original não será alterada.",
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
      borderRadius: 2,
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.default, 0.5)
        : alpha(theme.palette.primary.main, 0.02),
    },
  };

  if (!transaction) return null;

  const content = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Edit Mode Banner */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(modeInfo.color, 0.08),
          border: `1px solid ${alpha(modeInfo.color, 0.2)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              bgcolor: alpha(modeInfo.color, 0.15),
              display: "flex",
            }}
          >
            {modeInfo.icon}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {modeInfo.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {modeInfo.description}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Transaction Type Chip */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Chip
          icon={transaction.isRecurring ? <RepeatIcon /> : <CreditCardIcon />}
          label={transaction.isRecurring ? "Recorrente" : `Parcela ${transaction.currentInstallment}/${transaction.installments}`}
          color={transaction.isRecurring ? "primary" : "warning"}
          variant="outlined"
        />
        <Chip
          label={transaction.type === "income" ? "Receita" : "Despesa"}
          color={transaction.type === "income" ? "success" : "error"}
          size="small"
        />
      </Box>

      <Divider />

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
          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
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
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          As ocorrências anteriores a {date?.format("DD/MM/YYYY")} serão preservadas como transações independentes com os valores originais.
        </Alert>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Dialog
        open={isOpen}
        onClose={onClose}
        fullScreen
        TransitionComponent={SlideTransition}
      >
        <AppBar sx={{ position: "relative" }} color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
              {modeInfo.title}
            </Typography>
            <Button
              color="primary"
              variant="contained"
              onClick={handleSave}
              startIcon={<SaveIcon />}
            >
              Salvar
            </Button>
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ pt: 2 }}>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={700}>
            {modeInfo.title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {content}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<SaveIcon />}
        >
          Salvar Alterações
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringEditForm;

