import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as UserIcon,
  Email as MailIcon,
  Key as KeyIcon,
  Check as CheckIcon,
  ErrorOutline as AlertCircleIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  userEmail: string;
  onUpdateDisplayName: (name: string) => void;
  onChangeEmail: (newEmail: string) => Promise<void>;
  onResetPassword: () => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  displayName,
  userEmail,
  onUpdateDisplayName,
  onChangeEmail,
  onResetPassword,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [newEmail, setNewEmail] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "saving" | "sent" | "error"
  >("idle");
  const [passwordStatus, setPasswordStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Estilos de input soft
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2.5,
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.default, 0.5)
        : alpha(theme.palette.primary.main, 0.02),
      transition: "all 0.2s ease-in-out",
      "& fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.08)
          : alpha(theme.palette.primary.main, 0.1),
        borderWidth: 1.5,
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
  };

  // Estilos de seção
  const sectionSx = {
    p: 3,
    borderRadius: 2.5,
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.default, 0.4)
      : alpha("#FFFFFF", 0.6),
    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.04)}`,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.default, 0.6)
        : alpha("#FFFFFF", 0.8),
    },
  };

  const handleSaveName = async () => {
    if (localDisplayName.trim() && localDisplayName !== displayName) {
      setNameStatus("saving");
      onUpdateDisplayName(localDisplayName.trim());
      setNameStatus("saved");
      setTimeout(() => setNameStatus("idle"), 2000);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setErrorMessage("Por favor, insira um email válido.");
      setEmailStatus("error");
      return;
    }

    setEmailStatus("saving");
    setErrorMessage("");

    try {
      await onChangeEmail(newEmail.trim());
      setEmailStatus("sent");
      setNewEmail("");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao atualizar email.");
      setEmailStatus("error");
    }
  };

  const handleResetPassword = async () => {
    setPasswordStatus("sending");
    setErrorMessage("");

    try {
      await onResetPassword();
      setPasswordStatus("sent");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao enviar email de recuperação.");
      setPasswordStatus("error");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          overflow: "hidden",
          // Glassmorphism
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.85)
            : alpha("#FFFFFF", 0.92),
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
          boxShadow: isDarkMode
            ? `0 32px 100px -24px ${alpha("#000000", 0.7)}`
            : `0 32px 100px -24px ${alpha(theme.palette.primary.main, 0.25)}`,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: isDarkMode
              ? alpha("#0F172A", 0.85)
              : alpha("#64748B", 0.5),
            backdropFilter: "blur(12px)",
          },
        },
      }}
    >
      {/* Header com Avatar Grande */}
      <Box
        sx={{
          position: "relative",
          px: 4,
          pt: 5,
          pb: 4,
          textAlign: "center",
          // Gradiente de fundo sutil
          background: isDarkMode
            ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`
            : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 100%)`,
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            bgcolor: isDarkMode
              ? alpha("#FFFFFF", 0.05)
              : alpha("#000000", 0.04),
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: isDarkMode
                ? alpha("#FFFFFF", 0.1)
                : alpha("#000000", 0.08),
              transform: "rotate(90deg)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Avatar Premium */}
        <Avatar
          sx={{
            width: 88,
            height: 88,
            mx: "auto",
            mb: 2.5,
            fontSize: 36,
            fontWeight: 700,
            bgcolor: isDarkMode
              ? alpha(theme.palette.primary.main, 0.2)
              : alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
            border: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            boxShadow: `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.4)}, inset 0 -4px 12px ${alpha("#000000", 0.1)}`,
          }}
        >
          {displayName ? displayName.charAt(0).toUpperCase() : <UserIcon sx={{ fontSize: 40 }} />}
        </Avatar>

        {/* Nome e Email */}
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ letterSpacing: "-0.02em", mb: 0.5 }}
        >
          {displayName || "Usuário"}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {userEmail}
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Error Message */}
          {errorMessage && (
            <Alert
              severity="error"
              icon={<AlertCircleIcon fontSize="small" />}
              sx={{
                borderRadius: 2.5,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Display Name Section */}
          <Box sx={sectionSx}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <EditIcon fontSize="small" color="primary" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Nome de Exibição
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Como você quer ser chamado
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                value={localDisplayName}
                onChange={(e) => setLocalDisplayName(e.target.value)}
                placeholder="Digite seu nome..."
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                sx={inputSx}
              />
              <Button
                variant="contained"
                color={nameStatus === "saved" ? "success" : "primary"}
                onClick={handleSaveName}
                disabled={
                  localDisplayName === displayName || nameStatus === "saving"
                }
                startIcon={
                  nameStatus === "saving" ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : nameStatus === "saved" ? (
                    <CheckIcon />
                  ) : null
                }
                sx={{
                  minWidth: 100,
                  borderRadius: 2.5,
                  fontWeight: 600,
                  boxShadow: nameStatus === "saved"
                    ? `0 4px 14px -4px ${alpha(theme.palette.success.main, 0.4)}`
                    : `0 4px 14px -4px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                {nameStatus === "saved" ? "Salvo!" : "Salvar"}
              </Button>
            </Box>
          </Box>

          {/* Change Email Section */}
          <Box sx={sectionSx}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.info.main, 0.15)
                    : alpha(theme.palette.info.main, 0.1),
                }}
              >
                <MailIcon fontSize="small" color="info" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Alterar Email
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 2, ml: 6.5 }}
            >
              Confirmação será enviada para ambos os emails.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novo@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleChangeEmail()}
                sx={inputSx}
              />
              <Button
                variant="contained"
                color={emailStatus === "sent" ? "success" : "primary"}
                onClick={handleChangeEmail}
                disabled={!newEmail.trim() || emailStatus === "saving"}
                startIcon={
                  emailStatus === "saving" ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : emailStatus === "sent" ? (
                    <CheckIcon />
                  ) : null
                }
                sx={{
                  minWidth: 100,
                  borderRadius: 2.5,
                  fontWeight: 600,
                  boxShadow: `0 4px 14px -4px ${alpha(
                    emailStatus === "sent"
                      ? theme.palette.success.main
                      : theme.palette.primary.main,
                    0.4
                  )}`,
                }}
              >
                {emailStatus === "sent" ? "Enviado!" : "Alterar"}
              </Button>
            </Box>
          </Box>

          {/* Reset Password Section */}
          <Box sx={sectionSx}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.warning.main, 0.15)
                    : alpha(theme.palette.warning.main, 0.1),
                }}
              >
                <KeyIcon fontSize="small" color="warning" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Redefinir Senha
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 2, ml: 6.5 }}
            >
              Link de recuperação será enviado para {userEmail}
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color={passwordStatus === "sent" ? "success" : "warning"}
              onClick={handleResetPassword}
              disabled={passwordStatus === "sending"}
              startIcon={
                passwordStatus === "sending" ? (
                  <CircularProgress size={16} color="inherit" />
                ) : passwordStatus === "sent" ? (
                  <CheckIcon />
                ) : (
                  <KeyIcon />
                )
              }
              sx={{
                borderRadius: 2.5,
                py: 1.5,
                fontWeight: 600,
                boxShadow: `0 6px 20px -6px ${alpha(
                  passwordStatus === "sent"
                    ? theme.palette.success.main
                    : theme.palette.warning.main,
                  0.4
                )}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 10px 28px -6px ${alpha(
                    passwordStatus === "sent"
                      ? theme.palette.success.main
                      : theme.palette.warning.main,
                    0.5
                  )}`,
                },
              }}
            >
              {passwordStatus === "sent" ? "Email Enviado!" : "Enviar Link de Recuperação"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

