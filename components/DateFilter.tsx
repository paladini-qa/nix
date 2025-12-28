import React, { useMemo } from "react";
import { Box, IconButton, useMediaQuery, useTheme, Tooltip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/en";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
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
  // Cria um objeto dayjs com o mês e ano selecionados usando useMemo para garantir estabilidade
  const selectedDate = useMemo(
    () => dayjs().year(year).month(month).date(1),
    [month, year]
  );

  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      const newMonth = newValue.month();
      const newYear = newValue.year();
      // Só atualiza se realmente mudou
      if (newMonth !== month || newYear !== year) {
        onDateChange(newMonth, newYear);
      }
    }
  };

  // Navega para o mês anterior
  const handlePreviousMonth = () => {
    const newDate = selectedDate.subtract(1, "month");
    onDateChange(newDate.month(), newDate.year());
  };

  // Navega para o próximo mês
  const handleNextMonth = () => {
    const newDate = selectedDate.add(1, "month");
    onDateChange(newDate.month(), newDate.year());
  };

  const filterContent = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      <IconButton
        onClick={handlePreviousMonth}
        size="small"
        disabled={disabled}
        sx={{
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
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      <DatePicker
        views={["year", "month"]}
        openTo="month"
        value={selectedDate}
        onChange={handleDateChange}
        disabled={disabled}
        format={isMobile ? "MMM YYYY" : "MMMM YYYY"}
        slotProps={{
          textField: {
            size: "small",
            sx: {
              minWidth: isMobile ? 120 : compact ? 160 : 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: "20px",
              },
              "& .MuiOutlinedInput-input": {
                fontSize: isMobile ? 14 : 16,
                textAlign: "center",
              },
            },
          },
        }}
      />

      <IconButton
        onClick={handleNextMonth}
        size="small"
        disabled={disabled}
        sx={{
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
        <ChevronRightIcon fontSize="small" />
      </IconButton>
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
    </LocalizationProvider>
  );
};

export default DateFilter;




