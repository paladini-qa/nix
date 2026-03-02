import React from "react";
import { Box, Skeleton, Paper, useTheme, alpha } from "@mui/material";

const GoalsSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const skeletonColor = isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: "20px", bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : alpha("#FFF", 0.85), border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Skeleton variant="circular" width={56} height={56} sx={{ bgcolor: skeletonColor }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={22} sx={{ bgcolor: skeletonColor }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: skeletonColor }} />
            </Box>
            <Skeleton variant="rounded" width={70} height={28} sx={{ bgcolor: skeletonColor }} />
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default GoalsSkeleton;
