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
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import TransactionTags from "./TransactionTags";
import { Transaction } from "../types";
import { useSwipeActions, usePrivacyMode } from "../hooks";
import { useCurrency } from "../hooks/useCurrency";

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface SwipeableTransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onOpenMenu?: (element: HTMLElement, transaction: Transaction) => void;
  formatDateShort: (date: string) => string;
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
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { format } = useCurrency();
  const { privacyStyles } = usePrivacyMode();

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
        borderRadius: "14px",
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
          borderRadius: "14px 0 0 14px",
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
          borderRadius: "0 14px 14px 0",
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
          opacity: t.isPaid !== false ? 0.6 : 1,
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
          backdropFilter: "blur(12px)",
          border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.05)}`,
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: "14px",
          boxShadow: isDragging
            ? `0 8px 24px -4px ${alpha(accentColor, 0.25)}`
            : isDarkMode
              ? `0 4px 16px -4px ${alpha(accentColor, 0.15)}`
              : `0 4px 16px -4px ${alpha(accentColor, 0.1)}`,
          transition: isDragging ? "none" : "all 0.15s ease-in-out",
          transform: isDragging ? "scale(1.02)" : undefined,
          zIndex: isDragging ? 10 : 1,
          ...(t.isVirtual && {
            borderStyle: "dashed",
            borderLeftStyle: "solid",
          }),
        }}
      >
        <CardContent
          sx={{
            p: 1.5,
            "&:last-child": { pb: 1.5 },
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
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
              onChange={(e) =>
                onTogglePaid(
                  t.isVirtual && t.originalTransactionId
                    ? t.originalTransactionId
                    : t.id,
                  e.target.checked
                )
              }
              size="small"
              color={t.isVirtual ? "info" : "success"}
              sx={{ mt: -0.5, ml: -1 }}
            />
          </Tooltip>

          {/* Icon */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha(accentColor, 0.2)} 0%, ${alpha(accentColor, 0.1)} 100%)`
                : `linear-gradient(135deg, ${isIncome ? "#D1FAE5" : "#FEE2E2"} 0%, ${alpha(isIncome ? "#D1FAE5" : "#FEE2E2", 0.6)} 100%)`,
              border: `1px solid ${isDarkMode ? alpha(accentColor, 0.2) : alpha(accentColor, 0.15)}`,
              boxShadow: isDarkMode
                ? `inset 0 1px 0 ${alpha("#FFFFFF", 0.1)}`
                : `inset 0 1px 0 ${alpha("#FFFFFF", 0.8)}`,
            }}
          >
            {isIncome ? (
              <ArrowUpIcon sx={{ fontSize: 16, color: accentColor }} />
            ) : (
              <ArrowDownIcon sx={{ fontSize: 16, color: accentColor }} />
            )}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.description}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                color={isIncome ? "success.main" : "error.main"}
                sx={{ flexShrink: 0, ...privacyStyles }}
              >
                {isIncome ? "+" : "-"} {format(t.amount || 0)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatDateShort(t.date)}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                •
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.category}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                •
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.paymentMethod}
              </Typography>
            </Box>

            {/* Tags */}
            <TransactionTags transaction={t} />
          </Box>

          {/* Actions Menu Button */}
          {onOpenMenu && (
            <IconButton
              size="small"
              onClick={(e) => onOpenMenu(e.currentTarget, t)}
              sx={{
                bgcolor: isDarkMode
                  ? alpha(theme.palette.action.hover, 0.3)
                  : alpha(theme.palette.action.hover, 0.5),
                "&:hover": {
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.action.hover, 0.5)
                    : alpha(theme.palette.action.hover, 0.8),
                },
              }}
            >
              <MoreVertIcon fontSize="small" />
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

