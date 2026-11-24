import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

export interface WalletTransaction {
  merchant: string;
  amount: number;
  currency: string;
}

interface WalletNotificationPlugin {
  checkNotificationAccess(): Promise<{ enabled: boolean }>;
  requestNotificationAccess(): Promise<void>;
  addListener(eventName: 'walletTransaction', listenerFunc: (transaction: WalletTransaction) => void): Promise<any>;
}

const WalletNotification = registerPlugin<WalletNotificationPlugin>('WalletNotification');

export const useWalletSync = (onTransactionDetected: (transaction: WalletTransaction) => void) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const checkStatus = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
      const { enabled } = await WalletNotification.checkNotificationAccess();
      setIsEnabled(enabled);
      return enabled;
    } catch (e) {
      console.error('Não foi possível verificar o acesso às notificações', e);
      return false;
    }
  }, []);

  const requestAccess = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
      await WalletNotification.requestNotificationAccess();
    } catch (e) {
      console.error('Não foi possível solicitar acesso às notificações', e);
    }
  }, []);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    checkStatus();

    const listener = WalletNotification.addListener('walletTransaction', (transaction) => {
      onTransactionDetected(transaction);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [onTransactionDetected, checkStatus]);

  return { isEnabled, checkStatus, requestAccess };
};
