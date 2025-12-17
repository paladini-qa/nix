import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as UserIcon,
  Email as MailIcon,
  Key as KeyIcon,
  Check as CheckIcon,
  ErrorOutline as AlertCircleIcon,
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
      setErrorMessage("Please enter a valid email address.");
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
      setErrorMessage(err.message || "Error updating email.");
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
      setErrorMessage(err.message || "Error sending reset email.");
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
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <UserIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userEmail}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Error Message */}
          {errorMessage && (
            <Alert severity="error" icon={<AlertCircleIcon fontSize="small" />}>
              {errorMessage}
            </Alert>
          )}

          {/* Display Name Section */}
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <UserIcon fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                Display Name
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                value={localDisplayName}
                onChange={(e) => setLocalDisplayName(e.target.value)}
                placeholder="Enter your name..."
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <Button
                variant={nameStatus === "saved" ? "contained" : "contained"}
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
                sx={{ minWidth: 100 }}
              >
                {nameStatus === "saved" ? "Saved" : "Save"}
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Change Email Section */}
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <MailIcon fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                Change Email
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5 }}
            >
              A confirmation will be sent to both your current and new email.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email..."
                onKeyDown={(e) => e.key === "Enter" && handleChangeEmail()}
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
                sx={{ minWidth: 100 }}
              >
                {emailStatus === "sent" ? "Sent!" : "Change"}
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Reset Password Section */}
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <KeyIcon fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                Reset Password
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5 }}
            >
              A password reset link will be sent to {userEmail}
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
            >
              {passwordStatus === "sent" ? "Email Sent!" : "Send Reset Email"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;


