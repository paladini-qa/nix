import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/shared/i18n/locales/en";
import ptBR from "@/shared/i18n/locales/pt-BR";

// Recursos de tradução
const resources = {
  en: { translation: en },
  "pt-BR": { translation: ptBR },
};

// Configuração do i18next
i18n
  .use(initReactI18next) // Integração com React
  .init({
    resources,
    lng: "en", // Idioma ativo forçado para Inglês
    fallbackLng: "en", // Idioma padrão
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // React já faz escape
    },

    // Configurações de namespace
    ns: ["translation"],
    defaultNS: "translation",
  });

export default i18n;

// Helper para obter o idioma atual (sempre inglês)
export const getBrowserLanguage = (): string => {
  return "en";
};

// Helper para sincronizar o idioma (sempre inglês)
export const syncWithBrowserLanguage = async () => {
  if (i18n.language !== "en") {
    await i18n.changeLanguage("en");
  }
};

// Idiomas disponíveis (para referência/UI)
export const availableLanguages = [
  { code: "en", name: "English", flag: "" },
];

// Tipo para idiomas
export type Language = "en" | "pt-BR";





