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
  InputAdornment,
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
  Slider,
} from "@mui/material";
import {
  Send as SendIcon,
  AutoAwesome as SparklesIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Savings as SavingsIcon,
  Receipt as ReceiptIcon,
  PieChart as PieChartIcon,
  Lightbulb as LightbulbIcon,
  CalendarMonth as CalendarIcon,
  Mic as MicIcon,
  PhotoCamera as CameraIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  CreditCard as PaymentIcon,
  Today as DateIcon,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction, ParsedTransaction, SmartInputMode, TransactionType } from "../types";
import {
  chatWithNixAI,
  parseTransactionFromText,
  parseTransactionFromAudio,
  parseTransactionFromImage,
  detectTransactionIntent,
} from "../services/geminiService";

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

// Sugestões de perguntas pré-definidas
const SUGGESTED_QUESTIONS = [
  { icon: <TrendingUpIcon sx={{ fontSize: 16 }} />, text: "Como estão meus gastos este mês?", color: NIX_BRAND.purple },
  { icon: <SavingsIcon sx={{ fontSize: 16 }} />, text: "Onde posso economizar dinheiro?", color: NIX_BRAND.success },
  { icon: <ReceiptIcon sx={{ fontSize: 16 }} />, text: "Qual minha maior despesa?", color: NIX_BRAND.error },
  { icon: <PieChartIcon sx={{ fontSize: 16 }} />, text: "Analise meus gastos por categoria", color: NIX_BRAND.purpleLight },
  { icon: <LightbulbIcon sx={{ fontSize: 16 }} />, text: "Dicas para melhorar minhas finanças", color: NIX_BRAND.teal },
  { icon: <CalendarIcon sx={{ fontSize: 16 }} />, text: "Compare com o mês anterior", color: NIX_BRAND.purpleDark },
];

// Ações de cadastro inteligente
const SMART_INPUT_ACTIONS = [
  { icon: <AddIcon sx={{ fontSize: 16 }} />, text: "Cadastrar por texto", color: NIX_BRAND.purple, mode: "text" as SmartInputMode },
  { icon: <MicIcon sx={{ fontSize: 16 }} />, text: "Cadastrar por áudio", color: NIX_BRAND.purpleLight, mode: "audio" as SmartInputMode },
  { icon: <CameraIcon sx={{ fontSize: 16 }} />, text: "Foto de recibo", color: NIX_BRAND.teal, mode: "image" as SmartInputMode },
];

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
  onTransactionCreate?: (transaction: Omit<ParsedTransaction, "confidence" | "rawInput">) => void;
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
          💸 Despesa
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
          💰 Receita
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
        💡 Clique nos campos para ajustar antes de confirmar
      </Typography>
    </MotionPaper>
  );
};

