import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Chip,
  Autocomplete,
  Tooltip,
  keyframes,
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
  History as HistoryIcon,
  LocalOffer as TagIcon,
  Bolt as BoltIcon,
  Today as TodayIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { Transaction, TransactionType, FinancialSummary } from "../types";
import { CATEGORY_KEYWORDS, QUICK_AMOUNTS } from "../constants";

// Animação de sucesso
const successPulse = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

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
  // Novas props para UX melhorada
  transactions?: Transaction[];
  currentBalance?: number;
}

// Interface para template de transação frequente
interface FrequentTransaction {
  description: string;
  category: string;
  paymentMethod: string;
  type: TransactionType;
  count: number;
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

// Função para sugerir categoria baseada em keywords
const suggestCategory = (
  description: string,
  type: TransactionType,
  availableCategories: string[]
): string | null => {
  const lowerDesc = description.toLowerCase().trim();
  if (!lowerDesc) return null;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!availableCategories.includes(category)) continue;
    
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return null;
};

// Função para parsear valor inteligente (suporta "1.5k", "50", etc.)
const parseSmartAmount = (value: string): number | null => {
  if (!value) return null;
  
  let cleanValue = value.trim().toLowerCase();
  
  // Remove "r$" e espaços
  cleanValue = cleanValue.replace(/r\$\s*/gi, "").replace(/\s/g, "");
  
  // Suporte a "k" para milhares (ex: "1.5k" = 1500)
  if (cleanValue.endsWith("k")) {
    const num = parseFloat(cleanValue.slice(0, -1));
    if (!isNaN(num)) return num * 1000;
  }
  
  // Suporte a expressões simples (ex: "100+50")
  if (/^[\d.+\-*/()]+$/.test(cleanValue)) {
    try {
      // Avaliação segura de expressão matemática
      const result = Function(`"use strict"; return (${cleanValue})`)();
      if (typeof result === "number" && !isNaN(result)) return result;
    } catch {
      // Ignora erro e tenta parse normal
    }
  }
  
  // Parse normal
  const num = parseFloat(cleanValue.replace(",", "."));
  return isNaN(num) ? null : num;
};

