import React, { useMemo } from "react";
import { Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
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
}

const DateFilter: React.FC<DateFilterProps> = ({
  month,
  year,
  onDateChange,
  compact = false,
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <IconButton
          onClick={handlePreviousMonth}
          size="small"
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            "&:hover": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderColor: "primary.main",
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
          format={isMobile ? "MMM YYYY" : "MMMM YYYY"}
          slotProps={{
            textField: {
              size: "small",
              sx: {
                minWidth: isMobile ? 120 : compact ? 160 : 200,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
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
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            "&:hover": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderColor: "primary.main",
            },
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </LocalizationProvider>
  );
};

export default DateFilter;




