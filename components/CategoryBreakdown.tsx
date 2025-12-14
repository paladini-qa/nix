import React from "react";
import { Transaction } from "../types";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  ChevronRight,
} from "lucide-react";

interface CategoryBreakdownProps {
  transactions: Transaction[];
  onPaymentMethodClick?: (paymentMethod: string) => void;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  onPaymentMethodClick,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Calculate income by category
  const incomeByCategory = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  // Calculate expense by category
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  // Calculate by payment method
  const byPaymentMethod = transactions.reduce((acc, curr) => {
    if (!acc[curr.paymentMethod]) {
      acc[curr.paymentMethod] = { income: 0, expense: 0 };
    }
    if (curr.type === "income") {
      acc[curr.paymentMethod].income += curr.amount;
    } else {
      acc[curr.paymentMethod].expense += curr.amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  // Sort by value descending
  const sortedIncome = Object.entries(incomeByCategory).sort(
    ([, a], [, b]) => b - a
  );
  const sortedExpense = Object.entries(expenseByCategory).sort(
    ([, a], [, b]) => b - a
  );
  const sortedPaymentMethods = Object.entries(byPaymentMethod).sort(
    ([, a], [, b]) => b.expense + b.income - (a.expense + a.income)
  );

  // Calculate totals for percentages
  const totalIncome = sortedIncome.reduce((sum, [, val]) => sum + val, 0);
  const totalExpense = sortedExpense.reduce((sum, [, val]) => sum + val, 0);

  const INCOME_COLORS = [
    "bg-emerald-500",
    "bg-emerald-400",
    "bg-teal-500",
    "bg-green-500",
    "bg-lime-500",
  ];

  const EXPENSE_COLORS = [
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-violet-500",
  ];

  const PAYMENT_COLORS = [
    "bg-indigo-500",
    "bg-blue-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-purple-500",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Income by Category */}
      <div className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-5 transition-all duration-200 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
            <TrendingUp
              size={18}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Income by Category
          </h3>
        </div>

        {sortedIncome.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
            No income for this period
          </p>
        ) : (
          <div className="space-y-3">
            {sortedIncome.map(([category, amount], index) => {
              const percentage =
                totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
              return (
                <div key={category} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          INCOME_COLORS[index % INCOME_COLORS.length]
                        }`}
                      />
                      <span className="text-sm text-gray-700 dark:text-slate-300">
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(amount)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        INCOME_COLORS[index % INCOME_COLORS.length]
                      } opacity-70 transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Total
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expense by Category */}
      <div className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-5 transition-all duration-200 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-500/20">
            <TrendingDown
              size={18}
              className="text-fuchsia-600 dark:text-fuchsia-400"
            />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Expenses by Category
          </h3>
        </div>

        {sortedExpense.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
            No expenses for this period
          </p>
        ) : (
          <div className="space-y-3">
            {sortedExpense.map(([category, amount], index) => {
              const percentage =
                totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
              return (
                <div key={category} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          EXPENSE_COLORS[index % EXPENSE_COLORS.length]
                        }`}
                      />
                      <span className="text-sm text-gray-700 dark:text-slate-300">
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                        {formatCurrency(amount)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        EXPENSE_COLORS[index % EXPENSE_COLORS.length]
                      } opacity-70 transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Total
              </span>
              <span className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* By Payment Method */}
      <div className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-5 transition-all duration-200 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
            <CreditCard
              size={18}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            By Payment Method
          </h3>
        </div>

        {sortedPaymentMethods.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
            No transactions for this period
          </p>
        ) : (
          <div className="space-y-3">
            {sortedPaymentMethods.map(([method, data], index) => {
              const total = data.income + data.expense;
              return (
                <button
                  key={method}
                  onClick={() => onPaymentMethodClick?.(method)}
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          PAYMENT_COLORS[index % PAYMENT_COLORS.length]
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {method}
                      </span>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {data.income > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(data.income)}
                        </span>
                      )}
                      {data.expense > 0 && (
                        <span className="text-fuchsia-600 dark:text-fuchsia-400">
                          -{formatCurrency(data.expense)}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-600 dark:text-slate-300">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
