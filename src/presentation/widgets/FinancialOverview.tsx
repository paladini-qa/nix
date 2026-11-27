import { useId, type ReactNode } from "react";
import { Box, CircularProgress, IconButton, Paper, Stack, Tooltip as MuiTooltip, Typography, alpha, useMediaQuery, useTheme } from "@mui/material";
import { Info } from "lucide-react";
import { Add, Refresh } from "@mui/icons-material";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import type { Palette } from "@mui/material/styles";
import NixButton from "@/presentation/components/radix/Button";
import { orbitColors } from "@/shared/theme/colors";
import { formatCompactCurrency, formatCurrency } from "@/shared/utils/formatters";

export const overviewPageStyles = {
  display: "flex",
  flexDirection: "column",
  gap: { xs: 2, md: 2.5 },
  minWidth: 0,
  px: { xs: 0, md: 3 },
  pb: { xs: 2, md: 5 },
};

export const overviewStatGridStyles = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
  gap: { xs: 1, md: 2.5 },
};

export function OverviewHeader({ title, description, actionLabel, onAdd, onRefresh, refreshing }: {
  title: string;
  description: string;
  actionLabel: string;
  onAdd: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
      <Box>
        <Typography component="h1" sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 750, letterSpacing: "-0.025em" }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
      <Stack direction="row" alignItems="center" gap={1}>
        <NixButton size="sm" onClick={onAdd} style={{ borderRadius: "var(--radius-button-md)" }}>
          <Add sx={{ fontSize: 17 }} /> {actionLabel}
        </NixButton>
        {onRefresh && (
          <MuiTooltip title="Atualizar">
            <span>
              <IconButton aria-label="Atualizar" aria-busy={refreshing} onClick={onRefresh} disabled={refreshing} sx={{
                width: { xs: 44, md: 34 }, height: { xs: 44, md: 34 },
                border: "1px solid", borderColor: "divider", borderRadius: "var(--radius-button-md)",
              }}>
                {refreshing ? <CircularProgress size={16} /> : <Refresh sx={{ fontSize: 17 }} />}
              </IconButton>
            </span>
          </MuiTooltip>
        )}
      </Stack>
    </Stack>
  );
}

export const getOverviewChartColors = (palette: Palette) => [
  orbitColors.primary, palette.info.dark, palette.info.light, orbitColors.lavender,
  palette.success.dark, palette.warning.dark, palette.error.main,
];

const formatShare = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const formatAxis = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const overviewPanelStyles = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "var(--radius-card)",
  bgcolor: "background.paper",
};

const chartSize = { width: "100%", height: "100%" };

export function OverviewStatCard({ title, value, caption, icon, color, valueColor = color }: {
  title: string;
  value: string | number;
  caption: string;
  icon: ReactNode;
  color: string;
  valueColor?: string;
}) {
  return (
    <Paper elevation={0} sx={{ ...overviewPanelStyles, p: 1.5, position: "relative", minWidth: 0 }}>
      <Box sx={{
        position: "absolute", top: { xs: 10, md: 13 }, right: { xs: 10, md: 13 },
        display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 2,
        color, bgcolor: alpha(color, 0.14),
      }}>
        {icon}
      </Box>
      <Typography sx={{
        fontSize: 10, fontWeight: 750, letterSpacing: "0.045em", textTransform: "uppercase",
        pr: 3.75, minHeight: 25, display: "flex", alignItems: "center",
      }}>
        {title}
      </Typography>
      <Typography sx={{
        fontSize: { xs: 19, sm: 22, md: 25 }, fontWeight: 750, lineHeight: 1.12, color: valueColor,
        fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere",
      }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 12 }}>{caption}</Typography>
    </Paper>
  );
}

export interface OverviewChartEntry {
  id?: string;
  label: string;
  value: number;
  color?: string;
}

