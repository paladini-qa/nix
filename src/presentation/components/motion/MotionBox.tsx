import { forwardRef } from "react";
import { Box, BoxProps } from "@mui/material";
import { motion, MotionProps, HTMLMotionProps } from "framer-motion";

// Create a motion-enabled MUI Box component
const MotionBoxBase = motion.create(Box);

export type MotionBoxProps = BoxProps & MotionProps;

/**
 * MotionBox - MUI Box with Framer Motion integration
 * 
 * Combines the styling power of MUI's Box with Framer Motion animations.
 * Use this as the base for all animated containers.
 * 
 * @example
 * <MotionBox
 *   initial={{ opacity: 0, y: 20 }}
 *   animate={{ opacity: 1, y: 0 }}
 *   transition={{ type: "spring", stiffness: 300 }}
 *   sx={{ p: 2, bgcolor: "background.paper" }}
 * >
 *   Content
 * </MotionBox>
 */
const MotionBox = forwardRef<HTMLDivElement, MotionBoxProps>((props, ref) => {
  return <MotionBoxBase ref={ref} {...props} />;
});

MotionBox.displayName = "MotionBox";

export default MotionBox;

// Pre-configured animation variants for common use cases
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Spring transition presets
export const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

export const smoothSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25,
};

export const gentleSpring = {
  type: "spring" as const,
  stiffness: 200,
  damping: 20,
};

