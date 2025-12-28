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
  Divider,
  Collapse,
  Alert,
  keyframes,
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
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { Transaction, ParsedTransaction, SmartInputMode, TransactionType } from "../types";
import {
  chatWithNixAI,
  parseTransactionFromText,
  parseTransactionFromAudio,
  parseTransactionFromImage,
} from "../services/geminiService";

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

// Sugestões de perguntas pré-definidas
const SUGGESTED_QUESTIONS = [
  {
    icon: <TrendingUpIcon sx={{ fontSize: 16 }} />,
    text: "Como estão meus gastos este mês?",
    color: "#6366f1",
  },
  {
    icon: <SavingsIcon sx={{ fontSize: 16 }} />,
    text: "Onde posso economizar dinheiro?",
    color: "#10b981",
  },
  {
    icon: <ReceiptIcon sx={{ fontSize: 16 }} />,
    text: "Qual minha maior despesa?",
    color: "#ef4444",
  },
  {
    icon: <PieChartIcon sx={{ fontSize: 16 }} />,
    text: "Analise meus gastos por categoria",
    color: "#8b5cf6",
  },
  {
    icon: <LightbulbIcon sx={{ fontSize: 16 }} />,
    text: "Dicas para melhorar minhas finanças",
    color: "#f59e0b",
  },
  {
    icon: <CalendarIcon sx={{ fontSize: 16 }} />,
    text: "Compare com o mês anterior",
    color: "#06b6d4",
  },
];

