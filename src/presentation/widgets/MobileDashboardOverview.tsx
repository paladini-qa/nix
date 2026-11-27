import { useMemo, type ReactNode } from "react";
import { Box, Button, ButtonBase, Paper, Stack, Typography, alpha, darken, useTheme } from "@mui/material";
import { Article, CallSplit, CreditCard, Repeat, Star, TrendingUp } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { visuallyHidden } from "@mui/utils";
import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import dayjs from "dayjs";
import type { FinancialSummary, PaymentMethodConfig, Transaction } from "@/domain/entities";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";
import { getEffectiveReportDate } from "@/domain/usecases/transactionUtils";
import { categoryLabel, paymentMethodLabel } from "@/shared/i18n/labels";
import { VIEW_ROUTES } from "@/presentation/routes";

const MOBILE_SHORTCUTS = [
  { to: VIEW_ROUTES.splits, icon: CallSplit, label: "Parcelas", color: "#6366f1" },
  { to: VIEW_ROUTES.recurring, icon: Repeat, label: "Recorrentes", color: "#f59e0b" },
  { to: VIEW_ROUTES.investments, icon: TrendingUp, label: "Investimentos", color: "#22c55e" },
  { to: VIEW_ROUTES.subscriptions, icon: Star, label: "Assinaturas", color: "#ec4899" },
  { to: VIEW_ROUTES.paymentMethods, icon: CreditCard, label: "Pagamentos", color: "#0ea5e9" },
  { to: VIEW_ROUTES["fiscal-report"], icon: Article, label: "Fiscal", color: "#ef4444" },
];

const amountFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long" });

interface MobileDashboardOverviewProps {
  transactions: Transaction[];
  summary: FinancialSummary;
  paymentMethodConfigs: PaymentMethodConfig[];
  selectedMonth: number;
  selectedYear: number;
  hasDateRange: boolean;
  isPrivate: boolean;
  onOpenTransactions: () => void;
}

function OverviewCard({ children }: { children: ReactNode }) {
  return (
    <Paper component="section" elevation={0} sx={(theme) => ({
      p: 2, border: "1px solid", borderColor: "divider", borderRadius: "20px",
      bgcolor: "background.paper",
      boxShadow: `0 4px 18px ${alpha(theme.palette.text.primary, 0.045)}`,
    })}>
      {children}
    </Paper>
  );
}

