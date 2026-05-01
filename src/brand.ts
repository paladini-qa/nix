/**
 * NIX BRAND BOOK
 * Tokens de design centralizados — use src/theme/colors.ts para acesso direto.
 */

import { colors } from "./theme/colors";
import { radius, spacing } from "./theme/spacing";
import { typography } from "./theme/typography";
import { alpha } from "@mui/material/styles";

// ─── Re-exports principais ────────────────────────────────────────────────────
export { colors, radius, spacing, typography };

// ─── Gradientes ───────────────────────────────────────────────────────────────
export const NIX_GRADIENTS = {
  primary:     `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
  primaryHover:`linear-gradient(135deg, #c084fc 0%, ${colors.primary} 100%)`,
  income:      `linear-gradient(135deg, ${colors.income} 0%, #22c55e 100%)`,
  expense:     `linear-gradient(135deg, ${colors.expense} 0%, #ef4444 100%)`,
  auroraLight: `
    radial-gradient(ellipse 110% 85% at 5% 8%,  ${alpha(colors.primary, 0.08)} 0%, transparent 52%),
    radial-gradient(ellipse 80% 70%  at 88% 6%, ${alpha(colors.income,  0.05)} 0%, transparent 46%),
    radial-gradient(ellipse 65% 55%  at 12% 88%,${alpha(colors.expense, 0.04)} 0%, transparent 50%)
  `,
  auroraDark: `
    radial-gradient(ellipse 110% 85% at 5% 8%,  ${alpha(colors.primary, 0.18)} 0%, transparent 52%),
    radial-gradient(ellipse 80% 70%  at 88% 6%, ${alpha(colors.income,  0.10)} 0%, transparent 46%),
    radial-gradient(ellipse 65% 55%  at 12% 88%,${alpha(colors.expense, 0.08)} 0%, transparent 50%)
  `,
} as const;

// Aliases para compatibilidade com código existente
export const NIX_AURORA    = { light: NIX_GRADIENTS.auroraLight, dark: NIX_GRADIENTS.auroraDark };
export const COFFEE_STEAM  = NIX_AURORA;

// ─── Design tokens ────────────────────────────────────────────────────────────
export const NIX_DESIGN = {
  borderRadius: { small: radius.sm, large: radius.xl, round: radius.full },
  glass: {
    blur:        "20px",
    bgDark:      `${alpha(colors.bg.card, 0.88)}`,
    bgLight:     "rgba(255,255,255,0.88)",
    borderDark:  colors.border.subtle,
    borderLight: alpha(colors.primary, 0.1),
  },
  shadows: {
    subtle: `0 4px 12px -2px ${alpha(colors.primary, 0.1)}`,
    medium: `0 8px 24px -4px ${alpha(colors.primary, 0.2)}`,
    strong: `0 16px 48px -8px ${alpha(colors.primary, 0.3)}`,
  },
  transitions: {
    fast:   "all 0.1s ease-in-out",
    normal: "all 0.2s ease-in-out",
    slow:   "all 0.3s ease-in-out",
  },
} as const;

export const COFFEE_DESIGN = NIX_DESIGN;

// ─── Tipografia ───────────────────────────────────────────────────────────────
export const NIX_TYPOGRAPHY = {
  headingFont: '"Inter", "Roboto", "Segoe UI", sans-serif',
  bodyFont:    '"Inter", "Roboto", "Segoe UI", sans-serif',
  weights:     typography.weights,
} as const;

export const COFFEE_TYPOGRAPHY = NIX_TYPOGRAPHY;

// ─── Aliases de compatibilidade (legado) ──────────────────────────────────────
export const NIX_PURPLE = {
  start:    colors.primary,
  end:      "#7c3aed",
  light:    "#c084fc",
  gradient: NIX_GRADIENTS.primary,
  glow:     alpha(colors.primary, 0.45),
} as const;

export const NIX_TEAL = {
  main:     colors.income,
  light:    alpha(colors.income, 0.7),
  dark:     "#22c55e",
  gradient: NIX_GRADIENTS.income,
  glow:     alpha(colors.income, 0.45),
} as const;

export const NIX_NEUTRAL = {
  nixDark:   "#1e1b4b",
  pureWhite: "#ffffff",
  softGray:  "#f8fafc",
} as const;

export const NIX_SEMANTIC = {
  success:      colors.income,
  successLight: alpha(colors.income, 0.7),
  error:        colors.expense,
  errorLight:   alpha(colors.expense, 0.7),
  warning:      colors.warning,
} as const;

export const COFFEE_BROWN = {
  mocha:       colors.primary,
  cappuccino:  "#c084fc",
  espresso:    "#7c3aed",
  cremeBrulee: "#d8b4fe",
  gradient:    NIX_GRADIENTS.primary,
  gradientDark:NIX_GRADIENTS.primaryHover,
  glow:        alpha(colors.primary, 0.45),
} as const;

export const CREAM_ACCENT = {
  latte:      "#d8b4fe",
  cappuccino: "#c084fc",
  caramel:    "#a855f7",
  steam:      "#ffffff",
  foam:       "#f8fafc",
  gradient:   NIX_GRADIENTS.primaryHover,
  glow:       alpha(colors.primary, 0.45),
} as const;

export const COFFEE_NEUTRAL = {
  espressoText: "#1e1b4b",
  mochaText:    "#4c1d95",
  steamBg:      "#ffffff",
  foamBg:       "#f8fafc",
  creamText:    colors.text.primary,
  tanText:      colors.text.secondary,
  espressoBg:   colors.bg.app,
  darkRoastBg:  colors.bg.card,
} as const;

export const COFFEE_SEMANTIC = {
  success:     colors.income,
  successLight:alpha(colors.income, 0.7),
  successDark: "#22c55e",
  error:       colors.expense,
  errorLight:  alpha(colors.expense, 0.7),
  errorDark:   "#ef4444",
  warning:     colors.warning,
} as const;

export const NIX_COLORS = colors;

export const NIX_BRAND = {
  colors: { purple: NIX_PURPLE, teal: NIX_TEAL, neutral: NIX_NEUTRAL, semantic: NIX_SEMANTIC },
  aurora: NIX_AURORA,
  typography: NIX_TYPOGRAPHY,
  design: NIX_DESIGN,
} as const;

export const COFFEE_BRAND = NIX_BRAND;

export default COFFEE_BRAND;
