import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Repeat } from 'lucide-react';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  categories, 
  paymentMethods 
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || !paymentMethod) return;

    onSave({
      description,
      amount: parseFloat(amount),
      type,
      category,
      paymentMethod,
      date,
      isRecurring,
      frequency: isRecurring ? frequency : undefined
    });

    // Reset form
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory('');
    setPaymentMethod('');
    setIsRecurring(false);
    setFrequency('monthly');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-indigo-900/20 w-full max-w-md overflow-hidden border dark:border-white/10">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Nova Transação</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex space-x-3 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                type === 'income' 
                  ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
              onClick={() => { setType('income'); setCategory(''); }}
            >
              Entrada
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                type === 'expense' 
                  ? 'bg-white dark:bg-fuchsia-600 text-red-700 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
              onClick={() => { setType('expense'); setCategory(''); }}
            >
              Saída
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
              placeholder="Ex: Supermercado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Valor (R$)</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
              placeholder="0,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Categoria</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white transition-colors [&>option]:dark:bg-slate-900"
              >
                <option value="">Selecione</option>
                {categories[type].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Pagamento</label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white transition-colors [&>option]:dark:bg-slate-900"
              >
                <option value="">Selecione</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Data</label>
                <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
             </div>
             
             {/* Recurring Toggle */}
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Recorrência</label>
                <div 
                  className={`w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${isRecurring ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' : 'bg-white dark:bg-white/5'}`}
                  onClick={() => setIsRecurring(!isRecurring)}
                >
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                        <Repeat size={16} className={isRecurring ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'} />
                        <span>Recorrente?</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isRecurring ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isRecurring ? 'translate-x-5' : ''}`}></div>
                    </div>
                </div>
             </div>
          </div>

          {/* Conditional Frequency Input */}
          {isRecurring && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Frequência</label>
                <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as 'monthly' | 'yearly')}
                    className="w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white transition-colors [&>option]:dark:bg-slate-900"
                >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                </select>
              </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg dark:shadow-indigo-500/20 mt-2"
          >
            Salvar Transação
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;