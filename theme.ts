import { createTheme, ThemeOptions, alpha } from "@mui/material/styles";

// ============================================
// NIX BRAND IDENTITY - Brand Book Implementation
// ============================================

// Border Radius padrão - 20px (Superellipse feel)
const BORDER_RADIUS = 20;
const BORDER_RADIUS_SMALL = 10; // Para elementos menores (buttons/inputs)

// ============================================
// PALETA DE CORES NIX - Design System Black & Purple
// ============================================
const nixColors = {
  // Cor Primária: Nix Purple (Gradiente)
  // O coração da marca - sabedoria, futuro e tecnologia
  primary: {
    main: "#9D4EDD", // Roxo Vibrante (Dark Mode primary)
    light: "#B47AEA", // Tom mais claro
    dark: "#7B2CBF", // Roxo Real (Light Mode primary)
    gradient: "linear-gradient(135deg, #9D4EDD 0%, #7B2CBF 100%)",
    contrastText: "#FFFFFF",
  },
  // Cor Secundária: Cyber Teal (Ciano)
  // Crescimento, dados fluindo, frescor
  secondary: {
    main: "#00D4FF", // Ciano vibrante
    light: "#5CE1E6",
    dark: "#00A3CC",
    contrastText: "#0A0A0A",
  },
  // Cores Semânticas
  success: {
    main: "#00C853", // Verde (Dark Mode)
    light: "#69F0AE",
    dark: "#2D6A4F", // Verde Escuro (Light Mode)
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#FF1744", // Vermelho (Dark Mode)
    light: "#FF616F",
    dark: "#C9184A", // Vinho (Light Mode)
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#F59E0B", // Amber
    light: "#FBBF24",
    dark: "#D97706",
    contrastText: "#0A0A0A",
  },
  info: {
    main: "#00D4FF", // Mesmo que secondary (Cyber Teal)
    light: "#5CE1E6",
    dark: "#00A3CC",
    contrastText: "#0A0A0A",
  },
  // Cores Neutras - Design System Black & Purple
  neutral: {
    // Dark Mode
    backgroundDark: "#0A0A0A", // Preto (fundo principal dark)
    surfaceDark: "#1A1A1A", // Cinza Escuro (cards, inputs, modais dark)
    textPrimaryDark: "#EDEDED", // Gelo (títulos e valores dark)
    textSecondaryDark: "#A0A0A0", // Cinza (subtítulos dark)
    // Light Mode
    backgroundLight: "#FFFFFF", // Branco (fundo principal light)
    surfaceLight: "#F4F4F9", // Cinza Gelo (cards, inputs, modais light)
    textPrimaryLight: "#121212", // Preto (títulos e valores light)
    textSecondaryLight: "#666666", // Cinza Médio (subtítulos light)
    // Legacy aliases for compatibility
    nixDark: "#0A0A0A",
    pureWhite: "#FFFFFF",
    softGray: "#F4F4F9",
    slate50: "#F8FAFC",
    slate100: "#F1F5F9",
    slate400: "#A0A0A0",
    slate600: "#666666",
    slate800: "#1A1A1A",
    slate900: "#0A0A0A",
  },
};

