import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  CircularProgress,
  Link,
  useTheme,
  alpha,
} from "@mui/material";
import {
  AutoAwesome as SparklesIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Fingerprint as FingerprintIcon,
} from "@mui/icons-material";
import { supabase } from "../services/supabaseClient";

const LoginView: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Estilos de input premium
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2.5,
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.paper, 0.4)
        : alpha("#FFFFFF", 0.7),
      backdropFilter: "blur(8px)",
      transition: "all 0.2s ease-in-out",
      "& fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.1)
          : alpha(theme.palette.primary.main, 0.15),
        borderWidth: 1.5,
      },
      "&:hover fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.2)
          : alpha(theme.palette.primary.main, 0.3),
      },
      "&.Mui-focused": {
        bgcolor: isDarkMode
          ? alpha(theme.palette.primary.main, 0.1)
          : alpha("#FFFFFF", 0.9),
        boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
    "& .MuiInputLabel-root": {
      fontWeight: 500,
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && !displayName.trim()) {
      setError("Por favor, digite seu nome.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Save display name to user_settings if signup successful
        if (data.user) {
          await supabase.from("user_settings").upsert({
            user_id: data.user.id,
            display_name: displayName.trim(),
          });
        }

        setMessage(
          "Conta criada! Verifique seu email para confirmar (ou faça login se a confirmação estiver desabilitada)."
        );
        setIsSignUp(false);
        setDisplayName("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        // Gradiente de fundo premium
        background: isDarkMode
          ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 50%, ${alpha(theme.palette.primary.dark, 0.2)} 100%)`
          : `linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #E0E7FF 100%)`,
      }}
    >
      {/* Mesh Gradient Blobs */}
      <Box
        sx={{
          position: "absolute",
          top: "-20%",
          left: "-15%",
          width: "60%",
          height: "60%",
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, isDarkMode ? 0.15 : 0.2)} 0%, transparent 70%)`,
          filter: "blur(80px)",
          pointerEvents: "none",
          animation: "float 8s ease-in-out infinite",
          "@keyframes float": {
            "0%, 100%": { transform: "translate(0, 0) scale(1)" },
            "50%": { transform: "translate(30px, 20px) scale(1.05)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, isDarkMode ? 0.12 : 0.15)} 0%, transparent 70%)`,
          filter: "blur(80px)",
          pointerEvents: "none",
          animation: "float2 10s ease-in-out infinite",
          "@keyframes float2": {
            "0%, 100%": { transform: "translate(0, 0) scale(1)" },
            "50%": { transform: "translate(-20px, -30px) scale(1.08)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "40%",
          right: "20%",
          width: "30%",
          height: "30%",
          background: `radial-gradient(circle, ${alpha(theme.palette.success.main, isDarkMode ? 0.08 : 0.1)} 0%, transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Login Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          p: 3,
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            borderRadius: 2.5,
            overflow: "hidden",
            // Glassmorphism Premium
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha("#FFFFFF", 0.75),
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#FFFFFF", 0.5)}`,
            boxShadow: isDarkMode
              ? `0 32px 100px -24px ${alpha("#000000", 0.6)}, inset 0 1px 0 ${alpha("#FFFFFF", 0.05)}`
              : `0 32px 100px -24px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}`,
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              boxShadow: isDarkMode
                ? `0 40px 120px -24px ${alpha("#000000", 0.7)}`
                : `0 40px 120px -24px ${alpha(theme.palette.primary.main, 0.25)}`,
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 5,
              pt: 5,
              pb: 4,
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Logo Container Premium */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: 2.5,
                mb: 3,
                bgcolor: isDarkMode
                  ? alpha("#FFFFFF", 0.08)
                  : alpha(theme.palette.primary.main, 0.08),
                boxShadow: isDarkMode
                  ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}, 0 8px 32px -8px ${alpha("#000000", 0.3)}`
                  : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}, 0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.2)}`,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05) rotate(-2deg)",
                },
              }}
            >
              <Box
                component="img"
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Nix Logo"
                sx={{
                  width: 56,
                  height: 56,
                }}
              />
            </Box>

            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                letterSpacing: "-0.03em",
                mb: 1,
                background: isDarkMode
                  ? `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {isSignUp ? "Criar Conta" : "Bem-vindo de Volta"}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {isSignUp
                ? "Comece a gerenciar suas finanças hoje"
                : "Acesse seu dashboard financeiro"}
            </Typography>
          </Box>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              px: 5,
              pb: 5,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                {error}
              </Alert>
            )}

            {message && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                {message}
              </Alert>
            )}

            {/* Name field - only for signup */}
            {isSignUp && (
              <TextField
                fullWidth
                label="Seu Nome"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="João Silva"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
            )}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              inputProps={{ minLength: 6 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {/* Submit Button - Premium & Inviting */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              fullWidth
              endIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ArrowForwardIcon />
                )
              }
              sx={{
                py: 2,
                mt: 1,
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: "1.05rem",
                letterSpacing: "0.01em",
                textTransform: "none",
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.5)}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 12px 40px -8px ${alpha(theme.palette.primary.main, 0.6)}`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                "&:disabled": {
                  background: isDarkMode
                    ? alpha("#FFFFFF", 0.1)
                    : alpha("#000000", 0.1),
                },
              }}
            >
              {isLoading
                ? "Carregando..."
                : isSignUp
                  ? "Criar Conta"
                  : "Entrar"}
            </Button>

            {/* Toggle Link */}
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                sx={{
                  cursor: "pointer",
                  fontWeight: 500,
                  color: "primary.main",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    textDecoration: "underline",
                    color: "primary.dark",
                  },
                }}
              >
                {isSignUp
                  ? "Já tem uma conta? Entre aqui"
                  : "Não tem conta? Cadastre-se"}
              </Link>
            </Box>
          </Box>

          {/* Footer - AI Badge */}
          <Box
            sx={{
              px: 5,
              py: 2.5,
              textAlign: "center",
              borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.default, 0.3)
                : alpha(theme.palette.grey[50], 0.5),
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2.5,
                py: 1,
                borderRadius: 2.5,
                bgcolor: isDarkMode
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.06),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              <SparklesIcon
                sx={{
                  fontSize: 16,
                  color: "primary.main",
                  animation: "sparkle 2s ease-in-out infinite",
                  "@keyframes sparkle": {
                    "0%, 100%": { opacity: 1, transform: "scale(1)" },
                    "50%": { opacity: 0.7, transform: "scale(1.1)" },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                  letterSpacing: "0.02em",
                }}
              >
                Análises financeiras com Gemini AI
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Security Badge */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mt: 3,
            opacity: 0.7,
          }}
        >
          <FingerprintIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Seus dados estão protegidos com criptografia de ponta
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginView;
