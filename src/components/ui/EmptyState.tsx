import React from "react";
import { useTheme, alpha, useMediaQuery } from "@mui/material";
import { Heading, Text } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import NixButton from "../radix/Button";

export type EmptyStateType =
  | "transactions"
  | "budgets"
  | "goals"
  | "accounts"
  | "shared"
  | "recurring"
  | "search"
  | "planning"
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

// Cores da paleta Coffee para ilustrações
const COFFEE_MOCHA      = "#a855f7";
const COFFEE_CAPPUCCINO = "#c084fc";
const COFFEE_CARAMEL    = "#7c3aed";
const COFFEE_LATTE      = "#d8b4fe";
const COFFEE_SAGE       = "#4ade80";
const COFFEE_ROSE       = "#f87171";

// Ilustrações SVG inline — Cozy Coffee Edition
const illustrations: Record<EmptyStateType, React.ReactNode> = {
  transactions: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Xícara de café */}
      <ellipse cx="80" cy="88" rx="32" ry="8" fill={COFFEE_MOCHA} opacity="0.08" />
      <path d="M55 55 Q55 80 80 82 Q105 80 105 55 Z" fill={COFFEE_LATTE} opacity="0.35" />
      <rect x="55" y="45" width="50" height="12" rx="6" fill={COFFEE_CAPPUCCINO} opacity="0.25" />
      {/* Alça */}
      <path d="M105 52 Q120 52 120 62 Q120 72 105 72" stroke={COFFEE_CAPPUCCINO} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.3" />
      {/* Vapor */}
      <path d="M68 38 Q65 30 68 22" stroke={COFFEE_CARAMEL} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.35" />
      <path d="M80 35 Q77 26 80 18" stroke={COFFEE_MOCHA} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.3" />
      <path d="M92 38 Q89 30 92 22" stroke={COFFEE_CARAMEL} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.35" />
      {/* Prato */}
      <ellipse cx="80" cy="83" rx="38" ry="6" fill={COFFEE_LATTE} opacity="0.2" />
      {/* Linha de líquido */}
      <ellipse cx="80" cy="58" rx="20" ry="5" fill={COFFEE_MOCHA} opacity="0.15" />
    </svg>
  ),
  budgets: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pote de dinheiro / cofrinho */}
      <ellipse cx="80" cy="92" rx="35" ry="8" fill={COFFEE_MOCHA} opacity="0.07" />
      <path d="M50 75 Q48 55 80 50 Q112 55 110 75 Q110 92 80 95 Q50 92 50 75 Z" fill={COFFEE_LATTE} opacity="0.3" />
      <ellipse cx="80" cy="52" rx="28" ry="7" fill={COFFEE_CAPPUCCINO} opacity="0.2" />
      {/* Tampa */}
      <path d="M65 45 Q80 38 95 45" stroke={COFFEE_MOCHA} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.3" />
      {/* Moedas */}
      <circle cx="70" cy="68" r="8" fill={COFFEE_CARAMEL} opacity="0.3" />
      <circle cx="90" cy="72" r="7" fill={COFFEE_CARAMEL} opacity="0.25" />
      <circle cx="80" cy="78" r="6" fill={COFFEE_CARAMEL} opacity="0.2" />
      {/* Sinalzinho de R$ */}
      <text x="80" y="72" textAnchor="middle" fill={COFFEE_MOCHA} fontSize="12" fontWeight="bold" opacity="0.5">R$</text>
    </svg>
  ),
  goals: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Plantinha crescendo */}
      <ellipse cx="80" cy="98" rx="28" ry="6" fill={COFFEE_MOCHA} opacity="0.07" />
      {/* Vaso */}
      <path d="M65 88 L60 100 L100 100 L95 88 Z" fill={COFFEE_CAPPUCCINO} opacity="0.25" />
      <rect x="58" y="84" width="44" height="6" rx="3" fill={COFFEE_CAPPUCCINO} opacity="0.2" />
      {/* Haste */}
      <path d="M80 84 L80 55" stroke={COFFEE_SAGE} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      {/* Folhas */}
      <path d="M80 70 Q65 62 62 50 Q74 52 80 62" fill={COFFEE_SAGE} opacity="0.35" />
      <path d="M80 65 Q95 57 98 45 Q86 47 80 57" fill={COFFEE_SAGE} opacity="0.3" />
      {/* Florzinha no topo */}
      <circle cx="80" cy="50" r="8" fill={COFFEE_CARAMEL} opacity="0.3" />
      <circle cx="80" cy="50" r="4" fill={COFFEE_CARAMEL} opacity="0.5" />
      {/* Estrelinhas */}
      <text x="110" y="50" fontSize="14" opacity="0.4"></text>
      <text x="30" y="60" fontSize="12" opacity="0.3"></text>
    </svg>
  ),
  accounts: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Carteira */}
      <rect x="30" y="40" width="100" height="65" rx="12" fill={COFFEE_LATTE} opacity="0.25" />
      <rect x="30" y="40" width="100" height="20" rx="12" fill={COFFEE_CAPPUCCINO} opacity="0.2" />
      {/* Compartimento interno */}
      <rect x="90" y="55" width="30" height="22" rx="8" fill={COFFEE_CARAMEL} opacity="0.25" />
      <circle cx="105" cy="66" r="6" fill={COFFEE_CARAMEL} opacity="0.4" />
      {/* Linhas de texto */}
      <rect x="42" y="72" width="38" height="6" rx="3" fill={COFFEE_MOCHA} opacity="0.18" />
      <rect x="42" y="84" width="28" height="6" rx="3" fill={COFFEE_MOCHA} opacity="0.12" />
      {/* Chip do cartão */}
      <rect x="42" y="52" width="20" height="14" rx="4" fill={COFFEE_CARAMEL} opacity="0.3" />
    </svg>
  ),
  shared: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Duas xícaras juntas */}
      <path d="M35 65 Q35 82 55 84 Q75 82 75 65 Z" fill={COFFEE_LATTE} opacity="0.3" />
      <rect x="35" y="56" width="40" height="10" rx="5" fill={COFFEE_CAPPUCCINO} opacity="0.2" />
      <path d="M75 62 Q86 62 86 70 Q86 78 75 78" stroke={COFFEE_CAPPUCCINO} strokeWidth="3" fill="none" opacity="0.25" />
      
      <path d="M85 65 Q85 82 105 84 Q125 82 125 65 Z" fill={COFFEE_LATTE} opacity="0.25" />
      <rect x="85" y="56" width="40" height="10" rx="5" fill={COFFEE_CAPPUCCINO} opacity="0.18" />
      <path d="M125 62 Q136 62 136 70 Q136 78 125 78" stroke={COFFEE_CAPPUCCINO} strokeWidth="3" fill="none" opacity="0.2" />

      {/* Prato compartilhado */}
      <ellipse cx="80" cy="87" rx="55" ry="7" fill={COFFEE_LATTE} opacity="0.15" />
      {/* Coraçãozinho */}
      <text x="72" y="48" fontSize="18" opacity="0.4"></text>
    </svg>
  ),
  recurring: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Calendário fofo */}
      <rect x="30" y="30" width="100" height="80" rx="14" fill={COFFEE_LATTE} opacity="0.2" />
      <rect x="30" y="30" width="100" height="25" rx="14" fill={COFFEE_CAPPUCCINO} opacity="0.2" />
      {/* Argolas */}
      <rect x="55" y="22" width="8" height="18" rx="4" fill={COFFEE_MOCHA} opacity="0.25" />
      <rect x="97" y="22" width="8" height="18" rx="4" fill={COFFEE_MOCHA} opacity="0.25" />
      {/* Dias */}
      {[45, 65, 85, 105, 45, 65, 85].map((x, i) => (
        <circle key={i} cx={x} cy={70 + Math.floor(i / 5) * 22} r="6" 
          fill={i === 2 ? COFFEE_CARAMEL : COFFEE_MOCHA} 
          opacity={i === 2 ? 0.45 : 0.1} />
      ))}
      <circle cx="85" cy="70" r="6" fill={COFFEE_CARAMEL} opacity="0.4" />
      {/* Seta de recorrência */}
      <path d="M115 55 Q128 45 128 60 Q128 75 115 75" stroke={COFFEE_SAGE} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.45" />
      <path d="M115 74 L118 80 L109 76" fill={COFFEE_SAGE} opacity="0.45" />
    </svg>
  ),
  search: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lupa fofa */}
      <circle cx="68" cy="55" r="32" fill={COFFEE_LATTE} opacity="0.2" />
      <circle cx="68" cy="55" r="32" stroke={COFFEE_CAPPUCCINO} strokeWidth="6" opacity="0.2" fill="none" />
      <circle cx="68" cy="55" r="18" fill={COFFEE_LATTE} opacity="0.15" />
      {/* Cabinho */}
      <line x1="92" y1="79" x2="118" y2="105" stroke={COFFEE_CAPPUCCINO} strokeWidth="8" strokeLinecap="round" opacity="0.22" />
      {/* Xícara dentro da lupa */}
      <text x="56" y="62" fontSize="20" opacity="0.35"></text>
      {/* Interrogação */}
      <text x="104" y="42" fontSize="16" opacity="0.3">?</text>
    </svg>
  ),
  generic: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pacote / caixinha fofa */}
      <rect x="35" y="45" width="90" height="65" rx="14" fill={COFFEE_LATTE} opacity="0.22" />
      <rect x="35" y="45" width="90" height="22" rx="14" fill={COFFEE_CAPPUCCINO} opacity="0.18" />
      {/* Laço */}
      <path d="M80 45 L80 67" stroke={COFFEE_CARAMEL} strokeWidth="3" opacity="0.4" />
      <path d="M55 56 Q80 50 105 56" stroke={COFFEE_CARAMEL} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      {/* Pontinhos de decoração */}
      <circle cx="60" cy="85" r="5" fill={COFFEE_MOCHA} opacity="0.12" />
      <circle cx="80" cy="88" r="5" fill={COFFEE_MOCHA} opacity="0.10" />
      <circle cx="100" cy="85" r="5" fill={COFFEE_MOCHA} opacity="0.12" />
      {/* Sparkle */}
      <text x="118" y="42" fontSize="16" opacity="0.3"></text>
      <text x="22" y="42" fontSize="14" opacity="0.25"></text>
    </svg>
  ),
  planning: (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bloco de notas / lista */}
      <rect x="38" y="18" width="84" height="90" rx="12" fill={COFFEE_LATTE} opacity="0.22" />
      <rect x="38" y="18" width="84" height="20" rx="12" fill={COFFEE_CAPPUCCINO} opacity="0.2" />
      {/* Espiral */}
      <circle cx="58" cy="12" r="5" fill={COFFEE_MOCHA} opacity="0.2" />
      <circle cx="80" cy="12" r="5" fill={COFFEE_MOCHA} opacity="0.2" />
      <circle cx="102" cy="12" r="5" fill={COFFEE_MOCHA} opacity="0.2" />
      {/* Linhas de texto */}
      <rect x="52" y="50" width="55" height="6" rx="3" fill={COFFEE_MOCHA} opacity="0.18" />
      <rect x="52" y="64" width="44" height="6" rx="3" fill={COFFEE_MOCHA} opacity="0.14" />
      <rect x="52" y="78" width="50" height="6" rx="3" fill={COFFEE_MOCHA} opacity="0.12" />
      <rect x="52" y="92" width="35" height="6" rx="3" fill={COFFEE_MOCHA} opacity="0.10" />
      {/* Checkboxes */}
      <rect x="43" y="48" width="7" height="7" rx="2" fill={COFFEE_CARAMEL} opacity="0.3" />
      <rect x="43" y="62" width="7" height="7" rx="2" fill={COFFEE_SAGE} opacity="0.4" />
      <path d="M44.5 65.5 L46 67 L49 63.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <rect x="43" y="76" width="7" height="7" rx="2" fill={COFFEE_CARAMEL} opacity="0.2" />
      {/* Lápis decorativo */}
      <text x="110" y="105" fontSize="18" opacity="0.3"></text>
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const paddingVertical = compact ? 32 : isMobile ? 32 : 64;
  const containerStyle = {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingTop: paddingVertical,
    paddingBottom: paddingVertical,
    paddingLeft: 24,
    paddingRight: 24,
    textAlign: "center" as const,
    borderRadius: "20px",
    background: isDarkMode
      ? `linear-gradient(135deg, rgba(196, 136, 95, 0.07) 0%, rgba(196, 168, 100, 0.04) 100%)`
      : `linear-gradient(135deg, rgba(196, 136, 95, 0.05) 0%, rgba(253, 248, 240, 0.8) 100%)`,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={containerStyle}
      className="nix-empty-state"
    >
      {/* Animated Illustration - floating */}
      <motion.div
        variants={floatVariants}
        initial="initial"
        animate="animate"
        style={{
          marginBottom: 24,
          opacity: 1,
          transform: compact ? "scale(0.8)" : "scale(1)",
        }}
      >
        <motion.div variants={itemVariants}>{illustrations[type]}</motion.div>
      </motion.div>

      {/* Title with staggered entrance */}
      <motion.div variants={itemVariants} style={{ marginBottom: 8 }}>
        <Heading
          size={compact ? "4" : "5"}
          weight="bold"
          style={{ maxWidth: 300, margin: "0 auto" }}
        >
          {title}
        </Heading>
      </motion.div>

      {/* Description with staggered entrance */}
      <motion.div variants={itemVariants} style={{ marginBottom: actionLabel && onAction ? 24 : 0 }}>
        <Text
          as="p"
          size="2"
          color="gray"
          style={{ maxWidth: 320, margin: "0 auto", lineHeight: 1.5 }}
        >
          {description}
        </Text>
      </motion.div>

      {/* Action Button - same size (medium) in all screens */}
      {actionLabel && onAction && (
        <motion.div variants={itemVariants}>
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <NixButton
              size="medium"
              variant="solid"
              color="purple"
              onClick={onAction}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Plus size={18} strokeWidth={2.5} />
              {actionLabel}
            </NixButton>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
