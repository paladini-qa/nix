import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Verifica se o app está rodando em uma plataforma nativa (Android/iOS)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Retorna a plataforma atual ('android', 'ios', 'web')
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Adiciona classes CSS ao HTML para identificar a plataforma
 */
const addPlatformClasses = (): void => {
  const html = document.documentElement;
  const platform = getPlatform();

  if (isNativePlatform()) {
    html.classList.add("native-app");
    html.classList.add(`platform-${platform}`);
  } else {
    html.classList.add("platform-web");
  }
};

/**
 * Inicializa os plugins do Capacitor quando em plataforma nativa
 */
export const initializeCapacitor = async (): Promise<void> => {
  // Adiciona classes de plataforma ao HTML
  addPlatformClasses();

  if (!isNativePlatform()) {
    return;
  }

  try {
    // Configura a status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0F172A" });
  } catch (error) {
    console.warn("StatusBar plugin not available:", error);
  }
};

/**
 * Esconde o splash screen (chamar quando o app estiver pronto)
 */
export const hideSplashScreen = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await SplashScreen.hide({
      fadeOutDuration: 500,
    });
  } catch (error) {
    console.warn("SplashScreen plugin not available:", error);
  }
};

/**
 * Atualiza o estilo da status bar baseado no tema
 */
export const updateStatusBarStyle = async (isDarkMode: boolean): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({
      style: isDarkMode ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: isDarkMode ? "#0F172A" : "#F8FAFC",
    });
  } catch (error) {
    console.warn("StatusBar plugin not available:", error);
  }
};

