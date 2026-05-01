import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
  Button,
  Collapse,
  Alert,
  InputAdornment,
  Tooltip,
  Paper,
  Stack,
  keyframes,
  Chip,
} from "@mui/material";
import {
  Send as SendIcon,
  Mic as MicIcon,
  PhotoCamera as CameraIcon,
  Stop as StopIcon,
  KeyboardVoice as VoiceIcon,
  CameraAlt as PhotoIcon,
  Star as StarIcon,
  TextFields as TextFieldsIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  ReceiptLong as ReceiptIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import NixAISkeleton from "../skeletons/NixAISkeleton";
import BatchTransactionTable, { EditableBatchRow } from "../forms/BatchTransactionTable";
import { ParsedTransaction } from "../../types";
import {
  parseBatchFromText,
  parseBatchFromAudio,
  parseBatchFromImage,
} from "../../services/geminiService";
import { parseImportFile } from "../../services/importService";
import { useConfirmDialog } from "../../contexts";

const MotionPaper = motion.create(Paper);
const MotionBox = motion.create(Box);

const NIX_PURPLE = "#6366F1";

const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

interface BatchRegistrationViewProps {
  categories?: { income: string[]; expense: string[] };
  paymentMethods?: string[];
  onTransactionCreate?: (
    transaction: Omit<ParsedTransaction, "confidence" | "rawInput"> & {
      invoiceDueDate?: string;
    }
  ) => void;
  onDone?: () => void;
  getPaymentMethodPaymentDay?: (method: string) => number | undefined;
  getPaymentMethodConfig?: (method: string) => import("../types").PaymentMethodConfig | undefined;
  displayName?: string;
}

const INPUT_MODES = [
  {
    key: "text",
    Icon: TextFieldsIcon,
    label: "Texto",
    description: "Descreva em suas palavras: \"Uber 30, mercado 50 com Pix\"",
    colorKey: "primary" as const,
  },
  {
    key: "audio",
    Icon: VoiceIcon,
    label: "Áudio",
    description: "Fale seus gastos e a IA transcreve e categoriza automaticamente",
    colorKey: "error" as const,
  },
  {
    key: "image",
    Icon: PhotoIcon,
    label: "Foto",
    description: "Tire foto de recibo, nota fiscal ou extrato bancário",
    colorKey: "success" as const,
  },
];

const BatchRegistrationView: React.FC<BatchRegistrationViewProps> = ({
  categories = { income: ["Salary", "Other"], expense: ["Food", "Transportation", "Other"] },
  paymentMethods = ["Pix", "Credit Card", "Debit Card", "Cash"],
  onTransactionCreate,
  onDone,
  getPaymentMethodPaymentDay,
  getPaymentMethodConfig,
  displayName,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { confirm } = useConfirmDialog();
  const firstName = displayName ? displayName.split(' ')[0] : '';

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [smartInputError, setSmartInputError] = useState<string | null>(null);
  const [pendingBatch, setPendingBatch] = useState<ParsedTransaction[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  const processBatch = useCallback(async (batch: ParsedTransaction[]) => {
    setPendingBatch(batch);
    setSuccessMessage(null);
  }, []);

  const processTextInput = useCallback(
    async (text: string) => {
      setIsLoading(true);
      setSmartInputError(null);
      setSuccessMessage(null);
      try {
        const batch = await parseBatchFromText(text, categories, paymentMethods);
        await processBatch(batch);
      } catch (error) {
        console.error("Error parsing batch text:", error);
        setSmartInputError(
          "Não foi possível analisar o texto. Tente descrever cada gasto em uma linha ou frase clara."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [categories, paymentMethods, processBatch]
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach((track) => track.stop());
        setIsLoading(true);
        setSmartInputError(null);
        try {
          const batch = await parseBatchFromAudio(blob, categories, paymentMethods);
          await processBatch(batch);
        } catch (e) {
          console.error(e);
          setSmartInputError("Não foi possível entender o áudio. Tente novamente.");
        } finally {
          setIsLoading(false);
          setRecordingTime(0);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
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
    if (file.name.endsWith(".csv") || file.name.endsWith(".ofx") || file.name.endsWith(".qfx")) {
      setIsLoading(true);
      setSmartInputError(null);
      try {
        const text = await file.text();
        const rows = parseImportFile(text, file.name);
        if (rows.length === 0) {
          setSmartInputError("Nenhuma transação encontrada. Verifique o formato do arquivo.");
        } else {
          const batch: ParsedTransaction[] = rows.map((row) => ({
            description: row.description,
            amount: row.amount,
            type: row.type,
            category: row.type === "income" ? (categories.income[0] || "Outros") : (categories.expense[0] || "Outros"),
            paymentMethod: paymentMethods[0] || "",
            date: row.date || new Date().toISOString().split("T")[0],
            confidence: 1,
            rawInput: "Imported from file",
          }));
          await processBatch(batch);
          setSuccessMessage(`${batch.length} transação(ões) extraída(s) do arquivo.`);
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
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageBase64 = e.target?.result as string;
        try {
          const batch = await parseBatchFromImage(imageBase64, file.type, categories, paymentMethods);
          await processBatch(batch);
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

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileProcessing(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) handleFileProcessing(file);
        e.preventDefault();
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

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setInputValue("");
    await processTextInput(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    setSuccessMessage(`${rows.length} transação(ões) registrada(s) com sucesso.`);
    setPendingBatch(null);
    onDone?.();
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
    setPendingBatch(null);
    setSuccessMessage(null);
  };

  const isCentered = !pendingBatch && !isLoading;

  const SUGGESTIONS = [
    { icon: <ReceiptIcon fontSize="small" />, label: "Ler recibo ou nota", action: () => fileInputRef.current?.click() },
    { icon: <VoiceIcon fontSize="small" />, label: "Descrever por áudio", action: startRecording },
    { icon: <AttachFileIcon fontSize="small" />, label: "Importar arquivo", action: () => fileInputRef.current?.click() },
    { icon: <TextFieldsIcon fontSize="small" />, label: "Digitar gastos", action: () => inputRef.current?.focus() },
  ];

  const renderInputBar = (centered: boolean) => (
    <motion.div
      layoutId="input-bar"
      initial={false}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        width: "100%",
        maxWidth: centered ? 830 : "100%",
        margin: centered ? "0 auto" : "0",
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
          bgcolor: isDarkMode ? (centered ? "#1E1F20" : alpha("#FFFFFF", 0.05)) : (centered ? "#F0F4F9" : "#FFFFFF"),
          borderRadius: centered ? "32px" : "24px",
          border: centered ? "none" : `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.08)}`,
          boxShadow: centered 
            ? "none"
            : (isDarkMode ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)"),
          py: centered ? 1.5 : 0.5,
          px: centered ? 2 : 1,
          transition: "all 0.3s ease",
          "&:focus-within": {
            boxShadow: isDarkMode 
              ? `0 8px 32px ${alpha(NIX_PURPLE, 0.15)}` 
              : `0 8px 32px ${alpha(NIX_PURPLE, 0.1)}`,
            bgcolor: isDarkMode ? (centered ? "#1E1F20" : alpha("#FFFFFF", 0.08)) : (centered ? "#F0F4F9" : "#FFFFFF"),
          }
        }}
      >
        <Tooltip title="Anexar arquivo ou foto">
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isRecording}
            sx={{ color: "text.secondary", mr: 1, display: centered ? 'flex' : 'none' }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>

        {!centered && (
           <Tooltip title="Anexar arquivo ou foto">
           <IconButton
             onClick={() => fileInputRef.current?.click()}
             disabled={isLoading || isRecording}
             size="small"
             sx={{ color: "text.secondary", mr: 0.5 }}
           >
             <AddIcon fontSize="small" />
           </IconButton>
         </Tooltip>
        )}

        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={centered ? 8 : 4}
          placeholder={
            isRecording ? "Gravando áudio..." : (centered ? "Pergunte à IA ou descreva seus gastos..." : "Ex.: Uber 30, mercado 50...")
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          disabled={isLoading || isRecording}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: centered ? "1.1rem" : "1rem",
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
                  onClick={handleSend}
                  disabled={isLoading || isRecording}
                  sx={{
                    bgcolor: isDarkMode ? "#E3E3E3" : "#1F1F1F",
                    color: isDarkMode ? "#1F1F1F" : "#FFFFFF",
                    "&:hover": {
                      bgcolor: isDarkMode ? alpha("#E3E3E3", 0.8) : alpha("#1F1F1F", 0.8),
                    },
                    width: centered ? 44 : 36,
                    height: centered ? 44 : 36,
                    ml: 1,
                  }}
                >
                  <SendIcon sx={{ fontSize: centered ? 20 : 18 }} />
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
        height: isMobile
          ? "calc(100dvh - 64px - 80px - env(safe-area-inset-bottom, 0px))"
          : undefined,
        flex: isMobile ? undefined : 1,
        minHeight: isMobile ? undefined : 0,
        maxWidth: "100%",
        mx: "auto",
        width: "100%",
        px: isMobile ? 1.5 : 4,
        pt: isMobile ? 1.5 : 3,
        pb: 0,
        overflow: "hidden",
      }}
    >
      {/* Header - Apenas mostra se não estiver centralizado para manter o foco no input quando vazio */}
      {!isCentered && (
        <Box sx={{ px: isMobile ? 0.5 : 0, mb: isMobile ? 1.5 : 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${NIX_PURPLE} 0%, #8B5CF6 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 4px 16px ${alpha(NIX_PURPLE, 0.4)}`,
              }}
            >
              <StarIcon sx={{ fontSize: 20, color: "#FFF" }} />
            </Box>
            <Typography variant={isMobile ? "subtitle1" : "h5"} fontWeight={800} sx={{ letterSpacing: "-0.5px" }}>
              Inteligência Artificial
            </Typography>
          </Stack>
        </Box>
      )}

      <Collapse in={!!successMessage}>
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
          sx={{ borderRadius: "14px", mb: 1.5 }}
        >
          {successMessage}
        </Alert>
      </Collapse>

      <Collapse in={!!smartInputError}>
        <Alert
          severity="error"
          onClose={() => setSmartInputError(null)}
          sx={{ borderRadius: "14px", mb: 1.5 }}
        >
          {smartInputError}
        </Alert>
      </Collapse>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,.csv,.ofx,.qfx"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {/* Área principal */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          pb: 2,
          display: "flex",
          flexDirection: "column",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <AnimatePresence>
          {pendingBatch && pendingBatch.length > 0 && onTransactionCreate && (
            <BatchTransactionTable
              transactions={pendingBatch}
              categories={categories}
              paymentMethods={paymentMethods}
              onConfirmAll={handleConfirmBatch}
              onCancel={handleCancelBatch}
              getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
              getPaymentMethodConfig={getPaymentMethodConfig}
            />
          )}
        </AnimatePresence>

        {isLoading && (
          <Box sx={{ py: 2 }}>
            <NixAISkeleton />
          </Box>
        )}

        {/* Gemini-like Empty state */}
        {isCentered && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              width: "100%",
            }}
          >
            {/* Grupo central: título + input + sugestões */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                maxWidth: 830,
                px: isMobile ? 1.5 : 2,
              }}
            >
            <Box sx={{ textAlign: 'center', width: '100%', mb: 4 }}>
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
                mt: 3,
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
                    px: 0.5,
                    py: 2,
                    bgcolor: isDarkMode ? "#1E1F20" : "#F0F4F9",
                    color: isDarkMode ? "#E3E3E3" : "#1F1F1F",
                    border: 'none',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isDarkMode ? "#333537" : "#E2E7ED",
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
        )}
      </Box>

      {/* Barra de input na parte inferior quando não centralizado */}
      {!isCentered && (
        <Box
          sx={{
            pt: 2,
            pb: isMobile ? 1 : 2,
            borderTop: "none",
            flexShrink: 0,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -40,
              left: 0,
              right: 0,
              height: 40,
              background: `linear-gradient(to top, ${isDarkMode ? theme.palette.background.default : "#FEF8F2"} 0%, transparent 100%)`,
              pointerEvents: "none",
            }
          }}
        >
          {renderInputBar(false)}
        </Box>
      )}
    </Box>
  );
};

export default BatchRegistrationView;