export function OverviewBreakdown({
  data, total, title, description, comparisonTitle, comparisonDescription, emptyMessage, valueLabel, renderInsight,
}: {
  data: OverviewChartEntry[];
  total: number;
  title: string;
  description: string;
  comparisonTitle: string;
  comparisonDescription: string;
  emptyMessage: string;
  valueLabel: string;
  renderInsight: (label: string, share: string) => ReactNode;
}) {
  const headingId = useId();
  const { palette, breakpoints } = useTheme();
  const compactChart = useMediaQuery(breakpoints.down("sm"));
  const dark = palette.mode === "dark";
  const accent = dark ? orbitColors.lavender : palette.primary.dark;
  const colors = getOverviewChartColors(palette);
  const chartEntries = data.filter((item) => item.value > 0).sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item, share: total > 0 ? item.value / total : 0,
      color: item.color ?? colors[index % colors.length],
    }));
  const leader = chartEntries[0];

  return (
    <Paper component="section" aria-labelledby={headingId} elevation={0} sx={{ ...overviewPanelStyles, p: { xs: 1.75, md: 2.5 }, borderColor: alpha(orbitColors.primary, 0.46) }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" }, gap: { xs: 2.5, md: 3 } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id={headingId} component="h2" fontSize={17} fontWeight={750}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{description}</Typography>
          {leader ? (
            <Box sx={{
              display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(130px, 0.85fr) minmax(0, 1fr)" },
              alignItems: "center", gap: 1.5, mt: 1,
            }}>
              <Box sx={{ height: { xs: 172, sm: 204, xl: 221 }, position: "relative", minWidth: 0 }}>
                <PieChart responsive style={chartSize} accessibilityLayer={false}>
                  <Pie data={chartEntries} dataKey="value" nameKey="label" innerRadius="70%" outerRadius="97%" stroke="none" isAnimationActive={false}>
                    {chartEntries.map((method) => <Cell key={method.id ?? method.label} fill={method.color} />)}
                  </Pie>
                </PieChart>
                <Box sx={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center", pointerEvents: "none" }}>
                  <Typography sx={{ fontSize: { xs: 16, xl: 21 }, fontWeight: 750, letterSpacing: "-0.03em" }}>{formatCurrency(total)}</Typography>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                </Box>
              </Box>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", maxHeight: { xs: 196, xl: 221 }, overflowY: "auto" }}>
                {chartEntries.map((method) => (
                  <Box component="li" key={method.id ?? method.label} sx={{
                    display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto 46px", gap: 1,
                    alignItems: "center", py: 0.9, fontSize: 13,
                    "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" },
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Box aria-hidden="true" sx={{ width: 11, height: 11, borderRadius: "50%", flexShrink: 0, bgcolor: method.color }} />
                      <Box component="span" title={method.label} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{method.label}</Box>
                    </Box>
                    <Box component="span" sx={{ whiteSpace: "nowrap" }}>{formatCurrency(method.value)}</Box>
                    <Box component="span" sx={{ textAlign: "right", color: "text.secondary", whiteSpace: "nowrap" }}>{formatShare.format(method.share)}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ minHeight: 135, display: "grid", placeItems: "center", textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
            </Box>
          )}
        </Box>

        {leader && (
          <Box sx={{ minWidth: 0, pl: { lg: 3 }, borderLeft: { lg: "1px solid" }, borderColor: { lg: "divider" } }}>
            <Typography component="h2" fontSize={17} fontWeight={750}>{comparisonTitle}</Typography>
            <Typography variant="body2" color="text.secondary">{comparisonDescription}</Typography>
            <Box sx={{ mt: 1, overflowX: "auto" }}>
              <Box sx={{ height: { xs: 196, xl: 221 }, minWidth: 49 + chartEntries.length * (compactChart ? 52 : 96) }}>
                <BarChart responsive style={chartSize} data={chartEntries} margin={{ top: 20, right: 4, bottom: 1, left: 0 }} accessibilityLayer title={comparisonTitle}>
                  <CartesianGrid vertical={false} stroke={palette.divider} strokeDasharray="3 4" />
                  <XAxis
                    dataKey="label" tickLine={false} axisLine={{ stroke: palette.divider }} interval={0}
                    tick={{ fontSize: 11, fill: palette.text.secondary }}
                    tickFormatter={(name: string) => name.length > (compactChart ? 8 : 12) ? `${name.slice(0, compactChart ? 7 : 11)}…` : name}
                  />
                  <YAxis width={49} tickCount={5} tickLine={false} axisLine={{ stroke: palette.divider }}
                    tick={{ fontSize: 11, fill: palette.text.secondary }} tickFormatter={(n: number) => formatAxis.format(n)}
                  />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), valueLabel]} cursor={{ fill: palette.action.hover }} contentStyle={{ background: palette.background.paper, borderColor: palette.divider, color: palette.text.primary }} />
                  <Bar dataKey="value" maxBarSize={104} radius={[5, 5, 0, 0]} isAnimationActive={false}>
                    {chartEntries.map((method) => <Cell key={method.id ?? method.label} fill={method.color} />)}
                    <LabelList position="top" fill={palette.text.primary} fontSize={compactChart ? 9 : 11}
                      formatter={(value) => compactChart ? formatCompactCurrency(Number(value)) : formatCurrency(Number(value))}
                    />
                  </Bar>
                </BarChart>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {leader && (
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.25, mt: 2.5, px: 1.5, py: 1.1,
          border: "1px solid", borderColor: alpha(orbitColors.primary, 0.55),
          borderRadius: "var(--radius-button-sm)", bgcolor: alpha(orbitColors.primary, dark ? 0.18 : 0.08),
        }}>
          <Box sx={{ color: accent, display: "flex", flexShrink: 0 }}><Info size={19} /></Box>
          <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
            {renderInsight(leader.label, formatShare.format(leader.share))}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
