import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Snackbar,
  Alert,
  AlertColor,
  AlertTitle,
  Slide,
  SlideProps,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

// Tipos de notificação
export interface Notification {
  id: string;
  message: string;
  title?: string;
  severity: AlertColor;
  duration?: number;
  action?: React.ReactNode;
}

interface NotificationContextType {
  // Métodos para mostrar notificações
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  // Método genérico
  showNotification: (notification: Omit<Notification, "id">) => void;
  // Método para fechar
  closeNotification: (id: string) => void;
  closeAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Transição de slide
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 3,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Gera ID único
  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Adiciona notificação
  const showNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = generateId();
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? 5000,
      };

      setNotifications((prev) => {
        // Limita quantidade de notificações
        const updated = [...prev, newNotification];
        if (updated.length > maxNotifications) {
          return updated.slice(-maxNotifications);
        }
        return updated;
      });

      // Auto-remove após duration
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          closeNotification(id);
        }, newNotification.duration);
      }
    },
    [maxNotifications]
  );

  // Métodos de conveniência
  const showSuccess = useCallback(
    (message: string, title?: string) => {
      showNotification({ message, title, severity: "success" });
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, title?: string) => {
      showNotification({ message, title, severity: "error", duration: 8000 });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, title?: string) => {
      showNotification({ message, title, severity: "warning", duration: 6000 });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => {
      showNotification({ message, title, severity: "info" });
    },
    [showNotification]
  );

  // Fecha notificação específica
  const closeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Fecha todas
  const closeAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue: NotificationContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    closeNotification,
    closeAll,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Renderiza notificações empilhadas */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{
            bottom: { xs: 80 + index * 70, lg: 24 + index * 70 },
          }}
        >
          <Alert
            severity={notification.severity}
            variant="filled"
            onClose={() => closeNotification(notification.id)}
            action={
              notification.action || (
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => closeNotification(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }
            sx={{
              minWidth: 300,
              maxWidth: 500,
              boxShadow: 6,
              "& .MuiAlert-message": {
                flex: 1,
              },
            }}
          >
            {notification.title && (
              <AlertTitle sx={{ fontWeight: 600 }}>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

// Hook para usar notificações
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

export default NotificationContext;


