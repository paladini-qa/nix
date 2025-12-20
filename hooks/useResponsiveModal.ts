import { useMediaQuery, useTheme } from "@mui/material";

/**
 * Hook to determine if a BottomSheet should be used instead of a Dialog
 * 
 * Returns true on mobile devices where BottomSheet provides a better UX.
 * Components can use this to conditionally render either a Dialog or BottomSheet.
 * 
 * @example
 * const useBottomSheet = useResponsiveModal();
 * 
 * if (useBottomSheet) {
 *   return <BottomSheet open={open} onClose={onClose}>{children}</BottomSheet>;
 * }
 * return <Dialog open={open} onClose={onClose}>{children}</Dialog>;
 */
export const useResponsiveModal = (): boolean => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  return isMobile;
};

/**
 * Hook to get the appropriate modal props based on screen size
 */
export const useModalProps = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  return {
    isMobile,
    // Use these for Dialog components
    dialogProps: {
      fullScreen: isMobile,
      maxWidth: "sm" as const,
      fullWidth: true,
    },
    // Paper props for glassmorphism styling
    paperProps: {
      borderRadius: isMobile ? 0 : 20,
    },
  };
};

export default useResponsiveModal;

