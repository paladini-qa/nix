import React from "react";
import { Box, Skeleton, Grid, Paper, useTheme, alpha } from "@mui/material";

const PaymentMethodsSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const skeletonColor = isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06);

  return (
    <Grid container spacing={2}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "20px", bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : alpha("#FFF", 0.85), border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}` }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Skeleton variant="circular" width={44} height={44} sx={{ bgcolor: skeletonColor }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: skeletonColor }} />
                <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: skeletonColor }} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default PaymentMethodsSkeleton;
