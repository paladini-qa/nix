import React from "react";
import { Box, alpha } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, pendingCount }) => {
  const visible = !isOnline || pendingCount > 0;
  const text = isOnline
    ? "Há alterações sem confirmação. Confira os lançamentos antes de tentar novamente."
    : "Sem conexão.";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scaleY: 0.8 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -12, scaleY: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          style={{
            position: "fixed",
            top: 64, // abaixo do MobileHeader
            left: 0,
            right: 0,
            zIndex: 1099,
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
            paddingBottom: 4,
            transformOrigin: "top center",
          }}
        >
          <Box
            role="status"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: "20px",
              background: alpha("#f87171", 0.15),
              border: `1px solid ${alpha("#f87171", 0.25)}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "text.primary",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
              boxShadow: `0 4px 12px -4px ${alpha("#f87171", 0.25)}`,
              userSelect: "none",
            }}
          >
            <WifiOff size={14} aria-hidden="true" />
            {text}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
