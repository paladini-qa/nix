import React, { Suspense, lazy, useState, useCallback } from "react";
import {
  Box,
  IconButton,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  AutoAwesome as SparklesIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import type { Transaction, ParsedTransaction } from "../types";

const NixAIView = lazy(() => import("./NixAIView"));

const MotionBox = motion.create(Box);

interface NixAIChatBubbleProps {
  transactions: Transaction[];
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  onTransactionCreate: (
    tx: Omit<ParsedTransaction, "confidence" | "rawInput">
  ) => void;
  getPaymentMethodPaymentDay: (method: string) => number | undefined;
}

const BUBBLE_SIZE = 56;
const PANEL_WIDTH = 420;
const PANEL_HEIGHT = "min(720px, calc(100vh - 112px))";

const NixAIChatBubble: React.FC<NixAIChatBubbleProps> = ({
  transactions,
  categories,
  paymentMethods,
  onTransactionCreate,
  getPaymentMethodPaymentDay,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1300,
        // Somente desktop
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1.5,
        pointerEvents: "none",
      }}
    >
      {/* Popup panel */}
      <AnimatePresence>
        {open && (
          <MotionBox
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            sx={{
              width: PANEL_WIDTH,
              height: PANEL_HEIGHT,
              borderRadius: "20px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              pointerEvents: "all",
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.95)
                : alpha("#FFFFFF", 0.98),
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${
                isDark ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.07)
              }`,
              boxShadow: isDark
                ? `0 32px 80px -16px ${alpha("#000000", 0.7)}, 0 0 0 1px ${alpha("#FFFFFF", 0.05)}`
                : `0 32px 80px -16px ${alpha(theme.palette.primary.main, 0.22)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.06)}`,
              transformOrigin: "bottom right",
            }}
          >
            {/* NixAIView content */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Suspense
                fallback={
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress size={32} />
                  </Box>
                }
              >
                <NixAIView
                  transactions={transactions}
                  categories={categories}
                  paymentMethods={paymentMethods}
                  onTransactionCreate={onTransactionCreate}
                  getPaymentMethodPaymentDay={getPaymentMethodPaymentDay}
                />
              </Suspense>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Botão flutuante */}
      <MotionBox
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        sx={{ pointerEvents: "all" }}
      >
        <Tooltip title={open ? "Fechar Nix AI" : "Abrir Nix AI"} placement="left">
          <Box
            component="button"
            onClick={toggle}
            aria-label="Nix AI chat"
            sx={{
              width: BUBBLE_SIZE,
              height: BUBBLE_SIZE,
              borderRadius: "18px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: open
                ? `linear-gradient(135deg, ${alpha("#8A2BE2", 0.85)} 0%, ${alpha("#6A0DAD", 0.9)} 100%)`
                : "linear-gradient(135deg, #8A2BE2 0%, #6A0DAD 100%)",
              boxShadow: open
                ? `0 8px 28px -4px ${alpha("#8A2BE2", 0.6)}, 0 0 0 4px ${alpha("#8A2BE2", 0.15)}`
                : `0 6px 20px -4px ${alpha("#8A2BE2", 0.5)}`,
              transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              "&:hover": {
                boxShadow: `0 8px 28px -4px ${alpha("#8A2BE2", 0.65)}, 0 0 0 4px ${alpha("#8A2BE2", 0.15)}`,
              },
            }}
          >
            <AnimatePresence mode="wait">
              {open ? (
                <MotionBox
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <CloseIcon sx={{ fontSize: 24, color: "#fff" }} />
                </MotionBox>
              ) : (
                <MotionBox
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <SparklesIcon sx={{ fontSize: 24, color: "#fff" }} />
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>
        </Tooltip>
      </MotionBox>
    </Box>
  );
};

export default NixAIChatBubble;
