import { createTheme, ThemeOptions, alpha } from "@mui/material/styles";

// ============================================
// NIX BRAND IDENTITY - Cozy Coffee Design System
// ============================================

// Border Radius padrão - 20px (Superellipse feel)
const BORDER_RADIUS = 20;
const BORDER_RADIUS_SMALL = 10;

// ============================================
// PALETA DE CORES COFFEE - Design System Cozy
// ============================================
const coffeeColors = {
  // Cor Primária: Purple
  primary: {
    main: "#7C3AED",       // Purple
    light: "#8B5CF6",      // Lighter purple
    dark: "#5B21B6",       // Dark purple
    darkMode: "#A78BFA",   // Lighter purple for dark mode
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    gradientDark: "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)",
    contrastText: "#FFFFFF",
  },
  // Cor Secundária: Secondary Purple/White
  secondary: {
    main: "#A78BFA",       // Muted purple
    light: "#DDD6FE",      // Soft purple
    dark: "#7C3AED",       // Strong purple
    contrastText: "#FFFFFF",
  },
  // Cores Semânticas
  success: {
    main: "#10B981",       // Emerald
    light: "#34D399",
    dark: "#059669",
    darkMode: "#34D399",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#EF4444",       // Red
    light: "#F87171",
    dark: "#DC2626",
    darkMode: "#F87171",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#F59E0B",       // Amber
    light: "#FBBF24",
    dark: "#D97706",
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#3B82F6",       // Blue
    light: "#60A5FA",
    dark: "#2563EB",
    contrastText: "#FFFFFF",
  },
  // Cores Neutras — Modern Purple Theme
  neutral: {
    // Light Mode
    backgroundLight: "#FFFFFF",    // White
    surfaceLight: "#F8F5FE",       // Very light purple tint
    textPrimaryLight: "#1E1B4B",   // Very dark purple
    textSecondaryLight: "#4C1D95", // Dark purple
    // Dark Mode
    backgroundDark: "#0F0B1E",     // Very dark purple
    surfaceDark: "#1A1530",        // Dark purple surface
    textPrimaryDark: "#F8F5FE",    // White with purple tint
    textSecondaryDark: "#A78BFA",  // Muted purple
    // Aliases utilitários
    espresso: "#1E1B4B",
    latte: "#A78BFA",
    cream: "#F8F5FE",
    steam: "#FFFFFF",
    mocha: "#7C3AED",
    caramel: "#8B5CF6",
  },
};

// ============================================
// SOMBRAS COM TONALIDADE MARROM (Warm Tinted Shadows)
// ============================================
const createTintedShadows = (mode: "light" | "dark"): string[] => {
  const warmTint =
    mode === "light"
      ? "rgba(124, 66, 38, 0.12)"   // marrom quente suave (light)
      : "rgba(212, 168, 117, 0.14)"; // caramelo em transparência (dark)

  const softTint =
    mode === "light"
      ? "rgba(44, 26, 17, 0.06)"
      : "rgba(196, 136, 95, 0.07)";

  return [
    "none",
    `0 1px 2px 0 ${softTint}`,
    `0 1px 3px 0 ${softTint}, 0 1px 2px -1px ${softTint}`,
    `0 2px 4px -1px ${softTint}, 0 1px 2px -1px ${softTint}`,
    `0 4px 6px -1px ${softTint}, 0 2px 4px -2px ${softTint}`,
    `0 6px 12px -2px ${warmTint}, 0 3px 6px -3px ${softTint}`,
    `0 8px 16px -3px ${warmTint}, 0 4px 8px -4px ${softTint}`,
    `0 10px 20px -4px ${warmTint}, 0 4px 8px -4px ${softTint}`,
    `0 12px 24px -5px ${warmTint}, 0 5px 10px -5px ${softTint}`,
    `0 14px 28px -6px ${warmTint}, 0 6px 12px -6px ${softTint}`,
    `0 16px 32px -6px ${warmTint}, 0 6px 12px -6px ${softTint}`,
    `0 18px 36px -8px ${warmTint}, 0 8px 16px -8px ${softTint}`,
    `0 20px 40px -8px ${warmTint}, 0 8px 16px -8px ${softTint}`,
    `0 24px 48px -10px ${warmTint}, 0 10px 20px -10px ${softTint}`,
    `0 28px 52px -10px ${warmTint}, 0 10px 20px -10px ${softTint}`,
    `0 32px 56px -12px ${warmTint}, 0 12px 24px -12px ${softTint}`,
    `0 36px 60px -12px ${warmTint}, 0 12px 24px -12px ${softTint}`,
    `0 40px 64px -14px ${warmTint}, 0 14px 28px -14px ${softTint}`,
    `0 44px 68px -14px ${warmTint}, 0 14px 28px -14px ${softTint}`,
    `0 48px 72px -16px ${warmTint}, 0 16px 32px -16px ${softTint}`,
    `0 52px 76px -16px ${warmTint}, 0 16px 32px -16px ${softTint}`,
    `0 56px 80px -18px ${warmTint}, 0 18px 36px -18px ${softTint}`,
    `0 60px 84px -18px ${warmTint}, 0 18px 36px -18px ${softTint}`,
    `0 64px 88px -20px ${warmTint}, 0 20px 40px -20px ${softTint}`,
    `0 68px 92px -20px ${warmTint}, 0 20px 40px -20px ${softTint}`,
  ];
};