// ============================================
// SOMBRAS COM TONALIDADE ROXA (Tinted Shadows)
// Design System Black & Purple
// ============================================
const createTintedShadows = (mode: "light" | "dark"): string[] => {
  const purpleTint =
    mode === "light"
      ? "rgba(123, 44, 191, 0.12)" // #7B2CBF tint for light
      : "rgba(157, 78, 221, 0.18)"; // #9D4EDD tint for dark

  const softTint =
    mode === "light"
      ? "rgba(18, 18, 18, 0.06)" // #121212 tint
      : "rgba(160, 160, 160, 0.08)"; // #A0A0A0 tint

  return [
    "none",
    // Level 1-4: Sutil
    `0 1px 2px 0 ${softTint}`,
    `0 1px 3px 0 ${softTint}, 0 1px 2px -1px ${softTint}`,
    `0 2px 4px -1px ${softTint}, 0 1px 2px -1px ${softTint}`,
    `0 4px 6px -1px ${softTint}, 0 2px 4px -2px ${softTint}`,
    // Level 5-8: Médio
    `0 6px 12px -2px ${purpleTint}, 0 3px 6px -3px ${softTint}`,
    `0 8px 16px -3px ${purpleTint}, 0 4px 8px -4px ${softTint}`,
    `0 10px 20px -4px ${purpleTint}, 0 4px 8px -4px ${softTint}`,
    `0 12px 24px -5px ${purpleTint}, 0 5px 10px -5px ${softTint}`,
    // Level 9-12: Forte
    `0 14px 28px -6px ${purpleTint}, 0 6px 12px -6px ${softTint}`,
    `0 16px 32px -6px ${purpleTint}, 0 6px 12px -6px ${softTint}`,
    `0 18px 36px -8px ${purpleTint}, 0 8px 16px -8px ${softTint}`,
    `0 20px 40px -8px ${purpleTint}, 0 8px 16px -8px ${softTint}`,
    // Level 13-16: Extra forte
    `0 24px 48px -10px ${purpleTint}, 0 10px 20px -10px ${softTint}`,
    `0 28px 52px -10px ${purpleTint}, 0 10px 20px -10px ${softTint}`,
    `0 32px 56px -12px ${purpleTint}, 0 12px 24px -12px ${softTint}`,
    `0 36px 60px -12px ${purpleTint}, 0 12px 24px -12px ${softTint}`,
    // Level 17-20
    `0 40px 64px -14px ${purpleTint}, 0 14px 28px -14px ${softTint}`,
    `0 44px 68px -14px ${purpleTint}, 0 14px 28px -14px ${softTint}`,
    `0 48px 72px -16px ${purpleTint}, 0 16px 32px -16px ${softTint}`,
    `0 52px 76px -16px ${purpleTint}, 0 16px 32px -16px ${softTint}`,
    // Level 21-24
    `0 56px 80px -18px ${purpleTint}, 0 18px 36px -18px ${softTint}`,
    `0 60px 84px -18px ${purpleTint}, 0 18px 36px -18px ${softTint}`,
    `0 64px 88px -20px ${purpleTint}, 0 20px 40px -20px ${softTint}`,
    `0 68px 92px -20px ${purpleTint}, 0 20px 40px -20px ${softTint}`,
  ];
};

// ============================================
// TIPOGRAFIA NIX
// Poppins para títulos, Inter para corpo
// ============================================
const typography: ThemeOptions["typography"] = {
  fontFamily: '"Inter", "Segoe UI", sans-serif',
  h1: {
    fontFamily: '"Poppins", "Inter", sans-serif',
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  h2: {
    fontFamily: '"Poppins", "Inter", sans-serif',
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },
  h3: {
    fontFamily: '"Poppins", "Inter", sans-serif',
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  h4: {
    fontFamily: '"Poppins", "Inter", sans-serif',
    fontWeight: 600,
  },
  h5: {
    fontFamily: '"Poppins", "Inter", sans-serif',
    fontWeight: 600,
  },
  h6: {
    fontFamily: '"Poppins", "Inter", sans-serif',
    fontWeight: 600,
  },
  subtitle1: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontWeight: 500,
  },
  subtitle2: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontWeight: 500,
  },
  body1: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  body2: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  button: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  overline: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontWeight: 600,
    letterSpacing: "0.08em",
  },
  caption: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontWeight: 400,
  },
};

