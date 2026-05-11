import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Checkbox,
  Button,
  Paper,
  alpha,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  FactCheck as FactCheckIcon,
  PlaylistAddCheck as MarkAllIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import dayjs from "dayjs";
import { Transaction, PaymentMethodConfig, ColorConfig } from "../../types";
import { useSettings } from "../../contexts";
import { useCurrency } from "../../hooks/useCurrency";
import { usePrivacyMode } from "../../hooks/usePrivacyMode";
import PaymentMethodIcon from "../ui/PaymentMethodIcon";
import EmptyState from "../ui/EmptyState";
import { getEffectiveReportDate } from "../../utils/transactionUtils";
import { hashColor } from "../../utils/imageColorUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentGuideViewProps {
  transactions: Transaction[];
  paymentMethodConfigs: PaymentMethodConfig[];
  onTogglePaid: (id: string, isPaid: boolean) => void;
  selectedMonth: number; // 1-indexed
  selectedYear: number;
}

interface GuideStep {
  methodName: string;
  config: PaymentMethodConfig | undefined;
  methodType: "card" | "cash";
  colors: ColorConfig;
  transactions: Transaction[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function effectiveId(tx: Transaction): string {
  return tx.isVirtual && tx.originalTransactionId
    ? tx.originalTransactionId
    : tx.id;
}

// ─── Animation ────────────────────────────────────────────────────────────────

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "55%" : "-55%", opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 380, damping: 32 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-55%" : "55%",
    opacity: 0,
    transition: { duration: 0.18, ease: "easeIn" },
  }),
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PaymentGuideView: React.FC<PaymentGuideViewProps> = ({
  transactions,
  paymentMethodConfigs,
  onTogglePaid,
  selectedMonth,
  selectedYear,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { format, noWrapStyle } = useCurrency();
  const { privacyStyles } = usePrivacyMode();
  const { getPaymentMethodColor, getPaymentMethodConfig } = useSettings();

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [localPaid, setLocalPaid] = useState<Set<string>>(new Set());
  const [sessionPaidCount, setSessionPaidCount] = useState(0);

  // ── Build guide steps ────────────────────────────────────────────────────

  const guideSteps = useMemo((): GuideStep[] => {
    // 1. Filter to unpaid expenses for the selected month/year
    const pending = transactions.filter((t) => {
      if (t.type !== "expense") return false;
      if (t.isPaid) return false;
      if (localPaid.has(effectiveId(t))) return false;

      const reportDate = getEffectiveReportDate(t, paymentMethodConfigs);
      const d = dayjs(reportDate);
      return d.month() + 1 === selectedMonth && d.year() === selectedYear;
    });

    // 2. Group by paymentMethod
    const methodMap = new Map<string, Transaction[]>();
    pending.forEach((t) => {
      const list = methodMap.get(t.paymentMethod) ?? [];
      list.push(t);
      methodMap.set(t.paymentMethod, list);
    });

    // 3. Build steps
    const steps: GuideStep[] = [];
    methodMap.forEach((txs, methodName) => {
      const config = getPaymentMethodConfig(methodName);
      const methodType = config?.type ?? "cash";
      const savedColors = getPaymentMethodColor(methodName);
      const colors = savedColors ?? hashColor(methodName);
      steps.push({ methodName, config, methodType, colors, transactions: txs });
    });

    // 4. Sort: cards first (by paymentDay asc), then cash (alphabetically)
    steps.sort((a, b) => {
      if (a.methodType === "card" && b.methodType !== "card") return -1;
      if (a.methodType !== "card" && b.methodType === "card") return 1;
      if (a.methodType === "card" && b.methodType === "card") {
        return (a.config?.paymentDay ?? 999) - (b.config?.paymentDay ?? 999);
      }
      return a.methodName.localeCompare(b.methodName);
    });

    return steps;
  }, [
    transactions,
    paymentMethodConfigs,
    selectedMonth,
    selectedYear,
    localPaid,
    getPaymentMethodColor,
    getPaymentMethodConfig,
  ]);

  // ── Derived state ────────────────────────────────────────────────────────

  const isOverview = stepIndex === 0;
  const isDone = stepIndex > guideSteps.length;
  const currentStep: GuideStep | null =
    stepIndex >= 1 && stepIndex <= guideSteps.length
      ? guideSteps[stepIndex - 1]
      : null;

  const allChecked =
    !currentStep ||
    currentStep.transactions.length === 0 ||
    currentStep.transactions.every((t) => localPaid.has(effectiveId(t)));

  const cardSteps = guideSteps.filter((s) => s.methodType === "card");
  const cashSteps = guideSteps.filter((s) => s.methodType === "cash");

  // ── Handlers ─────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    setDirection(1);
    setStepIndex((i) => i + 1);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToStep = useCallback((idx: number) => {
    setDirection(idx > stepIndex ? 1 : -1);
    setStepIndex(idx);
  }, [stepIndex]);

  const handleToggle = useCallback(
    (tx: Transaction) => {
      const id = effectiveId(tx);
      const nowPaid = !localPaid.has(id);
      setLocalPaid((prev) => {
        const next = new Set(prev);
        nowPaid ? next.add(id) : next.delete(id);
        return next;
      });
      setSessionPaidCount((c) => Math.max(0, c + (nowPaid ? 1 : -1)));
      onTogglePaid(id, nowPaid);
    },
    [localPaid, onTogglePaid]
  );

  const handleMarkAll = useCallback(() => {
    if (!currentStep) return;
    const toMark = currentStep.transactions.filter(
      (t) => !localPaid.has(effectiveId(t))
    );
    if (toMark.length === 0) return;
    setLocalPaid((prev) => {
      const next = new Set(prev);
      toMark.forEach((t) => next.add(effectiveId(t)));
      return next;
    });
    setSessionPaidCount((c) => c + toMark.length);
    toMark.forEach((t) => onTogglePaid(effectiveId(t), true));
  }, [currentStep, localPaid, onTogglePaid]);

  const handleReset = useCallback(() => {
    setStepIndex(0);
    setLocalPaid(new Set());
    setSessionPaidCount(0);
    setDirection(1);
  }, []);

  // ── Totals for overview ──────────────────────────────────────────────────

  const totalPending = guideSteps.reduce(
    (sum, s) => sum + s.transactions.reduce((a, t) => a + t.amount, 0),
    0
  );
  const totalTxCount = guideSteps.reduce(
    (sum, s) => sum + s.transactions.length,
    0
  );

  // ── Progress ─────────────────────────────────────────────────────────────

  const progressPct =
    guideSteps.length > 0
      ? Math.round(((stepIndex - 1) / guideSteps.length) * 100)
      : 0;

  // ── Empty state (no pending) ─────────────────────────────────────────────

  if (guideSteps.length === 0 && isOverview) {
    return (
      <Box sx={{ px: isMobile ? 0 : "28px", pt: isMobile ? 0 : "24px" }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: { xs: 20, md: 26 },
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Guia de Pagamento
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
            Pague suas contas em ordem
          </Typography>
        </Box>
        <EmptyState
          type="generic"
          title="Tudo em dia!"
          description="Nenhuma despesa pendente para este período. Aproveite!"
        />
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        px: isMobile ? 0 : "28px",
        pt: isMobile ? 0 : "24px",
        pb: { xs: "160px", md: "60px" },
        minHeight: "100%",
      }}
    >
      {/* Page header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontSize: { xs: 20, md: 26 },
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Guia de Pagamento
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13.5, mt: "4px" }}>
          {isOverview
            ? "Pague suas contas em ordem"
            : isDone
              ? "Sessão concluída"
              : currentStep
                ? `${currentStep.methodType === "card" ? "Cartão" : "À Vista"} ${
                    currentStep.methodType === "card"
                      ? cardSteps.findIndex((s) => s.methodName === currentStep.methodName) + 1
                      : cashSteps.findIndex((s) => s.methodName === currentStep.methodName) + 1
                  } de ${
                    currentStep.methodType === "card"
                      ? cardSteps.length
                      : cashSteps.length
                  }`
                : ""}
        </Typography>
      </Box>

      {/* Global progress bar — visible on method steps only */}
      {!isOverview && !isDone && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Progresso geral
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stepIndex} de {guideSteps.length}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 6,
              borderRadius: 6,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              "& .MuiLinearProgress-bar": {
                borderRadius: 6,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, #8b5cf6)`,
              },
            }}
          />
        </Box>
      )}

      {/* Animated slide area */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ width: "100%", willChange: "transform, opacity" }}
          >
            {isOverview && (
              <OverviewSlide
                guideSteps={guideSteps}
                cardSteps={cardSteps}
                cashSteps={cashSteps}
                totalTxCount={totalTxCount}
                totalPending={totalPending}
                isDark={isDark}
                isMobile={isMobile}
                format={format}
                privacyStyles={privacyStyles}
                noWrapStyle={noWrapStyle}
                onStart={() => goToStep(1)}
                onGoToStep={goToStep}
              />
            )}

            {currentStep && (
              <MethodSlide
                step={currentStep}
                stepIndex={stepIndex}
                guideSteps={guideSteps}
                localPaid={localPaid}
                allChecked={allChecked}
                isDark={isDark}
                isMobile={isMobile}
                format={format}
                privacyStyles={privacyStyles}
                noWrapStyle={noWrapStyle}
                onToggle={handleToggle}
                onMarkAll={handleMarkAll}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {isDone && (
              <DoneSlide
                sessionPaidCount={sessionPaidCount}
                onReset={handleReset}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

// ─── Overview Slide ───────────────────────────────────────────────────────────

interface OverviewSlideProps {
  guideSteps: GuideStep[];
  cardSteps: GuideStep[];
  cashSteps: GuideStep[];
  totalTxCount: number;
  totalPending: number;
  isDark: boolean;
  isMobile: boolean;
  format: (v: number) => string;
  privacyStyles: object;
  noWrapStyle: object;
  onStart: () => void;
  onGoToStep: (idx: number) => void;
}

const OverviewSlide: React.FC<OverviewSlideProps> = ({
  guideSteps,
  cardSteps,
  cashSteps,
  totalTxCount,
  totalPending,
  isDark,
  isMobile,
  format,
  privacyStyles,
  noWrapStyle,
  onStart,
  onGoToStep,
}) => {
  const theme = useTheme();

  const MethodRow: React.FC<{ step: GuideStep; globalIdx: number }> = ({
    step,
    globalIdx,
  }) => {
    const stepTotal = step.transactions.reduce((s, t) => s + t.amount, 0);
    return (
      <Paper
        elevation={0}
        onClick={() => onGoToStep(globalIdx + 1)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: "12px",
          cursor: "pointer",
          background: isDark
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha("#fff", 0.8),
          backdropFilter: "blur(12px)",
          border: `1px solid ${alpha(step.colors.primary, isDark ? 0.25 : 0.15)}`,
          borderLeft: `3px solid ${step.colors.primary}`,
          transition: "all 0.15s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 6px 20px -4px ${alpha(step.colors.primary, 0.25)}`,
          },
        }}
      >
        <PaymentMethodIcon
          imageUrl={step.config?.imageUrl}
          colors={step.colors}
          size={36}
          borderRadius="10px"
          iconSize={18}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={600} fontSize={13.5} noWrap>
            {step.methodName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {step.transactions.length} pendente
            {step.transactions.length !== 1 ? "s" : ""}
            {step.config?.paymentDay
              ? ` · vence dia ${step.config.paymentDay}`
              : ""}
          </Typography>
        </Box>
        <Typography
          fontWeight={700}
          fontSize={14}
          sx={{ ...privacyStyles, ...noWrapStyle, color: "error.main", flexShrink: 0 }}
        >
          {format(stepTotal)}
        </Typography>
      </Paper>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Summary chips */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          icon={<FactCheckIcon sx={{ fontSize: "16px !important" }} />}
          label={`${guideSteps.length} método${guideSteps.length !== 1 ? "s" : ""}`}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.04),
          }}
        />
        <Chip
          label={`${totalTxCount} transação${totalTxCount !== 1 ? "ões" : ""}`}
          size="small"
          sx={{
            fontWeight: 600,
            bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.04),
          }}
        />
        <Chip
          label={format(totalPending)}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: alpha("#DC2626", isDark ? 0.2 : 0.1),
            color: "#DC2626",
            ...privacyStyles,
          }}
        />
      </Stack>

      {/* Card methods section */}
      {cardSteps.length > 0 && (
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}
          >
            <CreditCardIcon
              sx={{ fontSize: 16, color: "text.secondary" }}
            />
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Cartões ({cardSteps.length})
            </Typography>
          </Box>
          <Stack spacing={1}>
            {cardSteps.map((step) => {
              const globalIdx = guideSteps.findIndex(
                (s) => s.methodName === step.methodName
              );
              return (
                <MethodRow key={step.methodName} step={step} globalIdx={globalIdx} />
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Cash methods section */}
      {cashSteps.length > 0 && (
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}
          >
            <WalletIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              À Vista / Instantâneo ({cashSteps.length})
            </Typography>
          </Box>
          <Stack spacing={1}>
            {cashSteps.map((step) => {
              const globalIdx = guideSteps.findIndex(
                (s) => s.methodName === step.methodName
              );
              return (
                <MethodRow key={step.methodName} step={step} globalIdx={globalIdx} />
              );
            })}
          </Stack>
        </Box>
      )}

      {/* CTA */}
      <Button
        variant="contained"
        size="large"
        endIcon={<ArrowForwardIcon />}
        onClick={onStart}
        sx={{
          borderRadius: "12px",
          fontWeight: 700,
          textTransform: "none",
          fontSize: 15,
          mt: 1,
          py: 1.5,
          boxShadow: "0 6px 20px -6px rgba(99,102,241,0.6)",
          "&:hover": { boxShadow: "0 8px 24px -4px rgba(99,102,241,0.5)" },
        }}
      >
        Começar
      </Button>
    </Box>
  );
};

// ─── Method Slide ─────────────────────────────────────────────────────────────

interface MethodSlideProps {
  step: GuideStep;
  stepIndex: number;
  guideSteps: GuideStep[];
  localPaid: Set<string>;
  allChecked: boolean;
  isDark: boolean;
  isMobile: boolean;
  format: (v: number) => string;
  privacyStyles: object;
  noWrapStyle: object;
  onToggle: (tx: Transaction) => void;
  onMarkAll: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const MethodSlide: React.FC<MethodSlideProps> = ({
  step,
  stepIndex,
  guideSteps,
  localPaid,
  allChecked,
  isDark,
  isMobile,
  format,
  privacyStyles,
  noWrapStyle,
  onToggle,
  onMarkAll,
  onNext,
  onPrev,
}) => {
  const theme = useTheme();
  const { colors } = step;

  // Step-level progress counts (all transactions including already-checked ones this session)
  const checkedInStep = step.transactions.filter((t) =>
    localPaid.has(effectiveId(t))
  ).length;
  const totalInStep = step.transactions.length;

  const stepProgressPct =
    totalInStep > 0 ? Math.round((checkedInStep / totalInStep) * 100) : 100;

  const stepTotal = step.transactions.reduce((s, t) => s + t.amount, 0);
  const hasUnmarked = step.transactions.some(
    (t) => !localPaid.has(effectiveId(t))
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Method header card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          boxShadow: `0 8px 32px -8px ${alpha(colors.primary, 0.45)}`,
          p: 2.5,
          color: "#fff",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}
        >
          <PaymentMethodIcon
            imageUrl={step.config?.imageUrl}
            colors={{ primary: "#fff", secondary: alpha("#fff", 0.7) }}
            size={48}
            borderRadius="12px"
            iconSize={22}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              fontWeight={700}
              fontSize={18}
              sx={{ color: "#fff", lineHeight: 1.2 }}
              noWrap
            >
              {step.methodName}
            </Typography>
            <Typography
              sx={{ fontSize: 12.5, color: alpha("#fff", 0.75), mt: 0.25 }}
            >
              {step.methodType === "card"
                ? step.config?.paymentDay
                  ? `Vence dia ${step.config.paymentDay}`
                  : "Cartão de crédito"
                : "Pagamento à vista"}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: alpha("#fff", 0.7),
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Total pendente
            </Typography>
            <Typography
              fontWeight={800}
              fontSize={20}
              sx={{ color: "#fff", letterSpacing: "-0.02em", ...privacyStyles }}
            >
              {format(stepTotal)}
            </Typography>
          </Box>
        </Box>

        {/* Step mini progress bar */}
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.75,
            }}
          >
            <Typography sx={{ fontSize: 11.5, color: alpha("#fff", 0.8) }}>
              {checkedInStep} de {totalInStep} paga
              {totalInStep !== 1 ? "s" : ""}
            </Typography>
            {allChecked && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: "14px !important", color: "#10b981 !important" }} />}
                label="Concluído"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10.5,
                  fontWeight: 700,
                  bgcolor: alpha("#10b981", 0.25),
                  color: "#fff",
                  border: `1px solid ${alpha("#10b981", 0.5)}`,
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={stepProgressPct}
            sx={{
              height: 5,
              borderRadius: 5,
              bgcolor: alpha("#fff", 0.2),
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                bgcolor: "#10b981",
              },
            }}
          />
        </Box>
      </Paper>

      {/* Transaction list */}
      <Stack spacing={1}>
        {step.transactions.map((tx) => {
          const id = effectiveId(tx);
          const isChecked = localPaid.has(id);
          return (
            <Paper
              key={tx.id}
              elevation={0}
              onClick={() => onToggle(tx)}
              sx={{
                borderRadius: "14px",
                borderLeft: `3px solid ${isChecked ? "#10b981" : colors.primary}`,
                background: isDark
                  ? `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.7
                    )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                  : `linear-gradient(135deg, ${alpha("#fff", 0.85)} 0%, ${alpha(
                      "#fff",
                      0.65
                    )} 100%)`,
                backdropFilter: "blur(12px)",
                border: `1px solid ${
                  isDark ? alpha("#fff", 0.06) : alpha("#000", 0.05)
                }`,
                borderLeftWidth: 3,
                borderLeftColor: isChecked ? "#10b981" : colors.primary,
                opacity: isChecked ? 0.6 : 1,
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                "&:hover": { opacity: 1 },
              }}
            >
              <Checkbox
                checked={isChecked}
                onChange={() => onToggle(tx)}
                onClick={(e) => e.stopPropagation()}
                size="small"
                sx={{
                  color: colors.primary,
                  "&.Mui-checked": { color: "#10b981" },
                  p: 0.25,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  fontWeight={600}
                  fontSize={13.5}
                  noWrap
                  sx={{
                    textDecoration: isChecked ? "line-through" : "none",
                    color: isChecked ? "text.secondary" : "text.primary",
                  }}
                >
                  {tx.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tx.category} · {dayjs(tx.date).format("DD/MM")}
                  {tx.isVirtual ? " · Recorrente" : ""}
                </Typography>
              </Box>
              <Typography
                fontWeight={700}
                fontSize={13.5}
                sx={{
                  ...privacyStyles,
                  ...noWrapStyle,
                  flexShrink: 0,
                  color: isChecked ? "text.disabled" : "text.primary",
                }}
              >
                {format(tx.amount)}
              </Typography>
            </Paper>
          );
        })}
      </Stack>

      {/* Mark all button */}
      {hasUnmarked && (
        <Button
          variant="outlined"
          startIcon={<MarkAllIcon />}
          onClick={onMarkAll}
          size="small"
          sx={{
            alignSelf: "flex-start",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            borderColor: alpha(colors.primary, 0.4),
            color: colors.primary,
            "&:hover": {
              borderColor: colors.primary,
              bgcolor: alpha(colors.primary, 0.06),
            },
          }}
        >
          Marcar todos como pago
        </Button>
      )}

      {/* Bottom navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1.5,
          mt: 1,
          pt: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          position: { xs: "sticky", md: "static" },
          bottom: { xs: "calc(72px + 16px)", md: "auto" },
          bgcolor: "background.default",
          zIndex: 2,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onPrev}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Anterior
        </Button>
        <Button
          variant="contained"
          endIcon={
            allChecked ? (
              <CheckCircleIcon />
            ) : (
              <ArrowForwardIcon />
            )
          }
          onClick={onNext}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            ...(allChecked && {
              bgcolor: "#10b981",
              "&:hover": { bgcolor: "#059669" },
              boxShadow: `0 4px 16px -4px ${alpha("#10b981", 0.5)}`,
            }),
          }}
        >
          {stepIndex >= guideSteps.length ? "Concluir" : "Próximo"}
        </Button>
      </Box>
    </Box>
  );
};

// ─── Done Slide ───────────────────────────────────────────────────────────────

interface DoneSlideProps {
  sessionPaidCount: number;
  onReset: () => void;
}

const DoneSlide: React.FC<DoneSlideProps> = ({ sessionPaidCount, onReset }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        py: 6,
        gap: 1.5,
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
      >
        <CheckCircleIcon
          sx={{ fontSize: 80, color: "#10b981", mb: 1 }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
          Tudo certo!
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14.5 }}>
          {sessionPaidCount > 0
            ? `Você marcou ${sessionPaidCount} transaç${sessionPaidCount !== 1 ? "ões" : "ão"} como paga${sessionPaidCount !== 1 ? "s" : ""} nesta sessão.`
            : "Nenhuma transação foi marcada nesta sessão."}
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
      >
        <Button
          variant="contained"
          startIcon={<FactCheckIcon />}
          onClick={onReset}
          sx={{
            mt: 2,
            borderRadius: "12px",
            fontWeight: 700,
            textTransform: "none",
            px: 3,
            py: 1.25,
            boxShadow: "0 6px 20px -6px rgba(99,102,241,0.6)",
          }}
        >
          Voltar ao Início
        </Button>
      </motion.div>
    </Box>
  );
};

export default PaymentGuideView;
