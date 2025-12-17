import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  CircularProgress,
  Link,
} from "@mui/material";
import {
  AutoAwesome as SparklesIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { supabase } from "../services/supabaseClient";

const LoginView: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && !displayName.trim()) {
      setError("Please enter your name.");
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
          "Account created! Check your email to confirm (or log in if confirmation is disabled)."
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
      setError(err.message || "An error occurred.");
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
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Decorations */}
      <Box
        sx={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "50%",
          height: "50%",
          bgcolor: "primary.main",
          opacity: 0.1,
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "50%",
          height: "50%",
          bgcolor: "secondary.main",
          opacity: 0.1,
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ width: "100%", maxWidth: 420, p: 3, zIndex: 1 }}>
        <Paper
          elevation={8}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
          }}
        >
          {/* Header */}
          <Box sx={{ px: 4, pt: 4, pb: 3, textAlign: "center" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                p: 1.5,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark" ? "white" : "transparent",
                borderRadius: "50%",
                mb: 3,
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
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your financial dashboard.
            </Typography>
          </Box>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ px: 4, pb: 4, display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {message && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {message}
              </Alert>
            )}

            {/* Name field - only for signup */}
            {isSignUp && (
              <TextField
                fullWidth
                label="Your Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              inputProps={{ minLength: 6 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

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
                py: 1.5,
                mt: 1,
                fontWeight: "bold",
                borderRadius: 3,
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.25)",
              }}
            >
              {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                sx={{ cursor: "pointer" }}
              >
                {isSignUp
                  ? "Already have an account? Sign in here."
                  : "Don't have an account? Sign up."}
              </Link>
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              bgcolor: "action.hover",
              borderTop: 1,
              borderColor: "divider",
              px: 4,
              py: 2,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}
            >
              <SparklesIcon sx={{ fontSize: 14, color: "primary.main" }} />
              Financial analysis powered by Gemini AI
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginView;
