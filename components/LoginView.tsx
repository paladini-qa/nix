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
  ArrowForward as ArrowRightIcon,
  Lock as LockIcon,
  Email as MailIcon,
  Person as UserIcon,
  ErrorOutline as AlertCircleIcon,
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
      {/* Background Decor */}
      <Box
        sx={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "50%",
          height: "50%",
          bgcolor: "primary.main",
          opacity: 0.15,
          borderRadius: "50%",
          filter: "blur(120px)",
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
          opacity: 0.15,
          borderRadius: "50%",
          filter: "blur(120px)",
        }}
      />

      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Paper
          elevation={8}
          sx={{
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
                bgcolor: "primary.main",
                borderRadius: 2,
                boxShadow: 4,
                mb: 3,
              }}
            >
              <Typography
                sx={{ color: "white", fontWeight: "bold", fontSize: 24 }}
              >
                N
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              color="text.primary"
              gutterBottom
            >
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your financial dashboard.
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ px: 4, pb: 4 }}>
            {error && (
              <Alert
                severity="error"
                icon={<AlertCircleIcon fontSize="small" />}
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}

            {message && (
              <Alert
                severity="success"
                icon={<SparklesIcon fontSize="small" />}
                sx={{ mb: 2 }}
              >
                {message}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {isSignUp && (
                <TextField
                  label="Your Name"
                  type="text"
                  fullWidth
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UserIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                fullWidth
                size="large"
                disabled={isLoading}
                endIcon={
                  isLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <ArrowRightIcon />
                  )
                }
                sx={{ py: 1.5, mt: 1 }}
              >
                {isSignUp ? "Sign Up" : "Sign In"}
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
          </Box>

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
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              <SparklesIcon sx={{ fontSize: 14 }} color="primary" />
              Financial analysis powered by Gemini AI
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginView;
