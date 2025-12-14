import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { MONTHS } from '../constants';
import { ArrowUpCircle, ArrowDownCircle, Search, Download, Plus, Repeat } from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, onNewTransaction }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Filter logic specific to this view
  const filteredData = useMemo(() => {
    return transactions
      .filter((t) => {
        const [y, m] = t.date.split('-');
        const matchesDate = parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDate && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, selectedYear, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Todas as Transações</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Visualização em planilha detalhada.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          
          <button
            onClick={onNewTransaction}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium whitespace-nowrap mr-2"
          >
            <Plus size={18} />
            <span>Nova Transação</span>
          </button>

          {/* Search */}
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white w-full sm:w-48"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          {/* Filters */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          
          <button className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg border border-gray-200 dark:border-white/10 transition-colors" title="Exportar">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Spreadsheet Style Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 shadow-sm overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-semibold border-b-2 border-gray-300 dark:border-slate-600">
              <tr>
                <th className="p-2 text-left border-r border-gray-300 dark:border-slate-700 w-32">Data</th>
                <th className="p-2 text-left border-r border-gray-300 dark:border-slate-700">Descrição</th>
                <th className="p-2 text-left border-r border-gray-300 dark:border-slate-700 w-40">Categoria</th>
                <th className="p-2 text-left border-r border-gray-300 dark:border-slate-700 w-40">Método</th>
                <th className="p-2 text-center border-r border-gray-300 dark:border-slate-700 w-24">Tipo</th>
                <th className="p-2 text-right w-40">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredData.length > 0 ? (
                filteredData.map((t, index) => (
                  <tr 
                    key={t.id} 
                    className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'} hover:bg-blue-50 dark:hover:bg-indigo-900/20 transition-colors`}
                  >
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-mono">
                      {formatDate(t.date)}
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 font-medium truncate max-w-xs">
                      <div className="flex items-center">
                        {t.description}
                        {t.isRecurring && (
                            <span title={`Recorrente: ${t.frequency === 'monthly' ? 'Mensal' : 'Anual'}`} className="ml-2 text-indigo-500">
                                <Repeat size={14} />
                            </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400">
                      {t.paymentMethod}
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-slate-700 text-center">
                       {t.type === 'income' ? (
                         <span className="flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                           <ArrowUpCircle size={16} />
                         </span>
                       ) : (
                         <span className="flex items-center justify-center text-red-600 dark:text-fuchsia-400">
                            <ArrowDownCircle size={16} />
                         </span>
                       )}
                    </td>
                    <td className={`p-2 text-right font-mono font-medium ${t.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-fuchsia-400'}`}>
                      {t.type === 'expense' && '- '}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 dark:text-slate-400 italic">
                    Nenhuma transação encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredData.length > 0 && (
                <tfoot className="bg-gray-100 dark:bg-slate-800 font-semibold border-t-2 border-gray-300 dark:border-slate-600">
                    <tr>
                        <td colSpan={5} className="p-2 text-right border-r border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300">Total Filtrado:</td>
                        <td className="p-2 text-right text-gray-900 dark:text-white">
                            {formatCurrency(filteredData.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0))}
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

export default TransactionsView;