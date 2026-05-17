import React from "react";
import { Box, BoxProps } from "@mui/material";
import { motion, AnimatePresence, Variants } from "framer-motion";

const MotionBox = motion.create(Box);

export type TransitionType = "fade" | "slideUp" | "slideLeft" | "slideRight" | "scale" | "slideDown";

export interface PageTransitionProps extends Omit<BoxProps, "component"> {
  /** Unique key to trigger animation on change */
  transitionKey: string | number;
  /** Type of transition animation */
  type?: TransitionType;
  /** Duration of the animation in seconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Custom variants (overrides type) */
  variants?: Variants;
  /** Animation mode for AnimatePresence */
  mode?: "wait" | "sync" | "popLayout";
}

// Pre-defined transition variants
const transitionVariants: Record<TransitionType, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
};

/**
 * PageTransition - View transition wrapper with fade/slide animations
 * 
 * Wrap your page/view content to add smooth transitions when switching between views.
 * Uses AnimatePresence for proper exit animations.
 * 
 * @example
 * <PageTransition transitionKey={currentView} type="slideUp">
 *   {currentView === "dashboard" && <Dashboard />}
 *   {currentView === "transactions" && <Transactions />}
 * </PageTransition>
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  type = "slideUp",
  duration = 0.3,
  delay = 0,
  variants,
  mode = "wait",
  sx,
  ...props
}) => {
  const selectedVariants = variants || transitionVariants[type];

  // Add transition timing to variants
  const enhancedVariants: Variants = {
    initial: selectedVariants.initial,
    animate: {
      ...selectedVariants.animate,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay,
      },
    },
    exit: {
      ...selectedVariants.exit,
      transition: {
        duration: duration * 0.5, // Exit faster than enter
      },
    },
  };

  return (
    <AnimatePresence mode={mode}>
      <MotionBox
        key={transitionKey}
        variants={enhancedVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        sx={{
          width: "100%",
          willChange: "transform, opacity",
          ...sx,
        }}
        {...props}
      >
        {children}
      </MotionBox>
    </AnimatePresence>
  );
};

export default PageTransition;

/**
 * Simple wrapper for animating a single element on mount
 */
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}> = ({ children, delay = 0, duration = 0.4, direction = "up" }) => {
  const getOffset = () => {
    switch (direction) {
      case "up": return { y: 20 };
      case "down": return { y: -20 };
      case "left": return { x: 20 };
      case "right": return { x: -20 };
      default: return {};
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getOffset() }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay,
        },
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Wrapper for staggered children without needing AnimatedList
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
}> = ({ children, staggerDelay = 0.08, initialDelay = 0 }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: initialDelay,
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Child item for StaggerContainer
 */
export const StaggerItem: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 400,
            damping: 30,
          },
        },
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
};

