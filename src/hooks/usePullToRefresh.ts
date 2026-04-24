import { useState, useCallback, useRef, useEffect } from "react";
import { useMotionValue, useTransform, useAnimation } from "framer-motion";
import { hapticMedium, hapticSuccess } from "../services/capacitorService";

export interface PullToRefreshConfig {
  /** Distância em pixels para ativar o refresh (default: 80) */
  threshold?: number;
  /** Distância máxima de pull (default: 120) */
  maxPull?: number;
  /** Callback quando o refresh é acionado */
  onRefresh: () => Promise<void>;
  /** Se o pull-to-refresh está habilitado */
  enabled?: boolean;
}

export interface PullToRefreshReturn {
  /** MotionValue para o deslocamento Y */
  y: ReturnType<typeof useMotionValue>;
  /** Controls para animação programática */
  controls: ReturnType<typeof useAnimation>;
  /** Handler para início do pan/drag */
  onPanStart: () => void;
  /** Handler para durante o pan */
  onPan: (event: unknown, info: { offset: { y: number }; velocity: { y: number } }) => void;
  /** Handler para fim do pan */
  onPanEnd: () => void;
  /** Se está sendo puxado */
  isPulling: boolean;
  /** Se está refreshando (loading) */
  isRefreshing: boolean;
  /** Progresso do pull (0 a 1) */
  pullProgress: ReturnType<typeof useTransform>;
  /** Rotação do indicador de loading */
  indicatorRotation: ReturnType<typeof useTransform>;
  /** Opacidade do indicador */
  indicatorOpacity: ReturnType<typeof useTransform>;
  /** Escala do indicador */
  indicatorScale: ReturnType<typeof useTransform>;
  /** Força a atualização programaticamente */
  triggerRefresh: () => Promise<void>;
}

/**
 * Hook para adicionar funcionalidade de pull-to-refresh.
 * Usa framer-motion para animações suaves.
 * 
 * Características:
 * - Indicador visual com gradiente Nix Purple
 * - Animação de loading com rotação suave
 * - Haptic feedback ao ativar
 * - Threshold configurável
 */
export const usePullToRefresh = ({
  threshold = 80,
  maxPull = 120,
  onRefresh,
  enabled = true,
}: PullToRefreshConfig): PullToRefreshReturn => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasTriggeredHaptic = useRef(false);
  const startScrollTop = useRef(0);

  const y = useMotionValue(0);
  const controls = useAnimation();

  // Transforms para o indicador
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const indicatorRotation = useTransform(y, [0, threshold], [0, 180]);
  const indicatorOpacity = useTransform(y, [0, threshold / 3], [0, 1]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);

  // Animação de rotação contínua durante refresh
  useEffect(() => {
    let animationFrame: number;
    
    if (isRefreshing) {
      const animate = () => {
        controls.start({
          rotate: [0, 360],
          transition: { duration: 1, repeat: Infinity, ease: "linear" },
        });
      };
      animate();
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isRefreshing, controls]);

  const onPanStart = useCallback(() => {
    if (!enabled || isRefreshing) return;

    // Verifica se está no topo do scroll
    const scrollableParent = document.querySelector('[data-pull-to-refresh-container]');
    startScrollTop.current = scrollableParent?.scrollTop ?? window.scrollY;

    if (startScrollTop.current <= 0) {
      setIsPulling(true);
      hasTriggeredHaptic.current = false;
    }
  }, [enabled, isRefreshing]);

  const onPan = useCallback(
    (_event: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      if (!enabled || isRefreshing || !isPulling) return;

      const { offset } = info;
      const yOffset = offset.y;

      // Apenas permite pull para baixo e quando está no topo
      if (yOffset > 0 && startScrollTop.current <= 0) {
        // Aplica resistência ao pull
        const resistance = 0.5;
        const adjustedY = Math.min(yOffset * resistance, maxPull);
        y.set(adjustedY);

        // Haptic feedback ao atingir threshold
        if (!hasTriggeredHaptic.current && adjustedY >= threshold) {
          hapticMedium();
          hasTriggeredHaptic.current = true;
        }
      }
    },
    [enabled, isRefreshing, isPulling, y, threshold, maxPull]
  );

  const onPanEnd = useCallback(async () => {
    if (!enabled || isRefreshing) {
      setIsPulling(false);
      return;
    }

    const currentY = y.get();

    if (currentY >= threshold) {
      // Ativa o refresh
      setIsRefreshing(true);
      
      // Mantém o indicador visível durante o refresh
      await controls.start({ y: threshold, transition: { type: "spring", stiffness: 300, damping: 30 } });

      try {
        await onRefresh();
        await hapticSuccess();
      } catch (error) {
        console.error("Pull to refresh failed:", error);
      }

      setIsRefreshing(false);
    }

    // Retorna à posição original
    await controls.start({ y: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    y.set(0);

    setIsPulling(false);
    hasTriggeredHaptic.current = false;
  }, [enabled, isRefreshing, y, threshold, onRefresh, controls]);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing || !enabled) return;

    setIsRefreshing(true);
    
    // Anima o indicador para baixo
    y.set(threshold);
    await controls.start({ y: threshold, transition: { type: "spring", stiffness: 300, damping: 30 } });

    try {
      await onRefresh();
      await hapticSuccess();
    } catch (error) {
      console.error("Trigger refresh failed:", error);
    }

    setIsRefreshing(false);

    // Retorna à posição original
    await controls.start({ y: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    y.set(0);
  }, [isRefreshing, enabled, y, threshold, controls, onRefresh]);

  return {
    y,
    controls,
    onPanStart,
    onPan,
    onPanEnd,
    isPulling,
    isRefreshing,
    pullProgress,
    indicatorRotation,
    indicatorOpacity,
    indicatorScale,
    triggerRefresh,
  };
};

export default usePullToRefresh;

