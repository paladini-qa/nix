import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  AllInclusive as AllIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  AutorenewOutlined as AutorenewIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

export type DeleteOption = "single" | "all_future" | "all";

interface DeleteOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: DeleteOption) => void;
  transaction: Transaction | null;
}

const DeleteOptionsDialog: React.FC<DeleteOptionsDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  transaction,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  if (!transaction) return null;

  const isVirtual = transaction.isVirtual;
  const isRecurring = transaction.isRecurring || isVirtual;
  const isInstallment = transaction.installments && transaction.installments > 1;
  
  // Determina o tipo e ícone baseado na transação
  const getTypeInfo = () => {
    if (isVirtual) {
      return {
        icon: <AutorenewIcon color="info" />,
        title: "Excluir Ocorrência Automática",
        subtitle: "Transação recorrente gerada automaticamente",
      };
    }
    if (isInstallment) {
      return {
        icon: <CreditCardIcon color="warning" />,
        title: "Excluir Transação Parcelada",
        subtitle: `Parcela ${transaction.currentInstallment || 1} de ${transaction.installments}`,
      };
    }
    if (isRecurring) {
      return {
        icon: <RepeatIcon color="primary" />,
        title: "Excluir Transação Recorrente",
        subtitle: transaction.frequency === "monthly" ? "Recorrência mensal" : "Recorrência anual",
      };
    }
    return {
      icon: <TodayIcon color="error" />,
      title: "Excluir Transação",
      subtitle: transaction.description,
    };
  };

  const typeInfo = getTypeInfo();

  // Textos baseados no tipo de transação
  const getSingleText = () => {
    if (isVirtual) {
      return {
        primary: "Apenas esta ocorrência",
        secondary: "Esta ocorrência não aparecerá mais neste mês",
      };
    }
    if (isInstallment) {
      return {
        primary: "Apenas esta parcela",
        secondary: `Excluir somente a parcela ${transaction.currentInstallment || 1}/${transaction.installments}`,
      };
    }
    return {
      primary: "Apenas esta ocorrência",
      secondary: "Excluir somente esta ocorrência específica",
    };
  };

  const getFutureText = () => {
    if (isVirtual) {
      return {
        primary: "Esta e todas as futuras",
        secondary: "Parar a recorrência a partir deste mês",
      };
    }
    if (isInstallment) {
      return {
        primary: "Esta e as próximas parcelas",
        secondary: `Excluir parcelas ${transaction.currentInstallment || 1} até ${transaction.installments}`,
      };
    }
    return {
      primary: "Esta e todas as futuras",
      secondary: "Excluir a partir desta ocorrência",
    };
  };

  const getAllText = () => {
    if (isVirtual || isRecurring) {
      return {
        primary: "Todas as ocorrências",
        secondary: "Excluir a transação recorrente completamente",
      };
    }
    if (isInstallment) {
      return {
        primary: "Todas as parcelas",
        secondary: `Excluir todas as ${transaction.installments} parcelas`,
      };
    }
    return {
      primary: "Todas as ocorrências",
      secondary: "Excluir tudo relacionado a esta transação",
    };
  };

  const singleText = getSingleText();
  const futureText = getFutureText();
  const allText = getAllText();

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: "20px",
          bgcolor: isDarkMode 
            ? alpha(theme.palette.background.paper, 0.95)
            : theme.palette.background.paper,
          backdropFilter: "blur(10px)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "20px",
              bgcolor: isDarkMode 
                ? alpha(theme.palette.error.main, 0.15)
                : alpha(theme.palette.error.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {typeInfo.icon}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {typeInfo.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
              {transaction.description}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          O que você deseja excluir?
        </Typography>

        <List disablePadding>
          {/* Opção: Apenas esta */}
          <ListItemButton
            onClick={() => onSelect("single")}
            sx={{
              borderRadius: "20px",
              mb: 1,
              border: 1,
              borderColor: "divider",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "info.main",
                bgcolor: isDarkMode 
                  ? alpha(theme.palette.info.main, 0.1)
                  : alpha(theme.palette.info.main, 0.08),
                transform: "translateY(-1px)",
              },
            }}
          >
            <ListItemIcon>
              <TodayIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography fontWeight={500}>
                  {singleText.primary}
                </Typography>
              }
              secondary={singleText.secondary}
            />
          </ListItemButton>

          {/* Opção: Esta e as futuras */}
          <ListItemButton
            onClick={() => onSelect("all_future")}
            sx={{
              borderRadius: "20px",
              mb: 1,
              border: 1,
              borderColor: "divider",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "warning.main",
                bgcolor: isDarkMode 
                  ? alpha(theme.palette.warning.main, 0.1)
                  : alpha(theme.palette.warning.main, 0.08),
                transform: "translateY(-1px)",
              },
            }}
          >
            <ListItemIcon>
              <DateRangeIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography fontWeight={500}>
                  {futureText.primary}
                </Typography>
              }
              secondary={futureText.secondary}
            />
          </ListItemButton>

          {/* Opção: Todas */}
          <ListItemButton
            onClick={() => onSelect("all")}
            sx={{
              borderRadius: "20px",
              border: 1,
              borderColor: "divider",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "error.main",
                bgcolor: isDarkMode 
                  ? alpha(theme.palette.error.main, 0.1)
                  : alpha(theme.palette.error.main, 0.08),
                transform: "translateY(-1px)",
              },
            }}
          >
            <ListItemIcon>
              <AllIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography fontWeight={500}>
                  {allText.primary}
                </Typography>
              }
              secondary={allText.secondary}
            />
          </ListItemButton>
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button 
          onClick={onClose} 
          color="inherit" 
          fullWidth={isMobile}
          sx={{ borderRadius: "20px" }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteOptionsDialog;

