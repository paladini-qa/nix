import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Paper,
  Chip,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tooltip,
  IconButton,
  Collapse,
  Button,
  Menu,
  ListItemIcon,
  ListItemText,
  MenuItem as MuiMenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Subscriptions as SubscriptionsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  CalendarMonth as CalendarIcon,
  Payments as PaymentsIcon,
  Apps as AppsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DoNotDisturb as CancelIcon,
  Refresh as ReactivateIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import type { Transaction } from "../../types";
import { useLayoutSpacing, useCancelledSubscriptions } from "../../hooks";
import EmptyState from "../ui/EmptyState";
import { useSettings, useNotification } from "../../contexts";
import PaymentMethodIcon from "../ui/PaymentMethodIcon";
import PaymentMethodImagePicker from "../ui/PaymentMethodImagePicker";
import { extractDominantColor, hashColor } from "../../utils/imageColorUtils";
import { Image as ImageIcon } from "@mui/icons-material";

interface SubscriptionsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  userId: string;
}

interface ServiceGroup {
  name: string;
  normalizedName: string;
  lastAmount: number;
  monthsActive: number;
  trend: "up" | "down" | "flat";
  transactions: Transaction[];
}

interface MonthlyPoint {
  label: string;
  month: string;
  total: number;
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const normalizeDesc = (desc: string) => desc.trim().toLowerCase();

// ─── ServiceCard ──────────────────────────────────────────────────────────────
interface ServiceCardProps {
  group: ServiceGroup;
  isCancelled: boolean;
  onCancel: (name: string) => void;
  onReactivate: (name: string) => void;
  onOpenDetail: (group: ServiceGroup) => void;
  onDeleteGroup: (group: ServiceGroup) => void;
  imageUrl?: string;
  subscriptionColor?: { primary: string; secondary: string };
  onSetImage: (name: string, url: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  group,
  isCancelled,
  onCancel,
  onReactivate,
  onOpenDetail,
  onDeleteGroup,
  imageUrl,
  subscriptionColor,
  onSetImage,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const primary = isCancelled
    ? theme.palette.error.main
    : (subscriptionColor?.primary ?? theme.palette.primary.main);
  const secondary = isCancelled
    ? theme.palette.error.dark
    : (subscriptionColor?.secondary ?? theme.palette.primary.dark ?? primary);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [imgPickerOpen, setImgPickerOpen] = useState(false);

  const TrendIcon = () => {
    if (group.trend === "up") return <TrendingUpIcon fontSize="small" color="error" />;
    if (group.trend === "down") return <TrendingDownIcon fontSize="small" color="success" />;
    return <TrendingFlatIcon fontSize="small" sx={{ color: "text.disabled" }} />;
  };

  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
      <Box>
        <Paper
          elevation={0}
          onClick={() => !isCancelled && onOpenDetail(group)}
          sx={{
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            borderRadius: "16px",
            cursor: isCancelled ? "default" : "pointer",
            background: isDark
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha("#fff", 0.95),
            border: `1.5px solid ${alpha(primary, isDark ? 0.45 : 0.25)}`,
            transition: "all 0.2s ease-in-out",
            opacity: isCancelled ? 0.8 : 1,
            "&:hover": !isCancelled
              ? {
                  transform: "translateY(-3px)",
                  boxShadow: `0 10px 28px -6px ${alpha(primary, 0.3)}`,
                  border: `1.5px solid ${alpha(primary, 0.65)}`,
                }
              : {},
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
              <Box
                sx={{ position: "relative", cursor: isCancelled ? "default" : "pointer", flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); !isCancelled && setImgPickerOpen(true); }}
              >
                <PaymentMethodIcon
                  imageUrl={isCancelled ? undefined : imageUrl}
                  colors={{ primary, secondary }}
                  size={36}
                  borderRadius="10px"
                  iconSize={18}
                />
                {!isCancelled && !imageUrl && (
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, borderRadius: "10px", bgcolor: "rgba(0,0,0,0.35)", transition: "opacity 0.15s", "&:hover": { opacity: 1 } }}>
                    <ImageIcon sx={{ color: "#fff", fontSize: 14 }} />
                  </Box>
                )}
              </Box>
              <Tooltip title={group.name} placement="top">
                <Typography
                  fontWeight={700}
                  sx={{
                    fontSize: 14,
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    ...(isCancelled && { textDecoration: "line-through", color: "text.disabled" }),
                  }}
                >
                  {group.name}
                </Typography>
              </Tooltip>
            </Box>
            {isCancelled ? (
              <Chip
                label="Encerrada"
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: "8px",
                  flexShrink: 0,
                  ml: 1,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: "error.main",
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            ) : (
              <Box sx={{ flexShrink: 0, ml: 1 }}>
                <TrendIcon />
              </Box>
            )}
          </Box>

