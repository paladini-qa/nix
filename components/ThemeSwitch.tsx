import React from "react";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";
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
  const options: { id: ThemePreference; icon: typeof Sun; label: string }[] = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "system", icon: Monitor, label: "System" },
    { id: "dark", icon: Moon, label: "Dark" },
  ];

  const currentOption = options.find((opt) => opt.id === value) || options[1];
  const CurrentIcon = currentOption.icon;

  return (
    <div className={compact ? "" : "w-full px-4"}>
      {!compact && (
        <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Theme
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ThemePreference)}
          className={`
            appearance-none w-full cursor-pointer
            ${compact ? "pl-8 pr-7 py-2 text-sm" : "pl-10 pr-10 py-2.5 text-sm"}
            bg-gray-100 dark:bg-slate-800/50 
            border border-gray-200 dark:border-white/10
            rounded-xl
            text-gray-700 dark:text-slate-300
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            transition-colors
          `}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Left Icon */}
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-slate-400`}
        >
          <CurrentIcon size={compact ? 14 : 16} />
        </div>

        {/* Right Chevron */}
        <div
          className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500`}
        >
          <ChevronDown size={compact ? 14 : 16} />
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitch;
