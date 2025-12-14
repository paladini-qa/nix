import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Sparkles,
  Filter,
  Loader2,
  LogOut,
  LayoutDashboard,
  Wallet,
  Settings,
} from "lucide-react";
import {
  Transaction,
  FilterState,
  FinancialSummary,
  TransactionType,
  ThemePreference,
} from "./types";
import {
  MONTHS,
  CATEGORIES as DEFAULT_CATEGORIES,
  PAYMENT_METHODS as DEFAULT_PAYMENT_METHODS,
} from "./constants";
import SummaryCards from "./components/SummaryCards";
import TransactionTable from "./components/TransactionTable";
import TransactionForm from "./components/TransactionForm";
import CategoryBreakdown from "./components/CategoryBreakdown";
import Sidebar from "./components/Sidebar";
import ProfileModal from "./components/ProfileModal";
import TransactionsView from "./components/TransactionsView";
import SettingsView from "./components/SettingsView";
import LoginView from "./components/LoginView";
import ThemeSwitch from "./components/ThemeSwitch";
import DateFilter from "./components/DateFilter";
import PaymentMethodDetailView from "./components/PaymentMethodDetailView";
import { getFinancialInsights } from "./services/geminiService";
import { supabase } from "./services/supabaseClient";
import ReactMarkdown from "react-markdown";
import { Session } from "@supabase/supabase-js";

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // State for Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // State for Categories and Payment Methods
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    DEFAULT_PAYMENT_METHODS
  );

  // State for user profile
  const [displayName, setDisplayName] = useState<string>("");

  // State for Filters
  const [filters, setFilters] = useState<FilterState>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const [currentView, setCurrentView] = useState<
    "dashboard" | "transactions" | "settings"
  >("dashboard");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Theme preference state
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    () => {
      const saved = localStorage.getItem("themePreference") as ThemePreference;
      return saved || "system";
    }
  );

  // Computed dark mode based on preference
  const darkMode = useMemo(() => {
    if (themePreference === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return themePreference === "dark";
  }, [themePreference]);

  // Listen for system theme changes
  useEffect(() => {
    if (themePreference !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Force re-render by toggling a dummy state or just apply directly
      if (mediaQuery.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [themePreference]);

  // Apply dark mode class
  useEffect(() => {
    localStorage.setItem("themePreference", themePreference);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, themePreference]);

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
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

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
          frequency: t.frequency,
          installments: t.installments,
          currentInstallment: t.current_installment,
        }));
        setTransactions(mappedTxs);
      }

      // Fetch Settings
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        // PGRST116 is "no rows found"
        throw settingsError;
      }

      if (settings) {
        setCategories({
          income: settings.categories_income || DEFAULT_CATEGORIES.income,
          expense: settings.categories_expense || DEFAULT_CATEGORIES.expense,
        });
        setPaymentMethods(settings.payment_methods || DEFAULT_PAYMENT_METHODS);
        if (settings.theme_preference) {
          setThemePreference(settings.theme_preference as ThemePreference);
        }
        if (settings.display_name) {
          setDisplayName(settings.display_name);
        }
      } else {
        // Initialize default settings if none exist
        await supabase.from("user_settings").insert({
          user_id: userId,
          categories_income: DEFAULT_CATEGORIES.income,
          categories_expense: DEFAULT_CATEGORIES.expense,
          payment_methods: DEFAULT_PAYMENT_METHODS,
          theme_preference: "system",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingInitial(false);
    }
  };

  const updateSettingsInDb = async (
    newCategories: typeof categories,
    newPaymentMethods: string[]
  ) => {
    if (!session) return;
    try {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: session.user.id,
        categories_income: newCategories.income,
        categories_expense: newCategories.expense,
        payment_methods: newPaymentMethods,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const updateThemePreference = async (newTheme: ThemePreference) => {
    setThemePreference(newTheme);
    if (!session) return;
    try {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: session.user.id,
        theme_preference: newTheme,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error saving theme preference:", err);
    }
  };

  const updateDisplayName = async (newName: string) => {
    setDisplayName(newName);
    if (!session) return;
    try {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: session.user.id,
        display_name: newName.trim() || null,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error saving display name:", err);
    }
  };

  // Derived State: Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const [y, m] = t.date.split("-");
        return (
          parseInt(y) === filters.year && parseInt(m) === filters.month + 1
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  // Derived State: Summary
  const summary = useMemo<FinancialSummary>(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
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

  const handleChangeEmail = async (newEmail: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!session?.user?.email) throw new Error("No email found");

    const { error } = await supabase.auth.resetPasswordForEmail(
      session.user.email,
      {
        redirectTo: window.location.origin,
      }
    );
    if (error) throw error;
  };

  const handleAddTransaction = async (
    newTx: Omit<Transaction, "id" | "createdAt">,
    editId?: string
  ) => {
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
        frequency: newTx.frequency,
        installments: newTx.installments,
        current_installment: newTx.currentInstallment,
      };

      if (editId) {
        // Update existing transaction
        const { data, error } = await supabase
          .from("transactions")
          .update(dbPayload)
          .eq("id", editId)
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
            frequency: data.frequency,
            installments: data.installments,
            currentInstallment: data.current_installment,
          };
          setTransactions((prev) =>
            prev.map((t) => (t.id === editId ? transaction : t))
          );
        }
      } else {
        // Insert new transaction
        const { data, error } = await supabase
          .from("transactions")
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
            frequency: data.frequency,
            installments: data.installments,
            currentInstallment: data.current_installment,
          };
          setTransactions((prev) => [transaction, ...prev]);
        }
      }

      setEditingTransaction(null);
      setInsight(null);
    } catch (err) {
      console.error("Error saving transaction:", err);
      alert("Error saving transaction.");
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id);
        if (error) throw error;
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        setInsight(null);
      } catch (err) {
        console.error("Error deleting transaction:", err);
        alert("Error deleting.");
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
        [type]: [...categories[type], category].sort(),
      };
      setCategories(updatedCats);
      updateSettingsInDb(updatedCats, paymentMethods);
    }
  };

  const handleRemoveCategory = (type: TransactionType, category: string) => {
    if (window.confirm(`Remove category "${category}"?`)) {
      const updatedCats = {
        ...categories,
        [type]: categories[type].filter((c) => c !== category),
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
    if (window.confirm(`Remove payment method "${method}"?`)) {
      const updatedMethods = paymentMethods.filter((m) => m !== method);
      setPaymentMethods(updatedMethods);
      updateSettingsInDb(categories, updatedMethods);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center">
        <Loader2
          className="animate-spin text-indigo-600 dark:text-indigo-400"
          size={48}
        />
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
        themePreference={themePreference}
        onThemeChange={updateThemePreference}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        displayName={displayName}
        userEmail={session.user.email || ""}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 sticky top-0 z-30 px-3 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">
            Nix
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitch
            value={themePreference}
            onChange={updateThemePreference}
            compact
          />
          <button
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-6 xl:p-8 transition-all duration-300">
        <div className="space-y-6 lg:space-y-8">
          {currentView === "dashboard" ? (
            selectedPaymentMethod ? (
              <PaymentMethodDetailView
                paymentMethod={selectedPaymentMethod}
                transactions={transactions}
                selectedMonth={filters.month}
                selectedYear={filters.year}
                onMonthChange={(month) => setFilters({ ...filters, month })}
                onYearChange={(year) => setFilters({ ...filters, year })}
                onBack={() => setSelectedPaymentMethod(null)}
              />
            ) : (
              <>
                {/* Dashboard Header / Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      General Dashboard
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">
                      Welcome, {displayName || session.user.email}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    {/* Filter Controls */}
                    <DateFilter
                      month={filters.month}
                      year={filters.year}
                      onMonthChange={(month) =>
                        setFilters({ ...filters, month })
                      }
                      onYearChange={(year) => setFilters({ ...filters, year })}
                      showIcon
                    />

                    <button
                      onClick={() => {
                        setEditingTransaction(null);
                        setIsFormOpen(true);
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm dark:shadow-indigo-500/30 font-medium whitespace-nowrap"
                    >
                      <Plus size={18} />
                      <span>New Transaction</span>
                    </button>
                  </div>
                </div>

                <SummaryCards summary={summary} />

                {/* Smart Analysis - Full Width */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/40 dark:to-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-white/10 relative overflow-hidden transition-all duration-200 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20">
                    <Sparkles
                      size={100}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <div className="relative z-10">
                    <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-indigo-900 dark:text-white flex items-center gap-2">
                          <Sparkles
                            size={18}
                            className="text-indigo-600 dark:text-indigo-400"
                          />
                          Smart Analysis
                        </h3>
                        <p className="text-sm text-indigo-700 dark:text-slate-400 mt-1">
                          Use AI to analyze your {MONTHS[filters.month]}{" "}
                          spending.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateInsight}
                        disabled={
                          isAnalyzing || filteredTransactions.length === 0
                        }
                        className="px-4 py-2 bg-white dark:bg-white/10 text-indigo-600 dark:text-white border border-indigo-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        {isAnalyzing ? "Analyzing..." : "Generate Insights"}
                      </button>
                    </div>
                    {insight && (
                      <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md rounded-xl p-5 text-indigo-900 dark:text-slate-200 text-sm leading-relaxed border border-indigo-100 dark:border-white/5 shadow-sm prose prose-indigo dark:prose-invert max-w-none">
                        <ReactMarkdown>{insight}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction History - Full Width */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Filter
                      size={18}
                      className="text-gray-500 dark:text-slate-400"
                    />
                    Transaction History
                  </h2>
                  <TransactionTable transactions={filteredTransactions} />
                </div>

                {/* Category & Payment Breakdown */}
                <CategoryBreakdown
                  transactions={filteredTransactions}
                  onPaymentMethodClick={(method) =>
                    setSelectedPaymentMethod(method)
                  }
                />
              </>
            )
          ) : currentView === "transactions" ? (
            <TransactionsView
              transactions={transactions}
              onNewTransaction={() => {
                setEditingTransaction(null);
                setIsFormOpen(true);
              }}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              selectedMonth={filters.month}
              selectedYear={filters.year}
              onMonthChange={(month) => setFilters({ ...filters, month })}
              onYearChange={(year) => setFilters({ ...filters, year })}
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

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-white/10 z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            {
              icon: LayoutDashboard,
              label: "Dashboard",
              id: "dashboard" as const,
            },
            {
              icon: Wallet,
              label: "Transactions",
              id: "transactions" as const,
            },
            { icon: Settings, label: "Settings", id: "settings" as const },
          ].map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-slate-400"
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`text-[10px] mt-1 ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Add padding for mobile bottom nav */}
      <div className="lg:hidden h-16" />

      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleAddTransaction}
        categories={categories}
        paymentMethods={paymentMethods}
        editTransaction={editingTransaction}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        displayName={displayName}
        userEmail={session.user.email || ""}
        onUpdateDisplayName={updateDisplayName}
        onChangeEmail={handleChangeEmail}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
};

export default App;
