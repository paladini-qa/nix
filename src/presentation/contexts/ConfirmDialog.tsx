import React, { createContext, useContext, useState, useCallback, useId, useRef, ReactNode } from "react";
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
import NixButton from "@/presentation/components/radix/Button";
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

type DialogResult = boolean | string | null | undefined;

interface DialogRequest {
  mode: DialogMode;
  options: ConfirmOptions | AlertOptions | ChoiceOptions;
  resolve: (value: DialogResult) => void;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
  const theme = useTheme();
  const messageId = useId();
  const requests = useRef<DialogRequest[]>([]);
  const [request, setRequest] = useState<DialogRequest>();

  const enqueue = useCallback((next: DialogRequest) => {
    requests.current.push(next);
    if (requests.current.length === 1) setRequest(next);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      enqueue({ mode: "confirm", options, resolve: (value) => resolve(value === true) });
    });
  }, [enqueue]);

  const confirmDelete = useCallback(
    (itemName: string): Promise<boolean> => {
      return confirm({
        title: "Confirmar exclusão",
        message: `Deseja excluir "${itemName}"? Essa ação não pode ser desfeita.`,
        confirmText: "Excluir",
        cancelText: "Cancelar",
        variant: "danger",
      });
    },
    [confirm]
  );

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      enqueue({ mode: "alert", options, resolve: () => resolve() });
    });
  }, [enqueue]);

  const choice = useCallback((options: ChoiceOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      enqueue({ mode: "choice", options, resolve: (value) => resolve(typeof value === "string" ? value : null) });
    });
  }, [enqueue]);

  const handleClose = (value: DialogResult) => {
    if (!request || requests.current[0] !== request) return;
    requests.current.shift();
    request.resolve(value);
    setRequest(requests.current[0]);
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

  const mode = request?.mode;
  const options = request?.options;
  const variantStyles = options ? getVariantStyles(options.variant) : getVariantStyles("info");

  // Cabeçalho padronizado para todos os modos
  const renderDialogHeader = (title: string) => (
    <DialogTitle>
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
          <DialogContent sx={{ pb: 1 }}>
            <DialogContentText id={messageId} sx={{ color: "text.secondary", whiteSpace: "pre-line", fontSize: "0.9rem" }}>
              {confirmOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <NixButton autoFocus size="md" variant="soft" color="gray" onClick={() => handleClose(false)}>
              {confirmOpts.cancelText || "Cancelar"}
            </NixButton>
            <NixButton
              size="md"
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
          <DialogContent sx={{ pb: 1 }}>
            <DialogContentText id={messageId} sx={{ color: "text.secondary", whiteSpace: "pre-line", fontSize: "0.9rem" }}>
              {alertOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <NixButton
              size="md"
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
          <DialogContent sx={{ pb: 1 }}>
            <DialogContentText id={messageId} sx={{ color: "text.secondary", whiteSpace: "pre-line", fontSize: "0.9rem" }}>
              {choiceOpts.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
              {choiceOpts.choices.map((choiceItem) => (
                <NixButton
                  key={choiceItem.value}
                  size="md"
                  variant={choiceItem.variant === "outlined" ? "soft" : "solid"}
                  color="purple"
                  onClick={() => handleClose(choiceItem.value)}
                  style={{ width: "100%" }}
                >
                  {choiceItem.label}
                </NixButton>
              ))}
              <NixButton
                size="md"
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
        open={Boolean(request)}
        onClose={() => handleClose(mode === "confirm" ? false : mode === "alert" ? undefined : null)}
        aria-describedby={messageId}
        maxWidth="xs"
        fullWidth
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

