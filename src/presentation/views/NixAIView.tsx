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
import NixAISkeleton from "@/presentation/components/skeletons/NixAISkeleton";
import BatchTransactionTable, {
  EditableBatchRow,
} from "@/presentation/forms/BatchTransactionTable";
import { Transaction, ParsedTransaction, SmartInputMode, TransactionType } from "@/domain/entities";
import {
  chatWithNixAI,
  parseBatchFromText,
  parseBatchFromAudio,
  parseBatchFromImage,
  detectTransactionIntent,
  isGeminiConfigured,
  GEMINI_NOT_CONFIGURED_MESSAGE,
  generateChatTitle,
} from "@/infrastructure/ai/geminiService";
import { useConfirmDialog } from "@/presentation/contexts";
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
  getPaymentMethodPaymentDay?: (method: string) => number | undefined;
  getPaymentMethodConfig?: (method: string) => import("@/domain/entities").PaymentMethodConfig | undefined;
  displayName?: string;
}

// ============================================
// Sub-componentes
// ============================================

// Componente de Timestamp formatado
const MessageTimestamp: React.FC<{ date: Date }> = ({ date }) => {
  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
            Identified Transaction
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${Math.round(transaction.confidence * 100)}% confidence`}
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
            Expense
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
            Income
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
              {amount ? `R$ ${parseFloat(amount).toFixed(2)}` : "Value not identified"}
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
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
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
          Cancel
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
          Confirm
        </Button>
      </Box>

      {/* Dica de edição */}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: "block", textAlign: "center", mt: 1.5 }}
      >
         Click on fields to edit before confirming
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
    { icon: <AttachFileIcon fontSize="small" />, label: "Import file", action: () => fileInputRef.current?.click() },
    { 
      icon: <TextFieldsIcon fontSize="small" />, 
      label: "Type transactions", 
      action: () => {
        setIsBatchMode(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } 
    },
  ];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);
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
            content: "Understood! Please check the details below and confirm to save:",
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
            content: `I identified **${batch.length} transactions**. Check the table, edit if needed, and confirm to save them all:`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setPendingBatch(batch);
          setPendingTransaction(null);
        }
      } catch (error: any) {
        console.error("Error parsing text:", error);
        
        let content = "Oops, I couldn't understand the details. \n\nTry something like: \"Spent 50 dollars at the supermarket with Debit Card\"";
        
        if (error?.code === "GEMINI_QUOTA_EXCEEDED") {
          content = "⚠️ **Gemini Quota Exceeded**\n\nThe free requests quota for Gemini was temporarily exhausted (Error 429). Please wait a few minutes before trying again.\n\nIf you use your own key, check your limits on [Google AI Studio](https://aistudio.google.com/).";
        } else if (error?.code === "GEMINI_INVALID_KEY") {
          content = "🔑 **Invalid Gemini API Key**\n\nThe API key configured in the `.env` file is invalid or has been revoked (Error 400/403).\n\nPlease verify that the `GEMINI_API_KEY` variable in your `.env` file is correct and active.";
        } else if (error?.code === "GEMINI_NOT_CONFIGURED" || error?.message === "GEMINI_NOT_CONFIGURED") {
          content = `⚙️ **Gemini API Key not configured**\n\n${GEMINI_NOT_CONFIGURED_MESSAGE}`;
        }
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content,
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
      setSmartInputError("Could not access the microphone. Check your permissions.");
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
        content: `File imported: ${file.name}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const text = await file.text();
        const rows = import("@/infrastructure/export/importService").then(m => m.parseImportFile(text, file.name));
        const resolvedRows = await rows;
        
        if (resolvedRows.length === 0) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "No transactions found in the file. Check the format.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          const batch: ParsedTransaction[] = resolvedRows.map((row) => ({
            description: row.description,
            amount: row.amount,
            type: row.type,
            category: row.type === "income" ? (categories.income[0] || "Other") : (categories.expense[0] || "Other"),
            paymentMethod: paymentMethods[0] || "",
            date: row.date || new Date().toISOString().split("T")[0],
            confidence: 1,
            rawInput: "Imported from file",
          }));
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I identified **${batch.length} transactions** in the file. Check the table and confirm:`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setPendingBatch(batch);
          setPendingTransaction(null);
        }
      } catch (err) {
        console.error(err);
        setSmartInputError("Error processing the file. Check the format.");
      } finally {
        setIsLoading(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Image logic
    if (file.size > 4 * 1024 * 1024) {
      setSmartInputError("Image too large. Maximum 4MB.");
      return;
    }
    setIsLoading(true);
    setSmartInputError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Photo sent: ${file.name}`,
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
              content: "I read the receipt! Check the details:",
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
              content: `I read **${batch.length} transactions** from the photo. Check and confirm:`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setPendingBatch(batch);
            setPendingTransaction(null);
          }
        } catch (err: any) {
          console.error(err);
          
          let content = "Could not read the image. Try another photo with good lighting.";
          
          if (err?.code === "GEMINI_QUOTA_EXCEEDED") {
            content = "⚠️ **Gemini Quota Exceeded**\n\nThe free requests quota for Gemini was temporarily exhausted (Error 429). Please wait a few minutes before trying again.\n\nIf you use your own key, check your limits on [Google AI Studio](https://aistudio.google.com/).";
          } else if (err?.code === "GEMINI_INVALID_KEY") {
            content = "🔑 **Invalid Gemini API Key**\n\nThe API key configured in the `.env` file is invalid or has been revoked (Error 400/403).\n\nPlease verify that the `GEMINI_API_KEY` variable in your `.env` file is correct and active.";
          } else if (err?.code === "GEMINI_NOT_CONFIGURED" || err?.message === "GEMINI_NOT_CONFIGURED") {
            content = `⚙️ **Gemini API Key not configured**\n\n${GEMINI_NOT_CONFIGURED_MESSAGE}`;
          }

          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setSmartInputError(content);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setSmartInputError("Error processing the image.");
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
      content: ` Voice message (${formatTime(recordingTime)})`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const batch = await parseBatchFromAudio(audioBlob, categories, paymentMethods);

      if (batch.length === 1) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I understood the audio! Check if everything is correct:",
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
          content: `I identified **${batch.length} transactions** in the audio. Check the table, edit if needed, and confirm:`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setPendingBatch(batch);
        setPendingTransaction(null);
      }
    } catch (error: any) {
      console.error("Error parsing audio:", error);
      
      let content = "I couldn't understand the audio. \n\nTry speaking slower: \"Spent fifty dollars on Uber\"";
      
      if (error?.code === "GEMINI_QUOTA_EXCEEDED") {
        content = "⚠️ **Gemini Quota Exceeded**\n\nThe free requests quota for Gemini was temporarily exhausted (Error 429). Please wait a few minutes before trying again.\n\nIf you use your own key, check your limits on [Google AI Studio](https://aistudio.google.com/).";
      } else if (error?.code === "GEMINI_INVALID_KEY") {
        content = "🔑 **Invalid Gemini API Key**\n\nThe API key configured in the `.env` file is invalid or has been revoked (Error 400/403).\n\nPlease verify that the `GEMINI_API_KEY` variable in your `.env` file is correct and active.";
      } else if (error?.code === "GEMINI_NOT_CONFIGURED" || error?.message === "GEMINI_NOT_CONFIGURED") {
        content = `⚙️ **Gemini API Key not configured**\n\n${GEMINI_NOT_CONFIGURED_MESSAGE}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
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
      content: " **Done!** Transaction saved. Can I help you with anything else?",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
    setPendingTransaction(null);
  };

  const handleCancelTransaction = () => {
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "No problem! I cancelled this one. Let me know if you need anything. ",
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
      content: ` **Done!** ${rows.length} transaction(s) saved. Can I help with anything else?`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
    setPendingBatch(null);
  };

  const handleCancelBatch = async () => {
    const count = pendingBatch?.length ?? 0;
    const confirmed = await confirm({
      title: "Discard batch",
      message: `Are you sure you want to discard ${count} pending transaction(s)? They will not be saved.`,
      confirmText: "Discard",
      cancelText: "Continue editing",
      variant: "warning",
    });
    if (!confirmed) return;

    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "No problem! I cancelled the batch. Let me know if you need anything. ",
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

    // Se o Modo Lote estiver ativo, ignora a detecção automática e força o processamento
    if (isBatchMode) {
      await processTextInput(trimmedInput, true);
      return;
    }

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
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      let content = "Oops, I had a little problem. Try again?";
      
      if (error?.code === "GEMINI_QUOTA_EXCEEDED") {
        content = "⚠️ **Gemini Quota Exceeded**\n\nThe free requests quota for Gemini was temporarily exhausted (Error 429). Please wait a few minutes before trying again.\n\nIf you use your own key, check your limits on [Google AI Studio](https://aistudio.google.com/).";
      } else if (error?.code === "GEMINI_INVALID_KEY") {
        content = "🔑 **Invalid Gemini API Key**\n\nThe API key configured in the `.env` file is invalid or has been revoked (Error 400/403).\n\nPlease verify that the `GEMINI_API_KEY` variable in your `.env` file is correct and active.";
      } else if (error?.code === "GEMINI_NOT_CONFIGURED" || error?.message === "GEMINI_NOT_CONFIGURED") {
        content = `⚙️ **Gemini API Key not configured**\n\n${GEMINI_NOT_CONFIGURED_MESSAGE}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
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
      {/* Seletor de Modo: Conversar vs Cadastro em Lote */}
      <Box 
        sx={{ 
          display: "flex", 
          justifyContent: "center", 
          mb: 2, 
          gap: 1.5,
          flexWrap: "wrap"
        }}
      >
        <Chip
          icon={<SparklesIcon sx={{ fontSize: 16 }} />}
          label="Chat with AI"
          onClick={() => setIsBatchMode(false)}
          sx={{
            borderRadius: "20px",
            px: 1.5,
            py: 2.2,
            fontWeight: 600,
            fontSize: "0.85rem",
            bgcolor: !isBatchMode 
              ? alpha(NIX_BRAND.purple, 0.15) 
              : isDarkMode ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02),
            color: !isBatchMode 
              ? (isDarkMode ? "#E2E8F0" : NIX_BRAND.purple) 
              : "text.secondary",
            border: `1px solid ${!isBatchMode ? alpha(NIX_BRAND.purple, 0.4) : isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.05)}`,
            boxShadow: !isBatchMode ? `0 4px 12px ${alpha(NIX_BRAND.purple, 0.15)}` : "none",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            "&:hover": {
              bgcolor: !isBatchMode 
                ? alpha(NIX_BRAND.purple, 0.22) 
                : isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.05),
              transform: "translateY(-1px)",
            }
          }}
        />
        <Chip
          icon={<ReceiptIcon sx={{ fontSize: 16 }} />}
          label="Batch Registration"
          onClick={() => setIsBatchMode(true)}
          sx={{
            borderRadius: "20px",
            px: 1.5,
            py: 2.2,
            fontWeight: 600,
            fontSize: "0.85rem",
            bgcolor: isBatchMode 
              ? alpha(NIX_BRAND.purple, 0.18) 
              : isDarkMode ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02),
            color: isBatchMode 
              ? (isDarkMode ? "#FFFFFF" : NIX_BRAND.purple) 
              : "text.secondary",
            border: `1px solid ${isBatchMode ? alpha(NIX_BRAND.purple, 0.55) : isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.05)}`,
            boxShadow: isBatchMode ? `0 4px 16px ${alpha(NIX_BRAND.purple, 0.35)}` : "none",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            "&:hover": {
              bgcolor: isBatchMode 
                ? alpha(NIX_BRAND.purple, 0.25) 
                : isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.05),
              transform: "translateY(-1px)",
            }
          }}
        />
      </Box>

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
              Recording {formatTime(recordingTime)}
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              sx={{ borderRadius: "12px", fontWeight: 600, textTransform: "none", px: 2 }}
            >
              Stop
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
          border: isBatchMode
            ? `1.5px solid ${alpha(NIX_BRAND.purple, 0.6)}`
            : isDarkMode ? `1px solid ${alpha("#FFFFFF", 0.05)}` : `1px solid ${alpha("#000000", 0.05)}`,
          boxShadow: isBatchMode
            ? `0 4px 20px ${alpha(NIX_BRAND.purple, 0.25)}`
            : isDarkMode ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.05)",
          py: 1.25,
          px: 2.5,
          transition: "all 0.3s ease",
          "&:focus-within": {
            boxShadow: isBatchMode
              ? `0 8px 32px ${alpha(NIX_BRAND.purple, 0.35)}`
              : isDarkMode 
                ? `0 8px 32px ${alpha(NIX_BRAND.purple, 0.2)}` 
                : `0 8px 32px ${alpha(NIX_BRAND.purple, 0.1)}`,
            bgcolor: isDarkMode ? "#1E1F20" : "#F0F4F9",
          }
        }}
      >
        <Tooltip title="Attach file or photo">
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
            isRecording 
              ? "Recording audio..." 
              : isBatchMode
                ? "Batch Mode: Paste or type your multiple transactions here..."
                : "Ask the AI or describe your transactions..."
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
            <Tooltip title="Record audio">
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
        px: { xs: 0, md: "28px" },
        pt: { xs: 0, md: "16px" },
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
          ...(isCentered && {
            height: "100%",
            justifyContent: "center",
          }),
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
                    Hello{firstName ? `, ${firstName}` : ','}
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
                    How can I help today?
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
                      Artificial Intelligence Session
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
              Finance Control may make mistakes. Consider checking important info.
            </Typography>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default NixAIView;
