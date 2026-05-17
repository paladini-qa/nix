import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Savings as SavingsIcon,
  FlightTakeoff as PlaneIcon,
  Laptop as LaptopIcon,
  Favorite as HeartIcon,
  ShoppingCart as ShoppingIcon,
  Home as HomeIcon,
  DirectionsCar as CarIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  AccountBalanceWallet as WalletIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalService } from "@/application/services/goalService";
import { Goal } from "@/domain/entities";
import { GoalInput } from "@/shared/schemas";
import NixButton from "@/presentation/components/radix/Button";
import { useNotification } from "@/presentation/contexts";
import { useConfirmDialog } from "@/presentation/contexts";
import EmptyState from "@/presentation/components/ui/EmptyState";
import { motion } from "framer-motion";

const GOAL_ICONS: { value: string; icon: React.ReactNode; label: string }[] = [
  { value: "savings", icon: <SavingsIcon />, label: "Savings" },
  { value: "plane", icon: <PlaneIcon />, label: "Travel" },
  { value: "laptop", icon: <LaptopIcon />, label: "Tech" },
  { value: "heart", icon: <HeartIcon />, label: "Health" },
  { value: "shopping", icon: <ShoppingIcon />, label: "Shopping" },
  { value: "home", icon: <HomeIcon />, label: "Home" },
  { value: "car", icon: <CarIcon />, label: "Car" },
  { value: "school", icon: <SchoolIcon />, label: "Education" },
  { value: "trophy", icon: <TrophyIcon />, label: "Achievement" },
  { value: "flag", icon: <FlagIcon />, label: "Milestone" },
];

const GOAL_COLORS = [
  "#10b981", "#a855f7", "#f59e0b", "#ec4899",
  "#3b82f6", "#ef4444", "#22c55e", "#7c3aed",
];

const GoalIconComponent: React.FC<{ name: string; size?: number }> = ({ name, size = 22 }) => {
  const sx = { fontSize: size };
  switch (name) {
    case "plane": return <PlaneIcon sx={sx} />;
    case "laptop": return <LaptopIcon sx={sx} />;
    case "heart": return <HeartIcon sx={sx} />;
    case "shopping": return <ShoppingIcon sx={sx} />;
    case "home": return <HomeIcon sx={sx} />;
    case "car": return <CarIcon sx={sx} />;
    case "school": return <SchoolIcon sx={sx} />;
    case "trophy": return <TrophyIcon sx={sx} />;
    case "flag": return <FlagIcon sx={sx} />;
    case "wallet": return <WalletIcon sx={sx} />;
    default: return <SavingsIcon sx={sx} />;
  }
};

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 28, delay: i * 0.06 },
  }),
};

interface GoalFormState {
  name: string;
  targetAmount: string;
  currentAmount: string;
  color: string;
  icon: string;
  deadline: string;
}

const defaultForm = (): GoalFormState => ({
  name: "",
  targetAmount: "",
  currentAmount: "0",
  color: GOAL_COLORS[0],
  icon: "savings",
  deadline: "",
});