// ============================================
// COMPONENTES MUI CUSTOMIZADOS
// ============================================
const baseThemeOptions: ThemeOptions = {
  typography,
  shape: {
    borderRadius: BORDER_RADIUS,
  },
  // ============================================
  // BREAKPOINTS - Design System Responsivo
  // Mobile (< 600px), Tablet (600-1024px), Desktop (> 1024px)
  // ============================================
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,    // Mobile -> Tablet
      md: 1024,   // Tablet -> Desktop
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
        // Foco visível acessível - outline customizado com cor primária Nix
        "*:focus-visible": {
          outline: `2px solid ${alpha(nixColors.primary.main, 0.5)}`,
          outlineOffset: "2px",
          borderRadius: "4px",
        },
        // Remove outline padrão para :focus (apenas mantém :focus-visible)
        "*:focus:not(:focus-visible)": {
          outline: "none",
        },
        // Inputs e buttons precisam de tratamento especial
        "input, textarea, select": {
          "&:focus": {
            outline: "none",
          },
          "&:focus-visible": {
            outline: `2px solid ${alpha(nixColors.primary.main, 0.5)}`,
            outlineOffset: "2px",
          },
        },
        // Buttons e IconButtons
        "button:focus-visible, [role='button']:focus-visible": {
          outline: `2px solid ${alpha(nixColors.primary.main, 0.5)}`,
          outlineOffset: "2px",
        },
        // MUI Inputs já têm border highlight, não precisa de outline extra
        ".MuiOutlinedInput-root:focus-within": {
          outline: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
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
          // Foco visível acessível para botões
          "&:focus-visible": {
            outline: `2px solid ${alpha(nixColors.primary.main, 0.5)}`,
            outlineOffset: "2px",
          },
        },
        contained: {
          // Sombra com tonalidade roxa (Nix Purple)
          boxShadow: `0 4px 14px -3px ${alpha(nixColors.primary.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(nixColors.primary.main, 0.5)}`,
          },
        },
        containedSuccess: {
          boxShadow: `0 4px 14px -3px ${alpha(nixColors.success.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(nixColors.success.main, 0.5)}`,
          },
        },
        containedError: {
          boxShadow: `0 4px 14px -3px ${alpha(nixColors.error.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(nixColors.error.main, 0.5)}`,
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
          // Foco visível acessível para icon buttons
          "&:focus-visible": {
            outline: `2px solid ${alpha(nixColors.primary.main, 0.5)}`,
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
          boxShadow: `0 4px 12px -2px rgba(138, 43, 226, 0.1), 0 2px 6px -2px rgba(26, 26, 46, 0.06)`,
        },
        elevation2: {
          boxShadow: `0 6px 16px -3px rgba(138, 43, 226, 0.12), 0 3px 8px -3px rgba(26, 26, 46, 0.08)`,
        },
        elevation3: {
          boxShadow: `0 8px 20px -4px rgba(138, 43, 226, 0.15), 0 4px 10px -4px rgba(26, 26, 46, 0.08)`,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: BORDER_RADIUS,
          // Gradient background for FAB
          background: nixColors.primary.gradient,
          boxShadow: `0 8px 24px -4px ${alpha(nixColors.primary.main, 0.4)}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 12px 32px -4px ${alpha(nixColors.primary.main, 0.5)}`,
            background: nixColors.primary.gradient,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          fontWeight: 500,
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
              boxShadow: `0 2px 8px -2px ${alpha(nixColors.primary.main, 0.2)}`,
            },
            "&.Mui-focused": {
              boxShadow: `0 4px 12px -2px ${alpha(nixColors.primary.main, 0.25)}`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          // Usa border highlight nativo do MUI em vez de outline
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: nixColors.primary.main,
            borderWidth: 2,
          },
          // Adiciona sombra sutil no focus para acessibilidade
          "&.Mui-focused": {
            boxShadow: `0 0 0 3px ${alpha(nixColors.primary.main, 0.15)}`,
          },
        },
        notchedOutline: {
          transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        },
        input: {
          // Remove outline interno, deixa o container lidar com isso
          "&:focus": {
            outline: "none",
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: BORDER_RADIUS,
          marginTop: 8,
          boxShadow: `0 10px 40px -10px rgba(138, 43, 226, 0.25), 0 4px 16px -4px rgba(26, 26, 46, 0.12)`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: BORDER_RADIUS_SMALL,
          fontWeight: 500,
          backgroundColor: nixColors.neutral.nixDark,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiPaper-root": {
            borderRadius: BORDER_RADIUS,
          },
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
        root: {
          borderRadius: BORDER_RADIUS,
        },
        circular: {
          borderRadius: "50%",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
        grouped: {
          borderRadius: BORDER_RADIUS,
          "&:not(:first-of-type)": {
            borderRadius: BORDER_RADIUS,
          },
          "&:first-of-type": {
            borderRadius: BORDER_RADIUS,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
        indicator: {
          background: nixColors.primary.gradient,
          borderRadius: BORDER_RADIUS_SMALL,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          "& .MuiSlider-thumb": {
            borderRadius: BORDER_RADIUS,
          },
          "& .MuiSlider-track": {
            borderRadius: BORDER_RADIUS,
          },
          "& .MuiSlider-rail": {
            borderRadius: BORDER_RADIUS,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
        bar: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
        input: {
          // Input interno não precisa de outline, o container lida com isso
          "&:focus": {
            outline: "none",
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: BORDER_RADIUS,
        },
        inputRoot: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiDatePicker: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiPickersPopper: {
      styleOverrides: {
        paper: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: BORDER_RADIUS_SMALL,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-thumb": {
            borderRadius: BORDER_RADIUS,
          },
          "& .MuiSwitch-track": {
            borderRadius: BORDER_RADIUS,
          },
        },
      },
    },
  },
};

// ============================================
// TEMA CLARO (Light Mode) - Design System Black & Purple
// ============================================
export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: "light",
    primary: {
      main: nixColors.primary.dark, // #7B2CBF - Roxo Real para light mode
      light: nixColors.primary.main,
      dark: "#5A189A", // Tom ainda mais escuro
      contrastText: nixColors.primary.contrastText,
    },
    secondary: {
      main: nixColors.secondary.main,
      light: nixColors.secondary.light,
      dark: nixColors.secondary.dark,
      contrastText: nixColors.secondary.contrastText,
    },
    success: {
      main: nixColors.success.dark, // #2D6A4F - Verde Escuro para light mode
      light: nixColors.success.main,
      dark: "#1B4332",
      contrastText: "#FFFFFF",
    },
    error: {
      main: nixColors.error.dark, // #C9184A - Vinho para light mode
      light: nixColors.error.main,
      dark: "#A4133C",
      contrastText: "#FFFFFF",
    },
    warning: nixColors.warning,
    info: nixColors.info,
    background: {
      default: nixColors.neutral.backgroundLight, // #FFFFFF
      paper: nixColors.neutral.surfaceLight, // #F4F4F9
    },
    text: {
      primary: nixColors.neutral.textPrimaryLight, // #121212
      secondary: nixColors.neutral.textSecondaryLight, // #666666
    },
    divider: alpha(nixColors.neutral.textSecondaryLight, 0.2),
  },
  shadows: createTintedShadows("light") as any,
});

