import React from "react";
import { Box, Skeleton, Grid, Paper, useTheme, alpha } from "@mui/material";

const CategoriesSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const skeletonColor = isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Skeleton variant="text" width={180} height={28} sx={{ bgcolor: skeletonColor }} />
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: "20px", bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : alpha("#FFF", 0.85), border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}` }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: skeletonColor }} />
                <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: skeletonColor }} />
                <Skeleton variant="text" width={70} height={20} sx={{ bgcolor: skeletonColor }} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CategoriesSkeleton;
