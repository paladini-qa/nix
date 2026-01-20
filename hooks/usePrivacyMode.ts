import { useMemo } from "react";
import { usePrivacy } from "../contexts/PrivacyContext";

/**
 * Hook para aplicar estilos de privacidade em valores monetários.
 * 
 * Retorna estilos CSS para blur e utilitários para exibir valores
 * de forma segura quando o modo de privacidade está ativo.
 * 
 * @example
 * ```tsx
 * const { isPrivacyMode, privacyStyles, formatPrivateValue } = usePrivacyMode();
 * 
 * return (
 *   <Typography sx={privacyStyles}>
 *     {formatPrivateValue("R$ 1.234,56")}
 *   </Typography>
 * );
 * ```
 */
export const usePrivacyMode = () => {
  const { isPrivacyMode, togglePrivacyMode, setPrivacyMode } = usePrivacy();

  // Estilos CSS para aplicar blur em valores
  const privacyStyles = useMemo(
    () =>
      isPrivacyMode
        ? {
            filter: "blur(8px)",
            userSelect: "none" as const,
            transition: "filter 0.2s ease-in-out",
          }
        : {
            filter: "none",
            transition: "filter 0.2s ease-in-out",
          },
    [isPrivacyMode]
  );

  // Estilos para blur mais suave (valores menores)
  const privacyStylesLight = useMemo(
    () =>
      isPrivacyMode
        ? {
            filter: "blur(6px)",
            userSelect: "none" as const,
            transition: "filter 0.2s ease-in-out",
          }
        : {
            filter: "none",
            transition: "filter 0.2s ease-in-out",
          },
    [isPrivacyMode]
  );

  // Estilos para blur intenso (valores grandes/destaque)
  const privacyStylesStrong = useMemo(
    () =>
      isPrivacyMode
        ? {
            filter: "blur(12px)",
            userSelect: "none" as const,
            transition: "filter 0.2s ease-in-out",
          }
        : {
            filter: "none",
            transition: "filter 0.2s ease-in-out",
          },
    [isPrivacyMode]
  );

  /**
   * Formata um valor para exibição considerando o modo de privacidade.
   * Quando ativo, retorna asteriscos em vez do valor real.
   */
  const formatPrivateValue = (value: string | number): string => {
    if (!isPrivacyMode) {
      return String(value);
    }
    // Retorna asteriscos do mesmo comprimento aproximado
    const length = String(value).length;
    return "•".repeat(Math.min(length, 12));
  };

  /**
   * Retorna o valor real ou um placeholder quando em modo privado.
   * Útil para screen readers e exportação de dados.
   */
  const getAccessibleValue = (value: string | number, label?: string): string => {
    if (!isPrivacyMode) {
      return String(value);
    }
    return label ? `${label}: valor oculto` : "valor oculto";
  };

  return {
    isPrivacyMode,
    togglePrivacyMode,
    setPrivacyMode,
    privacyStyles,
    privacyStylesLight,
    privacyStylesStrong,
    formatPrivateValue,
    getAccessibleValue,
  };
};

export default usePrivacyMode;