// Ações rápidas de cadastro inteligente
const SMART_INPUT_ACTIONS = [
  {
    icon: <AddIcon sx={{ fontSize: 16 }} />,
    text: "Cadastrar despesa por texto",
    color: "#6366f1",
    mode: "text" as SmartInputMode,
  },
  {
    icon: <MicIcon sx={{ fontSize: 16 }} />,
    text: "Cadastrar por áudio",
    color: "#a855f7",
    mode: "audio" as SmartInputMode,
  },
  {
    icon: <CameraIcon sx={{ fontSize: 16 }} />,
    text: "Cadastrar por foto de recibo",
    color: "#0ea5e9",
    mode: "image" as SmartInputMode,
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  parsedTransaction?: ParsedTransaction; // Transação extraída pela IA
}

interface NixAIViewProps {
  transactions: Transaction[];
  categories?: { income: string[]; expense: string[] };
  paymentMethods?: string[];
  onTransactionCreate?: (transaction: Omit<ParsedTransaction, "confidence" | "rawInput">) => void;
}

const NixAIView: React.FC<NixAIViewProps> = ({
  transactions,
  categories = { income: ["Salary", "Other"], expense: ["Food", "Transportation", "Other"] },
  paymentMethods = ["Pix", "Credit Card", "Debit Card", "Cash"],
  onTransactionCreate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o **NixAI**, seu assistente financeiro pessoal. 🤖💰\n\nPosso ajudar você com:\n\n- **Analisar seus gastos**\n- **Dar recomendações de economia**\n- **Responder perguntas sobre suas finanças**\n- **Cadastrar transações por texto, áudio ou foto** 📝🎤📷\n\nComo posso ajudar hoje?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para upload de imagem
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para preview de transação extraída
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null);
  const [smartInputError, setSmartInputError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // ========================================
  // Funções de Smart Input
  // ========================================

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Processar texto para extrair transação
  const processTextInput = useCallback(async (text: string) => {
    setIsLoading(true);
    setSmartInputError(null);

    // Adiciona mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `📝 Cadastrar: "${text}"`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await parseTransactionFromText(text, categories, paymentMethods);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `✨ **Transação identificada!**\n\n` +
          `- **Descrição:** ${result.description}\n` +
          `- **Valor:** ${result.amount ? `R$ ${result.amount.toFixed(2)}` : "Não identificado"}\n` +
          `- **Tipo:** ${result.type === "income" ? "💰 Receita" : "💸 Despesa"}\n` +
          `- **Categoria:** ${result.category}\n` +
          `- **Pagamento:** ${result.paymentMethod}\n` +
          `- **Data:** ${result.date}\n\n` +
          `🎯 Confiança: ${Math.round(result.confidence * 100)}%`,
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
        content: "❌ Desculpe, não consegui extrair os dados da transação. Tente ser mais específico, incluindo valor, descrição e forma de pagamento.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [categories, paymentMethods]);

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

  // Parar gravação de áudio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Processar áudio
  const processAudioInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    setSmartInputError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `🎤 Cadastrar por áudio (${formatTime(recordingTime)})`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await parseTransactionFromAudio(audioBlob, categories, paymentMethods);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `✨ **Transação identificada do áudio!**\n\n` +
          `- **Descrição:** ${result.description}\n` +
          `- **Valor:** ${result.amount ? `R$ ${result.amount.toFixed(2)}` : "Não identificado"}\n` +
          `- **Tipo:** ${result.type === "income" ? "💰 Receita" : "💸 Despesa"}\n` +
          `- **Categoria:** ${result.category}\n` +
          `- **Pagamento:** ${result.paymentMethod}\n` +
          `- **Data:** ${result.date}\n\n` +
          `🎯 Confiança: ${Math.round(result.confidence * 100)}%`,
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
        content: "❌ Desculpe, não consegui processar o áudio. Tente falar mais claramente, incluindo valor e descrição.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setRecordingTime(0);
    }
  };

  // Processar imagem
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
      content: `📷 Cadastrar por foto de recibo`,
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
          content: `✨ **Transação identificada da imagem!**\n\n` +
            `- **Descrição:** ${result.description}\n` +
            `- **Valor:** ${result.amount ? `R$ ${result.amount.toFixed(2)}` : "Não identificado"}\n` +
            `- **Tipo:** ${result.type === "income" ? "💰 Receita" : "💸 Despesa"}\n` +
            `- **Categoria:** ${result.category}\n` +
            `- **Pagamento:** ${result.paymentMethod}\n` +
            `- **Data:** ${result.date}\n\n` +
            `🎯 Confiança: ${Math.round(result.confidence * 100)}%`,
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
        content: "❌ Desculpe, não consegui ler a imagem. Tente enviar uma foto mais clara do recibo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Confirmar transação
  const handleConfirmTransaction = () => {
    if (!pendingTransaction || !onTransactionCreate) return;

    onTransactionCreate({
      description: pendingTransaction.description,
      amount: pendingTransaction.amount,
      type: pendingTransaction.type,
      category: pendingTransaction.category,
      paymentMethod: pendingTransaction.paymentMethod,
      date: pendingTransaction.date,
    });

    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "✅ **Transação cadastrada com sucesso!** A despesa foi adicionada às suas transações.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
    setPendingTransaction(null);
  };

  // Cancelar transação pendente
  const handleCancelTransaction = () => {
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "🚫 Transação cancelada. Posso ajudar com mais alguma coisa?",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
    setPendingTransaction(null);
  };

  // Handler para ação de smart input
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
      // Foca no input de texto
      setInputValue("Cadastrar: ");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const trimmedInput = inputValue.trim();
    
    // Verifica se é um comando de cadastro inteligente
    const cadastrarMatch = trimmedInput.match(/^(?:cadastrar|registrar|adicionar|anotar)[:.]?\s*(.+)/i);
    if (cadastrarMatch && cadastrarMatch[1]) {
      setInputValue("");
      await processTextInput(cadastrarMatch[1]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await chatWithNixAI(
        trimmedInput,
        transactions,
        conversationHistory
      );

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
        content:
          "Desculpe, encontrei um erro ao processar sua solicitação. Tente novamente.",
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

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
    // Auto-send the suggestion
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    chatWithNixAI(
      text,
      transactions,
      messages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content }))
    )
      .then((response) => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
        setInputValue("");
      });
  };

  // Mostra sugestões apenas quando há apenas a mensagem de boas-vindas
  const showSuggestions = messages.length === 1 && messages[0].id === "welcome";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: isMobile ? "calc(100vh - 180px)" : "calc(100vh - 64px)",
        position: "relative",
        mx: isMobile ? -2 : -4,
        mt: isMobile ? -2 : -4,
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: isMobile ? 2 : 4,
          pt: isMobile ? 2 : 4,
          pb: 12,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: "flex",
              gap: 1.5,
              flexDirection: message.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor:
                  message.role === "assistant" ? "primary.main" : "grey.600",
                flexShrink: 0,
              }}
            >
              {message.role === "assistant" ? (
                <SparklesIcon sx={{ fontSize: 18 }} />
              ) : (
                <PersonIcon sx={{ fontSize: 18 }} />
              )}
            </Avatar>
            <Box
              sx={{
                maxWidth: isMobile ? "80%" : "70%",
                p: isMobile ? 1.5 : 2,
                borderRadius: "20px",
                bgcolor:
                  message.role === "user"
                    ? "primary.main"
                    : (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.04)",
                color: message.role === "user" ? "white" : "text.primary",
                "& p": {
                  m: 0,
                  mb: 1,
                  fontSize: isMobile ? 14 : 15,
                  lineHeight: 1.6,
                },
                "& p:last-child": { mb: 0 },
                "& ul, & ol": { m: 0, pl: 2.5, mb: 1 },
                "& ul:last-child, & ol:last-child": { mb: 0 },
                "& li": { mb: 0.5, fontSize: isMobile ? 14 : 15 },
                "& strong": { fontWeight: 600 },
                "& code": {
                  bgcolor:
                    message.role === "user"
                      ? "rgba(255,255,255,0.2)"
                      : "action.hover",
                  px: 0.75,
                  py: 0.25,
                  borderRadius: "20px",
                  fontSize: 13,
                },
              }}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <Typography sx={{ fontSize: isMobile ? 14 : 15 }}>
                  {message.content}
                </Typography>
              )}
            </Box>
          </Box>
        ))}

        {/* Sugestões de perguntas e ações de cadastro inteligente */}
        {showSuggestions && !isLoading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              mt: 2,
              mb: 3,
            }}
          >
            {/* Ações de Cadastro Inteligente */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 1.5,
                }}
              >
                <SparklesIcon sx={{ fontSize: 14 }} />
                Cadastro Inteligente
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {SMART_INPUT_ACTIONS.map((action, index) => (
                  <Chip
                    key={index}
                    icon={action.icon}
                    label={action.text}
                    onClick={() => handleSmartInputAction(action.mode)}
                    sx={{
                      px: 1,
                      py: 2.5,
                      borderRadius: "20px",
                      fontSize: 13,
                      fontWeight: 500,
                      bgcolor: alpha(action.color, 0.1),
                      color: action.color,
                      border: `1px solid ${alpha(action.color, 0.2)}`,
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "& .MuiChip-icon": {
                        color: action.color,
                      },
                      "&:hover": {
                        bgcolor: alpha(action.color, 0.2),
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${alpha(action.color, 0.25)}`,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Sugestões de Perguntas */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  mb: 1.5,
                  display: "block",
                }}
              >
                Perguntas sugeridas
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {SUGGESTED_QUESTIONS.map((suggestion, index) => (
                  <Chip
                    key={index}
                    icon={suggestion.icon}
                    label={suggestion.text}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    sx={{
                      px: 1,
                      py: 2.5,
                      borderRadius: "20px",
                      fontSize: 13,
                      fontWeight: 500,
                      bgcolor: alpha(suggestion.color, 0.1),
                      color: suggestion.color,
                      border: `1px solid ${alpha(suggestion.color, 0.2)}`,
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "& .MuiChip-icon": {
                        color: suggestion.color,
                      },
                      "&:hover": {
                        bgcolor: alpha(suggestion.color, 0.2),
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${alpha(suggestion.color, 0.25)}`,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Botões de confirmação para transação pendente */}
        {pendingTransaction && onTransactionCreate && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "20px",
              bgcolor: alpha(theme.palette.success.main, 0.1),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="body2" fontWeight={600} color="success.main">
              Confirmar cadastro da transação?
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckIcon />}
                onClick={handleConfirmTransaction}
                sx={{ borderRadius: "20px", flex: 1 }}
              >
                Confirmar
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<CloseIcon />}
                onClick={handleCancelTransaction}
                sx={{ borderRadius: "20px" }}
              >
                Cancelar
              </Button>
            </Box>
          </Paper>
        )}

        {/* Alerta de erro do Smart Input */}
        <Collapse in={!!smartInputError}>
          <Alert
            severity="error"
            onClose={() => setSmartInputError(null)}
            sx={{ borderRadius: "20px", mb: 2 }}
          >
            {smartInputError}
          </Alert>
        </Collapse>

        {isLoading && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                flexShrink: 0,
              }}
            >
              <SparklesIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box
              sx={{
                p: 2,
                borderRadius: "20px",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <CircularProgress size={16} color="primary" />
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Gradient overlay for blur effect */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.95) 40%, rgba(15, 23, 42, 0) 100%)"
              : "linear-gradient(to top, rgba(248, 250, 252, 1) 0%, rgba(248, 250, 252, 0.95) 40%, rgba(248, 250, 252, 0) 100%)",
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
          px: isMobile ? 2 : 4,
          pb: isMobile ? 2 : 3,
          pt: 2,
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: 800,
            mx: "auto",
          }}
        >
          {/* Input de arquivo oculto para imagens */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />

          {/* Indicador de gravação de áudio */}
          {isRecording && (
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                p: 2,
                mb: 2,
                borderRadius: "20px",
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
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
              <Typography variant="body2" fontWeight={600} color="error.main">
                Gravando... {formatTime(recordingTime)}
              </Typography>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<StopIcon />}
                onClick={stopRecording}
                sx={{ borderRadius: "20px" }}
              >
                Parar
              </Button>
            </Paper>
          )}

          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={isRecording ? "Gravando áudio..." : "Pergunte sobre suas finanças ou digite 'Cadastrar: [descrição]'"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isRecording}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.5 }}>
                  {/* Botão de Áudio */}
                  <Tooltip title={isRecording ? "Parar gravação" : "Gravar áudio"}>
                    <IconButton
                      onClick={() => {
                        if (isRecording) {
                          stopRecording();
                        } else {
                          startRecording();
                        }
                      }}
                      disabled={isLoading}
                      sx={{
                        bgcolor: isRecording
                          ? alpha(theme.palette.error.main, 0.1)
                          : alpha(theme.palette.secondary.main, 0.1),
                        color: isRecording ? "error.main" : "secondary.main",
                        animation: isRecording ? `${pulseAnimation} 1.5s infinite` : "none",
                        "&:hover": {
                          bgcolor: isRecording
                            ? alpha(theme.palette.error.main, 0.2)
                            : alpha(theme.palette.secondary.main, 0.2),
                        },
                      }}
                    >
                      {isRecording ? <StopIcon /> : <MicIcon />}
                    </IconButton>
                  </Tooltip>

                  {/* Botão de Imagem */}
                  <Tooltip title="Enviar foto de recibo">
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isRecording}
                      sx={{
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: "info.main",
                        ml: 0.5,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.info.main, 0.2),
                        },
                      }}
                    >
                      <CameraIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || isRecording}
                    color="primary"
                    sx={{
                      bgcolor: inputValue.trim() && !isRecording ? "primary.main" : "transparent",
                      color: inputValue.trim() && !isRecording ? "white" : "text.disabled",
                      "&:hover": {
                        bgcolor: inputValue.trim() && !isRecording ? "primary.dark" : "transparent",
                      },
                      "&.Mui-disabled": {
                        bgcolor: "transparent",
                        color: "text.disabled",
                      },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: "20px",
                bgcolor: "background.paper",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 20px rgba(0,0,0,0.4)"
                    : "0 4px 20px rgba(0,0,0,0.1)",
                "& fieldset": {
                  borderColor: isRecording ? "error.main" : "divider",
                },
                "&:hover fieldset": {
                  borderColor: isRecording ? "error.main" : "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: isRecording ? "error.main" : "primary.main",
                },
              },
            }}
          />

          {/* Dica de uso */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 1,
              opacity: 0.7,
            }}
          >
            💡 Dica: Use "Cadastrar: gastei 50 no mercado" para registrar despesas rapidamente
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default NixAIView;

