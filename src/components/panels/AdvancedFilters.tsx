import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  useMediaQuery,
  useTheme,
  alpha,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
  Collapse,
  Stack,
  SelectChangeEvent,
  SwipeableDrawer,
  IconButton,
  Divider,
} from "@mui/material";
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DateRange as DateRangeIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { Transaction, TransactionType } from "../../types";

export interface AdvancedFiltersState {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  type: "all" | TransactionType;
  categories: string[];
  paymentMethods: string[];
}

interface AdvancedFiltersProps {
  transactions: Transaction[];
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

// Componente do botão de filtros exportado separadamente
export const AdvancedFiltersButton: React.FC<{
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
  compact?: boolean;
}> = ({ hasActiveFilters, activeFiltersCount, showFilters, onToggleFilters, compact }) => {
  return (
    <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <Button
        variant={hasActiveFilters ? "contained" : "outlined"}
        startIcon={<FilterListIcon sx={{ fontSize: compact ? 16 : 20 }} />}
        endIcon={!compact && (showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
        onClick={onToggleFilters}
        size={compact ? "small" : "medium"}
        sx={{
          borderRadius: compact ? "10px" : "20px",
          textTransform: "none",
          minWidth: compact ? 32 : undefined,
          width: compact ? 32 : undefined,
          height: compact ? 32 : 40,
          p: compact ? 0 : undefined,
          px: compact ? 0 : 2,
          fontSize: compact ? 13 : undefined,
          "& .MuiButton-startIcon": { mr: compact ? 0 : 1 },
          ...(hasActiveFilters && {
            background: `linear-gradient(135deg, ${alpha("#6366f1", 0.9)} 0%, ${alpha("#8b5cf6", 0.9)} 100%)`,
          }),
        }}
      >
        {compact ? "" : "Filtros"}
        {!compact && hasActiveFilters && (
          <Chip
            size="small"
            label={activeFiltersCount}
            sx={{ ml: 1, height: 20, minWidth: 20, bgcolor: "rgba(255,255,255,0.2)", color: "inherit" }}
          />
        )}
      </Button>
      {/* Badge flutuante no modo compacto */}
      {compact && hasActiveFilters && (
        <Box
          sx={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 16,
            height: 16,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid",
            borderColor: "background.paper",
            pointerEvents: "none",
          }}
        >
          {activeFiltersCount}
        </Box>
      )}
    </Box>
  );
};

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  transactions,
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  // Extrair categorias e métodos de pagamento únicos das transações
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const availablePaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    transactions.forEach((t) => methods.add(t.paymentMethod));
    return Array.from(methods).sort();
  }, [transactions]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.startDate !== null ||
      filters.endDate !== null ||
      filters.type !== "all" ||
      filters.categories.length > 0 ||
      filters.paymentMethods.length > 0
    );
  }, [filters]);

  // Limpar todos os filtros
  const handleClearFilters = () => {
    onFiltersChange({
      startDate: null,
      endDate: null,
      type: "all",
      categories: [],
      paymentMethods: [],
    });
  };

  // Handlers para filtros
  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      categories: typeof value === "string" ? value.split(",") : value,
    });
  };

  const handlePaymentMethodChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      paymentMethods: typeof value === "string" ? value.split(",") : value,
    });
  };

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    return [
      filters.startDate || filters.endDate ? 1 : 0,
      filters.type !== "all" ? 1 : 0,
      filters.categories.length > 0 ? filters.categories.length : 0,
      filters.paymentMethods.length > 0 ? filters.paymentMethods.length : 0,
    ].reduce((a, b) => a + b, 0);
  }, [filters]);

  const filterContent = (
    <>
      <Grid container spacing={2}>
        {/* Período */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isMobile ? (
            <MobileDatePicker
              label="Data inicial"
              value={filters.startDate}
              onChange={(newValue) => onFiltersChange({ ...filters, startDate: newValue })}
              format="DD/MM/YYYY"
              slotProps={{
                textField: { size: "small", fullWidth: true, InputProps: { sx: { borderRadius: "12px" } } },
                dialog: { PaperProps: { sx: { borderRadius: "20px" } } },
              }}
            />
          ) : (
            <DatePicker
              label="Data inicial"
              value={filters.startDate}
              onChange={(newValue) => onFiltersChange({ ...filters, startDate: newValue })}
              slotProps={{
                textField: { size: "small", fullWidth: true, InputProps: { sx: { borderRadius: "20px" } } },
              }}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isMobile ? (
            <MobileDatePicker
              label="Data final"
              value={filters.endDate}
              onChange={(newValue) => onFiltersChange({ ...filters, endDate: newValue })}
              minDate={filters.startDate || undefined}
              format="DD/MM/YYYY"
              slotProps={{
                textField: { size: "small", fullWidth: true, InputProps: { sx: { borderRadius: "12px" } } },
                dialog: { PaperProps: { sx: { borderRadius: "20px" } } },
              }}
            />
          ) : (
            <DatePicker
              label="Data final"
              value={filters.endDate}
              onChange={(newValue) => onFiltersChange({ ...filters, endDate: newValue })}
              minDate={filters.startDate || undefined}
              slotProps={{
                textField: { size: "small", fullWidth: true, InputProps: { sx: { borderRadius: "20px" } } },
              }}
            />
          )}
        </Grid>

        {/* Tipo */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filters.type}
              label="Tipo"
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  type: e.target.value as AdvancedFiltersState["type"],
                })
              }
              sx={{ borderRadius: "20px" }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="income">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
                  Receitas
                </Box>
              </MenuItem>
              <MenuItem value="expense">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />
                  Despesas
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Categorias */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Categorias</InputLabel>
            <Select<string[]>
              multiple
              value={filters.categories}
              onChange={handleCategoryChange}
              input={<OutlinedInput label="Categorias" />}
              renderValue={(selected) =>
                selected.length === 0
                  ? ""
                  : `${selected.length} selecionada${selected.length > 1 ? "s" : ""}`
              }
              sx={{ borderRadius: "20px" }}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
            >
              {availableCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  <Checkbox checked={filters.categories.indexOf(category) > -1} size="small" />
                  <ListItemText primary={category} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Métodos de pagamento */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Pagamento</InputLabel>
            <Select<string[]>
              multiple
              value={filters.paymentMethods}
              onChange={handlePaymentMethodChange}
              input={<OutlinedInput label="Pagamento" />}
              renderValue={(selected) =>
                selected.length === 0
                  ? ""
                  : `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`
              }
              sx={{ borderRadius: "20px" }}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
            >
              {availablePaymentMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  <Checkbox checked={filters.paymentMethods.indexOf(method) > -1} size="small" />
                  <ListItemText primary={method} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Chips de filtros ativos */}
      {hasActiveFilters && (
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}
        >
          {(filters.startDate || filters.endDate) && (
            <Chip
              icon={<DateRangeIcon />}
              label={`${filters.startDate?.format("DD/MM/YY") || "..."} → ${filters.endDate?.format("DD/MM/YY") || "..."}`}
              onDelete={() => onFiltersChange({ ...filters, startDate: null, endDate: null })}
              size="small"
              sx={{ bgcolor: alpha("#6366f1", 0.1), "& .MuiChip-deleteIcon": { color: "primary.main" } }}
            />
          )}
          {filters.type !== "all" && (
            <Chip
              label={filters.type === "income" ? "Receitas" : "Despesas"}
              onDelete={() => onFiltersChange({ ...filters, type: "all" })}
              size="small"
              sx={{
                bgcolor: alpha(filters.type === "income" ? "#10b981" : "#ef4444", 0.1),
                color: filters.type === "income" ? "#10b981" : "#ef4444",
                "& .MuiChip-deleteIcon": { color: filters.type === "income" ? "#10b981" : "#ef4444" },
              }}
            />
          )}
          {filters.categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onDelete={() => onFiltersChange({ ...filters, categories: filters.categories.filter((c) => c !== cat) })}
              size="small"
              sx={{ bgcolor: alpha("#8b5cf6", 0.1) }}
            />
          ))}
          {filters.paymentMethods.map((method) => (
            <Chip
              key={method}
              label={method}
              onDelete={() => onFiltersChange({ ...filters, paymentMethods: filters.paymentMethods.filter((m) => m !== method) })}
              size="small"
              sx={{ bgcolor: alpha("#06b6d4", 0.1) }}
            />
          ))}
        </Stack>
      )}
    </>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      {isMobile ? (
        /* ── Mobile: bottom sheet ── */
        <SwipeableDrawer
          anchor="bottom"
          open={showFilters}
          onClose={onToggleFilters}
          onOpen={() => {}}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              borderRadius: "20px 20px 0 0",
              maxHeight: "88vh",
              overflowY: "auto",
              background: isDarkMode
                ? `linear-gradient(160deg, ${alpha("#1e293b", 0.98)} 0%, ${alpha("#0f172a", 1)} 100%)`
                : `linear-gradient(160deg, #ffffff 0%, ${alpha("#f1f5f9", 0.98)} 100%)`,
            },
          }}
        >
          {/* Alça de arraste */}
          <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}>
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.text.primary, 0.15),
              }}
            />
          </Box>

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              py: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterListIcon fontSize="small" color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                Filtrar dados
              </Typography>
              {activeFiltersCount > 0 && (
                <Chip
                  label={activeFiltersCount}
                  size="small"
                  color="primary"
                  sx={{ height: 20, minWidth: 20, fontSize: 11, "& .MuiChip-label": { px: 0.75 } }}
                />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {hasActiveFilters && (
                <Button
                  size="small"
                  startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                  onClick={handleClearFilters}
                  sx={{ textTransform: "none", fontSize: 12, color: "error.main", minWidth: "auto" }}
                >
                  Limpar
                </Button>
              )}
              <IconButton size="small" onClick={onToggleFilters} sx={{ color: "text.secondary" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          {/* Conteúdo dos filtros */}
          <Box sx={{ p: 2.5, pb: 2 }}>
            {filterContent}
          </Box>

          {/* Footer de ações */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              gap: 1.5,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              bgcolor: "background.paper",
            }}
          >
            <Button
              variant="outlined"
              color="error"
              fullWidth
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ textTransform: "none" }}
            >
              Limpar filtros
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={onToggleFilters}
              sx={{ textTransform: "none" }}
            >
              Aplicar
            </Button>
          </Box>
        </SwipeableDrawer>
      ) : (
        /* ── Desktop: Collapse ── */
        <Collapse in={showFilters}>
          <Paper
            sx={{
              p: 3,
              background: isDarkMode
                ? `linear-gradient(135deg, ${alpha("#1e293b", 0.8)} 0%, ${alpha("#0f172a", 0.9)} 100%)`
                : `linear-gradient(135deg, ${alpha("#f8fafc", 0.9)} 0%, ${alpha("#e2e8f0", 0.5)} 100%)`,
              backdropFilter: "blur(12px)",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterListIcon fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Filtrar dados
                </Typography>
              </Box>
              {hasActiveFilters && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ textTransform: "none" }}
                >
                  Limpar filtros
                </Button>
              )}
            </Box>
            {filterContent}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
              Exibindo dados filtrados
            </Typography>
          </Paper>
        </Collapse>
      )}
    </LocalizationProvider>
  );
};

export default AdvancedFilters;

