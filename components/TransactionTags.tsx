import React from "react";
import { Box, Chip, alpha, useTheme } from "@mui/material";
import {
  AutorenewOutlined as AutorenewIcon,
  CreditCard as CreditCardIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

interface TransactionTagsProps {
  transaction: Pick<
    Transaction,
    | "isRecurring"
    | "frequency"
    | "isVirtual"
    | "installments"
    | "currentInstallment"
    | "isShared"
    | "sharedWith"
    | "type"
    | "relatedTransactionId"
    | "isPaid"
  >;
  /** Exibe o status de pagamento (pago/não pago) */
  showPaymentStatus?: boolean;
  /** Exibe a contagem de parcelas no formato X/Yx */
  showInstallments?: boolean;
  /** Exibe a tag "Auto" para transações recorrentes */
  showRecurring?: boolean;
  /** Exibe a tag de compartilhado */
  showShared?: boolean;
}

/**
 * Componente padronizado para exibir tags de transação em formato de pílula.
 * Deve ser posicionado abaixo do título/descrição da transação.
 */
const TransactionTags: React.FC<TransactionTagsProps> = ({
  transaction,
  showPaymentStatus = false,
  showInstallments = true,
  showRecurring = true,
  showShared = true,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Estilo base do Chip - formato pílula moderno
  const getPillChipSx = (color: string) => ({
    height: 22,
    fontSize: "0.625rem",
    fontWeight: 600,
    borderRadius: "11px",
    bgcolor: isDarkMode ? alpha(color, 0.15) : alpha(color, 0.1),
    color: isDarkMode ? alpha(color, 0.9) : color,
    border: "none",
    transition: "all 0.2s ease-in-out",
    "& .MuiChip-icon": {
      ml: 0.5,
      fontSize: 12,
      color: "inherit",
    },
    "& .MuiChip-label": {
      px: 1,
    },
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: `0 4px 12px ${alpha(color, 0.2)}`,
    },
  });

  const t = transaction;

  // Verifica se há alguma tag para exibir
  // Tag "Auto" aparece para qualquer transação recorrente (isRecurring ou isVirtual)
  const hasAnyTag =
    (showShared && t.isShared && t.sharedWith) ||
    (showShared && t.type === "income" && t.relatedTransactionId) ||
    (showRecurring && (t.isRecurring || t.isVirtual)) ||
    (showInstallments && t.installments && t.installments > 1) ||
    showPaymentStatus;

  if (!hasAnyTag) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.75,
        mt: 0.75,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {/* Tag de Compartilhado com amigo */}
      {showShared && t.isShared && t.sharedWith && (
        <Chip
          icon={<PeopleIcon />}
          label={t.sharedWith}
          size="small"
          sx={getPillChipSx(theme.palette.secondary.main)}
        />
      )}

      {/* Tag de Income de despesa compartilhada */}
      {showShared && t.type === "income" && t.relatedTransactionId && (
        <Chip
          icon={<PeopleIcon />}
          label="Shared"
          size="small"
          sx={getPillChipSx(theme.palette.info.main)}
        />
      )}

      {/* Tag "Auto" - aparece para todas as transações recorrentes (incluindo a primeira) */}
      {showRecurring && (t.isRecurring || t.isVirtual) && (
        <Chip
          icon={<AutorenewIcon />}
          label="Auto"
          size="small"
          sx={getPillChipSx(theme.palette.info.main)}
        />
      )}

      {/* Tag de Parcelamento */}
      {showInstallments && t.installments && t.installments > 1 && (
        <Chip
          icon={<CreditCardIcon />}
          label={`${t.currentInstallment || 1}/${t.installments}x`}
          size="small"
          sx={getPillChipSx(theme.palette.warning.main)}
        />
      )}

      {/* Tag de Status de Pagamento */}
      {showPaymentStatus && (
        <Chip
          icon={t.isPaid ? <CheckCircleIcon /> : <ScheduleIcon />}
          label={t.isPaid ? "Pago" : "Pendente"}
          size="small"
          sx={getPillChipSx(
            t.isPaid ? theme.palette.success.main : theme.palette.warning.main
          )}
        />
      )}
    </Box>
  );
};

export default TransactionTags;

