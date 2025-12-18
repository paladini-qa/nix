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
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  Grid,
  useMediaQuery,
  useTheme,
  Slide,
  AppBar,
  Toolbar,
  Divider,
  ListSubheader,
  Alert,
  Collapse,
  alpha,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  Close as CloseIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  SaveAlt as SaveIcon,
} from "@mui/icons-material";
import { Transaction, TransactionType } from "../types";

// Mobile slide transition
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    transaction: Omit<Transaction, "id" | "createdAt">,
    editId?: string
  ) => void;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  editTransaction?: Transaction | null;
  friends: string[];
  onAddFriend: (friend: string) => void;
}

// Estilos do input customizado - soft e orgânico
const getInputSx = (theme: any, isDarkMode: boolean) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.default, 0.5)
      : alpha(theme.palette.primary.main, 0.02),
    transition: "all 0.2s ease-in-out",
    "& fieldset": {
      borderColor: isDarkMode
        ? alpha("#FFFFFF", 0.08)
        : alpha(theme.palette.primary.main, 0.1),
      borderWidth: 1.5,
      transition: "all 0.2s ease-in-out",
    },
    "&:hover fieldset": {
      borderColor: isDarkMode
        ? alpha("#FFFFFF", 0.15)
        : alpha(theme.palette.primary.main, 0.2),
    },
    "&.Mui-focused": {
      bgcolor: isDarkMode
        ? alpha(theme.palette.primary.main, 0.08)
        : alpha(theme.palette.primary.main, 0.04),
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      borderWidth: 1.5,
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 500,
  },
});