// ============================================
// TEMA ESCURO (Dark Mode) - Design System Black & Purple
// ============================================
export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: "dark",
    primary: {
      main: nixColors.primary.main, // #9D4EDD - Roxo Vibrante para dark mode
      light: nixColors.primary.light,
      dark: nixColors.primary.dark,
      contrastText: nixColors.primary.contrastText,
    },
    secondary: {
      main: nixColors.secondary.main,
      light: nixColors.secondary.light,
      dark: nixColors.secondary.dark,
      contrastText: nixColors.secondary.contrastText,
    },
    success: {
      main: nixColors.success.main, // #00C853 - Verde vibrante para dark mode
      light: nixColors.success.light,
      dark: nixColors.success.dark,
      contrastText: "#FFFFFF",
    },
    error: {
      main: nixColors.error.main, // #FF1744 - Vermelho vibrante para dark mode
      light: nixColors.error.light,
      dark: nixColors.error.dark,
      contrastText: "#FFFFFF",
    },
    warning: nixColors.warning,
    info: nixColors.info,
    background: {
      default: nixColors.neutral.backgroundDark, // #0A0A0A - Preto
      paper: nixColors.neutral.surfaceDark, // #1A1A1A - Cinza Escuro
    },
    text: {
      primary: nixColors.neutral.textPrimaryDark, // #EDEDED - Gelo
      secondary: nixColors.neutral.textSecondaryDark, // #A0A0A0 - Cinza
    },
    divider: alpha(nixColors.neutral.textSecondaryDark, 0.3),
  },
  shadows: createTintedShadows("dark") as any,
});

