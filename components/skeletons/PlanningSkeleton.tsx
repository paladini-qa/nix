import React from "react";
import { Box, Skeleton, Paper, useTheme, alpha } from "@mui/material";

const PlanningSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const skeletonColor = isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "20px", bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : alpha("#FFF", 0.85), border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}` }}>
          <Skeleton variant="text" width="50%" height={20} sx={{ bgcolor: skeletonColor, mb: 1 }} />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} variant="rounded" width={80} height={32} sx={{ bgcolor: skeletonColor }} />
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default PlanningSkeleton;
