import React from "react";
import { FinancialSummary } from "../types";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface SummaryCardsProps {
  summary: FinancialSummary;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
      notation: "compact",
    }).format(value);
  };

  // Sparkline SVG path for decoration
  const Sparkline = () => (
    <svg
      className="absolute bottom-0 left-0 w-full h-16 opacity-20 pointer-events-none"
      viewBox="0 0 300 100"
      preserveAspectRatio="none"
    >
      <path
        d="M0,80 C30,90 60,40 100,60 C140,80 170,20 220,40 C250,50 280,30 300,50 L300,100 L0,100 Z"
        fill="currentColor"
      />
    </svg>
  );

  const isPositiveBalance = summary.balance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {/* Balance Card - Dynamic color based on balance */}
      <div
        className={`relative overflow-hidden p-4 sm:p-6 rounded-2xl shadow-lg border border-transparent group text-white ${
          isPositiveBalance
            ? "bg-gradient-to-br from-emerald-500 to-green-700 dark:shadow-emerald-900/20"
            : "bg-gradient-to-br from-red-600 to-red-900 dark:shadow-red-900/20"
        }`}
      >
        <div className="relative z-10 flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 uppercase tracking-wide ${
                isPositiveBalance ? "text-emerald-100/90" : "text-red-200/90"
              }`}
            >
              Current Balance
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(summary.balance)}
            </h3>
          </div>
          <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm ml-2 flex-shrink-0">
            <Wallet size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="text-white">
          <Sparkline />
        </div>
      </div>

      {/* Income Card - Green */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 p-4 sm:p-6 rounded-2xl shadow-lg dark:shadow-emerald-900/20 border border-transparent group text-white">
        <div className="relative z-10 flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-emerald-100/90 mb-1 sm:mb-2 uppercase tracking-wide">
              Income
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate">
              {formatCurrency(summary.totalIncome)}
            </h3>
          </div>
          <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm ml-2 flex-shrink-0">
            <TrendingUp size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="text-white">
          <Sparkline />
        </div>
      </div>

      {/* Expense Card - Dark Red */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-900 p-4 sm:p-6 rounded-2xl shadow-lg dark:shadow-red-900/20 border border-transparent group text-white">
        <div className="relative z-10 flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-red-200/90 mb-1 sm:mb-2 uppercase tracking-wide">
              Expenses
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate">
              {formatCurrency(summary.totalExpense)}
            </h3>
          </div>
          <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm ml-2 flex-shrink-0">
            <TrendingDown size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="text-white">
          <Sparkline />
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
