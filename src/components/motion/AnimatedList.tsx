import React from "react";
import { Box, BoxProps } from "@mui/material";
import { motion, Variants, AnimatePresence, MotionProps } from "framer-motion";

const MotionBox = motion.create(Box);

export interface AnimatedListProps extends Omit<BoxProps, "component"> {
  /** Delay between each child animation (in seconds) */
  staggerDelay?: number;
  /** Initial delay before first child animates (in seconds) */
  initialDelay?: number;
  /** Animation direction */
  direction?: "up" | "down" | "left" | "right";
  /** Enable AnimatePresence for exit animations */
  enableExitAnimation?: boolean;
  /** Custom variants for children */
  childVariants?: Variants;
}

/**
 * AnimatedList - Wrapper for staggered children animations
 * 
 * Automatically staggers the entrance animation of its children.
 * Works great with lists, grids, and any collection of elements.
 * 
 * @example
 * <AnimatedList staggerDelay={0.1} direction="up">
 *   {items.map(item => (
 *     <motion.div key={item.id} variants={listItemVariants}>
 *       <ItemCard {...item} />
 *     </motion.div>
 *   ))}
 * </AnimatedList>
 */
const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 0.08,
  initialDelay = 0,
  direction = "up",
  enableExitAnimation = true,
  childVariants,
  ...props
}) => {
  // Get offset based on direction
  const getOffset = () => {
    switch (direction) {
      case "up":
        return { y: 20 };
      case "down":
        return { y: -20 };
      case "left":
        return { x: 20 };
      case "right":
        return { x: -20 };
      default:
        return { y: 20 };
    }
  };

  const offset = getOffset();

  // Container variants with stagger
  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: initialDelay,
        staggerChildren: staggerDelay,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1,
      },
    },
  };

  // Default item variants
  const defaultItemVariants: Variants = {
    hidden: {
      opacity: 0,
      ...offset,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      ...offset,
      transition: {
        duration: 0.15,
      },
    },
  };

  const content = (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        // If child already has variants, just wrap it
        // Otherwise, add our default variants
        return (
          <motion.div
            key={child.key || index}
            variants={childVariants || defaultItemVariants}
            style={{ willChange: "transform, opacity" }}
          >
            {child}
          </motion.div>
        );
      })}
    </MotionBox>
  );

  if (enableExitAnimation) {
    return <AnimatePresence mode="wait">{content}</AnimatePresence>;
  }

  return content;
};

export default AnimatedList;

/**
 * Pre-built item variants for common list animations
 */
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Scale-based list item variants (good for grids)
 */
export const scaleListItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Slide-in from left variants (good for sidebars)
 */
export const slideInLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.15,
    },
  },
};

