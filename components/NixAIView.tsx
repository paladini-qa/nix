import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
  useMediaQuery,
  useTheme,
  Chip,
  alpha,
  Tooltip,
  Paper,
  Button,
  Collapse,
  Alert,
  keyframes,
  Stack,
  Fade,
  Grow,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import {
  Today as DateIcon,
  Send as SendIcon,
  AutoAwesome as SparklesIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Mic as MicIcon,
  PhotoCamera as CameraIcon,
  Stop as StopIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  CreditCard as PaymentIcon,
  Star as StarIcon,
  TextFields as TextFieldsIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import NixAISkeleton from "./skeletons/NixAISkeleton";
import BatchTransactionTable, {
  EditableBatchRow,
} from "./BatchTransactionTable";
import { Transaction, ParsedTransaction, SmartInputMode, TransactionType } from "../types";
import {
  chatWithNixAI,
  parseBatchFromText,
  parseBatchFromAudio,
  parseBatchFromImage,
  detectTransactionIntent,
  isGeminiConfigured,
  GEMINI_NOT_CONFIGURED_MESSAGE,
  generateChatTitle,
} from "../services/geminiService";
import { useConfirmDialog } from "../contexts";
import { useTranslation } from "react-i18next";

// Motion components
const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

// Animação de pulso para gravação de áudio
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
`;

// Animação de typing para loading
const typingAnimation = keyframes`
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
`;

// ============================================
// NIX BRAND COLORS - Paleta do Brand Book
// ============================================
const NIX_BRAND = {
  purple: "#8A2BE2",
  purpleLight: "#9D4EDD",
  purpleDark: "#6A0DAD",
  teal: "#00D4FF",
  success: "#2ECC71",
  error: "#FF6B6B",
  gradient: "linear-gradient(135deg, #8A2BE2 0%, #6A0DAD 100%)",
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  parsedTransaction?: ParsedTransaction;
}

interface NixAIViewProps {
  transactions: Transaction[];
  categories?: { income: string[]; expense: string[] };
  paymentMethods?: string[];
  onTransactionCreate?: (
    transaction: Omit<ParsedTransaction, "confidence" | "rawInput"> & {
      invoiceDueDate?: string;
    }
  ) => void;
  getPaymentMethodConfig?: (method: string) => import("../types").PaymentMethodConfig | undefined;
  displayName?: string;
}

// ============================================
// Sub-componentes
// ============================================

// Componente de Timestamp formatado
const MessageTimestamp: React.FC<{ date: Date }> = ({ date }) => {
  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Typography
      variant="caption"
      sx={{
        color: "text.disabled",
        fontSize: 10,
        mt: 0.5,
        display: "block",
        opacity: 0.6,
      }}
    >
      {formatTime(date)}
    </Typography>
  );
};

// Componente de Typing Indicator
const TypingIndicator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          background: NIX_BRAND.gradient,
          boxShadow: `0 4px 16px ${alpha(NIX_BRAND.purple, 0.35)}`,
        }}
      >
        <SparklesIcon sx={{ fontSize: 18 }} />
      </Avatar>
      <Box
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: "18px",
          borderTopLeftRadius: "4px",
          bgcolor: theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.04),
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: NIX_BRAND.purple,
              animation: `${typingAnimation} 1.4s infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </Box>
    </MotionBox>
  );
};

// Componente de Preview de Transação Inline
interface TransactionPreviewCardProps {
  transaction: ParsedTransaction;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  onConfirm: (transaction: Omit<ParsedTransaction, "confidence" | "rawInput">) => void;
  onCancel: () => void;
}

