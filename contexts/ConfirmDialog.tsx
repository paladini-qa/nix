import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Typography,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import NixButton from "../components/radix/Button";
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
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
  const theme = useTheme();
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
        title: "Confirmar exclusão",
        message: `Tem certeza que deseja excluir "${itemName}"? Essa ação não pode ser desfeita.`,
        confirmText: "Excluir",
        cancelText: "Cancelar",
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
          icon: <DeleteIcon sx={{ fontSize: 28, color: "error.main" }} />,
          iconBg: alpha(theme.palette.error.main, 0.12),
          confirmColor: "error" as const,
        };
      case "warning":
        return {
          icon: <WarningIcon sx={{ fontSize: 28, color: "warning.main" }} />,
          iconBg: alpha(theme.palette.warning.main, 0.12),
          confirmColor: "warning" as const,
        };
      case "success":
        return {
          icon: <SuccessIcon sx={{ fontSize: 28, color: "success.main" }} />,
          iconBg: alpha(theme.palette.success.main, 0.12),
          confirmColor: "success" as const,
        };
      case "error":
        return {
          icon: <ErrorIcon sx={{ fontSize: 28, color: "error.main" }} />,
          iconBg: alpha(theme.palette.error.main, 0.12),
          confirmColor: "error" as const,
        };
      default:
        return {
          icon: <InfoIcon sx={{ fontSize: 28, color: "primary.main" }} />,
          iconBg: alpha(theme.palette.primary.main, 0.12),
          confirmColor: "primary" as const,
        };
    }
  };

  const { mode, options } = dialogState;
  const variantStyles = options ? getVariantStyles(options.variant) : getVariantStyles("info");
  const isDark = theme.palette.mode === "dark";

  // Cabeçalho padronizado para todos os modos
  const renderDialogHeader = (title: string) => (
    <DialogTitle sx={{ pb: 1, pt: 2.5, px: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "14px",
            bgcolor: variantStyles.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {variantStyles.icon}
        </Box>
        <Typography variant="h6" fontWeight={700} fontSize="1rem" lineHeight={1.3}>
          {title}
        </Typography>
      </Box>
    </DialogTitle>
  );

  const renderDialogContent = () => {
    if (!options) return null;

    // Confirm dialog
    if (mode === "confirm") {
      const confirmOpts = options as ConfirmOptions;
      return (
        <>
          {renderDialogHeader(confirmOpts.title)}
          <DialogContent sx={{ px: 2.5, pb: 1 }}>
            <DialogContentText sx={{ color: "text.secondary", whiteSpace: "pre-line", fontSize: "0.9rem" }}>
              {confirmOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1.5 }}>
            <NixButton size="medium" variant="soft" color="gray" onClick={() => handleClose(false)}>
              {confirmOpts.cancelText || "Cancelar"}
            </NixButton>
            <NixButton
              size="medium"
              variant="solid"
              color={variantStyles.confirmColor === "error" ? "red" : "purple"}
              onClick={() => handleClose(true)}
            >
              {confirmOpts.confirmText || "Confirmar"}
            </NixButton>
          </DialogActions>
        </>
      );
    }

    // Alert dialog (apenas OK)
    if (mode === "alert") {
      const alertOpts = options as AlertOptions;
      return (
        <>
          {renderDialogHeader(alertOpts.title)}
          <DialogContent sx={{ px: 2.5, pb: 1 }}>
            <DialogContentText sx={{ color: "text.secondary", whiteSpace: "pre-line", fontSize: "0.9rem" }}>
              {alertOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
            <NixButton
              size="medium"
              variant="solid"
              color={variantStyles.confirmColor === "error" ? "red" : "purple"}
              onClick={() => handleClose(undefined)}
            >
              {alertOpts.buttonText || "OK"}
            </NixButton>
          </DialogActions>
        </>
      );
    }

    // Choice dialog (múltiplas opções)
    if (mode === "choice") {
      const choiceOpts = options as ChoiceOptions;
      return (
        <>
          {renderDialogHeader(choiceOpts.title)}
          <DialogContent sx={{ px: 2.5, pb: 1 }}>
            <DialogContentText sx={{ color: "text.secondary", whiteSpace: "pre-line", fontSize: "0.9rem" }}>
              {choiceOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1.5, flexDirection: "column", gap: 1 }}>
            <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
              {choiceOpts.choices.map((choiceItem) => (
                <NixButton
                  key={choiceItem.value}
                  size="medium"
                  variant={choiceItem.variant === "outlined" ? "soft" : "solid"}
                  color="purple"
                  onClick={() => handleClose(choiceItem.value)}
                  style={{ width: "100%" }}
                >
                  {choiceItem.label}
                </NixButton>
              ))}
              <NixButton
                size="medium"
                variant="soft"
                color="gray"
                onClick={() => handleClose(null)}
                style={{ width: "100%" }}
              >
                Cancelar
              </NixButton>
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
          sx: {
            borderRadius: "20px",
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.95)
              : alpha("#FFFFFF", 0.98),
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            boxShadow: isDark
              ? `0 24px 60px -12px ${alpha("#000000", 0.6)}`
              : `0 24px 60px -12px ${alpha(theme.palette.primary.main, 0.18)}`,
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: isDark ? alpha("#0F172A", 0.7) : alpha("#64748B", 0.35),
              backdropFilter: "blur(6px)",
            },
          },
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

