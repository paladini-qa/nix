import React, { useState } from "react";
import {
  Trash2,
  Plus,
  Tag,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { TransactionType } from "../types";

interface SettingsViewProps {
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  onAddCategory: (type: TransactionType, category: string) => void;
  onRemoveCategory: (type: TransactionType, category: string) => void;
  onAddPaymentMethod: (method: string) => void;
  onRemovePaymentMethod: (method: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  categories,
  paymentMethods,
  onAddCategory,
  onRemoveCategory,
  onAddPaymentMethod,
  onRemovePaymentMethod,
}) => {
  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  const handleAddCat = (type: TransactionType) => {
    const val = type === "income" ? newIncomeCat : newExpenseCat;
    const setVal = type === "income" ? setNewIncomeCat : setNewExpenseCat;

    if (val.trim()) {
      onAddCategory(type, val.trim());
      setVal("");
    }
  };

  const handleAddMethod = () => {
    if (newPaymentMethod.trim()) {
      onAddPaymentMethod(newPaymentMethod.trim());
      setNewPaymentMethod("");
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Settings
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">
          Manage your categories and payment methods.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Section: Income Categories */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <ArrowUpCircle className="text-emerald-500" size={24} />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Income Categories
            </h3>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newIncomeCat}
              onChange={(e) => setNewIncomeCat(e.target.value)}
              placeholder="New category..."
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              onKeyDown={(e) => e.key === "Enter" && handleAddCat("income")}
            />
            <button
              onClick={() => handleAddCat("income")}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.income.map((cat) => (
              <div
                key={cat}
                className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium border border-emerald-100 dark:border-emerald-500/20"
              >
                <span>{cat}</span>
                <button
                  onClick={() => onRemoveCategory("income", cat)}
                  className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Expense Categories */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <ArrowDownCircle className="text-fuchsia-500" size={24} />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Expense Categories
            </h3>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newExpenseCat}
              onChange={(e) => setNewExpenseCat(e.target.value)}
              placeholder="New category..."
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 dark:text-white"
              onKeyDown={(e) => e.key === "Enter" && handleAddCat("expense")}
            />
            <button
              onClick={() => handleAddCat("expense")}
              className="p-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.expense.map((cat) => (
              <div
                key={cat}
                className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 rounded-lg text-sm font-medium border border-fuchsia-100 dark:border-fuchsia-500/20"
              >
                <span>{cat}</span>
                <button
                  onClick={() => onRemoveCategory("expense", cat)}
                  className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Payment Methods */}
        <div className="md:col-span-2 xl:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="text-indigo-500" size={24} />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Payment Methods
            </h3>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              placeholder="New method..."
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              onKeyDown={(e) => e.key === "Enter" && handleAddMethod()}
            />
            <button
              onClick={handleAddMethod}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <div
                key={method}
                className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-500/20"
              >
                <Tag size={14} />
                <span>{method}</span>
                <button
                  onClick={() => onRemovePaymentMethod(method)}
                  className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5 ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
