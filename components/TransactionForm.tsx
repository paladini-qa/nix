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
  Tabs,
  Tab,
} from "@mui/material";
import { useNotification } from "../contexts";
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
  Bolt as BoltIcon,
  Today as TodayIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Transaction, TransactionType, FinancialSummary } from "../types";
import { CATEGORY_KEYWORDS, QUICK_AMOUNTS } from "../constants";

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
    borderRadius: "20px", // Usa múltiplo do theme.shape.borderRadius (20px)
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.default, 0.5)
      : alpha(theme.palette.primary.main, 0.02),
    transition: "all 0.2s ease-in-out",
    outline: "none !important",
    "& fieldset": {
      borderColor: isDarkMode
        ? alpha("#FFFFFF", 0.1)
        : alpha(theme.palette.primary.main, 0.12),
      borderWidth: 1.5,
      transition: "all 0.2s ease-in-out",
      outline: "none !important",
    },
    "&:hover fieldset": {
      borderColor: isDarkMode
        ? alpha("#FFFFFF", 0.2)
        : alpha(theme.palette.primary.main, 0.25),
      outline: "none !important",
    },
    "&.Mui-focused": {
      bgcolor: isDarkMode
        ? alpha(theme.palette.primary.main, 0.08)
        : alpha(theme.palette.primary.main, 0.04),
      outline: "none !important",
      boxShadow: "none !important",
    },
    "&.Mui-focused fieldset": {
      border: "none !important",
      borderColor: "transparent !important",
      borderWidth: "0 !important",
      outline: "none !important",
      boxShadow: "none !important",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none !important",
      borderColor: "transparent !important",
      borderWidth: "0 !important",
      outline: "none !important",
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-input": {
    outline: "none !important",
    "&:focus": {
      outline: "none !important",
      boxShadow: "none !important",
    },
    "&:focus-visible": {
      outline: "none !important",
      boxShadow: "none !important",
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    outline: "none !important",
  },
});

