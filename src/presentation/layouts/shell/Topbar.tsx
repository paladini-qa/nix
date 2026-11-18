import React from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  LightMode as SunIcon,
  DarkMode as MoonIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useSettings } from "@/presentation/contexts";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import DateFilter from "@/presentation/components/ui/DateFilter";
import { AdvancedFiltersButton } from "@/presentation/panels/AdvancedFilters";
import { AppCurrentView } from "@/shared/types/appView";

interface TopbarProps {
  onOpenSearch: () => void;
  onOpenNewTransaction: () => void;
  currentView?: AppCurrentView;
}

const Topbar: React.FC<TopbarProps> = ({ onOpenSearch, onOpenNewTransaction, currentView }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { setThemePreference } = useSettings();
  const { 
    filters, 
    setFilters,
    showAdvancedFilters,
    setShowAdvancedFilters,
    advancedFilters,
    showTransactionsFilters,
    setShowTransactionsFilters,
    transactionsFiltersCount,
  } = useAppStore();

  const hasDashboardFiltersActive =
    advancedFilters.startDate !== null ||
    advancedFilters.endDate !== null ||
    advancedFilters.type !== "all" ||
    advancedFilters.categories.length > 0 ||
    advancedFilters.paymentMethods.length > 0;

  const dashboardFiltersCount =
    (advancedFilters.startDate || advancedFilters.endDate ? 1 : 0) +
    (advancedFilters.type !== "all" ? 1 : 0) +
    advancedFilters.categories.length +
    advancedFilters.paymentMethods.length;

  const isDashboardView = currentView === "dashboard";
  const isTransactionsView = currentView === "transactions";

  const hasActiveFilters = isDashboardView
    ? hasDashboardFiltersActive
    : isTransactionsView
    ? transactionsFiltersCount > 0
    : false;

  const activeFiltersCount = isDashboardView
    ? dashboardFiltersCount
    : isTransactionsView
    ? transactionsFiltersCount
    : 0;

  const showFilters = isDashboardView
    ? showAdvancedFilters
    : isTransactionsView
    ? showTransactionsFilters
    : false;

  const handleToggleFilters = () => {
    if (isDashboardView) {
      setShowAdvancedFilters(!showAdvancedFilters);
    } else if (isTransactionsView) {
      setShowTransactionsFilters(!showTransactionsFilters);
    }
  };

  const handleThemeToggle = () => {
    const next = isDark ? "light" : "dark";
    setThemePreference(next);
  };

  return (
    <Box
      sx={{
        height: 60,
        px: "28px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        bgcolor: "background.paper",
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Search box */}
      <Box
        onClick={onOpenSearch}
        sx={{
          flex: 1,
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          px: "11px",
          height: 38,
          borderRadius: "10px",
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.03),
          cursor: "text",
          transition: "border-color 0.15s",
          "&:hover": { borderColor: theme.palette.primary.main },
        }}
      >
        <SearchIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13.5, color: "text.disabled", userSelect: "none" }}>
          Search transactions, categories…
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* Date filter */}
      <DateFilter
        month={filters.month}
        year={filters.year}
        onDateChange={(month, year) => setFilters({ month, year })}
        showIcon
      />

      {/* Advanced Filters Button */}
      {(currentView === "dashboard" || currentView === "transactions") && (
        <AdvancedFiltersButton
          hasActiveFilters={hasActiveFilters}
          activeFiltersCount={activeFiltersCount}
          showFilters={showFilters}
          onToggleFilters={handleToggleFilters}
        />
      )}

      {/* Theme toggle */}
      <IconButton
        onClick={handleThemeToggle}
        title={isDark ? "Dark mode — click for light" : "Light mode — click for dark"}
        sx={{
          width: 38,
          height: 38,
          borderRadius: "10px",
          bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.04),
          color: "text.secondary",
          "&:hover": {
            bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#000", 0.07),
            color: "text.primary",
            transform: "none",
          },
        }}
      >
        {isDark ? <MoonIcon sx={{ fontSize: 17 }} /> : <SunIcon sx={{ fontSize: 17 }} />}
      </IconButton>

      {/* New transaction button */}
      <Button
        variant="contained"
        startIcon={<AddIcon sx={{ fontSize: "14px !important" }} />}
        onClick={onOpenNewTransaction}
        sx={{
          borderRadius: "10px",
          px: "14px",
          py: "8px",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "none",
          boxShadow: "0 6px 14px -8px rgba(168,85,247,0.7)",
          "&:hover": {
            boxShadow: "0 8px 20px -6px rgba(168,85,247,0.6)",
          },
        }}
      >
        New
      </Button>
    </Box>
  );
};

export default Topbar;
