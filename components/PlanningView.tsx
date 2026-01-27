import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Drawer,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  useMediaQuery,
  useTheme,
  Tooltip,
  Fab,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  alpha,
  Menu,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as ConvertIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { Planning, PlanningItem, PlanningWithItems, Transaction } from "../types";
import { planningService } from "../services/api";
import { useNotification } from "../contexts";
import { useConfirmDialog } from "../contexts";
import EmptyState from "./EmptyState";
import { motion, AnimatePresence } from "framer-motion";

interface PlanningViewProps {
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  userId: string;
  onTransactionCreated?: () => void;
}

const PlanningView: React.FC<PlanningViewProps> = ({
  categories,
  paymentMethods,
  userId,
  onTransactionCreated,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";
  const { showSuccess, showError } = useNotification();
  const { confirm } = useConfirmDialog();

  const [plannings, setPlannings] = useState<PlanningWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlanningFormOpen, setIsPlanningFormOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingPlanning, setEditingPlanning] = useState<Planning | null>(null);
  const [editingItem, setEditingItem] = useState<PlanningItem | null>(null);
  const [selectedPlanningId, setSelectedPlanningId] = useState<string | null>(null);
  const [openPlanningId, setOpenPlanningId] = useState<string | null>(null);
  const [itemMenuAnchor, setItemMenuAnchor] = useState<{
    element: HTMLElement | null;
    item: PlanningItem | null;
  }>({ element: null, item: null });

  // Planning form state
  const [planningName, setPlanningName] = useState("");
  const [planningDescription, setPlanningDescription] = useState("");
  const [planningTargetDate, setPlanningTargetDate] = useState("");

  // Item form state
  const [itemDescription, setItemDescription] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemPaymentMethod, setItemPaymentMethod] = useState("");
  const [itemDate, setItemDate] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  // Fetch plannings
  useEffect(() => {
    fetchPlannings();
  }, []);

  const fetchPlannings = async () => {
    setLoading(true);
    try {
      const data = await planningService.getAll();
      setPlannings(data);
    } catch (err) {
      console.error("Error fetching plannings:", err);
      showError("Falha ao carregar planejamentos");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Planning form handlers
  const handleOpenPlanningForm = (planning?: Planning) => {
    if (planning) {
      setEditingPlanning(planning);
      setPlanningName(planning.name);
      setPlanningDescription(planning.description || "");
      setPlanningTargetDate(planning.targetDate || "");
    } else {
      setEditingPlanning(null);
      setPlanningName("");
      setPlanningDescription("");
      setPlanningTargetDate("");
    }
    setIsPlanningFormOpen(true);
  };

  const handleClosePlanningForm = () => {
    setIsPlanningFormOpen(false);
    setEditingPlanning(null);
    setPlanningName("");
    setPlanningDescription("");
    setPlanningTargetDate("");
  };

  const handleSavePlanning = async () => {
    if (!planningName.trim()) {
      showError("Nome do planejamento é obrigatório");
      return;
    }

    try {
      if (editingPlanning) {
        await planningService.update(editingPlanning.id, {
          name: planningName,
          description: planningDescription || undefined,
          targetDate: planningTargetDate || undefined,
        });
        showSuccess("Planejamento atualizado com sucesso");
      } else {
        await planningService.create(userId, {
          name: planningName,
          description: planningDescription || undefined,
          targetDate: planningTargetDate || undefined,
        });
        showSuccess("Planejamento criado com sucesso");
      }
      handleClosePlanningForm();
      fetchPlannings();
    } catch (err) {
      console.error("Error saving planning:", err);
      showError("Falha ao salvar planejamento");
    }
  };

  const handleDeletePlanning = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir Planejamento",
      message: "Tem certeza que deseja excluir este planejamento? Todos os gastos planejados serão removidos.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await planningService.delete(id);
      showSuccess("Planejamento excluído com sucesso");
      fetchPlannings();
    } catch (err) {
      console.error("Error deleting planning:", err);
      showError("Falha ao excluir planejamento");
    }
  };

  // Item form handlers
  const handleOpenItemForm = (planningId: string, item?: PlanningItem, keepDetailsOpen = false) => {
    setSelectedPlanningId(planningId);
    if (!keepDetailsOpen) {
      setOpenPlanningId(null);
    }
    if (item) {
      setEditingItem(item);
      setItemDescription(item.description);
      setItemAmount(item.amount.toString());
      setItemCategory(item.category);
      setItemPaymentMethod(item.paymentMethod);
      setItemDate(item.date || "");
      setItemNotes(item.notes || "");
    } else {
      setEditingItem(null);
      setItemDescription("");
      setItemAmount("");
      setItemCategory("");
      setItemPaymentMethod("");
      setItemDate("");
      setItemNotes("");
    }
    setIsItemFormOpen(true);
  };

  const handleCloseItemForm = () => {
    setIsItemFormOpen(false);
    // Não limpa selectedPlanningId aqui para manter o contexto se o drawer de detalhes estiver aberto
    setEditingItem(null);
    setItemDescription("");
    setItemAmount("");
    setItemCategory("");
    setItemPaymentMethod("");
    setItemDate("");
    setItemNotes("");
  };

  const handleSaveItem = async () => {
    if (!selectedPlanningId) return;

    if (!itemDescription.trim() || !itemAmount || !itemCategory || !itemPaymentMethod) {
      showError("Preencha todos os campos obrigatórios");
      return;
    }

    const amount = parseFloat(itemAmount);
    if (isNaN(amount) || amount <= 0) {
      showError("Valor inválido");
      return;
    }

    try {
      if (editingItem) {
        await planningService.updateItem(editingItem.id, {
          description: itemDescription,
          amount,
          category: itemCategory,
          paymentMethod: itemPaymentMethod,
          date: itemDate || undefined,
          notes: itemNotes || undefined,
        });
        showSuccess("Gasto atualizado com sucesso");
      } else {
        await planningService.addItem(selectedPlanningId, {
          description: itemDescription,
          amount,
          category: itemCategory,
          paymentMethod: itemPaymentMethod,
          date: itemDate || undefined,
          notes: itemNotes || undefined,
        });
        showSuccess("Gasto adicionado com sucesso");
      }
      handleCloseItemForm();
      fetchPlannings();
      // Reabre o drawer de detalhes se estava aberto
      if (selectedPlanningId) {
        setOpenPlanningId(selectedPlanningId);
      }
    } catch (err) {
      console.error("Error saving item:", err);
      showError("Falha ao salvar gasto");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const confirmed = await confirm({
      title: "Excluir Gasto",
      message: "Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await planningService.deleteItem(itemId);
      showSuccess("Gasto excluído com sucesso");
      fetchPlannings();
    } catch (err) {
      console.error("Error deleting item:", err);
      showError("Falha ao excluir gasto");
    }
  };

  // Convert to transaction handlers
  const handleConvertItemToTransaction = async (item: PlanningItem) => {
    const confirmed = await confirm({
      title: "Transformar em transação?",
      message: `O gasto "${item.description}" será convertido em uma transação e removido do planejamento.`,
      confirmText: "Converter",
      cancelText: "Cancelar",
    });
    if (!confirmed) return;

    try {
      await planningService.convertItemToTransaction(userId, item.id);
      showSuccess("Gasto convertido em transação com sucesso");
      fetchPlannings();
      // Se o drawer de detalhes estiver aberto, mantém aberto (será atualizado pelo fetchPlannings)
      if (onTransactionCreated) {
        onTransactionCreated();
      }
    } catch (err) {
      console.error("Error converting item:", err);
      showError("Falha ao converter gasto em transação");
    }
  };

  const handleConvertPlanningToTransactions = async (planning: PlanningWithItems) => {
    if (planning.items.length === 0) {
      showError("Este planejamento não possui gastos");
      return;
    }

    const confirmed = await confirm({
      title: "Transformar todo o planejamento em transações?",
      message: `Todos os ${planning.items.length} gastos serão convertidos em transações e removidos do planejamento.`,
      confirmText: "Converter",
      cancelText: "Cancelar",
    });
    if (!confirmed) return;

    try {
      await planningService.convertPlanningToTransactions(userId, planning.id);
      showSuccess(`${planning.items.length} gastos convertidos em transações com sucesso`);
      fetchPlannings();
      if (onTransactionCreated) {
        onTransactionCreated();
      }
    } catch (err) {
      console.error("Error converting planning:", err);
      showError("Falha ao converter planejamento em transações");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <Typography color="text.secondary">Carregando planejamentos...</Typography>
      </Box>
    );
  }

  // Se um planejamento está aberto, mostra a view de detalhes
  const detailView = openPlanningId ? (() => {
    const planning = plannings.find((p) => p.id === openPlanningId);
    if (!planning) {
      setOpenPlanningId(null);
      return null;
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => setOpenPlanningId(null)} sx={{ bgcolor: "action.hover" }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "20px",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: "flex",
                  }}
                >
                  <EventIcon sx={{ color: "primary.main" }} />
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                  {planning.name}
                </Typography>
              </Box>
              {planning.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {planning.description}
                </Typography>
              )}
              {planning.targetDate && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                  <EventIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(planning.targetDate)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Total Summary Card */}
        <Card
          elevation={0}
          sx={{
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
              : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
            backdropFilter: "blur(16px)",
            border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            borderRadius: "20px",
          }}
        >
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              Total Planejado
            </Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {formatCurrency(planning.totalAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {planning.items.length} {planning.items.length === 1 ? "gasto" : "gastos"}
            </Typography>
          </CardContent>
        </Card>

        {/* Items List */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600}>
              Gastos Planejados
            </Typography>
            <Button
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              startIcon={<AddIcon />}
              onClick={() => {
                handleOpenItemForm(planning.id, undefined, true);
              }}
            >
              Adicionar
            </Button>
          </Box>

          {planning.items.length > 0 ? (
            <Grid container spacing={isMobile ? 1.5 : 2}>
              {planning.items.map((item) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    elevation={0}
                    sx={{
                      background: isDarkMode
                        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                        : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
                      backdropFilter: "blur(16px)",
                      border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                      borderRadius: "16px",
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                            {item.description}
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {formatCurrency(item.amount)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => setItemMenuAnchor({ element: e.currentTarget, item })}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                        <Chip
                          label={item.category}
                          size="small"
                          variant="outlined"
                          sx={{ height: 24 }}
                        />
                        <Chip
                          label={item.paymentMethod}
                          size="small"
                          variant="outlined"
                          sx={{ height: 24 }}
                        />
                        {item.date && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.date)}
                          </Typography>
                        )}
                      </Box>
                      {item.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", fontStyle: "italic" }}>
                          {item.notes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                textAlign: "center",
                borderRadius: "20px",
                bgcolor: isDarkMode
                  ? alpha(theme.palette.background.paper, 0.5)
                  : alpha("#FFFFFF", 0.6),
                border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              }}
            >
              <MoneyIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Nenhum gasto planejado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Adicione gastos para este planejamento
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  handleOpenItemForm(planning.id, undefined, true);
                }}
              >
                Adicionar Primeiro Gasto
              </Button>
            </Box>
          )}
        </Box>

        {/* Footer Actions */}
        {planning.items.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EditIcon />}
              onClick={() => {
                setOpenPlanningId(null);
                handleOpenPlanningForm(planning);
              }}
            >
              Editar Planejamento
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ConvertIcon />}
              onClick={() => {
                setOpenPlanningId(null);
                handleConvertPlanningToTransactions(planning);
              }}
            >
              Transformar em Transações
            </Button>
          </Box>
        )}
      </Box>
    );
  })() : null;

  // View principal - Lista de planejamentos
  const mainView = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 2 : 3,
        pb: { xs: "180px", md: 0 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Planejamentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Planeje seus gastos antes de transformá-los em transações
          </Typography>
        </Box>

        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPlanningForm()}
          >
            Novo Planejamento
          </Button>
        )}
      </Box>

      {/* Plannings List */}
      {plannings.length > 0 ? (
        <Grid container spacing={isMobile ? 2 : 3}>
          <AnimatePresence mode="popLayout">
            {plannings.map((planning) => (
              <Grid key={planning.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Card
                    elevation={0}
                    onClick={() => setOpenPlanningId(planning.id)}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                      background: isDarkMode
                        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                        : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
                      backdropFilter: "blur(16px)",
                      border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                      boxShadow: isDarkMode
                        ? `0 6px 24px -6px ${alpha(theme.palette.primary.main, 0.2)}`
                        : `0 6px 24px -6px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderRadius: "20px",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: isDarkMode
                          ? `0 10px 32px -6px ${alpha(theme.palette.primary.main, 0.3)}`
                          : `0 10px 32px -6px ${alpha(theme.palette.primary.main, 0.25)}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                      {/* Planning Header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                              mb: 0.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {planning.name}
                          </Typography>
                          {planning.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {planning.description}
                            </Typography>
                          )}
                          {planning.targetDate && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                              <EventIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(planning.targetDate)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPlanningForm(planning)}
                              sx={{ color: "text.secondary" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePlanning(planning.id)}
                              sx={{ color: "error.main" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Total Amount */}
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: "12px",
                          bgcolor: isDarkMode
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.05),
                          mb: 2,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                          Total Planejado
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {formatCurrency(planning.totalAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {planning.items.length} {planning.items.length === 1 ? "gasto" : "gastos"}
                        </Typography>
                      </Box>

                      {/* Click hint */}
                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                          Clique para ver os gastos
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      ) : (
        <EmptyState
          type="transactions"
          title="Nenhum planejamento criado"
          description="Crie um planejamento para organizar seus gastos futuros"
        />
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={() => handleOpenPlanningForm()}
          sx={{
            position: "fixed",
            bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            right: 16,
            zIndex: 1100,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );

  return (
    <>
      {detailView || mainView}
      
      {/* Planning Form Drawer */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={isPlanningFormOpen}
        onClose={handleClosePlanningForm}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : 400,
            maxHeight: isMobile ? "90vh" : "100vh",
            borderTopLeftRadius: isMobile ? "20px" : 0,
            borderTopRightRadius: isMobile ? "20px" : 0,
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              {editingPlanning ? "Editar Planejamento" : "Novo Planejamento"}
            </Typography>
            <IconButton onClick={handleClosePlanningForm}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Nome do Planejamento"
              value={planningName}
              onChange={(e) => setPlanningName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Descrição (opcional)"
              value={planningDescription}
              onChange={(e) => setPlanningDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Data Alvo (opcional)"
              type="date"
              value={planningTargetDate}
              onChange={(e) => setPlanningTargetDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button variant="outlined" fullWidth onClick={handleClosePlanningForm}>
                Cancelar
              </Button>
              <Button variant="contained" fullWidth onClick={handleSavePlanning}>
                Salvar
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Item Form Drawer */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={isItemFormOpen}
        onClose={handleCloseItemForm}
        disablePortal={false}
        ModalProps={{
          container: typeof document !== "undefined" ? document.body : undefined,
          style: { zIndex: 1400 },
        }}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : 400,
            maxHeight: isMobile ? "90vh" : "100vh",
            borderTopLeftRadius: isMobile ? "20px" : 0,
            borderTopRightRadius: isMobile ? "20px" : 0,
            zIndex: 1401,
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: isDarkMode
                ? alpha("#000000", 0.5)
                : alpha("#000000", 0.25),
              backdropFilter: "blur(4px)",
              zIndex: 1399,
            },
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              {editingItem ? "Editar Gasto" : "Novo Gasto"}
            </Typography>
            <IconButton onClick={handleCloseItemForm}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Descrição"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Valor"
              type="number"
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
            <FormControl fullWidth required>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                label="Categoria"
              >
                {categories.expense.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Método de Pagamento</InputLabel>
              <Select
                value={itemPaymentMethod}
                onChange={(e) => setItemPaymentMethod(e.target.value)}
                label="Método de Pagamento"
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Data (opcional)"
              type="date"
              value={itemDate}
              onChange={(e) => setItemDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notas (opcional)"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button variant="outlined" fullWidth onClick={handleCloseItemForm}>
                Cancelar
              </Button>
              <Button variant="contained" fullWidth onClick={handleSaveItem}>
                Salvar
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Item Actions Menu */}
      <Menu
        anchorEl={itemMenuAnchor.element}
        open={Boolean(itemMenuAnchor.element)}
        onClose={() => setItemMenuAnchor({ element: null, item: null })}
      >
        {itemMenuAnchor.item && (
          <>
            <MenuItem
              onClick={() => {
                if (itemMenuAnchor.item) {
                  handleOpenItemForm(itemMenuAnchor.item.planningId, itemMenuAnchor.item, true);
                }
                setItemMenuAnchor({ element: null, item: null });
              }}
            >
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (itemMenuAnchor.item) {
                  setItemMenuAnchor({ element: null, item: null });
                  handleConvertItemToTransaction(itemMenuAnchor.item);
                }
              }}
            >
              <ConvertIcon fontSize="small" sx={{ mr: 1 }} />
              Transformar em Transação
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (itemMenuAnchor.item) {
                  handleDeleteItem(itemMenuAnchor.item.id);
                }
                setItemMenuAnchor({ element: null, item: null });
              }}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Excluir
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default PlanningView;
