import React from "react";
import { Transaction } from "../types";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Repeat,
  CreditCard,
} from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  };

  // Find max value for data bar calculation
  const maxAmount = Math.max(...transactions.map((t) => t.amount), 0.01);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-12 text-center transition-colors duration-200 backdrop-blur-md">
        <p className="text-gray-500 dark:text-slate-400">
          No transactions found for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden transition-all duration-200 backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-transparent border-b border-gray-100 dark:border-white/5">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Description
              </th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Category
              </th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Payment
              </th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-48">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {transactions.map((transaction) => {
              // Calculate width percentage for data bar
              const barWidth = `${(transaction.amount / maxAmount) * 100}%`;
              const barColor =
                transaction.type === "income" ? "bg-emerald-500" : "bg-red-500";

              return (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="p-4 text-sm text-gray-600 dark:text-slate-300 whitespace-nowrap font-medium">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-1.5 rounded-full ${
                          transaction.type === "income"
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpCircle size={14} />
                        ) : (
                          <ArrowDownCircle size={14} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span>{transaction.description}</span>
                        {transaction.isRecurring && (
                          <span className="flex items-center text-[10px] text-indigo-500 font-bold uppercase tracking-wide mt-0.5">
                            <Repeat size={10} className="mr-1" />
                            {transaction.frequency === "monthly"
                              ? "Monthly"
                              : "Yearly"}
                          </span>
                        )}
                        {transaction.installments &&
                          transaction.installments > 1 && (
                            <span className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide mt-0.5">
                              <CreditCard size={10} className="mr-1" />
                              {transaction.currentInstallment || 1}/
                              {transaction.installments}x
                            </span>
                          )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-slate-300">
                    <span className="px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-white/5">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-slate-400">
                    {transaction.paymentMethod}
                  </td>

                  {/* Value Column with Data Bar */}
                  <td className="p-4 text-sm font-bold align-middle">
                    <div className="flex flex-col justify-center h-full">
                      <span
                        className={`${
                          transaction.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        } z-10 relative mb-1`}
                      >
                        {transaction.type === "expense" ? "-" : "+"}{" "}
                        {formatCurrency(transaction.amount)}
                      </span>
                      {/* Data Bar */}
                      <div className="w-full bg-gray-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} opacity-50 dark:opacity-70`}
                          style={{ width: barWidth }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