export function MobileDashboardShortcuts() {
  return (
    <OverviewCard>
      <Typography id="mobile-dashboard-shortcuts" component="h2" fontSize={15} fontWeight={750} mb={1}>Atalhos</Typography>
      <Box
        role="region"
        aria-labelledby="mobile-dashboard-shortcuts"
        sx={{ display: "flex", gap: 0.5, overflowX: "auto", scrollSnapType: "x proximity", pb: 0.5 }}
      >
        {MOBILE_SHORTCUTS.map(({ to, icon: Icon, label, color }) => (
          <ButtonBase
            key={to}
            component={Link}
            to={to}
            sx={{
              flex: "0 0 70px", flexDirection: "column", gap: 0.5, py: 0.75,
              borderRadius: "14px", scrollSnapAlign: "start", color: "text.primary",
              "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
            }}
          >
            <Box sx={(theme) => ({
              width: 44, height: 44, borderRadius: "14px", display: "grid", placeItems: "center",
              backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.3 : 0.15),
              color: theme.palette.mode === "dark" ? color : darken(color, 0.35),
            })}>
              <Icon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="caption" fontWeight={650} sx={{ fontSize: 10.5, whiteSpace: "nowrap" }}>
              {label}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </OverviewCard>
  );
}

function Amount({ value, isPrivate, color }: {
  value: number;
  isPrivate: boolean;
  color: string;
}) {
  const parts = isPrivate ? [] : amountFormatter.formatToParts(value);
  return (
    <Typography component="span" sx={{
      display: "block", color, fontSize: 23, lineHeight: 1.14, fontWeight: 750,
      letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere",
    }}>
      {isPrivate ? <><Box component="span" aria-hidden="true">••••••</Box><Box component="span" sx={visuallyHidden}>Valor oculto</Box></> : parts.map(({ type, value: part }, index) => {
        const isSmall = type === "currency" || type === "decimal" || type === "fraction";
        return <Box component="span" key={index} sx={isSmall ? { fontSize: "0.62em", fontWeight: 600 } : undefined}>{part}</Box>;
      })}
    </Typography>
  );
}

export default function MobileDashboardOverview({
  transactions, summary, paymentMethodConfigs, selectedMonth, selectedYear,
  hasDateRange, isPrivate, onOpenTransactions,
}: MobileDashboardOverviewProps) {
  const { palette } = useTheme();
  const incomeColor = palette.mode === "dark" ? palette.success.main : darken(palette.success.dark, 0.22);
  const expenseColor = palette.mode === "dark" ? palette.error.main : palette.error.dark;
  const today = dayjs().format("YYYY-MM-DD");
  const upcoming = useMemo(() => {
    const start = dayjs(today);
    const end = start.add(30, "day");
    const endDate = end.format("YYYY-MM-DD");
    const active = transactions.filter((tx) => !(tx.isRecurring && tx.excludedDates?.includes(tx.date)));
    const projected: Transaction[] = [];
    for (let month = start.startOf("month"); month.isBefore(end); month = month.add(1, "month")) {
      projected.push(...generateRecurringTransactions(transactions, { year: month.year(), month: month.month() }, paymentMethodConfigs));
    }

    return [...active, ...projected]
      .filter((tx) => tx.type === "expense" && !tx.isPaid)
      .map((tx) => ({ tx, due: getEffectiveReportDate(tx, paymentMethodConfigs) }))
      .filter(({ due }) => due >= today && due < endDate)
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [transactions, paymentMethodConfigs, today]);

  const monthName = monthFormatter.format(new Date(selectedYear, selectedMonth, 1));
  const hideAmount = (value: number) => isPrivate ? "Valor oculto" : amountFormatter.format(value);

  return (
    <Stack spacing={1.5}>
      <OverviewCard>
        <Typography component="h2" fontSize={15} fontWeight={750} mb={1}>
          {hasDateRange ? "Fluxo do período" : `Fluxo de ${monthName}`}
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
          {[
            { label: "Entradas", value: summary.totalIncome, color: incomeColor, icon: <ArrowDownLeft size={15} /> },
            { label: "Saídas", value: summary.totalExpense, color: expenseColor, icon: <ArrowUpRight size={15} /> },
          ].map(({ label, value, color, icon }) => (
            <Box key={label} sx={{ bgcolor: "action.hover", p: 1.25, borderRadius: "14px", minWidth: 0 }}>
              <Stack direction="row" gap={0.5} alignItems="center" color="text.secondary" mb={0.5}>
                {icon}<Typography variant="body2" fontWeight={600}>{label}</Typography>
              </Stack>
              <Amount value={value} isPrivate={isPrivate} color={isPrivate ? "text.primary" : color} />
            </Box>
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Saldo do fluxo: <Box component="strong" sx={{ color: isPrivate ? "text.primary" : summary.balance < 0 ? expenseColor : incomeColor }}>{hideAmount(summary.balance)}</Box>
        </Typography>
      </OverviewCard>

      <MobileDashboardShortcuts />

      <OverviewCard>
        <Typography component="h2" fontSize={15} fontWeight={750}>Próximos 30 dias</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 0.75 }}>Compromissos pendentes</Typography>
        {upcoming.length > 0 ? (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {upcoming.slice(0, 5).map(({ tx, due }) => {
              const date = dayjs(due);
              return (
                <Box component="li" key={tx.id} sx={{
                  display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) minmax(0, max-content)",
                  alignItems: "center", gap: 1.25, py: 1.25, borderBottom: "1px solid", borderColor: "divider",
                }}>
                  <Box component="time" dateTime={due} aria-label={dayFormatter.format(date.toDate())} sx={{
                    display: "grid", alignContent: "center", textAlign: "center", minHeight: 44,
                    bgcolor: "action.hover", borderRadius: "11px", lineHeight: 1,
                  }}>
                    <Typography component="span" fontSize={16} fontWeight={750}>{date.format("DD")}</Typography>
                    <Typography component="span" fontSize={9} color="text.secondary" textTransform="uppercase">{date.format("MMM").replace(".", "")}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <Typography variant="body2" fontWeight={700}>{tx.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{tx.category ? categoryLabel(tx.category) : paymentMethodLabel(tx.paymentMethod)}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} textAlign="right" sx={{ color: isPrivate ? "text.secondary" : expenseColor, whiteSpace: "nowrap" }}>
                    {hideAmount(-tx.amount)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Nenhum compromisso pendente nesse período.</Typography>
        )}
        <Button onClick={onOpenTransactions} endIcon={<ArrowRight size={16} />} sx={{ mt: 0.5, minHeight: 44, px: 0 }}>
          Ver transações
        </Button>
      </OverviewCard>
    </Stack>
  );
}
