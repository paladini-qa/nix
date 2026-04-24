import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en";
import ptBR from "./locales/pt-BR";

// Recursos de tradução
const resources = {
  en: { translation: en },
  "pt-BR": { translation: ptBR },
};

// Configuração do i18next
i18n
  .use(LanguageDetector) // Detecta idioma do navegador
  .use(initReactI18next) // Integração com React
  .init({
    resources,
    fallbackLng: "en", // Idioma padrão caso o navegador use um idioma não suportado
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // React já faz escape
    },

    detection: {
      // Usa APENAS o idioma do navegador - sem cache
      order: ["navigator"],
      // Sem cache - sempre segue o navegador
      caches: [],
    },

    // Configurações de namespace
    ns: ["translation"],
    defaultNS: "translation",
  });

export default i18n;

// Helper para obter o idioma atual do navegador
export const getBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages?.[0] || "en";
  // Mapeia variantes de português para pt-BR
  if (browserLang.startsWith("pt")) {
    return "pt-BR";
  }
  // Mapeia variantes de inglês para en
  if (browserLang.startsWith("en")) {
    return "en";
  }
  // Retorna o idioma suportado mais próximo ou fallback
  return "en";
};

// Helper para sincronizar com o idioma do navegador (útil para mudanças de idioma em runtime)
export const syncWithBrowserLanguage = async () => {
  const browserLang = getBrowserLanguage();
  if (i18n.language !== browserLang) {
    await i18n.changeLanguage(browserLang);
  }
};

// Idiomas disponíveis (para referência/UI)
export const availableLanguages = [
  { code: "en", name: "English", flag: "" },
  { code: "pt-BR", name: "Português (Brasil)", flag: "" },
];

// Tipo para idiomas
export type Language = "en" | "pt-BR";





