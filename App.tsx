import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Sparkles, Filter, Moon, Sun, Loader2 } from 'lucide-react';
import { Transaction, FilterState, FinancialSummary, TransactionType } from './types';
import { MONTHS, CATEGORIES as DEFAULT_CATEGORIES, PAYMENT_METHODS as DEFAULT_PAYMENT_METHODS } from './constants';
import SummaryCards from './components/SummaryCards';
import TransactionTable from './components/TransactionTable';
import TransactionForm from './components/TransactionForm';
import Charts from './components/Charts';
import Sidebar from './components/Sidebar';
import TransactionsView from './components/TransactionsView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import { getFinancialInsights } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import ReactMarkdown from 'react-markdown';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // State for Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // State for Categories and Payment Methods
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(DEFAULT_PAYMENT_METHODS);

  // State for Filters
  const [filters, setFilters] = useState<FilterState>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Dark Mode
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth & Data Fetching
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else setLoadingInitial(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else {
        setTransactions([]);
        setCategories(DEFAULT_CATEGORIES);
        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
        setLoadingInitial(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    try {
      // Fetch Transactions
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (txError) throw txError;

      if (txs) {
        // Map Supabase columns to our TS type (snake_case to camelCase mapping needed if columns differ, but we kept them mostly consistent or need simple map)
        const mappedTxs: Transaction[] = txs.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          paymentMethod: t.payment_method,
          date: t.date,
          createdAt: new Date(t.created_at).getTime(),
          isRecurring: t.is_recurring,
          frequency: t.frequency
        }));
        setTransactions(mappedTxs);
      }

      // Fetch Settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        throw settingsError;
      }

      if (settings) {
        setCategories({
          income: settings.categories_income || DEFAULT_CATEGORIES.income,
          expense: settings.categories_expense || DEFAULT_CATEGORIES.expense,
        });
        setPaymentMethods(settings.payment_methods || DEFAULT_PAYMENT_METHODS);
      } else {
        // Initialize default settings if none exist
        await supabase.from('user_settings').insert({
          user_id: userId,
          categories_income: DEFAULT_CATEGORIES.income,
          categories_expense: DEFAULT_CATEGORIES.expense,
          payment_methods: DEFAULT_PAYMENT_METHODS
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingInitial(false);
    }
  };

  const updateSettingsInDb = async (newCategories: typeof categories, newPaymentMethods: string[]) => {
    if (!session) return;
    try {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        categories_income: newCategories.income,
        categories_expense: newCategories.expense,
        payment_methods: newPaymentMethods
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error saving settings:', err);
      // Optional: Revert local state on error
    }
  };

  // Derived State: Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const [y, m] = t.date.split('-'); 
      return parseInt(y) === filters.year && parseInt(m) === filters.month + 1;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  // Derived State: Summary
  const summary = useMemo<FinancialSummary>(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  // Handlers
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!session) return;

    try {
      const dbPayload = {
        user_id: session.user.id,
        description: newTx.description,
        amount: newTx.amount,
        type: newTx.type,
        category: newTx.category,
        payment_method: newTx.paymentMethod,
        date: newTx.date,
        is_recurring: newTx.isRecurring,
        frequency: newTx.frequency
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(dbPayload)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const transaction: Transaction = {
          id: data.id,
          description: data.description,
          amount: data.amount,
          type: data.type,
          category: data.category,
          paymentMethod: data.payment_method,
          date: data.date,
          createdAt: new Date(data.created_at).getTime(),
          isRecurring: data.is_recurring,
          frequency: data.frequency
        };
        setTransactions((prev) => [transaction, ...prev]);
        setInsight(null);
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      alert('Erro ao salvar transação.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        setInsight(null);
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('Erro ao excluir.');
      }
    }
  };

  const handleGenerateInsight = async () => {
    setIsAnalyzing(true);
    setInsight(null);
    const result = await getFinancialInsights(
      filteredTransactions, 
      MONTHS[filters.month], 
      filters.year
    );
    setInsight(result);
    setIsAnalyzing(false);
  };

  // Configuration Handlers
  const handleAddCategory = (type: TransactionType, category: string) => {
    if (!categories[type].includes(category)) {
      const updatedCats = {
        ...categories,
        [type]: [...categories[type], category].sort()
      };
      setCategories(updatedCats);
      updateSettingsInDb(updatedCats, paymentMethods);
    }
  };

  const handleRemoveCategory = (type: TransactionType, category: string) => {
    if (window.confirm(`Remover categoria "${category}"?`)) {
      const updatedCats = {
        ...categories,
        [type]: categories[type].filter(c => c !== category)
      };
      setCategories(updatedCats);
      updateSettingsInDb(updatedCats, paymentMethods);
    }
  };

  const handleAddPaymentMethod = (method: string) => {
    if (!paymentMethods.includes(method)) {
      const updatedMethods = [...paymentMethods, method].sort();
      setPaymentMethods(updatedMethods);
      updateSettingsInDb(categories, updatedMethods);
    }
  };

  const handleRemovePaymentMethod = (method: string) => {
    if (window.confirm(`Remover método "${method}"?`)) {
      const updatedMethods = paymentMethods.filter(m => m !== method);
      setPaymentMethods(updatedMethods);
      updateSettingsInDb(categories, updatedMethods);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={48} />
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-indigo-950 dark:text-slate-200 transition-colors duration-500">
      
      {/* Sidebar - Desktop Only */}
      <Sidebar 
        darkMode={darkMode} 
        toggleTheme={() => setDarkMode(!darkMode)} 
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />

      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <span className="text-white font-bold text-lg">FI</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Finanças</h1>
          </div>
          <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 dark:text-slate-400"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {currentView === 'dashboard' ? (
            <>
              {/* Dashboard Header / Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Geral</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm">Bem-vindo, {session.user.email}</p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                   {/* Filter Controls */}
                   <div className="flex bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-lg p-1 space-x-1 shadow-sm">
                    <select 
                      value={filters.month} 
                      onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
                      className="bg-transparent text-sm font-medium text-gray-700 dark:text-slate-300 px-2 py-1.5 rounded focus:outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 [&>option]:dark:bg-slate-800"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>
                    <div className="w-px bg-gray-200 dark:bg-white/10 my-1"></div>
                    <select 
                      value={filters.year}
                      onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                      className="bg-transparent text-sm font-medium text-gray-700 dark:text-slate-300 px-2 py-1.5 rounded focus:outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 [&>option]:dark:bg-slate-800"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm dark:shadow-indigo-500/30 font-medium whitespace-nowrap"
                  >
                    <Plus size={18} />
                    <span>Nova Transação</span>
                  </button>
                </div>
              </div>
              
              <SummaryCards summary={summary} />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/40 dark:to-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-white/10 relative overflow-hidden transition-all duration-200 backdrop-blur-sm">
                     <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20">
                       <Sparkles size={100} className="text-indigo-600 dark:text-indigo-400" />
                     </div>
                     <div className="relative z-10">
                       <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                         <div>
                           <h3 className="text-lg font-semibold text-indigo-900 dark:text-white flex items-center gap-2">
                             <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                             Análise Inteligente
                           </h3>
                           <p className="text-sm text-indigo-700 dark:text-slate-400 mt-1">
                             Use a IA para analisar seus gastos de {MONTHS[filters.month]}.
                           </p>
                         </div>
                         <button 
                          onClick={handleGenerateInsight}
                          disabled={isAnalyzing || filteredTransactions.length === 0}
                          className="px-4 py-2 bg-white dark:bg-white/10 text-indigo-600 dark:text-white border border-indigo-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                         >
                           {isAnalyzing ? 'Analisando...' : 'Gerar Insights'}
                         </button>
                       </div>
                       {insight && (
                         <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md rounded-xl p-5 text-indigo-900 dark:text-slate-200 text-sm leading-relaxed border border-indigo-100 dark:border-white/5 shadow-sm prose prose-indigo dark:prose-invert max-w-none">
                           <ReactMarkdown>{insight}</ReactMarkdown>
                         </div>
                       )}
                     </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <Filter size={18} className="text-gray-500 dark:text-slate-400" />
                      Histórico de Transações
                    </h2>
                    <TransactionTable transactions={filteredTransactions} onDelete={handleDeleteTransaction} />
                  </div>
                </div>

                <div className="xl:col-span-1">
                  <Charts transactions={filteredTransactions} />
                </div>
              </div>
            </>
          ) : currentView === 'transactions' ? (
            <TransactionsView 
              transactions={transactions} 
              onNewTransaction={() => setIsFormOpen(true)}
            />
          ) : (
            <SettingsView 
              categories={categories}
              paymentMethods={paymentMethods}
              onAddCategory={handleAddCategory}
              onRemoveCategory={handleRemoveCategory}
              onAddPaymentMethod={handleAddPaymentMethod}
              onRemovePaymentMethod={handleRemovePaymentMethod}
            />
          )}

        </div>
      </main>

      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleAddTransaction} 
        categories={categories}
        paymentMethods={paymentMethods}
      />
    </div>
  );
};

export default App;