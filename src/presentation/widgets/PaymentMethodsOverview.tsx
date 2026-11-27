import { useState } from "react";
import {
  Box, ButtonBase, IconButton, Menu, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableFooter, TableHead, TableRow, TableSortLabel, Typography, alpha, useTheme,
} from "@mui/material";
import {
  ArrowRight, CalendarCheck, ChevronRight, CreditCard, Layers, MoreHorizontal,
  TrendingDown, TriangleAlert,
} from "lucide-react";
import type { ColorConfig, PaymentMethodConfig } from "@/domain/entities";
import NixButton from "@/presentation/components/radix/Button";
import PaymentMethodIcon from "@/presentation/components/ui/PaymentMethodIcon";
import { paymentMethodLabel } from "@/shared/i18n/labels";
import { orbitColors } from "@/shared/theme/colors";
import { formatCurrency } from "@/shared/utils/formatters";
import { OverviewBreakdown, OverviewStatCard, getOverviewChartColors, overviewPanelStyles, overviewStatGridStyles } from "./FinancialOverview";

export interface PaymentMethodSummary {
  name: string;
  totalExpense: number;
  expenseCount: number;
  unpaidCount: number;
  unpaidAmount: number;
  hasActivity: boolean;
  hasUnpaidTransactions: boolean;
}

interface PaymentMethodsOverviewProps {
  methods: PaymentMethodSummary[];
  getConfig: (method: string) => PaymentMethodConfig | undefined;
  getColors: (method: string) => ColorConfig;
  onSelect: (method: string) => void;
  onEdit: (config: PaymentMethodConfig) => void;
  onRemove: (method: string) => void;
  onPayAll: (method: string) => void;
}

const formatShare = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

const mobileHidden = { display: { xs: "none", sm: "table-cell" } };

type SortKey = "label" | "totalExpense" | "share" | "expenseCount";
const columns: { key: SortKey; title: string; desktopOnly?: boolean }[] = [
  { key: "label", title: "Método" },
  { key: "totalExpense", title: "Total gasto" },
  { key: "share", title: "Participação", desktopOnly: true },
  { key: "expenseCount", title: "Transações", desktopOnly: true },
];

function ShareBar({ value, color }: { value: number; color: string }) {
  return (
    <Stack direction="row" gap={1.5} alignItems="center">
      <Box aria-hidden="true" sx={{
        flex: 1, height: 8, borderRadius: 8, overflow: "hidden",
        bgcolor: (theme) => alpha(theme.palette.text.secondary, 0.14),
      }}>
        <Box sx={{
          width: `${Math.max(0, Math.min(value * 100, 100))}%`, height: "100%",
          bgcolor: color, borderRadius: "inherit",
        }} />
      </Box>
      <Box component="span" sx={{ minWidth: 45, whiteSpace: "nowrap" }}>{formatShare.format(value)}</Box>
    </Stack>
  );
}

