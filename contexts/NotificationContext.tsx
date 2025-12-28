import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slide,
  alpha,
  keyframes,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

// Tipos de notificação
export type NotificationSeverity = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  message: string;
  title?: string;
  severity: NotificationSeverity;
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

// Animação de entrada
const slideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(100%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Animação de saída
const slideOut = keyframes`
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
`;

// Animação de barra de progresso
const progressBar = keyframes`
  0% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
`;

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

// Componente de notificação individual
interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  index: number;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose, index }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const getIcon = () => {
    switch (notification.severity) {
      case "success":
        return <CheckCircleIcon sx={{ fontSize: 22 }} />;
      case "error":
        return <ErrorIcon sx={{ fontSize: 22 }} />;
      case "warning":
        return <WarningIcon sx={{ fontSize: 22 }} />;
      case "info":
        return <InfoIcon sx={{ fontSize: 22 }} />;
    }
  };

  const getColor = () => {
    switch (notification.severity) {
      case "success":
        return theme.palette.success.main;
      case "error":
        return theme.palette.error.main;
      case "warning":
        return theme.palette.warning.main;
      case "info":
        return theme.palette.info.main;
    }
  };

  const color = getColor();

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 2,
        pr: 5,
        minWidth: 320,
        maxWidth: 420,
        borderRadius: "16px",
        overflow: "hidden",
        animation: `${slideIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        bgcolor: isDarkMode
          ? alpha(theme.palette.background.paper, 0.95)
          : "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${alpha(color, 0.25)}`,
        boxShadow: `
          0 4px 6px -1px ${alpha(color, 0.1)},
          0 10px 20px -5px ${alpha(color, 0.15)},
          0 20px 40px -10px ${alpha("#000000", isDarkMode ? 0.4 : 0.15)}
        `,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px) scale(1.01)",
          boxShadow: `
            0 6px 10px -2px ${alpha(color, 0.15)},
            0 15px 30px -8px ${alpha(color, 0.2)},
            0 25px 50px -12px ${alpha("#000000", isDarkMode ? 0.5 : 0.2)}
          `,
        },
      }}
    >
      {/* Ícone com gradiente */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(color, 0.12),
          color: color,
          flexShrink: 0,
        }}
      >
        {getIcon()}
      </Box>

      {/* Conteúdo */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {notification.title && (
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.01em",
              mb: 0.25,
            }}
          >
            {notification.title}
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{
            color: notification.title ? "text.secondary" : "text.primary",
            fontWeight: notification.title ? 400 : 500,
            lineHeight: 1.5,
          }}
        >
          {notification.message}
        </Typography>
        
        {/* Ação customizada */}
        {notification.action && (
          <Box sx={{ mt: 1.5 }}>{notification.action}</Box>
        )}
      </Box>

      {/* Botão de fechar */}
      <IconButton
        onClick={() => onClose(notification.id)}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          color: "text.secondary",
          bgcolor: isDarkMode
            ? alpha("#FFFFFF", 0.05)
            : alpha("#000000", 0.04),
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor: isDarkMode
              ? alpha("#FFFFFF", 0.1)
              : alpha("#000000", 0.08),
            color: "text.primary",
          },
        }}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>

      {/* Barra de progresso animada */}
      {notification.duration && notification.duration > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 3,
            bgcolor: alpha(color, 0.3),
            animation: `${progressBar} ${notification.duration}ms linear forwards`,
          }}
        />
      )}
    </Paper>
  );
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
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
      
      {/* Container de notificações - canto superior direito */}
      <Box
        sx={{
          position: "fixed",
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          pointerEvents: "none",
          "& > *": {
            pointerEvents: "auto",
          },
        }}
      >
        {notifications.map((notification, index) => (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={closeNotification}
            index={index}
          />
        ))}
      </Box>
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
