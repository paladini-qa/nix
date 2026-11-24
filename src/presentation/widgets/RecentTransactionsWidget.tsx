import { paymentMethodLabel } from "@/shared/i18n/labels";
import React from "react";
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Button,
} from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import { Transaction } from "@/domain/entities";
import { usePrivacyMode } from "@/presentation/hooks";
import { useSettings } from "@/presentation/contexts";
import PaymentMethodIcon from "@/presentation/components/ui/PaymentMethodIcon";

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  transactions,
  onViewAll,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { privacyStyles } = usePrivacyMode();
  const { getPaymentMethodConfig, getPaymentMethodColor, getCategoryColor } = useSettings();

  // 6 transações mais recentes
  const recentTransactions = [...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  if (recentTransactions.length === 0) return null;

  const bgElev   = isDark ? "#131317" : "#ffffff";
  const border   = isDark ? "#27272d" : "#e4e4e7";
  const borderSub = isDark ? "#1c1c22" : "#f1f1f4";
  const text2    = isDark ? "#a1a1aa" : "#52525b";
  const bgSubtle = isDark ? "#1c1c22" : "#f4f4f5";
  const shadowSm = isDark
    ? "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)"
    : "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)";

  return (
    <Box
      sx={{
        background: bgElev,
        border: `1px solid ${border}`,
        borderRadius: "14px",
        boxShadow: shadowSm,
        overflow: "hidden",
      }}
    >
      {/* Cabeçalho do card */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "18px",
          pt: "16px",
          pb: "12px",
          borderBottom: `1px solid ${borderSub}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: isDark ? "#fafafa" : "#18181b",
          }}
        >
          Lançamentos Recentes
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 13, color: text2 }}>Últimos lançamentos</Typography>
          {onViewAll && (
            <Button
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
              onClick={onViewAll}
              sx={{
                fontSize: 12,
                fontWeight: 600,
                py: 0.25,
                px: 1,
                borderRadius: "8px",
                textTransform: "none",
                color: "#a855f7",
                minWidth: 0,
              }}
            >
              Ver todos
            </Button>
          )}
        </Box>
      </Box>

      {/* Lista de transações */}
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
        <Box component="tbody">
          {recentTransactions.map((tx, index) => {
            const isIncome = tx.type === "income";
            const methodConfig = getPaymentMethodConfig(tx.paymentMethod);
            const methodColors = getPaymentMethodColor(tx.paymentMethod);
            const catColors = getCategoryColor(tx.type, tx.category);

            return (
              <Box
                component="tr"
                key={tx.id}
                sx={{
                  borderBottom: index < recentTransactions.length - 1 ? `1px solid ${borderSub}` : "none",
                  "&:hover": { background: isDark ? alpha("#ffffff", 0.03) : alpha("#000000", 0.02) },
                  transition: "background 0.12s",
                  cursor: "default",
                }}
              >
                {/* Ícone da categoria / meio de pagamento */}
                <Box component="td" sx={{ width: 40, pl: "14px", py: "12px", verticalAlign: "middle" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "12px",
                      background: alpha(catColors.primary, isDark ? 0.18 : 0.12),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <PaymentMethodIcon
                      imageUrl={methodConfig?.imageUrl}
                      colors={methodColors}
                      type={methodConfig?.type}
                      size={24}
                      borderRadius="8px"
                      iconSize={14}
                    />
                  </Box>
                </Box>

                {/* Descrição e meta */}
                <Box component="td" sx={{ py: "12px", px: "14px", verticalAlign: "middle" }}>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: isDark ? "#fafafa" : "#18181b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "220px",
                    }}
                  >
                    {tx.description}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 12, color: text2, mt: "1px" }}
                  >
                    {formatDate(tx.date)} · {paymentMethodLabel(tx.paymentMethod)}
                  </Typography>
                </Box>

                {/* Valor */}
                <Box component="td" sx={{ pr: "18px", py: "12px", textAlign: "right", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      color: isIncome ? "#10b981" : isDark ? "#fafafa" : "#18181b",
                      ...privacyStyles,
                    }}
                  >
                    {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default RecentTransactionsWidget;
