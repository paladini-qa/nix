import React, { useEffect, useState, useRef } from "react";
import { Typography, TypographyProps } from "@mui/material";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";

const MotionTypography = motion.create(Typography);

export interface CountUpProps extends Omit<TypographyProps, "children"> {
  /** Target value to count up to */
  value: number;
  /** Duration of the animation in seconds */
  duration?: number;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Format function for the number (e.g., currency formatting) */
  formatter?: (value: number) => string;
  /** Prefix to add before the number */
  prefix?: string;
  /** Suffix to add after the number */
  suffix?: string;
  /** Spring stiffness (higher = faster) */
  stiffness?: number;
  /** Spring damping (higher = less bounce) */
  damping?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Whether to animate on value change */
  animateOnChange?: boolean;
}

/**
 * CountUp - Animated number counting component
 * 
 * Smoothly animates numbers from 0 to target value using spring physics.
 * Perfect for financial dashboards, statistics, and KPIs.
 * 
 * @example
 * <CountUp
 *   value={1500.50}
 *   formatter={(v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
 *   duration={1.5}
 *   variant="h4"
 *   fontWeight={700}
 * />
 */
const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 1,
  delay = 0,
  formatter,
  prefix = "",
  suffix = "",
  stiffness = 100,
  damping = 30,
  decimals = 0,
  animateOnChange = true,
  ...typographyProps
}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  // Calculate spring parameters based on duration
  // Higher stiffness and damping = faster animation
  const springConfig = {
    stiffness: stiffness * (1 / duration),
    damping: damping,
    restDelta: 0.001,
  };

  // Spring value for smooth animation
  const springValue = useSpring(0, springConfig);
  
  // Transform spring value to formatted string
  const displayValue = useTransform(springValue, (latest) => {
    const rounded = decimals > 0 
      ? Number(latest.toFixed(decimals))
      : Math.round(latest);
    
    if (formatter) {
      return `${prefix}${formatter(rounded)}${suffix}`;
    }
    
    return `${prefix}${rounded.toLocaleString()}${suffix}`;
  });

  // Observe when component comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate when in view or value changes
  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        if (animateOnChange || prevValue.current === 0) {
          springValue.set(value);
        }
        prevValue.current = value;
      }, delay * 1000);

      return () => clearTimeout(timeout);
    }
  }, [isInView, value, delay, springValue, animateOnChange]);

  // Update immediately if value changes after initial animation
  useEffect(() => {
    if (isInView && animateOnChange && prevValue.current !== 0) {
      springValue.set(value);
      prevValue.current = value;
    }
  }, [value, isInView, animateOnChange, springValue]);

  return (
    <MotionTypography
      ref={ref}
      {...typographyProps}
      style={{
        display: "inline-block",
        ...typographyProps.style,
      }}
    >
      <motion.span>{displayValue}</motion.span>
    </MotionTypography>
  );
};

export default CountUp;

/**
 * Hook for creating animated number values
 * Use this when you need more control over the animation
 */
export const useCountUp = (
  targetValue: number,
  options: {
    duration?: number;
    delay?: number;
    stiffness?: number;
    damping?: number;
  } = {}
): MotionValue<number> => {
  const { duration = 1, delay = 0, stiffness = 100, damping = 30 } = options;
  
  const springValue = useSpring(0, {
    stiffness: stiffness * (1 / duration),
    damping,
    restDelta: 0.001,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      springValue.set(targetValue);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [targetValue, delay, springValue]);

  return springValue;
};

/**
 * Currency formatter for Brazilian Real
 */
export const formatBRL = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Currency formatter with decimals for Brazilian Real
 */
export const formatBRLFull = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Percentage formatter
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

