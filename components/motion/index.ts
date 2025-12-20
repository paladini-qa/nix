// Motion Components - Framer Motion integration for Nix
// =====================================================

// Core motion-enabled MUI Box
export { default as MotionBox } from "./MotionBox";
export type { MotionBoxProps } from "./MotionBox";
export {
  fadeInUp,
  fadeIn,
  scaleIn,
  slideInRight,
  slideInLeft,
  springTransition,
  smoothSpring,
  gentleSpring,
} from "./MotionBox";

// Animated Card with hover effects
export { default as AnimatedCard } from "./AnimatedCard";
export type { AnimatedCardProps } from "./AnimatedCard";
export { cardVariants } from "./AnimatedCard";

// Staggered list animations
export { default as AnimatedList } from "./AnimatedList";
export type { AnimatedListProps } from "./AnimatedList";
export {
  listItemVariants,
  scaleListItemVariants,
  slideInLeftVariants,
} from "./AnimatedList";

// Animated number counting
export { default as CountUp } from "./CountUp";
export type { CountUpProps } from "./CountUp";
export {
  useCountUp,
  formatBRL,
  formatBRLFull,
  formatPercent,
} from "./CountUp";

// Page/View transitions
export { default as PageTransition } from "./PageTransition";
export type { PageTransitionProps, TransitionType } from "./PageTransition";
export { FadeIn, StaggerContainer, StaggerItem } from "./PageTransition";

