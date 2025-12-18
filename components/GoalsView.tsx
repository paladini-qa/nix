import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from "@mui/icons-material";
import { Goal, GoalProgress } from "../types";
import { goalService } from "../services/api";
import { useNotification, useConfirmDialog } from "../contexts";

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
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Total Target
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              {formatCurrency(summary.totalTarget)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Total Saved
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {formatCurrency(summary.totalSaved)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Avg. Progress
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {Math.round(summary.avgProgress)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {summary.completedCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Goals List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography color="text.secondary">Loading goals...</Typography>
        </Box>
      ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <SavingsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No goals yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first financial goal to start tracking your savings
          </Typography>
          <Button variant="contained" onClick={() => handleOpenForm()}>
            Create Goal
          </Button>
        </Paper>
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
                      sx={{
                        height: "100%",
                        border: goal.isOverdue ? 2 : 0,
                        borderColor: "warning.main",
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
                            <Avatar
                              sx={{
                                bgcolor: goal.color,
                                width: 40,
                                height: 40,
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
                                      color: goal.isOverdue ? "warning.main" : "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color={goal.isOverdue ? "warning.main" : "text.secondary"}
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
                                color="success"
                                onClick={() => handleOpenAddAmount(goal)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenForm(goal)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(goal)}
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
                              bgcolor: "action.hover",
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
                            <Typography variant="caption" color="text.secondary">
                              of {formatCurrency(goal.targetAmount)}
                            </Typography>
                          </Box>
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{ color: goal.color }}
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
                    <Card sx={{ bgcolor: "action.hover", opacity: 0.9 }}>
                      <CardContent>
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
                                bgcolor: "success.main",
                                width: 40,
                                height: 40,
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
                              <Typography variant="body2" color="success.main">
                                {formatCurrency(goal.targetAmount)} achieved!
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(goal)}
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
            bottom: 80,
            right: 16,
            zIndex: 1100,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Goal Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={handleCloseForm}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>{editingGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
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
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Color
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {GOAL_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: formColor === color ? 3 : 0,
                      borderColor: "common.white",
                      outline: formColor === color ? `2px solid ${color}` : "none",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Icon Picker */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Icon
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {Object.entries(GOAL_ICONS).map(([key, icon]) => (
                  <IconButton
                    key={key}
                    onClick={() => setFormIcon(key)}
                    sx={{
                      bgcolor: formIcon === key ? formColor : "action.hover",
                      color: formIcon === key ? "white" : "text.secondary",
                      "&:hover": {
                        bgcolor: formIcon === key ? formColor : "action.selected",
                      },
                    }}
                  >
                    {icon}
                  </IconButton>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={handleCloseForm} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formName || !formTarget}
          >
            {editingGoal ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Amount Dialog */}
      <Dialog
        open={isAddAmountOpen}
        onClose={() => setIsAddAmountOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Add to {selectedGoalForAmount?.name}</DialogTitle>
        <DialogContent>
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
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setIsAddAmountOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAddAmount}
            variant="contained"
            color="success"
            disabled={!addAmount}
          >
            Add Amount
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalsView;