          {/* Amount section */}
          <Box sx={{ mb: 1.5, flex: 1 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: "text.disabled",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                mb: 0.5,
              }}
            >
              Último valor
            </Typography>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                color: isCancelled ? "text.disabled" : "text.primary",
                ...(isCancelled && { textDecoration: "line-through" }),
              }}
            >
              {formatCurrency(group.lastAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {group.monthsActive} {group.monthsActive === 1 ? "mês" : "meses"} ativo{group.monthsActive !== 1 ? "s" : ""}
            </Typography>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              pt: 1.5,
            }}
          >
            <Button
              size="small"
              onClick={(e) => { e.stopPropagation(); if (!isCancelled) onOpenDetail(group); }}
              disabled={isCancelled}
              sx={{ color: primary, textTransform: "none", fontWeight: 600, fontSize: 13, p: 0, minWidth: 0, "&:hover": { background: "none", opacity: 0.75 } }}
            >
              Detalhes
            </Button>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
              {!isCancelled && (
                <Tooltip title="Ver detalhes / editar">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onOpenDetail(group); }}
                    sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: alpha(primary, 0.08) } }}
                  >
                    <EditIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Excluir assinatura">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onDeleteGroup(group); }}
                  sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.08) } }}
                >
                  <DeleteIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
                sx={{ width: 28, height: 28, borderRadius: "8px", color: "text.secondary", "&:hover": { bgcolor: alpha(primary, 0.1), color: primary } }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>

              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{ sx: { borderRadius: "12px", minWidth: 200 } }}
              >
                {isCancelled ? (
                  <MuiMenuItem onClick={() => { onReactivate(group.name); setMenuAnchor(null); }}>
                    <ListItemIcon><ReactivateIcon fontSize="small" color="primary" /></ListItemIcon>
                    <ListItemText>Reativar assinatura</ListItemText>
                  </MuiMenuItem>
                ) : (
                  <MuiMenuItem onClick={() => { onCancel(group.name); setMenuAnchor(null); }}>
                    <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText sx={{ color: "error.main" }}>Encerrar assinatura</ListItemText>
                  </MuiMenuItem>
                )}
              </Menu>
            </Box>
          </Box>
        </Paper>
      </Box>

      <PaymentMethodImagePicker
        open={imgPickerOpen}
        onClose={() => setImgPickerOpen(false)}
        methodName={group.name}
        currentUrl={imageUrl}
        onSelect={(url) => { onSetImage(group.name, url); }}
      />
    </Grid>
  );
};

