import React, { useState, useEffect } from "react";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { Theme } from "@radix-ui/themes";
import { lightTheme, darkTheme } from "@/shared/theme";
import AppShell from "@/presentation/layouts/shell/AppShell";
import AppProviders from "@/presentation/layouts/shell/AppProviders";
import LoginView from "@/presentation/views/LoginView";
import { supabase } from "@/infrastructure/database/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import { useSettingsQuery } from "@/presentation/hooks/useSettingsQuery";

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    let currentUserId: string | undefined;
    const applySession = (nextSession: Session | null) => {
      const nextUserId = nextSession?.user.id;
      if (currentUserId !== nextUserId) {
        useAppStore.setState(useAppStore.getInitialState());
        currentUserId = nextUserId;
      }
      setSession(nextSession);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
      setLoadingInitial(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: settings, isLoading: isLoadingSettings } = useSettingsQuery(session?.user?.id);

  const [themePref, setThemePref] = useState<string>(() =>
    localStorage.getItem("themePreference") || settings?.theme_preference || "system"
  );

  useEffect(() => {
    if (settings?.theme_preference) setThemePref(settings.theme_preference);
  }, [settings?.theme_preference]);

  useEffect(() => {
    const handler = (e: Event) => setThemePref((e as CustomEvent<string>).detail);
    window.addEventListener("nix:themechange", handler);
    return () => window.removeEventListener("nix:themechange", handler);
  }, []);

  const darkMode =
    themePref === "dark" ||
    (themePref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
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
    <AppProviders key={session.user.id} session={session} darkMode={darkMode} muiTheme={theme}>
      <AppShell session={session} />
    </AppProviders>
  );
};

export default App;
