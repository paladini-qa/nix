import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Collapse,
  useTheme,
  alpha,
  Button,
  Tooltip,
} from "@mui/material";
import {
  Autorenew as SubscriptionIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "../types";
import { detectSubscriptions } from "../services/subscriptionService";
import { usePrivacyMode } from "../hooks";

const MotionBox = motion.create(Box);

interface SubscriptionDetectorProps {
  transactions: Transaction[];
  onMarkAsRecurring?: (description: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const SubscriptionDetector: React.FC<SubscriptionDetectorProps> = ({
  transactions,
  onMarkAsRecurring,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { privacyStyles } = usePrivacyMode();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const subscriptions = useMemo(() => {
    return detectSubscriptions(transactions).filter((s) => !dismissed.has(s.description));
  }, [transactions, dismissed]);

  if (subscriptions.length === 0) return null;

  const handleDismiss = (desc: string) => {
    setDismissed((prev) => new Set([...prev, desc]));
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 28, delay: 0.15 }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          overflow: "hidden",
          border: `1px solid ${isDark ? alpha("#f59e0b", 0.2) : alpha("#f59e0b", 0.25)}`,
          background: isDark
            ? `linear-gradient(135deg, ${alpha("#f59e0b", 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
            : `linear-gradient(135deg, ${alpha("#fffbeb", 0.9)} 0%, ${alpha("#FFFFFF", 0.9)} 100%)`,
          boxShadow: `0 4px 20px -6px ${alpha("#f59e0b", 0.15)}`,
        }}
      >
        {/* Header */}
        <Box
          onClick={() => setExpanded((v) => !v)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.5,
            py: 1.75,
            cursor: "pointer",
            "&:hover": { bgcolor: alpha("#f59e0b", 0.04) },
            transition: "background 0.15s ease",
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              bgcolor: alpha("#f59e0b", isDark ? 0.25 : 0.15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <SubscriptionIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              Possíveis assinaturas detectadas
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subscriptions.length} serviço{subscriptions.length > 1 ? "s" : ""} com padrão recorrente
            </Typography>
          </Box>
          <Chip
            label={subscriptions.length}
            size="small"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: alpha("#f59e0b", 0.15),
              color: "#f59e0b",
              border: `1px solid ${alpha("#f59e0b", 0.3)}`,
            }}
          />
          {expanded ? (
            <ExpandLessIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          ) : (
            <ExpandMoreIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          )}
        </Box>

        {/* Subscription list */}
        <Collapse in={expanded}>
          <Box sx={{ px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 0.75 }}>
            <AnimatePresence>
              {subscriptions.map((sub, index) => (
                <MotionBox
                  key={sub.description}
                  initial={{ opacity: 0, x: -12, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28, delay: index * 0.05 }}
                  whileHover={{ x: 3 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: "12px",
                      bgcolor: isDark ? alpha("#FFFFFF", 0.03) : alpha("#FFFFFF", 0.7),
                      border: `1px solid ${isDark ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.05)}`,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sub.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub.occurrences}x detectada · {sub.category}
                        {sub.monthlyPattern && " · mensal"}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: theme.palette.error.main, flexShrink: 0, ...privacyStyles }}>
                      {formatCurrency(sub.amount)}/mês
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                      {onMarkAsRecurring && (
                        <Tooltip title="Marcar como recorrente">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onMarkAsRecurring(sub.description)}
                            sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 10, fontWeight: 600, borderRadius: "8px", height: 24 }}
                          >
                            <CheckIcon sx={{ fontSize: 13 }} />
                          </Button>
                        </Tooltip>
                      )}
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => handleDismiss(sub.description)}
                        sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 10, borderRadius: "8px", height: 24, color: "text.disabled" }}
                      >
                        Ignorar
                      </Button>
                    </Box>
                  </Box>
                </MotionBox>
              ))}
            </AnimatePresence>
          </Box>
        </Collapse>
      </Paper>
    </MotionBox>
  );
};

export default SubscriptionDetector;