// Estilos do toggle button/paper - premium feel
const getTogglePaperSx = (isActive: boolean, accentColor: string, theme: any, isDarkMode: boolean) => ({
  p: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  borderRadius: "20px", // Consistente com theme
  transition: "all 0.2s ease-in-out",
  border: `1.5px solid ${isActive
    ? alpha(accentColor, 0.4)
    : isDarkMode
      ? alpha("#FFFFFF", 0.12)
      : alpha("#000000", 0.1)}`,
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
  const [iOwe, setIOwe] = useState(false); // true = amigo pagou, eu devo | false = eu paguei, amigo deve
  const [newFriendName, setNewFriendName] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  
  // Novos estados para UX melhorada
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Hook de notificações
  const { showError, showWarning, showSuccess } = useNotification();
  
  // Estados para UX condicional - mostrar seções apenas quando relevante
  const [showQuickAmounts, setShowQuickAmounts] = useState(false);
  const [amountFieldFocused, setAmountFieldFocused] = useState(false);
  
  // Estado para controlar tab do preview unificado
  const [previewTab, setPreviewTab] = useState<"installments" | "shared" | "balance">("balance");

  // Estado para controlar opções avançadas colapsáveis
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // Efeito para detectar duplicatas (mostra notificação apenas uma vez por combinação)
  const [lastDuplicateKey, setLastDuplicateKey] = useState<string>("");
  
  useEffect(() => {
    if (description && parsedAmount && parsedAmount > 0 && !editTransaction) {
      const duplicate = findDuplicateTransaction(transactions, description, parsedAmount, type);
      const duplicateKey = duplicate ? `${duplicate.id}-${duplicate.amount}` : "";
      
      if (duplicate && duplicateKey !== lastDuplicateKey) {
        setLastDuplicateKey(duplicateKey);
        showWarning(
          `"${duplicate.description}" - ${formatCurrency(duplicate.amount)} cadastrada recentemente`,
          "Possível duplicata detectada!"
        );
      }
    }
  }, [description, parsedAmount, type, transactions, editTransaction, showWarning, lastDuplicateKey]);

  // ========== LÓGICAS CONDICIONAIS (após todas as definições) ==========
  
  // Lógica para mostrar Quick Amounts apenas quando relevante
  const shouldShowQuickAmounts = amountFieldFocused || !amount;

  // Lógica para mostrar Atalhos Rápidos apenas se campos não preenchidos
  const filledFieldsCount = [description, category, paymentMethod].filter(Boolean).length;
  const shouldShowFrequentTransactions = !editTransaction && frequentTransactions.length > 0 && filledFieldsCount < 2;

  // Lógica para mostrar preview de impacto no saldo apenas para valores significativos
  const shouldShowBalanceImpact = parsedAmount !== null && parsedAmount > 100 && currentBalance !== undefined;

  // Decidir qual preview mostrar (unificado)
  const hasInstallmentsPreview = type === "expense" && hasInstallments && parsedAmount && parseInt(installments) >= 2;
  const hasSharedPreview = isShared && sharedWith && parsedAmount;
  const hasBalancePreview = shouldShowBalanceImpact;
  
  // Mostrar preview unificado se pelo menos um preview estiver ativo
  const shouldShowUnifiedPreview = hasInstallmentsPreview || hasSharedPreview || hasBalancePreview;
  
  // Auto-selecionar tab baseado no que está ativo
  useEffect(() => {
    if (hasInstallmentsPreview) {
      setPreviewTab("installments");
    } else if (hasSharedPreview) {
      setPreviewTab("shared");
    } else if (hasBalancePreview) {
      setPreviewTab("balance");
    }
  }, [hasInstallmentsPreview, hasSharedPreview, hasBalancePreview]);

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
      setIOwe(editTransaction.iOwe || false);
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
      setIOwe(false);
    }
    setNewFriendName("");
    setShowAddFriend(false);
    setSuggestedCategory(null);
    setShowDatePicker(false);
    setShowQuickAmounts(false);
    setAmountFieldFocused(false);
    setLastDuplicateKey("");
    // Auto-expandir opções avançadas se editando transação com opções ativas
    if (editTransaction) {
      const hasAdvanced = editTransaction.isRecurring || 
        (editTransaction.installments !== undefined && editTransaction.installments > 1) ||
        editTransaction.isShared;
      setShowAdvanced(hasAdvanced);
    } else {
      setShowAdvanced(false);
    }
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
    
    // Valor é opcional - pode ser definido depois
    if (!description || !category || !paymentMethod || !date) {
      showError("Preencha todos os campos obrigatórios.", "Campos incompletos");
      return;
    }

    const installmentsValue = parseInt(installments);
    if (
      hasInstallments &&
      (isNaN(installmentsValue) || installmentsValue < 2)
    ) {
      showError("Parcelas devem ser no mínimo 2.", "Valor inválido");
      return;
    }

    // Validação: se isShared, precisa selecionar um amigo
    if (isShared && !sharedWith) {
      showError("Selecione um amigo para dividir.", "Amigo não selecionado");
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
        iOwe: isShared ? iOwe : undefined,
      },
      editTransaction?.id || undefined
    );

    // Mostrar notificação de sucesso e fechar modal
    showSuccess(
      editTransaction ? "Transação atualizada com sucesso!" : "Transação criada com sucesso!",
      "Sucesso"
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
          borderRadius: isMobile ? 0 : 2.5, // 20px em desktop
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.95)
            : "#FFFFFF",
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
                borderRadius: "20px",
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
            pb: isMobile ? 12 : 3, // Extra padding para barra fixa no mobile
            borderTop: "none",
            borderBottom: "none",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Quick Actions - Transações Frequentes - Mostrar apenas se poucos campos preenchidos */}
            {shouldShowFrequentTransactions && (
              <Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  fontWeight={600}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}
                >
                  <BoltIcon sx={{ fontSize: 16 }} />
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
                        borderRadius: "20px",
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
                borderRadius: "20px",
                p: 0.5,
                "& .MuiToggleButtonGroup-grouped": {
                  border: 0,
                  borderRadius: "20px !important", // Força 20px nos botões internos
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
                    borderRadius: "20px",
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
                onFocus={() => setAmountFieldFocused(true)}
                onBlur={() => setTimeout(() => setAmountFieldFocused(false), 200)}
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

              {/* Quick Amount Buttons - Mostrar apenas quando campo focado ou vazio */}
              {shouldShowQuickAmounts && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                {QUICK_AMOUNTS.map((value) => (
                  <Chip
                    key={value}
                    label={`R$${value}`}
                    onClick={() => applyQuickAmount(value)}
                    size="small"
                    variant={parsedAmount === value ? "filled" : "outlined"}
                    sx={{
                      borderRadius: "20px",
                      fontWeight: 600,
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
                              ? alpha("#FFFFFF", 0.2)
                              : alpha("#000000", 0.2),
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              borderColor: theme.palette.primary.main,
                            },
                          }),
                    }}
                  />
                ))}
              </Box>
              )}
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
                <TodayIcon sx={{ fontSize: 16 }} />
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
                    borderRadius: "20px",
                    fontWeight: 500,
                    ...(date?.isSame(dayjs(), "day")
                      ? {
                          bgcolor: theme.palette.primary.main,
                          color: "#fff",
                        }
                      : {
                          borderColor: isDarkMode
                            ? alpha("#FFFFFF", 0.2)
                            : alpha("#000000", 0.2),
                        }),
                  }}
                />
                <Chip
                  label="Ontem"
                  onClick={() => applyQuickDate("yesterday")}
                  size="small"
                  variant={date?.isSame(dayjs().subtract(1, "day"), "day") ? "filled" : "outlined"}
                  sx={{
                    borderRadius: "20px",
                    fontWeight: 500,
                    ...(date?.isSame(dayjs().subtract(1, "day"), "day")
                      ? {
                          bgcolor: theme.palette.primary.main,
                          color: "#fff",
                        }
                      : {
                          borderColor: isDarkMode
                            ? alpha("#FFFFFF", 0.2)
                            : alpha("#000000", 0.2),
                        }),
                  }}
                />
                <Chip
                  label="Semana passada"
                  onClick={() => applyQuickDate("lastWeek")}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderRadius: "20px",
                    fontWeight: 500,
                    borderColor: isDarkMode
                      ? alpha("#FFFFFF", 0.2)
                      : alpha("#000000", 0.2),
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

            {/* ========== OPÇÕES AVANÇADAS - Colapsável ========== */}
            <Paper
              elevation={0}
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{
                p: 2,
                borderRadius: "20px",
                cursor: "pointer",
                bgcolor: isDarkMode
                  ? alpha(theme.palette.background.default, 0.3)
                  : alpha("#000000", 0.02),
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha("#000000", 0.04),
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: (isRecurring || hasInstallments || isShared)
                        ? alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.12)
                        : alpha("#64748B", 0.1),
                      transition: "all 0.2s ease",
                    }}
                  >
                    <SettingsIcon
                      fontSize="small"
                      sx={{
                        color: (isRecurring || hasInstallments || isShared)
                          ? "primary.main"
                          : "text.secondary",
                        transition: "color 0.2s ease",
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Opções Avançadas
                    </Typography>
                    {/* Chips mostrando opções ativas quando colapsado */}
                    {!showAdvanced && (isRecurring || hasInstallments || isShared) && (
                      <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                        {isRecurring && (
                          <Chip
                            label={`Recorrente (${frequency === "monthly" ? "Mensal" : "Anual"})`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                            }}
                          />
                        )}
                        {hasInstallments && (
                          <Chip
                            label={`${installments}x Parcelado`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                            }}
                          />
                        )}
                        {isShared && sharedWith && (
                          <Chip
                            label={`Com ${sharedWith}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
                <ExpandMoreIcon
                  sx={{
                    transition: "transform 0.2s ease",
                    transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                    color: "text.secondary",
                  }}
                />
              </Box>
            </Paper>

            <Collapse in={showAdvanced} timeout={300}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
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
                        borderRadius: "20px",
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
                          borderRadius: "20px",
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

            {/* Vincular a Amigo Toggle - Disponível para INCOME e EXPENSE */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Paper
                elevation={0}
                sx={getTogglePaperSx(isShared, theme.palette.info.main, theme, isDarkMode)}
                onClick={() => {
                  setIsShared(!isShared);
                  if (isShared) {
                    setSharedWith("");
                    setIOwe(false);
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "20px",
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
                      Vincular a amigo
                    </Typography>
                    {isShared && (
                      <Typography variant="caption" color="text.secondary">
                        Afeta o saldo com o amigo
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Switch checked={isShared} size="small" color="info" />
              </Paper>

              {/* Friend Selection e Opções */}
              {isShared && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Tipo de conta: Dividida ou Única */}
                  <Box>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      fontWeight={600}
                      sx={{ display: "block", mb: 1 }}
                    >
                      TIPO DE CONTA
                    </Typography>
                    <ToggleButtonGroup
                      value={iOwe ? "single" : "split"}
                      exclusive
                      onChange={(_, newValue) => {
                        if (newValue) {
                          setIOwe(newValue === "single");
                        }
                      }}
                      fullWidth
                      sx={{
                      bgcolor: isDarkMode
                        ? alpha(theme.palette.background.default, 0.3)
                        : alpha("#000000", 0.02),
                      borderRadius: "20px",
                      p: 0.5,
                      "& .MuiToggleButtonGroup-grouped": {
                        border: 0,
                        borderRadius: "20px !important",
                        mx: 0.25,
                      },
                      "& .MuiToggleButton-root": {
                        py: 1.25,
                        fontWeight: 600,
                        textTransform: "none",
                          transition: "all 0.2s ease-in-out",
                          "&:not(.Mui-selected)": {
                            color: "text.secondary",
                          },
                        },
                      }}
                    >
                      <ToggleButton
                        value="split"
                        sx={{
                          "&.Mui-selected": {
                            bgcolor: alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.15),
                            color: theme.palette.primary.main,
                            boxShadow: `0 4px 12px -4px ${alpha(theme.palette.primary.main, 0.3)}`,
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, isDarkMode ? 0.25 : 0.2),
                            },
                          },
                        }}
                      >
                        ✂️ Conta Dividida (50%)
                      </ToggleButton>
                      <ToggleButton
                        value="single"
                        sx={{
                          "&.Mui-selected": {
                            bgcolor: alpha(theme.palette.secondary.main, isDarkMode ? 0.2 : 0.15),
                            color: theme.palette.secondary.main,
                            boxShadow: `0 4px 12px -4px ${alpha(theme.palette.secondary.main, 0.3)}`,
                            "&:hover": {
                              bgcolor: alpha(theme.palette.secondary.main, isDarkMode ? 0.25 : 0.2),
                            },
                          },
                        }}
                      >
                        💯 Conta Única (100%)
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

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
                        borderRadius: "20px",
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
                          sx={{ borderRadius: "20px", px: 2.5 }}
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
                          sx={{ borderRadius: "20px" }}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    </Paper>
                  )}

                  {/* Preview do impacto no saldo */}
                  {sharedWith && parsedAmount && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: "20px",
                        bgcolor: isDarkMode
                          ? alpha(
                              type === "income" 
                                ? theme.palette.success.main 
                                : (iOwe ? theme.palette.error.main : theme.palette.success.main), 
                              0.1
                            )
                          : alpha(
                              type === "income" 
                                ? theme.palette.success.main 
                                : (iOwe ? theme.palette.error.main : theme.palette.success.main), 
                              0.06
                            ),
                        border: `1px solid ${alpha(
                          type === "income" 
                            ? theme.palette.success.main 
                            : (iOwe ? theme.palette.error.main : theme.palette.success.main), 
                          0.2
                        )}`,
                      }}
                    >
                      {type === "income" ? (
                        // INCOME vinculada a amigo
                        <>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            💰 {sharedWith} está te pagando:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            "{description || "Transação"}"
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                            +{formatCurrency(iOwe ? parsedAmount : parsedAmount / 2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                            {iOwe 
                              ? `Valor integral será somado ao saldo de ${sharedWith}`
                              : `Metade do valor (conta dividida) será somada ao saldo de ${sharedWith}`
                            }
                          </Typography>
                        </>
                      ) : iOwe ? (
                        // EXPENSE + Conta Única - Eu devo ao amigo
                        <>
                          <Typography variant="body2" color="error.main" fontWeight={600}>
                            💸 Você está pagando para {sharedWith}:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            "{description || "Transação"}"
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="error.main" sx={{ mt: 1 }}>
                            -{formatCurrency(parsedAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                            Este valor será descontado do que {sharedWith} te deve
                          </Typography>
                        </>
                      ) : (
                        // EXPENSE + Conta Dividida - Amigo me deve metade
                        <>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            ✨ {sharedWith} te deve (metade):
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            "{description || "Transação"}"
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                            +{formatCurrency(parsedAmount / 2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                            Receita de reembolso será criada automaticamente
                          </Typography>
                        </>
                      )}
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
              </Box>
            </Collapse>

            {/* ========== PREVIEW UNIFICADO - Substitui 3 cards por 1 com tabs ========== */}
            {shouldShowUnifiedPreview && (
              <Paper
                elevation={0}
                sx={{
                  p: 0,
                  borderRadius: "20px",
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha("#000000", 0.02),
                  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.08)}`,
                  overflow: "hidden",
                }}
              >
                {/* Tabs para alternar entre previews */}
                <Tabs
                  value={previewTab}
                  onChange={(_, newValue) => setPreviewTab(newValue)}
                  sx={{
                    borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                    minHeight: 48,
                    "& .MuiTab-root": {
                      minHeight: 48,
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  {hasInstallmentsPreview && (
                    <Tab label="💳 Parcelas" value="installments" />
                  )}
                  {hasSharedPreview && (
                    <Tab label="👥 Compartilhado" value="shared" />
                  )}
                  {hasBalancePreview && (
                    <Tab label="💰 Saldo" value="balance" />
                  )}
                </Tabs>

                {/* Conteúdo do preview */}
                <Box sx={{ p: 2.5 }}>
                  {/* Preview de Parcelas */}
                  {previewTab === "installments" && hasInstallmentsPreview && (
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 1,
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
                          {formatCurrency(parsedAmount! / parseInt(installments))}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Total: {formatCurrency(parsedAmount!)}
                      </Typography>
                    </Box>
                  )}

                  {/* Preview de Compartilhado */}
                  {previewTab === "shared" && hasSharedPreview && (
                    <Box>
                      {type === "income" ? (
                        <>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            💰 {sharedWith} está te pagando:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            "{description || "Transação"}"
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                            +{formatCurrency(iOwe ? parsedAmount! : parsedAmount! / 2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                            {iOwe 
                              ? `Valor integral será somado ao saldo de ${sharedWith}`
                              : `Metade do valor (conta dividida) será somada ao saldo de ${sharedWith}`
                            }
                          </Typography>
                        </>
                      ) : iOwe ? (
                        <>
                          <Typography variant="body2" color="error.main" fontWeight={600}>
                            💸 Você está pagando para {sharedWith}:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            "{description || "Transação"}"
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="error.main" sx={{ mt: 1 }}>
                            -{formatCurrency(parsedAmount!)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                            Este valor será descontado do que {sharedWith} te deve
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            ✨ {sharedWith} te deve (metade):
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            "{description || "Transação"}"
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                            +{formatCurrency(parsedAmount! / 2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                            Receita de reembolso será criada automaticamente
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}

                  {/* Preview de Impacto no Saldo */}
                  {previewTab === "balance" && hasBalancePreview && (
                    <Box>
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
                            {formatCurrency(currentBalance!)}
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
                            {type === "expense" ? "-" : "+"}{formatCurrency(parsedAmount!)}
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
                              borderRadius: "20px",
                              "& .MuiAlert-message": { py: 0 }
                            }}
                          >
                            <Typography variant="caption">
                              ⚠️ Saldo ficará negativo
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </Box>
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
                borderRadius: "20px",
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
                borderRadius: "20px",
                py: 1.5,
                fontWeight: 600,
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

        {/* Mobile Bottom Save Bar - Zona do Polegar */}
        {isMobile && (
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.paper, 0.95)
                : alpha("#FFFFFF", 0.98),
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: isDarkMode
                ? `0 -4px 24px -4px ${alpha("#000000", 0.4)}`
                : `0 -4px 24px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
              zIndex: 1300,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: "20px",
                py: 1.75,
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: `0 8px 24px -8px ${alpha(theme.palette.primary.main, 0.5)}`,
                transition: "all 0.2s ease-in-out",
                "&:active": {
                  transform: "scale(0.98)",
                },
              }}
            >
              Salvar Transação
            </Button>
          </Box>
        )}
      </form>
    </Dialog>
  );
};

export default TransactionForm;
