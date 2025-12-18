import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Help as HelpIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

type DialogVariant = "danger" | "warning" | "info" | "success" | "error";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface AlertOptions {
  title: string;
  message: string;
  buttonText?: string;
  variant?: DialogVariant;
}

// Opção para diálogos com múltiplas escolhas
interface ChoiceOption {
  label: string;
  value: string;
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success" | "inherit";
}

interface ChoiceOptions {
  title: string;
  message: string;
  choices: ChoiceOption[];
  variant?: DialogVariant;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDelete: (itemName: string) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  choice: (options: ChoiceOptions) => Promise<string | null>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

type DialogMode = "confirm" | "alert" | "choice";

interface DialogState {
  mode: DialogMode;
  options: ConfirmOptions | AlertOptions | ChoiceOptions | null;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>({ mode: "confirm", options: null });
  const [resolveRef, setResolveRef] = useState<((value: any) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({ mode: "confirm", options: opts });
      setResolveRef(() => resolve);
      setOpen(true);
    });
  }, []);

  const confirmDelete = useCallback(
    (itemName: string): Promise<boolean> => {
      return confirm({
        title: "Confirm Deletion",
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "danger",
      });
    },
    [confirm]
  );

  const alert = useCallback((opts: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setDialogState({ mode: "alert", options: opts });
      setResolveRef(() => resolve);
      setOpen(true);
    });
  }, []);

  const choice = useCallback((opts: ChoiceOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogState({ mode: "choice", options: opts });
      setResolveRef(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleClose = (value: any) => {
    setOpen(false);
    if (resolveRef) {
      resolveRef(value);
      setResolveRef(null);
    }
    // Limpa options após animação de fechamento
    setTimeout(() => setDialogState({ mode: "confirm", options: null }), 200);
  };

  const getVariantStyles = (variant: DialogVariant = "info") => {
    switch (variant) {
      case "danger":
        return {
          icon: <DeleteIcon sx={{ fontSize: 32, color: "error.main" }} />,
          iconBg: "error.light",
          confirmColor: "error" as const,
        };
      case "warning":
        return {
          icon: <WarningIcon sx={{ fontSize: 32, color: "warning.main" }} />,
          iconBg: "warning.light",
          confirmColor: "warning" as const,
        };
      case "success":
        return {
          icon: <SuccessIcon sx={{ fontSize: 32, color: "success.main" }} />,
          iconBg: "success.light",
          confirmColor: "success" as const,
        };
      case "error":
        return {
          icon: <ErrorIcon sx={{ fontSize: 32, color: "error.main" }} />,
          iconBg: "error.light",
          confirmColor: "error" as const,
        };
      default:
        return {
          icon: <InfoIcon sx={{ fontSize: 32, color: "primary.main" }} />,
          iconBg: "primary.light",
          confirmColor: "primary" as const,
        };
    }
  };

  const { mode, options } = dialogState;
  const variantStyles = options ? getVariantStyles(options.variant) : getVariantStyles("info");

  const renderDialogContent = () => {
    if (!options) return null;

    // Confirm dialog
    if (mode === "confirm") {
      const confirmOpts = options as ConfirmOptions;
      return (
        <>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: variantStyles.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {variantStyles.icon}
              </Box>
              <Typography variant="h6" fontWeight={600}>
                {confirmOpts.title}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
              {confirmOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => handleClose(false)} color="inherit">
              {confirmOpts.cancelText || "Cancel"}
            </Button>
            <Button
              onClick={() => handleClose(true)}
              variant="contained"
              color={variantStyles.confirmColor}
              autoFocus
            >
              {confirmOpts.confirmText || "Confirm"}
            </Button>
          </DialogActions>
        </>
      );
    }

    // Alert dialog (apenas OK)
    if (mode === "alert") {
      const alertOpts = options as AlertOptions;
      return (
        <>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: variantStyles.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {variantStyles.icon}
              </Box>
              <Typography variant="h6" fontWeight={600}>
                {alertOpts.title}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
              {alertOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button
              onClick={() => handleClose(undefined)}
              variant="contained"
              color={variantStyles.confirmColor}
              autoFocus
            >
              {alertOpts.buttonText || "OK"}
            </Button>
          </DialogActions>
        </>
      );
    }

    // Choice dialog (múltiplas opções)
    if (mode === "choice") {
      const choiceOpts = options as ChoiceOptions;
      return (
        <>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: variantStyles.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {variantStyles.icon}
              </Box>
              <Typography variant="h6" fontWeight={600}>
                {choiceOpts.title}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "text.secondary", whiteSpace: "pre-line", mb: 2 }}>
              {choiceOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0, flexDirection: "column", gap: 1 }}>
            <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
              {choiceOpts.choices.map((choiceItem) => (
                <Button
                  key={choiceItem.value}
                  onClick={() => handleClose(choiceItem.value)}
                  variant={choiceItem.variant || "contained"}
                  color={choiceItem.color || "primary"}
                  fullWidth
                >
                  {choiceItem.label}
                </Button>
              ))}
              <Button
                onClick={() => handleClose(null)}
                color="inherit"
                fullWidth
              >
                Cancel
              </Button>
            </Stack>
          </DialogActions>
        </>
      );
    }

    return null;
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm, confirmDelete, alert, choice }}>
      {children}
      <Dialog
        open={open}
        onClose={() => handleClose(mode === "confirm" ? false : mode === "alert" ? undefined : null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        {renderDialogContent()}
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
};

// Hook para usar confirmação
export function useConfirmDialog(): ConfirmDialogContextType {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider");
  }
  return context;
}

export default ConfirmDialogContext;

