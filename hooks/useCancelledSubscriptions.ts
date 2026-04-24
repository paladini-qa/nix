import { useState, useCallback } from "react";

const storageKey = (userId: string) => `nix-cancelled-subs-${userId}`;

function readFromStorage(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function writeToStorage(userId: string, set: Set<string>): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(Array.from(set)));
  } catch {
    // silencia erros de quota/private browsing
  }
}

interface UseCancelledSubscriptions {
  cancelled: Set<string>;
  cancel: (name: string) => void;
  reactivate: (name: string) => void;
  isCancelled: (name: string) => boolean;
}

/**
 * Gerencia assinaturas encerradas por usuário usando localStorage.
 * A chave normalizada é lowercase+trim da descrição do serviço.
 */
export function useCancelledSubscriptions(userId: string): UseCancelledSubscriptions {
  const [cancelled, setCancelled] = useState<Set<string>>(() => readFromStorage(userId));

  const cancel = useCallback(
    (name: string) => {
      setCancelled((prev) => {
        const next = new Set(prev);
        next.add(name.trim().toLowerCase());
        writeToStorage(userId, next);
        return next;
      });
    },
    [userId]
  );

  const reactivate = useCallback(
    (name: string) => {
      setCancelled((prev) => {
        const next = new Set(prev);
        next.delete(name.trim().toLowerCase());
        writeToStorage(userId, next);
        return next;
      });
    },
    [userId]
  );

  const isCancelled = useCallback(
    (name: string) => cancelled.has(name.trim().toLowerCase()),
    [cancelled]
  );

  return { cancelled, cancel, reactivate, isCancelled };
}
