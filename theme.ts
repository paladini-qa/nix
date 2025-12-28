import { createTheme, ThemeOptions, alpha } from "@mui/material/styles";

// ============================================
// BORDER RADIUS PADRÃO - 20px em toda a aplicação
// ============================================
const BORDER_RADIUS = 20;

// Paleta sofisticada - cores ligeiramente desaturadas para um visual premium
const colors = {
  primary: {
    main: "#4F46E5", // Deep Indigo
    light: "#6366F1",
    dark: "#3730A3",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#A855F7", // Soft Violet
    light: "#C084FC",
    dark: "#7E22CE",
    contrastText: "#FFFFFF",
  },
  success: {
    main: "#059669", // Deep Emerald (desaturado)
    light: "#10B981",
    dark: "#047857",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#DC2626", // Deep Red (desaturado)
    light: "#EF4444",
    dark: "#B91C1C",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#D97706", // Deep Amber
    light: "#F59E0B",
    dark: "#B45309",
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#0284C7", // Deep Sky Blue
    light: "#0EA5E9",
    dark: "#0369A1",
    contrastText: "#FFFFFF",
  },
};

// Sombras customizadas com tonalidades de cor (não preto puro!)
// Formato: [none, 1-6: subtle, 7-12: medium, 13-24: strong]
const createTintedShadows = (mode: "light" | "dark"): string[] => {
  const primaryTint =
    mode === "light"
      ? "rgba(79, 70, 229, 0.08)" // Indigo tint for light
      : "rgba(99, 102, 241, 0.15)"; // Brighter indigo for dark

  const softTint =
    mode === "light"
      ? "rgba(100, 116, 139, 0.06)" // Slate tint
      : "rgba(148, 163, 184, 0.08)";

  return [
    "none",
    // Level 1-4: Sutil - para elementos de fundo
    `0 1px 2px 0 ${softTint}`,
    `0 1px 3px 0 ${softTint}, 0 1px 2px -1px ${softTint}`,
    `0 2px 4px -1px ${softTint}, 0 1px 2px -1px ${softTint}`,
    `0 4px 6px -1px ${softTint}, 0 2px 4px -2px ${softTint}`,
    // Level 5-8: Médio - para cards e elementos interativos
    `0 6px 12px -2px ${primaryTint}, 0 3px 6px -3px ${softTint}`,
    `0 8px 16px -3px ${primaryTint}, 0 4px 8px -4px ${softTint}`,
    `0 10px 20px -4px ${primaryTint}, 0 4px 8px -4px ${softTint}`,
    `0 12px 24px -5px ${primaryTint}, 0 5px 10px -5px ${softTint}`,
    // Level 9-12: Forte - para modais e elementos flutuantes
    `0 14px 28px -6px ${primaryTint}, 0 6px 12px -6px ${softTint}`,
    `0 16px 32px -6px ${primaryTint}, 0 6px 12px -6px ${softTint}`,
    `0 18px 36px -8px ${primaryTint}, 0 8px 16px -8px ${softTint}`,
    `0 20px 40px -8px ${primaryTint}, 0 8px 16px -8px ${softTint}`,
    // Level 13-16: Extra forte
    `0 24px 48px -10px ${primaryTint}, 0 10px 20px -10px ${softTint}`,
    `0 28px 52px -10px ${primaryTint}, 0 10px 20px -10px ${softTint}`,
    `0 32px 56px -12px ${primaryTint}, 0 12px 24px -12px ${softTint}`,
    `0 36px 60px -12px ${primaryTint}, 0 12px 24px -12px ${softTint}`,
    // Level 17-20
    `0 40px 64px -14px ${primaryTint}, 0 14px 28px -14px ${softTint}`,
    `0 44px 68px -14px ${primaryTint}, 0 14px 28px -14px ${softTint}`,
    `0 48px 72px -16px ${primaryTint}, 0 16px 32px -16px ${softTint}`,
    `0 52px 76px -16px ${primaryTint}, 0 16px 32px -16px ${softTint}`,
    // Level 21-24
    `0 56px 80px -18px ${primaryTint}, 0 18px 36px -18px ${softTint}`,
    `0 60px 84px -18px ${primaryTint}, 0 18px 36px -18px ${softTint}`,
    `0 64px 88px -20px ${primaryTint}, 0 20px 40px -20px ${softTint}`,
    `0 68px 92px -20px ${primaryTint}, 0 20px 40px -20px ${softTint}`,
  ];
};

