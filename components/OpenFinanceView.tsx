import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { OpenFinanceConnection, PendingTransaction } from "../types";
import { openFinanceService } from "../services/api";
import { useNotification } from "../contexts";
import EmptyState from "./EmptyState";
import AddConnectionDialog from "./AddConnectionDialog";
import EditConnectionDialog from "./EditConnectionDialog";
import PendingTransactionsView from "./PendingTransactionsView";
import { pluggyService } from "../services/pluggyService";

const MotionCard = motion.create(Card);

interface OpenFinanceViewProps {
  userId: string;
  paymentMethods: string[];
  categories: { income: string[]; expense: string[] };
  onTransactionCreate?: (transaction: any) => void;
}

const OpenFinanceView: React.FC<OpenFinanceViewProps> = ({
  userId,
  paymentMethods,
  categories,
  onTransactionCreate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { showNotification } = useNotification();

  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<OpenFinanceConnection | null>(null);
  const [pendingViewOpen, setPendingViewOpen] = useState(false);

  // Carrega conexões e transações pendentes
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [conns, pending] = await Promise.all([
        openFinanceService.getConnections(userId),
        openFinanceService.getPendingTransactions(userId, { status: "pending" }),
      ]);
      setConnections(conns);
      setPendingTransactions(pending);
    } catch (error: any) {
      console.error("Error loading Open Finance data:", error);
      showNotification({ message: "Erro ao carregar dados do Open Finance", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [userId, showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sincroniza uma conexão
  const handleSync = useCallback(
    async (connection: OpenFinanceConnection) => {
      try {
        setIsSyncing(connection.id);
        showNotification({ message: "Sincronizando transações...", severity: "info" });

        // Importa pluggyService dinamicamente para evitar erro se não configurado
        const { pluggyService } = await import("../services/pluggyService");

        // Inicia sincronização
        await pluggyService.syncItem(connection.pluggyItemId);

        // Aguarda sincronização completar
        await pluggyService.waitForItemSync(connection.pluggyItemId);

        // Busca transações
        const transactionsData = await pluggyService.getTransactions(connection.pluggyItemId, {
          pageSize: 500,
        });

        // Cria transações pendentes
        const transactionsToCreate = transactionsData.results.map((tx) => ({
          connectionId: connection.id,
          pluggyTransactionId: tx.id,
          rawDescription: tx.description,
          rawAmount: Math.abs(tx.amount),
          rawDate: tx.date.split("T")[0], // Converte ISO para YYYY-MM-DD
          rawType: tx.type,
        }));

        const created = await openFinanceService.createPendingTransactions(
          userId,
          transactionsToCreate
        );

        // Atualiza last_sync_at
        await openFinanceService.updateConnection(connection.id, userId, {
          lastSyncAt: new Date().toISOString(),
        });

        showNotification({
          message: `${created} nova(s) transação(ões) sincronizada(s)`,
          severity: "success",
        });

        // Recarrega dados
        await loadData();
      } catch (error: any) {
        console.error("Error syncing connection:", error);
        showNotification({
          message: error.message || "Erro ao sincronizar conexão",
          severity: "error",
        });
      } finally {
        setIsSyncing(null);
      }
    },
    [userId, loadData, showNotification]
  );

  // Deleta uma conexão
  const handleDelete = useCallback(
    async (connection: OpenFinanceConnection) => {
      try {
        // Importa pluggyService dinamicamente
        const { pluggyService } = await import("../services/pluggyService");

        // Deleta no Pluggy
        await pluggyService.deleteItem(connection.pluggyItemId);

        // Deleta no banco
        await openFinanceService.deleteConnection(connection.id, userId);

        showNotification({ message: "Conexão removida com sucesso", severity: "success" });
        await loadData();
      } catch (error: any) {
        console.error("Error deleting connection:", error);
        showNotification({
          message: error.message || "Erro ao remover conexão",
          severity: "error",
        });
      }
    },
    [userId, loadData, showNotification]
  );

  // Abre dialog de edição
  const handleEdit = useCallback((connection: OpenFinanceConnection) => {
    setSelectedConnection(connection);
    setEditDialogOpen(true);
  }, []);

  // Abre modal da Pluggy diretamente
  const handleOpenPluggyModal = useCallback(async () => {
    try {
      // Carrega conectores disponíveis
      const connectors = await pluggyService.getConnectors();
      
      if (connectors.length === 0) {
        showNotification({
          message: "Nenhum banco disponível no momento",
          severity: "warning",
        });
        return;
      }

      // Usa o primeiro conector disponível (ou pode ser modificado para permitir escolha)
      const connector = connectors[0];

      // Cria connect token
      const { connectUrl } = await pluggyService.createConnectToken(
        connector.id,
        userId
      );

      // Abre janela do Pluggy Connect
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const connectWindow = window.open(
        connectUrl,
        "Pluggy Connect",
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!connectWindow) {
        throw new Error("Não foi possível abrir a janela de conexão");
      }

      // Listener para mensagens do Pluggy (postMessage)
      const messageHandler = async (event: MessageEvent) => {
        // Verifica origem (Pluggy pode enviar mensagens)
        if (event.origin !== "https://connect.pluggy.ai") {
          return;
        }

        // Se recebeu item_id, cria a conexão
        if (event.data?.itemId) {
          window.removeEventListener("message", messageHandler);
          connectWindow.close();

          try {
            // Busca informações do item
            const item = await pluggyService.getItem(event.data.itemId);

            // Cria conexão no banco
            await openFinanceService.createConnection(userId, {
              pluggyItemId: item.id,
              pluggyConnectorId: connector.id,
              institutionName: connector.name,
            });

            showNotification({ message: "Conexão criada com sucesso!", severity: "success" });
            await loadData();
          } catch (error: any) {
            console.error("Error creating connection:", error);
            showNotification({
              message: error.message || "Erro ao criar conexão",
              severity: "error",
            });
          }
        }
      };

      window.addEventListener("message", messageHandler);

      // Monitora quando a janela fecha (fallback)
      const checkClosed = setInterval(() => {
        if (connectWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageHandler);
        }
      }, 500);

      // Timeout de segurança
      setTimeout(() => {
        if (!connectWindow.closed) {
          connectWindow.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener("message", messageHandler);
      }, 300000); // 5 minutos
    } catch (error: any) {
      console.error("Error opening Pluggy modal:", error);
      showNotification({
        message: error.message || "Erro ao abrir modal da Pluggy",
        severity: "error",
      });
    }
  }, [userId, loadData, showNotification]);

  // Fecha dialog de edição e recarrega
  const handleEditClose = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedConnection(null);
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            fontWeight="bold"
            color="text.primary"
          >
            Open Finance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie suas conexões bancárias e sincronize transações automaticamente
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {pendingTransactions.length > 0 && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={() => setPendingViewOpen(true)}
              sx={{
                borderRadius: "20px",
                px: 2.5,
                fontWeight: 600,
                boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.3)}`,
              }}
            >
              Confirmar Transações Pendentes ({pendingTransactions.length})
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenPluggyModal}
            sx={{
              borderRadius: "20px",
              px: 2.5,
              fontWeight: 600,
            }}
          >
            Adicionar Conexão
          </Button>
        </Box>
      </Box>

      {/* Lista de Conexões */}
      {connections.length === 0 ? (
        <EmptyState
          type="accounts"
          title="Nenhuma conexão configurada"
          description="Conecte suas contas bancárias para sincronizar transações automaticamente"
          actionLabel="Adicionar Conexão"
          onAction={handleOpenPluggyModal}
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {connections.map((connection) => (
            <MotionCard
              key={connection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              sx={{
                borderRadius: "20px",
                bgcolor: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.6)
                  : alpha("#FFFFFF", 0.8),
                backdropFilter: "blur(12px)",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
                boxShadow: `0 10px 40px -10px ${alpha(theme.palette.primary.main, 0.15)}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 16px 48px -12px ${alpha(theme.palette.primary.main, 0.25)}`,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CreditCardIcon
                        sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        {connection.institutionName}
                      </Typography>
                      <Chip
                        label={connection.isActive ? "Ativa" : "Inativa"}
                        size="small"
                        color={connection.isActive ? "success" : "default"}
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          mt: 0.5,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(connection)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            color: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(connection)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            color: theme.palette.error.main,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {connection.paymentMethodId && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: "10px",
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                      }}
                    >
                      <LinkIcon
                        sx={{
                          fontSize: 16,
                          color: theme.palette.success.main,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Vinculado a: {connection.paymentMethodId}
                      </Typography>
                    </Box>
                  )}

                  {connection.lastSyncAt && (
                    <Typography variant="caption" color="text.secondary">
                      Última sincronização:{" "}
                      {new Date(connection.lastSyncAt).toLocaleDateString("pt-BR")}
                    </Typography>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={
                      isSyncing === connection.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SyncIcon />
                      )
                    }
                    onClick={() => handleSync(connection)}
                    disabled={isSyncing === connection.id || !connection.isActive}
                    fullWidth
                    sx={{
                      borderRadius: "12px",
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                  >
                    {isSyncing === connection.id ? "Sincronizando..." : "Sincronizar"}
                  </Button>
                </Box>
              </CardContent>
            </MotionCard>
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <AddConnectionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        userId={userId}
        onSuccess={loadData}
      />

      {selectedConnection && (
        <EditConnectionDialog
          open={editDialogOpen}
          onClose={handleEditClose}
          connection={selectedConnection}
          paymentMethods={paymentMethods}
          userId={userId}
        />
      )}

      <PendingTransactionsView
        open={pendingViewOpen}
        onClose={() => setPendingViewOpen(false)}
        userId={userId}
        paymentMethods={paymentMethods}
        categories={categories}
        onTransactionCreate={onTransactionCreate}
        onUpdate={loadData}
      />
    </Box>
  );
};

export default OpenFinanceView;
