import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  useTheme,
  alpha,
  IconButton,
  Avatar,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import {
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { PluggyConnector } from "../types";
import { pluggyService } from "../services/pluggyService";
import { openFinanceService } from "../services/api";
import { useNotification } from "../contexts";

interface AddConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const AddConnectionDialog: React.FC<AddConnectionDialogProps> = ({
  open,
  onClose,
  userId,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { showNotification } = useNotification();

  const [connectors, setConnectors] = useState<PluggyConnector[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConnector, setSelectedConnector] = useState<PluggyConnector | null>(null);

  // Carrega conectores ao abrir o dialog
  useEffect(() => {
    if (open) {
      loadConnectors();
    } else {
      // Reset ao fechar
      setConnectors([]);
      setSearchQuery("");
      setSelectedConnector(null);
    }
  }, [open]);

  const loadConnectors = async () => {
    try {
      setIsLoading(true);
      // getAllConnectors: todas as instituições (bancos, cartão). BR = Brasil.
      const data = await pluggyService.getAllConnectors(["BR"]);
      setConnectors(data);
    } catch (error: any) {
      console.error("Error loading connectors:", error);
      showNotification({
        message: error.message || "Erro ao carregar bancos disponíveis",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (connector: PluggyConnector) => {
    try {
      setIsConnecting(true);
      setSelectedConnector(connector);

      // Cria connect token
      const { connectToken, connectUrl } = await pluggyService.createConnectToken(
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
            await onSuccess();
            onClose();
          } catch (error: any) {
            console.error("Error creating connection:", error);
            showNotification({
              message: error.message || "Erro ao criar conexão",
              severity: "error",
            });
          } finally {
            setIsConnecting(false);
            setSelectedConnector(null);
          }
        }
      };

      window.addEventListener("message", messageHandler);

      // Monitora quando a janela fecha (fallback)
      const checkClosed = setInterval(() => {
        if (connectWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageHandler);
          setIsConnecting(false);
          setSelectedConnector(null);

          // Se a janela fechou sem receber mensagem, pode ter sido cancelado
          // Não fazemos nada aqui - o usuário pode tentar novamente
        }
      }, 500);

      // Timeout de segurança
      setTimeout(() => {
        if (!connectWindow.closed) {
          connectWindow.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener("message", messageHandler);
        setIsConnecting(false);
        setSelectedConnector(null);
      }, 300000); // 5 minutos
    } catch (error: any) {
      console.error("Error connecting:", error);
      showNotification({ message: error.message || "Erro ao conectar", severity: "error" });
      setIsConnecting(false);
      setSelectedConnector(null);
    }
  };

  // Filtra conectores por busca
  const filteredConnectors = connectors.filter((connector) =>
    connector.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : "20px",
          bgcolor: isDarkMode
            ? alpha(theme.palette.background.paper, 0.95)
            : alpha("#FFFFFF", 0.98),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isMobile
            ? "none"
            : `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
          boxShadow: isDarkMode
            ? `0 24px 80px -20px ${alpha("#000000", 0.6)}`
            : `0 24px 80px -20px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: isDarkMode
              ? alpha("#0F172A", 0.8)
              : alpha("#64748B", 0.4),
            backdropFilter: "blur(8px)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Adicionar Conexão
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "text.primary",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Selecione a instituição para conectar sua conta ou cartão
          </Typography>

          {/* Busca */}
          <TextField
            placeholder="Buscar banco..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />

          {/* Lista de Conectores */}
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : filteredConnectors.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">
                {searchQuery
                  ? "Nenhum banco encontrado"
                  : "Nenhum banco disponível"}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: isMobile ? "60vh" : "400px",
                overflowY: "auto",
                borderRadius: "12px",
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
              }}
            >
              <List sx={{ p: 0 }}>
                {filteredConnectors.map((connector) => (
                  <ListItem
                    key={connector.id}
                    disablePadding
                    sx={{
                      borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.03)}`,
                      "&:last-child": {
                        borderBottom: "none",
                      },
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleConnect(connector)}
                      disabled={isConnecting}
                      sx={{
                        py: 2,
                        px: 2,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            width: 48,
                            height: 48,
                          }}
                        >
                          {connector.imageUrl ? (
                            <img
                              src={connector.imageUrl}
                              alt={connector.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                          ) : (
                            <CreditCardIcon sx={{ color: theme.palette.primary.main }} />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight={500} color="text.primary">
                            {connector.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {connector.country}
                          </Typography>
                        }
                      />
                      {isConnecting && selectedConnector?.id === connector.id && (
                        <CircularProgress size={20} />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={isConnecting}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddConnectionDialog;
