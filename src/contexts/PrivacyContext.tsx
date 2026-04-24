import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (value: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const PRIVACY_MODE_KEY = "nix_privacy_mode";

interface PrivacyProviderProps {
  children: React.ReactNode;
}

/**
 * PrivacyProvider - Gerencia o modo de privacidade do aplicativo.
 * 
 * Quando ativado, oculta valores monetários com efeito blur para
 * proteger informações sensíveis em ambientes públicos.
 * 
 * Features:
 * - Persistência no localStorage
 * - Toggle via UI (ícone de olho)
 * - Atalho de teclado Alt+P (web)
 */
export const PrivacyProvider: React.FC<PrivacyProviderProps> = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    // Inicializa do localStorage
    try {
      const stored = localStorage.getItem(PRIVACY_MODE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });

  // Persiste no localStorage quando muda
  useEffect(() => {
    try {
      localStorage.setItem(PRIVACY_MODE_KEY, String(isPrivacyMode));
    } catch {
      // Ignora erros de localStorage (modo incógnito, etc.)
    }
  }, [isPrivacyMode]);

  // Handler para atalho de teclado Alt+P (web)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+P para toggle privacy mode
      if (event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setIsPrivacyMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode((prev) => !prev);
  }, []);

  const setPrivacyMode = useCallback((value: boolean) => {
    setIsPrivacyMode(value);
  }, []);

  const value = useMemo(
    () => ({
      isPrivacyMode,
      togglePrivacyMode,
      setPrivacyMode,
    }),
    [isPrivacyMode, togglePrivacyMode, setPrivacyMode]
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
};

/**
 * Hook para acessar o contexto de privacidade.
 * 
 * @example
 * ```tsx
 * const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
 * 
 * return (
 *   <Typography sx={isPrivacyMode ? { filter: 'blur(8px)' } : {}}>
 *     R$ 1.234,56
 *   </Typography>
 * );
 * ```
 */
export const usePrivacy = (): PrivacyContextType => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
};

export default PrivacyProvider;
