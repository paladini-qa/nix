import React, { useEffect, useState } from "react";
import { Box, useTheme, alpha } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, CloudUpload, CheckCircle } from "lucide-react";

type SyncState = "offline" | "syncing" | "synced" | "hidden";

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, pendingCount }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [syncState, setSyncState] = useState<SyncState>("hidden");
  const [prevOnline, setPrevOnline] = useState(isOnline);

  useEffect(() => {
    if (!isOnline) {
      setSyncState("offline");
    } else if (!prevOnline && isOnline) {
      // Acabou de voltar online
      if (pendingCount > 0) {
        setSyncState("syncing");
        const timer = setTimeout(() => {
          setSyncState("synced");
          setTimeout(() => setSyncState("hidden"), 1800);
        }, 1600);
        return () => clearTimeout(timer);
      } else {
        setSyncState("synced");
        const timer = setTimeout(() => setSyncState("hidden"), 1800);
        return () => clearTimeout(timer);
      }
    } else if (isOnline && pendingCount === 0 && syncState === "syncing") {
      setSyncState("synced");
      const timer = setTimeout(() => setSyncState("hidden"), 1800);
      return () => clearTimeout(timer);
    }
    setPrevOnline(isOnline);
  }, [isOnline, pendingCount]);

  useEffect(() => {
    setPrevOnline(isOnline);
  }, [isOnline]);

  const config: Record<Exclude<SyncState, "hidden">, {
    bg: string; border: string; color: string; icon: React.ReactNode; text: string;
  }> = {
    offline: {
      bg: isDark ? alpha("#EF4444", 0.15) : alpha("#FEF2F2", 0.95),
      border: isDark ? alpha("#EF4444", 0.25) : alpha("#EF4444", 0.2),
      color: isDark ? "#FCA5A5" : "#DC2626",
      icon: <WifiOff size={14} />,
      text: pendingCount > 0
        ? `Offline — ${pendingCount} alteraç${pendingCount === 1 ? "ão" : "ões"} pendente${pendingCount === 1 ? "" : "s"}`
        : "Sem conexão",
    },
    syncing: {
      bg: isDark ? alpha("#F59E0B", 0.12) : alpha("#FFFBEB", 0.95),
      border: isDark ? alpha("#F59E0B", 0.22) : alpha("#F59E0B", 0.3),
      color: isDark ? "#FCD34D" : "#D97706",
      icon: <CloudUpload size={14} />,
      text: "Sincronizando...",
    },
    synced: {
      bg: isDark ? alpha("#10B981", 0.12) : alpha("#ECFDF5", 0.95),
      border: isDark ? alpha("#10B981", 0.22) : alpha("#10B981", 0.2),
      color: isDark ? "#6EE7B7" : "#059669",
      icon: <CheckCircle size={14} />,
      text: "Sincronizado",
    },
  };

  const visible = syncState !== "hidden";
  const cfg = visible ? config[syncState] : null;

  return (
    <AnimatePresence>
      {visible && cfg && (
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
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: "20px",
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: cfg.color,
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
              boxShadow: `0 4px 12px -4px ${cfg.border}`,
              userSelect: "none",
            }}
          >
            {cfg.icon}
            {cfg.text}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
