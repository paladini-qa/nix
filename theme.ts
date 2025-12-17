import { createTheme, ThemeOptions } from "@mui/material/styles";

// Opções base compartilhadas entre os temas
const baseTheme: ThemeOptions = {
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
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
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
          padding: "10px 20px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
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
  },
};

// Tema claro
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "light",
    primary: {
      main: "#7c3aed", // Violet (combina com a logo)
      light: "#a78bfa",
      dark: "#6d28d9",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ec4899", // Pink
      light: "#f472b6",
      dark: "#db2777",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981", // Emerald
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444", // Red
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b", // Amber
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f3f4f6", // Gray-100
      paper: "#ffffff",
    },
    text: {
      primary: "#1f2937", // Gray-800
      secondary: "#6b7280", // Gray-500
    },
    divider: "#e5e7eb", // Gray-200
  },
});

// Tema escuro
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#a78bfa", // Violet-400 (combina com a logo)
      light: "#c4b5fd",
      dark: "#7c3aed",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#f472b6", // Pink-400
      light: "#f9a8d4",
      dark: "#ec4899",
      contrastText: "#ffffff",
    },
    success: {
      main: "#34d399", // Emerald-400
      light: "#6ee7b7",
      dark: "#10b981",
      contrastText: "#000000",
    },
    error: {
      main: "#f87171", // Red-400
      light: "#fca5a5",
      dark: "#ef4444",
      contrastText: "#000000",
    },
    warning: {
      main: "#fbbf24", // Amber-400
      light: "#fcd34d",
      dark: "#f59e0b",
      contrastText: "#000000",
    },
    background: {
      default: "#0f172a", // Slate-900
      paper: "#1e293b", // Slate-800
    },
    text: {
      primary: "#e2e8f0", // Slate-200
      secondary: "#94a3b8", // Slate-400
    },
    divider: "rgba(255, 255, 255, 0.1)",
  },
});



