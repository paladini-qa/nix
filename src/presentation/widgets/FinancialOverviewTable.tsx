import { useId, useState, type ReactNode } from "react";
import {
  Box, ButtonBase, Paper, Stack, Table, TableBody, TableCell, TableHead,
  TablePagination, TableRow, TableSortLabel, Typography, alpha, useTheme,
} from "@mui/material";
import { orbitColors } from "@/shared/theme/colors";
import { overviewPanelStyles } from "./FinancialOverview";

const PAGE_SIZE = 15;
const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

export const overviewDesktopCell = { display: { xs: "none", sm: "table-cell" } };
export const overviewMoneyCell = {
  fontSize: { xs: 12, sm: 14 },
  fontVariantNumeric: "tabular-nums",
  overflowWrap: "anywhere",
};

export interface OverviewTableColumn<Row> {
  title: string;
  desktopOnly?: boolean;
  sortBy?: (row: Row) => string | number;
}

export function OverviewTable<Row>({
  title, description, icon, filters, filterKey, rows, columns, renderRow, emptyMessage,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  filters: ReactNode;
  filterKey: string;
  rows: Row[];
  columns: OverviewTableColumn<Row>[];
  renderRow: (row: Row, index: number) => ReactNode;
  emptyMessage: string;
}) {
  const heading = useId();
  const { palette } = useTheme();
  const [paging, setPaging] = useState({ key: filterKey, page: 0 });
  const [sort, setSort] = useState<{ column: number; direction: "asc" | "desc" } | null>(null);
  const page = paging.key === filterKey ? Math.min(paging.page, Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1)) : 0;
  const sortBy = sort && columns[sort.column].sortBy;
  const sorted = sortBy ? [...rows].sort((a, b) => {
    const left = sortBy(a);
    const right = sortBy(b);
    const result = typeof left === "number" && typeof right === "number" ? left - right : collator.compare(String(left), String(right));
    return sort?.direction === "asc" ? result : -result;
  }) : rows;

  return (
    <Paper component="section" aria-labelledby={heading} elevation={0} sx={{ ...overviewPanelStyles, overflow: "hidden" }}>
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ px: { xs: 1.5, md: 2 }, pt: 1.5 }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: 2, display: "grid", placeItems: "center", flexShrink: 0,
          color: palette.mode === "dark" ? orbitColors.lavender : palette.primary.dark,
          bgcolor: alpha(orbitColors.primary, 0.17),
        }}>
          {icon}
        </Box>
        <Box>
          <Typography id={heading} component="h2" fontSize={17} fontWeight={750}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{description}</Typography>
        </Box>
      </Stack>
      <Box sx={{
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25,
        px: { xs: 1.5, md: 2 }, py: 1.5, "& > *": { maxWidth: "100%" },
      }}>
        {filters}
      </Box>
      {rows.length > 0 ? (
        <>
          <Table
            size="small"
            aria-labelledby={heading}
            sx={{
              tableLayout: "fixed",
              "& .overview-cell": { borderColor: "divider", py: 0.75, px: { xs: 0.75, md: 2 } },
              "& .overview-cell:last-child": { px: { xs: 0, sm: 0.75, md: 2 } },
              "& .overview-row[data-striped=\"true\"]": { bgcolor: alpha(palette.text.primary, palette.mode === "dark" ? 0.045 : 0.028) },
              "& .overview-row:hover": { bgcolor: "action.hover" },
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell
                    key={column.title}
                    className="overview-cell"
                    scope="col"
                    align={index === columns.length - 1 ? "right" : "left"}
                    sortDirection={sort?.column === index ? sort.direction : false}
                    sx={{
                      ...(column.desktopOnly ? overviewDesktopCell : {}),
                      width: index === 0 ? { xs: "48%", sm: "32%" } : index === columns.length - 1 ? { xs: "18%", sm: "15%" } : undefined,
                      fontSize: 10, fontWeight: 750, letterSpacing: "0.035em", textTransform: "uppercase",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {column.sortBy ? (
                      <TableSortLabel
                        sx={{ "& .MuiTableSortLabel-icon": { fontSize: { xs: 13, sm: 18 } } }}
                        active={sort?.column === index}
                        direction={sort?.column === index ? sort.direction : "asc"}
                        onClick={() => {
                          setSort({
                            column: index,
                            direction: sort?.column === index && sort.direction === "asc" ? "desc" : "asc",
                          });
                          setPaging({ key: filterKey, page: 0 });
                        }}
                      >
                        {column.title}
                      </TableSortLabel>
                    ) : column.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>{sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(renderRow)}</TableBody>
          </Table>
          {rows.length > PAGE_SIZE && (
            <TablePagination
              component="div"
              count={rows.length}
              page={page}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[]}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
              getItemAriaLabel={(type) => type === "previous" ? "Página anterior" : "Próxima página"}
              onPageChange={(_, nextPage) => setPaging({ key: filterKey, page: nextPage })}
            />
          )}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>{emptyMessage}</Typography>
      )}
    </Paper>
  );
}

export function OverviewRowTitle({ icon, title, subtitle, mobileDetail, onClick, expanded }: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  mobileDetail?: string;
  onClick: () => void;
  expanded?: boolean;
}) {
  return (
    <ButtonBase onClick={(event) => { event.stopPropagation(); onClick(); }} aria-expanded={expanded} sx={{
      display: "flex", gap: { xs: 0.65, sm: 1 }, width: "100%", minHeight: { xs: 44, sm: 30 },
      justifyContent: "flex-start", textAlign: "left", borderRadius: 1,
      "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
    }}>
      {icon}
      <Box sx={{ minWidth: 0 }}>
        <Typography title={title} variant="body2" fontWeight={650} sx={{
          fontSize: { xs: 13, sm: 14 }, lineHeight: 1.25,
          display: { xs: "-webkit-box", sm: "block" }, WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: { sm: "nowrap" }, overflowWrap: "anywhere",
        }}>{title}</Typography>
        <Typography title={subtitle} sx={{
          fontSize: 11, color: "text.secondary", lineHeight: 1.25, mt: 0.25,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: { sm: "nowrap" },
        }}>
          {subtitle}
          {mobileDetail && <Box component="span" sx={{ display: { sm: "none" } }}> · {mobileDetail}</Box>}
        </Typography>
      </Box>
    </ButtonBase>
  );
}
