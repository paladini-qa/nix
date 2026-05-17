import React from "react";
import { Box, Skeleton, Paper, useTheme, alpha } from "@mui/material";

const BudgetsSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const skeletonColor = isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {[1, 2, 3, 4].map((i) => (
        <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "20px", bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : alpha("#FFF", 0.85), border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}` }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: skeletonColor }} />
            <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: skeletonColor }} />
          </Box>
          <Skeleton variant="rounded" height={8} sx={{ bgcolor: skeletonColor, borderRadius: "20px" }} />
        </Paper>
      ))}
    </Box>
  );
};

export default BudgetsSkeleton;
