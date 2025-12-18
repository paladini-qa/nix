import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  alpha,
  Collapse,
  Stack,
  Chip,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  UnfoldMore as UnsortedIcon,
} from "@mui/icons-material";

// Tipos para configuração de colunas
export interface DataTableColumn<T> {
  id: string;
  label: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date;
  align?: "left" | "center" | "right";
  width?: number | string;
  minWidth?: number;
  hideOnMobile?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableFilter {
  id: string;
  label: string;
  component: React.ReactNode;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

interface DataTableProps<T> {
  // Dados
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string;

  // Busca
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  onSearch?: (term: string) => void;
  externalSearchTerm?: string;

  // Filtros
  filters?: React.ReactNode;
  filtersExpanded?: boolean;
  onToggleFilters?: () => void;
  activeFiltersCount?: number;

  // Ordenação
  defaultSort?: SortConfig;
  onSortChange?: (sort: SortConfig) => void;

  // Paginação
  pagination?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;

  // Mobile
  renderMobileCard?: (row: T, index: number) => React.ReactNode;

  // Estilo
  stickyHeader?: boolean;
  maxHeight?: number | string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;

  // Toolbar extra
  toolbarActions?: React.ReactNode;
  title?: string;
  subtitle?: string;

  // Footer
  footerContent?: React.ReactNode;
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = "Search...",
  searchFields,
  onSearch,
  externalSearchTerm,
  filters,
  filtersExpanded = false,
  onToggleFilters,
  activeFiltersCount = 0,
  defaultSort,
  onSortChange,
  pagination = false,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  renderMobileCard,
  stickyHeader = false,
  maxHeight,
  emptyMessage = "No data found",
  emptyIcon,
  loading = false,
  toolbarActions,
  title,
  subtitle,
  footerContent,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  // Estado interno de busca (usado se não for controlado externamente)
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const searchTerm = externalSearchTerm ?? internalSearchTerm;

  // Estado de ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    defaultSort ?? null
  );

  // Estado de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Estado de exibição de filtros (interno se não controlado)
  const [internalFiltersExpanded, setInternalFiltersExpanded] = useState(false);
  const showFilters = onToggleFilters ? filtersExpanded : internalFiltersExpanded;

  // Handler de busca
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (onSearch) {
        onSearch(value);
      } else {
        setInternalSearchTerm(value);
      }
      setPage(0);
    },
    [onSearch]
  );

  // Handler de ordenação
  const handleSort = useCallback(
    (columnId: string) => {
      const newDirection: SortDirection =
        sortConfig?.column === columnId && sortConfig.direction === "asc"
          ? "desc"
          : "asc";

      const newSort: SortConfig = { column: columnId, direction: newDirection };
      setSortConfig(newSort);
      onSortChange?.(newSort);
    },
    [sortConfig, onSortChange]
  );

  // Filtra dados pela busca
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchFields?.length) return data;

    const lowerSearch = searchTerm.toLowerCase();
    return data.filter((row) =>
      searchFields.some((field) => {
        const value = row[field];
        return value && String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, searchTerm, searchFields]);

  // Ordena dados
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const column = columns.find((col) => col.id === sortConfig.column);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      if (column.sortValue) {
        aValue = column.sortValue(a);
        bValue = column.sortValue(b);
      } else if (typeof column.accessor === "function") {
        return 0; // Não pode ordenar por função sem sortValue
      } else {
        aValue = a[column.accessor] as string | number | Date;
        bValue = b[column.accessor] as string | number | Date;
      }

      // Comparação
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Pagina dados
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, pagination, page, rowsPerPage]);

  // Handlers de paginação
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Toggle filtros
  const handleToggleFilters = () => {
    if (onToggleFilters) {
      onToggleFilters();
    } else {
      setInternalFiltersExpanded(!internalFiltersExpanded);
    }
  };

  // Colunas visíveis
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !(isMobile && col.hideOnMobile));
  }, [columns, isMobile]);

  // Render célula
  const renderCell = (row: T, column: DataTableColumn<T>, index: number) => {
    if (column.render) {
      return column.render(row, index);
    }

    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }

    return row[column.accessor] as React.ReactNode;
  };

  // Estilos de header
  const headerCellSx = {
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "text.secondary",
    py: 2,
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.default, 0.5)
      : alpha(theme.palette.grey[50], 0.95),
    borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.08)}`,
    whiteSpace: "nowrap" as const,
  };

  // Estilos de linha
  const getRowSx = (index: number) => ({
    transition: "all 0.15s ease",
    "&:hover": {
      bgcolor: isDarkMode
        ? alpha(theme.palette.primary.main, 0.06)
        : alpha(theme.palette.primary.main, 0.04),
    },
    "& td": {
      borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.04) : alpha("#000000", 0.04)}`,
      py: 2,
    },
  });

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: isDarkMode
          ? alpha(theme.palette.background.paper, 0.7)
          : alpha("#FFFFFF", 0.9),
        backdropFilter: "blur(20px)",
        border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
        boxShadow: isDarkMode
          ? `0 8px 32px -8px ${alpha("#000000", 0.3)}`
          : `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.08)}`,
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
        }}
      >
        {/* Título */}
        {(title || subtitle) && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {title && (
              <Typography variant="subtitle1" fontWeight={600}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        {/* Busca */}
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() =>
                    onSearch ? onSearch("") : setInternalSearchTerm("")
                  }
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            flex: title ? undefined : 1,
            minWidth: 200,
            maxWidth: 320,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.default, 0.4)
                : alpha(theme.palette.grey[100], 0.6),
              "& fieldset": {
                borderColor: "transparent",
              },
              "&:hover fieldset": {
                borderColor: alpha(theme.palette.primary.main, 0.3),
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
        />

        {/* Botão de filtros */}
        {filters && (
          <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
            <Button
              variant={showFilters ? "contained" : "outlined"}
              size="small"
              onClick={handleToggleFilters}
              startIcon={<FilterIcon />}
              sx={{
                minWidth: 100,
                borderRadius: 2,
                ...(activeFiltersCount > 0 && !showFilters && {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                }),
              }}
            >
              Filters
              {activeFiltersCount > 0 && (
                <Chip
                  label={activeFiltersCount}
                  size="small"
                  color="primary"
                  sx={{ ml: 1, height: 20, fontSize: 11 }}
                />
              )}
            </Button>
          </Tooltip>
        )}

        {/* Ações extras */}
        {toolbarActions}
      </Box>

      {/* Área de filtros expandíveis */}
      {filters && (
        <Collapse in={showFilters}>
          <Box
            sx={{
              p: 2,
              bgcolor: isDarkMode
                ? alpha(theme.palette.background.default, 0.3)
                : alpha(theme.palette.grey[50], 0.5),
              borderBottom: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              flexWrap="wrap"
              useFlexGap
            >
              {filters}
            </Stack>
          </Box>
        </Collapse>
      )}

      {/* Tabela ou Cards Mobile */}
      {isMobile && renderMobileCard ? (
        // Vista mobile em cards
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, index) => (
              <React.Fragment key={keyExtractor(row)}>
                {renderMobileCard(row, index)}
              </React.Fragment>
            ))
          ) : (
            <Box sx={{ py: 6, textAlign: "center" }}>
              {emptyIcon && (
                <Box sx={{ mb: 2, color: "text.disabled" }}>{emptyIcon}</Box>
              )}
              <Typography color="text.secondary" fontStyle="italic">
                {emptyMessage}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        // Vista desktop em tabela
        <TableContainer
          sx={{
            maxHeight: maxHeight,
            ...(stickyHeader && {
              "& .MuiTableHead-root": {
                position: "sticky",
                top: 0,
                zIndex: 1,
              },
            }),
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || "left"}
                    sx={{
                      ...headerCellSx,
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={sortConfig?.column === column.id}
                        direction={
                          sortConfig?.column === column.id
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort(column.id)}
                        IconComponent={
                          sortConfig?.column === column.id
                            ? undefined
                            : UnsortedIcon
                        }
                        sx={{
                          "& .MuiTableSortLabel-icon": {
                            opacity: sortConfig?.column === column.id ? 1 : 0.4,
                            color:
                              sortConfig?.column === column.id
                                ? "primary.main"
                                : "text.disabled",
                          },
                          "&:hover": {
                            color: "primary.main",
                            "& .MuiTableSortLabel-icon": {
                              opacity: 1,
                            },
                          },
                        }}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <TableRow key={keyExtractor(row)} sx={getRowSx(index)}>
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || "left"}
                      >
                        {renderCell(row, column, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    sx={{ py: 6, textAlign: "center" }}
                  >
                    {emptyIcon && (
                      <Box sx={{ mb: 2, color: "text.disabled" }}>
                        {emptyIcon}
                      </Box>
                    )}
                    <Typography color="text.secondary" fontStyle="italic">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Footer customizado */}
      {footerContent && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
            bgcolor: isDarkMode
              ? alpha(theme.palette.background.default, 0.3)
              : alpha(theme.palette.grey[50], 0.5),
          }}
        >
          {footerContent}
        </Box>
      )}

      {/* Paginação */}
      {pagination && paginatedData.length > 0 && (
        <TablePagination
          component="div"
          count={sortedData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          sx={{
            borderTop: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.06)}`,
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontSize: 13,
              },
          }}
        />
      )}
    </Paper>
  );
}

export default DataTable;