export default function PaymentMethodsOverview({
  methods, getConfig, getColors, onSelect, onEdit, onRemove, onPayAll,
}: PaymentMethodsOverviewProps) {
  const { palette } = useTheme();
  const dark = palette.mode === "dark";
  const accent = dark ? orbitColors.lavender : palette.primary.dark;
  const paletteBySpend = getOverviewChartColors(palette);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "totalExpense", direction: "desc",
  });
  const [chooserAnchor, setChooserAnchor] = useState<HTMLElement | null>(null);
  const [actionMenu, setActionMenu] = useState<{ anchor: HTMLElement; name: string } | null>(null);

  const totals = methods.reduce(({ spend, count, pending, toPay, active }, method) => ({
    spend: spend + method.totalExpense,
    count: count + method.expenseCount,
    pending: pending + method.unpaidCount,
    toPay: toPay + method.unpaidAmount,
    active: active + Number(method.hasActivity),
  }), { spend: 0, count: 0, pending: 0, toPay: 0, active: 0 });

  const ranked = methods.map((method) => ({
    ...method,
    label: paymentMethodLabel(method.name),
    share: totals.spend > 0 ? method.totalExpense / totals.spend : 0,
  })).sort((a, b) => b.totalExpense - a.totalExpense || collator.compare(a.label, b.label))
    .map((method, index) => ({
      ...method,
      color: method.totalExpense > 0 ? paletteBySpend[index % paletteBySpend.length] : palette.divider,
    }));

  const rows = [...ranked].sort((a, b) => {
    const key = sort.key;
    const order = key === "label" ? collator.compare(a.label, b.label) : a[key] - b[key];
    return order * (sort.direction === "asc" ? 1 : -1) || collator.compare(a.label, b.label);
  });
  const selected = actionMenu && methods.find((method) => method.name === actionMenu.name);
  const selectedConfig = selected && getConfig(selected.name);
  const menuAction = (action: () => void) => {
    setActionMenu(null);
    action();
  };

  return (
    <>
      <Box sx={overviewStatGridStyles}>
        <OverviewStatCard title="Métodos ativos" value={totals.active} caption={`de ${methods.length} cadastrados`} icon={<CreditCard size={16} />} color={accent} />
        <OverviewStatCard title="Total de despesas" value={formatCurrency(totals.spend)} caption={`${totals.count} ${totals.count === 1 ? "transação" : "transações"}`} icon={<TrendingDown size={16} />} color={dark ? palette.error.main : palette.error.dark} />
        <OverviewStatCard title="Cobranças pendentes" value={totals.pending} caption="despesas em aberto" icon={<TriangleAlert size={16} />} color={dark ? palette.warning.main : palette.warning.dark} valueColor={palette.text.primary} />
        <OverviewStatCard title="Total a pagar" value={formatCurrency(totals.toPay)} caption="no período" icon={<CalendarCheck size={16} />} color={dark ? palette.success.main : palette.success.dark} />
      </Box>

      <OverviewBreakdown
        data={ranked.map(({ name, label, totalExpense, color }) => ({ id: name, label, value: totalExpense, color }))}
        total={totals.spend}
        title="Distribuição dos gastos"
        description="Participação de cada método no total de despesas do mês"
        comparisonTitle="Gastos por método"
        comparisonDescription="Comparativo de despesas no período (R$)"
        emptyMessage="Sem despesas com os métodos cadastrados no período."
        valueLabel="Total gasto"
        renderInsight={(label, share) => <><strong>{label}</strong> representa a maior fatia dos gastos do mês ({share}).</>}
      />

      <Paper component="section" aria-labelledby="payment-table-title" elevation={0} sx={{ ...overviewPanelStyles, overflow: "hidden" }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={1.5} sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Box sx={{ width: 34, height: 34, borderRadius: 2, display: "grid", placeItems: "center", color: accent, bgcolor: alpha(orbitColors.primary, 0.17), flexShrink: 0 }}>
              <Layers size={18} />
            </Box>
            <Box>
              <Typography id="payment-table-title" component="h2" fontSize={17} fontWeight={750}>Métodos de pagamento</Typography>
              <Typography variant="body2" color="text.secondary">Despesas por meio de pagamento no período</Typography>
            </Box>
          </Stack>
          <NixButton
            size="sm" variant="soft" disabled={methods.length === 0}
            style={{ borderRadius: "var(--radius-button-md)" }}
            aria-haspopup="menu" aria-expanded={Boolean(chooserAnchor)}
            onClick={(event) => setChooserAnchor(event.currentTarget)}
          >
            Ver transações por método <ArrowRight size={15} />
          </NixButton>
        </Stack>
        {methods.length ? (
          <Box sx={{ px: { xs: 0, sm: 1.25 }, pb: { xs: 0, sm: 1.25 } }}>
            <Table size="small" aria-labelledby="payment-table-title" sx={{
              tableLayout: "fixed",
              "& .MuiTableCell-root": { borderColor: "divider", py: { xs: 0.75, md: 0.5 }, px: { xs: 1, md: 2 } },
              "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": { bgcolor: alpha(palette.text.primary, dark ? 0.045 : 0.028) },
              "& .MuiTableBody-root .MuiTableRow-root:hover": { bgcolor: "action.hover" },
            }}>
              <colgroup>
                <Box component="col" sx={{ width: { xs: "auto", sm: "30%" } }} />
                <Box component="col" sx={{ width: { xs: "34%", sm: "20%" } }} />
                <Box component="col" sx={{ width: { sm: "34%" }, display: { xs: "none", sm: "table-column" } }} />
                <Box component="col" sx={{ display: { xs: "none", sm: "table-column" } }} />
                <Box component="col" sx={{ width: { xs: 56, sm: 68, md: 82 } }} />
              </colgroup>
              <TableHead>
                <TableRow>
                  {columns.map(({ key, title, desktopOnly }) => (
                    <TableCell key={key} scope="col" sortDirection={sort.key === key ? sort.direction : false} align={key === "expenseCount" ? "center" : "left"} sx={{
                      ...(desktopOnly ? mobileHidden : {}),
                      fontSize: 10, fontWeight: 750, letterSpacing: "0.035em", textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>
                      <TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.direction : "asc"}
                        onClick={() => setSort({
                          key,
                          direction: sort.key === key ? (sort.direction === "desc" ? "asc" : "desc") : key === "label" ? "asc" : "desc",
                        })}
                      >
                        {title}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell scope="col" aria-label="Ações" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((method) => {
                  const config = getConfig(method.name);
                  return (
                    <TableRow key={method.name} hover onClick={() => onSelect(method.name)} sx={{ cursor: "pointer" }}>
                      <TableCell component="th" scope="row">
                        <ButtonBase
                          aria-label={`Ver transações de ${method.label}`}
                          onClick={(event) => { event.stopPropagation(); onSelect(method.name); }}
                          sx={{
                            display: "flex", width: "100%", gap: 1, justifyContent: "flex-start", textAlign: "left",
                            borderRadius: 1, "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
                          }}
                        >
                          <PaymentMethodIcon imageUrl={config?.imageUrl} colors={getColors(method.name)} type={config?.type} size={29} borderRadius="6px" iconSize={16} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography title={method.label} variant="body2" fontWeight={650} noWrap>{method.label}</Typography>
                            <Typography sx={{ display: { xs: "block", sm: "none" }, color: "text.secondary", fontSize: 10.5 }}>
                              {formatShare.format(method.share)} · {method.expenseCount} {method.expenseCount === 1 ? "despesa" : "despesas"}
                            </Typography>
                          </Box>
                        </ButtonBase>
                      </TableCell>
                      <TableCell sx={{ fontVariantNumeric: "tabular-nums", fontSize: { xs: 12, md: 14 }, overflowWrap: "anywhere" }}>{formatCurrency(method.totalExpense)}</TableCell>
                      <TableCell sx={mobileHidden}>
                        <ShareBar value={method.share} color={method.color} />
                      </TableCell>
                      <TableCell align="center" sx={mobileHidden}>{method.expenseCount}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={{ xs: 0, sm: 0.5 }}>
                          <IconButton aria-label={`Ações de ${method.label}`} aria-haspopup="menu" aria-expanded={selected?.name === method.name} size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              setActionMenu({ anchor: event.currentTarget, name: method.name });
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </IconButton>
                          <Box sx={{ display: "flex", color: "text.secondary" }} aria-hidden="true"><ChevronRight size={15} /></Box>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow sx={{ bgcolor: alpha(palette.text.primary, dark ? 0.045 : 0.028), "& .MuiTableCell-root": { fontSize: { xs: 12, md: 14 }, color: "text.primary", fontWeight: 750, borderBottom: 0 } }}>
                  <TableCell component="th" scope="row">Total</TableCell>
                  <TableCell sx={{ overflowWrap: "anywhere" }}><Box component="span" sx={{ color: accent }}>{formatCurrency(totals.spend)}</Box></TableCell>
                  <TableCell sx={mobileHidden}><ShareBar value={totals.spend > 0 ? 1 : 0} color={orbitColors.primary} /></TableCell>
                  <TableCell sx={mobileHidden} align="center">{totals.count}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
            Nenhum método cadastrado. Selecione Novo método para começar.
          </Typography>
        )}
      </Paper>

      <Menu anchorEl={chooserAnchor} open={Boolean(chooserAnchor)} onClose={() => setChooserAnchor(null)} slotProps={{ list: { "aria-label": "Ver transações por método" } }}>
        {ranked.map((method) => (
          <MenuItem key={method.name} onClick={() => { setChooserAnchor(null); onSelect(method.name); }}>
            {method.label}
          </MenuItem>
        ))}
      </Menu>
      <Menu anchorEl={actionMenu?.anchor} open={Boolean(actionMenu)} onClose={() => setActionMenu(null)} slotProps={{ list: { "aria-label": "Ações do método" } }}>
        {selectedConfig && <MenuItem onClick={() => menuAction(() => onEdit(selectedConfig))}>Editar método</MenuItem>}
        {selected && <MenuItem onClick={() => menuAction(() => onRemove(selected.name))}>Excluir método</MenuItem>}
        {selected?.hasUnpaidTransactions && <MenuItem onClick={() => menuAction(() => onPayAll(selected.name))}>Pagar pendências</MenuItem>}
      </Menu>
    </>
  );
}
