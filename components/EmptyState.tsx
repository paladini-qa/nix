import React from "react";
import { Box, Typography, Button, useTheme, alpha } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { motion } from "framer-motion";

const MotionBox = motion.create(Box);
const MotionButton = motion.create(Button);

export type EmptyStateType =
  | "transactions"
  | "budgets"
  | "goals"
  | "accounts"
  | "shared"
  | "recurring"
  | "search"
  | "generic";

interface EmptyStateProps {
  type: EmptyStateType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

// Container animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// Child animation variants
const itemVariants = {
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
};

// Floating animation for the illustration
const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-4, 4, -4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Ilustrações SVG inline para cada tipo de empty state
const illustrations: Record<EmptyStateType, React.ReactNode> = {
  transactions: (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="20"
        y="30"
        width="120"
        height="70"
        rx="8"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="30"
        y="45"
        width="60"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="30"
        y="60"
        width="40"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="30"
        y="75"
        width="50"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.1"
      />
      <circle cx="120" cy="55" r="20" fill="currentColor" opacity="0.15" />
      <path
        d="M115 55L118 58L125 51"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <rect
        x="60"
        y="15"
        width="40"
        height="25"
        rx="4"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M75 20L80 25L85 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  ),
  budgets: (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="60" r="45" fill="currentColor" opacity="0.1" />
      <circle cx="80" cy="60" r="35" fill="currentColor" opacity="0.08" />
      <path
        d="M80 25C80 25 105 40 105 60C105 80 80 95 80 95"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path
        d="M80 25C80 25 55 40 55 60C55 80 80 95 80 95"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.15"
      />
      <circle cx="80" cy="60" r="15" fill="currentColor" opacity="0.2" />
      <text
        x="80"
        y="65"
        textAnchor="middle"
        fill="currentColor"
        fontSize="12"
        fontWeight="bold"
        opacity="0.5"
      >
        $
      </text>
    </svg>
  ),
  goals: (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M40 100L80 20L120 100"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.2"
      />
      <circle cx="80" cy="35" r="12" fill="currentColor" opacity="0.2" />
      <path
        d="M75 35L78 38L85 31"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <rect
        x="55"
        y="60"
        width="50"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="55"
        y="60"
        width="30"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.25"
      />
      <circle cx="40" cy="100" r="8" fill="currentColor" opacity="0.15" />
      <circle cx="120" cy="100" r="8" fill="currentColor" opacity="0.15" />
      <path
        d="M130 20L145 10V25L130 35V20Z"
        fill="currentColor"
        opacity="0.2"
      />
      <line
        x1="130"
        y1="20"
        x2="130"
        y2="50"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.15"
      />
    </svg>
  ),
  accounts: (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="25"
        y="35"
        width="110"
        height="65"
        rx="8"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="35"
        y="50"
        width="50"
        height="10"
        rx="5"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="35"
        y="70"
        width="30"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="35"
        y="82"
        width="40"
        height="6"
        rx="3"
        fill="currentColor"
        opacity="0.1"
      />
      <circle cx="110" cy="70" r="18" fill="currentColor" opacity="0.15" />
      <text
        x="110"
        y="75"
        textAnchor="middle"
        fill="currentColor"
        fontSize="14"
        fontWeight="bold"
        opacity="0.4"
      >
        $
      </text>
      <rect
        x="45"
        y="20"
        width="70"
        height="25"
        rx="6"
        fill="currentColor"
        opacity="0.15"
      />
      <circle cx="60" cy="32" r="8" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  shared: (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="55" cy="50" r="22" fill="currentColor" opacity="0.15" />
      <circle cx="55" cy="42" r="10" fill="currentColor" opacity="0.2" />
      <path
        d="M35 68C35 58 44 55 55 55C66 55 75 58 75 68"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.2"
      />
      <circle cx="105" cy="50" r="22" fill="currentColor" opacity="0.15" />
      <circle cx="105" cy="42" r="10" fill="currentColor" opacity="0.2" />
      <path
        d="M85 68C85 58 94 55 105 55C116 55 125 58 125 68"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.2"
      />
      <path
        d="M75 50H85"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="6 4"
        opacity="0.25"
      />
      <rect
        x="55"
        y="85"
        width="50"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="55"
        y="85"
        width="25"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.25"
      />
    </svg>
  ),
  recurring: (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="80"
        cy="60"
        r="40"
        stroke="currentColor"
        strokeWidth="6"
        opacity="0.1"
      />
      <path
        d="M80 25C97 25 112 35 118 50"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.2"
      />
      <path
        d="M120 55L118 50L123 48"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path
        d="M80 95C63 95 48 85 42 70"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.2"
      />
      <path
        d="M40 65L42 70L37 72"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <circle cx="80" cy="60" r="15" fill="currentColor" opacity="0.15" />
      <text
        x="80"
        y="65"
        textAnchor="middle"
        fill="currentColor"
        fontSize="10"
        fontWeight="bold"
        opacity="0.4"
      >
        ∞
      </text>
    </svg>
  ),
  search: (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="70"
        cy="55"
        r="30"
        stroke="currentColor"
        strokeWidth="6"
        opacity="0.15"
      />
      <line
        x1="92"
        y1="77"
        x2="115"
        y2="100"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.2"
      />
      <path
        d="M55 55L65 65L85 45"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.1"
      />
      <circle cx="70" cy="55" r="12" fill="currentColor" opacity="0.08" />
      <text
        x="70"
        y="60"
        textAnchor="middle"
        fill="currentColor"
        fontSize="12"
        fontWeight="bold"
        opacity="0.3"
      >
        ?
      </text>
    </svg>
  ),
  generic: (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="35"
        y="25"
        width="90"
        height="70"
        rx="8"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="50"
        y="45"
        width="60"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="50"
        y="60"
        width="40"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.1"
      />
      <rect
        x="50"
        y="75"
        width="50"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.08"
      />
      <circle
        cx="80"
        cy="60"
        r="30"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
        opacity="0.15"
      />
      <path
        d="M70 60L77 67L90 54"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.2"
      />
    </svg>
  ),
};

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: compact ? 4 : 8,
        px: 3,
        textAlign: "center",
        color: theme.palette.primary.main,
      }}
    >
      {/* Animated Illustration */}
      <MotionBox
        variants={floatVariants}
        initial="initial"
        animate="animate"
        sx={{
          mb: 3,
          opacity: 0.9,
          transform: compact ? "scale(0.8)" : "scale(1)",
          color: isDarkMode
            ? theme.palette.primary.light
            : theme.palette.primary.main,
        }}
      >
        <motion.div variants={itemVariants}>{illustrations[type]}</motion.div>
      </MotionBox>

      {/* Title with staggered entrance */}
      <motion.div variants={itemVariants}>
        <Typography
          variant={compact ? "h6" : "h5"}
          fontWeight={600}
          gutterBottom
          color="text.primary"
          sx={{ maxWidth: 300 }}
        >
          {title}
        </Typography>
      </motion.div>

      {/* Description with staggered entrance */}
      <motion.div variants={itemVariants}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320, mb: onAction ? 3 : 0 }}
        >
          {description}
        </Typography>
      </motion.div>

      {/* Action Button with premium animation */}
      {actionLabel && onAction && (
        <motion.div variants={itemVariants}>
          <MotionButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAction}
            whileHover={{
              y: -3,
              scale: 1.02,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            sx={{
              mt: 1,
              px: 3,
              py: 1.25,
              borderRadius: 2.5,
              fontWeight: 600,
              boxShadow: `0 4px 14px ${alpha(
                theme.palette.primary.main,
                0.25
              )}`,
            }}
          >
            {actionLabel}
          </MotionButton>
        </motion.div>
      )}
    </MotionBox>
  );
};

export default EmptyState;