// Função para detectar transação duplicada
const findDuplicateTransaction = (
  transactions: Transaction[],
  description: string,
  amount: number,
  type: TransactionType
): Transaction | null => {
  const now = dayjs();
  const last24h = now.subtract(24, "hour");
  
  const lowerDesc = description.toLowerCase().trim();
  
  return transactions.find((t) => {
    const transactionDate = dayjs(t.createdAt || t.date);
    if (transactionDate.isBefore(last24h)) return false;
    if (t.type !== type) return false;
    
    // Verifica similaridade de descrição
    const similarity = t.description.toLowerCase().includes(lowerDesc) ||
      lowerDesc.includes(t.description.toLowerCase());
    
    // Se descrição é similar e valor é igual (ou próximo)
    if (similarity && Math.abs(t.amount - amount) < 0.01) {
      return true;
    }
    
    return false;
  }) || null;
};

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  paymentMethods,
  editTransaction,
  friends,
  onAddFriend,
  transactions = [],
  currentBalance = 0,
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
  
  // Novos estados para UX melhorada
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<Transaction | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputSx = getInputSx(theme, isDarkMode);

  // Extrair transações frequentes do histórico
  const frequentTransactions = useMemo<FrequentTransaction[]>(() => {
    if (transactions.length === 0) return [];
    
    const frequencyMap = new Map<string, FrequentTransaction>();
    
    transactions.forEach((t) => {
      const key = `${t.description.toLowerCase()}-${t.category}-${t.paymentMethod}`;
      const existing = frequencyMap.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        frequencyMap.set(key, {
          description: t.description,
          category: t.category,
          paymentMethod: t.paymentMethod,
          type: t.type,
          count: 1,
        });
      }
    });
    
    // Retorna top 5 mais frequentes
    return Array.from(frequencyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [transactions]);

  // Extrair descrições únicas para autocomplete
  const uniqueDescriptions = useMemo(() => {
    const descriptions = new Set<string>();
    transactions.forEach((t) => descriptions.add(t.description));
    return Array.from(descriptions).sort();
  }, [transactions]);

  // Valor parseado
  const parsedAmount = useMemo(() => parseSmartAmount(amount), [amount]);

  // Calcular saldo após transação
  const balanceAfter = useMemo(() => {
    if (parsedAmount === null) return currentBalance;
    return type === "expense" 
      ? currentBalance - parsedAmount 
      : currentBalance + parsedAmount;
  }, [currentBalance, parsedAmount, type]);

  // Efeito para sugerir categoria quando descrição muda
  useEffect(() => {
    if (description && !category) {
      const suggested = suggestCategory(description, type, categories[type]);
      setSuggestedCategory(suggested);
    } else {
      setSuggestedCategory(null);
    }
  }, [description, type, category, categories]);

  // Efeito para detectar duplicatas
  useEffect(() => {
    if (description && parsedAmount && parsedAmount > 0 && !editTransaction) {
      const duplicate = findDuplicateTransaction(transactions, description, parsedAmount, type);
      setDuplicateWarning(duplicate);
    } else {
      setDuplicateWarning(null);
    }
  }, [description, parsedAmount, type, transactions, editTransaction]);

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
    setSuggestedCategory(null);
    setShowDatePicker(false);
    setDuplicateWarning(null);
    setShowSuccess(false);
  }, [editTransaction, isOpen]);

  // Handler para aplicar template de transação frequente
  const applyFrequentTransaction = useCallback((freq: FrequentTransaction) => {
    setDescription(freq.description);
    setCategory(freq.category);
    setPaymentMethod(freq.paymentMethod);
    setType(freq.type);
    setSuggestedCategory(null);
  }, []);

  // Handler para aplicar sugestão de categoria
  const applySuggestedCategory = useCallback(() => {
    if (suggestedCategory) {
      setCategory(suggestedCategory);
      setSuggestedCategory(null);
    }
  }, [suggestedCategory]);

  // Handler para aplicar valor rápido
  const applyQuickAmount = useCallback((value: number) => {
    setAmount(value.toString());
  }, []);

  // Handler para aplicar data rápida
  const applyQuickDate = useCallback((option: "today" | "yesterday" | "lastWeek") => {
    switch (option) {
      case "today":
        setDate(dayjs());
        break;
      case "yesterday":
        setDate(dayjs().subtract(1, "day"));
        break;
      case "lastWeek":
        setDate(dayjs().subtract(7, "day"));
        break;
    }
    setShowDatePicker(false);
  }, []);

  // Handler para autocomplete de descrição
  const handleDescriptionSelect = useCallback((selectedDescription: string) => {
    // Encontrar transação com essa descrição para auto-preencher
    const matchingTransaction = transactions.find(
      (t) => t.description === selectedDescription
    );
    
    if (matchingTransaction) {
      setDescription(selectedDescription);
      setCategory(matchingTransaction.category);
      setPaymentMethod(matchingTransaction.paymentMethod);
      setType(matchingTransaction.type);
    }
  }, [transactions]);

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
      setValidationError("Parcelas devem ser no mínimo 2.");
      return;
    }

    // Validação: se isShared, precisa selecionar um amigo
    if (isShared && !sharedWith) {
      setValidationError("Selecione um amigo para dividir.");
      return;
    }

    const finalAmount = parsedAmount || 0;

    onSave(
      {
        description,
        amount: finalAmount,
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
      editTransaction?.id || undefined
    );

    // Mostrar animação de sucesso
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 600);
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

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
      {/* Success Overlay */}
      {showSuccess && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.success.main, 0.95),
            zIndex: 9999,
            borderRadius: isMobile ? 0 : 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              animation: `${successPulse} 0.4s ease-out`,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 64, color: "#fff" }} />
            <Typography variant="h6" fontWeight={700} color="#fff">
              Transação salva!
            </Typography>
          </Box>
        </Box>
      )}

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
            pt: isMobile ? 2 : 0,
            pb: 3,
            borderTop: "none",
            borderBottom: "none",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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

            {/* Duplicate Warning Alert */}
            <Collapse in={!!duplicateWarning}>
              <Alert 
                severity="warning"
                icon={<WarningIcon />}
                onClose={() => setDuplicateWarning(null)}
                sx={{
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Possível duplicata detectada!
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  "{duplicateWarning?.description}" - {formatCurrency(duplicateWarning?.amount || 0)} cadastrada recentemente
                </Typography>
              </Alert>
            </Collapse>

            {/* Quick Actions - Transações Frequentes */}
            {!editTransaction && frequentTransactions.length > 0 && (
              <Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  fontWeight={600}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}
                >
                  <BoltIcon sx={{ fontSize: 14 }} />
                  ATALHOS RÁPIDOS
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {frequentTransactions.map((freq, index) => (
                    <Chip
                      key={index}
                      label={freq.description}
                      onClick={() => applyFrequentTransaction(freq)}
                      icon={<HistoryIcon sx={{ fontSize: 16 }} />}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        fontWeight: 500,
                        bgcolor: isDarkMode
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        color: theme.palette.primary.main,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          transform: "translateY(-1px)",
                          boxShadow: `0 4px 12px -4px ${alpha(theme.palette.primary.main, 0.3)}`,
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Type Toggle - Premium Style */}
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, newType) => {
                if (newType) {
                  setType(newType);
                  setCategory("");
                  setSuggestedCategory(null);
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

            {/* Descrição com Autocomplete */}
            <Box>
              <Autocomplete
                freeSolo
                options={uniqueDescriptions}
                value={description}
                onInputChange={(_, newValue) => setDescription(newValue)}
                onChange={(_, newValue) => {
                  if (newValue) {
                    handleDescriptionSelect(newValue);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Descrição"
                    required
                    placeholder="Ex: Mercado, Aluguel, Salário..."
                    sx={inputSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {uniqueDescriptions.length > 0 && (
                            <InputAdornment position="end">
                              <Tooltip title="Sugestões do histórico">
                                <HistoryIcon 
                                  sx={{ 
                                    fontSize: 18, 
                                    color: "text.disabled",
                                    mr: 1,
                                  }} 
                                />
                              </Tooltip>
                            </InputAdornment>
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props as any;
                  return (
                    <li key={key} {...otherProps}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <HistoryIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2">{option}</Typography>
                      </Box>
                    </li>
                  );
                }}
              />

              {/* Sugestão de Categoria */}
              <Collapse in={!!suggestedCategory}>
                <Chip
                  label={`💡 Sugestão: ${suggestedCategory}`}
                  onClick={applySuggestedCategory}
                  onDelete={applySuggestedCategory}
                  deleteIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                  size="small"
                  sx={{
                    mt: 1,
                    borderRadius: 2,
                    fontWeight: 500,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    color: theme.palette.info.main,
                    "& .MuiChip-deleteIcon": {
                      color: theme.palette.success.main,
                    },
                    "&:hover": {
                      bgcolor: alpha(theme.palette.info.main, 0.2),
                    },
                  }}
                />
              </Collapse>
            </Box>

            {/* Valor com Quick Amounts */}
            <Box>
              <TextField
                label="Valor (R$)"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 150, 1.5k, 100+50"
                helperText={
                  parsedAmount && parsedAmount !== parseFloat(amount) 
                    ? `= ${formatCurrency(parsedAmount)}` 
                    : !amount 
                      ? "Você pode adicionar o valor depois" 
                      : undefined
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography fontWeight={600} color="text.secondary">R$</Typography>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Quick Amount Buttons */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                {QUICK_AMOUNTS.map((value) => (
                  <Chip
                    key={value}
                    label={`R$${value}`}
                    onClick={() => applyQuickAmount(value)}
                    size="small"
                    variant={parsedAmount === value ? "filled" : "outlined"}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      minWidth: 60,
                      transition: "all 0.15s ease",
                      ...(parsedAmount === value
                        ? {
                            bgcolor: theme.palette.primary.main,
                            color: "#fff",
                            borderColor: theme.palette.primary.main,
                          }
                        : {
                            borderColor: isDarkMode
                              ? alpha("#FFFFFF", 0.15)
                              : alpha("#000000", 0.15),
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              borderColor: theme.palette.primary.main,
                            },
                          }),
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required sx={inputSx}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={category}
                    label="Categoria"
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSuggestedCategory(null);
                    }}
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

            {/* Data com Quick Picks */}
            <Box>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                fontWeight={600}
                sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
              >
                <TodayIcon sx={{ fontSize: 14 }} />
                DATA
              </Typography>
              
              {/* Quick Date Picks */}
              <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                <Chip
                  label="Hoje"
                  onClick={() => applyQuickDate("today")}
                  size="small"
                  variant={date?.isSame(dayjs(), "day") ? "filled" : "outlined"}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500,
                    ...(date?.isSame(dayjs(), "day")
                      ? {
                          bgcolor: theme.palette.primary.main,
                          color: "#fff",
                        }
                      : {
                          borderColor: isDarkMode
                            ? alpha("#FFFFFF", 0.15)
                            : alpha("#000000", 0.15),
                        }),
                  }}
                />
                <Chip
                  label="Ontem"
                  onClick={() => applyQuickDate("yesterday")}
                  size="small"
                  variant={date?.isSame(dayjs().subtract(1, "day"), "day") ? "filled" : "outlined"}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500,
                    ...(date?.isSame(dayjs().subtract(1, "day"), "day")
                      ? {
                          bgcolor: theme.palette.primary.main,
                          color: "#fff",
                        }
                      : {
                          borderColor: isDarkMode
                            ? alpha("#FFFFFF", 0.15)
                            : alpha("#000000", 0.15),
                        }),
                  }}
                />
                <Chip
                  label="Semana passada"
                  onClick={() => applyQuickDate("lastWeek")}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 500,
                    borderColor: isDarkMode
                      ? alpha("#FFFFFF", 0.15)
                      : alpha("#000000", 0.15),
                  }}
                />
              </Box>

              <DatePicker
                label="Personalizar data"
                value={date}
                onChange={(newValue) => setDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    size: "small",
                    sx: inputSx,
                  },
                }}
              />
            </Box>

            {/* Recorrente Toggle */}
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={getTogglePaperSx(isRecurring, theme.palette.primary.main, theme, isDarkMode)}
                  onClick={() => {
                    const newValue = !isRecurring;
                    setIsRecurring(newValue);
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
              {type === "expense" && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper
                    elevation={0}
                    sx={getTogglePaperSx(hasInstallments, theme.palette.warning.main, theme, isDarkMode)}
                    onClick={() => {
                      const newValue = !hasInstallments;
                      setHasInstallments(newValue);
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
              )}
            </Grid>

            {/* Frequência para Recorrente */}
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

            {/* Número de Parcelas */}
            {hasInstallments && (
              <TextField
                label="Nº de Parcelas"
                type="number"
                fullWidth
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                inputProps={{ min: 2, max: 48 }}
                sx={inputSx}
              />
            )}

            {/* Preview de Parcelas */}
            {type === "expense" &&
              hasInstallments &&
              parsedAmount &&
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
                      {formatCurrency(parsedAmount / parseInt(installments))}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Total: {formatCurrency(parsedAmount)}
                  </Typography>
                </Paper>
              )}

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
                    {sharedWith && parsedAmount && (
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
                          +{formatCurrency(parsedAmount / 2)}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Balance Impact Preview */}
            {parsedAmount !== null && parsedAmount > 0 && currentBalance !== undefined && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 1,
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha("#000000", 0.02),
                  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  fontWeight={600}
                  sx={{ display: "block", mb: 1.5 }}
                >
                  IMPACTO NO SALDO
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Saldo atual
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(currentBalance)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {type === "expense" ? (
                        <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />
                      ) : (
                        <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Esta transação
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      color={type === "expense" ? "error.main" : "success.main"}
                    >
                      {type === "expense" ? "-" : "+"}{formatCurrency(parsedAmount)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 0.5 }} />
                  
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" fontWeight={600}>
                      Saldo após
                    </Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight={700}
                      color={balanceAfter < 0 ? "error.main" : "text.primary"}
                    >
                      {formatCurrency(balanceAfter)}
                    </Typography>
                  </Box>
                  
                  {balanceAfter < 0 && (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mt: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        "& .MuiAlert-message": { py: 0 }
                      }}
                    >
                      <Typography variant="caption">
                        ⚠️ Saldo ficará negativo
                      </Typography>
                    </Alert>
                  )}
                </Box>
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
