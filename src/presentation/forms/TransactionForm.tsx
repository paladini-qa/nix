import { categoryLabel, paymentMethodLabel } from "@/shared/i18n/labels";
import React, { useState, useEffect, useEffectEvent, useMemo, useCallback, useRef } from "react";
import {
  Drawer,
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
  keyframes,
} from "@mui/material";
import { useNotification, useSettings } from "@/presentation/contexts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  Close as CloseIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  SaveAlt as SaveIcon,
  History as HistoryIcon,
  Bolt as BoltIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  ChevronRight as ChevronRightIcon,
  ReceiptLong as ReceiptIcon,
} from "@mui/icons-material";
import NixButton from "@/presentation/components/radix/Button";
import PaymentMethodIcon from "@/presentation/components/ui/PaymentMethodIcon";
import { Transaction, TransactionType, PaymentMethodConfig } from "@/domain/entities";
import { calculateInvoiceDueDate, formatInvoiceMonth, getBalanceOnDate, getInstallmentAmounts, MAX_INSTALLMENTS } from "@/domain/usecases/transactionUtils";
import { formatTransactionAmount, parseTransactionAmount } from "@/domain/usecases/transactionAmount";
import { CATEGORY_KEYWORDS, MONTHS } from "@/shared/constants";
import { SIDE_PANEL_WIDTH, SIDE_PANEL_WIDTH_MOBILE, TOUCH_TARGET_MIN } from "@/shared/constants/layout";
import {
  suggestCategoryWithAI,
  CategorySuggestion,
} from "@/infrastructure/ai/geminiService";
import { applyRules } from "@/infrastructure/ai/autoCategorizationService";

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

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    transaction: Omit<Transaction, "id" | "createdAt">,
    editId?: string
  ) => Promise<void>;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  editTransaction?: Transaction | null;
  // Novas props para UX melhorada
  transactions?: Transaction[];
  /** Contexto inicial ao abrir a partir de uma aba (ex.: método de pagamento, categoria, compartilhada, etc.) */
  initialContext?: {
    paymentMethod?: string;
    category?: string;
    type?: TransactionType;
    isRecurring?: boolean;
    hasInstallments?: boolean;
    /** Pré-preenche descrição (ex.: merchant do Google Wallet) */
    description?: string;
    /** Pré-preenche valor (ex.: montante capturado do Google Wallet) */
    amount?: string;
  } | null;
  /** Quando informado, ao selecionar um método com dia configurado, preenche a data com esse dia no mês atual */
  getPaymentMethodPaymentDay?: (method: string) => number | undefined;
  /** Retorna a configuração estruturada do método (tipo, dias de fechamento/pagamento) */
  getPaymentMethodConfig?: (method: string) => PaymentMethodConfig | undefined;
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
const getTogglePaperSx = (
  isActive: boolean,
  accentColor: string,
  theme: any,
  isDarkMode: boolean
) => ({
  p: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  borderRadius: "20px", // Consistente com theme
  transition: "all 0.2s ease-in-out",
  border: `1.5px solid ${
    isActive
      ? alpha(accentColor, 0.4)
      : isDarkMode
      ? alpha("#FFFFFF", 0.12)
      : alpha("#000000", 0.1)
  }`,
  bgcolor: isActive
    ? isDarkMode
      ? alpha(accentColor, 0.1)
      : alpha(accentColor, 0.06)
    : isDarkMode
    ? alpha(theme.palette.background.default, 0.3)
    : alpha("#FFFFFF", 0.6),
  boxShadow: isActive ? `0 4px 12px -4px ${alpha(accentColor, 0.25)}` : "none",
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

  return (
    transactions.find((t) => {
      const transactionDate = dayjs(t.createdAt || t.date);
      if (transactionDate.isBefore(last24h)) return false;
      if (t.type !== type) return false;

      // Verifica similaridade de descrição
      const similarity =
        t.description.toLowerCase().includes(lowerDesc) ||
        lowerDesc.includes(t.description.toLowerCase());

      // Se descrição é similar e valor é igual (ou próximo)
      if (similarity && Math.abs(t.amount - amount) < 0.01) {
        return true;
      }

      return false;
    }) || null
  );
};

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  paymentMethods,
  editTransaction,
  transactions = [],
  initialContext = null,
  getPaymentMethodPaymentDay,
  getPaymentMethodConfig,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";
  const { getPaymentMethodColor } = useSettings();

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
  const [installmentStartDate, setInstallmentStartDate] = useState<Dayjs | null>(null);
  // Novos estados para UX melhorada
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(
    null
  );
  const [aiSuggestion, setAiSuggestion] = useState<CategorySuggestion | null>(
    null
  );
  const [isLoadingAiSuggestion, setIsLoadingAiSuggestion] = useState(false);

  // Hook de notificações
  const { showError, showWarning } = useNotification();
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para controlar tab do preview unificado
  const [previewTab, setPreviewTab] = useState<
    "installments" | "balance"
  >("balance");

  // Vencimento da fatura (só quando forma de pagamento tem dia cadastrado); usuário edita apenas mês/ano
  const [invoiceDueMonth, setInvoiceDueMonth] = useState<number>(dayjs().month() + 1); // 1-12
  const [invoiceDueYear, setInvoiceDueYear] = useState<number>(dayjs().year());
  // Mês/ano da fatura para relatório quando o método NÃO tem dia de vencimento (ex.: Revolut) — opcional
  const [optionalInvoiceReportMonth, setOptionalInvoiceReportMonth] = useState<number | null>(null); // 1-12 ou null
  const [optionalInvoiceReportYear, setOptionalInvoiceReportYear] = useState<number | null>(null);

  const inputSx = getInputSx(theme, isDarkMode);

  // Retorna dia de vencimento do método (1-31) ou undefined
  const paymentMethodDueDay = getPaymentMethodPaymentDay?.(paymentMethod);

  // Configuração estruturada do método selecionado
  const currentMethodConfig = getPaymentMethodConfig?.(paymentMethod);
  const isCardMethod =
    currentMethodConfig?.type === "card" &&
    !!currentMethodConfig.closingDay &&
    !!currentMethodConfig.paymentDay;
  const isCardIncomplete =
    currentMethodConfig?.type === "card" &&
    (!currentMethodConfig.closingDay || !currentMethodConfig.paymentDay);
  const isCashMethod = currentMethodConfig?.type === "cash";

  // Data efetiva da transação: quando há parcelamento, usa mês/ano do início ajustado pela parcela atual
  const effectiveDate = useMemo(() => {
    if (hasInstallments && installmentStartDate && date) {
      const offset = (editTransaction?.currentInstallment ?? 1) - 1;
      const installmentMonth = installmentStartDate.add(offset, "month");
      return installmentMonth.date(Math.min(date.date(), installmentMonth.daysInMonth()));
    }
    return date;
  }, [hasInstallments, installmentStartDate, date, editTransaction?.currentInstallment]);

  // Auto-calcula data de vencimento da fatura para cartões (usa data efetiva para refletir mês de início)
  const autoInvoiceDueDate = useMemo(() => {
    if (!isCardMethod || !currentMethodConfig || !effectiveDate) return undefined;
    return calculateInvoiceDueDate(effectiveDate.format("YYYY-MM-DD"), currentMethodConfig);
  }, [isCardMethod, currentMethodConfig, effectiveDate]);

  // Fallback: lógica legada (sem config estruturada)
  const hasInvoiceDueDate = !currentMethodConfig && paymentMethodDueDay != null && paymentMethodDueDay >= 1 && paymentMethodDueDay <= 31;
  const hasOptionalInvoiceReport = !currentMethodConfig && !hasInvoiceDueDate && paymentMethod !== "";

  /**
   * Sugere mês/ano do vencimento da fatura a partir da data da transação.
   * Regra: mesmo mês da transação; se o dia da transação for maior que o dia de vencimento do método,
   * usa o próximo mês (fatura do próximo fechamento).
   */
  const getSuggestedInvoiceDueMonthYear = useCallback(
    (txDate: Dayjs, dueDay: number): { month: number; year: number } => {
      const txDay = txDate.date();
      if (txDay > dueDay) {
        const next = txDate.add(1, "month");
        return { month: next.month() + 1, year: next.year() };
      }
      return { month: txDate.month() + 1, year: txDate.year() };
    },
    []
  );

  // Extrair descrições únicas para autocomplete
  const uniqueDescriptions = useMemo(() => {
    const descriptions = new Set<string>();
    transactions.forEach((t) => descriptions.add(t.description));
    return Array.from(descriptions).sort();
  }, [transactions]);

  // Valor parseado
  const parsedAmount = parseTransactionAmount(amount);
  const invalidAmount = amount.trim() !== "" && parsedAmount === null;

  // Calcular saldo após transação
  const installmentCount = Number(installments);
  const validInstallmentCount = Number.isInteger(installmentCount) &&
    installmentCount >= 2 && installmentCount <= MAX_INSTALLMENTS;
  const splitAmounts = !editTransaction && hasInstallments && validInstallmentCount && parsedAmount !== null
    ? getInstallmentAmounts(parsedAmount, installmentCount)
    : null;
  const balanceImpact = splitAmounts?.[0] ?? parsedAmount ?? 0;
  const balanceDate = effectiveDate?.isValid() ? effectiveDate.format("YYYY-MM-DD") : null;
  const balanceBefore = useMemo(
    () => balanceDate ? getBalanceOnDate(transactions, balanceDate, editTransaction?.id) : 0,
    [transactions, balanceDate, editTransaction?.id]
  );
  const balanceAfter = balanceBefore + (type === "expense" ? -balanceImpact : balanceImpact);

  // Efeito para sugerir categoria quando descrição muda (local primeiro, depois regras de auto-categorização)
  useEffect(() => {
    if (description && !category) {
      // Verificar regras de auto-categorização primeiro
      const ruleCategory = applyRules(description, type);
      if (ruleCategory && categories[type].includes(ruleCategory)) {
        setCategory(ruleCategory);
        return;
      }
      const suggested = suggestCategory(description, type, categories[type]);
      setSuggestedCategory(suggested);
    } else {
      setSuggestedCategory(null);
    }
  }, [description, type, category, categories]);

  // Efeito para sugestão de categoria com IA (com debounce de 500ms)
  useEffect(() => {
    // Só busca IA se tiver descrição, não tiver categoria selecionada e a local não tiver alta confiança
    if (!description || description.length < 3 || category) {
      setAiSuggestion(null);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      // Só busca IA se a sugestão local não existir
      if (suggestedCategory) {
        return;
      }

      setIsLoadingAiSuggestion(true);
      try {
        const suggestion = await suggestCategoryWithAI(
          description,
          categories,
          type
        );

        // Só mostra se confiança for boa e diferente da sugestão local
        if (
          suggestion.confidence >= 0.6 &&
          suggestion.category !== suggestedCategory
        ) {
          setAiSuggestion(suggestion);
        } else {
          setAiSuggestion(null);
        }
      } catch (error) {
        console.error("Error getting AI category suggestion:", error);
        setAiSuggestion(null);
      } finally {
        setIsLoadingAiSuggestion(false);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(debounceTimer);
  }, [description, type, category, categories, suggestedCategory]);

  // Efeito para detectar duplicatas (mostra notificação apenas uma vez por combinação)
  const [lastDuplicateKey, setLastDuplicateKey] = useState<string>("");

  useEffect(() => {
    if (description && parsedAmount && parsedAmount > 0 && !editTransaction) {
      const duplicate = findDuplicateTransaction(
        transactions,
        description,
        parsedAmount,
        type
      );
      const duplicateKey = duplicate
        ? `${duplicate.id}-${duplicate.amount}`
        : "";

      if (duplicate && duplicateKey !== lastDuplicateKey) {
        setLastDuplicateKey(duplicateKey);
        showWarning(
          `"${duplicate.description}" - ${formatCurrency(
            duplicate.amount
          )} was recently registered`,
          "Possível duplicata detectada!"
        );
      }
    }
  }, [
    description,
    parsedAmount,
    type,
    transactions,
    editTransaction,
    showWarning,
    lastDuplicateKey,
  ]);

  // ========== LÓGICAS CONDICIONAIS (após todas as definições) ==========

  const hasInstallmentsPreview = splitAmounts !== null && parsedAmount !== 0;
  const hasBalancePreview = balanceDate !== null && parsedAmount !== null && parsedAmount > 0 &&
    (!hasInstallments || installmentCount >= 2);

  // Mostrar preview unificado se pelo menos um preview estiver ativo
  const shouldShowUnifiedPreview =
    hasInstallmentsPreview || hasBalancePreview;

  // Auto-selecionar tab baseado no que está ativo
  useEffect(() => {
    if (hasInstallmentsPreview) {
      setPreviewTab("installments");
    } else if (hasBalancePreview) {
      setPreviewTab("balance");
    }
  }, [hasInstallmentsPreview, hasBalancePreview]);

  const getInitialPaymentMethodDay = useEffectEvent((method: string) => getPaymentMethodPaymentDay?.(method));

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(formatTransactionAmount(editTransaction.amount));
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
      if (editTransaction.installments !== undefined && editTransaction.installments > 1) {
        // Retrocede para o mês da primeira parcela
        const offset = (editTransaction.currentInstallment ?? 1) - 1;
        setInstallmentStartDate(dayjs(editTransaction.date).subtract(offset, "month"));
      } else {
        setInstallmentStartDate(null);
      }
      // Vencimento da fatura: usar valor salvo ou sugerir a partir da data da transação
      const dueDay = getInitialPaymentMethodDay(editTransaction.paymentMethod);
      if (dueDay != null && dueDay >= 1 && dueDay <= 31) {
        if (editTransaction.invoiceDueDate) {
          const d = dayjs(editTransaction.invoiceDueDate);
          setInvoiceDueMonth(d.month() + 1);
          setInvoiceDueYear(d.year());
        } else {
          const { month, year } = getSuggestedInvoiceDueMonthYear(
            dayjs(editTransaction.date),
            dueDay
          );
          setInvoiceDueMonth(month);
          setInvoiceDueYear(year);
        }
        setOptionalInvoiceReportMonth(null);
        setOptionalInvoiceReportYear(null);
      } else if (editTransaction.invoiceDueDate) {
        // Método sem dia de vencimento mas transação já tem fatura definida (ex.: Revolut)
        const d = dayjs(editTransaction.invoiceDueDate);
        setOptionalInvoiceReportMonth(d.month() + 1);
        setOptionalInvoiceReportYear(d.year());
      } else {
        // Método sem dia (ex.: Revolut): sugere próximo mês como fatura (ex.: gasto em março → fatura abril)
        const txDate = dayjs(editTransaction.date);
        const nextMonth = txDate.add(1, "month");
        setOptionalInvoiceReportMonth(nextMonth.month() + 1);
        setOptionalInvoiceReportYear(nextMonth.year());
      }
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
      setInstallmentStartDate(null);
      const now = dayjs();
      setInvoiceDueMonth(now.month() + 1);
      setInvoiceDueYear(now.year());
      setOptionalInvoiceReportMonth(null);
      setOptionalInvoiceReportYear(null);
    }
    setSuggestedCategory(null);
    setLastDuplicateKey("");
    // Aplicar contexto inicial quando abrindo a partir de uma aba específica
    if (!editTransaction && isOpen && initialContext) {
      if (initialContext.paymentMethod) {
        setPaymentMethod(initialContext.paymentMethod);
        const dueDay = getInitialPaymentMethodDay(initialContext.paymentMethod);
        if (dueDay != null && dueDay >= 1 && dueDay <= 31) {
          const { month, year } = getSuggestedInvoiceDueMonthYear(dayjs(), dueDay);
          setInvoiceDueMonth(month);
          setInvoiceDueYear(year);
        }
      }
      if (initialContext.description) setDescription(initialContext.description);
      if (initialContext.amount) setAmount(initialContext.amount);
      if (initialContext.category) setCategory(initialContext.category);
      if (initialContext.type) setType(initialContext.type);
      if (initialContext.isRecurring !== undefined)
        setIsRecurring(initialContext.isRecurring);
      if (initialContext.hasInstallments !== undefined) {
        setHasInstallments(initialContext.hasInstallments);
      }
    }
  }, [editTransaction, isOpen, initialContext, getSuggestedInvoiceDueMonthYear]);

  // Handler para aplicar sugestão de categoria
  const applySuggestedCategory = useCallback(() => {
    if (suggestedCategory) {
      setCategory(suggestedCategory);
      setSuggestedCategory(null);
    }
  }, [suggestedCategory]);

  // Handler para autocomplete de descrição
  const handleDescriptionSelect = useCallback(
    (selectedDescription: string) => {
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
    },
    [transactions]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    // Valor é opcional - pode ser definido depois
    if (!description || !category || !paymentMethod || !date) {
      showError("Preencha todos os campos obrigatórios.", "Campos incompletos");
      return;
    }

    if (hasInstallments && !validInstallmentCount) {
      showError(`Informe um número inteiro entre 2 e ${MAX_INSTALLMENTS} parcelas.`, "Valor inválido");
      return;
    }

    if (invalidAmount) {
      showError("Informe um valor válido com até duas casas decimais.", "Valor inválido");
      return;
    }

    const finalAmount = parsedAmount ?? 0;

    // Data de vencimento da fatura:
    // (1) Cartão com config completa → auto-calculado pela função calculateInvoiceDueDate
    // (2) À vista (cash) → sem invoiceDueDate
    // (3) Legado: método com dia cadastrado → dia fixo + mês/ano do form
    // (4) Legado: método sem dia (ex. Revolut) → opcional mês/ano, salvo como dia 1
    let invoiceDueDate: string | null | undefined;
    if (isCardMethod && autoInvoiceDueDate) {
      invoiceDueDate = autoInvoiceDueDate;
    } else if (isCashMethod) {
      invoiceDueDate = null; // Explicitamente remove fatura para métodos à vista
    } else if (hasInvoiceDueDate && paymentMethodDueDay != null) {
      const daysInMonth = dayjs().year(invoiceDueYear).month(invoiceDueMonth - 1).daysInMonth();
      const d = Math.min(paymentMethodDueDay, daysInMonth);
      invoiceDueDate = `${invoiceDueYear}-${String(invoiceDueMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    } else if (hasOptionalInvoiceReport) {
      invoiceDueDate =
        optionalInvoiceReportMonth != null && optionalInvoiceReportYear != null
          ? `${optionalInvoiceReportYear}-${String(optionalInvoiceReportMonth).padStart(2, "0")}-01`
          : null;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSave(
        {
          description,
          amount: finalAmount,
          type,
          category,
          paymentMethod,
          date: effectiveDate ? effectiveDate.format("YYYY-MM-DD") : date.format("YYYY-MM-DD"),
          ...(invoiceDueDate !== undefined && { invoiceDueDate }),
          isRecurring,
          frequency: isRecurring ? frequency : undefined,
          installments: hasInstallments ? installmentCount : undefined,
          currentInstallment: hasInstallments
            ? editTransaction?.currentInstallment || 1
            : undefined,
          isShared: editTransaction?.isShared ?? false,
          sharedWith: editTransaction?.sharedWith,
          iOwe: editTransaction?.iOwe,
          notes: editTransaction?.notes,
        },
        editTransaction?.id || undefined
      );
      onClose();
    } catch {
      showError("Erro ao salvar transação. Tente novamente.", "Erro ao salvar");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const renderPaymentMethod = (method: string) => {
    const config = getPaymentMethodConfig?.(method);
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
        <PaymentMethodIcon
          key={config?.imageUrl ?? method}
          imageUrl={config?.imageUrl}
          colors={getPaymentMethodColor(method)}
          type={config?.type}
          size={22}
          borderRadius="6px"
          iconSize={12}
        />
        <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {paymentMethodLabel(method)}
        </Box>
      </Box>
    );
  };

  return (
    <Drawer
      anchor="right"
      className="transaction-form-drawer"
      open={isOpen}
      onClose={isSubmitting ? undefined : onClose}
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
        role: "dialog",
        "aria-modal": true,
        "aria-labelledby": "transaction-form-title",
        sx: {
          width: isMobile ? SIDE_PANEL_WIDTH_MOBILE : SIDE_PANEL_WIDTH,
          maxWidth: "100vw",
          overflow: "hidden",
          bgcolor: isDarkMode ? theme.palette.background.default : "#FAFBFC",
          backgroundImage: "none", // Remove o overlay do MUI
          borderLeft: `1px solid ${
            isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)
          }`,
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
          flexShrink: 0,
          zIndex: 10,
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.default, 0.85)
            : alpha("#FAFBFC", 0.9),
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${
            isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.04)
          }`,
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
            minHeight: TOUCH_TARGET_MIN,
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
              component="button"
              type="button"
              disabled={isSubmitting}
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: "transparent",
                border: 0,
                p: 0,
                cursor: "pointer",
                transition: "color 0.15s ease",
                "&:hover": {
                  color: "text.primary",
                },
              }}
              onClick={onClose}
            >
              Transações
            </Typography>
            <ChevronRightIcon sx={{ fontSize: 16, color: "text.disabled" }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              {editTransaction ? "Editar" : "Nova"}
            </Typography>
          </Box>

          {/* Botão Fechar */}
          <IconButton
            aria-label="Fechar formulário"
            onClick={onClose}
            disabled={isSubmitting}
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
                background:
                  type === "income"
                    ? `linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.success.main, 0.25)} 100%)`
                    : `linear-gradient(135deg, ${alpha(
                        theme.palette.error.main,
                        0.15
                      )} 0%, ${alpha(theme.palette.error.main, 0.25)} 100%)`,
                border: `1px solid ${alpha(
                  type === "income"
                    ? theme.palette.success.main
                    : theme.palette.error.main,
                  0.2
                )}`,
                transition: "all 0.2s ease",
              }}
            >
              <ReceiptIcon
                sx={{
                  fontSize: 22,
                  color: type === "income" ? "success.main" : "error.main",
                }}
              />
            </Box>
            <Box>
              <Typography
                id="transaction-form-title"
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
                {editTransaction ? "Editar Transação" : "Nova Transação"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
              >
                {editTransaction
                  ? `Modificando ${editTransaction.description}`
                  : "Preencha os detalhes abaixo"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <form
        id="transaction-form"
        name="transaction-form"
        onSubmit={handleSubmit}
        method="POST"
        action="javascript:void(0);"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overscrollBehaviorY: "contain",
            overflowY: "auto",
            overflowX: "hidden",
            px: 3,
            pt: 2,
            pb: 3,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: isDarkMode
                ? alpha(theme.palette.primary.main, 0.2)
                : alpha(theme.palette.primary.main, 0.1),
              borderRadius: 3,
              "&:hover": {
                bgcolor: isDarkMode
                  ? alpha(theme.palette.primary.main, 0.4)
                  : alpha(theme.palette.primary.main, 0.3),
              },
            },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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
                    bgcolor: alpha(
                      theme.palette.success.main,
                      isDarkMode ? 0.2 : 0.15
                    ),
                    color: theme.palette.success.main,
                    boxShadow: `0 4px 12px -4px ${alpha(
                      theme.palette.success.main,
                      0.3
                    )}`,
                    "&:hover": {
                      bgcolor: alpha(
                        theme.palette.success.main,
                        isDarkMode ? 0.25 : 0.2
                      ),
                    },
                  },
                }}
              >
                 Receita
              </ToggleButton>
              <ToggleButton
                value="expense"
                sx={{
                  "&.Mui-selected": {
                    bgcolor: alpha(
                      theme.palette.error.main,
                      isDarkMode ? 0.2 : 0.15
                    ),
                    color: theme.palette.error.main,
                    boxShadow: `0 4px 12px -4px ${alpha(
                      theme.palette.error.main,
                      0.3
                    )}`,
                    "&:hover": {
                      bgcolor: alpha(
                        theme.palette.error.main,
                        isDarkMode ? 0.25 : 0.2
                      ),
                    },
                  },
                }}
              >
                 Despesa
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Descrição com Autocomplete */}
            <Box>
              <Autocomplete
                id="transaction-description"
                freeSolo
                options={uniqueDescriptions}
                value={null}
                inputValue={description}
                onInputChange={(_, newValue, reason) => {
                  if (reason === "input" || reason === "clear") setDescription(newValue);
                }}
                onChange={(_, newValue) => {
                  setDescription(newValue ?? "");
                  if (newValue) handleDescriptionSelect(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Descrição"
                    name="transaction-description"
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
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <HistoryIcon
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="body2">{option}</Typography>
                      </Box>
                    </li>
                  );
                }}
              />

              {/* Sugestão de Categoria (Local) */}
              <Collapse in={!!suggestedCategory}>
                <Chip
                  label={`Sugestão: ${categoryLabel(suggestedCategory ?? "")}`}
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

              {/* Sugestão de Categoria (IA) - aparece quando não há sugestão local */}
              <Collapse
                in={
                  !suggestedCategory &&
                  (!!aiSuggestion || isLoadingAiSuggestion)
                }
              >
                <Chip
                  icon={
                    isLoadingAiSuggestion ? undefined : (
                      <BoltIcon sx={{ fontSize: 14 }} />
                    )
                  }
                  label={
                    isLoadingAiSuggestion
                      ? " Analyzing..."
                      : `Sugestão da IA: ${categoryLabel(aiSuggestion?.category ?? "")}`
                  }
                  onClick={() => {
                    if (aiSuggestion) {
                      setCategory(aiSuggestion.category);
                      setAiSuggestion(null);
                    }
                  }}
                  onDelete={
                    aiSuggestion
                      ? () => {
                          setCategory(aiSuggestion.category);
                          setAiSuggestion(null);
                        }
                      : undefined
                  }
                  deleteIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                  disabled={isLoadingAiSuggestion}
                  size="small"
                  sx={{
                    mt: 1,
                    borderRadius: "20px",
                    fontWeight: 500,
                    bgcolor: alpha("#8A2BE2", 0.1),
                    border: `1px solid ${alpha("#8A2BE2", 0.2)}`,
                    color: "#8A2BE2",
                    "& .MuiChip-deleteIcon": {
                      color: theme.palette.success.main,
                    },
                    "&:hover": {
                      bgcolor: alpha("#8A2BE2", 0.2),
                    },
                    animation: isLoadingAiSuggestion
                      ? "pulse 1.5s ease-in-out infinite"
                      : undefined,
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 0.7 },
                      "50%": { opacity: 1 },
                    },
                  }}
                />
              </Collapse>
            </Box>

            {/* Valor */}
            <Box>
              <TextField
                label="Valor (R$)"
                name="transaction-amount"
                id="transaction-amount"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => {
                  if (parsedAmount !== null) setAmount(formatTransactionAmount(parsedAmount));
                }}
                inputProps={{ inputMode: "decimal" }}
                placeholder="0,00"
                error={invalidAmount}
                helperText={invalidAmount ? "Informe um valor com até duas casas decimais." : undefined}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography fontWeight={600} color="text.secondary">
                        R$
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
            </Box>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required sx={inputSx}>
                  <InputLabel id="category-label">Categoria</InputLabel>
                  <Select
                    labelId="category-label"
                    id="transaction-category-select"
                    name="transaction-category"
                    value={category}
                    label="Categoria"
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSuggestedCategory(null);
                    }}
                  >
                    {categories[type].map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {categoryLabel(cat)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required sx={inputSx}>
                  <InputLabel id="payment-method-label">Método de pagamento</InputLabel>
                  <Select
                    labelId="payment-method-label"
                    id="transaction-payment-method-select"
                    name="transaction-payment-method"
                    value={paymentMethod}
                    label="Método de pagamento"
                    renderValue={renderPaymentMethod}
                    onChange={(e) => {
                      const method = e.target.value;
                      setPaymentMethod(method);
                      // Ao selecionar método com dia de vencimento, preenche mês/ano da fatura (não altera data da transação)
                      if (getPaymentMethodPaymentDay) {
                        const day = getPaymentMethodPaymentDay(method);
                        if (day != null && day >= 1 && day <= 31 && date) {
                          const { month, year } = getSuggestedInvoiceDueMonthYear(date, day);
                          setInvoiceDueMonth(month);
                          setInvoiceDueYear(year);
                          setOptionalInvoiceReportMonth(null);
                          setOptionalInvoiceReportYear(null);
                        } else {
                          setOptionalInvoiceReportMonth(null);
                          setOptionalInvoiceReportYear(null);
                        }
                      }
                    }}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        {renderPaymentMethod(method)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box>
              <DatePicker
                label="Data"
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

            {/* Fatura auto-calculada para cartão */}
            {isCardMethod && autoInvoiceDueDate && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: "14px",
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.primary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <ReceiptIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Fatura calculada automaticamente
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {formatInvoiceMonth(autoInvoiceDueDate)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Aviso quando cartão sem configuração de dias */}
            {isCardIncomplete && paymentMethod && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: "14px",
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.warning.main, 0.1)
                    : alpha(theme.palette.warning.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <ReceiptIcon sx={{ fontSize: 18, color: "warning.main" }} />
                <Typography variant="caption" color="warning.main">
                  Configure os dias de fechamento e pagamento deste cartão em Métodos de pagamento.
                </Typography>
              </Box>
            )}

            {/* Vencimento da fatura legado (só quando forma de pagamento tem dia cadastrado); usuário edita apenas mês/ano */}
            {hasInvoiceDueDate && paymentMethodDueDay != null && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
                >
                  <ReceiptIcon sx={{ fontSize: 16 }} />
                  Vencimento da fatura
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small" sx={inputSx}>
                      <InputLabel>Mês</InputLabel>
                      <Select
                        value={invoiceDueMonth}
                        label="Mês"
                        onChange={(e) =>
                          setInvoiceDueMonth(Number(e.target.value))
                        }
                      >
                        {MONTHS.map((name, i) => (
                          <MenuItem key={name} value={i + 1}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small" sx={inputSx}>
                      <InputLabel>Ano</InputLabel>
                      <Select
                        value={invoiceDueYear}
                        label="Ano"
                        onChange={(e) =>
                          setInvoiceDueYear(Number(e.target.value))
                        }
                      >
                        {Array.from({ length: 11 }, (_, i) => dayjs().year() - 2 + i).map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Dia {paymentMethodDueDay} (definido pelo método de pagamento)
                </Typography>
              </Box>
            )}

            {/* Mês da fatura para relatório (métodos sem dia de vencimento, ex.: Revolut) — opcional */}
            {hasOptionalInvoiceReport && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
                >
                  <ReceiptIcon sx={{ fontSize: 16 }} />
                  Incluir na fatura de (mês/ano)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Define em qual mês a transação aparece no painel e nos relatórios, como na fatura de abril.
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small" sx={inputSx}>
                      <InputLabel>Mês</InputLabel>
                      <Select
                        value={optionalInvoiceReportMonth ?? ""}
                        label="Mês"
                        displayEmpty
                        onChange={(e) =>
                          setOptionalInvoiceReportMonth(String(e.target.value) === "" ? null : Number(e.target.value))
                        }
                      >
                        <MenuItem value="">— Do not set</MenuItem>
                        {MONTHS.map((name, i) => (
                          <MenuItem key={name} value={i + 1}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small" sx={inputSx}>
                      <InputLabel>Ano</InputLabel>
                      <Select
                        value={optionalInvoiceReportYear ?? ""}
                        label="Ano"
                        displayEmpty
                        onChange={(e) =>
                          setOptionalInvoiceReportYear(String(e.target.value) === "" ? null : Number(e.target.value))
                        }
                      >
                        <MenuItem value="">—</MenuItem>
                        {Array.from({ length: 11 }, (_, i) => dayjs().year() - 2 + i).map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Divider />
            <Box component="section" aria-labelledby="transaction-advanced-title" sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Typography id="transaction-advanced-title" component="h2" variant="subtitle1" fontWeight={700}>
                Opções avançadas
              </Typography>
              {/* Recorrente Toggle */}
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper
                    elevation={0}
                    sx={getTogglePaperSx(
                      isRecurring,
                      theme.palette.primary.main,
                      theme,
                      isDarkMode
                    )}
                    onClick={() => {
                      const newValue = !isRecurring;
                      setIsRecurring(newValue);
                      if (newValue) setHasInstallments(false);
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isRecurring
                            ? alpha(
                                theme.palette.primary.main,
                                isDarkMode ? 0.2 : 0.12
                              )
                            : alpha("#64748B", 0.1),
                          transition: "all 0.2s ease",
                        }}
                      >
                        <RepeatIcon
                          fontSize="small"
                          sx={{
                            color: isRecurring
                              ? "primary.main"
                              : "text.secondary",
                            transition: "color 0.2s ease",
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        Repetir?
                      </Typography>
                    </Box>
                    <Switch
                      checked={isRecurring}
                      slotProps={{ input: { "aria-label": "Recorrentes" } }}
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
                      sx={getTogglePaperSx(
                        hasInstallments,
                        theme.palette.warning.main,
                        theme,
                        isDarkMode
                      )}
                      onClick={() => {
                        const newValue = !hasInstallments;
                        setHasInstallments(newValue);
                        if (newValue) {
                          setIsRecurring(false);
                          if (!installmentStartDate) setInstallmentStartDate(date);
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: hasInstallments
                              ? alpha(
                                  theme.palette.warning.main,
                                  isDarkMode ? 0.2 : 0.12
                                )
                              : alpha("#64748B", 0.1),
                            transition: "all 0.2s ease",
                          }}
                        >
                          <CreditCardIcon
                            fontSize="small"
                            sx={{
                              color: hasInstallments
                                ? "warning.main"
                                : "text.secondary",
                              transition: "color 0.2s ease",
                            }}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight={500}>
                          Parcelar?
                        </Typography>
                      </Box>
                      <Switch
                        checked={hasInstallments}
                        slotProps={{ input: { "aria-label": "Parcela" } }}
                        size="small"
                        color="warning"
                      />
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
                  label="Número de parcelas"
                  type="number"
                  fullWidth
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  inputProps={{ min: 2, max: MAX_INSTALLMENTS, step: 1 }}
                  sx={inputSx}
                />
              )}

              {/* Mês de início do parcelamento */}
              {hasInstallments && (
                <DatePicker
                  label="Mês inicial"
                  value={installmentStartDate ?? date}
                  onChange={(v) => setInstallmentStartDate(v)}
                  views={["year", "month"]}
                  openTo="month"
                  slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
                />
              )}
            </Box>

            {/* ========== PREVIEW UNIFICADO ========== */}
            {shouldShowUnifiedPreview && (
              <Paper
                elevation={0}
                sx={{
                  p: 0,
                  borderRadius: "20px",
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha("#000000", 0.02),
                  border: `1px solid ${
                    isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.08)
                  }`,
                  overflow: "hidden",
                }}
              >
                {/* Tabs para alternar entre previews */}
                <Tabs
                  value={previewTab}
                  onChange={(_, newValue) => setPreviewTab(newValue)}
                  sx={{
                    borderBottom: `1px solid ${
                      isDarkMode
                        ? alpha("#FFFFFF", 0.08)
                        : alpha("#000000", 0.06)
                    }`,
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
                    <Tab label=" Parcelas" value="installments" />
                  )}
                  {hasBalancePreview && (
                    <Tab label=" Saldo" value="balance" />
                  )}
                </Tabs>

                {/* Conteúdo do preview */}
                <Box sx={{ p: 2.5 }}>
                  {/* Preview de Parcelas */}
                  {previewTab === "installments" && hasInstallmentsPreview && splitAmounts && (
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="warning.main"
                          fontWeight={500}
                        >
                          {installmentCount} parcelas
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color="warning.main"
                        >
                          {formatCurrency(Math.min(...splitAmounts))}
                          {Math.min(...splitAmounts) !== Math.max(...splitAmounts) &&
                            ` – ${formatCurrency(Math.max(...splitAmounts))}`}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Total: {formatCurrency(parsedAmount!)}
                      </Typography>
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

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Saldo em {effectiveDate?.format("DD/MM/YYYY")}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(balanceBefore)}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {type === "expense" ? (
                              <TrendingDownIcon
                                sx={{ fontSize: 16, color: "error.main" }}
                              />
                            ) : (
                              <TrendingUpIcon
                                sx={{ fontSize: 16, color: "success.main" }}
                              />
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {hasInstallments ? "Esta parcela" : "Esta transação"}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={
                              type === "expense" ? "error.main" : "success.main"
                            }
                          >
                            {type === "expense" ? "-" : "+"}
                            {formatCurrency(balanceImpact)}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 0.5 }} />

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            Saldo após
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color={
                              balanceAfter < 0 ? "error.main" : "text.primary"
                            }
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
                              "& .MuiAlert-message": { py: 0 },
                            }}
                          >
                            <Typography variant="caption">
                              ️ Saldo ficará negativo
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
        </Box>

        {/* ====== BOTTOM ACTION BAR ====== */}
        <Box
          sx={{
            flexShrink: 0,
            p: 2.5,
            pb: isMobile
              ? "calc(20px + env(safe-area-inset-bottom, 0px))"
              : 2.5,
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.95)
              : alpha("#FAFBFC", 0.98),
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: `1px solid ${
              isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.04)
            }`,
            boxShadow: isDarkMode
              ? `0 -8px 32px -8px ${alpha("#000000", 0.3)}`
              : `0 -8px 32px -8px ${alpha(theme.palette.primary.main, 0.08)}`,
            display: "flex",
            gap: 1.5,
          }}
        >
          {!isMobile && (
            <NixButton
              size="medium"
              variant="soft"
              color="gray"
              onClick={onClose}
            disabled={isSubmitting}
              type="button"
            >
              Cancelar
            </NixButton>
          )}
          <NixButton
            type="submit"
            loading={isSubmitting}
            size="medium"
            variant="solid"
            color="purple"
            style={{ flex: 1 }}
          >
            <SaveIcon />{" "}
            {isSubmitting ? "Salvando…" : editTransaction ? "Salvar Alterações" : "Criar Transação"}
          </NixButton>
        </Box>
      </form>
    </Drawer>
  );
};

export default TransactionForm;
