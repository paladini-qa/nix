import React from "react";
import { Card, CardProps, useTheme, alpha } from "@mui/material";
import { motion, MotionProps, Variants } from "framer-motion";

// Create motion-enabled Card
const MotionCard = motion.create(Card);

export interface AnimatedCardProps extends Omit<CardProps, "component"> {
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Custom accent color for glow effect on hover */
  glowColor?: string;
  /** Disable hover lift effect */
  disableHoverLift?: boolean;
  /** Animation variants */
  variants?: Variants;
  /** Enable glow effect on hover */
  enableGlow?: boolean;
}

/**
 * AnimatedCard - Card with hover float, glow, and entrance animations
 * 
 * Features:
 * - Smooth entrance animation (fade + slide up)
 * - Hover: lift with spring physics
 * - Optional glow effect with customizable color
 * - Tap feedback
 * 
 * @example
 * <AnimatedCard delay={0.1} glowColor="#6366F1" enableGlow>
 *   <CardContent>Amazing content</CardContent>
 * </AnimatedCard>
 */
const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  delay = 0,
  glowColor,
  disableHoverLift = false,
  variants,
  enableGlow = false,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  
  // Use provided glow color or default to primary
  const accentColor = glowColor || theme.palette.primary.main;
  
  // Default animation variants
  const defaultVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Hover and tap animations - instant response
  const hoverAnimation = disableHoverLift
    ? {}
    : {
        y: -4,
        scale: 1.01,
        transition: {
          type: "tween",
          duration: 0.1,
          ease: "linear",
        },
      };

  const tapAnimation = {
    scale: 0.99,
    transition: {
      type: "tween",
      duration: 0.1,
      ease: "linear",
    },
  };

  // Dynamic glow shadow on hover
  const glowShadow = enableGlow
    ? {
        boxShadow: isDarkMode
          ? `0 16px 48px -8px ${alpha(accentColor, 0.35)}, 0 8px 24px -4px ${alpha("#000000", 0.4)}`
          : `0 16px 48px -8px ${alpha(accentColor, 0.3)}, 0 8px 24px -4px ${alpha("#64748B", 0.12)}`,
      }
    : {};

  return (
    <MotionCard
      variants={variants || defaultVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{
        ...hoverAnimation,
        ...glowShadow,
      }}
      whileTap={tapAnimation}
      sx={{
        cursor: "pointer",
        willChange: "transform",
        ...sx,
      }}
      {...props}
    >
      {children}
    </MotionCard>
  );
};

export default AnimatedCard;

/**
 * Animation variants for cards in a grid/list
 * Use with AnimatedList for staggered entrance
 */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.15,
    },
  },
};

