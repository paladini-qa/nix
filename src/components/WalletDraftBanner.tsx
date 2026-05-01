import React, { useEffect, useRef } from "react";
import { Box, useTheme, alpha } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, X, ArrowRight } from "lucide-react";
import { WalletTransaction } from "../hooks/useWalletSync";

interface WalletDraftBannerProps {
  draft: WalletTransaction | null;
  onConfirm: (draft: WalletTransaction) => void;
  onDismiss: () => void;
  /** Altura da bottom nav em px para posicionamento */
  navHeight?: number;
}

const AUTO_DISMISS_MS = 12_000;

const WalletDraftBanner: React.FC<WalletDraftBannerProps> = ({
  draft,
  onConfirm,
  onDismiss,
  navHeight = 80,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss após 12 segundos
  useEffect(() => {
    if (!draft) return;
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, onDismiss]);

  const formattedAmount = draft
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: draft.currency || "BRL",
        minimumFractionDigits: 2,
      }).format(draft.amount)
    : "";

  return (
    <AnimatePresence>
      {draft && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          style={{
            position: "fixed",
            bottom: `calc(${navHeight}px + env(safe-area-inset-bottom, 0px) + 12px)`,
            left: 12,
            right: 12,
            zIndex: 1250,
          }}
        >
          <Box
            sx={{
              borderRadius: "20px",
              overflow: "hidden",
              background: isDark
                ? alpha(theme.palette.background.paper, 0.94)
                : "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${isDark
                ? alpha(theme.palette.primary.main, 0.18)
                : alpha(theme.palette.primary.main, 0.12)}`,
              boxShadow: isDark
                ? `0 -4px 32px -8px ${alpha(theme.palette.primary.main, 0.3)}, 0 20px 40px -12px rgba(0,0,0,0.5)`
                : `0 -4px 32px -8px ${alpha(theme.palette.primary.main, 0.12)}, 0 20px 40px -12px rgba(0,0,0,0.12)`,
            }}
          >
            {/* Faixa de progresso de auto-dismiss */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
              style={{
                height: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.4)})`,
                transformOrigin: "left center",
              }}
            />

            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
              {/* Ícone */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
                  boxShadow: `0 4px 12px -2px ${alpha(theme.palette.primary.main, 0.4)}`,
                  color: "#fff",
                }}
              >
                <CreditCard size={20} />
              </Box>

              {/* Texto */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    mb: 0.25,
                  }}
                >
                  Google Wallet detectou
                </Box>
                <Box
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "text.primary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {draft.merchant}
                </Box>
                <Box
                  sx={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: theme.palette.primary.main,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formattedAmount}
                </Box>
              </Box>

              {/* Ações */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, flexShrink: 0 }}>
                {/* Registrar */}
                <Box
                  component="button"
                  onClick={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    onConfirm(draft);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
                    color: "#fff",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    minHeight: 36,
                    minWidth: 44,
                    transition: "all 0.15s ease",
                    "&:active": { transform: "scale(0.95)" },
                  }}
                >
                  Registrar
                  <ArrowRight size={13} />
                </Box>

                {/* Ignorar */}
                <Box
                  component="button"
                  onClick={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    onDismiss();
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "12px",
                    border: `1px solid ${isDark
                      ? alpha(theme.palette.text.primary, 0.12)
                      : alpha(theme.palette.text.primary, 0.1)}`,
                    cursor: "pointer",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                    background: "transparent",
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    minHeight: 36,
                    minWidth: 44,
                    transition: "all 0.15s ease",
                    "&:active": { transform: "scale(0.95)" },
                  }}
                >
                  <X size={14} />
                </Box>
              </Box>
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WalletDraftBanner;
