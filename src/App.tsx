import React, { useState, useEffect } from "react";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { Theme } from "@radix-ui/themes";
import { lightTheme, darkTheme } from "./theme";
import AppShell from "./components/AppShell";
import AppProviders from "./components/AppProviders";
import LoginView from "./components/LoginView";
import { supabase } from "./services/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { useAppStore } from "./hooks/useAppStore";
import { useSettingsQuery } from "./hooks/useSettingsQuery";

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const { filters } = useAppStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingInitial(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: settings, isLoading: isLoadingSettings } = useSettingsQuery(session?.user?.id);

  const themePreference = settings?.theme_preference || "system";
  const darkMode = 
    themePreference === "dark" || 
    (themePreference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = darkMode ? darkTheme : lightTheme;

  if (loadingInitial || (session && isLoadingSettings)) {
    return (
      <Theme appearance={darkMode ? "dark" : "light"} accentColor="purple" radius="large">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
            <CircularProgress color="primary" size={48} />
          </Box>
        </ThemeProvider>
      </Theme>
    );
  }

  if (!session) {
    return (
      <Theme appearance={darkMode ? "dark" : "light"} accentColor="purple" radius="large">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LoginView />
        </ThemeProvider>
      </Theme>
    );
  }

  return (
    <AppProviders darkMode={darkMode} muiTheme={theme}>
      <AppShell />
    </AppProviders>
  );
};

export default App;
