import React, { Suspense } from "react";
import { Box, CircularProgress, useTheme, alpha } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";

const MotionBox = motion.create(Box);

interface ViewContainerProps {
  /** Unique key to trigger animation on view change */
  viewKey: string;
  /** The view content to render */
  children: React.ReactNode;
  /** Loading fallback (defaults to centered spinner) */
  fallback?: React.ReactNode;
}

/**
 * ViewContainer - Suspense wrapper with animated page transitions
 * 
 * Wraps view components with:
 * - Suspense for lazy loading
 * - AnimatePresence for smooth transitions
 * - Consistent loading state
 */
const ViewContainer: React.FC<ViewContainerProps> = ({
  viewKey,
  children,
  fallback,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const defaultFallback = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        minHeight: 300,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: "20px",
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha("#FFFFFF", 0.8),
            backdropFilter: "blur(20px)",
            boxShadow: isDarkMode
              ? `0 8px 32px -8px ${alpha("#000000", 0.4)}`
              : `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.15)}`,
          }}
        >
          <CircularProgress
            size={40}
            thickness={4}
            sx={{
              color: "primary.main",
            }}
          />
        </Box>
      </motion.div>
    </Box>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <AnimatePresence mode="wait">
        <MotionBox
          key={viewKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 30,
            },
          }}
          exit={{ 
            opacity: 0, 
            y: -8,
            transition: {
              duration: 0.15,
            },
          }}
          sx={{
            width: "100%",
            willChange: "transform, opacity",
          }}
        >
          {children}
        </MotionBox>
      </AnimatePresence>
    </Suspense>
  );
};

export default ViewContainer;

/**
 * Simple loading component for inline use
 */
export const ViewLoading: React.FC<{ size?: number }> = ({ size = 40 }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Box
          sx={{
            width: size + 24,
            height: size + 24,
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isDarkMode
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <CircularProgress size={size} color="primary" />
        </Box>
      </motion.div>
    </Box>
  );
};