// ─── View principal ───────────────────────────────────────────────────────────
const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  transactions,
  onNewTransaction,
  onEdit,
  onDelete,
  userId,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { isMobile, gridSpacing } = useLayoutSpacing();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showCancelled, setShowCancelled] = useState(false);
  const primary = theme.palette.primary.main;

  const { isCancelled, cancel, reactivate } = useCancelledSubscriptions(userId);
  const { getSubscriptionImage, updateSubscriptionImage, getSubscriptionColor, updateSubscriptionColor } = useSettings();
  const { showSuccess, showError } = useNotification();
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup | null>(null);
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<ServiceGroup | null>(null);

  // Calcula largura do gráfico via ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const updateWidth = () => {
      const width = el.offsetWidth - (isMobile ? 32 : 48);
      setChartWidth(Math.max(width, 300));
    };

    const debouncedUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(updateWidth);
      }, 100);
    };

    updateWidth();
    const ro = new ResizeObserver(debouncedUpdate);
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const paperSx = (accentColor = primary) => ({
    p: isMobile ? 2 : 3,
    position: "relative" as const,
    overflow: "hidden",
    minWidth: 0,
    background: isDark
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
      : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
    backdropFilter: "blur(16px)",
    border: `1px solid ${isDark ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
    borderRadius: "20px",
    boxShadow: `0 6px 24px -6px ${alpha(accentColor, 0.12)}`,
  });

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach((t) => {
      if (t.type === "expense" && t.category === "Subscriptions") {
        years.add(parseInt(t.date.slice(0, 4), 10));
      }
    });
    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const yearTransactions = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.type === "expense" &&
          t.category === "Subscriptions" &&
          t.date.startsWith(String(selectedYear))
      ),
    [transactions, selectedYear]
  );

  const allSubTransactions = useMemo(
    () => transactions.filter((t) => t.type === "expense" && t.category === "Subscriptions"),
    [transactions]
  );

  // Pontos mensais — usa apenas transações de serviços ATIVOS
  const monthlyPoints: MonthlyPoint[] = useMemo(() => {
    const map = new Map<string, number>();
    yearTransactions
      .filter((t) => !isCancelled(t.description))
      .forEach((t) => {
        const key = t.date.slice(0, 7);
        map.set(key, (map.get(key) ?? 0) + t.amount);
      });
    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = String(i + 1).padStart(2, "0");
      const key = `${selectedYear}-${monthStr}`;
      return { label: MONTH_LABELS[i], month: key, total: map.get(key) ?? 0 };
    });
  }, [yearTransactions, selectedYear, isCancelled]);

  const currentMonthTotal = useMemo(() => {
    const key = `${selectedYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    return monthlyPoints.find((p) => p.month === key)?.total ?? 0;
  }, [monthlyPoints, selectedYear]);

  const monthlyAverage = useMemo(() => {
    const active = monthlyPoints.filter((p) => p.total > 0);
    if (active.length === 0) return 0;
    return active.reduce((s, p) => s + p.total, 0) / active.length;
  }, [monthlyPoints]);

  // Grupos de serviços
  const allGroups: ServiceGroup[] = useMemo(() => {
    const map = new Map<
      string,
      { name: string; entries: { month: string; amount: number }[]; txs: Transaction[] }
    >();

    allSubTransactions.forEach((t) => {
      const key = normalizeDesc(t.description);
      const month = t.date.slice(0, 7);
      if (!map.has(key)) map.set(key, { name: t.description, entries: [], txs: [] });
      const group = map.get(key)!;
      group.entries.push({ month, amount: t.amount });
      group.txs.push(t);
    });

    const result: ServiceGroup[] = [];

    map.forEach((data, normalizedName) => {
      const hasInYear = data.entries.some((e) => e.month.startsWith(String(selectedYear)));
      if (!hasInYear) return;

      const sortedTxs = [...data.txs].sort((a, b) => b.date.localeCompare(a.date));
      const lastAmount = sortedTxs[0].amount;
      const monthsActive = new Set(data.entries.map((e) => e.month)).size;

      const distinctMonths = [...new Set(data.entries.map((e) => e.month))].sort((a, b) =>
        b.localeCompare(a)
      );
      let trend: "up" | "down" | "flat" = "flat";
      if (distinctMonths.length >= 2) {
        const lastVal = data.entries
          .filter((e) => e.month === distinctMonths[0])
          .reduce((s, e) => s + e.amount, 0);
        const prevVal = data.entries
          .filter((e) => e.month === distinctMonths[1])
          .reduce((s, e) => s + e.amount, 0);
        if (lastVal > prevVal * 1.02) trend = "up";
        else if (lastVal < prevVal * 0.98) trend = "down";
      }

      result.push({ name: data.name, normalizedName, lastAmount, monthsActive, trend, transactions: sortedTxs });
    });

    return result.sort((a, b) => b.lastAmount - a.lastAmount);
  }, [allSubTransactions, selectedYear]);

  const activeGroups = useMemo(
    () => allGroups.filter((g) => !isCancelled(g.name)),
    [allGroups, isCancelled]
  );

  const cancelledGroups = useMemo(
    () => allGroups.filter((g) => isCancelled(g.name)),
    [allGroups, isCancelled]
  );

  // Deriva o grupo exibido a partir do estado vivo, evitando snapshot stale após edição/deleção
  const displayedGroup = useMemo(
    () => selectedGroup
      ? allGroups.find(g => g.normalizedName === selectedGroup.normalizedName) ?? null
      : null,
    [selectedGroup, allGroups]
  );

  useEffect(() => {
    if (selectedGroup && !displayedGroup) setSelectedGroup(null);
  }, [selectedGroup, displayedGroup]);

  const isEmpty = yearTransactions.length === 0;

  const tooltipContentStyle = {
    backgroundColor: isDark ? alpha("#1e1e2e", 0.95) : alpha("#ffffff", 0.95),
    border: `1px solid ${isDark ? alpha("#fff", 0.1) : alpha("#000", 0.1)}`,
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    fontSize: 13,
    padding: "10px 14px",
  };

  const summaryCards = [
    { label: "Mês atual", value: formatCurrency(currentMonthTotal), icon: <CalendarIcon fontSize="small" />, color: primary },
    { label: "Média mensal", value: formatCurrency(monthlyAverage), icon: <PaymentsIcon fontSize="small" />, color: primary },
    { label: "Serviços ativos", value: String(activeGroups.length), icon: <AppsIcon fontSize="small" />, color: primary },
  ];

  // ─── Detail view ─────────────────────────────────────────────────────────────
  if (displayedGroup) {
    const imageUrl = getSubscriptionImage(displayedGroup.name);
    const detailColors = getSubscriptionColor(displayedGroup.name) ?? hashColor(displayedGroup.name);
    const totalSpent = displayedGroup.transactions.reduce((s, t) => s + t.amount, 0);
    const TrendIcon = () => {
      if (displayedGroup.trend === "up") return <TrendingUpIcon fontSize="small" color="error" />;
      if (displayedGroup.trend === "down") return <TrendingDownIcon fontSize="small" color="success" />;
      return <TrendingFlatIcon fontSize="small" sx={{ color: "text.disabled" }} />;
    };
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3, px: { xs: 0, md: "28px" }, pt: { xs: 0, md: "24px" }, pb: { xs: "140px", md: "60px" } }}>
        {/* Header */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton onClick={() => setSelectedGroup(null)} sx={{ border: 1, borderColor: "divider", borderRadius: "10px" }}>
              <ArrowBackIcon />
            </IconButton>
            <PaymentMethodIcon
              imageUrl={imageUrl}
              colors={detailColors}
              size={44}
              borderRadius="14px"
              iconSize={22}
            />
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">{displayedGroup.name}</Typography>
              <Typography variant="body2" color="text.secondary">Assinatura</Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={gridSpacing}>
          <Grid size={{ xs: 6, md: 4 }}>
            <Paper elevation={0} sx={{ p: isMobile ? 1.5 : 2, borderRadius: "16px", border: `1px solid ${alpha(detailColors.primary, 0.15)}`, backdropFilter: "blur(16px)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Total gasto</Typography>
              <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} color={detailColors.primary} sx={{ mt: 0.5 }}>
                {formatCurrency(totalSpent)}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 4 }}>
            <Paper elevation={0} sx={{ p: isMobile ? 1.5 : 2, borderRadius: "16px", border: `1px solid ${alpha(detailColors.primary, 0.15)}`, backdropFilter: "blur(16px)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Meses ativos</Typography>
              <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700} sx={{ mt: 0.5 }}>
                {displayedGroup.monthsActive}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: isMobile ? 1.5 : 2, borderRadius: "16px", border: `1px solid ${alpha(detailColors.primary, 0.15)}`, backdropFilter: "blur(16px)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Tendência</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <TrendIcon />
                <Typography variant={isMobile ? "body1" : "h6"} fontWeight={700}>
                  {displayedGroup.trend === "up" ? "Subindo" : displayedGroup.trend === "down" ? "Caindo" : "Estável"}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Transaction history */}
        <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#000", 0.06)}`, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <Typography fontWeight={700} fontSize={14}>Histórico de cobranças</Typography>
          </Box>
          {displayedGroup.transactions.map((tx, idx) => (
            <Box key={tx.id}>
              {idx > 0 && <Divider sx={{ opacity: 0.4 }} />}
              <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 72, flexShrink: 0 }}>
                  {formatDate(tx.date)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tx.description}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="error.main" sx={{ flexShrink: 0 }}>
                  − {formatCurrency(tx.amount)}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                  <IconButton size="small" onClick={() => onEdit(tx)} sx={{ p: 0.5, color: "text.secondary", "&:hover": { color: "primary.main" } }}>
                    <EditIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(tx)} sx={{ p: 0.5, color: "text.secondary", "&:hover": { color: "error.main" } }}>
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 2 : 3,
        px: { xs: 0, md: "28px" },
        pt: { xs: 0, md: "24px" },
        pb: { xs: "140px", md: "60px" },
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems="flex-end"
        justifyContent="space-between"
        gap="14px"
        flexWrap="wrap"
        sx={{ mb: "22px" }}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Subscriptions
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Track your recurring services and plans
          </Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: "10px" }}>

        <Stack direction="row" gap={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Ano</InputLabel>
            <Select
              value={selectedYear}
              label="Ano"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              sx={{ borderRadius: "12px" }}
            >
              {availableYears.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
            sx={{
              height: 40,
              borderRadius: "20px",
              px: 2.5,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: `0 4px 14px -4px ${alpha(primary, 0.4)}`,
            }}
          >
            {isMobile ? "Nova" : "Nova assinatura"}
          </Button>
        </Stack>
        </Box>
      </Box>

      {/* Cards de resumo */}
      <Grid container spacing={gridSpacing}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
            <Paper elevation={0} sx={paperSx(card.color)}>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: "12px",
                    bgcolor: alpha(card.color, 0.1),
                    color: card.color,
                    display: "flex",
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {card.label}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {isEmpty ? (
        <EmptyState
          type="generic"
          title={`Nenhuma assinatura em ${selectedYear}`}
          description='Registre despesas com a categoria "Subscriptions" para acompanhar seus gastos aqui.'
          actionLabel="Nova assinatura"
          onAction={onNewTransaction}
        />
      ) : (
        <>
          {/* Gráfico de barras mensal */}
          <Paper elevation={0} sx={paperSx()}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: "20px",
                  bgcolor: alpha(primary, 0.1),
                  color: "primary.main",
                  display: "flex",
                }}
              >
                <CalendarIcon />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Gasto por mês — {selectedYear}
              </Typography>
            </Box>

            <Box sx={{ width: "100%", height: isMobile ? 200 : 240, overflowX: "auto" }}>
              <BarChart
                data={monthlyPoints}
                width={chartWidth}
                height={isMobile ? 200 : 240}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={alpha(theme.palette.divider, 0.5)}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => {
                    if (v === 0) return "R$0";
                    if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
                    return `R$${v}`;
                  }}
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                />
                <RechartsTooltip
                  formatter={(value: number) => [formatCurrency(value), "Total"]}
                  contentStyle={tooltipContentStyle}
                  labelStyle={{ color: theme.palette.text.primary, fontWeight: 600, marginBottom: 4 }}
                  wrapperStyle={{ zIndex: 9999 }}
                  cursor={{ fill: alpha(primary, 0.06) }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {monthlyPoints.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={
                        entry.month === currentMonth
                          ? primary
                          : alpha(primary, isDark ? 0.45 : 0.35)
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </Box>
          </Paper>

          {/* Serviços ativos */}
          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={gridSpacing}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "20px",
                    bgcolor: alpha(primary, 0.1),
                    color: "primary.main",
                    display: "flex",
                  }}
                >
                  <AppsIcon />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Serviços ativos
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {activeGroups.length} ativo{activeGroups.length !== 1 ? "s" : ""}
              </Typography>
            </Box>

            {activeGroups.length === 0 ? (
              <Box py={4} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Nenhum serviço ativo em {selectedYear}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={gridSpacing}>
                {activeGroups.map((group) => (
                  <ServiceCard
                    key={group.normalizedName}
                    group={group}
                    isCancelled={false}
                    onCancel={cancel}
                    onReactivate={reactivate}
                    onOpenDetail={setSelectedGroup}
                    onDeleteGroup={setDeleteConfirmGroup}
                    imageUrl={getSubscriptionImage(group.name)}
                    subscriptionColor={getSubscriptionColor(group.name)}
                    onSetImage={async (name, url) => {
                      await updateSubscriptionImage(name, url);
                      if (url) {
                        extractDominantColor(url).then((colors) => {
                          updateSubscriptionColor(name, colors ?? hashColor(name));
                        });
                      }
                    }}
                  />
                ))}
              </Grid>
            )}
          </Box>

          {/* Serviços encerrados — seção colapsável */}
          {cancelledGroups.length > 0 && (
            <Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={gridSpacing}
                onClick={() => setShowCancelled((v) => !v)}
                sx={{ cursor: "pointer", userSelect: "none" }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "20px",
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: "error.main",
                      display: "flex",
                    }}
                  >
                    <CancelIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={600} color="error.main">
                    Encerradas
                  </Typography>
                  <Chip
                    label={cancelledGroups.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: "error.main",
                      fontWeight: 600,
                      borderRadius: "6px",
                    }}
                  />
                </Box>
                <IconButton size="small" sx={{ color: "text.secondary", pointerEvents: "none" }}>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{
                      transform: showCancelled ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </IconButton>
              </Box>

              <Collapse in={showCancelled} timeout="auto" unmountOnExit>
                <Grid container spacing={gridSpacing}>
                  {cancelledGroups.map((group) => (
                    <ServiceCard
                      key={group.normalizedName}
                      group={group}
                      isCancelled
                      onCancel={cancel}
                      onReactivate={reactivate}
                      onOpenDetail={setSelectedGroup}
                      onDeleteGroup={setDeleteConfirmGroup}
                      imageUrl={getSubscriptionImage(group.name)}
                      subscriptionColor={getSubscriptionColor(group.name)}
                      onSetImage={async (name, url) => { await updateSubscriptionImage(name, url); }}
                    />
                  ))}
                </Grid>
              </Collapse>
            </Box>
          )}
        </>
      )}

      {/* Delete group confirmation */}
      <Dialog
        open={Boolean(deleteConfirmGroup)}
        onClose={() => setDeleteConfirmGroup(null)}
        PaperProps={{ sx: { borderRadius: "20px", minWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Excluir assinatura</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja excluir todas as {deleteConfirmGroup?.transactions.length} cobranças de <strong>{deleteConfirmGroup?.name}</strong>? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmGroup(null)} sx={{ borderRadius: "10px", textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!deleteConfirmGroup) return;
              try {
                await Promise.all(deleteConfirmGroup.transactions.map((tx) => onDelete(tx)));
                showSuccess(`Assinatura "${deleteConfirmGroup.name}" excluída`);
              } catch {
                showError("Erro ao excluir algumas cobranças");
              } finally {
                setDeleteConfirmGroup(null);
              }
            }}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
          >
            Excluir tudo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionsView;
