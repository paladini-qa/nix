import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import {
  LightMode as SunIcon,
  DarkMode as MoonIcon,
  SettingsBrightness as MonitorIcon,
} from "@mui/icons-material";
import { ThemePreference } from "../types";

interface ThemeSwitchProps {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
  compact?: boolean;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const options: {
    id: ThemePreference;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { id: "light", icon: <SunIcon fontSize="small" />, label: "Light" },
    { id: "system", icon: <MonitorIcon fontSize="small" />, label: "System" },
    { id: "dark", icon: <MoonIcon fontSize="small" />, label: "Dark" },
  ];

  const currentOption = options.find((opt) => opt.id === value) || options[1];

  const handleChange = (event: SelectChangeEvent<ThemePreference>) => {
    onChange(event.target.value as ThemePreference);
  };

  if (compact) {
    return (
      <Select
        value={value}
        onChange={handleChange}
        size="small"
        sx={{
          minWidth: 100,
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            gap: 1,
            py: 1,
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.id}
            value={option.id}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            {option.icon}
            {option.label}
          </MenuItem>
        ))}
      </Select>
    );
  }

  return (
    <FormControl fullWidth size="small">
      <InputLabel id="theme-select-label">Theme</InputLabel>
      <Select
        labelId="theme-select-label"
        value={value}
        label="Theme"
        onChange={handleChange}
        startAdornment={
          <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
            {currentOption.icon}
          </Box>
        }
        renderValue={() => `${currentOption.label} Theme`}
      >
        {options.map((option) => (
          <MenuItem
            key={option.id}
            value={option.id}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            {option.icon}
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ThemeSwitch;
