import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Button,
  useMediaQuery,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from "@mui/icons-material";
import { PendingTransaction } from "../types";
import { openFinanceService } from "../services/api";
import { useNotification } from "../contexts";
import PendingTransactionForm from "./PendingTransactionForm";
import EmptyState from "./EmptyState";

interface PendingTransactionsViewProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  paymentMethods: string[];
  categories: { income: string[]; expense: string[] };
  onTransactionCreate?: (transaction: any) => void;
  onUpdate: () => void;
}

const PendingTransactionsView: React.FC<PendingTransactionsViewProps> = ({
  open,
  onClose,
  userId,
  paymentMethods,
  categories,
  onTransactionCreate,
  onUpdate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { showNotification } = useNotification();

  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Carrega transações pendentes
  const loadPendingTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const transactions = await openFinanceService.getPendingTransactions(userId, {
        status: "pending",
      });
      setPendingTransactions(transactions);
    } catch (error: any) {
      console.error("Error loading pending transactions:", error);
      showNotification({ message: "Erro ao carregar transações pendentes", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [userId, showNotification]);

  useEffect(() => {
    if (open) {
      loadPendingTransactions();
    }
  }, [open, loadPendingTransactions]);

  // Deleta transação pendente
  const handleDelete = useCallback(
    async (transaction: PendingTransaction) => {
      try {
        await openFinanceService.deletePendingTransaction(transaction.id, userId);
        showNotification({ message: "Transação excluída", severity: "success" });
        await loadPendingTransactions();
        onUpdate();
      } catch (error: any) {
        console.error("Error deleting pending transaction:", error);
        showNotification({ message: "Erro ao excluir transação", severity: "error" });
      }
    },
    [userId, loadPendingTransactions, onUpdate, showNotification]
  );

  // Abre form de edição
  const handleEdit = useCallback((transaction: PendingTransaction) => {
    setSelectedTransaction(transaction);
    setFormOpen(true);
  }, []);

  // Fecha form e recarrega
  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedTransaction(null);
    loadPendingTransactions();
    onUpdate();
  }, [loadPendingTransactions, onUpdate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
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
            Transações Pendentes ({pendingTransactions.length})
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
          ) : pendingTransactions.length === 0 ? (
            <EmptyState
              type="transactions"
              title="Nenhuma transação pendente"
              description="Todas as transações foram processadas"
              compact
            />
          ) : (
            <List sx={{ p: 0 }}>
              {pendingTransactions.map((transaction) => (
                <Paper
                  key={transaction.id}
                  sx={{
                    mb: 1.5,
                    borderRadius: "12px",
                    bgcolor: isDarkMode
                      ? alpha(theme.palette.background.paper, 0.5)
                      : alpha("#FFFFFF", 0.7),
                    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? alpha(theme.palette.background.paper, 0.7)
                        : alpha("#FFFFFF", 0.9),
                      transform: "translateY(-2px)",
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                  }}
                >
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          edge="end"
                          onClick={() => handleEdit(transaction)}
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
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(transaction)}
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
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {transaction.description || transaction.rawDescription}
                          </Typography>
                          <Chip
                            icon={
                              transaction.rawType === "DEBIT" ? (
                                <ArrowDownIcon />
                              ) : (
                                <ArrowUpIcon />
                              )
                            }
                            label={transaction.rawType === "DEBIT" ? "Débito" : "Crédito"}
                            size="small"
                            color={transaction.rawType === "DEBIT" ? "error" : "success"}
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(transaction.amount || transaction.rawAmount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(transaction.date || transaction.rawDate)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {selectedTransaction && (
        <PendingTransactionForm
          open={formOpen}
          onClose={handleFormClose}
          transaction={selectedTransaction}
          paymentMethods={paymentMethods}
          categories={categories}
          userId={userId}
          onTransactionCreate={onTransactionCreate}
        />
      )}
    </>
  );
};

export default PendingTransactionsView;
