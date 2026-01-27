import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  IconButton,
  useMediaQuery,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from "@mui/icons-material";
import { OpenFinanceConnection } from "../types";
import { openFinanceService } from "../services/api";
import { useNotification } from "../contexts";

interface EditConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  connection: OpenFinanceConnection;
  paymentMethods: string[];
  userId: string;
}

const EditConnectionDialog: React.FC<EditConnectionDialogProps> = ({
  open,
  onClose,
  connection,
  paymentMethods,
  userId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { showNotification } = useNotification();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    connection.paymentMethodId || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      await openFinanceService.updateConnection(connection.id, userId, {
        paymentMethodId: selectedPaymentMethod || null,
      });

      showNotification({ message: "Conexão atualizada com sucesso", severity: "success" });
      onClose();
    } catch (error: any) {
      console.error("Error updating connection:", error);
      showNotification({
        message: error.message || "Erro ao atualizar conexão",
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : "20px",
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.95)
            : alpha("#FFFFFF", 0.98),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isMobile
            ? "none"
            : `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
          boxShadow: isDarkMode
            ? `0 24px 80px -20px ${alpha("#000000", 0.6)}`
            : `0 24px 80px -20px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: isDarkMode
              ? alpha("#0F172A", 0.8)
              : alpha("#64748B", 0.4),
            backdropFilter: "blur(8px)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Editar Conexão
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "text.primary",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Informações da Conexão */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Instituição
            </Typography>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              {connection.institutionName}
            </Typography>
          </Box>

          <Divider />

          {/* Vincular Payment Method */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Vincular a Método de Pagamento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Vincule esta conexão a um método de pagamento para facilitar a
              categorização das transações
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Método de Pagamento</InputLabel>
              <Select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                label="Método de Pagamento"
                startAdornment={
                  selectedPaymentMethod ? (
                    <LinkIcon sx={{ ml: 1, mr: 0.5, fontSize: 20, color: "text.secondary" }} />
                  ) : (
                    <LinkOffIcon sx={{ ml: 1, mr: 0.5, fontSize: 20, color: "text.secondary" }} />
                  )
                }
                sx={{
                  borderRadius: "12px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderRadius: "12px",
                  },
                }}
              >
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
                {paymentMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={isSaving}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditConnectionDialog;
