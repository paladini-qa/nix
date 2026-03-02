import React from "react";
import { Box, Skeleton, Grid, Paper, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";

const MotionBox = motion.create(Box);

/**
 * Skeleton loader for the Dashboard (AnalyticsView) while charts and data load.
 * Matches layout: summary cards row + chart placeholders.
 */
const DashboardSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const nixPurple = "#9D4EDD";
  const skeletonColor = isDarkMode
    ? alpha(nixPurple, 0.15)
    : alpha(nixPurple, 0.08);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      {/* Summary cards row (mirrors SummaryCards) */}
      <Grid container spacing={2}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "20px",
                background: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.6)
                  : alpha("#FFFFFF", 0.85),
                border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Skeleton
                  variant="circular"
                  width={40}
                  height={40}
                  animation="wave"
                  sx={{ bgcolor: skeletonColor }}
                />
                <Skeleton
                  variant="text"
                  width={80}
                  height={20}
                  animation="wave"
                  sx={{ bgcolor: skeletonColor, borderRadius: "8px" }}
                />
              </Box>
              <Skeleton
                variant="text"
                width="70%"
                height={32}
                animation="wave"
                sx={{ bgcolor: skeletonColor, borderRadius: "8px" }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Chart placeholders (bar + line + pie) */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "20px",
              minHeight: 280,
              background: isDarkMode
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha("#FFFFFF", 0.85),
              border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: skeletonColor }} />
              <Skeleton variant="text" width={140} height={24} sx={{ bgcolor: skeletonColor, borderRadius: "8px" }} />
            </Box>
            <Box
              sx={{
                height: 220,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-around",
                gap: 1,
                px: 1,
              }}
            >
              {[50, 75, 45, 90, 60, 70].map((h, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  width={32}
                  height={h}
                  animation="wave"
                  sx={{ bgcolor: skeletonColor, borderRadius: "6px 6px 0 0" }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "20px",
              minHeight: 280,
              background: isDarkMode
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha("#FFFFFF", 0.85),
              border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: skeletonColor }} />
              <Skeleton variant="text" width={160} height={24} sx={{ bgcolor: skeletonColor, borderRadius: "8px" }} />
            </Box>
            <Box
              sx={{
                height: 220,
                borderRadius: "12px",
                bgcolor: isDarkMode ? alpha("#FFF", 0.03) : alpha("#000", 0.03),
                border: `1px dashed ${alpha(nixPurple, 0.2)}`,
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Full-width chart placeholder */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "20px",
          minHeight: 320,
          background: isDarkMode
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha("#FFFFFF", 0.85),
          border: `1px solid ${isDarkMode ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: skeletonColor }} />
          <Skeleton variant="text" width={180} height={24} sx={{ bgcolor: skeletonColor, borderRadius: "8px" }} />
        </Box>
        <Box
          sx={{
            height: 260,
            borderRadius: "12px",
            bgcolor: isDarkMode ? alpha("#FFF", 0.03) : alpha("#000", 0.03),
            border: `1px dashed ${alpha(nixPurple, 0.2)}`,
          }}
        />
      </Paper>
    </MotionBox>
  );
};

export default DashboardSkeleton;
