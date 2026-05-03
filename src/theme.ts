import { createTheme, ThemeOptions, alpha } from "@mui/material/styles";
import { colors } from "./theme/colors";
import { radius as r } from "./theme/spacing";

// ─── Radius ──────────────────────────────────────────────────────────────────
const BR  = r.xl;  // 16 — default
const BRS = r.md;  // 10 — small

// ─── MUI Component Overrides (shared between themes) ─────────────────────────
const baseComponents: ThemeOptions["components"] = {
  MuiCssBaseline: {
    styleOverrides: {
      body: { scrollBehavior: "smooth" },
      "*:focus-visible": {
        outline: `2px solid ${alpha(colors.primary, 0.5)}`,
        outlineOffset: "2px",
        borderRadius: "4px",
      },
      "*:focus:not(:focus-visible)": { outline: "none" },
      "input, textarea, select": {
        "&:focus": { outline: "none" },
        "&:focus-visible": {
          outline: `2px solid ${alpha(colors.primary, 0.5)}`,
          outlineOffset: "2px",
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: 600,
        borderRadius: BR,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        paddingBottom: 10,
        transition: "all 0.2s ease-in-out",
        "&:hover": { transform: "translateY(-2px)" },
        "&:active": { transform: "translateY(0)" },
      },
      contained: {
        boxShadow: `0 4px 14px -3px ${alpha(colors.primary, 0.4)}`,
        "&:hover": { boxShadow: `0 6px 20px -3px ${alpha(colors.primary, 0.5)}` },
      },
      containedSuccess: {
        boxShadow: `0 4px 14px -3px ${alpha(colors.income, 0.35)}`,
        "&:hover": { boxShadow: `0 6px 20px -3px ${alpha(colors.income, 0.45)}` },
      },
      containedError: {
        boxShadow: `0 4px 14px -3px ${alpha(colors.expense, 0.35)}`,
        "&:hover": { boxShadow: `0 6px 20px -3px ${alpha(colors.expense, 0.45)}` },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: BR,
        transition: "all 0.2s ease-in-out",
        "&:hover": { transform: "translateY(-1px)" },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: BR, transition: "all 0.25s ease-in-out" },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { borderRadius: BR },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        borderRadius: r.lg,
        background: colors.primary,
        boxShadow: `0 8px 24px -4px ${alpha(colors.primary, 0.45)}`,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 12px 32px -4px ${alpha(colors.primary, 0.55)}`,
          background: colors.primary,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: BR, fontWeight: 600 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: BR },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: BR,
          transition: "all 0.2s ease-in-out",
          "&:hover": { boxShadow: `0 2px 8px -2px ${alpha(colors.primary, 0.2)}` },
          "&.Mui-focused": { boxShadow: `0 4px 12px -2px ${alpha(colors.primary, 0.25)}` },
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: BR,
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: colors.primary,
          borderWidth: 2,
        },
        "&.Mui-focused": { boxShadow: `0 0 0 3px ${alpha(colors.primary, 0.12)}` },
      },
      notchedOutline: {
        transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
      },
      input: { "&:focus": { outline: "none" } },
    },
  },
  MuiFilledInput:   { styleOverrides: { root: { borderRadius: BR } } },
  MuiSelect:        { styleOverrides: { root: { borderRadius: BR } } },
  MuiInputBase:     { styleOverrides: { root: { borderRadius: BR }, input: { "&:focus": { outline: "none" } } } },
  MuiAutocomplete:  { styleOverrides: { paper: { borderRadius: BR }, inputRoot: { borderRadius: BR } } },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: BR,
        marginTop: 8,
        boxShadow: `0 10px 40px -10px ${alpha("#000", 0.4)}, 0 4px 16px -4px ${alpha("#000", 0.2)}`,
      },
    },
  },
  MuiPopover:  { styleOverrides: { paper: { borderRadius: BR } } },
  MuiTooltip:  { styleOverrides: { tooltip: { borderRadius: BRS, fontWeight: 600 } } },
  MuiAlert:    { styleOverrides: { root: { borderRadius: BR } } },
  MuiSnackbar: { styleOverrides: { root: { "& .MuiPaper-root": { borderRadius: BR } } } },
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: BR,
        "&:first-of-type":  { borderTopLeftRadius: BR, borderTopRightRadius: BR },
        "&:last-of-type":   { borderBottomLeftRadius: BR, borderBottomRightRadius: BR },
      },
    },
  },
  MuiAvatar:        { styleOverrides: { root: { borderRadius: BR }, circular: { borderRadius: "50%" } } },
  MuiToggleButton:  { styleOverrides: { root: { borderRadius: BR } } },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: { borderRadius: BR },
      grouped: {
        borderRadius: BR,
        "&:not(:first-of-type)": { borderRadius: BR },
        "&:first-of-type":        { borderRadius: BR },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: { borderRadius: BR },
      indicator: {
        background: `linear-gradient(90deg, ${colors.primary} 0%, ${alpha(colors.primary, 0.7)} 100%)`,
        borderRadius: BRS,
      },
    },
  },
  MuiTab:           { styleOverrides: { root: { borderRadius: BR } } },
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: BR },
      bar:  { borderRadius: BR },
    },
  },
  MuiSkeleton:      { styleOverrides: { root: { borderRadius: BR } } },
  MuiTableContainer: { styleOverrides: { root: { borderRadius: BR } } },
  MuiBadge:         { styleOverrides: { badge: { borderRadius: BRS } } },
  MuiListItemButton: { styleOverrides: { root: { borderRadius: BR } } },
  MuiDrawer:        { styleOverrides: { paper: { borderRadius: 0 } } },
  MuiSwitch: {
    styleOverrides: {
      root: {
        "& .MuiSwitch-thumb":  { borderRadius: BR },
        "& .MuiSwitch-track": { borderRadius: BR },
      },
    },
  },
};

const baseTypography: ThemeOptions["typography"] = {
  fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
  h1: { fontWeight: 700, letterSpacing: "-0.02em" },
  h2: { fontWeight: 700, letterSpacing: "-0.01em" },
  h3: { fontWeight: 600, letterSpacing: "-0.01em" },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600 },
  body1: { fontWeight: 400, lineHeight: 1.65 },
  body2: { fontWeight: 400, lineHeight: 1.55 },
  button: { fontWeight: 600, letterSpacing: "0.01em" },
  overline: { fontWeight: 700, letterSpacing: "0.1em" },
  caption: { fontWeight: 400 },
};

const baseBreakpoints: ThemeOptions["breakpoints"] = {
  values: { xs: 0, sm: 600, md: 1024, lg: 1200, xl: 1536 },
};

// ─── Dark Theme ───────────────────────────────────────────────────────────────
export const darkTheme = createTheme({
  typography: baseTypography,
  shape: { borderRadius: BR },
  breakpoints: baseBreakpoints,
  components: baseComponents,
  palette: {
    mode: "dark",
    primary: {
      main:         colors.primary,
      light:        alpha(colors.primary, 0.7),
      dark:         "#7c3aed",
      contrastText: "#ffffff",
    },
    secondary: {
      main:         alpha(colors.primary, 0.6),
      light:        alpha(colors.primary, 0.8),
      dark:         "#6d28d9",
      contrastText: "#ffffff",
    },
    success: {
      main:         colors.income,
      light:        alpha(colors.income, 0.7),
      dark:         "#22c55e",
      contrastText: "#0f172a",
    },
    error: {
      main:         colors.expense,
      light:        alpha(colors.expense, 0.7),
      dark:         "#ef4444",
      contrastText: "#0f172a",
    },
    warning: {
      main:         colors.warning,
      light:        alpha(colors.warning, 0.7),
      dark:         "#f59e0b",
      contrastText: "#0f172a",
    },
    info: {
      main:         "#60a5fa",
      light:        "#93c5fd",
      dark:         "#3b82f6",
      contrastText: "#0f172a",
    },
    background: {
      default: colors.bg.app,
      paper:   colors.bg.card,
    },
    text: {
      primary:   colors.text.primary,
      secondary: colors.text.secondary,
      disabled:  colors.text.disabled,
    },
    divider: colors.border.default,
  },
});

// ─── Light Theme ──────────────────────────────────────────────────────────────
export const lightTheme = createTheme({
  typography: baseTypography,
  shape: { borderRadius: BR },
  breakpoints: baseBreakpoints,
  components: baseComponents,
  palette: {
    mode: "light",
    primary: {
      main:         colors.primary,
      light:        alpha(colors.primary, 0.7),
      dark:         "#7c3aed",
      contrastText: "#ffffff",
    },
    secondary: {
      main:         alpha(colors.primary, 0.6),
      light:        alpha(colors.primary, 0.8),
      dark:         "#6d28d9",
      contrastText: "#ffffff",
    },
    success: {
      main:         "#22c55e",
      light:        "#4ade80",
      dark:         "#16a34a",
      contrastText: "#ffffff",
    },
    error: {
      main:         "#ef4444",
      light:        "#f87171",
      dark:         "#dc2626",
      contrastText: "#ffffff",
    },
    warning: {
      main:         "#f59e0b",
      light:        "#fcd34d",
      dark:         "#d97706",
      contrastText: "#ffffff",
    },
    info: {
      main:         "#3b82f6",
      light:        "#60a5fa",
      dark:         "#2563eb",
      contrastText: "#ffffff",
    },
    background: {
      default: "#fafafa",
      paper:   "#ffffff",
    },
    text: {
      primary:   "#18181b",
      secondary: "#52525b",
      disabled:  "#a1a1aa",
    },
    divider: "#e4e4e7",
  },
});

// ─── Exports ──────────────────────────────────────────────────────────────────
export const STANDARD_BORDER_RADIUS = BR;
export const SMALL_BORDER_RADIUS    = BRS;

export const NIX_COLORS    = colors;
export const NIX_GRADIENTS = {
  primary:     `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
  primaryHover:`linear-gradient(135deg, #c084fc 0%, ${colors.primary} 100%)`,
  darkPrimary: `linear-gradient(135deg, #c084fc 0%, ${colors.primary} 100%)`,
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
  // Alias de compatibilidade
  steamLight: `radial-gradient(ellipse 110% 85% at 5% 8%, ${alpha(colors.primary, 0.08)} 0%, transparent 52%)`,
  steamDark:  `radial-gradient(ellipse 110% 85% at 5% 8%, ${alpha(colors.primary, 0.18)} 0%, transparent 52%)`,
} as const;

export const getTintedShadow = (
  color: string,
  intensity: "subtle" | "medium" | "strong" = "medium"
) => {
  const a = { subtle: 0.1, medium: 0.2, strong: 0.3 }[intensity];
  const b = { subtle: "12px", medium: "24px", strong: "40px" }[intensity];
  const s = { subtle: "-4px",  medium: "-8px",  strong: "-12px" }[intensity];
  return `0 10px ${b} ${s} ${alpha(color, a)}`;
};

export const getGlassStyles = (mode: "light" | "dark") => ({
  background: mode === "dark"
    ? `${alpha(colors.bg.card, 0.88)}`
    : "rgba(255,255,255,0.88)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${mode === "dark" ? colors.border.subtle : alpha(colors.primary, 0.1)}`,
});
