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
} from "@mui/material";
import {
  Send as SendIcon,
  Mic as MicIcon,
  PhotoCamera as CameraIcon,
  Stop as StopIcon,
  AutoAwesome as AutoAwesomeIcon,
  TextFields as TextFieldsIcon,
  KeyboardVoice as VoiceIcon,
  CameraAlt as PhotoIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import NixAISkeleton from "./skeletons/NixAISkeleton";
import BatchTransactionTable, { EditableBatchRow } from "./BatchTransactionTable";
import { ParsedTransaction } from "../types";
import {
  parseBatchFromText,
  parseBatchFromAudio,
  parseBatchFromImage,
} from "../services/geminiService";
import { useConfirmDialog } from "../contexts";

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
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { confirm } = useConfirmDialog();

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: isMobile
          ? "calc(100dvh - 64px - 80px - env(safe-area-inset-bottom, 0px))"
          : "calc(100vh - 100px)",
        maxWidth: 900,
        mx: "auto",
        width: "100%",
        px: isMobile ? 1.5 : 3,
        pt: isMobile ? 1.5 : 2,
        pb: 0,
        overflow: "hidden",
      }}
    >
      {/* Cabeçalho */}
      <Box sx={{ px: isMobile ? 0.5 : 0, mb: isMobile ? 1.5 : 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${NIX_PURPLE} 0%, #8B5CF6 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${alpha(NIX_PURPLE, 0.35)}`,
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 15, color: "#FFF" }} />
          </Box>
          <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={700}>
            Cadastro em lote
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: isMobile ? 12 : 13, pl: 0.5 }}
        >
          Envie texto, foto ou áudio — a IA extrai as transações para você revisar antes de salvar.
        </Typography>
      </Box>

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

      {/* Área scrollável */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          pb: 2,
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

        {/* Empty state */}
        {!pendingBatch && !isLoading && (
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: isMobile ? 3 : 5,
              gap: 2.5,
            }}
          >
            {/* Ícone central */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${alpha(NIX_PURPLE, 0.15)} 0%, ${alpha("#8B5CF6", 0.08)} 100%)`,
                border: `1px solid ${alpha(NIX_PURPLE, 0.2)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 28, color: NIX_PURPLE }} />
            </Box>

            <Box sx={{ textAlign: "center", maxWidth: 360 }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight={700}
                sx={{ mb: 0.75 }}
              >
                Descreva seus gastos como preferir
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                A IA identifica e categoriza tudo automaticamente. Você só revisa e confirma.
              </Typography>
            </Box>

            {/* Cards de modo de entrada */}
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={1.5}
              sx={{ width: "100%", maxWidth: 600 }}
            >
              {INPUT_MODES.map(({ key, Icon, label, description, colorKey }) => {
                const color = theme.palette[colorKey].main;
                return (
                  <Box
                    key={key}
                    sx={{
                      flex: 1,
                      p: 1.75,
                      borderRadius: "16px",
                      bgcolor: isDarkMode ? alpha("#FFFFFF", 0.03) : "#FFFFFF",
                      border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.07) : alpha("#000000", 0.06)}`,
                      display: "flex",
                      flexDirection: isMobile ? "row" : "column",
                      alignItems: isMobile ? "center" : "flex-start",
                      gap: 1.25,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: alpha(color, 0.3),
                        boxShadow: `0 4px 16px ${alpha(color, 0.08)}`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                        borderRadius: "10px",
                        bgcolor: alpha(color, 0.1),
                        border: `1px solid ${alpha(color, 0.2)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon sx={{ fontSize: 18, color }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        display="block"
                        sx={{ mb: 0.25, fontSize: 12 }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? 11 : 10, lineHeight: 1.4 }}
                      >
                        {description}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </MotionBox>
        )}
      </Box>

      {/* Barra de input — fixa no fundo */}
      <Box
        sx={{
          pt: 1,
          pb: isMobile ? 0.5 : 0,
          borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.04)}`,
          flexShrink: 0,
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

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

        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder={
            isRecording ? "Gravando áudio..." : "Ex.: Gastei 30 no Uber, 50 no mercado com Pix..."
          }
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
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isRecording ? (
                      <StopIcon fontSize="small" />
                    ) : (
                      <MicIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Enviar foto">
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isRecording}
                    size="small"
                    sx={{ color: "text.secondary", transition: "all 0.2s ease" }}
                  >
                    <CameraIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading || isRecording}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: inputValue.trim() ? NIX_PURPLE : "transparent",
                    color: inputValue.trim() ? "#FFFFFF" : "text.disabled",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: inputValue.trim() ? alpha(NIX_PURPLE, 0.85) : undefined,
                      transform: inputValue.trim() ? "scale(1.05)" : "none",
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
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              "& fieldset": { border: "none" },
              py: 0.5,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default BatchRegistrationView;