// Configuração base compartilhada
const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    overline: {
      fontWeight: 600,
      letterSpacing: "0.08em",
    },
  },
  shape: {
    borderRadius: BORDER_RADIUS, // 20px - padrão global
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: "smooth",
        },
        // Remove outline de foco de todos os inputs
        "input, textarea, select, button": {
          "&:focus": {
            outline: "none !important",
          },
          "&:focus-visible": {
            outline: "none !important",
          },
        },
        ".MuiOutlinedInput-input": {
          "&:focus": {
            outline: "none !important",
          },
          "&:focus-visible": {
            outline: "none !important",
          },
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
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        contained: {
          boxShadow: `0 4px 14px -3px ${alpha(colors.primary.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(colors.primary.main, 0.5)}`,
          },
        },
        containedSuccess: {
          boxShadow: `0 4px 14px -3px ${alpha(colors.success.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(colors.success.main, 0.5)}`,
          },
        },
        containedError: {
          boxShadow: `0 4px 14px -3px ${alpha(colors.error.main, 0.4)}`,
          "&:hover": {
            boxShadow: `0 6px 20px -3px ${alpha(colors.error.main, 0.5)}`,
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
          boxShadow: `0 4px 12px -2px rgba(79, 70, 229, 0.08), 0 2px 6px -2px rgba(100, 116, 139, 0.06)`,
        },
        elevation2: {
          boxShadow: `0 6px 16px -3px rgba(79, 70, 229, 0.1), 0 3px 8px -3px rgba(100, 116, 139, 0.08)`,
        },
        elevation3: {
          boxShadow: `0 8px 20px -4px rgba(79, 70, 229, 0.12), 0 4px 10px -4px rgba(100, 116, 139, 0.08)`,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: BORDER_RADIUS,
          boxShadow: `0 8px 24px -4px ${alpha(colors.primary.main, 0.35)}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 12px 32px -4px ${alpha(colors.primary.main, 0.45)}`,
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
              boxShadow: `0 2px 8px -2px ${alpha(colors.primary.main, 0.15)}`,
            },
            "&.Mui-focused": {
              boxShadow: `0 4px 12px -2px ${alpha(colors.primary.main, 0.2)}`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          outline: "none !important",
          "&:focus": {
            outline: "none !important",
          },
          "&:focus-visible": {
            outline: "none !important",
          },
          "&:focus-within": {
            outline: "none !important",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "inherit",
          },
        },
        notchedOutline: {
          outline: "none !important",
          transition: "border-color 0.2s ease-in-out",
        },
        input: {
          outline: "none !important",
          "&:focus": {
            outline: "none !important",
          },
          "&:focus-visible": {
            outline: "none !important",
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
          boxShadow: `0 10px 40px -10px rgba(79, 70, 229, 0.2), 0 4px 16px -4px rgba(100, 116, 139, 0.1)`,
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
          borderRadius: BORDER_RADIUS,
          fontWeight: 500,
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
          borderRadius: "50%", // Mantém circular quando especificado
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
          outline: "none !important",
          "&:focus": {
            outline: "none !important",
          },
          "&:focus-visible": {
            outline: "none !important",
          },
        },
        input: {
          outline: "none !important",
          "&:focus": {
            outline: "none !important",
          },
          "&:focus-visible": {
            outline: "none !important",
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
          borderRadius: BORDER_RADIUS,
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
          borderRadius: 0, // Drawer sem cantos arredondados
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

// Tema claro
export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: "light",
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    background: {
      default: "#F8FAFC", // Slate-50 - nunca branco puro
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A", // Slate-900
      secondary: "#475569", // Slate-600
    },
    divider: alpha("#94A3B8", 0.2), // Slate-400 com transparência
  },
  shadows: createTintedShadows("light") as any,
});

// Tema escuro
export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: "dark",
    primary: {
      ...colors.primary,
      main: "#6366F1", // Mais brilhante no dark mode
    },
    secondary: {
      ...colors.secondary,
      main: "#A78BFA", // Mais brilhante no dark mode
    },
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    background: {
      default: "#0F172A", // Slate-900
      paper: "#1E293B", // Slate-800
    },
    text: {
      primary: "#F1F5F9", // Slate-100
      secondary: "#94A3B8", // Slate-400
    },
    divider: alpha("#475569", 0.3), // Slate-600 com transparência
  },
  shadows: createTintedShadows("dark") as any,
});

// Exporta a constante de border radius para uso em componentes customizados
export const STANDARD_BORDER_RADIUS = BORDER_RADIUS;

// Exporta utilitário para sombras coloridas personalizadas
export const getTintedShadow = (
  color: string,
  intensity: "subtle" | "medium" | "strong" = "medium"
) => {
  const alphaValues = {
    subtle: 0.08,
    medium: 0.15,
    strong: 0.25,
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
