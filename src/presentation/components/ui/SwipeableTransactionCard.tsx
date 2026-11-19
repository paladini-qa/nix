import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Checkbox,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import TransactionTags from "@/presentation/components/ui/TransactionTags";
import PaymentMethodIcon from "@/presentation/components/ui/PaymentMethodIcon";
import { Transaction } from "@/domain/entities";
import { useSwipeActions, usePrivacyMode } from "@/presentation/hooks";
import { useCurrency } from "@/presentation/hooks/useCurrency";
import { useSettings } from "@/presentation/contexts";

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface SwipeableTransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onOpenMenu?: (element: HTMLElement, transaction: Transaction) => void;
  formatDateShort: (date: string) => string;
  isLast?: boolean;
}

/**
 * Card de transação com suporte a gestos de swipe para mobile.
 * 
 * - Swipe para esquerda: Revelar botão de deletar
 * - Swipe para direita: Revelar botão de editar
 * - Threshold de 80px para ativar a ação
 * - Haptic feedback ao confirmar ação
 */
const SwipeableTransactionCard: React.FC<SwipeableTransactionCardProps> = ({
  transaction: t,
  onEdit,
  onDelete,
  onTogglePaid,
  onOpenMenu,
  formatDateShort,
  isLast = false,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { format, noWrapStyle } = useCurrency();
  const { privacyStyles } = usePrivacyMode();
  const { getPaymentMethodColor, getPaymentMethodConfig } = useSettings();

  const isIncome = t.type === "income";
  const accentColor = isIncome ? "#059669" : "#DC2626";

  const {
    x,
    controls,
    onDragStart,
    onDrag,
    onDragEnd,
    isDragging,
    swipeDirection,
    leftActionOpacity,
    rightActionOpacity,
    leftActionScale,
    rightActionScale,
  } = useSwipeActions({
    threshold: 80,
    onSwipeLeft: () => onDelete(t.id),
    onSwipeRight: () => onEdit(t),
    enabled: true,
  });

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: isDragging ? "14px" : "0px",
        transition: "border-radius 0.15s ease-in-out",
      }}
    >
      {/* Botão de Editar (revelado com swipe para direita) */}
      <MotionBox
        style={{
          opacity: rightActionOpacity,
          scale: rightActionScale,
        }}
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.7)} 100%)`,
          borderRadius: isDragging ? "14px 0 0 14px" : "0px",
          zIndex: 0,
        }}
      >
        <EditIcon sx={{ color: "#FFFFFF", fontSize: 24 }} />
      </MotionBox>

      {/* Botão de Deletar (revelado com swipe para esquerda) */}
      <MotionBox
        style={{
          opacity: leftActionOpacity,
          scale: leftActionScale,
        }}
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(270deg, ${alpha(theme.palette.error.main, 0.9)} 0%, ${alpha(theme.palette.error.main, 0.7)} 100%)`,
          borderRadius: isDragging ? "0 14px 14px 0" : "0px",
          zIndex: 0,
        }}
      >
        <DeleteIcon sx={{ color: "#FFFFFF", fontSize: 24 }} />
      </MotionBox>

      {/* Card Principal */}
      <MotionCard
        elevation={0}
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.1}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        style={{ x }}
        animate={controls}
        whileTap={{ cursor: "grabbing" }}
        sx={{
          position: "relative",
          overflow: "hidden",
          p: 0,
          opacity: t.isPaid !== false ? 0.65 : 1,
          background: isDarkMode
            ? alpha(theme.palette.background.paper, 0.8)
            : "#ffffff",
          borderBottom: isLast
            ? "none"
            : `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.04)}`,
          borderRadius: isDragging ? "14px" : "0px",
          boxShadow: isDragging
            ? `0 8px 24px -4px ${alpha(accentColor, 0.25)}`
            : "none",
          transition: isDragging ? "none" : "all 0.15s ease-in-out",
          transform: isDragging ? "scale(1.01)" : undefined,
          zIndex: isDragging ? 10 : 1,
          ...(t.isVirtual && {
            borderBottomStyle: "dashed",
          }),
        }}
      >
        <CardContent
          sx={{
            p: 0,
            pr: onOpenMenu ? 0 : 1,
            "&:last-child": { pb: 0 },
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {/* Checkbox */}
          <Tooltip
            title={
              t.isVirtual
                ? "Mark recurring occurrence as paid"
                : t.isPaid !== false
                  ? "Paid"
                  : "Not paid"
            }
          >
            <Checkbox
              checked={t.isPaid !== false}
              onChange={(e) => onTogglePaid(t.id, e.target.checked)}
              size="small"
              color={t.isVirtual ? "info" : "success"}
              inputProps={{ "aria-label": `Payment status for ${t.description}` }}
              sx={{ width: 44, height: 44, p: 0, flexShrink: 0 }}
            />
          </Tooltip>

          <Box sx={{ flex: 2, minWidth: 0, display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" fontWeight={600} noWrap title={t.description} sx={{ fontSize: 12 }}>
              {t.description}
            </Typography>
            <TransactionTags transaction={t} compact />
          </Box>
          <Typography component="time" dateTime={t.date} variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }}>
            {formatDateShort(t.date)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap title={t.category} sx={{ flex: 1, minWidth: 0, fontSize: 10 }}>
            {t.category}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 0.25 }}>
            <PaymentMethodIcon
              imageUrl={getPaymentMethodConfig(t.paymentMethod)?.imageUrl}
              colors={getPaymentMethodColor(t.paymentMethod)}
              size={12}
              borderRadius="3px"
              iconSize={8}
            />
            <Typography variant="caption" color="text.secondary" noWrap title={t.paymentMethod} sx={{ fontSize: 10 }}>
              {t.paymentMethod}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            fontWeight={700}
            color={isIncome ? "success.main" : "error.main"}
            sx={{ flexShrink: 0, fontSize: 12, ...privacyStyles, ...noWrapStyle }}
          >
            {isIncome ? "+" : "-"} {format(t.amount || 0)}
          </Typography>

          {onOpenMenu && (
            <IconButton
              size="small"
              aria-label={`Actions for ${t.description}`}
              onClick={(event) => onOpenMenu(event.currentTarget, t)}
              sx={{ width: 44, height: 44, p: 0, flexShrink: 0 }}
            >
              <MoreVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </CardContent>

        {/* Indicador visual de swipe direction */}
        <AnimatePresence>
          {isDragging && swipeDirection && (
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
                background:
                  swipeDirection === "right"
                    ? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%)`
                    : `linear-gradient(270deg, ${alpha(theme.palette.error.main, 0.1)} 0%, transparent 50%)`,
                zIndex: 2,
              }}
            />
          )}
        </AnimatePresence>
      </MotionCard>
    </Box>
  );
};

export default SwipeableTransactionCard;

