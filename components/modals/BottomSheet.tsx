import React, { useEffect, useRef } from "react";
import {
  Box,
  Paper,
  IconButton,
  Typography,
  useTheme,
  alpha,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";

const MotionPaper = motion.create(Paper);
const MotionBox = motion.create(Box);

export type SnapPoint = "full" | "half" | "quarter";

export interface BottomSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Sheet title */
  title?: string;
  /** Sheet content */
  children: React.ReactNode;
  /** Actions to show at bottom (like buttons) */
  actions?: React.ReactNode;
  /** Initial snap point */
  initialSnap?: SnapPoint;
  /** Available snap points */
  snapPoints?: SnapPoint[];
  /** Disable swipe to dismiss */
  disableSwipeToDismiss?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Max width for desktop dialog mode */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Full screen on mobile (ignores snap points) */
  fullScreenOnMobile?: boolean;
  /** Z-index */
  zIndex?: number;
}

// Snap point heights as percentage of viewport
const snapHeights: Record<SnapPoint, number> = {
  full: 0.92,
  half: 0.5,
  quarter: 0.35,
};

/**
 * BottomSheet - Mobile-first modal component
 * 
 * Features:
 * - Swipe-to-dismiss with velocity detection
 * - Snap points (quarter, half, full)
 * - Glassmorphism styling
 * - Handle for drag affordance
 * - Falls back to Dialog on desktop
 * 
 * @example
 * <BottomSheet
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Add Transaction"
 *   snapPoints={["half", "full"]}
 * >
 *   <TransactionForm />
 * </BottomSheet>
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  initialSnap = "half",
  snapPoints = ["half", "full"],
  disableSwipeToDismiss = false,
  showCloseButton = true,
  maxWidth = "sm",
  fullScreenOnMobile = false,
  zIndex = 1300,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Motion values for drag
  const y = useMotionValue(0);
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  
  // Calculate sheet height based on snap point
  const getSheetHeight = (snap: SnapPoint) => windowHeight * snapHeights[snap];
  const initialHeight = getSheetHeight(initialSnap);
  
  // Transform y position to opacity for backdrop
  const backdropOpacity = useTransform(
    y,
    [0, windowHeight * 0.5],
    [1, 0]
  );

  // Lock body scroll when open
  useEffect(() => {
    if (open && isMobile) {
      document.body.classList.add("sheet-open");
    } else {
      document.body.classList.remove("sheet-open");
    }
    
    return () => {
      document.body.classList.remove("sheet-open");
    };
  }, [open, isMobile]);

  // Handle drag end - snap or dismiss
  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    // Dismiss if dragged down fast or far enough
    if (!disableSwipeToDismiss && (velocity > 500 || offset > windowHeight * 0.3)) {
      onClose();
      return;
    }
    
    // Otherwise, snap back
    y.set(0);
  };

  // Start drag from handle
  const startDrag = (event: React.PointerEvent) => {
    dragControls.start(event);
  };

  // Desktop: use Dialog
  if (!isMobile) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 5,
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.paper, 0.95)
              : alpha("#FFFFFF", 0.98),
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.08)}`,
            boxShadow: isDarkMode
              ? `0 24px 80px -20px ${alpha("#000000", 0.6)}, 0 12px 40px -10px ${alpha(theme.palette.primary.main, 0.15)}`
              : `0 24px 80px -20px ${alpha("#64748B", 0.3)}, 0 12px 40px -10px ${alpha(theme.palette.primary.main, 0.1)}`,
          },
        }}
        sx={{
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(4px)",
            backgroundColor: alpha("#000000", 0.5),
          },
        }}
      >
        {title && (
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 1,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            {showCloseButton && (
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </DialogTitle>
        )}
        <DialogContent sx={{ pt: title ? 1 : 2 }}>
          {children}
        </DialogContent>
        {actions && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            {actions}
          </DialogActions>
        )}
      </Dialog>
    );
  }

  // Mobile: use BottomSheet
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: alpha("#000000", 0.6),
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: zIndex - 1,
            }}
            style={{ opacity: backdropOpacity }}
          />

          {/* Sheet */}
          <MotionPaper
            ref={sheetRef}
            initial={{ y: windowHeight }}
            animate={{ y: fullScreenOnMobile ? 0 : windowHeight - initialHeight }}
            exit={{ y: windowHeight }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 35,
            }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{
              top: fullScreenOnMobile ? 0 : windowHeight - getSheetHeight("full"),
              bottom: 0,
            }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y }}
            elevation={0}
            sx={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              height: fullScreenOnMobile ? "100vh" : getSheetHeight("full"),
              zIndex,
              borderRadius: fullScreenOnMobile ? 0 : "24px 24px 0 0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              // Glassmorphism
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.paper, 0.95)
                : alpha("#FFFFFF", 0.98),
              backdropFilter: "blur(30px) saturate(180%)",
              WebkitBackdropFilter: "blur(30px) saturate(180%)",
              border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
              borderBottom: "none",
              boxShadow: isDarkMode
                ? `0 -8px 40px -10px ${alpha("#000000", 0.5)}, 0 -4px 20px -5px ${alpha(theme.palette.primary.main, 0.1)}`
                : `0 -8px 40px -10px ${alpha("#64748B", 0.2)}`,
              // Safe area
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              touchAction: "none",
            }}
          >
            {/* Drag Handle */}
            <Box
              onPointerDown={startDrag}
              sx={{
                display: "flex",
                justifyContent: "center",
                pt: 1.5,
                pb: 1,
                cursor: "grab",
                touchAction: "none",
                "&:active": {
                  cursor: "grabbing",
                },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 5,
                  borderRadius: 2.5,
                  bgcolor: isDarkMode
                    ? alpha("#FFFFFF", 0.2)
                    : alpha("#000000", 0.15),
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? alpha("#FFFFFF", 0.3)
                      : alpha("#000000", 0.25),
                    width: 48,
                  },
                }}
              />
            </Box>

            {/* Header */}
            {(title || showCloseButton) && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 3,
                  py: 1.5,
                  borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  {title}
                </Typography>
                {showCloseButton && (
                  <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: "text.primary",
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        transform: "scale(1.1)",
                      },
                      "&:active": {
                        transform: "scale(0.95)",
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            )}

            {/* Content */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                px: 3,
                py: 2,
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {children}
            </Box>

            {/* Actions */}
            {actions && (
              <Box
                sx={{
                  p: 3,
                  pt: 2,
                  borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha(theme.palette.grey[50], 0.8),
                }}
              >
                {actions}
              </Box>
            )}
          </MotionPaper>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;

