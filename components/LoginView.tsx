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
  Checkbox,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import {
  AutoAwesome as SparklesIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Fingerprint as FingerprintIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
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
  const [rememberMe, setRememberMe] = useState(() => {
    // Inicia marcado se usuário tinha escolhido lembrar antes
    return localStorage.getItem("nix_remember_session") === "true";
  });
  const [showPassword, setShowPassword] = useState(false);

  // Estilos de input premium - mais compactos
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: "transparent",
      transition: "all 0.2s ease-in-out",
      "& fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.15)
          : alpha(theme.palette.primary.main, 0.2),
        borderWidth: 1.5,
        transition: "border-color 0.2s ease-in-out, border-width 0.2s ease-in-out",
      },
      "&:hover fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.3)
          : alpha(theme.palette.primary.main, 0.4),
      },
      "&.Mui-focused": {
        bgcolor: isDarkMode
          ? alpha(theme.palette.primary.main, 0.06)
          : alpha(theme.palette.primary.main, 0.03),
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
    "& .MuiInputLabel-root": {
      fontWeight: 500,
    },
    "& .MuiInputBase-input": {
      py: 1.5,
      // Remove estilos de validação e autofill do navegador
      "&:valid, &:invalid": {
        boxShadow: "none",
        outline: "none",
      },
      "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus": {
        WebkitBoxShadow: `0 0 0 1000px ${isDarkMode ? theme.palette.background.paper : "#FFFFFF"} inset !important`,
        WebkitTextFillColor: `${theme.palette.text.primary} !important`,
        caretColor: theme.palette.text.primary,
        borderRadius: "12px",
      },
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

        // Controla persistência da sessão baseado no checkbox "Manter-me conectado"
        if (rememberMe) {
          // Salva flag para manter sessão persistente
          localStorage.setItem("nix_remember_session", "true");
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/dd2b7fd6-4632-4540-9fb1-253058dcf6c5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginView.tsx:afterLogin',message:'login with rememberMe',data:{rememberMe:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        } else {
          // Remove flag de persistência e marca sessão como temporária
          localStorage.removeItem("nix_remember_session");
          // Usa sessionStorage para indicar que é uma sessão temporária
          // Quando o navegador fechar, sessionStorage é limpo e o App fará signOut
          sessionStorage.setItem("nix_temp_session", "true");
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/dd2b7fd6-4632-4540-9fb1-253058dcf6c5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginView.tsx:afterLogin',message:'login without rememberMe (temp)',data:{rememberMe:false},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        }
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
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        top: 0,
        left: 0,
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
          maxWidth: 400,
          px: 2,
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            // Glassmorphism Premium
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha("#FFFFFF", 0.75),
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#FFFFFF", 0.5)}`,
            boxShadow: isDarkMode
              ? `0 24px 80px -20px ${alpha("#000000", 0.6)}, inset 0 1px 0 ${alpha("#FFFFFF", 0.05)}`
              : `0 24px 80px -20px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}`,
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              boxShadow: isDarkMode
                ? `0 32px 100px -24px ${alpha("#000000", 0.7)}`
                : `0 32px 100px -24px ${alpha(theme.palette.primary.main, 0.25)}`,
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 3.5,
              pt: 3,
              pb: 2,
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
                width: 56,
                height: 56,
                borderRadius: "20px",
                mb: 2,
                bgcolor: isDarkMode
                  ? alpha("#FFFFFF", 0.08)
                  : alpha(theme.palette.primary.main, 0.08),
                boxShadow: isDarkMode
                  ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}, 0 6px 24px -6px ${alpha("#000000", 0.3)}`
                  : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}, 0 6px 24px -6px ${alpha(theme.palette.primary.main, 0.2)}`,
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
                  width: 36,
                  height: 36,
                }}
              />
            </Box>

            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                letterSpacing: "-0.03em",
                mb: 0.5,
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
              variant="body2"
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
              px: 3.5,
              pb: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: "20px",
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  py: 0.5,
                }}
              >
                {error}
              </Alert>
            )}

            {message && (
              <Alert
                severity="success"
                sx={{
                  borderRadius: "20px",
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  py: 0.5,
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
              type={showPassword ? "text" : "password"}
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
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{
                        color: "text.secondary",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          color: "primary.main",
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {/* Remember Me Checkbox - apenas no login */}
            {!isSignUp && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{
                      color: isDarkMode
                        ? alpha("#FFFFFF", 0.5)
                        : alpha(theme.palette.primary.main, 0.5),
                      "&.Mui-checked": {
                        color: "primary.main",
                      },
                      transition: "all 0.2s ease-in-out",
                      p: 0.5,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: "text.secondary",
                      userSelect: "none",
                    }}
                  >
                    Manter-me conectado
                  </Typography>
                }
                sx={{
                  mx: "auto",
                  mt: -0.5,
                  "& .MuiFormControlLabel-label": {
                    ml: 0.5,
                  },
                }}
              />
            )}

            {/* Submit Button - Premium & Inviting */}
            <Button
              type="submit"
              variant="contained"
              size="medium"
              disabled={isLoading}
              fullWidth
              endIcon={
                isLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <ArrowForwardIcon fontSize="small" />
                )
              }
              sx={{
                py: 1.5,
                mt: 0.5,
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "0.95rem",
                letterSpacing: "0.01em",
                textTransform: "none",
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 6px 24px -6px ${alpha(theme.palette.primary.main, 0.5)}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 10px 32px -6px ${alpha(theme.palette.primary.main, 0.6)}`,
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
            <Box sx={{ textAlign: "center", mt: 0.5 }}>
              <Link
                component="button"
                type="button"
                variant="caption"
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
              px: 3.5,
              py: 1.5,
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
                gap: 0.75,
                px: 2,
                py: 0.75,
                borderRadius: "20px",
                bgcolor: isDarkMode
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.06),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              <SparklesIcon
                sx={{
                  fontSize: 14,
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
                  fontSize: "0.7rem",
                }}
              >
                Análises com Gemini AI
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
            gap: 0.75,
            mt: 2,
            opacity: 0.7,
          }}
        >
          <FingerprintIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={500}
            sx={{ fontSize: "0.7rem" }}
          >
            Seus dados estão protegidos com criptografia
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginView;
