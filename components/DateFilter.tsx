import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/en";

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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <DatePicker
          views={["year", "month"]}
          openTo="month"
          value={selectedDate}
          onChange={handleDateChange}
          format="MMMM YYYY"
          slotProps={{
            textField: {
              size: "small",
              sx: {
                minWidth: compact ? 180 : 220,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DateFilter;