// Componente de Mensagem
interface ChatMessageProps {
  message: Message;
  isMobile: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMobile }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isUser = message.role === "user";

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
          width: 36,
          height: 36,
          background: isUser
            ? isDarkMode
              ? alpha("#FFFFFF", 0.1)
              : alpha("#000000", 0.08)
            : NIX_BRAND.gradient,
          color: isUser ? "text.primary" : "#FFFFFF",
          boxShadow: isUser ? "none" : `0 4px 16px ${alpha(NIX_BRAND.purple, 0.35)}`,
          transition: "all 0.2s ease",
        }}
      >
        {isUser ? <PersonIcon sx={{ fontSize: 18 }} /> : <SparklesIcon sx={{ fontSize: 18 }} />}
      </Avatar>

      {/* Bolha de mensagem */}
      <Box
        sx={{
          maxWidth: isMobile ? "80%" : "65%",
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        <Box
          sx={{
            py: 1.5,
            px: 2,
            borderRadius: "18px",
            borderTopRightRadius: isUser ? "4px" : "18px",
            borderTopLeftRadius: isUser ? "18px" : "4px",
            bgcolor: isUser
              ? NIX_BRAND.purple
              : isDarkMode
              ? alpha("#FFFFFF", 0.08)
              : alpha("#000000", 0.04),
            color: isUser ? "#FFFFFF" : "text.primary",
            boxShadow: isUser
              ? `0 4px 16px ${alpha(NIX_BRAND.purple, 0.25)}`
              : "none",
            // Markdown styles
            "& p": { m: 0, mb: 0.75, fontSize: 14, lineHeight: 1.6 },
            "& p:last-child": { mb: 0 },
            "& ul, & ol": { m: 0, pl: 2.5, mb: 0.75 },
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

// Componente de Sugestões
interface SuggestionsProps {
  onSmartInput: (mode: SmartInputMode) => void;
  onQuestionClick: (text: string) => void;
}

const Suggestions: React.FC<SuggestionsProps> = ({ onSmartInput, onQuestionClick }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: "8px",
          bgcolor: alpha(NIX_BRAND.purple, 0.1),
          color: NIX_BRAND.purple,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          fontSize: 11,
        }}
      >
        {title}
      </Typography>
    </Box>
  );

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
    >
      {/* Cadastro Inteligente */}
      <Box>
        <SectionTitle icon={<SparklesIcon sx={{ fontSize: 14 }} />} title="Cadastro Inteligente" />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {SMART_INPUT_ACTIONS.map((action, index) => (
            <MotionBox key={index} variants={itemVariants}>
              <Chip
                icon={action.icon}
                label={action.text}
                onClick={() => onSmartInput(action.mode)}
                sx={{
                  px: 1.5,
                  py: 2.5,
                  borderRadius: "14px",
                  fontSize: 13,
                  fontWeight: 600,
                  bgcolor: isDarkMode ? alpha(action.color, 0.12) : alpha(action.color, 0.08),
                  color: action.color,
                  border: `1.5px solid ${alpha(action.color, 0.2)}`,
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "& .MuiChip-icon": { color: action.color },
                  "&:hover": {
                    bgcolor: alpha(action.color, 0.18),
                    transform: "translateY(-3px)",
                    boxShadow: `0 8px 24px ${alpha(action.color, 0.25)}`,
                  },
                  "&:active": { transform: "translateY(-1px)" },
                }}
              />
            </MotionBox>
          ))}
        </Box>
      </Box>

      {/* Perguntas Sugeridas */}
      <Box>
        <SectionTitle icon={<LightbulbIcon sx={{ fontSize: 14 }} />} title="Perguntas Sugeridas" />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {SUGGESTED_QUESTIONS.map((suggestion, index) => (
            <MotionBox key={index} variants={itemVariants}>
              <Chip
                icon={suggestion.icon}
                label={suggestion.text}
                onClick={() => onQuestionClick(suggestion.text)}
                sx={{
                  px: 1.5,
                  py: 2.5,
                  borderRadius: "14px",
                  fontSize: 13,
                  fontWeight: 500,
                  bgcolor: isDarkMode ? alpha(suggestion.color, 0.1) : alpha(suggestion.color, 0.06),
                  color: suggestion.color,
                  border: `1px solid ${alpha(suggestion.color, 0.15)}`,
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "& .MuiChip-icon": { color: suggestion.color },
                  "&:hover": {
                    bgcolor: alpha(suggestion.color, 0.15),
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${alpha(suggestion.color, 0.2)}`,
                  },
                }}
              />
            </MotionBox>
          ))}
        </Box>
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
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  // Mensagem de boas-vindas
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "E aí! Sou o **Nix**, seu copiloto financeiro. 🧠💰\n\nEstou aqui pra traduzir o \"financês\" pro português claro. Sem letras miúdas, sem jargões complicados.\n\nPosso te ajudar com:\n\n- 📊 **Analisar seus gastos** e mostrar onde seu dinheiro está indo\n- 💡 **Dar dicas personalizadas** baseadas nos seus hábitos\n- 🔮 **Prever gastos futuros** e evitar surpresas no fim do mês\n- ⚡ **Cadastrar transações** rapidinho por texto, áudio ou foto\n\nO que você quer saber sobre suas finanças?",
      timestamp: new Date(),
    },
  ]);
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

  // Estado para transação pendente
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null);
  const [smartInputError, setSmartInputError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingTransaction]);

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
        const result = await parseTransactionFromText(text, categories, paymentMethods);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Entendi! Dá uma conferida nos dados abaixo e confirma pra eu salvar:",
          timestamp: new Date(),
          parsedTransaction: result,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setPendingTransaction(result);
      } catch (error) {
        console.error("Error parsing text:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Ops, não consegui entender os detalhes. 🤔\n\nTenta algo como: \"Gastei 50 reais no mercado com Pix\"",
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

  const processAudioInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    setSmartInputError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `🎤 Mensagem de voz (${formatTime(recordingTime)})`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await parseTransactionFromAudio(audioBlob, categories, paymentMethods);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entendi o áudio! Confere se tá tudo certo:",
        timestamp: new Date(),
        parsedTransaction: result,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setPendingTransaction(result);
    } catch (error) {
      console.error("Error parsing audio:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Não consegui entender o áudio. 🎤\n\nTenta falar mais devagar: \"Gastei cinquenta reais no Uber\"",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setRecordingTime(0);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setSmartInputError("Imagem muito grande. Máximo 4MB.");
      return;
    }

    setIsLoading(true);
    setSmartInputError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "📷 Foto de recibo enviada",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageBase64 = e.target?.result as string;

        const result = await parseTransactionFromImage(imageBase64, file.type, categories, paymentMethods);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Li o recibo! Confere os dados:",
          timestamp: new Date(),
          parsedTransaction: result,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setPendingTransaction(result);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error parsing image:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Não consegui ler a imagem. 📷\n\nTenta tirar uma foto com mais luz e o recibo bem reto.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmTransaction = (transaction: Omit<ParsedTransaction, "confidence" | "rawInput">) => {
    if (!onTransactionCreate) return;

    onTransactionCreate(transaction);

    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "✅ **Pronto!** Transação salva. Posso ajudar com mais alguma coisa?",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
    setPendingTransaction(null);
  };

  const handleCancelTransaction = () => {
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sem problemas! Cancelei essa. Me avisa se precisar de algo. 👍",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
    setPendingTransaction(null);
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
        content: "Ops, tive um probleminha. 😅 Tenta de novo?",
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

  const handleSuggestionClick = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatWithNixAI(
        text,
        transactions,
        messages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content }))
      );
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Ops, algo deu errado. 😅 Tenta de novo?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuggestions = messages.length === 1 && messages[0].id === "welcome" && !pendingTransaction;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: isMobile ? "calc(100vh - 140px)" : "calc(100vh - 100px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: isMobile ? 2 : 3,
          pt: 2,
          pb: 16,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} isMobile={isMobile} />
          ))}
        </AnimatePresence>

        {/* Sugestões iniciais */}
        {showSuggestions && !isLoading && (
          <Suggestions onSmartInput={handleSmartInputAction} onQuestionClick={handleSuggestionClick} />
        )}

        {/* Preview de transação pendente */}
        <AnimatePresence>
          {pendingTransaction && onTransactionCreate && (
            <TransactionPreviewCard
              transaction={pendingTransaction}
              categories={categories}
              paymentMethods={paymentMethods}
              onConfirm={handleConfirmTransaction}
              onCancel={handleCancelTransaction}
            />
          )}
        </AnimatePresence>

        {/* Erro */}
        <Collapse in={!!smartInputError}>
          <Alert
            severity="error"
            onClose={() => setSmartInputError(null)}
            sx={{ borderRadius: "14px", mb: 2 }}
          >
            {smartInputError}
          </Alert>
        </Collapse>

        {/* Typing indicator */}
        <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>

        <div ref={messagesEndRef} />
      </Box>

      {/* Gradient overlay */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 140,
          background: isDarkMode
            ? "linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(15, 23, 42, 0) 100%)"
            : "linear-gradient(to top, rgba(248, 250, 252, 1) 0%, rgba(248, 250, 252, 0.98) 50%, rgba(248, 250, 252, 0) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Input Area */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          px: isMobile ? 2 : 3,
          pb: isMobile ? 2 : 2.5,
          pt: 1,
          zIndex: 2,
        }}
      >
        <Box sx={{ maxWidth: 720, mx: "auto" }}>
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />

          {/* Recording indicator */}
          <AnimatePresence>
            {isRecording && (
              <MotionPaper
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: "14px",
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "error.main",
                    animation: `${pulseAnimation} 1.5s infinite`,
                  }}
                />
                <Typography variant="body2" fontWeight={600} color="error.main">
                  Gravando {formatTime(recordingTime)}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<StopIcon />}
                  onClick={stopRecording}
                  sx={{ borderRadius: "10px", fontWeight: 600, textTransform: "none" }}
                >
                  Parar
                </Button>
              </MotionPaper>
            )}
          </AnimatePresence>

          {/* Main input */}
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isRecording}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.5, gap: 0.5 }}>
                  <Tooltip title="Gravar áudio">
                    <IconButton
                      onClick={() => (isRecording ? stopRecording() : startRecording())}
                      disabled={isLoading}
                      size="small"
                      sx={{
                        bgcolor: isRecording ? alpha(theme.palette.error.main, 0.1) : "transparent",
                        color: isRecording ? "error.main" : "text.secondary",
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}
                    >
                      {isRecording ? <StopIcon fontSize="small" /> : <MicIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Enviar foto">
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isRecording}
                      size="small"
                      sx={{
                        color: "text.secondary",
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}
                    >
                      <CameraIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || isRecording}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: inputValue.trim() ? NIX_BRAND.purple : "transparent",
                      color: inputValue.trim() ? "#FFFFFF" : "text.disabled",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: inputValue.trim() ? NIX_BRAND.purpleDark : "transparent",
                      },
                    }}
                  >
                    <SendIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: "16px",
                bgcolor: isDarkMode ? alpha("#FFFFFF", 0.05) : "#FFFFFF",
                boxShadow: isDarkMode
                  ? `0 2px 16px ${alpha("#000000", 0.3)}`
                  : `0 2px 16px ${alpha("#000000", 0.08)}`,
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                "& fieldset": { border: "none" },
                py: 0.5,
              },
            }}
          />

          {/* Hint */}
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: "block", textAlign: "center", mt: 1, fontSize: 11 }}
          >
            Diga algo como "gastei 50 no Uber" e o Nix entende automaticamente
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default NixAIView;