// ============================================
// TIPOGRAFIA COZY — Playfair Display + Nunito
// ============================================
const typography: ThemeOptions["typography"] = {
  fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
  h1: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },
  h3: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  h4: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 600,
  },
  h5: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 600,
  },
  h6: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 600,
  },
  subtitle1: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 600,
  },
  subtitle2: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 600,
  },
  body1: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 400,
    lineHeight: 1.65,
  },
  body2: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 400,
    lineHeight: 1.55,
  },
  button: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 700,
    letterSpacing: "0.01em",
  },
  overline: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  caption: {
    fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    fontWeight: 400,
  },
};

// ============================================
// COMPONENTES MUI CUSTOMIZADOS — Cozy Coffee
// ============================================
const baseThemeOptions: ThemeOptions = {
  typography,
  shape: {
    borderRadius: BORDER_RADIUS,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 1024,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: "smooth",
        },
        "*:focus-visible": {
          outline: `2px solid ${alpha(coffeeColors.primary.main, 0.5)}`,
          outlineOffset: "2px",
          borderRadius: "4px",
        },
        "*:focus:not(:focus-visible)": {
          outline: "none",
        },
        "input, textarea, select": {
          "&:focus": { outline: "none" },
          "&:focus-visible": {
            outline: `2px solid ${alpha(coffeeColors.primary.main, 0.5)}`,
            outlineOffset: "2px",
          },
        },
        "button:focus-visible, [role='button']:focus-visible": {
          outline: `2px solid ${alpha(coffeeColors.primary.main, 0.5)}`,
          outlineOffset: "2px",
        },
        ".MuiOutlinedInput-root:focus-within": {
          outline: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          borderRadius: BORDER_RADIUS,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 10,
          paddingBottom: 10,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&:focus-visible": {
            outline: `2px solid ${alpha(coffeeColors.primary.main, 0.5)}`,
            outlineOffset: "2px",
          },
        },
        contained: {
          boxShadow: `0 4px 14px -3px ${alpha(coffeeColors.primary.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(coffeeColors.primary.main, 0.5)}`,
          },
        },
        containedSuccess: {
          boxShadow: `0 4px 14px -3px ${alpha(coffeeColors.success.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(coffeeColors.success.main, 0.5)}`,
          },
        },
        containedError: {
          boxShadow: `0 4px 14px -3px ${alpha(coffeeColors.error.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(coffeeColors.error.main, 0.5)}`,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
          },
          "&:focus-visible": {
            outline: `2px solid ${alpha(coffeeColors.primary.main, 0.5)}`,
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          transition: "all 0.25s ease-in-out",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
        elevation1: {
          boxShadow: `0 4px 12px -2px rgba(124, 66, 38, 0.10), 0 2px 6px -2px rgba(44, 26, 17, 0.06)`,
        },
        elevation2: {
          boxShadow: `0 6px 16px -3px rgba(124, 66, 38, 0.12), 0 3px 8px -3px rgba(44, 26, 17, 0.08)`,
        },
        elevation3: {
          boxShadow: `0 8px 20px -4px rgba(124, 66, 38, 0.15), 0 4px 10px -4px rgba(44, 26, 17, 0.08)`,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: BORDER_RADIUS,
          background: coffeeColors.primary.gradient,
          boxShadow: `0 8px 24px -4px ${alpha(coffeeColors.primary.main, 0.4)}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 12px 32px -4px ${alpha(coffeeColors.primary.main, 0.5)}`,
            background: coffeeColors.primary.gradient,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: BORDER_RADIUS,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              boxShadow: `0 2px 8px -2px ${alpha(coffeeColors.primary.main, 0.2)}`,
            },
            "&.Mui-focused": {
              boxShadow: `0 4px 12px -2px ${alpha(coffeeColors.primary.main, 0.25)}`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: coffeeColors.primary.main,
            borderWidth: 2,
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 3px ${alpha(coffeeColors.primary.main, 0.12)}`,
          },
        },
        notchedOutline: {
          transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        },
        input: {
          "&:focus": { outline: "none" },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: BORDER_RADIUS,
          marginTop: 8,
          boxShadow: `0 10px 40px -10px rgba(124, 66, 38, 0.25), 0 4px 16px -4px rgba(44, 26, 17, 0.12)`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: BORDER_RADIUS_SMALL,
          fontWeight: 600,
          backgroundColor: coffeeColors.neutral.espresso,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiPaper-root": { borderRadius: BORDER_RADIUS },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          "&:first-of-type": {
            borderTopLeftRadius: BORDER_RADIUS,
            borderTopRightRadius: BORDER_RADIUS,
          },
          "&:last-of-type": {
            borderBottomLeftRadius: BORDER_RADIUS,
            borderBottomRightRadius: BORDER_RADIUS,
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
        circular: { borderRadius: "50%" },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
        grouped: {
          borderRadius: BORDER_RADIUS,
          "&:not(:first-of-type)": { borderRadius: BORDER_RADIUS },
          "&:first-of-type": { borderRadius: BORDER_RADIUS },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
        indicator: {
          background: coffeeColors.primary.gradient,
          borderRadius: BORDER_RADIUS_SMALL,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          "& .MuiSlider-thumb": { borderRadius: BORDER_RADIUS },
          "& .MuiSlider-track": { borderRadius: BORDER_RADIUS },
          "& .MuiSlider-rail": { borderRadius: BORDER_RADIUS },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
        bar: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
        input: {
          "&:focus": { outline: "none" },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { borderRadius: BORDER_RADIUS },
        inputRoot: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiDatePicker: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiPickersPopper: {
      styleOverrides: {
        paper: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { borderRadius: BORDER_RADIUS_SMALL },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-thumb": { borderRadius: BORDER_RADIUS },
          "& .MuiSwitch-track": { borderRadius: BORDER_RADIUS },
        },
      },
    },
  },
};

// ============================================
// TEMA CLARO (Light Mode) — Cozy Coffee
// ============================================
export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: "light",
    primary: {
      main: coffeeColors.primary.main,     // #7B4226 — Mocha
      light: coffeeColors.primary.light,   // #A0622A — Cappuccino
      dark: coffeeColors.primary.dark,     // #5A2D0C
      contrastText: coffeeColors.primary.contrastText,
    },
    secondary: {
      main: coffeeColors.secondary.main,
      light: coffeeColors.secondary.light,
      dark: coffeeColors.secondary.dark,
      contrastText: coffeeColors.secondary.contrastText,
    },
    success: {
      main: coffeeColors.success.main,
      light: coffeeColors.success.light,
      dark: coffeeColors.success.dark,
      contrastText: coffeeColors.success.contrastText,
    },
    error: {
      main: coffeeColors.error.main,
      light: coffeeColors.error.light,
      dark: coffeeColors.error.dark,
      contrastText: coffeeColors.error.contrastText,
    },
    warning: {
      main: coffeeColors.warning.main,
      light: coffeeColors.warning.light,
      dark: coffeeColors.warning.dark,
      contrastText: coffeeColors.warning.contrastText,
    },
    info: {
      main: coffeeColors.info.main,
      light: coffeeColors.info.light,
      dark: coffeeColors.info.dark,
      contrastText: coffeeColors.info.contrastText,
    },
    background: {
      default: coffeeColors.neutral.backgroundLight,  // #FDF8F0
      paper: coffeeColors.neutral.surfaceLight,       // #FEF3E2
    },
    text: {
      primary: coffeeColors.neutral.textPrimaryLight,    // #2C1A11
      secondary: coffeeColors.neutral.textSecondaryLight, // #7B5A3C
    },
    divider: alpha(coffeeColors.neutral.textSecondaryLight, 0.18),
  },
  shadows: createTintedShadows("light") as any,
});

// ============================================
// TEMA ESCURO (Dark Mode) — Cozy Espresso
// ============================================
export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: "dark",
    primary: {
      main: coffeeColors.primary.darkMode,   // #D4A875 — Crème brûlée
      light: coffeeColors.secondary.light,   // #DDB899
      dark: coffeeColors.primary.light,      // #A0622A
      contrastText: "#2C1A11",
    },
    secondary: {
      main: coffeeColors.secondary.main,
      light: coffeeColors.secondary.light,
      dark: coffeeColors.secondary.dark,
      contrastText: coffeeColors.secondary.contrastText,
    },
    success: {
      main: coffeeColors.success.darkMode,
      light: coffeeColors.success.light,
      dark: coffeeColors.success.dark,
      contrastText: coffeeColors.success.contrastText,
    },
    error: {
      main: coffeeColors.error.darkMode,
      light: coffeeColors.error.light,
      dark: coffeeColors.error.dark,
      contrastText: coffeeColors.error.contrastText,
    },
    warning: {
      main: coffeeColors.warning.main,
      light: coffeeColors.warning.light,
      dark: coffeeColors.warning.dark,
      contrastText: coffeeColors.warning.contrastText,
    },
    info: {
      main: coffeeColors.info.main,
      light: coffeeColors.info.light,
      dark: coffeeColors.info.dark,
      contrastText: coffeeColors.info.contrastText,
    },
    background: {
      default: coffeeColors.neutral.backgroundDark,  // #1C1008
      paper: coffeeColors.neutral.surfaceDark,       // #2C1A10
    },
    text: {
      primary: coffeeColors.neutral.textPrimaryDark,    // #F0D9C0
      secondary: coffeeColors.neutral.textSecondaryDark, // #C4A882
    },
    divider: alpha(coffeeColors.neutral.textSecondaryDark, 0.2),
  },
  shadows: createTintedShadows("dark") as any,
});

// ============================================
// EXPORTAÇÕES ÚTEIS
// ============================================

export const STANDARD_BORDER_RADIUS = BORDER_RADIUS;
export const SMALL_BORDER_RADIUS = BORDER_RADIUS_SMALL;

// Cores coffee para uso direto em componentes
export const NIX_COLORS = coffeeColors;

// Gradientes coffee — Design System Cozy
export const NIX_GRADIENTS = {
  primary: coffeeColors.primary.gradient,
  primaryHover: "linear-gradient(135deg, #C4885F 0%, #A0622A 100%)",
  darkPrimary: coffeeColors.primary.gradientDark,
  caramel: "linear-gradient(135deg, #DDA855 0%, #C4883A 100%)",
  sage: `linear-gradient(135deg, ${coffeeColors.success.darkMode} 0%, ${coffeeColors.success.dark} 100%)`,
  dustyRose: `linear-gradient(135deg, ${coffeeColors.error.darkMode} 0%, ${coffeeColors.error.dark} 100%)`,
  // Warm steam gradient — fundos aconchegantes
  steamLight: `
    radial-gradient(ellipse 100% 80% at 5% 10%, rgba(196, 136, 95, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse 80% 70% at 90% 5%, rgba(196, 168, 100, 0.07) 0%, transparent 45%),
    radial-gradient(ellipse 60% 80% at 95% 50%, rgba(91, 138, 90, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 10% 85%, rgba(124, 66, 38, 0.06) 0%, transparent 50%)
  `,
  steamDark: `
    radial-gradient(ellipse 100% 80% at 5% 10%, rgba(212, 168, 117, 0.20) 0%, transparent 50%),
    radial-gradient(ellipse 80% 70% at 90% 5%, rgba(196, 136, 95, 0.14) 0%, transparent 45%),
    radial-gradient(ellipse 60% 80% at 95% 50%, rgba(122, 184, 122, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 10% 85%, rgba(196, 136, 95, 0.10) 0%, transparent 50%)
  `,
  // Alias para compatibilidade com código existente
  auroraLight: `
    radial-gradient(ellipse 100% 80% at 5% 10%, rgba(196, 136, 95, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse 80% 70% at 90% 5%, rgba(196, 168, 100, 0.07) 0%, transparent 45%),
    radial-gradient(ellipse 60% 80% at 95% 50%, rgba(91, 138, 90, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 10% 85%, rgba(124, 66, 38, 0.06) 0%, transparent 50%)
  `,
  auroraDark: `
    radial-gradient(ellipse 100% 80% at 5% 10%, rgba(212, 168, 117, 0.20) 0%, transparent 50%),
    radial-gradient(ellipse 80% 70% at 90% 5%, rgba(196, 136, 95, 0.14) 0%, transparent 45%),
    radial-gradient(ellipse 60% 80% at 95% 50%, rgba(122, 184, 122, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 10% 85%, rgba(196, 136, 95, 0.10) 0%, transparent 50%)
  `,
};

// Utilitário para sombras coloridas personalizadas
export const getTintedShadow = (
  color: string,
  intensity: "subtle" | "medium" | "strong" = "medium"
) => {
  const alphaValues = { subtle: 0.1, medium: 0.2, strong: 0.3 };
  const blurValues = { subtle: "12px", medium: "24px", strong: "40px" };
  const spreadValues = { subtle: "-4px", medium: "-8px", strong: "-12px" };
  return `0 10px ${blurValues[intensity]} ${spreadValues[intensity]} ${alpha(color, alphaValues[intensity])}`;
};

// Glassmorphism styles — Cozy Coffee
export const getGlassStyles = (mode: "light" | "dark") => ({
  background: mode === "dark"
    ? "rgba(44, 26, 16, 0.88)"    // torra escura translúcida
    : "rgba(253, 248, 240, 0.88)", // leite vaporizado translúcido
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${
    mode === "dark"
      ? "rgba(240, 217, 192, 0.08)"  // creme sutil no dark
      : "rgba(44, 26, 17, 0.07)"     // espresso sutil no light
  }`,
});
