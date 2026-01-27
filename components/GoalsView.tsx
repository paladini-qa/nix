import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  LinearProgress,
  IconButton,
  Drawer,
  TextField,
  InputAdornment,
  Chip,
  useMediaQuery,
  useTheme,
  Tooltip,
  Fab,
  Card,
  CardContent,
  Avatar,
  alpha,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Savings as SavingsIcon,
  EmojiEvents as TrophyIcon,
  Flag as FlagIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Goal, GoalProgress } from "../types";
import { goalService } from "../services/api";
import { useNotification, useConfirmDialog } from "../contexts";
import EmptyState from "./EmptyState";

interface GoalsViewProps {
  userId: string;
}

const GOAL_ICONS: Record<string, React.ReactNode> = {
  savings: <SavingsIcon />,
  trophy: <TrophyIcon />,
  flag: <FlagIcon />,
  trending: <TrendingUpIcon />,
};

const GOAL_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ef4444", // red
  "#84cc16", // lime
];

const GoalsView: React.FC<GoalsViewProps> = ({ userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirmDialog();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAddAmountOpen, setIsAddAmountOpen] = useState(false);
  const [selectedGoalForAmount, setSelectedGoalForAmount] = useState<Goal | null>(null);
  const [addAmount, setAddAmount] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formCurrent, setFormCurrent] = useState("");
  const [formDeadline, setFormDeadline] = useState<Dayjs | null>(null);
  const [formColor, setFormColor] = useState(GOAL_COLORS[0]);
  const [formIcon, setFormIcon] = useState("savings");

  // Fetch goals
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await goalService.getAll();
      setGoals(data);
    } catch (err) {
      console.error("Error fetching goals:", err);
      showError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const goalsWithProgress = useMemo((): GoalProgress[] => {
    return goalService.calculateProgress(goals);
  }, [goals]);

  // Separate active and completed
  const activeGoals = goalsWithProgress.filter((g) => !g.isCompleted);
  const completedGoals = goalsWithProgress.filter((g) => g.isCompleted);

  // Summary
  const summary = useMemo(() => {
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const avgProgress =
      activeGoals.length > 0
        ? activeGoals.reduce((sum, g) => sum + g.percentage, 0) / activeGoals.length
        : 0;

    return { totalTarget, totalSaved, avgProgress, completedCount: completedGoals.length };
  }, [activeGoals, completedGoals]);

  const handleOpenForm = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormName(goal.name);
      setFormTarget(goal.targetAmount.toString());
      setFormCurrent(goal.currentAmount.toString());
      setFormDeadline(goal.deadline ? dayjs(goal.deadline) : null);
      setFormColor(goal.color);
      setFormIcon(goal.icon);
    } else {
      setEditingGoal(null);
      setFormName("");
      setFormTarget("");
      setFormCurrent("0");
      setFormDeadline(null);
      setFormColor(GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)]);
      setFormIcon("savings");
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
  };

  const handleSave = async () => {
    if (!formName || !formTarget) return;

    try {
      if (editingGoal) {
        await goalService.update(editingGoal.id, {
          name: formName,
          targetAmount: parseFloat(formTarget),
          currentAmount: parseFloat(formCurrent || "0"),
          deadline: formDeadline ? formDeadline.format("YYYY-MM-DD") : undefined,
          color: formColor,
          icon: formIcon,
        });
        showSuccess("Goal updated successfully");
      } else {
        await goalService.create(userId, {
          name: formName,
          targetAmount: parseFloat(formTarget),
          currentAmount: parseFloat(formCurrent || "0"),
          deadline: formDeadline ? formDeadline.format("YYYY-MM-DD") : undefined,
          color: formColor,
          icon: formIcon,
        });
        showSuccess("Goal created successfully");
      }
      handleCloseForm();
      fetchGoals();
    } catch (err: any) {
      console.error("Error saving goal:", err);
      showError(err.message || "Failed to save goal");
    }
  };

  const handleDelete = async (goal: Goal) => {
    const confirmed = await confirmDelete(goal.name);
    if (!confirmed) return;

    try {
      await goalService.delete(goal.id);
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
      showSuccess("Goal deleted");
    } catch (err) {
      console.error("Error deleting goal:", err);
      showError("Failed to delete goal");
    }
  };

  const handleOpenAddAmount = (goal: Goal) => {
    setSelectedGoalForAmount(goal);
    setAddAmount("");
    setIsAddAmountOpen(true);
  };

  const handleAddAmount = async () => {
    if (!selectedGoalForAmount || !addAmount) return;

    try {
      await goalService.addAmount(selectedGoalForAmount.id, parseFloat(addAmount));
      showSuccess(`Added ${formatCurrency(parseFloat(addAmount))} to ${selectedGoalForAmount.name}`);
      setIsAddAmountOpen(false);
      setSelectedGoalForAmount(null);
      fetchGoals();
    } catch (err) {
      console.error("Error adding amount:", err);
      showError("Failed to add amount");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: isMobile ? 2 : 3,
      // Extra padding para bottom navigation + FABs
      pb: { xs: "180px", md: 0 },
    }}>
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
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Financial Goals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your savings goals and milestones
          </Typography>
        </Box>

        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            New Goal
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#6366f1", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, textAlign: "center", "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Total Target
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#6366f1", letterSpacing: "-0.02em" }}>
                {formatCurrency(summary.totalTarget)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#059669", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, textAlign: "center", "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Total Saved
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#059669", letterSpacing: "-0.02em" }}>
                {formatCurrency(summary.totalSaved)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#8b5cf6", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, textAlign: "center", "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Avg. Progress
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "text.primary", letterSpacing: "-0.02em" }}>
                {Math.round(summary.avgProgress)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#059669", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, textAlign: "center", "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Completed
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#059669", letterSpacing: "-0.02em" }}>
                {summary.completedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Goals List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography color="text.secondary">Loading goals...</Typography>
        </Box>
      ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
        <EmptyState
          type="goals"
          title="Nenhuma meta ainda"
          description="Crie sua primeira meta financeira para começar a acompanhar suas economias"
          actionLabel="Criar Meta"
          onAction={() => handleOpenForm()}
        />
      ) : (
        <>
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Active Goals ({activeGoals.length})
              </Typography>
              <Grid container spacing={2}>
                {activeGoals.map((goal) => (
                  <Grid key={goal.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                        background: theme.palette.mode === "dark"
                          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                          : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                        backdropFilter: "blur(16px)",
                        border: goal.isOverdue
                          ? `2px solid ${alpha("#F59E0B", 0.5)}`
                          : `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                        borderLeft: `3px solid ${goal.color}`,
                        borderRadius: "16px",
                        boxShadow: theme.palette.mode === "dark"
                          ? `0 6px 24px -6px ${alpha(goal.color, 0.2)}`
                          : `0 6px 24px -6px ${alpha(goal.color, 0.15)}`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: theme.palette.mode === "dark"
                            ? `0 10px 32px -6px ${alpha(goal.color, 0.3)}`
                            : `0 10px 32px -6px ${alpha(goal.color, 0.25)}`,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                bgcolor: theme.palette.mode === "dark"
                                  ? alpha(goal.color, 0.2)
                                  : alpha(goal.color, 0.15),
                                color: goal.color,
                                width: 40,
                                height: 40,
                                border: `1px solid ${alpha(goal.color, 0.2)}`,
                              }}
                            >
                              {GOAL_ICONS[goal.icon] || <SavingsIcon />}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {goal.name}
                              </Typography>
                              {goal.deadline && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <TimeIcon
                                    sx={{
                                      fontSize: 14,
                                      color: goal.isOverdue ? "#F59E0B" : "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{ 
                                      color: goal.isOverdue ? "#F59E0B" : "text.secondary",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {goal.isOverdue
                                      ? `Overdue by ${Math.abs(goal.daysRemaining!)} days`
                                      : `${goal.daysRemaining} days left`}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Box>
                            <Tooltip title="Add amount">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenAddAmount(goal)}
                                sx={{ 
                                  bgcolor: alpha("#059669", 0.1),
                                  color: "#059669",
                                  "&:hover": { bgcolor: alpha("#059669", 0.2) }
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenForm(goal)}
                                sx={{ 
                                  ml: 0.5,
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(goal)}
                                sx={{ 
                                  ml: 0.5,
                                  bgcolor: alpha(theme.palette.error.main, 0.08),
                                  "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.15) }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Progress */}
                        <Box sx={{ mb: 1.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={goal.percentage}
                            sx={{
                              height: 12,
                              borderRadius: 6,
                              bgcolor: alpha(goal.color, 0.1),
                              "& .MuiLinearProgress-bar": {
                                bgcolor: goal.color,
                                borderRadius: 6,
                              },
                            }}
                          />
                        </Box>

                        {/* Stats */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(goal.currentAmount)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                              of {formatCurrency(goal.targetAmount)}
                            </Typography>
                          </Box>
                          <Typography
                            variant="h5"
                            sx={{ 
                              fontWeight: 700, 
                              color: goal.color,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {Math.round(goal.percentage)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Completed Goals ({completedGoals.length})
              </Typography>
              <Grid container spacing={2}>
                {completedGoals.map((goal) => (
                  <Grid key={goal.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card
                      elevation={0}
                      sx={{
                        position: "relative",
                        overflow: "hidden",
                        background: theme.palette.mode === "dark"
                          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`
                          : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.7)} 0%, ${alpha("#FFFFFF", 0.5)} 100%)`,
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${theme.palette.mode === "dark" ? alpha("#059669", 0.2) : alpha("#059669", 0.15)}`,
                        borderRadius: "14px",
                        transition: "all 0.2s ease-in-out",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0, left: 0, right: 0, bottom: 0,
                          background: "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                          pointerEvents: "none",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                bgcolor: alpha("#059669", 0.15),
                                color: "#059669",
                                width: 40,
                                height: 40,
                                border: `1px solid ${alpha("#059669", 0.2)}`,
                              }}
                            >
                              <CheckCircleIcon />
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle1"
                                fontWeight={600}
                                sx={{ textDecoration: "line-through", opacity: 0.7 }}
                              >
                                {goal.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "#059669", fontWeight: 600 }}>
                                {formatCurrency(goal.targetAmount)} achieved!
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(goal)}
                            sx={{ 
                              bgcolor: alpha(theme.palette.error.main, 0.08),
                              "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.15) }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={() => handleOpenForm()}
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

      {/* Side Panel Form */}
      <Drawer
        anchor="right"
        open={isFormOpen}
        onClose={handleCloseForm}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: theme.palette.mode === "dark"
                ? alpha("#0F172A", 0.6)
                : alpha("#64748B", 0.25),
              backdropFilter: "blur(4px)",
            },
          },
        }}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 420 },
            maxWidth: "100vw",
            bgcolor: theme.palette.mode === "dark" ? theme.palette.background.default : "#FAFBFC",
            backgroundImage: "none",
            borderLeft: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
            boxShadow: theme.palette.mode === "dark"
              ? `-24px 0 80px -20px ${alpha("#000000", 0.5)}`
              : `-24px 0 80px -20px ${alpha(theme.palette.primary.main, 0.12)}`,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {editingGoal ? "Edit Goal" : "New Goal"}
          </Typography>
          <IconButton onClick={handleCloseForm} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2.5, flex: 1, overflow: "auto" }}>
          <TextField
            label="Goal Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g., Emergency Fund"
            fullWidth
            required
          />

          <TextField
            label="Target Amount"
            type="number"
            value={formTarget}
            onChange={(e) => setFormTarget(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
            inputProps={{ min: 0.01, step: 0.01 }}
            fullWidth
            required
          />

          <TextField
            label="Current Amount"
            type="number"
            value={formCurrent}
            onChange={(e) => setFormCurrent(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
            fullWidth
          />

          <DatePicker
            label="Deadline (optional)"
            value={formDeadline}
            onChange={(newValue) => setFormDeadline(newValue)}
            slotProps={{
              textField: { fullWidth: true },
            }}
            minDate={dayjs()}
          />

          {/* Color Picker */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block", fontWeight: 500 }}>
              Color
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {GOAL_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setFormColor(color)}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "12px",
                    bgcolor: color,
                    cursor: "pointer",
                    border: formColor === color ? 3 : 0,
                    borderColor: "common.white",
                    outline: formColor === color ? `2px solid ${color}` : "none",
                    transition: "all 0.2s",
                    boxShadow: `0 4px 12px -2px ${alpha(color, 0.4)}`,
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Icon Picker */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block", fontWeight: 500 }}>
              Icon
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {Object.entries(GOAL_ICONS).map(([key, icon]) => (
                <IconButton
                  key={key}
                  onClick={() => setFormIcon(key)}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "14px",
                    bgcolor: formIcon === key ? formColor : alpha(theme.palette.action.hover, 0.1),
                    color: formIcon === key ? "white" : "text.secondary",
                    border: `1px solid ${formIcon === key ? formColor : alpha(theme.palette.divider, 0.5)}`,
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: formIcon === key ? formColor : alpha(theme.palette.action.hover, 0.2),
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  {icon}
                </IconButton>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2.5,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            gap: 1.5,
          }}
        >
          <Button onClick={handleCloseForm} color="inherit" fullWidth variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            fullWidth
            disabled={!formName || !formTarget}
          >
            {editingGoal ? "Update" : "Create"}
          </Button>
        </Box>
      </Drawer>

      {/* Add Amount Side Panel */}
      <Drawer
        anchor="right"
        open={isAddAmountOpen}
        onClose={() => setIsAddAmountOpen(false)}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: theme.palette.mode === "dark"
                ? alpha("#0F172A", 0.6)
                : alpha("#64748B", 0.25),
              backdropFilter: "blur(4px)",
            },
          },
        }}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 400 },
            maxWidth: "100vw",
            bgcolor: theme.palette.mode === "dark" ? theme.palette.background.default : "#FAFBFC",
            backgroundImage: "none",
            borderLeft: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
            boxShadow: theme.palette.mode === "dark"
              ? `-24px 0 80px -20px ${alpha("#000000", 0.5)}`
              : `-24px 0 80px -20px ${alpha(theme.palette.primary.main, 0.12)}`,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Add to Goal
          </Typography>
          <IconButton onClick={() => setIsAddAmountOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2.5, flex: 1 }}>
          {selectedGoalForAmount && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(selectedGoalForAmount.color, 0.1),
                border: `1px solid ${alpha(selectedGoalForAmount.color, 0.2)}`,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(selectedGoalForAmount.color, 0.2),
                  color: selectedGoalForAmount.color,
                  width: 48,
                  height: 48,
                }}
              >
                {GOAL_ICONS[selectedGoalForAmount.icon] || <SavingsIcon />}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {selectedGoalForAmount.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(selectedGoalForAmount.currentAmount)} of {formatCurrency(selectedGoalForAmount.targetAmount)}
                </Typography>
              </Box>
            </Box>
          )}

          <TextField
            label="Amount to Add"
            type="number"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
            inputProps={{ min: 0.01, step: 0.01 }}
            fullWidth
            autoFocus
          />
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2.5,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            gap: 1.5,
          }}
        >
          <Button onClick={() => setIsAddAmountOpen(false)} color="inherit" fullWidth variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleAddAmount}
            variant="contained"
            color="success"
            fullWidth
            disabled={!addAmount}
          >
            Add Amount
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default GoalsView;