const GoalsView: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirmDialog();

  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [form, setForm] = useState<GoalFormState>(defaultForm());

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (input: GoalInput) => goalService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      showSuccess("Meta criada com sucesso!");
      setFormOpen(false);
    },
    onError: () => showError("Erro ao criar meta. Tente novamente."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GoalInput> }) =>
      goalService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      showSuccess("Meta atualizada com sucesso!");
      setFormOpen(false);
      setEditGoal(null);
    },
    onError: () => showError("Erro ao atualizar meta. Tente novamente."),
  });

  const depositMutation = useMutation({
    mutationFn: ({ id, amount, target }: { id: string; amount: number; target: number }) =>
      goalService.deposit(id, amount, target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      showSuccess("Depósito registrado!");
      setDepositOpen(false);
      setDepositGoal(null);
      setDepositAmount("");
    },
    onError: () => showError("Erro ao registrar depósito."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      showSuccess("Meta excluída.");
    },
    onError: () => showError("Erro ao excluir meta."),
  });

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const totalRemaining = totalTarget - totalSaved;

  const bgElev = isDark ? "#131317" : "#ffffff";
  const border = isDark ? "#27272d" : "#e4e4e7";
  const bgSubtle = isDark ? "#1c1c22" : "#f4f4f5";
  const shadowSm = isDark
    ? "0 1px 2px rgba(0,0,0,0.3)"
    : "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)";

  const summaryCardSx = {
    position: "relative" as const,
    background: bgElev,
    border: `1px solid ${border}`,
    borderRadius: "14px",
    padding: "18px",
    boxShadow: shadowSm,
    overflow: "hidden",
    flex: 1,
    minWidth: 0,
  };

  const iconAbsSx = (color: string) => ({
    position: "absolute" as const,
    top: "14px",
    right: "14px",
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background: alpha(color, 0.12),
    color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  const openCreate = () => {
    setEditGoal(null);
    setForm(defaultForm());
    setFormOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setForm({
      name: g.name,
      targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(),
      color: g.color,
      icon: g.icon,
      deadline: g.deadline ?? "",
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    const target = parseFloat(form.targetAmount.replace(",", "."));
    const current = parseFloat(form.currentAmount.replace(",", ".") || "0");
    if (!form.name.trim() || isNaN(target) || target <= 0) return;

    const input: GoalInput = {
      name: form.name.trim(),
      targetAmount: target,
      currentAmount: current,
      color: form.color,
      icon: form.icon,
      deadline: form.deadline || undefined,
    };

    if (editGoal) {
      updateMutation.mutate({ id: editGoal.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  const handleDeposit = () => {
    if (!depositGoal) return;
    const amount = parseFloat(depositAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;
    depositMutation.mutate({
      id: depositGoal.id,
      amount: depositGoal.currentAmount + amount,
      target: depositGoal.targetAmount,
    });
  };

  const handleDelete = async (g: Goal) => {
    const confirmed = await confirmDelete(g.name);
    if (confirmed) deleteMutation.mutate(g.id);
  };

  return (
    <Box sx={{ px: "28px", pt: "24px", pb: "60px" }}>
      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: "14px", mb: "22px", flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Financial Goals
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Track your savings goals & milestones
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <NixButton
          variant="primary"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          New Goal
        </NixButton>
      </Box>

      {/* Summary cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          mb: "24px",
        }}
      >
        <Box sx={summaryCardSx}>
          <Typography sx={{ fontSize: "11.5px", color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
            Total target
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: "#a855f7" }}>
            {formatBRL(totalTarget)}
          </Typography>
          <Box sx={iconAbsSx("#a855f7")}>
            <SavingsIcon sx={{ fontSize: 22 }} />
          </Box>
        </Box>

        <Box sx={summaryCardSx}>
          <Typography sx={{ fontSize: "11.5px", color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
            Saved
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: "#10b981" }}>
            {formatBRL(totalSaved)}
          </Typography>
          <Box sx={iconAbsSx("#10b981")}>
            <WalletIcon sx={{ fontSize: 22 }} />
          </Box>
        </Box>

        <Box sx={summaryCardSx}>
          <Typography sx={{ fontSize: "11.5px", color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
            Progress
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
            {overallPct}%
          </Typography>
          <Box sx={iconAbsSx("#a855f7")}>
            <TrophyIcon sx={{ fontSize: 22 }} />
          </Box>
        </Box>

        <Box sx={summaryCardSx}>
          <Typography sx={{ fontSize: "11.5px", color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", mb: "6px" }}>
            Remaining
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: "#ef4444" }}>
            {formatBRL(totalRemaining)}
          </Typography>
          <Box sx={iconAbsSx("#ef4444")}>
            <FlagIcon sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </Box>

      {/* Goals grid */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<SavingsIcon sx={{ fontSize: 40 }} />}
          title="No goals yet"
          description="Create your first financial goal to start tracking your savings progress."
          action={
            <NixButton variant="primary" startIcon={<AddIcon />} onClick={openCreate}>
              New Goal
            </NixButton>
          }
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "16px",
          }}
        >
          {goals.map((g, i) => {
            const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
            return (
              <motion.div key={g.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <Box
                  sx={{
                    background: bgElev,
                    border: `1px solid ${border}`,
                    borderRadius: "14px",
                    padding: "18px",
                    boxShadow: shadowSm,
                  }}
                >
                  {/* Header row */}
                  <Stack direction="row" alignItems="flex-start" gap="14px" mb="14px">
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: "14px",
                        background: alpha(g.color, 0.14),
                        color: g.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <GoalIconComponent name={g.icon} size={22} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
                        {g.name}
                      </Typography>
                      {g.deadline && (
                        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: "2px" }}>
                          Target by {new Date(g.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 22, fontVariantNumeric: "tabular-nums", color: g.color, flexShrink: 0 }}>
                      {pct}%
                    </Typography>
                  </Stack>

                  {/* Progress bar */}
                  <Box
                    sx={{
                      height: "10px",
                      borderRadius: "99px",
                      background: bgSubtle,
                      overflow: "hidden",
                      mb: "10px",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        borderRadius: "99px",
                        background: `linear-gradient(90deg, ${g.color}, ${alpha(g.color, 0.7)})`,
                        width: `${Math.min(pct, 100)}%`,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </Box>

                  {/* Saved / Target */}
                  <Stack direction="row" mb="12px">
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Saved</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>
                        {formatBRL(g.currentAmount)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }} />
                    <Box sx={{ textAlign: "right" }}>
                      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Target</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>
                        {formatBRL(g.targetAmount)}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Actions */}
                  <Stack direction="row" gap="6px">
                    <Box
                      component="button"
                      onClick={() => {
                        setDepositGoal(g);
                        setDepositAmount("");
                        setDepositOpen(true);
                      }}
                      sx={{
                        flex: 1,
                        py: "6px",
                        px: "10px",
                        borderRadius: "10px",
                        border: "none",
                        background: alpha(g.color, 0.12),
                        color: g.color,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.12s",
                        "&:hover": { background: alpha(g.color, 0.2) },
                      }}
                    >
                      + Add deposit
                    </Box>
                    <Box
                      component="button"
                      onClick={() => openEdit(g)}
                      sx={{
                        py: "6px",
                        px: "10px",
                        borderRadius: "10px",
                        border: `1px solid ${border}`,
                        background: "transparent",
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.12s",
                        "&:hover": { background: bgSubtle, color: "text.primary" },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 14 }} />
                      Edit
                    </Box>
                    <Box
                      component="button"
                      onClick={() => handleDelete(g)}
                      sx={{
                        py: "6px",
                        px: "8px",
                        borderRadius: "10px",
                        border: `1px solid ${border}`,
                        background: "transparent",
                        color: "text.secondary",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        transition: "all 0.12s",
                        "&:hover": { background: alpha("#ef4444", 0.08), color: "#ef4444", borderColor: alpha("#ef4444", 0.3) },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </Box>
                  </Stack>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "18px", border: `1px solid ${border}` } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            {editGoal ? "Edit Goal" : "New Goal"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack gap={2} pt={1}>
            <TextField
              label="Goal name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
            />
            <Stack direction="row" gap={2}>
              <TextField
                label="Target amount (R$)"
                value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                fullWidth
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
              />
              <TextField
                label="Already saved (R$)"
                value={form.currentAmount}
                onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                fullWidth
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
              />
            </Stack>
            <TextField
              label="Deadline (optional)"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            {/* Icon picker */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", mb: 1 }}>Icon</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {GOAL_ICONS.map(({ value, icon }) => (
                  <Box
                    key={value}
                    component="button"
                    onClick={() => setForm((f) => ({ ...f, icon: value }))}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      border: `2px solid ${form.icon === value ? form.color : border}`,
                      background: form.icon === value ? alpha(form.color, 0.12) : bgSubtle,
                      color: form.icon === value ? form.color : "text.secondary",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 20 } })}
                  </Box>
                ))}
              </Stack>
            </Box>
            {/* Color picker */}
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", mb: 1 }}>Color</Typography>
              <Stack direction="row" gap={1}>
                {GOAL_COLORS.map((c) => (
                  <Box
                    key={c}
                    component="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c,
                      border: `3px solid ${form.color === c ? "white" : "transparent"}`,
                      boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <NixButton variant="ghost" onClick={() => setFormOpen(false)}>Cancel</NixButton>
          <NixButton
            variant="primary"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editGoal ? "Save changes" : "Create goal"}
          </NixButton>
        </DialogActions>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "18px", border: `1px solid ${border}` } }}
      >
        <DialogTitle>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            Add deposit — {depositGoal?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack gap={2} pt={1}>
            {depositGoal && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
                  Currently saved: {formatBRL(depositGoal.currentAmount)} / {formatBRL(depositGoal.targetAmount)}
                </Typography>
                <Box sx={{ height: 6, borderRadius: "99px", background: bgSubtle, overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: "100%",
                      borderRadius: "99px",
                      background: depositGoal.color,
                      width: `${Math.min((depositGoal.currentAmount / depositGoal.targetAmount) * 100, 100)}%`,
                    }}
                  />
                </Box>
              </Box>
            )}
            <TextField
              label="Amount to deposit (R$)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              fullWidth
              size="small"
              autoFocus
              InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <NixButton variant="ghost" onClick={() => setDepositOpen(false)}>Cancel</NixButton>
          <NixButton
            variant="primary"
            onClick={handleDeposit}
            disabled={depositMutation.isPending}
          >
            Deposit
          </NixButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalsView;
