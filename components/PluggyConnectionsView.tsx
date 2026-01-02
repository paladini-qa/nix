import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Tooltip,
  Fab,
  Stack,
  Skeleton,
} from "@mui/material";
import {
  Add as AddIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as TimeIcon,
  CloudSync as CloudSyncIcon,
  LinkOff as DisconnectIcon,
} from "@mui/icons-material";
import { PluggyConnect } from "react-pluggy-connect";
import { PluggyConnection, PluggySyncResult } from "../types";
import { pluggyService } from "../services/pluggyService";
import { useNotification, useConfirmDialog } from "../contexts";
import EmptyState from "./EmptyState";
import { AnimatedCard, AnimatedList } from "./motion";

interface PluggyConnectionsViewProps {
  userId: string;
  onTransactionsRefresh?: () => Promise<void>;
}

const PluggyConnectionsView: React.FC<PluggyConnectionsViewProps> = ({
  userId,
  onTransactionsRefresh,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError, showInfo } = useNotification();
  const { confirmDelete } = useConfirmDialog();

  // State
  const [connections, setConnections] = useState<PluggyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null); // itemId being synced
  const [syncingAll, setSyncingAll] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await pluggyService.getConnections();
      setConnections(data);
    } catch (error) {
      console.error("Error fetching connections:", error);
      showError("Erro ao carregar conexões");
    } finally {
      setLoading(false);
    }
  };

  // Open Pluggy Connect widget
  const handleOpenConnect = async (itemIdToUpdate?: string) => {
    setLoadingToken(true);
    try {
      const token = await pluggyService.getConnectToken(itemIdToUpdate);
      setConnectToken(token);
      setIsWidgetOpen(true);
    } catch (error: any) {
      console.error("Error getting connect token:", error);
      if (error.message?.includes("credentials not configured")) {
        showError("Pluggy não configurado. Configure as credenciais no Supabase.");
      } else {
        showError("Erro ao iniciar conexão. Tente novamente.");
      }
    } finally {
      setLoadingToken(false);
    }
  };

  // Handle successful connection
  const handleConnectSuccess = useCallback(
    async (data: { item: { id: string } }) => {
      setIsWidgetOpen(false);
      setConnectToken(null);

      try {
        const connection = await pluggyService.saveConnection(data.item.id);
        setConnections((prev) => {
          // Replace if exists, otherwise add
          const exists = prev.some((c) => c.itemId === connection.itemId);
          if (exists) {
            return prev.map((c) =>
              c.itemId === connection.itemId ? connection : c
            );
          }
          return [connection, ...prev];
        });
        showSuccess("Cartão conectado com sucesso!");

        // Auto-sync after connection
        handleSync(connection.itemId);
      } catch (error) {
        console.error("Error saving connection:", error);
        showError("Erro ao salvar conexão. Tente novamente.");
      }
    },
    []
  );

  // Handle widget close
  const handleConnectClose = useCallback(() => {
    setIsWidgetOpen(false);
    setConnectToken(null);
  }, []);

  // Sync transactions for a specific connection
  const handleSync = async (itemId: string) => {
    setSyncing(itemId);
    try {
      const result = await pluggyService.syncTransactions(itemId);
      handleSyncResult(result);
      // Update connection status
      setConnections((prev) =>
        prev.map((c) =>
          c.itemId === itemId
            ? { ...c, lastSyncAt: new Date().toISOString(), status: "active" }
            : c
        )
      );
      // Refresh transactions if callback provided
      if (onTransactionsRefresh) {
        await onTransactionsRefresh();
      }
    } catch (error) {
      console.error("Error syncing:", error);
      showError("Erro ao sincronizar. Tente novamente.");
      // Mark as error
      setConnections((prev) =>
        prev.map((c) => (c.itemId === itemId ? { ...c, status: "error" } : c))
      );
    } finally {
      setSyncing(null);
    }
  };

  // Sync all connections
  const handleSyncAll = async () => {
    if (connections.length === 0) return;

    setSyncingAll(true);
    try {
      const result = await pluggyService.syncTransactions();
      handleSyncResult(result);
      // Update all connections
      setConnections((prev) =>
        prev.map((c) => ({
          ...c,
          lastSyncAt: new Date().toISOString(),
          status: "active",
        }))
      );
      if (onTransactionsRefresh) {
        await onTransactionsRefresh();
      }
    } catch (error) {
      console.error("Error syncing all:", error);
      showError("Erro ao sincronizar. Tente novamente.");
    } finally {
      setSyncingAll(false);
    }
  };

  // Handle sync result message
  const handleSyncResult = (result: PluggySyncResult) => {
    if (result.success) {
      if (result.transactionsImported > 0) {
        showSuccess(
          `${result.transactionsImported} transações importadas, ${result.transactionsSkipped} já existiam.`
        );
      } else if (result.transactionsSkipped > 0) {
        showInfo("Nenhuma transação nova. Todas já foram importadas.");
      } else {
        showInfo("Nenhuma transação encontrada no período.");
      }
    } else {
      showError(result.errors?.[0] || "Erro na sincronização");
    }
  };

  // Delete connection
  const handleDelete = async (connection: PluggyConnection) => {
    const confirmed = await confirmDelete(
      connection.connectorName,
      "Esta ação irá desconectar o cartão. As transações já importadas serão mantidas."
    );

    if (!confirmed) return;

    try {
      await pluggyService.removeConnection(connection.itemId);
      setConnections((prev) =>
        prev.filter((c) => c.itemId !== connection.itemId)
      );
      showSuccess("Cartão desconectado");
    } catch (error) {
      console.error("Error deleting connection:", error);
      showError("Erro ao desconectar. Tente novamente.");
    }
  };

  // Format last sync date
  const formatLastSync = (dateStr?: string): string => {
    if (!dateStr) return "Nunca sincronizado";

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  // Get status color and icon
  const getStatusInfo = (status: PluggyConnection["status"]) => {
    switch (status) {
      case "active":
        return {
          color: theme.palette.success.main,
          icon: <CheckCircleIcon fontSize="small" />,
          label: "Ativo",
        };
      case "error":
        return {
          color: theme.palette.error.main,
          icon: <ErrorIcon fontSize="small" />,
          label: "Erro",
        };
      case "updating":
        return {
          color: theme.palette.warning.main,
          icon: <SyncIcon fontSize="small" className="spin" />,
          label: "Atualizando",
        };
      case "inactive":
        return {
          color: theme.palette.text.disabled,
          icon: <TimeIcon fontSize="small" />,
          label: "Inativo",
        };
      default:
        return {
          color: theme.palette.text.secondary,
          icon: null,
          label: status,
        };
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={350} height={24} />
        </Box>
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={100}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Conexões Bancárias
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Importe transações automaticamente via Open Finance
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          {connections.length > 0 && (
            <Button
              variant="outlined"
              startIcon={
                syncingAll ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SyncIcon />
                )
              }
              onClick={handleSyncAll}
              disabled={syncingAll || syncing !== null}
              sx={{
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              {syncingAll ? "Sincronizando..." : "Sincronizar Todos"}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={
              loadingToken ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
            onClick={() => handleOpenConnect()}
            disabled={loadingToken}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
              "&:hover": {
                boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          >
            Conectar Cartão
          </Button>
        </Stack>
      </Box>

      {/* Empty State */}
      {connections.length === 0 && (
        <EmptyState
          icon={<CreditCardIcon sx={{ fontSize: 64 }} />}
          title="Nenhum cartão conectado"
          description="Conecte seus cartões de crédito para importar transações automaticamente via Open Finance"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenConnect()}
              disabled={loadingToken}
              sx={{
                mt: 2,
                borderRadius: 2,
                textTransform: "none",
                px: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              Conectar Primeiro Cartão
            </Button>
          }
        />
      )}

      {/* Connections List */}
      {connections.length > 0 && (
        <AnimatedList staggerDelay={0.05}>
          <Stack spacing={2}>
            {connections.map((connection) => {
              const statusInfo = getStatusInfo(connection.status);
              const isSyncingThis = syncing === connection.itemId;

              return (
                <AnimatedCard key={connection.itemId}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      background:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.background.paper, 0.6)
                          : theme.palette.background.paper,
                      backdropFilter: "blur(12px)",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 30px ${alpha(
                          theme.palette.primary.main,
                          0.1
                        )}`,
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      {/* Logo/Avatar */}
                      <Avatar
                        src={connection.connectorLogo}
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          border: `2px solid ${alpha(
                            theme.palette.primary.main,
                            0.2
                          )}`,
                        }}
                      >
                        <CreditCardIcon
                          sx={{ color: theme.palette.primary.main }}
                        />
                      </Avatar>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {connection.connectorName}
                          </Typography>
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              bgcolor: alpha(statusInfo.color, 0.1),
                              color: statusInfo.color,
                              fontWeight: 500,
                              "& .MuiChip-icon": {
                                color: statusInfo.color,
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          <TimeIcon
                            sx={{
                              fontSize: 14,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {formatLastSync(connection.lastSyncAt)}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Sincronizar agora">
                          <span>
                            <IconButton
                              onClick={() => handleSync(connection.itemId)}
                              disabled={isSyncingThis || syncingAll}
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                "&:hover": {
                                  bgcolor: alpha(
                                    theme.palette.primary.main,
                                    0.2
                                  ),
                                },
                              }}
                            >
                              {isSyncingThis ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <SyncIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Desconectar">
                          <IconButton
                            onClick={() => handleDelete(connection)}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              color: theme.palette.error.main,
                              "&:hover": {
                                bgcolor: alpha(theme.palette.error.main, 0.2),
                              },
                            }}
                          >
                            <DisconnectIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Paper>
                </AnimatedCard>
              );
            })}
          </Stack>
        </AnimatedList>
      )}

      {/* Floating Action Button (Mobile) */}
      {isMobile && connections.length > 0 && (
        <Fab
          color="primary"
          onClick={() => handleOpenConnect()}
          disabled={loadingToken}
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
          }}
        >
          {loadingToken ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <AddIcon />
          )}
        </Fab>
      )}

      {/* Pluggy Connect Widget */}
      {isWidgetOpen && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          onSuccess={handleConnectSuccess}
          onClose={handleConnectClose}
          onError={(error) => {
            console.error("Pluggy Connect error:", error);
            showError("Erro na conexão. Tente novamente.");
            handleConnectClose();
          }}
        />
      )}

      {/* CSS for spinning icon */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};

export default PluggyConnectionsView;

