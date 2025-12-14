import React from "react";
import { Transaction } from "../types";
import { MONTHS } from "../constants";
import {
  ArrowLeft,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Repeat,
} from "lucide-react";
import DateFilter from "./DateFilter";

interface PaymentMethodDetailViewProps {
  paymentMethod: string;
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onBack: () => void;
}

const PaymentMethodDetailView: React.FC<PaymentMethodDetailViewProps> = ({
  paymentMethod,
  transactions,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onBack,
}) => {
  // Filter transactions by payment method and date
  const filteredTransactions = transactions
    .filter((t) => {
      const [y, m] = t.date.split("-");
      const matchesDate =
        parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
      return t.paymentMethod === paymentMethod && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft
              size={20}
              className="text-gray-600 dark:text-slate-400"
            />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
                <CreditCard
                  size={20}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {paymentMethod}
              </h2>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Transactions for {MONTHS[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        {/* Date Filter */}
        <DateFilter
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
          showIcon
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Balance */}
        <div
          className={`${
            balance >= 0
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-500/20"
              : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-500/20"
          } border rounded-xl p-4`}
        >
          <p
            className={`text-xs font-medium uppercase tracking-wide mb-1 ${
              balance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            Current Balance
          </p>
          <p
            className={`text-xl font-bold ${
              balance >= 0
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {formatCurrency(balance)}
          </p>
        </div>

        {/* Income */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
            Income
          </p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
            Expenses
          </p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Description</th>
                <th className="p-4 text-left font-semibold">Category</th>
                <th className="p-4 text-center font-semibold">Type</th>
                <th className="p-4 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, index) => (
                  <tr
                    key={t.id}
                    className={`${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-gray-50 dark:bg-slate-800/50"
                    } hover:bg-blue-50 dark:hover:bg-indigo-900/20 transition-colors`}
                  >
                    <td className="p-4 text-gray-600 dark:text-slate-400 font-mono text-xs">
                      {formatDate(t.date)}
                    </td>
                    <td className="p-4 text-gray-800 dark:text-slate-200 font-medium">
                      <div className="flex items-center gap-2">
                        {t.description}
                        {t.isRecurring && (
                          <Repeat
                            size={14}
                            className="text-indigo-500"
                            title={`Recurring: ${t.frequency}`}
                          />
                        )}
                      </div>
                      {t.installments && t.installments > 1 && (
                        <span className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide mt-0.5">
                          <CreditCard size={10} className="mr-1" />
                          {t.currentInstallment || 1}/{t.installments}x
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-slate-400">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-600">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {t.type === "income" ? (
                        <span className="flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <ArrowUpCircle size={18} />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center text-red-600 dark:text-red-400">
                          <ArrowDownCircle size={18} />
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-4 text-right font-mono font-semibold ${
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {t.type === "expense" && "- "}
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-gray-500 dark:text-slate-400 italic"
                  >
                    No transactions with {paymentMethod} for this period.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 font-semibold">
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-right text-gray-700 dark:text-slate-300"
                  >
                    Total ({filteredTransactions.length} transactions):
                  </td>
                  <td
                    className={`p-4 text-right font-mono ${
                      balance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(balance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodDetailView;