// ============================================
// EXPORTAÇÕES ÚTEIS
// ============================================

// Constante de border radius padrão
export const STANDARD_BORDER_RADIUS = BORDER_RADIUS;
export const SMALL_BORDER_RADIUS = BORDER_RADIUS_SMALL;

// Cores da marca Nix para uso direto em componentes
export const NIX_COLORS = nixColors;

// Gradientes da marca - Design System Black & Purple
export const NIX_GRADIENTS = {
  primary: nixColors.primary.gradient,
  primaryHover: "linear-gradient(135deg, #B47AEA 0%, #9D4EDD 100%)",
  teal: "linear-gradient(135deg, #00D4FF 0%, #00A3CC 100%)",
  success: `linear-gradient(135deg, ${nixColors.success.main} 0%, ${nixColors.success.dark} 100%)`,
  error: `linear-gradient(135deg, ${nixColors.error.main} 0%, ${nixColors.error.dark} 100%)`,
  // Aurora gradients para backgrounds
  auroraLight: `
    radial-gradient(ellipse 100% 80% at 5% 10%, rgba(123, 44, 191, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 80% 70% at 90% 5%, rgba(0, 212, 255, 0.06) 0%, transparent 45%),
    radial-gradient(ellipse 60% 80% at 95% 50%, rgba(45, 106, 79, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 10% 85%, rgba(157, 78, 221, 0.05) 0%, transparent 50%)
  `,
  auroraDark: `
    radial-gradient(ellipse 100% 80% at 5% 10%, rgba(157, 78, 221, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse 80% 70% at 90% 5%, rgba(0, 212, 255, 0.15) 0%, transparent 45%),
    radial-gradient(ellipse 60% 80% at 95% 50%, rgba(0, 200, 83, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 10% 85%, rgba(123, 44, 191, 0.12) 0%, transparent 50%)
  `,
};

// Utilitário para sombras coloridas personalizadas
export const getTintedShadow = (
  color: string,
  intensity: "subtle" | "medium" | "strong" = "medium"
) => {
  const alphaValues = {
    subtle: 0.1,
    medium: 0.2,
    strong: 0.3,
  };
  const blurValues = {
    subtle: "12px",
    medium: "24px",
    strong: "40px",
  };
  const spreadValues = {
    subtle: "-4px",
    medium: "-8px",
    strong: "-12px",
  };

  return `0 10px ${blurValues[intensity]} ${spreadValues[intensity]} ${alpha(color, alphaValues[intensity])}`;
};

// Glassmorphism styles helper - Design System Black & Purple
export const getGlassStyles = (mode: "light" | "dark") => ({
  background: mode === "dark" 
    ? "rgba(26, 26, 26, 0.85)" // #1A1A1A with transparency
    : "rgba(244, 244, 249, 0.85)", // #F4F4F9 with transparency
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${
    mode === "dark" 
      ? "rgba(237, 237, 237, 0.08)" // #EDEDED at 8%
      : "rgba(18, 18, 18, 0.06)" // #121212 at 6%
  }`,
});

