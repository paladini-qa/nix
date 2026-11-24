import React, { ReactNode, useMemo } from "react";
import { ThemeProvider, CssBaseline, Paper, PaperProps } from "@mui/material";
import { Theme } from "@radix-ui/themes";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { ptBR as datePickerPtBR } from "@mui/x-date-pickers/locales";
import { createTheme, Theme as MuiTheme } from "@mui/material/styles";
import { ptBR as materialPtBR } from "@mui/material/locale";
import { Session } from "@supabase/supabase-js";
import {
  NotificationProvider,
  ConfirmDialogProvider,
  PrivacyProvider,
  SettingsProvider,
} from "@/presentation/contexts";

dayjs.locale("pt-br");

interface AppProvidersProps {
  children: ReactNode;
  /** Supabase session */
  session: Session;
  /** Radix appearance */
  darkMode: boolean;
  /** MUI theme instance */
  muiTheme: MuiTheme;
}

const DialogPaper = React.forwardRef<HTMLDivElement, PaperProps>((props, ref) => (
  <Theme asChild hasBackground={false}>
    <Paper {...props} ref={ref} />
  </Theme>
));
DialogPaper.displayName = "DialogPaper";

/**
 * Wraps the authenticated app shell: Radix Theme, MUI ThemeProvider,
 * LocalizationProvider, and app contexts (notifications, confirm, privacy).
 */
const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  session,
  darkMode,
  muiTheme,
}) => {
  const theme = useMemo(() => createTheme(muiTheme, materialPtBR, {
    components: { MuiDialog: { defaultProps: { PaperComponent: DialogPaper } } },
  }), [muiTheme]);

  return (
    <Theme appearance={darkMode ? "dark" : "light"} accentColor="purple" radius="large">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br" localeText={datePickerPtBR.components.MuiLocalizationProvider.defaultProps.localeText}>
          <SettingsProvider session={session}>
            <NotificationProvider>
              <ConfirmDialogProvider>
                <PrivacyProvider>{children}</PrivacyProvider>
              </ConfirmDialogProvider>
            </NotificationProvider>
          </SettingsProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </Theme>
  );
};

export default AppProviders;
