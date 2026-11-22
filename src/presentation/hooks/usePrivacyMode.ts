import { useMemo } from "react";
import { usePrivacy } from "@/presentation/contexts/PrivacyContext";

/**
 * Hook para mascarar valores monetários no modo de privacidade.
 *
 * Os estilos de desfoque continuam disponíveis para consumidores legados.
 * Para ocultar texto renderizado, use formatPrivateValue.
 * 
 * @example
 * ```tsx
 * const { formatPrivateValue } = usePrivacyMode();
 * 
 * return (
 *   <Typography>
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
            transition: "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }
        : {
            filter: "blur(0px)",
            transition: "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
            transition: "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }
        : {
            filter: "blur(0px)",
            transition: "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
            transition: "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }
        : {
            filter: "blur(0px)",
            transition: "filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          },
    [isPrivacyMode]
  );

  /**
   * Formata um valor para exibição considerando o modo de privacidade.
   * O comprimento da máscara é independente do valor.
   */
  const formatPrivateValue = (value: string | number): string => {
    return isPrivacyMode ? "••••••" : String(value);
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