const TransactionPreviewCard: React.FC<TransactionPreviewCardProps> = ({
  transaction,
  categories,
  paymentMethods,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Estados de edição inline
  const [editMode, setEditMode] = useState(false);
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount?.toString() || "");
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod);
  const [date, setDate] = useState(transaction.date);

  const availableCategories = type === "income" ? categories.income : categories.expense;

  const handleConfirm = () => {
    onConfirm({
      description,
      amount: amount ? parseFloat(amount) : null,
      type,
      category,
      paymentMethod,
      date,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.palette.success.main;
    if (confidence >= 0.5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <MotionPaper
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "20px",
        bgcolor: isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#FFFFFF", 0.9),
        backdropFilter: "blur(20px)",
        border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
        boxShadow: isDarkMode
          ? `0 8px 32px ${alpha("#000000", 0.3)}`
          : `0 8px 32px ${alpha(NIX_BRAND.purple, 0.12)}`,
      }}
    >
      {/* Header com confiança */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SparklesIcon sx={{ color: NIX_BRAND.purple, fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={700}>
            Transação Identificada
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${Math.round(transaction.confidence * 100)}% confiança`}
          sx={{
            bgcolor: alpha(getConfidenceColor(transaction.confidence), 0.15),
            color: getConfidenceColor(transaction.confidence),
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      </Box>

      {/* Tipo Toggle */}
      <ToggleButtonGroup
        value={type}
        exclusive
        onChange={(_, v) => {
          if (v) {
            setType(v);
            const newCats = v === "income" ? categories.income : categories.expense;
            if (!newCats.includes(category)) setCategory(newCats[0] || "");
          }
        }}
        fullWidth
        size="small"
        sx={{
          mb: 2,
          "& .MuiToggleButton-root": {
            py: 1,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "12px !important",
            border: "none",
            bgcolor: isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.03),
          },
        }}
      >
        <ToggleButton
          value="expense"
          sx={{
            "&.Mui-selected": {
              bgcolor: `${alpha(NIX_BRAND.error, 0.15)} !important`,
              color: NIX_BRAND.error,
            },
          }}
        >
           Despesa
        </ToggleButton>
        <ToggleButton
          value="income"
          sx={{
            "&.Mui-selected": {
              bgcolor: `${alpha(NIX_BRAND.success, 0.15)} !important`,
              color: NIX_BRAND.success,
            },
          }}
        >
           Receita
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Campos de dados */}
      <Stack spacing={1.5}>
        {/* Descrição */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: "12px",
            bgcolor: isDarkMode ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02),
          }}
        >
          <ReceiptIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          {editMode ? (
            <TextField
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="small"
              fullWidth
              variant="standard"
              sx={{ "& input": { fontWeight: 500 } }}
            />
          ) : (
            <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
              {description}
            </Typography>
          )}
        </Box>

        {/* Valor */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: "12px",
            bgcolor: isDarkMode ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02),
          }}
        >
          <MoneyIcon sx={{ color: type === "income" ? NIX_BRAND.success : NIX_BRAND.error, fontSize: 20 }} />
          {editMode ? (
            <TextField
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              size="small"
              type="number"
              fullWidth
              variant="standard"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5, fontWeight: 600 }}>R$</Typography>,
              }}
              sx={{ "& input": { fontWeight: 600 } }}
            />
          ) : (
            <Typography
              variant="body1"
              fontWeight={700}
              color={type === "income" ? NIX_BRAND.success : NIX_BRAND.error}
            >
              {amount ? `R$ ${parseFloat(amount).toFixed(2)}` : "Valor não identificado"}
            </Typography>
          )}
        </Box>

        {/* Categoria e Pagamento em linha */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            icon={<CategoryIcon sx={{ fontSize: 16 }} />}
            label={category}
            size="small"
            onClick={() => {
              const idx = availableCategories.indexOf(category);
              setCategory(availableCategories[(idx + 1) % availableCategories.length] || category);
            }}
            sx={{
              flex: 1,
              bgcolor: alpha(NIX_BRAND.purple, 0.1),
              color: NIX_BRAND.purple,
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": { bgcolor: alpha(NIX_BRAND.purple, 0.2) },
            }}
          />
          <Chip
            icon={<PaymentIcon sx={{ fontSize: 16 }} />}
            label={paymentMethod}
            size="small"
            onClick={() => {
              const idx = paymentMethods.indexOf(paymentMethod);
              setPaymentMethod(paymentMethods[(idx + 1) % paymentMethods.length] || paymentMethod);
            }}
            sx={{
              flex: 1,
              bgcolor: alpha(NIX_BRAND.teal, 0.1),
              color: NIX_BRAND.teal,
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": { bgcolor: alpha(NIX_BRAND.teal, 0.2) },
            }}
          />
        </Box>

        {/* Data */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DateIcon sx={{ color: "text.secondary", fontSize: 18 }} />
          <Typography variant="caption" color="text.secondary">
            {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Typography>
        </Box>
      </Stack>

      {/* Botões de ação */}
      <Box sx={{ display: "flex", gap: 1.5, mt: 2.5 }}>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<CloseIcon />}
          onClick={onCancel}
          sx={{
            borderRadius: "12px",
            fontWeight: 600,
            textTransform: "none",
            borderColor: "divider",
            color: "text.secondary",
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<CheckIcon />}
          onClick={handleConfirm}
          sx={{
            flex: 1,
            borderRadius: "12px",
            fontWeight: 600,
            textTransform: "none",
            background: NIX_BRAND.gradient,
            boxShadow: `0 4px 16px ${alpha(NIX_BRAND.purple, 0.35)}`,
            "&:hover": {
              boxShadow: `0 6px 20px ${alpha(NIX_BRAND.purple, 0.45)}`,
            },
          }}
        >
          Confirmar
        </Button>
      </Box>

      {/* Dica de edição */}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: "block", textAlign: "center", mt: 1.5 }}
      >
         Clique nos campos para ajustar antes de confirmar
      </Typography>
    </MotionPaper>
  );
};

// Re-export for consumers that imported from NixAIView
export type { EditableBatchRow };

// Componente de Mensagem
interface ChatMessageProps {
  message: Message;
  isMobile: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMobile }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isUser = message.role === "user";
  const isWelcome = message.id === "welcome";

  // Card especial para mensagem de boas-vindas
  if (isWelcome) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <Box
          sx={{
            p: 2.5,
            borderRadius: "20px",
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha("#1e293b", 0.9)} 0%, ${alpha("#0f172a", 0.95)} 100%)`
              : `linear-gradient(135deg, ${alpha("#f8fafc", 0.95)} 0%, ${alpha("#f1f5f9", 0.9)} 100%)`,
            border: `1px solid ${alpha(NIX_BRAND.purple, 0.2)}`,
            boxShadow: `0 8px 32px ${alpha(NIX_BRAND.purple, 0.1)}`,
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header do card */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "14px",
                background: NIX_BRAND.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${alpha(NIX_BRAND.purple, 0.4)}`,
                flexShrink: 0,
              }}
            >
              <SparklesIcon sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {t("nixai.title")}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10b981", boxShadow: "0 0 4px #10b981" }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                  Online
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Conteúdo com Markdown */}
          <Box
            sx={{
              "& p": { m: 0, mb: 0.75, fontSize: 14, lineHeight: 1.65, color: "text.primary" },
              "& p:last-child": { mb: 0 },
              "& ul": { m: 0, pl: 2, mb: 0.5 },
              "& li": { mb: 0.5, fontSize: 14, lineHeight: 1.55 },
              "& strong": { fontWeight: 700, color: isDarkMode ? "#e2e8f0" : "#1e293b" },
            }}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>

          <MessageTimestamp date={message.timestamp} />
        </Box>
      </MotionBox>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      sx={{
        display: "flex",
        gap: 1.5,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 30,
          height: 30,
          flexShrink: 0,
          background: isUser
            ? isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.08)
            : NIX_BRAND.gradient,
          color: isUser ? "text.primary" : "#FFFFFF",
          boxShadow: isUser ? "none" : `0 3px 10px ${alpha(NIX_BRAND.purple, 0.3)}`,
        }}
      >
        {isUser ? <PersonIcon sx={{ fontSize: 15 }} /> : <SparklesIcon sx={{ fontSize: 15 }} />}
      </Avatar>

      {/* Bolha */}
      <Box
        sx={{
          maxWidth: isMobile ? "78%" : "65%",
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        <Box
          sx={{
            py: 1.25,
            px: 1.75,
            borderRadius: "16px",
            borderTopRightRadius: isUser ? "4px" : "16px",
            borderTopLeftRadius: isUser ? "16px" : "4px",
            ...(isUser
              ? {
                  background: NIX_BRAND.gradient,
                  color: "#FFFFFF",
                  boxShadow: `0 3px 12px ${alpha(NIX_BRAND.purple, 0.25)}`,
                }
              : {
                  bgcolor: isDarkMode ? alpha("#FFFFFF", 0.07) : alpha("#000000", 0.04),
                  border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.05)}`,
                  color: "text.primary",
                }),
            "& p": { m: 0, mb: 0.5, fontSize: 14, lineHeight: 1.6 },
            "& p:last-child": { mb: 0 },
            "& ul, & ol": { m: 0, pl: 2, mb: 0.5 },
            "& ul:last-child, & ol:last-child": { mb: 0 },
            "& li": { mb: 0.25, fontSize: 14 },
            "& strong": { fontWeight: 600 },
            "& code": {
              bgcolor: isUser ? alpha("#FFFFFF", 0.2) : "action.hover",
              px: 0.75,
              py: 0.25,
              borderRadius: "6px",
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
            },
          }}
        >
          {isUser ? (
            <Typography sx={{ fontSize: 14 }}>{message.content}</Typography>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </Box>
        <MessageTimestamp date={message.timestamp} />
      </Box>
    </MotionBox>
  );
};

// ============================================
// Componente Principal
// ============================================

const NixAIView: React.FC<NixAIViewProps> = ({
  transactions,
  categories = { income: ["Salary", "Other"], expense: ["Food", "Transportation", "Other"] },
  paymentMethods = ["Pix", "Credit Card", "Debit Card", "Cash"],
  onTransactionCreate,
  getPaymentMethodPaymentDay,
  getPaymentMethodConfig,
  displayName,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { confirm } = useConfirmDialog();
  const { t } = useTranslation();
  const firstName = displayName ? displayName.split(' ')[0] : '';

  const SUGGESTIONS = [
    { icon: <ReceiptIcon fontSize="small" />, label: "Ler recibo ou nota", action: () => fileInputRef.current?.click() },
    { icon: <MicIcon fontSize="small" />, label: "Descrever por áudio", action: () => startRecording() },
    { icon: <AttachFileIcon fontSize="small" />, label: "Importar arquivo", action: () => fileInputRef.current?.click() },
    { icon: <TextFieldsIcon fontSize="small" />, label: "Digitar gastos", action: () => inputRef.current?.focus() },
  ];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para upload de imagem
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para transação pendente (uma) ou lote (várias)
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null);
  const [pendingBatch, setPendingBatch] = useState<ParsedTransaction[] | null>(null);
  const [smartInputError, setSmartInputError] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string | null>(null);

  // Efeito para gerar título quando a primeira mensagem é enviada
  useEffect(() => {
    const handleTitleGeneration = async () => {
      if (messages.length > 0 && !chatTitle && !isLoading) {
        // Usa a primeira mensagem do usuário ou assistente para gerar o título
        const firstMessage = messages[0].content;
        const title = await generateChatTitle(firstMessage);
        setChatTitle(title);
      }
    };
    handleTitleGeneration();
  }, [messages.length, chatTitle, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingTransaction, pendingBatch]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };


  // Processar texto para extrair transação
  const processTextInput = useCallback(
    async (text: string, showUserMessage = true) => {
      setIsLoading(true);
      setSmartInputError(null);

      if (showUserMessage) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
      }

      try {
        const batch = await parseBatchFromText(text, categories, paymentMethods);

        if (batch.length === 1) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Entendi! Dá uma conferida nos dados abaixo e confirma pra eu salvar:",
            timestamp: new Date(),
            parsedTransaction: batch[0],
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setPendingTransaction(batch[0]);
          setPendingBatch(null);
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Identifiquei **${batch.length} transações**. Confira a tabela, edite se precisar e confirme para salvar todas:`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setPendingBatch(batch);
          setPendingTransaction(null);
        }
      } catch (error) {
        console.error("Error parsing text:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Ops, não consegui entender os detalhes. \n\nTenta algo como: \"Gastei 50 reais no mercado com Pix\"",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [categories, paymentMethods]
  );

  // Iniciar gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioInput(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setSmartInputError("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleFileProcessing = async (file: File) => {
    // CSV/OFX/QFX logic
    if (file.name.endsWith(".csv") || file.name.endsWith(".ofx") || file.name.endsWith(".qfx")) {
      setIsLoading(true);
      setSmartInputError(null);
      
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `Arquivo importado: ${file.name}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const text = await file.text();
        const rows = import("../services/importService").then(m => m.parseImportFile(text, file.name));
        const resolvedRows = await rows;
        
        if (resolvedRows.length === 0) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Nenhuma transação encontrada no arquivo. Verifique o formato.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          const batch: ParsedTransaction[] = resolvedRows.map((row) => ({
            description: row.description,
            amount: row.amount,
            type: row.type,
            category: row.type === "income" ? (categories.income[0] || "Outros") : (categories.expense[0] || "Outros"),
            paymentMethod: paymentMethods[0] || "",
            date: row.date || new Date().toISOString().split("T")[0],
            confidence: 1,
            rawInput: "Imported from file",
          }));
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Identifiquei **${batch.length} transações** no arquivo. Confira a tabela e confirme:`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setPendingBatch(batch);
          setPendingTransaction(null);
        }
      } catch (err) {
        console.error(err);
        setSmartInputError("Erro ao processar o arquivo. Verifique o formato.");
      } finally {
        setIsLoading(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Image logic
    if (file.size > 4 * 1024 * 1024) {
      setSmartInputError("Imagem muito grande. Máximo 4MB.");
      return;
    }
    setIsLoading(true);
    setSmartInputError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Foto enviada: ${file.name}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageBase64 = e.target?.result as string;
        try {
          const batch = await parseBatchFromImage(imageBase64, file.type, categories, paymentMethods);
          
          if (batch.length === 1) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: "Li o recibo! Confere os dados:",
              timestamp: new Date(),
              parsedTransaction: batch[0],
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setPendingTransaction(batch[0]);
            setPendingBatch(null);
          } else {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `Li **${batch.length} transações** na foto. Confira e confirme:`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setPendingBatch(batch);
            setPendingTransaction(null);
          }
        } catch (err) {
          console.error(err);
          setSmartInputError("Não foi possível ler a imagem. Tente outra foto com boa iluminação.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setSmartInputError("Erro ao processar a imagem.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileProcessing(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1 || items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) handleFileProcessing(file);
        if (items[i].type.indexOf("image") !== -1) e.preventDefault();
        break;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcessing(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const processAudioInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    setSmartInputError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: ` Mensagem de voz (${formatTime(recordingTime)})`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const batch = await parseBatchFromAudio(audioBlob, categories, paymentMethods);

      if (batch.length === 1) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Entendi o áudio! Confere se tá tudo certo:",
          timestamp: new Date(),
          parsedTransaction: batch[0],
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setPendingTransaction(batch[0]);
        setPendingBatch(null);
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Identifiquei **${batch.length} transações** no áudio. Confira a tabela, edite se precisar e confirme:`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setPendingBatch(batch);
        setPendingTransaction(null);
      }
    } catch (error) {
      console.error("Error parsing audio:", error);
      const notConfigured =
        error instanceof Error && error.message === "GEMINI_NOT_CONFIGURED";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: notConfigured
          ? GEMINI_NOT_CONFIGURED_MESSAGE
          : "Não consegui entender o áudio. \n\nTenta falar mais devagar: \"Gastei cinquenta reais no Uber\"",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setRecordingTime(0);
    }
  };


  const handleConfirmTransaction = (transaction: Omit<ParsedTransaction, "confidence" | "rawInput">) => {
    if (!onTransactionCreate) return;

    onTransactionCreate(transaction);

    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: " **Pronto!** Transação salva. Posso ajudar com mais alguma coisa?",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
    setPendingTransaction(null);
  };

  const handleCancelTransaction = () => {
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sem problemas! Cancelei essa. Me avisa se precisar de algo. ",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
    setPendingTransaction(null);
  };

  const handleConfirmBatch = (rows: EditableBatchRow[]) => {
    if (!onTransactionCreate) return;
    rows.forEach((row) => {
      onTransactionCreate({
        description: row.description,
        amount: row.amount != null ? row.amount : 0,
        type: row.type,
        category: row.category,
        paymentMethod: row.paymentMethod,
        date: row.date,
        ...(row.invoiceDueDate && { invoiceDueDate: row.invoiceDueDate }),
      });
    });
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: ` **Pronto!** ${rows.length} transação(ões) salva(s). Posso ajudar com mais alguma coisa?`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
    setPendingBatch(null);
  };

  const handleCancelBatch = async () => {
    const count = pendingBatch?.length ?? 0;
    const confirmed = await confirm({
      title: "Descartar lote",
      message: `Tem certeza que deseja descartar ${count} transaç${count === 1 ? "ão" : "ões"} pendentes? Elas não serão salvas.`,
      confirmText: "Descartar",
      cancelText: "Continuar editando",
      variant: "warning",
    });
    if (!confirmed) return;

    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sem problemas! Cancelei o lote. Me avisa se precisar de algo. ",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
    setPendingBatch(null);
  };

  const handleSmartInputAction = (mode: SmartInputMode) => {
    if (mode === "audio") {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    } else if (mode === "image") {
      fileInputRef.current?.click();
    } else if (mode === "text") {
      inputRef.current?.focus();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const trimmedInput = inputValue.trim();
    setInputValue("");

    // Detecta se é uma intenção de cadastro usando a função do serviço
    const intentResult = detectTransactionIntent(trimmedInput);
    if (intentResult.isTransactionIntent && intentResult.confidence >= 0.6) {
      await processTextInput(intentResult.cleanedText, true);
      return;
    }

    // Chat normal
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await chatWithNixAI(trimmedInput, transactions, conversationHistory);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Ops, tive um probleminha.  Tenta de novo?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isCentered = messages.length === 0 && !pendingTransaction && !pendingBatch;

  const renderInputBar = (centered: boolean) => (
    <motion.div
      layoutId="input-bar"
      initial={false}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        width: "100%",
        maxWidth: centered ? 830 : 830,
        margin: "0 auto",
      }}
    >
      <AnimatePresence>
        {isRecording && (
          <MotionPaper
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              p: 1.5,
              mb: 2,
              borderRadius: "16px",
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "error.main",
                animation: `${pulseAnimation} 1.5s infinite`,
              }}
            />
            <Typography variant="body1" fontWeight={600} color="error.main">
              Gravando {formatTime(recordingTime)}
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              sx={{ borderRadius: "12px", fontWeight: 600, textTransform: "none", px: 2 }}
            >
              Parar
            </Button>
          </MotionPaper>
        )}
      </AnimatePresence>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: isDarkMode ? "#1E1F20" : "#F0F4F9",
          borderRadius: "28px",
          border: isDarkMode ? `1px solid ${alpha("#FFFFFF", 0.05)}` : `1px solid ${alpha("#000000", 0.05)}`,
          boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.05)",
          py: 1.25,
          px: 2.5,
          transition: "all 0.3s ease",
          "&:focus-within": {
            boxShadow: isDarkMode 
              ? `0 8px 32px ${alpha(NIX_BRAND.purple, 0.2)}` 
              : `0 8px 32px ${alpha(NIX_BRAND.purple, 0.1)}`,
            bgcolor: isDarkMode ? "#1E1F20" : "#F0F4F9",
          }
        }}
      >
        <Tooltip title="Anexar arquivo ou foto">
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isRecording}
            sx={{ color: "text.secondary", mr: 1 }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>

        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={8}
          placeholder={
            isRecording ? "Gravando áudio..." : "Pergunte à IA ou descreva seus gastos..."
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || isRecording}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "1.05rem",
              lineHeight: 1.5,
              color: isDarkMode ? "#E3E3E3" : "#1F1F1F",
            }
          }}
        />

        <Stack direction="row" spacing={0.5} sx={{ ml: 1, alignItems: 'center' }}>
          {!inputValue.trim() && (
            <Tooltip title="Gravar áudio">
              <IconButton
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                disabled={isLoading}
                sx={{
                  bgcolor: isRecording ? alpha(theme.palette.error.main, 0.1) : "transparent",
                  color: isRecording ? "error.main" : "text.secondary",
                  transition: "all 0.2s ease",
                }}
              >
                {isRecording ? <StopIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
          )}

          <AnimatePresence>
            {inputValue.trim() && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <IconButton
                  onClick={handleSendMessage}
                  disabled={isLoading || isRecording}
                  sx={{
                    bgcolor: isDarkMode ? "#E3E3E3" : "#1F1F1F",
                    color: isDarkMode ? "#1F1F1F" : "#FFFFFF",
                    "&:hover": {
                      bgcolor: isDarkMode ? alpha("#E3E3E3", 0.8) : alpha("#1F1F1F", 0.8),
                    },
                    width: 42,
                    height: 42,
                    ml: 1,
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </Box>
    </motion.div>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flex: 1,
        minHeight: 0,
        maxWidth: "100%",
        mx: "auto",
        width: "100%",
        overflow: "hidden",
        position: 'relative',
      }}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,.csv,.ofx,.qfx"
        ref={fileInputRef}
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {/* Header removido conforme solicitado */}

      {/* Área principal */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          position: 'relative',
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(NIX_BRAND.purple, 0.2),
            borderRadius: 3,
          },
        }}
      >
        <AnimatePresence mode="wait">
          {isCentered ? (
            <MotionBox
              key="centered-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                width: "100%",
                minHeight: '100%',
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  maxWidth: 830,
                  px: isMobile ? 2 : 2,
                }}
              >
                <Box sx={{ textAlign: 'center', width: '100%', mb: 5 }}>
                  <Typography 
                    variant={isMobile ? "h4" : "h3"}
                    component={motion.h1}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ 
                      fontWeight: 600, 
                      background: 'linear-gradient(90deg, #4A90E2, #A855F7, #EC4899)', 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Olá{firstName ? `, ${firstName}` : ','}
                  </Typography>
                  <Typography 
                    variant={isMobile ? "h4" : "h3"}
                    component={motion.h2}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    sx={{ 
                      fontWeight: 600, 
                      color: isDarkMode ? '#FFFFFF' : '#1F1F1F',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Como posso ajudar hoje?
                  </Typography>
                </Box>

                {renderInputBar(true)}

                <MotionBox 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1.5, 
                    justifyContent: 'center', 
                    mt: 4,
                    width: "100%",
                  }}
                >
                  {SUGGESTIONS.map((s, i) => (
                    <Chip
                      key={i}
                      icon={s.icon}
                      label={s.label}
                      onClick={s.action}
                      sx={{
                        borderRadius: '24px',
                        px: 1,
                        py: 2.5,
                        bgcolor: isDarkMode ? "#1E1F20" : "#F0F4F9",
                        color: isDarkMode ? "#E3E3E3" : "#1F1F1F",
                        border: 'none',
                        fontSize: isMobile ? '0.85rem' : '0.95rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isDarkMode ? "#333537" : "#E2E7ED",
                          transform: 'translateY(-2px)',
                        },
                        '& .MuiChip-icon': {
                          color: isDarkMode ? '#E3E3E3' : '#1F1F1F',
                        }
                      }}
                    />
                  ))}
                </MotionBox>
              </Box>
            </MotionBox>
          ) : (
            <MotionBox
              key="chat-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: isMobile ? 2 : 4, pt: 3, pb: 4, maxWidth: 900, mx: 'auto', width: '100%' }}>
                {/* Título gerado pela IA */}
                {chatTitle && (
                  <MotionBox
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ 
                      textAlign: 'center', 
                      mb: 4, 
                      mt: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        background: NIX_BRAND.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 8px 16px ${alpha(NIX_BRAND.purple, 0.25)}`,
                        mb: 2
                      }}
                    >
                      <SparklesIcon sx={{ fontSize: 20, color: "#fff" }} />
                    </Box>
                    <Typography 
                      variant="h5" 
                      fontWeight={700} 
                      sx={{ 
                        color: isDarkMode ? "#fff" : "#1F1F1F",
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {chatTitle}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 500 }}>
                      Sessão de Inteligência Artificial
                    </Typography>
                  </MotionBox>
                )}

                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} isMobile={isMobile} />
                ))}

                {/* Preview de transação pendente */}
                <AnimatePresence>
                  {pendingTransaction && onTransactionCreate && (
                    <Box sx={{ mt: 2 }}>
                      <TransactionPreviewCard
                        transaction={pendingTransaction}
                        categories={categories}
                        paymentMethods={paymentMethods}
                        onConfirm={handleConfirmTransaction}
                        onCancel={handleCancelTransaction}
                      />
                    </Box>
                  )}
                </AnimatePresence>

                {/* Tabela de lote */}
                <AnimatePresence>
                  {pendingBatch && pendingBatch.length > 0 && onTransactionCreate && (
                    <Box sx={{ mt: 2 }}>
                      <BatchTransactionTable
                        transactions={pendingBatch}
                        categories={categories}
                        paymentMethods={paymentMethods}
                        onConfirmAll={handleConfirmBatch}
                        onCancel={handleCancelBatch}
                        getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
                        getPaymentMethodConfig={getPaymentMethodConfig}
                      />
                    </Box>
                  )}
                </AnimatePresence>

                {/* Loading */}
                <AnimatePresence>
                  {isLoading && (
                    <Box sx={{ mt: 2 }}>
                      <NixAISkeleton />
                    </Box>
                  )}
                </AnimatePresence>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Box>

      {/* Barra de input na parte inferior quando não centralizado */}
      <AnimatePresence>
        {!isCentered && (
          <MotionBox
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            sx={{
              pt: 2,
              pb: isMobile ? 2 : 3,
              px: isMobile ? 2 : 4,
              borderTop: "none",
              flexShrink: 0,
              width: '100%',
              maxWidth: 900,
              mx: 'auto',
              bgcolor: 'background.default',
              zIndex: 5,
            }}
          >
            {renderInputBar(false)}
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: "block", textAlign: "center", mt: 1.5, fontSize: 11 }}
            >
              O Finance Control pode cometer erros. Considere verificar informações importantes.
            </Typography>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default NixAIView;
