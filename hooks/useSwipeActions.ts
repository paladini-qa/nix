import { useState, useCallback, useRef } from "react";
import {
  useMotionValue,
  useTransform,
  useAnimation,
  PanInfo,
} from "framer-motion";
import { hapticLight, hapticMedium } from "../services/capacitorService";

export interface SwipeActionsConfig {
  /** Threshold em pixels para ativar a ação (default: 80) */
  threshold?: number;
  /** Callback quando swipe para esquerda é confirmado (delete) */
  onSwipeLeft?: () => void;
  /** Callback quando swipe para direita é confirmado (edit) */
  onSwipeRight?: () => void;
  /** Se as ações de swipe estão habilitadas */
  enabled?: boolean;
}

export interface SwipeActionsReturn {
  /** MotionValue para o deslocamento X */
  x: ReturnType<typeof useMotionValue>;
  /** Controls para animação programática */
  controls: ReturnType<typeof useAnimation>;
  /** Handler para início do drag */
  onDragStart: () => void;
  /** Handler para durante o drag */
  onDrag: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  /** Handler para fim do drag */
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  /** Se está sendo arrastado */
  isDragging: boolean;
  /** Direção do swipe atual ("left" | "right" | null) */
  swipeDirection: "left" | "right" | null;
  /** Opacidade do botão esquerdo (delete) - 0 a 1 */
  leftActionOpacity: ReturnType<typeof useTransform>;
  /** Opacidade do botão direito (edit) - 0 a 1 */
  rightActionOpacity: ReturnType<typeof useTransform>;
  /** Escala do botão esquerdo (delete) */
  leftActionScale: ReturnType<typeof useTransform>;
  /** Escala do botão direito (edit) */
  rightActionScale: ReturnType<typeof useTransform>;
  /** Reseta a posição para o centro */
  reset: () => void;
}

/**
 * Hook para adicionar gestos de swipe esquerda/direita em elementos.
 * Usado para revelar ações de editar/deletar em cards de transação.
 * 
 * Características:
 * - Swipe para esquerda: Revelar botão de deletar (cor error.main)
 * - Swipe para direita: Revelar botão de editar (cor primary.main)
 * - Threshold de 80px para ativar a ação
 * - Animação de snap-back quando não atinge o threshold
 * - Haptic feedback ao atingir threshold e ao confirmar ação
 */
export const useSwipeActions = ({
  threshold = 80,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: SwipeActionsConfig = {}): SwipeActionsReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const hasTriggeredHaptic = useRef(false);

  const x = useMotionValue(0);
  const controls = useAnimation();

  // Transforms para opacidade e escala dos botões de ação
  const leftActionOpacity = useTransform(x, [-threshold, -threshold / 2, 0], [1, 0.5, 0]);
  const rightActionOpacity = useTransform(x, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const leftActionScale = useTransform(x, [-threshold * 1.2, -threshold, 0], [1.1, 1, 0.8]);
  const rightActionScale = useTransform(x, [0, threshold, threshold * 1.2], [0.8, 1, 1.1]);

  const onDragStart = useCallback(() => {
    if (!enabled) return;
    setIsDragging(true);
    hasTriggeredHaptic.current = false;
  }, [enabled]);

  const onDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enabled) return;

      const { offset } = info;
      const xOffset = offset.x;

      // Determina direção do swipe
      if (xOffset < -10) {
        setSwipeDirection("left");
      } else if (xOffset > 10) {
        setSwipeDirection("right");
      } else {
        setSwipeDirection(null);
      }

      // Haptic feedback ao atingir threshold
      if (!hasTriggeredHaptic.current) {
        if (Math.abs(xOffset) >= threshold) {
          hapticLight();
          hasTriggeredHaptic.current = true;
        }
      }
    },
    [enabled, threshold]
  );

  const onDragEnd = useCallback(
    async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enabled) {
        setIsDragging(false);
        setSwipeDirection(null);
        return;
      }

      const { offset, velocity } = info;
      const xOffset = offset.x;
      const xVelocity = velocity.x;

      // Considera velocidade para ações mais rápidas
      const shouldTriggerLeft = xOffset < -threshold || (xOffset < -threshold / 2 && xVelocity < -500);
      const shouldTriggerRight = xOffset > threshold || (xOffset > threshold / 2 && xVelocity > 500);

      if (shouldTriggerLeft && onSwipeLeft) {
        // Swipe para esquerda confirmado - ação de delete
        await hapticMedium();
        await controls.start({ x: -150, transition: { duration: 0.2 } });
        onSwipeLeft();
        // Reset após ação
        setTimeout(() => {
          controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
        }, 200);
      } else if (shouldTriggerRight && onSwipeRight) {
        // Swipe para direita confirmado - ação de edit
        await hapticMedium();
        await controls.start({ x: 150, transition: { duration: 0.2 } });
        onSwipeRight();
        // Reset após ação
        setTimeout(() => {
          controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
        }, 200);
      } else {
        // Snap back para posição original
        controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
      }

      setIsDragging(false);
      setSwipeDirection(null);
      hasTriggeredHaptic.current = false;
    },
    [enabled, threshold, onSwipeLeft, onSwipeRight, controls]
  );

  const reset = useCallback(() => {
    controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    setSwipeDirection(null);
    setIsDragging(false);
  }, [controls]);

  return {
    x,
    controls,
    onDragStart,
    onDrag,
    onDragEnd,
    isDragging,
    swipeDirection,
    leftActionOpacity,
    rightActionOpacity,
    leftActionScale,
    rightActionScale,
    reset,
  };
};

export default useSwipeActions;

