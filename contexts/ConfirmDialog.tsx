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
} from "@mui/material";
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Help as HelpIcon,
} from "@mui/icons-material";

type DialogVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDelete: (itemName: string) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
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

  const handleClose = (confirmed: boolean) => {
    setOpen(false);
    if (resolveRef) {
      resolveRef(confirmed);
      setResolveRef(null);
    }
    // Limpa options após animação de fechamento
    setTimeout(() => setOptions(null), 200);
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
      default:
        return {
          icon: <HelpIcon sx={{ fontSize: 32, color: "primary.main" }} />,
          iconBg: "primary.light",
          confirmColor: "primary" as const,
        };
    }
  };

  const variantStyles = options ? getVariantStyles(options.variant) : getVariantStyles("info");

  return (
    <ConfirmDialogContext.Provider value={{ confirm, confirmDelete }}>
      {children}
      <Dialog
        open={open}
        onClose={() => handleClose(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        {options && (
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
                  {options.title}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: "text.secondary" }}>
                {options.message}
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button onClick={() => handleClose(false)} color="inherit">
                {options.cancelText || "Cancel"}
              </Button>
              <Button
                onClick={() => handleClose(true)}
                variant="contained"
                color={variantStyles.confirmColor}
                autoFocus
              >
                {options.confirmText || "Confirm"}
              </Button>
            </DialogActions>
          </>
        )}
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

