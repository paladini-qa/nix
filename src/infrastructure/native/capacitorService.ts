import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

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

// =============================================================================
// HAPTIC FEEDBACK
// =============================================================================

/**
 * Feedback háptico leve - para ações menores como swipe e hover
 * Ideal para: gestos de swipe, seleção de itens, navegação
 */
export const hapticLight = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.warn("Haptics plugin not available:", error);
  }
};

/**
 * Feedback háptico médio - para confirmações de ações
 * Ideal para: confirmação de toggle, seleção importante
 */
export const hapticMedium = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.warn("Haptics plugin not available:", error);
  }
};

/**
 * Feedback háptico pesado - para ações destrutivas ou importantes
 * Ideal para: deleção, cancelamento, erro
 */
export const hapticHeavy = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    console.warn("Haptics plugin not available:", error);
  }
};

/**
 * Feedback háptico de sucesso - para confirmações positivas
 * Ideal para: transação salva, meta atingida, pagamento confirmado
 */
export const hapticSuccess = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (error) {
    console.warn("Haptics plugin not available:", error);
  }
};

/**
 * Feedback háptico de aviso - para alertas e atenção
 * Ideal para: limite de orçamento próximo, campos obrigatórios
 */
export const hapticWarning = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (error) {
    console.warn("Haptics plugin not available:", error);
  }
};

/**
 * Feedback háptico de erro - para falhas e erros
 * Ideal para: erro de validação, falha de conexão
 */
export const hapticError = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (error) {
    console.warn("Haptics plugin not available:", error);
  }
};

/**
 * Vibração de seleção - feedback curto para seleções
 * Ideal para: selecionar item em lista, toggle checkbox
 */
export const hapticSelection = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch (error) {
    console.warn("Haptics plugin not available:", error);
  }
};

