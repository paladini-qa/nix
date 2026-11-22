import { Box, ButtonBase, Typography } from "@mui/material";
import type { Transaction } from "@/domain/entities";

interface MobileTransactionRowProps {
  transaction: Transaction;
  amount: string;
  onOpenDetails: (id: string) => void;
  isLast: boolean;
}

export default function MobileTransactionRow({
  transaction,
  amount,
  onOpenDetails,
  isLast,
}: MobileTransactionRowProps) {
  return (
    <ButtonBase
      type="button"
      aria-haspopup="dialog"
      onClick={() => onOpenDetails(transaction.id)}
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) fit-content(42%)",
        alignItems: "center",
        width: "100%",
        minHeight: 56,
        gap: 1.5,
        px: 1.5,
        py: 1,
        textAlign: "left",
        borderBottom: isLast ? 0 : 1,
        borderColor: "divider",
        "&.Mui-focusVisible": { bgcolor: "action.focus" },
      }}
    >
      <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        <Typography component="span" variant="body2" fontWeight={600} display="block">
          {transaction.description}
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary" display="block">
          {transaction.paymentMethod}
        </Typography>
      </Box>
      <Typography
        component="span"
        variant="body2"
        fontWeight={700}
        color={transaction.type === "income" ? "success.main" : "error.main"}
        sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}
      >
        {amount}
      </Typography>
    </ButtonBase>
  );
}
