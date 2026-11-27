import { useMemo, type ReactNode } from "react";
import { Box, Button, Paper, Stack, Typography, alpha, darken, useTheme } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CreditCard } from "lucide-react";
import dayjs from "dayjs";
import type { FinancialSummary, PaymentMethodConfig, Transaction } from "@/domain/entities";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";
import { getBalanceOnDate, getEffectiveReportDate } from "@/domain/usecases/transactionUtils";
import { categoryLabel, paymentMethodLabel } from "@/shared/i18n/labels";

const amountFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long" });

interface MobileDashboardOverviewProps {
  transactions: Transaction[];
  periodTransactions: Transaction[];
  summary: FinancialSummary;
  paymentMethodConfigs: PaymentMethodConfig[];
  selectedMonth: number;
  selectedYear: number;
  hasDateRange: boolean;
  isPrivate: boolean;
  onOpenPaymentMethods: () => void;
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

function Amount({ value, isPrivate, size, color = "text.primary" }: {
  value: number;
  isPrivate: boolean;
  size: number;
  color?: string;
}) {
  const parts = isPrivate ? [] : amountFormatter.formatToParts(value);
  return (
    <Typography component="span" sx={{
      display: "block", color, fontSize: size, lineHeight: 1.14, fontWeight: 750,
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
  transactions, periodTransactions, summary, paymentMethodConfigs, selectedMonth, selectedYear,
  hasDateRange, isPrivate, onOpenPaymentMethods, onOpenTransactions,
}: MobileDashboardOverviewProps) {
  const { palette } = useTheme();
  const incomeColor = palette.mode === "dark" ? palette.success.main : darken(palette.success.dark, 0.22);
  const expenseColor = palette.mode === "dark" ? palette.error.main : palette.error.dark;
  const today = dayjs().format("YYYY-MM-DD");
  const { balance, bills, upcoming } = useMemo(() => {
    const start = dayjs(today);
    const end = start.add(30, "day");
    const endDate = end.format("YYYY-MM-DD");
    const active = transactions.filter((tx) => !(tx.isRecurring && tx.excludedDates?.includes(tx.date)));
    const paidBalance = getBalanceOnDate(active.filter((tx) => tx.isPaid), today);
    const cardNames = new Set(paymentMethodConfigs.filter((method) => method.type === "card").map((method) => method.name));
    const billsInCents = periodTransactions.reduce((total, tx) =>
      !tx.isPaid && tx.type === "expense" && cardNames.has(tx.paymentMethod)
        ? total + Math.round(tx.amount * 100)
        : total, 0);

    const projected: Transaction[] = [];
    for (let month = start.startOf("month"); month.isBefore(end); month = month.add(1, "month")) {
      projected.push(...generateRecurringTransactions(transactions, { year: month.year(), month: month.month() }, paymentMethodConfigs));
    }

    const nextExpenses = [...active, ...projected]
      .filter((tx) => tx.type === "expense" && !tx.isPaid)
      .map((tx) => ({ tx, due: getEffectiveReportDate(tx, paymentMethodConfigs) }))
      .filter(({ due }) => due >= today && due < endDate)
      .sort((a, b) => a.due.localeCompare(b.due));

    return { balance: paidBalance, bills: billsInCents / 100, upcoming: nextExpenses };
  }, [transactions, periodTransactions, paymentMethodConfigs, today]);

  const monthName = monthFormatter.format(new Date(selectedYear, selectedMonth, 1));
  const remaining = (Math.round(balance * 100) - Math.round(bills * 100)) / 100;
  const hideAmount = (value: number) => isPrivate ? "Valor oculto" : amountFormatter.format(value);

  return (
    <Stack spacing={1.5}>
      <OverviewCard>
        <Typography component="h2" variant="body2" fontWeight={650} color="text.secondary" mb={0.75}>Saldo registrado</Typography>
        <Amount value={balance} isPrivate={isPrivate} size={34} />
        <Typography variant="body2" color={isPrivate ? "text.secondary" : remaining < 0 ? expenseColor : incomeColor} sx={{ mt: 0.75, fontWeight: 600 }}>
          Após as faturas do período: {hideAmount(remaining)}
        </Typography>
      </OverviewCard>

      <OverviewCard>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" variant="body2" fontWeight={650} color="text.secondary" mb={0.75}>Faturas em aberto</Typography>
            <Amount value={bills} isPrivate={isPrivate} size={30} color={isPrivate ? "text.primary" : expenseColor} />
          </Box>
          <Button onClick={onOpenPaymentMethods} aria-label="Ver métodos de pagamento" sx={{ minWidth: 44, height: 44, p: 0, borderRadius: "14px", bgcolor: "action.hover" }}>
            <CreditCard size={20} />
          </Button>
        </Stack>
      </OverviewCard>

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
              <Amount value={value} isPrivate={isPrivate} size={23} color={isPrivate ? "text.primary" : color} />
            </Box>
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Saldo do fluxo: <Box component="strong" sx={{ color: isPrivate ? "text.primary" : summary.balance < 0 ? expenseColor : incomeColor }}>{hideAmount(summary.balance)}</Box>
        </Typography>
      </OverviewCard>

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
