import React, { useState, useEffect } from "react";
import { useConfirmDialog, usePrivacy } from "@/presentation/contexts";
import { useSettings } from "@/presentation/contexts";
import { Capacitor } from "@capacitor/core";
import NixButton from "@/presentation/components/radix/Button";
import ThemeSwitch from "@/presentation/components/ui/ThemeSwitch";
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
  useMediaQuery,
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
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  SystemUpdate as SystemUpdateIcon,
} from "@mui/icons-material";
import { supabase } from "@/infrastructure/database/supabaseClient";
import { refreshWebVersion } from "@/infrastructure/web/appUpdate";

const ANDROID_RELEASES_URL = "https://github.com/paladini-qa/nix/releases/latest";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onLogout?: () => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, onLogout }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const platform = Capacitor.getPlatform();
  const { confirm } = useConfirmDialog();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { themePreference, setThemePreference, displayName, setDisplayName } = useSettings();

  const [userEmail, setUserEmail] = useState("");
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [newEmail, setNewEmail] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "error">("idle");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, [open]);

  useEffect(() => {
    setLocalDisplayName(displayName);
  }, [displayName]);

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "20px",
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

  const sectionSx = {
    p: 3,
    borderRadius: "20px",
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
      await setDisplayName(localDisplayName.trim());
      setNameStatus("saved");
      setTimeout(() => setNameStatus("idle"), 2000);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setErrorMessage("Informe um endereço de e-mail válido.");
      setEmailStatus("error");
      return;
    }
    setEmailStatus("saving");
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      setEmailStatus("sent");
      setNewEmail("");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao atualizar o endereço de e-mail.");
      setEmailStatus("error");
    }
  };

  const handleResetPassword = async () => {
    const confirmed = await confirm({
      title: "Redefinir senha",
      message: `Enviaremos um e-mail de redefinição de senha para ${userEmail}. Deseja continuar?`,
      confirmText: "Enviar e-mail",
      cancelText: "Cancelar",
      variant: "warning",
    });
    if (!confirmed) return;
    setPasswordStatus("sending");
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
      if (error) throw error;
      setPasswordStatus("sent");
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao enviar o e-mail de recuperação.");
      setPasswordStatus("error");
    }
  };

  const handleVersionUpdate = async () => {
    setUpdateStatus("checking");
    try {
      await refreshWebVersion();
    } catch {
      setUpdateStatus("error");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{ paper: { "aria-label": "Perfil" } }}
    >
      {/* Header */}
      <Box
        sx={{
          position: "relative",
          px: 4,
          pt: isMobile ? `calc(env(safe-area-inset-top, 0px) + 40px)` : 5,
          pb: 4,
          textAlign: "center",
          background: isDarkMode
            ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`
            : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 100%)`,
        }}
      >
        <IconButton
          aria-label="Fechar perfil"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: isMobile ? `calc(env(safe-area-inset-top, 0px) + 12px)` : 16,
            right: 16,
            bgcolor: isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.04),
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.08),
              transform: "rotate(90deg)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>

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

        <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: "-0.02em", mb: 0.5 }}>
          {displayName || "Usuário"}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          {userEmail}
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pb: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {errorMessage && (
            <Alert
              severity="error"
              icon={<AlertCircleIcon fontSize="small" />}
              sx={{ borderRadius: "20px", border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Privacy Mode & Theme */}
          <Box
            sx={{
              p: 2,
              borderRadius: "20px",
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.default, 0.4)
                : alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
                pb: 2,
                borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {isPrivacyMode ? (
                  <VisibilityOffIcon sx={{ fontSize: 20, color: "primary.main" }} />
                ) : (
                  <VisibilityIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                )}
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: isPrivacyMode ? "primary.main" : "text.secondary" }}
                >
                  Modo de privacidade
                </Typography>
              </Box>
              <Button
                variant={isPrivacyMode ? "contained" : "outlined"}
                color={isPrivacyMode ? "primary" : "inherit"}
                onClick={togglePrivacyMode}
                size="small"
                sx={{
                  borderRadius: "16px",
                  fontWeight: 600,
                  textTransform: "none",
                  ...(!isPrivacyMode && {
                    borderColor: isDarkMode ? alpha("#FFFFFF", 0.2) : alpha("#000000", 0.2),
                  }),
                }}
              >
                {isPrivacyMode ? "Ativado" : "Desativado"}
              </Button>
            </Box>
            <ThemeSwitch value={themePreference} onChange={setThemePreference} />
          </Box>

          <Box sx={sectionSx}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <SystemUpdateIcon fontSize="small" color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>Versão do Nix</Typography>
                  <Typography variant="caption" color="text.secondary">v{process.env.APP_VERSION}</Typography>
                </Box>
              </Box>
              {platform === "web" && (
                <NixButton
                  size="sm"
                  variant="soft"
                  loading={updateStatus === "checking"}
                  disabled={nameStatus === "saving" || emailStatus === "saving" || passwordStatus === "sending"}
                  aria-busy={updateStatus === "checking"}
                  onClick={() => void handleVersionUpdate()}
                >
                  {updateStatus === "checking" ? "Verificando versão…" : "Atualizar versão"}
                </NixButton>
              )}
              {platform === "android" && (
                <NixButton size="sm" variant="soft" asChild>
                  <a href={ANDROID_RELEASES_URL}>Atualizar versão</a>
                </NixButton>
              )}
            </Box>
            {updateStatus === "checking" && (
              <Typography role="status" variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Verificando atualizações do Nix…
              </Typography>
            )}
            {updateStatus === "error" && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                Não foi possível atualizar a versão. Confira a conexão e tente novamente.
              </Alert>
            )}
            {platform === "android" && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Abre a página oficial para baixar e instalar o APK.
              </Typography>
            )}
          </Box>

          {/* Display Name */}
          <Box sx={sectionSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "20px",
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
                <Typography variant="subtitle1" fontWeight={600}>Nome de exibição</Typography>
                <Typography variant="caption" color="text.secondary">Como você prefere ser chamado?</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                name="name"
                autoComplete="name"
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
                disabled={localDisplayName === displayName || nameStatus === "saving"}
                startIcon={
                  nameStatus === "saving" ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : nameStatus === "saved" ? (
                    <CheckIcon />
                  ) : null
                }
                sx={{
                  minWidth: 100,
                  borderRadius: "20px",
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

          {/* Change Email */}
          <Box sx={sectionSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "20px",
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
                <Typography variant="subtitle1" fontWeight={600}>Alterar e-mail</Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2, ml: 6.5 }}>
              A confirmação será enviada para os dois endereços de e-mail.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                name="email"
                autoComplete="username"
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
                  borderRadius: "20px",
                  fontWeight: 600,
                  boxShadow: `0 4px 14px -4px ${alpha(
                    emailStatus === "sent" ? theme.palette.success.main : theme.palette.primary.main,
                    0.4
                  )}`,
                }}
              >
                {emailStatus === "sent" ? "Enviado!" : "Alterar"}
              </Button>
            </Box>
          </Box>

          {/* Reset Password */}
          <Box sx={sectionSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "20px",
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
                <Typography variant="subtitle1" fontWeight={600}>Redefinir senha</Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2, ml: 6.5 }}>
              O link de recuperação será enviado para {userEmail}
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
                borderRadius: "20px",
                py: 1.5,
                fontWeight: 600,
                boxShadow: `0 6px 20px -6px ${alpha(
                  passwordStatus === "sent" ? theme.palette.success.main : theme.palette.warning.main,
                  0.4
                )}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 10px 28px -6px ${alpha(
                    passwordStatus === "sent" ? theme.palette.success.main : theme.palette.warning.main,
                    0.5
                  )}`,
                },
              }}
            >
              {passwordStatus === "sent" ? "E-mail enviado!" : "Enviar link de recuperação"}
            </Button>
          </Box>

          {/* Google Wallet Sync — Android only */}
          {platform === "android" && (
            <Box sx={sectionSx}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isDarkMode
                      ? alpha(theme.palette.secondary.main, 0.15)
                      : alpha(theme.palette.secondary.main, 0.1),
                  }}
                >
                  <Avatar
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Wallet_Icon_2022.svg/1024px-Google_Wallet_Icon_2022.svg.png"
                    sx={{ width: 20, height: 20, borderRadius: 0 }}
                  />
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>Sincronização com a Carteira do Google</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, mb: 2, ml: 6.5 }}>
                Acompanha notificações para cadastrar transações automaticamente.
              </Typography>
            </Box>
          )}
          {onLogout && (
            <NixButton color="red" variant="soft" onClick={() => void onLogout()}>
              Sair
            </NixButton>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
