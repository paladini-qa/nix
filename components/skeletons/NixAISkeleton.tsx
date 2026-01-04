import React from "react";
import { Box, Skeleton, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";

const MotionBox = motion.create(Box);

/**
 * Skeleton loader para o chat de IA do Nix.
 * Simula a estrutura de um relatório financeiro enquanto a IA processa.
 * 
 * Características:
 * - Estrutura de relatório: título, parágrafos, lista de categorias, gráfico
 * - Animação wave do MUI Skeleton
 * - Cores da paleta Nix (Purple/Teal)
 * - Entrada animada com framer-motion
 */
const NixAISkeleton: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Cores Nix
  const nixPurple = "#8A2BE2";
  const cyberTeal = "#00D4FF";

  const skeletonColor = isDarkMode
    ? alpha(nixPurple, 0.15)
    : alpha(nixPurple, 0.08);

  const highlightColor = isDarkMode
    ? alpha(cyberTeal, 0.2)
    : alpha(cyberTeal, 0.1);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
        borderRadius: "20px",
        background: isDarkMode
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
          : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.9)} 0%, ${alpha("#FFFFFF", 0.7)} 100%)`,
        backdropFilter: "blur(12px)",
        border: `1px solid ${isDarkMode ? alpha(nixPurple, 0.15) : alpha(nixPurple, 0.1)}`,
        boxShadow: `0 8px 32px -8px ${alpha(nixPurple, 0.15)}`,
      }}
    >
      {/* Título do Relatório */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Skeleton
          variant="circular"
          width={36}
          height={36}
          animation="wave"
          sx={{
            bgcolor: skeletonColor,
          }}
        />
        <Skeleton
          variant="text"
          width="60%"
          height={28}
          animation="wave"
          sx={{
            bgcolor: skeletonColor,
            borderRadius: "8px",
          }}
        />
      </Box>

      {/* Resumo / Parágrafo Inicial */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Skeleton
          variant="text"
          width="100%"
          height={16}
          animation="wave"
          sx={{ bgcolor: skeletonColor, borderRadius: "4px" }}
        />
        <Skeleton
          variant="text"
          width="95%"
          height={16}
          animation="wave"
          sx={{ bgcolor: skeletonColor, borderRadius: "4px" }}
        />
        <Skeleton
          variant="text"
          width="80%"
          height={16}
          animation="wave"
          sx={{ bgcolor: skeletonColor, borderRadius: "4px" }}
        />
      </Box>

      {/* Cards de Resumo (Income/Expense/Balance) */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              minWidth: 80,
              p: 1.5,
              borderRadius: "12px",
              bgcolor: i === 1 ? alpha("#059669", 0.08) : i === 2 ? alpha("#DC2626", 0.08) : highlightColor,
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.05)}`,
            }}
          >
            <Skeleton
              variant="text"
              width="60%"
              height={12}
              animation="wave"
              sx={{ bgcolor: alpha(isDarkMode ? "#FFFFFF" : "#000000", 0.1), borderRadius: "4px", mb: 0.5 }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={20}
              animation="wave"
              sx={{ bgcolor: alpha(isDarkMode ? "#FFFFFF" : "#000000", 0.15), borderRadius: "6px" }}
            />
          </Box>
        ))}
      </Box>

      {/* Lista de Categorias */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Skeleton
          variant="text"
          width="40%"
          height={20}
          animation="wave"
          sx={{ bgcolor: skeletonColor, borderRadius: "6px", mb: 0.5 }}
        />
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1,
              borderRadius: "10px",
              bgcolor: isDarkMode ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02),
            }}
          >
            <Skeleton
              variant="circular"
              width={24}
              height={24}
              animation="wave"
              sx={{ bgcolor: skeletonColor }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton
                variant="text"
                width={`${60 + Math.random() * 30}%`}
                height={14}
                animation="wave"
                sx={{ bgcolor: skeletonColor, borderRadius: "4px" }}
              />
            </Box>
            <Skeleton
              variant="text"
              width={60}
              height={16}
              animation="wave"
              sx={{ bgcolor: skeletonColor, borderRadius: "4px" }}
            />
          </Box>
        ))}
      </Box>

      {/* Gráfico Placeholder */}
      <Box
        sx={{
          height: 120,
          borderRadius: "16px",
          bgcolor: isDarkMode ? alpha("#FFFFFF", 0.03) : alpha("#000000", 0.02),
          border: `1px dashed ${isDarkMode ? alpha(nixPurple, 0.2) : alpha(nixPurple, 0.15)}`,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          p: 2,
          gap: 1,
        }}
      >
        {[40, 70, 55, 85, 60, 45, 75].map((height, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={20}
            height={`${height}%`}
            animation="wave"
            sx={{
              bgcolor: i % 2 === 0 ? alpha(nixPurple, 0.3) : alpha(cyberTeal, 0.3),
              borderRadius: "4px 4px 0 0",
            }}
          />
        ))}
      </Box>

      {/* Insights / Dicas */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: "12px",
          bgcolor: alpha(cyberTeal, 0.08),
          border: `1px solid ${alpha(cyberTeal, 0.2)}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
        }}
      >
        <Skeleton
          variant="circular"
          width={20}
          height={20}
          animation="wave"
          sx={{ bgcolor: alpha(cyberTeal, 0.3), flexShrink: 0, mt: 0.5 }}
        />
        <Box sx={{ flex: 1 }}>
          <Skeleton
            variant="text"
            width="90%"
            height={14}
            animation="wave"
            sx={{ bgcolor: alpha(cyberTeal, 0.2), borderRadius: "4px" }}
          />
          <Skeleton
            variant="text"
            width="70%"
            height={14}
            animation="wave"
            sx={{ bgcolor: alpha(cyberTeal, 0.2), borderRadius: "4px" }}
          />
        </Box>
      </Box>

      {/* Typing indicator dots */}
      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", pt: 1 }}>
        {[0, 1, 2].map((i) => (
          <MotionBox
            key={i}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: nixPurple,
            }}
          />
        ))}
      </Box>
    </MotionBox>
  );
};

export default NixAISkeleton;

