import { useState, useEffect, useCallback } from "react";
import { onlineManager } from "@tanstack/react-query";
import { get, update } from "idb-keyval";

export interface PendingOp {
  id: string;
  type: "add" | "update" | "delete";
  payload: Record<string, unknown>;
  timestamp: number;
}

const queueKey = (userId: string) => `nix-sync-queue:${userId}`;

export async function enqueueSyncOp(
  userId: string,
  op: Omit<PendingOp, "id" | "timestamp">,
): Promise<void> {
  const entry = { ...op, id: crypto.randomUUID(), timestamp: Date.now() };
  await update<PendingOp[]>(queueKey(userId), (queue) => [...(queue ?? []), entry]);
}

export function useNetworkStatus(userId: string) {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const queue = await get<PendingOp[]>(queueKey(userId));
    setPendingCount(queue?.length ?? 0);
  }, [userId]);

  useEffect(() => {
    void refreshPendingCount();
    const unsub = onlineManager.subscribe(() => {
      setIsOnline(onlineManager.isOnline());
      void refreshPendingCount();
    });
    return unsub;
  }, [refreshPendingCount]);

  return { isOnline, pendingCount, refreshPendingCount };
}