// Estilos do toggle button/paper - premium feel
const getTogglePaperSx = (isActive: boolean, accentColor: string, theme: any, isDarkMode: boolean) => ({
  p: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  borderRadius: 1,
  transition: "all 0.2s ease-in-out",
  border: `1.5px solid ${isActive
    ? alpha(accentColor, 0.4)
    : isDarkMode
      ? alpha("#FFFFFF", 0.08)
      : alpha("#000000", 0.08)}`,
  bgcolor: isActive
    ? isDarkMode
      ? alpha(accentColor, 0.1)
      : alpha(accentColor, 0.06)
    : isDarkMode
      ? alpha(theme.palette.background.default, 0.3)
      : alpha("#FFFFFF", 0.6),
  boxShadow: isActive
    ? `0 4px 12px -4px ${alpha(accentColor, 0.25)}`
    : "none",
  "&:hover": {
    bgcolor: isActive
      ? isDarkMode
        ? alpha(accentColor, 0.15)
        : alpha(accentColor, 0.1)
      : isDarkMode
        ? alpha(theme.palette.background.default, 0.5)
        : alpha(theme.palette.primary.main, 0.04),
    transform: "translateY(-1px)",
  },
});

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  paymentMethods,
  editTransaction,
  friends,
  onAddFriend,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("monthly");
  const [hasInstallments, setHasInstallments] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [isShared, setIsShared] = useState(false);
  const [sharedWith, setSharedWith] = useState("");
  const [newFriendName, setNewFriendName] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputSx = getInputSx(theme, isDarkMode);

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setPaymentMethod(editTransaction.paymentMethod);
      setDate(dayjs(editTransaction.date));
      setIsRecurring(editTransaction.isRecurring || false);
      setFrequency(editTransaction.frequency || "monthly");
      setHasInstallments(
        editTransaction.installments !== undefined &&
          editTransaction.installments > 1
      );
      setInstallments(editTransaction.installments?.toString() || "2");
      setIsShared(editTransaction.isShared || false);
      setSharedWith(editTransaction.sharedWith || "");
    } else {
      setDescription("");
      setAmount("");
      setType("expense");
      setCategory("");
      setPaymentMethod("");
      setDate(dayjs());
      setIsRecurring(false);
      setFrequency("monthly");
      setHasInstallments(false);
      setInstallments("2");
      setIsShared(false);
      setSharedWith("");
    }
    setNewFriendName("");
    setShowAddFriend(false);
    setValidationError(null);
  }, [editTransaction, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    // Valor é opcional - pode ser definido depois
    if (!description || !category || !paymentMethod || !date) {
      return;
    }

    const installmentsValue = parseInt(installments);
    if (
      hasInstallments &&
      (isNaN(installmentsValue) || installmentsValue < 2)
    ) {
      setValidationError("Installments must be at least 2.");
      return;
    }

    // Validação: se isShared, precisa selecionar um amigo
    if (isShared && !sharedWith) {
      setValidationError("Please select a friend to share with.");
      return;
    }

    onSave(
      {
        description,
        amount: amount ? parseFloat(amount) : 0,
        type,
        category,
        paymentMethod,
        date: date.format("YYYY-MM-DD"),
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        installments: hasInstallments ? installmentsValue : undefined,
        currentInstallment: hasInstallments
          ? editTransaction?.currentInstallment || 1
          : undefined,
        isShared,
        sharedWith: isShared ? sharedWith : undefined,
      },
      editTransaction?.id || undefined // Passa undefined se id for vazio (para criar nova transação)
    );

    onClose();
  };

  const handleAddNewFriend = () => {
    const trimmedName = newFriendName.trim();
    if (trimmedName && !friends.includes(trimmedName)) {
      onAddFriend(trimmedName);
      setSharedWith(trimmedName);
      setNewFriendName("");
      setShowAddFriend(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={isMobile ? SlideTransition : undefined}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 1,
          // Glassmorphism no modal
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.85)
            : alpha("#FFFFFF", 0.95),
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
      {/* Mobile Header */}
      {isMobile ? (
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.paper, 0.9)
              : alpha("#FFFFFF", 0.9),
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
            color: "text.primary",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={onClose}
              sx={{
                mr: 2,
                bgcolor: isDarkMode
                  ? alpha("#FFFFFF", 0.05)
                  : alpha("#000000", 0.04),
                "&:hover": {
                  bgcolor: isDarkMode
                    ? alpha("#FFFFFF", 0.1)
                    : alpha("#000000", 0.08),
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1, letterSpacing: "-0.01em" }}>
              {editTransaction ? "Editar Transação" : "Nova Transação"}
            </Typography>
            <Button
              type="submit"
              form="transaction-form"
              variant="contained"
              size="small"
              sx={{
                borderRadius: 1,
                px: 2.5,
                fontWeight: 600,
                boxShadow: `0 4px 14px -4px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              Salvar
            </Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
          }}
        >
          <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em">
            {editTransaction ? "Editar Transação" : "Nova Transação"}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: isDarkMode
                ? alpha("#FFFFFF", 0.05)
                : alpha("#000000", 0.04),
              "&:hover": {
                bgcolor: isDarkMode
                  ? alpha("#FFFFFF", 0.1)
                  : alpha("#000000", 0.08),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <form id="transaction-form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{
            pt: isMobile ? 3 : 1,
            pb: 3,
            // Removido dividers - mais clean
            borderTop: "none",
            borderBottom: "none",
          }}
        >
          {/* Breathing Room - gap aumentado para 3.5 */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            {/* Validation Error Alert */}
            <Collapse in={!!validationError}>
              <Alert 
                severity="error" 
                onClose={() => setValidationError(null)}
                sx={{
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                {validationError}
              </Alert>
            </Collapse>

            {/* Type Toggle - Premium Style */}
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, newType) => {
                if (newType) {
                  setType(newType);
                  setCategory("");
                }
              }}
              fullWidth
              sx={{
                bgcolor: isDarkMode
                  ? alpha(theme.palette.background.default, 0.3)
                  : alpha("#000000", 0.02),
                borderRadius: 1,
                p: 0.5,
                "& .MuiToggleButtonGroup-grouped": {
                  border: 0,
                  borderRadius: "10px !important",
                  mx: 0.25,
                },
                "& .MuiToggleButton-root": {
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  transition: "all 0.2s ease-in-out",
                  "&:not(.Mui-selected)": {
                    color: "text.secondary",
                  },
                },
              }}
            >
              <ToggleButton
                value="income"
                sx={{
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.success.main, isDarkMode ? 0.2 : 0.15),
                    color: theme.palette.success.main,
                    boxShadow: `0 4px 12px -4px ${alpha(theme.palette.success.main, 0.3)}`,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.success.main, isDarkMode ? 0.25 : 0.2),
                    },
                  },
                }}
              >
                💰 Receita
              </ToggleButton>
              <ToggleButton
                value="expense"
                sx={{
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.error.main, isDarkMode ? 0.2 : 0.15),
                    color: theme.palette.error.main,
                    boxShadow: `0 4px 12px -4px ${alpha(theme.palette.error.main, 0.3)}`,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.error.main, isDarkMode ? 0.25 : 0.2),
                    },
                  },
                }}
              >
                💸 Despesa
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Descrição"
              required
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mercado, Aluguel, Salário..."
              sx={inputSx}
            />

            <TextField
              label="Valor (R$)"
              type="number"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Opcional - pode definir depois"
              helperText={!amount ? "Você pode adicionar o valor depois" : undefined}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography fontWeight={600} color="text.secondary">R$</Typography>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required sx={inputSx}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={category}
                    label="Categoria"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories[type].map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required sx={inputSx}>
                  <InputLabel>Forma de Pagamento</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Forma de Pagamento"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Data"
                  value={date}
                  onChange={(newValue) => setDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      sx: inputSx,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={getTogglePaperSx(isRecurring, theme.palette.primary.main, theme, isDarkMode)}
                  onClick={() => {
                    const newValue = !isRecurring;
                    setIsRecurring(newValue);
                    // Mutuamente exclusivo com parcelado
                    if (newValue) setHasInstallments(false);
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isRecurring
                          ? alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.12)
                          : alpha("#64748B", 0.1),
                        transition: "all 0.2s ease",
                      }}
                    >
                      <RepeatIcon
                        fontSize="small"
                        sx={{
                          color: isRecurring ? "primary.main" : "text.secondary",
                          transition: "color 0.2s ease",
                        }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={500}>
                      Recorrente?
                    </Typography>
                  </Box>
                  <Switch
                    checked={isRecurring}
                    size="small"
                    sx={{
                      "& .MuiSwitch-thumb": {
                        boxShadow: `0 2px 4px ${alpha("#000000", 0.2)}`,
                      },
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Shared Expense Toggle */}
            {type === "expense" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Paper
                  elevation={0}
                  sx={getTogglePaperSx(isShared, theme.palette.info.main, theme, isDarkMode)}
                  onClick={() => {
                    setIsShared(!isShared);
                    if (isShared) {
                      setSharedWith("");
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isShared
                          ? alpha(theme.palette.info.main, isDarkMode ? 0.2 : 0.12)
                          : alpha("#64748B", 0.1),
                        transition: "all 0.2s ease",
                      }}
                    >
                      <GroupIcon
                        fontSize="small"
                        sx={{
                          color: isShared ? "info.main" : "text.secondary",
                          transition: "color 0.2s ease",
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        Dividir 50/50?
                      </Typography>
                      {isShared && (
                        <Typography variant="caption" color="text.secondary">
                          Cria receita automática para reembolso
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Switch checked={isShared} size="small" color="info" />
                </Paper>

                {/* Friend Selection */}
                {isShared && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <FormControl fullWidth size="small" sx={inputSx}>
                      <InputLabel>Selecionar Amigo</InputLabel>
                      <Select
                        value={sharedWith}
                        label="Selecionar Amigo"
                        onChange={(e) => {
                          if (e.target.value === "__add_new__") {
                            setShowAddFriend(true);
                          } else {
                            setSharedWith(e.target.value);
                          }
                        }}
                      >
                        {friends.length > 0 && (
                          <ListSubheader>Amigos</ListSubheader>
                        )}
                        {friends.map((friend) => (
                          <MenuItem key={friend} value={friend}>
                            {friend}
                          </MenuItem>
                        ))}
                        <Divider />
                        <MenuItem value="__add_new__">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PersonAddIcon fontSize="small" color="primary" />
                            <Typography color="primary" fontWeight={500}>
                              Adicionar novo amigo...
                            </Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Add New Friend Form */}
                    {showAddFriend && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 1,
                          bgcolor: isDarkMode
                            ? alpha(theme.palette.primary.main, 0.08)
                            : alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Novo Amigo
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          <TextField
                            size="small"
                            placeholder="Nome do amigo"
                            value={newFriendName}
                            onChange={(e) => setNewFriendName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddNewFriend();
                              }
                            }}
                            fullWidth
                            autoFocus
                            sx={inputSx}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleAddNewFriend}
                            disabled={!newFriendName.trim()}
                            sx={{ borderRadius: 1, px: 2.5 }}
                          >
                            Add
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setShowAddFriend(false);
                              setNewFriendName("");
                            }}
                            sx={{ borderRadius: 1 }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      </Paper>
                    )}

                    {/* Preview of income that will be created */}
                    {sharedWith && amount && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 1,
                          bgcolor: isDarkMode
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.success.main, 0.06),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        }}
                      >
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          ✨ Receita automática:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          "{description || "Transação"} - {sharedWith}"
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                          +{new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(parseFloat(amount) / 2)}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {isRecurring && (
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Frequência</InputLabel>
                <Select
                  value={frequency}
                  label="Frequência"
                  onChange={(e) =>
                    setFrequency(e.target.value as "monthly" | "yearly")
                  }
                >
                  <MenuItem value="monthly">Mensal</MenuItem>
                  <MenuItem value="yearly">Anual</MenuItem>
                </Select>
              </FormControl>
            )}

            {type === "expense" && (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper
                    elevation={0}
                    sx={getTogglePaperSx(hasInstallments, theme.palette.warning.main, theme, isDarkMode)}
                    onClick={() => {
                      const newValue = !hasInstallments;
                      setHasInstallments(newValue);
                      // Mutuamente exclusivo com recorrente
                      if (newValue) setIsRecurring(false);
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: hasInstallments
                            ? alpha(theme.palette.warning.main, isDarkMode ? 0.2 : 0.12)
                            : alpha("#64748B", 0.1),
                          transition: "all 0.2s ease",
                        }}
                      >
                        <CreditCardIcon
                          fontSize="small"
                          sx={{
                            color: hasInstallments ? "warning.main" : "text.secondary",
                            transition: "color 0.2s ease",
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        Parcelado?
                      </Typography>
                    </Box>
                    <Switch checked={hasInstallments} size="small" color="warning" />
                  </Paper>
                </Grid>
                {hasInstallments && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nº de Parcelas"
                      type="number"
                      fullWidth
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      inputProps={{ min: 2, max: 48 }}
                      sx={inputSx}
                    />
                  </Grid>
                )}
              </Grid>
            )}

            {type === "expense" &&
              hasInstallments &&
              amount &&
              parseInt(installments) >= 2 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 1,
                    bgcolor: isDarkMode
                      ? alpha(theme.palette.warning.main, 0.1)
                      : alpha(theme.palette.warning.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="warning.main" fontWeight={500}>
                      {installments}x de
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="warning.main"
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(parseFloat(amount) / parseInt(installments))}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Total:{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(amount))}
                  </Typography>
                </Paper>
              )}
          </Box>
        </DialogContent>

        {/* Desktop Actions - Prominent Save Button */}
        {!isMobile && (
          <DialogActions
            sx={{
              p: 3,
              pt: 0,
              gap: 1.5,
            }}
          >
            <Button
              onClick={onClose}
              color="inherit"
              sx={{
                borderRadius: 1,
                px: 3,
                py: 1.25,
                fontWeight: 500,
                color: "text.secondary",
                bgcolor: isDarkMode
                  ? alpha("#FFFFFF", 0.05)
                  : alpha("#000000", 0.04),
                "&:hover": {
                  bgcolor: isDarkMode
                    ? alpha("#FFFFFF", 0.1)
                    : alpha("#000000", 0.08),
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              sx={{
                flex: 1,
                borderRadius: 1,
                py: 1.5,
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: `0 8px 24px -8px ${alpha(theme.palette.primary.main, 0.4)}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 12px 32px -8px ${alpha(theme.palette.primary.main, 0.5)}`,
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }}
            >
              Salvar Transação
            </Button>
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
};

export default TransactionForm;
