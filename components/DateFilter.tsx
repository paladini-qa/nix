import React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { MONTHS } from "../constants";

interface DateFilterProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  compact?: boolean;
  showIcon?: boolean;
}

const DateFilter: React.FC<DateFilterProps> = ({
  month,
  year,
  onMonthChange,
  onYearChange,
  compact = false,
  showIcon = false,
}) => {
  // Generate years: 50 years in the past and 50 years in the future
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 50;
  const endYear = currentYear + 50;
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  return (
    <div
      className={`flex items-center bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm ${
        compact ? "p-0.5" : "p-1"
      }`}
    >
      {showIcon && (
        <div className="pl-3 pr-2 text-gray-400 dark:text-slate-500">
          <Calendar size={16} />
        </div>
      )}

      {/* Month Select */}
      <div className="relative">
        <select
          value={month}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          className={`appearance-none bg-transparent font-medium text-gray-700 dark:text-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors pr-7 ${
            compact ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2"
          } [&>option]:dark:bg-slate-800`}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i}>
              {compact ? m.substring(0, 3) : m}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1"></div>

      {/* Year Select */}
      <div className="relative">
        <select
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className={`appearance-none bg-transparent font-medium text-gray-700 dark:text-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors pr-7 ${
            compact ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2"
          } [&>option]:dark:bg-slate-800`}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default DateFilter;
