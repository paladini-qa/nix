import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Paper,
  Slide,
  useTheme,
  useMediaQuery,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Collapse,
  Alert,
  LinearProgress,
  keyframes,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  Close as CloseIcon,
  TextFields as TextIcon,
  Mic as MicIcon,
  PhotoCamera as CameraIcon,
  Stop as StopIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
  AutoAwesome as AIIcon,
} from "@mui/icons-material";
import {
  ParsedTransaction,
  SmartInputMode,
  TransactionType,
} from "../types";
import {
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
    box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
`;

// Transição mobile
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface SmartInputModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (transaction: Omit<ParsedTransaction, "confidence" | "rawInput">) => void;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  initialMode?: SmartInputMode;
}

const SmartInputModal: React.FC<SmartInputModalProps> = ({
  open,
  onClose,
  onConfirm,
  categories,
  paymentMethods,
  initialMode = "text",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  // Estados principais
  const [mode, setMode] = useState<SmartInputMode>(initialMode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de input
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("");

  // Estados do resultado
  const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Estados de edição do resultado
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<TransactionType>("expense");
  const [editCategory, setEditCategory] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editDate, setEditDate] = useState<Dayjs | null>(dayjs());

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset ao abrir/fechar modal
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setTextInput("");
      setAudioBlob(null);
      setImagePreview(null);
      setParsedResult(null);
      setIsEditing(false);
      setError(null);
      setRecordingTime(0);
    } else {
      // Cleanup ao fechar
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [open, initialMode]);

  // Atualiza campos de edição quando o resultado muda
  useEffect(() => {
    if (parsedResult) {
      setEditDescription(parsedResult.description);
      setEditAmount(parsedResult.amount?.toString() || "");
      setEditType(parsedResult.type);
      setEditCategory(parsedResult.category);
      setEditPaymentMethod(parsedResult.paymentMethod);
      setEditDate(dayjs(parsedResult.date));
    }
  }, [parsedResult]);

  // ========================================
  // Handlers de Input
  // ========================================

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: SmartInputMode | null) => {
    if (newMode) {
      setMode(newMode);
      setError(null);
      setParsedResult(null);
    }
  };

  // Gravação de áudio
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

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Não foi possível acessar o microfone. Verifique as permissões.");
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

  // Upload de imagem
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Imagem muito grande. Máximo 4MB.");
        return;
      }

      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ========================================
  // Processamento com IA
  // ========================================

  const processInput = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let result: ParsedTransaction;

      switch (mode) {
        case "text":
          if (!textInput.trim()) {
            throw new Error("Digite uma descrição da transação.");
          }
          result = await parseTransactionFromText(textInput, categories, paymentMethods);
          break;

        case "audio":
          if (!audioBlob) {
            throw new Error("Grave um áudio primeiro.");
          }
          result = await parseTransactionFromAudio(audioBlob, categories, paymentMethods);
          break;

        case "image":
          if (!imagePreview) {
            throw new Error("Selecione uma imagem primeiro.");
          }
          result = await parseTransactionFromImage(imagePreview, imageMimeType, categories, paymentMethods);
          break;

        default:
          throw new Error("Modo inválido");
      }

      setParsedResult(result);
    } catch (err) {
      console.error("Error processing input:", err);
      setError(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  }, [mode, textInput, audioBlob, imagePreview, imageMimeType, categories, paymentMethods]);

  // ========================================
  // Handlers de Confirmação
  // ========================================

  const handleConfirm = () => {
    const transaction = {
      description: editDescription,
      amount: editAmount ? parseFloat(editAmount) : null,
      type: editType,
      category: editCategory,
      paymentMethod: editPaymentMethod,
      date: editDate?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
    };

    onConfirm(transaction);
    onClose();
  };

  const handleReset = () => {
    setParsedResult(null);
    setIsEditing(false);
    setTextInput("");
    setAudioBlob(null);
    setImagePreview(null);
    setRecordingTime(0);
  };

  // ========================================
  // Helpers
  // ========================================

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.palette.success.main;
    if (confidence >= 0.5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "Alta confiança";
    if (confidence >= 0.5) return "Média confiança";
    return "Baixa confiança";
  };

  // ========================================
  // Render Helpers
  // ========================================

  const renderModeSelector = () => (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleModeChange}
      fullWidth
      disabled={isProcessing || !!parsedResult}
      sx={{
        bgcolor: isDarkMode
          ? alpha(theme.palette.background.default, 0.3)
          : alpha("#000000", 0.02),
        borderRadius: 2,
        p: 0.5,
        "& .MuiToggleButtonGroup-grouped": {
          border: 0,
          borderRadius: "16px !important",
          mx: 0.25,
        },
        "& .MuiToggleButton-root": {
          py: 1.5,
          fontWeight: 600,
          fontSize: "0.9rem",
          textTransform: "none",
          transition: "all 0.2s ease-in-out",
          gap: 1,
        },
      }}
    >
      <ToggleButton
        value="text"
        sx={{
          "&.Mui-selected": {
            bgcolor: alpha(theme.palette.primary.main, isDarkMode ? 0.2 : 0.12),
            color: theme.palette.primary.main,
            boxShadow: `0 4px 12px -4px ${alpha(theme.palette.primary.main, 0.3)}`,
          },
        }}
      >
        <TextIcon fontSize="small" />
        Texto
      </ToggleButton>
      <ToggleButton
        value="audio"
        sx={{
          "&.Mui-selected": {
            bgcolor: alpha(theme.palette.secondary.main, isDarkMode ? 0.2 : 0.12),
            color: theme.palette.secondary.main,
            boxShadow: `0 4px 12px -4px ${alpha(theme.palette.secondary.main, 0.3)}`,
          },
        }}
      >
        <MicIcon fontSize="small" />
        Áudio
      </ToggleButton>
      <ToggleButton
        value="image"
        sx={{
          "&.Mui-selected": {
            bgcolor: alpha(theme.palette.info.main, isDarkMode ? 0.2 : 0.12),
            color: theme.palette.info.main,
            boxShadow: `0 4px 12px -4px ${alpha(theme.palette.info.main, 0.3)}`,
          },
        }}
      >
        <CameraIcon fontSize="small" />
        Imagem
      </ToggleButton>
    </ToggleButtonGroup>
  );

  const renderTextInput = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        multiline
        rows={3}
        fullWidth
        placeholder="Ex: Gastei 150 reais no mercado ontem com pix"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        disabled={isProcessing}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.5)
              : alpha(theme.palette.primary.main, 0.02),
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
        💡 Dica: Inclua valor, local, data e forma de pagamento para melhor precisão
      </Typography>
    </Box>
  );

  const renderAudioInput = () => (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, py: 2 }}>
      {/* Botão de gravação */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <IconButton
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || !!audioBlob}
          sx={{
            width: 80,
            height: 80,
            bgcolor: isRecording
              ? theme.palette.error.main
              : audioBlob
              ? theme.palette.success.main
              : theme.palette.secondary.main,
            color: "#fff",
            transition: "all 0.3s ease",
            animation: isRecording ? `${pulseAnimation} 1.5s infinite` : "none",
            "&:hover": {
              bgcolor: isRecording
                ? theme.palette.error.dark
                : audioBlob
                ? theme.palette.success.dark
                : theme.palette.secondary.dark,
              transform: "scale(1.05)",
            },
            "&:disabled": {
              bgcolor: alpha(theme.palette.action.disabled, 0.3),
            },
          }}
        >
          {isRecording ? (
            <StopIcon sx={{ fontSize: 36 }} />
          ) : audioBlob ? (
            <CheckIcon sx={{ fontSize: 36 }} />
          ) : (
            <MicIcon sx={{ fontSize: 36 }} />
          )}
        </IconButton>

        {/* Status */}
        <Typography
          variant="body1"
          fontWeight={600}
          color={isRecording ? "error.main" : audioBlob ? "success.main" : "text.secondary"}
        >
          {isRecording
            ? `Gravando... ${formatTime(recordingTime)}`
            : audioBlob
            ? "Áudio gravado!"
            : "Toque para gravar"}
        </Typography>
      </Box>

      {/* Botão para regravar */}
      {audioBlob && !isProcessing && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => {
            setAudioBlob(null);
            setRecordingTime(0);
          }}
          sx={{ borderRadius: 2 }}
        >
          Gravar novamente
        </Button>
      )}

      <Typography variant="caption" color="text.secondary" textAlign="center">
        🎤 Fale claramente o valor, descrição e forma de pagamento
      </Typography>
    </Box>
  );

  const renderImageInput = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        ref={fileInputRef}
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {imagePreview ? (
        <Box sx={{ position: "relative" }}>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.default, 0.5)
                : alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Box
              component="img"
              src={imagePreview}
              alt="Preview"
              sx={{
                width: "100%",
                maxHeight: 200,
                objectFit: "contain",
                borderRadius: 1.5,
              }}
            />
          </Paper>
          {!isProcessing && (
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: alpha("#000", 0.5),
                color: "#fff",
                "&:hover": { bgcolor: alpha("#000", 0.7) },
              }}
            >
              <RefreshIcon />
            </IconButton>
          )}
        </Box>
      ) : (
        <Paper
          elevation={0}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            p: 4,
            borderRadius: 2,
            border: `2px dashed ${alpha(theme.palette.info.main, 0.3)}`,
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.3)
              : alpha(theme.palette.info.main, 0.02),
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            "&:hover": {
              borderColor: theme.palette.info.main,
              bgcolor: alpha(theme.palette.info.main, 0.05),
            },
          }}
        >
          <UploadIcon sx={{ fontSize: 48, color: theme.palette.info.main }} />
          <Typography variant="body1" fontWeight={600} color="text.primary">
            Clique para enviar imagem
          </Typography>
          <Typography variant="caption" color="text.secondary">
            JPEG, PNG ou WebP (máx. 4MB)
          </Typography>
        </Paper>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
        📸 Envie foto de cupom fiscal, comprovante de Pix ou extrato
      </Typography>
    </Box>
  );

  const renderResult = () => {
    if (!parsedResult) return null;

    const availableCategories = editType === "income" ? categories.income : categories.expense;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Confidence indicator */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(getConfidenceColor(parsedResult.confidence), 0.1),
            border: `1px solid ${alpha(getConfidenceColor(parsedResult.confidence), 0.2)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AIIcon sx={{ color: getConfidenceColor(parsedResult.confidence) }} />
            <Typography variant="body2" fontWeight={600}>
              {getConfidenceLabel(parsedResult.confidence)}
            </Typography>
          </Box>
          <Chip
            label={`${Math.round(parsedResult.confidence * 100)}%`}
            size="small"
            sx={{
              bgcolor: alpha(getConfidenceColor(parsedResult.confidence), 0.2),
              color: getConfidenceColor(parsedResult.confidence),
              fontWeight: 700,
            }}
          />
        </Box>

        {/* Campos editáveis */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Type Toggle */}
          <ToggleButtonGroup
            value={editType}
            exclusive
            onChange={(_, newType) => {
              if (newType) {
                setEditType(newType);
                // Reset category when type changes
                const newCategories = newType === "income" ? categories.income : categories.expense;
                setEditCategory(newCategories[0] || "");
              }
            }}
            fullWidth
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                py: 1,
                fontWeight: 600,
                textTransform: "none",
              },
            }}
          >
            <ToggleButton
              value="income"
              sx={{
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                },
              }}
            >
              💰 Receita
            </ToggleButton>
            <ToggleButton
              value="expense"
              sx={{
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.error.main, 0.15),
                  color: theme.palette.error.main,
                },
              }}
            >
              💸 Despesa
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="Descrição"
            fullWidth
            size="small"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <TextField
            label="Valor (R$)"
            type="number"
            fullWidth
            size="small"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography fontWeight={600} color="text.secondary">R$</Typography>
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={editCategory}
                label="Categoria"
                onChange={(e) => setEditCategory(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {availableCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Pagamento</InputLabel>
              <Select
                value={editPaymentMethod}
                label="Pagamento"
                onChange={(e) => setEditPaymentMethod(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <DatePicker
            label="Data"
            value={editDate}
            onChange={(newValue) => setEditDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
              },
            }}
          />
        </Box>
      </Box>
    );
  };

  // ========================================
  // Main Render
  // ========================================

  const canProcess =
    (mode === "text" && textInput.trim()) ||
    (mode === "audio" && audioBlob) ||
    (mode === "image" && imagePreview);

  const canConfirm = parsedResult && editDescription && editCategory && editPaymentMethod;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={isMobile ? SlideTransition : undefined}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
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
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          >
            <AIIcon sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em">
              Cadastro Inteligente
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Descreva a transação de qualquer forma
            </Typography>
          </Box>
        </Box>
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

      {/* Processing indicator */}
      {isProcessing && <LinearProgress />}

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Error alert */}
          <Collapse in={!!error}>
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ borderRadius: 2 }}
            >
              {error}
            </Alert>
          </Collapse>

          {/* Mode selector */}
          {renderModeSelector()}

          {/* Input area - show only if no result yet */}
          {!parsedResult && (
            <Box>
              {mode === "text" && renderTextInput()}
              {mode === "audio" && renderAudioInput()}
              {mode === "image" && renderImageInput()}
            </Box>
          )}

          {/* Result area */}
          {parsedResult && renderResult()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
        {!parsedResult ? (
          <>
            <Button
              onClick={onClose}
              color="inherit"
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 500,
                color: "text.secondary",
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={processInput}
              variant="contained"
              disabled={!canProcess || isProcessing}
              startIcon={isProcessing ? <CircularProgress size={18} color="inherit" /> : <AIIcon />}
              sx={{
                flex: 1,
                borderRadius: 2,
                py: 1.25,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 8px 24px -8px ${alpha(theme.palette.primary.main, 0.4)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                },
              }}
            >
              {isProcessing ? "Processando..." : "Analisar com IA"}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleReset}
              color="inherit"
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 500,
                color: "text.secondary",
              }}
            >
              Recomeçar
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              color="success"
              disabled={!canConfirm}
              startIcon={<CheckIcon />}
              sx={{
                flex: 1,
                borderRadius: 2,
                py: 1.25,
                fontWeight: 600,
                boxShadow: `0 8px 24px -8px ${alpha(theme.palette.success.main, 0.4)}`,
              }}
            >
              Confirmar Transação
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SmartInputModal;


