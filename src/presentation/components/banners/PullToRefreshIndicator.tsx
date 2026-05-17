import React from "react";
import { Box, CircularProgress, useTheme, alpha } from "@mui/material";
import { motion, MotionValue } from "framer-motion";
import { Refresh as RefreshIcon } from "@mui/icons-material";

const MotionBox = motion.create(Box);

interface PullToRefreshIndicatorProps {
  /** Opacidade do indicador (0 a 1) */
  opacity: MotionValue<number>;
  /** Escala do indicador */
  scale: MotionValue<number>;
  /** Rotação do ícone de refresh */
  rotation: MotionValue<number>;
  /** Se está carregando */
  isRefreshing: boolean;
  /** Se está sendo puxado */
  isPulling: boolean;
  /** Deslocamento Y atual */
  y: MotionValue<number>;
}

/**
 * Indicador visual de Pull-to-Refresh.
 * 
 * Características:
 * - Gradiente Nix Purple
 * - Animação suave de rotação
 * - Transição para CircularProgress durante loading
 */
const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  opacity,
  scale,
  rotation,
  isRefreshing,
  isPulling,
  y,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Cor primária Nix Purple
  const nixPurple = "#8A2BE2";
  const cyberTeal = "#00D4FF";

  if (!isPulling && !isRefreshing) {
    return null;
  }

  return (
    <MotionBox
      style={{
        opacity,
        scale,
        y,
      }}
      sx={{
        position: "absolute",
        top: -60,
        left: "50%",
        transform: "translateX(-50%)",
        width: 48,
        height: 48,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDarkMode
          ? `linear-gradient(135deg, ${alpha(nixPurple, 0.3)} 0%, ${alpha(cyberTeal, 0.2)} 100%)`
          : `linear-gradient(135deg, ${alpha(nixPurple, 0.15)} 0%, ${alpha(cyberTeal, 0.1)} 100%)`,
        backdropFilter: "blur(8px)",
        border: `2px solid ${isDarkMode ? alpha(nixPurple, 0.4) : alpha(nixPurple, 0.3)}`,
        boxShadow: `0 4px 20px -4px ${alpha(nixPurple, 0.3)}`,
        zIndex: 100,
      }}
    >
      {isRefreshing ? (
        <CircularProgress
          size={24}
          thickness={3}
          sx={{
            color: nixPurple,
          }}
        />
      ) : (
        <MotionBox
          style={{ rotate: rotation }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RefreshIcon
            sx={{
              fontSize: 24,
              color: nixPurple,
            }}
          />
        </MotionBox>
      )}
    </MotionBox>
  );
};

export default PullToRefreshIndicator;

