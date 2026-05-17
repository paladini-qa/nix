// Motion Components - Framer Motion integration for Nix
// =====================================================

// Core motion-enabled MUI Box
export { default as MotionBox } from "@/presentation/components/motion/MotionBox";
export type { MotionBoxProps } from "@/presentation/components/motion/MotionBox";
export {
  fadeInUp,
  fadeIn,
  scaleIn,
  slideInRight,
  slideInLeft,
  springTransition,
  smoothSpring,
  gentleSpring,
} from "@/presentation/components/motion/MotionBox";

// Animated Card with hover effects
export { default as AnimatedCard } from "@/presentation/components/motion/AnimatedCard";
export type { AnimatedCardProps } from "@/presentation/components/motion/AnimatedCard";
export { cardVariants } from "@/presentation/components/motion/AnimatedCard";

// Staggered list animations
export { default as AnimatedList } from "@/presentation/components/motion/AnimatedList";
export type { AnimatedListProps } from "@/presentation/components/motion/AnimatedList";
export {
  listItemVariants,
  scaleListItemVariants,
  slideInLeftVariants,
} from "@/presentation/components/motion/AnimatedList";

// Animated number counting
export { default as CountUp } from "@/presentation/components/motion/CountUp";
export type { CountUpProps } from "@/presentation/components/motion/CountUp";
export {
  useCountUp,
  formatBRL,
  formatBRLFull,
  formatPercent,
} from "@/presentation/components/motion/CountUp";

// Page/View transitions
export { default as PageTransition } from "@/presentation/components/motion/PageTransition";
export type { PageTransitionProps, TransitionType } from "@/presentation/components/motion/PageTransition";
export { FadeIn, StaggerContainer, StaggerItem } from "@/presentation/components/motion/PageTransition";

