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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Balance Card - Royal Blue Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 p-6 rounded-2xl shadow-lg dark:shadow-blue-900/20 border border-transparent group text-white">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-blue-100/90 mb-2 uppercase tracking-wide">
              Current Balance
            </p>
            <h3 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(summary.balance)}
            </h3>
          </div>
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Wallet size={24} className="text-white" />
          </div>
        </div>
        <div className="text-white">
          <Sparkline />
        </div>
      </div>

      {/* Income Card - Emerald Green Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-2xl shadow-lg dark:shadow-emerald-900/20 border border-transparent group text-white">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-emerald-100/90 mb-2 uppercase tracking-wide">
              Income
            </p>
            <h3 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {formatCurrency(summary.totalIncome)}
            </h3>
          </div>
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <TrendingUp size={24} className="text-white" />
          </div>
        </div>
        <div className="text-white">
          <Sparkline />
        </div>
      </div>

      {/* Expense Card - Magenta/Purple Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 to-purple-800 p-6 rounded-2xl shadow-lg dark:shadow-fuchsia-900/20 border border-transparent group text-white">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-fuchsia-100/90 mb-2 uppercase tracking-wide">
              Expenses
            </p>
            <h3 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {formatCurrency(summary.totalExpense)}
            </h3>
          </div>
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <TrendingDown size={24} className="text-white" />
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
