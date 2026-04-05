import React, { useMemo, useState } from "react";
import {
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Tooltip,
  SwipeableDrawer,
  Typography,
  Chip,
  alpha,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/en";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";

interface DateFilterProps {
  month: number;
  year: number;
  onDateChange: (month: number, year: number) => void;
  compact?: boolean;
  showIcon?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const DateFilter: React.FC<DateFilterProps> = ({
  month,
  year,
  onDateChange,
  compact = false,
  disabled = false,
  disabledMessage = "Filtros avançados ativos",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const useCompactStyle = isMobile || compact;
  const isDarkMode = theme.palette.mode === "dark";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const selectedDate = useMemo(
    () => dayjs().year(year).month(month).date(1),
    [month, year]
  );

  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      const newMonth = newValue.month();
      const newYear = newValue.year();
      if (newMonth !== month || newYear !== year) {
        onDateChange(newMonth, newYear);
      }
    }
  };

  const handlePreviousMonth = () => {
    const newDate = selectedDate.subtract(1, "month");
    onDateChange(newDate.month(), newDate.year());
  };

  const handleNextMonth = () => {
    const newDate = selectedDate.add(1, "month");
    onDateChange(newDate.month(), newDate.year());
  };

  const handleMonthSelect = (m: number) => {
    onDateChange(m, pickerYear);
    setDrawerOpen(false);
  };

  const handleOpenDrawer = () => {
    if (disabled) return;
    setPickerYear(year);
    setDrawerOpen(true);
  };

  const btnSize = useCompactStyle ? 32 : 40;
  const iconSize = useCompactStyle ? 16 : 22;

  /* ── Botão central customizado no mobile ── */
  const mobileDateButton = (
    <Box
      onClick={handleOpenDrawer}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        height: btnSize,
        px: 1.25,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: "divider",
        cursor: disabled ? "default" : "pointer",
        userSelect: "none",
        transition: "all 0.15s ease",
        minWidth: 100,
        justifyContent: "center",
        "&:active": disabled
          ? undefined
          : { bgcolor: alpha(theme.palette.primary.main, 0.08) },
      }}
    >
      <CalendarIcon sx={{ fontSize: 13, color: "text.secondary", flexShrink: 0 }} />
      <Typography
        fontWeight={700}
        sx={{ fontSize: 12, lineHeight: 1, color: "text.primary", letterSpacing: 0.1 }}
      >
        {MONTH_LABELS[month]}/{year}
      </Typography>
    </Box>
  );

  /* ── DatePicker desktop padrão ── */
  const desktopDatePicker = (
    <DatePicker
      views={["year", "month"]}
      openTo="month"
      value={selectedDate}
      onChange={handleDateChange}
      disabled={disabled}
      format="MMMM YYYY"
      slotProps={{
        textField: {
          size: "small",
          sx: {
            minWidth: 200,
            "& .MuiOutlinedInput-root": { borderRadius: "20px", height: btnSize },
            "& .MuiOutlinedInput-input": { fontSize: 15, textAlign: "center", py: 0, px: 1 },
            "& .MuiInputAdornment-root": { marginLeft: 0 },
            "& .MuiInputAdornment-root .MuiIconButton-root": { padding: "8px" },
            "& .MuiInputAdornment-root .MuiIconButton-root svg": { fontSize: 20 },
          },
        },
      }}
    />
  );

  const filterContent = (
    <Box
      sx={{
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.2s ease-in-out",
        minWidth: 0,
      }}
    >
      {isMobile ? (
        /* ── Mobile: pílula única com setas + data ── */
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "stretch",
            height: 32,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Seta esquerda */}
          <Box
            onClick={disabled ? undefined : handlePreviousMonth}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              flexShrink: 0,
              cursor: disabled ? "default" : "pointer",
              borderRight: "1px solid",
              borderColor: "divider",
              transition: "background 0.15s",
              "&:active": disabled ? undefined : { bgcolor: alpha(theme.palette.primary.main, 0.1) },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </Box>

          {/* Data clicável */}
          <Box
            onClick={handleOpenDrawer}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.25,
              cursor: disabled ? "default" : "pointer",
              transition: "background 0.15s",
              "&:active": disabled ? undefined : { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <CalendarIcon sx={{ fontSize: 12, color: "text.secondary", flexShrink: 0 }} />
            <Typography
              fontWeight={700}
              sx={{ fontSize: 12, lineHeight: 1, color: "text.primary", whiteSpace: "nowrap" }}
            >
              {MONTH_LABELS[month]}/{year}
            </Typography>
          </Box>

          {/* Seta direita */}
          <Box
            onClick={disabled ? undefined : handleNextMonth}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              flexShrink: 0,
              cursor: disabled ? "default" : "pointer",
              borderLeft: "1px solid",
              borderColor: "divider",
              transition: "background 0.15s",
              "&:active": disabled ? undefined : { bgcolor: alpha(theme.palette.primary.main, 0.1) },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </Box>
        </Box>
      ) : (
        /* ── Desktop: botões separados ── */
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            onClick={handlePreviousMonth}
            size="small"
            disabled={disabled}
            sx={{
              width: btnSize,
              height: btnSize,
              minWidth: btnSize,
              flexShrink: 0,
              border: 1,
              borderColor: "divider",
              borderRadius: "20px",
              "&:hover": {
                bgcolor: disabled ? undefined : "primary.main",
                color: disabled ? undefined : "primary.contrastText",
                borderColor: disabled ? undefined : "primary.main",
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: iconSize }} />
          </IconButton>

          {desktopDatePicker}

          <IconButton
            onClick={handleNextMonth}
            size="small"
            disabled={disabled}
            sx={{
              width: btnSize,
              height: btnSize,
              minWidth: btnSize,
              flexShrink: 0,
              border: 1,
              borderColor: "divider",
              borderRadius: "20px",
              "&:hover": {
                bgcolor: disabled ? undefined : "primary.main",
                color: disabled ? undefined : "primary.contrastText",
                borderColor: disabled ? undefined : "primary.main",
              },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: iconSize }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
      {disabled ? (
        <Tooltip title={disabledMessage} arrow>
          <span>{filterContent}</span>
        </Tooltip>
      ) : (
        filterContent
      )}

      {/* ── Bottom sheet de seleção mês/ano (mobile) ── */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            borderRadius: "20px 20px 0 0",
            background: isDarkMode
              ? `linear-gradient(160deg, ${alpha("#1e293b", 0.98)} 0%, ${alpha("#0f172a", 1)} 100%)`
              : "linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)",
            pb: "env(safe-area-inset-bottom, 16px)",
          },
        }}
      >
        {/* Alça */}
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

        {/* Seletor de ano */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setPickerYear((y) => y - 1)}
            sx={{ border: 1, borderColor: "divider", borderRadius: "10px", width: 36, height: 36 }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>

          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: -0.5 }}>
            {pickerYear}
          </Typography>

          <IconButton
            size="small"
            onClick={() => setPickerYear((y) => y + 1)}
            sx={{ border: 1, borderColor: "divider", borderRadius: "10px", width: 36, height: 36 }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider />

        {/* Grid de meses */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            p: 2,
            pb: 3,
          }}
        >
          {MONTH_LABELS.map((label, idx) => {
            const isSelected = idx === month && pickerYear === year;
            const isCurrentMonth =
              idx === dayjs().month() && pickerYear === dayjs().year();

            return (
              <Chip
                key={label}
                label={label}
                onClick={() => handleMonthSelect(idx)}
                variant={isSelected ? "filled" : "outlined"}
                sx={{
                  borderRadius: "12px",
                  height: 44,
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  ...(isSelected && {
                    background: `linear-gradient(135deg, ${alpha("#6366f1", 0.9)} 0%, ${alpha("#8b5cf6", 0.9)} 100%)`,
                    color: "#fff",
                    border: "none",
                    boxShadow: `0 4px 12px ${alpha("#6366f1", 0.35)}`,
                  }),
                  ...(!isSelected &&
                    isCurrentMonth && {
                      borderColor: "primary.main",
                      color: "primary.main",
                      fontWeight: 600,
                    }),
                  "&:active": { transform: "scale(0.95)" },
                }}
              />
            );
          })}
        </Box>
      </SwipeableDrawer>
    </LocalizationProvider>
  );
};

export default DateFilter;
