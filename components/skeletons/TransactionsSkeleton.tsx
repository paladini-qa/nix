import React from "react";
import { Box, Skeleton, Paper, useTheme, alpha } from "@mui/material";

/** Skeleton for TransactionsView (table/card list placeholder). */
const TransactionsSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const skeletonColor = isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "20px",
        overflow: "hidden",
        p: 2,
        bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : alpha("#FFF", 0.9),
        border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}`,
      }}
    >
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Skeleton variant="rounded" width={200} height={40} sx={{ bgcolor: skeletonColor }} />
        <Skeleton variant="rounded" width={120} height={40} sx={{ bgcolor: skeletonColor }} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, borderBottom: `1px solid ${skeletonColor}` }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: skeletonColor }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: skeletonColor }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: skeletonColor }} />
            </Box>
            <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: skeletonColor }} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TransactionsSkeleton;
