import React, { ReactNode } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { Theme } from "@radix-ui/themes";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
import { Theme as MuiTheme } from "@mui/material/styles";
import { Session } from "@supabase/supabase-js";
import {
  NotificationProvider,
  ConfirmDialogProvider,
  PrivacyProvider,
  SettingsProvider,
} from "../contexts";

interface AppProvidersProps {
  children: ReactNode;
  /** Supabase session */
  session: Session;
  /** Radix appearance */
  darkMode: boolean;
  /** MUI theme instance */
  muiTheme: MuiTheme;
}

/**
 * Wraps the authenticated app shell: Radix Theme, MUI ThemeProvider,
 * LocalizationProvider, and app contexts (notifications, confirm, privacy).
 */
const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  session,
  darkMode,
  muiTheme,
}) => (
  <Theme appearance={darkMode ? "dark" : "light"} accentColor="purple" radius="large">
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
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

export default AppProviders;
