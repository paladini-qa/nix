import { useState, useEffect, useCallback } from "react";
import { onlineManager } from "@tanstack/react-query";
import { get, set } from "idb-keyval";

export interface PendingOp {
  id: string;
  type: "add" | "update" | "delete";
  payload: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_KEY = "nix-sync-queue";

async function readQueue(): Promise<PendingOp[]> {
  return (await get<PendingOp[]>(QUEUE_KEY)) ?? [];
}

async function writeQueue(ops: PendingOp[]): Promise<void> {
  await set(QUEUE_KEY, ops);
}

export async function enqueueSyncOp(op: Omit<PendingOp, "id" | "timestamp">): Promise<void> {
  const queue = await readQueue();
  await writeQueue([
    ...queue,
    { ...op, id: crypto.randomUUID(), timestamp: Date.now() },
  ]);
}

export async function removeSyncOp(id: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((op) => op.id !== id));
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const queue = await readQueue();
    setPendingCount(queue.length);
  }, []);

  useEffect(() => {
    refreshPendingCount();
    const unsub = onlineManager.subscribe(() => {
      setIsOnline(onlineManager.isOnline());
    });
    return unsub;
  }, [refreshPendingCount]);

  return { isOnline, pendingCount, refreshPendingCount };
}
