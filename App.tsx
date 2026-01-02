import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  lazy,
  Suspense,
} from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
  Fab,
  Button,
  useTheme,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
import { lightTheme, darkTheme } from "./theme";
import {
  Transaction,
  FilterState,
  FinancialSummary,
  TransactionType,
  ThemePreference,
  ColorConfig,
  CategoryColors,
  PaymentMethodColors,
  ParsedTransaction,
} from "./types";
import {
  CATEGORIES as DEFAULT_CATEGORIES,
  PAYMENT_METHODS as DEFAULT_PAYMENT_METHODS,
} from "./constants";
// Core components (loaded immediately)
import SummaryCards from "./components/SummaryCards";
import TransactionTable from "./components/TransactionTable";
import TransactionForm from "./components/TransactionForm";
import CategoryBreakdown from "./components/CategoryBreakdown";
import Sidebar from "./components/Sidebar";
import ProfileModal from "./components/ProfileModal";
import LoginView from "./components/LoginView";
import DateFilter from "./components/DateFilter";
import { MobileHeader, MobileDrawer } from "./components/layout";
import EditOptionsDialog, { EditOption } from "./components/EditOptionsDialog";
import DeleteOptionsDialog, { DeleteOption } from "./components/DeleteOptionsDialog";
import RecurringEditForm from "./components/RecurringEditForm";

// Lazy loaded components (loaded on demand)
const TransactionsView = lazy(() => import("./components/TransactionsView"));
const PaymentMethodDetailView = lazy(
  () => import("./components/PaymentMethodDetailView")
);
const NixAIView = lazy(() => import("./components/NixAIView"));
const RecurringView = lazy(() => import("./components/RecurringView"));
const SplitsView = lazy(() => import("./components/SplitsView"));
const SharedView = lazy(() => import("./components/SharedView"));
const BudgetsView = lazy(() => import("./components/BudgetsView"));
const GoalsView = lazy(() => import("./components/GoalsView"));
import AnalyticsView from "./components/AnalyticsView";
const GlobalSearch = lazy(() => import("./components/GlobalSearch"));
const PaymentMethodsView = lazy(() => import("./components/PaymentMethodsView"));
const CategoriesView = lazy(() => import("./components/CategoriesView"));
const AdvancedFilters = lazy(() => import("./components/AdvancedFilters"));
const PluggyConnectionsView = lazy(() => import("./components/PluggyConnectionsView"));

import type { AdvancedFiltersState } from "./components/AdvancedFilters";
import { AdvancedFiltersButton } from "./components/AdvancedFilters";
import { getInitialMonthYear } from "./hooks/useFilters";

// Loading fallback component
const ViewLoading: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      py: 8,
    }}
  >
    <CircularProgress color="primary" />
  </Box>
);
import { supabase } from "./services/supabaseClient";
import {
  NotificationProvider,
  ConfirmDialogProvider,
  useNotification,
  useConfirmDialog,
} from "./contexts";
import { Session } from "@supabase/supabase-js";

// Context para o tema
export const ThemeContext = createContext<{
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
}>({
  themePreference: "system",
  setThemePreference: () => {},
});

// Cores padrão
const DEFAULT_INCOME_COLORS: ColorConfig = {
  primary: "#10b981",
  secondary: "#059669",
};
const DEFAULT_EXPENSE_COLORS: ColorConfig = {
  primary: "#ef4444",
  secondary: "#dc2626",
};
const DEFAULT_PAYMENT_COLORS: ColorConfig = {
  primary: "#6366f1",
  secondary: "#4f46e5",
};

// Context para cores
export const ColorsContext = createContext<{
  categoryColors: CategoryColors;
  paymentMethodColors: PaymentMethodColors;
  getCategoryColor: (type: TransactionType, category: string) => ColorConfig;
  getPaymentMethodColor: (method: string) => ColorConfig;
}>({
  categoryColors: { income: {}, expense: {} },
  paymentMethodColors: {},
  getCategoryColor: () => DEFAULT_INCOME_COLORS,
  getPaymentMethodColor: () => DEFAULT_PAYMENT_COLORS,
});

// Componente interno que usa os hooks de contexto
const AppContent: React.FC<{
  session: Session;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  categories: { income: string[]; expense: string[] };
  setCategories: React.Dispatch<
    React.SetStateAction<{ income: string[]; expense: string[] }>
  >;
  paymentMethods: string[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<string[]>>;
  friends: string[];
  setFriends: React.Dispatch<React.SetStateAction<string[]>>;
  displayName: string;
  setDisplayName: React.Dispatch<React.SetStateAction<string>>;
  themePreference: ThemePreference;
  updateThemePreference: (theme: ThemePreference) => void;
  categoryColors: CategoryColors;
  setCategoryColors: React.Dispatch<React.SetStateAction<CategoryColors>>;
  paymentMethodColors: PaymentMethodColors;
  setPaymentMethodColors: React.Dispatch<
    React.SetStateAction<PaymentMethodColors>
  >;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateSettingsInDb: (
    cats: { income: string[]; expense: string[] },
    methods: string[]
  ) => Promise<void>;
  onRefreshData: () => Promise<void>;
}> = ({
  session,
  transactions,
  setTransactions,
  categories,
  setCategories,
  paymentMethods,
  setPaymentMethods,
  friends,
  setFriends,
  displayName,
  setDisplayName,
  themePreference,
  updateThemePreference,
  categoryColors,
  setCategoryColors,
  paymentMethodColors,
  setPaymentMethodColors,
  filters,
  setFilters,
  updateSettingsInDb,
  onRefreshData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const { showError } = useNotification();
  const { confirm, choice } = useConfirmDialog();

  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "transactions"
    | "splits"
    | "shared"
    | "recurring"
    | "nixai"
    | "budgets"
    | "goals"
    | "paymentMethods"
    | "categories"
    | "pluggyConnections"
  >("dashboard");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Global search shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [selectedCategoryNav, setSelectedCategoryNav] = useState<{
    name: string;
    type: "income" | "expense";
  } | null>(null);

  // Reset selectedPaymentMethod quando sair da view paymentMethods
  useEffect(() => {
    if (currentView !== "paymentMethods") {
      setSelectedPaymentMethod(null);
    }
  }, [currentView]);

  // Reset selectedCategoryNav quando sair da view categories
  useEffect(() => {
    if (currentView !== "categories") {
      setSelectedCategoryNav(null);
    }
  }, [currentView]);

  const [editOptionsDialogOpen, setEditOptionsDialogOpen] = useState(false);
  const [pendingEditTransaction, setPendingEditTransaction] =
    useState<Transaction | null>(null);
  const [currentEditMode, setCurrentEditMode] = useState<EditOption | null>(
    null
  );
  // Estado para rastrear edição de transação virtual como "single"
  // Armazena o ID da transação original e a data que deve ser adicionada ao excluded_dates
  const [pendingVirtualEdit, setPendingVirtualEdit] = useState<{
    originalId: string;
    excludeDate: string;
  } | null>(null);

  // Estados para o formulário de edição de recorrência
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [recurringEditTransaction, setRecurringEditTransaction] = useState<Transaction | null>(null);
  const [recurringEditMode, setRecurringEditMode] = useState<EditOption | null>(null);
  const [recurringVirtualDate, setRecurringVirtualDate] = useState<string | undefined>(undefined);

  // Estados para filtros avançados do Dashboard
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    startDate: null,
    endDate: null,
    type: "all",
    categories: [],
    paymentMethods: [],
  });

  // Estados para o dialog de delete
  const [deleteOptionsDialogOpen, setDeleteOptionsDialogOpen] = useState(false);
  const [pendingDeleteTransaction, setPendingDeleteTransaction] =
    useState<Transaction | null>(null);

  // Helper: Gera transações recorrentes virtuais para o mês/ano selecionado
  // Apenas para transações recorrentes SEM parcelas (parceladas já existem no banco)
  const generateRecurringTransactions = useMemo(() => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = filters.month + 1;
    const targetYear = filters.year;

    transactions.forEach((t) => {
      // Ignora se não é recorrente, não tem frequência, ou é parcelada
      if (!t.isRecurring || !t.frequency) return;
      if (t.installments && t.installments > 1) return; // Parceladas não geram virtuais

      const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
      const origDate = new Date(origYear, origMonth - 1, origDay);
      const targetDate = new Date(targetYear, targetMonth - 1, 1);

      if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

      const isOriginalMonth =
        origYear === targetYear && origMonth === targetMonth;
      if (isOriginalMonth) return;

      let shouldAppear = false;

      if (t.frequency === "monthly") {
        shouldAppear = true;
      } else if (t.frequency === "yearly") {
        shouldAppear = origMonth === targetMonth && targetYear > origYear;
      }

      if (shouldAppear) {
        const daysInTargetMonth = new Date(
          targetYear,
          targetMonth,
          0
        ).getDate();
        const adjustedDay = Math.min(origDay, daysInTargetMonth);
        const virtualDate = `${targetYear}-${String(targetMonth).padStart(
          2,
          "0"
        )}-${String(adjustedDay).padStart(2, "0")}`;

        // Verifica se esta data está no excluded_dates da transação original
        // Isso inclui datas materializadas e datas de ocorrências editadas como "single"
        const excludedDates = t.excludedDates || [];
        if (excludedDates.includes(virtualDate)) {
          return; // Não gera a transação virtual para esta data
        }

        virtualTransactions.push({
          ...t,
          id: `${t.id}_recurring_${targetYear}-${String(targetMonth).padStart(
            2,
            "0"
          )}`,
          date: virtualDate,
          isVirtual: true,
          originalTransactionId: t.id,
          isPaid: false, // Transações virtuais sempre começam como não pagas
        });
      }
    });

    return virtualTransactions;
  }, [transactions, filters]);

  // Filtered Transactions (by month/year)
  const filteredTransactions = useMemo(() => {
    const currentMonthTransactions = transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      return parseInt(y) === filters.year && parseInt(m) === filters.month + 1;
    });

    const allTransactions = [
      ...currentMonthTransactions,
      ...generateRecurringTransactions,
    ];

    return allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filters, generateRecurringTransactions]);

  // Helper: Gera transações recorrentes para um intervalo de meses
  const generateRecurringForDateRange = (
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ): Transaction[] => {
    const virtualTransactions: Transaction[] = [];
    
    // Itera por todos os meses no intervalo
    let currentYear = startYear;
    let currentMonth = startMonth;
    
    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      transactions.forEach((t) => {
        if (!t.isRecurring || !t.frequency) return;
        if (t.installments && t.installments > 1) return;

        const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
        
        // Não gera antes da data original
        if (
          currentYear < origYear ||
          (currentYear === origYear && currentMonth < origMonth)
        ) return;

        // Não gera no mês original (já existe no banco)
        const isOriginalMonth = origYear === currentYear && origMonth === currentMonth;
        if (isOriginalMonth) return;

        let shouldAppear = false;

        if (t.frequency === "monthly") {
          shouldAppear = true;
        } else if (t.frequency === "yearly") {
          shouldAppear = origMonth === currentMonth && currentYear > origYear;
        }

        if (shouldAppear) {
          const daysInTargetMonth = new Date(currentYear, currentMonth, 0).getDate();
          const adjustedDay = Math.min(origDay, daysInTargetMonth);
          const virtualDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

          // Verifica se já foi adicionada ao array virtual
          const alreadyAdded = virtualTransactions.some(
            (vt) => vt.id === `${t.id}_recurring_${currentYear}-${String(currentMonth).padStart(2, "0")}`
          );

          // Verifica se esta data está no excluded_dates da transação original
          // (inclui datas materializadas e datas de ocorrências editadas como "single")
          const excludedDates = t.excludedDates || [];
          const isExcluded = excludedDates.includes(virtualDate);

          if (!alreadyAdded && !isExcluded) {
            virtualTransactions.push({
              ...t,
              id: `${t.id}_recurring_${currentYear}-${String(currentMonth).padStart(2, "0")}`,
              date: virtualDate,
              isVirtual: true,
              originalTransactionId: t.id,
              isPaid: false,
            });
          }
        }
      });

      // Avança para o próximo mês
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return virtualTransactions;
  };

  // Apply advanced filters (for dashboard)
  const dashboardFilteredTransactions = useMemo(() => {
    // Se não há filtros avançados ativos, usa as transações do mês
    const hasAdvancedFilters =
      advancedFilters.startDate !== null ||
      advancedFilters.endDate !== null ||
      advancedFilters.type !== "all" ||
      advancedFilters.categories.length > 0 ||
      advancedFilters.paymentMethods.length > 0;

    if (!hasAdvancedFilters) {
      return filteredTransactions;
    }

    // Gera transações recorrentes para o intervalo de datas (se especificado)
    let recurringForRange: Transaction[] = [];
    if (advancedFilters.startDate || advancedFilters.endDate) {
      const now = new Date();
      const startYear = advancedFilters.startDate?.year() ?? now.getFullYear() - 1;
      const startMonth = advancedFilters.startDate ? advancedFilters.startDate.month() + 1 : 1;
      const endYear = advancedFilters.endDate?.year() ?? now.getFullYear() + 1;
      const endMonth = advancedFilters.endDate ? advancedFilters.endDate.month() + 1 : 12;
      
      recurringForRange = generateRecurringForDateRange(startYear, startMonth, endYear, endMonth);
    }

    // Quando há filtros avançados ativos, usa todas as transações + recorrentes do período
    const baseTransactions = [...transactions, ...recurringForRange];

    return baseTransactions.filter((tx) => {
      // Filtro por data - normaliza para comparar apenas as datas (sem timezone)
      if (advancedFilters.startDate) {
        const [txYear, txMonth, txDay] = tx.date.split("-").map(Number);
        const startYear = advancedFilters.startDate.year();
        const startMonth = advancedFilters.startDate.month() + 1;
        const startDay = advancedFilters.startDate.date();
        
        const txDateNum = txYear * 10000 + txMonth * 100 + txDay;
        const startDateNum = startYear * 10000 + startMonth * 100 + startDay;
        
        if (txDateNum < startDateNum) return false;
      }
      if (advancedFilters.endDate) {
        const [txYear, txMonth, txDay] = tx.date.split("-").map(Number);
        const endYear = advancedFilters.endDate.year();
        const endMonth = advancedFilters.endDate.month() + 1;
        const endDay = advancedFilters.endDate.date();
        
        const txDateNum = txYear * 10000 + txMonth * 100 + txDay;
        const endDateNum = endYear * 10000 + endMonth * 100 + endDay;
        
        if (txDateNum > endDateNum) return false;
      }

      // Filtro por tipo
      if (advancedFilters.type !== "all" && tx.type !== advancedFilters.type) {
        return false;
      }

      // Filtro por categoria
      if (
        advancedFilters.categories.length > 0 &&
        !advancedFilters.categories.includes(tx.category)
      ) {
        return false;
      }

      // Filtro por método de pagamento
      if (
        advancedFilters.paymentMethods.length > 0 &&
        !advancedFilters.paymentMethods.includes(tx.paymentMethod)
      ) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions, transactions, advancedFilters]);

  // Transações para os gráficos do Analytics (inclui recorrentes)
  // Com filtro avançado: gera recorrentes para o período do filtro
  // Sem filtro avançado: gera recorrentes desde a primeira transação até 3 meses no futuro
  const analyticsTransactions = useMemo(() => {
    const hasAdvancedDates = advancedFilters.startDate !== null || advancedFilters.endDate !== null;
    const hasOtherFilters = advancedFilters.type !== "all" ||
      advancedFilters.categories.length > 0 ||
      advancedFilters.paymentMethods.length > 0;
    
    // Calcula o mês de referência atual (até dia 10 = mês corrente, após = próximo)
    const now = new Date();
    const day = now.getDate();
    let refMonth = now.getMonth();
    let refYear = now.getFullYear();
    
    if (day > 10) {
      refMonth = refMonth === 11 ? 0 : refMonth + 1;
      refYear = refMonth === 0 ? refYear + 1 : refYear;
    }
    
    let startYear: number;
    let startMonth: number;
    let endYear: number;
    let endMonth: number;
    
    if (hasAdvancedDates) {
      // Com filtro avançado com datas: usa as datas do filtro
      startYear = advancedFilters.startDate?.year() ?? refYear - 1;
      startMonth = advancedFilters.startDate ? advancedFilters.startDate.month() + 1 : 1;
      endYear = advancedFilters.endDate?.year() ?? refYear + 1;
      endMonth = advancedFilters.endDate ? advancedFilters.endDate.month() + 1 : 12;
    } else {
      // Sem filtro de datas: encontra a primeira transação recorrente
      startYear = refYear;
      startMonth = refMonth + 1;
      
      transactions.forEach((t) => {
        if (t.isRecurring && t.frequency) {
          const [year, month] = t.date.split("-").map(Number);
          if (year < startYear || (year === startYear && month < startMonth)) {
            startYear = year;
            startMonth = month;
          }
        }
      });
      
      // Fim do período (3 meses depois do mês atual)
      endMonth = refMonth + 4; // +3 meses + 1 para formato 1-12
      endYear = refYear;
      while (endMonth > 12) {
        endMonth -= 12;
        endYear += 1;
      }
    }
    
    // Gera transações recorrentes para o período
    const recurringForAnalytics = generateRecurringForDateRange(
      startYear, 
      startMonth,
      endYear, 
      endMonth
    );
    
    // Combina transações originais com as recorrentes geradas
    let allTransactions = [...transactions, ...recurringForAnalytics];
    
    // Aplica filtros se necessário
    if (hasAdvancedDates || hasOtherFilters) {
      allTransactions = allTransactions.filter((tx) => {
        // Filtro por data
        if (advancedFilters.startDate) {
          const [txYear, txMonth, txDay] = tx.date.split("-").map(Number);
          const startYear = advancedFilters.startDate.year();
          const startMonth = advancedFilters.startDate.month() + 1;
          const startDay = advancedFilters.startDate.date();
          
          const txDateNum = txYear * 10000 + txMonth * 100 + txDay;
          const startDateNum = startYear * 10000 + startMonth * 100 + startDay;
          
          if (txDateNum < startDateNum) return false;
        }
        if (advancedFilters.endDate) {
          const [txYear, txMonth, txDay] = tx.date.split("-").map(Number);
          const endYear = advancedFilters.endDate.year();
          const endMonth = advancedFilters.endDate.month() + 1;
          const endDay = advancedFilters.endDate.date();
          
          const txDateNum = txYear * 10000 + txMonth * 100 + txDay;
          const endDateNum = endYear * 10000 + endMonth * 100 + endDay;
          
          if (txDateNum > endDateNum) return false;
        }

        // Filtro por tipo
        if (advancedFilters.type !== "all" && tx.type !== advancedFilters.type) {
          return false;
        }

        // Filtro por categoria
        if (
          advancedFilters.categories.length > 0 &&
          !advancedFilters.categories.includes(tx.category)
        ) {
          return false;
        }

        // Filtro por método de pagamento
        if (
          advancedFilters.paymentMethods.length > 0 &&
          !advancedFilters.paymentMethods.includes(tx.paymentMethod)
        ) {
          return false;
        }

        return true;
      });
    }
    
    return allTransactions;
  }, [transactions, advancedFilters, generateRecurringForDateRange]);

  // Summary (based on filtered transactions for dashboard)
  const summary = useMemo<FinancialSummary>(() => {
    const income = dashboardFilteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const expense = dashboardFilteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [dashboardFilteredTransactions]);

  // Colors Context Value
  const getCategoryColor = (
    type: TransactionType,
    category: string
  ): ColorConfig => {
    const typeColors = categoryColors[type];
    if (typeColors && typeColors[category]) {
      return typeColors[category];
    }
    return type === "income"
      ? { primary: "#10b981", secondary: "#059669" }
      : { primary: "#ef4444", secondary: "#dc2626" };
  };

  const getPaymentMethodColor = (method: string): ColorConfig => {
    return (
      paymentMethodColors[method] || {
        primary: "#6366f1",
        secondary: "#4f46e5",
      }
    );
  };

  const colorsContextValue = useMemo(
    () => ({
      categoryColors,
      paymentMethodColors,
      getCategoryColor,
      getPaymentMethodColor,
    }),
    [categoryColors, paymentMethodColors]
  );

  // Handlers
  const handleLogout = async () => {
    // Limpa flags de sessão ao fazer logout
    localStorage.removeItem("nix_remember_session");
    sessionStorage.removeItem("nix_temp_session");
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
      const addMonths = (dateStr: string, months: number): string => {
        const date = new Date(dateStr);
        date.setMonth(date.getMonth() + months);
        return date.toISOString().split("T")[0];
      };

      if (editId) {
        const editMode = currentEditMode;

        const dbPayload = {
          description: newTx.description,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          payment_method: newTx.paymentMethod,
          is_recurring: newTx.isRecurring,
          frequency: newTx.frequency,
          is_shared: newTx.isShared,
          shared_with: newTx.sharedWith,
        };

        if (editMode === "all" || editMode === "all_future") {
          const originalTx = editingTransaction;
          if (!originalTx) return;

          // Tratamento especial para transações recorrentes com "all_future"
          // Precisamos materializar as ocorrências passadas antes de atualizar
          if (originalTx.isRecurring && editMode === "all_future" && originalTx.frequency) {
            const targetDate = new Date(newTx.date);
            const targetYear = targetDate.getFullYear();
            const targetMonth = targetDate.getMonth() + 1; // 1-12

            const [origYear, origMonth, origDay] = originalTx.date.split("-").map(Number);
            
            // Gerar transações materializadas para meses passados
            const materializedTransactions: Array<{
              user_id: string;
              description: string;
              amount: number;
              type: string;
              category: string;
              payment_method: string;
              date: string;
              is_recurring: boolean;
              is_paid: boolean;
              is_shared?: boolean;
              shared_with?: string;
            }> = [];

            // Iterar pelos meses desde o original até o mês anterior ao selecionado
            let currentYear = origYear;
            let currentMonth = origMonth;

            while (
              currentYear < targetYear ||
              (currentYear === targetYear && currentMonth < targetMonth)
            ) {
              // Pula o mês original (já existe como transação real)
              if (!(currentYear === origYear && currentMonth === origMonth)) {
                const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                const adjustedDay = Math.min(origDay, daysInMonth);
                const materializedDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

                // Verifica se já existe uma transação materializada para esta data
                const alreadyExists = transactions.some((mt) => {
                  if (mt.isRecurring || mt.isVirtual) return false;
                  if (mt.id === originalTx.id) return false;
                  
                  const sameDescription = mt.description === originalTx.description;
                  const sameCategory = mt.category === originalTx.category;
                  const sameAmount = mt.amount === originalTx.amount;
                  const sameDate = mt.date === materializedDate;
                  const sameType = mt.type === originalTx.type;
                  
                  return sameDescription && sameCategory && sameAmount && sameDate && sameType;
                });

                if (!alreadyExists) {
                  materializedTransactions.push({
                    user_id: session.user.id,
                    description: originalTx.description,
                    amount: originalTx.amount,
                    type: originalTx.type,
                    category: originalTx.category,
                    payment_method: originalTx.paymentMethod,
                    date: materializedDate,
                    is_recurring: false,
                    is_paid: false,
                    is_shared: originalTx.isShared,
                    shared_with: originalTx.sharedWith,
                  });
                }
              }

              // Avançar para o próximo mês
              if (originalTx.frequency === "monthly") {
                currentMonth++;
                if (currentMonth > 12) {
                  currentMonth = 1;
                  currentYear++;
                }
              } else if (originalTx.frequency === "yearly") {
                currentYear++;
              }
            }

            // Inserir transações materializadas no banco
            // E adicionar as datas ao excluded_dates para evitar duplicatas virtuais
            const materializedDates: string[] = materializedTransactions.map(mt => mt.date);
            
            if (materializedTransactions.length > 0) {
              const { data: insertedData, error: insertError } = await supabase
                .from("transactions")
                .insert(materializedTransactions)
                .select();

              if (insertError) {
                console.error("Error materializing past transactions:", insertError);
              } else if (insertedData) {
                // Adicionar transações materializadas ao estado local
                const newTransactions: Transaction[] = insertedData.map((d) => ({
                  id: d.id,
                  description: d.description,
                  amount: d.amount,
                  type: d.type,
                  category: d.category,
                  paymentMethod: d.payment_method,
                  date: d.date,
                  createdAt: new Date(d.created_at).getTime(),
                  isRecurring: false,
                  isPaid: d.is_paid ?? false,
                  isShared: d.is_shared,
                  sharedWith: d.shared_with,
                }));
                setTransactions((prev) => [...newTransactions, ...prev]);
                
                // Adicionar datas materializadas ao excluded_dates da transação original
                const currentExcludedDates = originalTx.excludedDates || [];
                const newExcludedDates = [...new Set([...currentExcludedDates, ...materializedDates])];
                
                await supabase
                  .from("transactions")
                  .update({ excluded_dates: newExcludedDates })
                  .eq("id", originalTx.id);
              }
            }

            // Atualizar a transação original com nova data E novos valores
            const updatedPayload = {
              ...dbPayload,
              date: newTx.date, // Nova data de início
            };

            const { error: updateError } = await supabase
              .from("transactions")
              .update(updatedPayload)
              .eq("id", originalTx.id);

            if (updateError) throw updateError;

            // Atualizar estado local
            const wasShared = originalTx.isShared && originalTx.sharedWith;
            const isNowShared = newTx.isShared && newTx.sharedWith;

            // Handle shared transaction income creation for recurring
            if (isNowShared && !wasShared && newTx.type === "expense") {
              const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
              const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

              const incomePayload = {
                user_id: session.user.id,
                description: incomeDescription,
                amount: incomeAmount,
                type: "income" as const,
                category: "Other",
                payment_method: newTx.paymentMethod,
                date: newTx.date,
                is_recurring: newTx.isRecurring,
                frequency: newTx.frequency,
                is_paid: false,
                related_transaction_id: originalTx.id,
              };

              const { data: incomeData, error: incomeError } = await supabase
                .from("transactions")
                .insert(incomePayload)
                .select()
                .single();

              if (!incomeError && incomeData) {
                await supabase
                  .from("transactions")
                  .update({ related_transaction_id: incomeData.id })
                  .eq("id", originalTx.id);

                const incomeTransaction: Transaction = {
                  id: incomeData.id,
                  description: incomeData.description,
                  amount: incomeData.amount,
                  type: incomeData.type,
                  category: incomeData.category,
                  paymentMethod: incomeData.payment_method,
                  date: incomeData.date,
                  createdAt: new Date(incomeData.created_at).getTime(),
                  isRecurring: incomeData.is_recurring,
                  frequency: incomeData.frequency,
                  isPaid: incomeData.is_paid ?? false,
                  relatedTransactionId: originalTx.id,
                };
                setTransactions((prev) => [incomeTransaction, ...prev]);
              }
            }

            // Remove income if no longer shared
            if (wasShared && !isNowShared && originalTx.relatedTransactionId) {
              await supabase
                .from("transactions")
                .delete()
                .eq("id", originalTx.relatedTransactionId);

              setTransactions((prev) =>
                prev.filter((t) => t.id !== originalTx.relatedTransactionId)
              );
            }

            // Update existing income if still shared
            if (wasShared && isNowShared && originalTx.relatedTransactionId) {
              const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
              const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

              await supabase
                .from("transactions")
                .update({
                  description: incomeDescription,
                  amount: incomeAmount,
                  date: newTx.date,
                  payment_method: newTx.paymentMethod,
                })
                .eq("id", originalTx.relatedTransactionId);

              setTransactions((prev) =>
                prev.map((t) =>
                  t.id === originalTx.relatedTransactionId
                    ? {
                        ...t,
                        description: incomeDescription,
                        amount: incomeAmount,
                        date: newTx.date,
                        paymentMethod: newTx.paymentMethod,
                      }
                    : t
                )
              );
            }

            // Calcular os excluded_dates atualizados
            const currentExcludedDates = originalTx.excludedDates || [];
            const materializedDatesForState = materializedTransactions.map(mt => mt.date);
            const updatedExcludedDates = [...new Set([...currentExcludedDates, ...materializedDatesForState])];

            setTransactions((prev) =>
              prev.map((t) => {
                if (t.id === originalTx.id) {
                  return {
                    ...t,
                    description: newTx.description,
                    amount: newTx.amount,
                    type: newTx.type,
                    category: newTx.category,
                    paymentMethod: newTx.paymentMethod,
                    date: newTx.date,
                    isRecurring: newTx.isRecurring,
                    frequency: newTx.frequency,
                    isShared: newTx.isShared,
                    sharedWith: newTx.sharedWith,
                    excludedDates: updatedExcludedDates,
                  };
                }
                return t;
              })
            );

            setIsFormOpen(false);
            setEditingTransaction(null);
            setCurrentEditMode(null);
            return; // Early return - já tratamos o caso de recorrente + all_future
          }

          const relatedTxs = transactions.filter((t) => {
            const sameDescription = t.description === originalTx.description;
            const samePaymentMethod =
              t.paymentMethod === originalTx.paymentMethod;
            const sameCategory = t.category === originalTx.category;
            const sameInstallments = t.installments === originalTx.installments;
            const sameType = t.type === originalTx.type;

            if (
              !sameDescription ||
              !samePaymentMethod ||
              !sameCategory ||
              !sameType
            ) {
              return false;
            }

            if (originalTx.installments && originalTx.installments > 1) {
              if (!sameInstallments) return false;
              if (editMode === "all_future") {
                return (
                  (t.currentInstallment || 1) >=
                  (originalTx.currentInstallment || 1)
                );
              }
              return true;
            } else if (originalTx.isRecurring) {
              // Para "all" em recorrentes, simplesmente atualiza a transação original
              return t.id === originalTx.id;
            }

            return false;
          });

          const idsToUpdate = relatedTxs.map((t) => t.id);

          // Verificar mudança de estado shared
          const wasShared = originalTx.isShared && originalTx.sharedWith;
          const isNowShared = newTx.isShared && newTx.sharedWith;

          const { error } = await supabase
            .from("transactions")
            .update(dbPayload)
            .in("id", idsToUpdate);

          if (error) throw error;

          // Se agora é compartilhado e antes não era, criar income para a transação principal
          if (isNowShared && !wasShared && newTx.type === "expense") {
            const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
            const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

            const incomePayload = {
              user_id: session.user.id,
              description: incomeDescription,
              amount: incomeAmount,
              type: "income" as const,
              category: "Other",
              payment_method: newTx.paymentMethod,
              date: originalTx.date,
              is_recurring: newTx.isRecurring,
              frequency: newTx.frequency,
              is_paid: false,
              related_transaction_id: editId,
            };

            const { data: incomeData, error: incomeError } = await supabase
              .from("transactions")
              .insert(incomePayload)
              .select()
              .single();

            if (!incomeError && incomeData) {
              // Atualizar a transação original com o related_transaction_id
              await supabase
                .from("transactions")
                .update({ related_transaction_id: incomeData.id })
                .eq("id", editId);

              const incomeTransaction: Transaction = {
                id: incomeData.id,
                description: incomeData.description,
                amount: incomeData.amount,
                type: incomeData.type,
                category: incomeData.category,
                paymentMethod: incomeData.payment_method,
                date: incomeData.date,
                createdAt: new Date(incomeData.created_at).getTime(),
                isRecurring: incomeData.is_recurring,
                frequency: incomeData.frequency,
                isPaid: incomeData.is_paid ?? false,
                relatedTransactionId: editId,
              };
              setTransactions((prev) => [incomeTransaction, ...prev]);
            }
          }

          // Se antes era compartilhado e agora não é, remover income relacionada
          if (wasShared && !isNowShared && originalTx.relatedTransactionId) {
            await supabase
              .from("transactions")
              .delete()
              .eq("id", originalTx.relatedTransactionId);

            setTransactions((prev) =>
              prev.filter((t) => t.id !== originalTx.relatedTransactionId)
            );
          }

          // Se era e continua sendo compartilhado, atualizar a income existente
          if (wasShared && isNowShared && originalTx.relatedTransactionId) {
            const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
            const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

            await supabase
              .from("transactions")
              .update({
                description: incomeDescription,
                amount: incomeAmount,
                payment_method: newTx.paymentMethod,
              })
              .eq("id", originalTx.relatedTransactionId);

            setTransactions((prev) =>
              prev.map((t) =>
                t.id === originalTx.relatedTransactionId
                  ? {
                      ...t,
                      description: incomeDescription,
                      amount: incomeAmount,
                      paymentMethod: newTx.paymentMethod,
                    }
                  : t
              )
            );
          }

          setTransactions((prev) =>
            prev.map((t) => {
              if (idsToUpdate.includes(t.id)) {
                return {
                  ...t,
                  description: newTx.description,
                  amount: newTx.amount,
                  type: newTx.type,
                  category: newTx.category,
                  paymentMethod: newTx.paymentMethod,
                  isRecurring: newTx.isRecurring,
                  frequency: newTx.frequency,
                  isShared: newTx.isShared,
                  sharedWith: newTx.sharedWith,
                  relatedTransactionId:
                    t.id === editId ? t.relatedTransactionId : undefined,
                };
              }
              return t;
            })
          );
        } else {
          const singlePayload = {
            ...dbPayload,
            date: newTx.date,
            installments: newTx.installments,
            current_installment: newTx.currentInstallment,
            is_shared: newTx.isShared,
            shared_with: newTx.sharedWith,
          };

          const { data, error } = await supabase
            .from("transactions")
            .update(singlePayload)
            .eq("id", editId)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const oldTransaction = editingTransaction;
            const wasShared =
              oldTransaction?.isShared && oldTransaction?.sharedWith;
            const isNowShared = newTx.isShared && newTx.sharedWith;

            // Se antes era compartilhado e agora não é, remover income relacionada
            if (
              wasShared &&
              !isNowShared &&
              oldTransaction?.relatedTransactionId
            ) {
              await supabase
                .from("transactions")
                .delete()
                .eq("id", oldTransaction.relatedTransactionId);

              setTransactions((prev) =>
                prev.filter((t) => t.id !== oldTransaction.relatedTransactionId)
              );
            }

            // Se agora é compartilhado e antes não era, criar income
            if (isNowShared && !wasShared) {
              const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
              const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

              const incomePayload = {
                user_id: session.user.id,
                description: incomeDescription,
                amount: incomeAmount,
                type: "income" as const,
                category: "Other",
                payment_method: newTx.paymentMethod,
                date: newTx.date,
                is_recurring: false,
                is_paid: false,
                related_transaction_id: data.id,
              };

              const { data: incomeData, error: incomeError } = await supabase
                .from("transactions")
                .insert(incomePayload)
                .select()
                .single();

              if (!incomeError && incomeData) {
                // Atualizar a transação original com o related_transaction_id
                await supabase
                  .from("transactions")
                  .update({ related_transaction_id: incomeData.id })
                  .eq("id", data.id);

                const incomeTransaction: Transaction = {
                  id: incomeData.id,
                  description: incomeData.description,
                  amount: incomeData.amount,
                  type: incomeData.type,
                  category: incomeData.category,
                  paymentMethod: incomeData.payment_method,
                  date: incomeData.date,
                  createdAt: new Date(incomeData.created_at).getTime(),
                  isRecurring: incomeData.is_recurring,
                  frequency: incomeData.frequency,
                  isPaid: incomeData.is_paid ?? false,
                  relatedTransactionId: data.id,
                };
                setTransactions((prev) => [incomeTransaction, ...prev]);

                // Atualizar o relatedTransactionId no estado
                data.related_transaction_id = incomeData.id;
              }
            }

            // Se era e continua sendo compartilhado, atualizar a income existente
            if (
              wasShared &&
              isNowShared &&
              oldTransaction?.relatedTransactionId
            ) {
              const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
              const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

              await supabase
                .from("transactions")
                .update({
                  description: incomeDescription,
                  amount: incomeAmount,
                  date: newTx.date,
                  payment_method: newTx.paymentMethod,
                })
                .eq("id", oldTransaction.relatedTransactionId);

              setTransactions((prev) =>
                prev.map((t) =>
                  t.id === oldTransaction.relatedTransactionId
                    ? {
                        ...t,
                        description: incomeDescription,
                        amount: incomeAmount,
                        date: newTx.date,
                        paymentMethod: newTx.paymentMethod,
                      }
                    : t
                )
              );
            }

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
              isPaid: data.is_paid ?? true,
              isShared: data.is_shared,
              sharedWith: data.shared_with,
              relatedTransactionId: data.related_transaction_id,
              installmentGroupId: data.installment_group_id,
              excludedDates: data.excluded_dates ?? [],
            };
            setTransactions((prev) =>
              prev.map((t) => (t.id === editId ? transaction : t))
            );
          }
        }
      } else if (newTx.installments && newTx.installments > 1) {
        const totalInstallments = newTx.installments;
        const txAmount = newTx.amount || 0;
        const installmentAmount =
          Math.round((txAmount / totalInstallments) * 100) / 100;
        const totalFromInstallments = installmentAmount * totalInstallments;
        const remainder =
          Math.round((txAmount - totalFromInstallments) * 100) / 100;

        // Gera um UUID único para agrupar todas as parcelas deste parcelamento
        const installmentGroupId = crypto.randomUUID();

        const installmentPayloads = [];
        for (let i = 0; i < totalInstallments; i++) {
          const amount =
            i === 0 ? installmentAmount + remainder : installmentAmount;

          installmentPayloads.push({
            user_id: session.user.id,
            description: newTx.description,
            amount: amount,
            type: newTx.type,
            category: newTx.category,
            payment_method: newTx.paymentMethod,
            date: addMonths(newTx.date, i),
            is_recurring: newTx.isRecurring,
            frequency: newTx.frequency,
            installments: totalInstallments,
            current_installment: i + 1,
            is_paid: false,
            is_shared: newTx.isShared,
            shared_with: newTx.sharedWith,
            installment_group_id: installmentGroupId,
          });
        }

        const { data, error } = await supabase
          .from("transactions")
          .insert(installmentPayloads)
          .select();

        if (error) throw error;

        if (data) {
          const newTransactions: Transaction[] = data.map((d: any) => ({
            id: d.id,
            description: d.description,
            amount: d.amount,
            type: d.type,
            category: d.category,
            paymentMethod: d.payment_method,
            date: d.date,
            createdAt: new Date(d.created_at).getTime(),
            isRecurring: d.is_recurring,
            frequency: d.frequency,
            installments: d.installments,
            currentInstallment: d.current_installment,
            isPaid: d.is_paid ?? false,
            isShared: d.is_shared,
            sharedWith: d.shared_with,
            installmentGroupId: d.installment_group_id,
          }));
          setTransactions((prev) => [...newTransactions, ...prev]);

          // Se é um gasto compartilhado com parcelas, criar income para cada parcela
          if (newTx.isShared && newTx.sharedWith && newTx.type === "expense") {
            const incomePayloads = data.map((d: any) => ({
              user_id: session.user.id,
              description: `${d.description} - ${newTx.sharedWith}`,
              amount: Math.round((d.amount / 2) * 100) / 100,
              type: "income" as const,
              category: "Other",
              payment_method: d.payment_method,
              date: d.date,
              is_recurring: false,
              is_paid: false,
              installments: totalInstallments,
              current_installment: d.current_installment,
              related_transaction_id: d.id,
            }));

            const { data: incomeData, error: incomeError } = await supabase
              .from("transactions")
              .insert(incomePayloads)
              .select();

            if (!incomeError && incomeData) {
              const incomeTransactions: Transaction[] = incomeData.map(
                (d: any) => ({
                  id: d.id,
                  description: d.description,
                  amount: d.amount,
                  type: d.type,
                  category: d.category,
                  paymentMethod: d.payment_method,
                  date: d.date,
                  createdAt: new Date(d.created_at).getTime(),
                  isRecurring: d.is_recurring,
                  frequency: d.frequency,
                  installments: d.installments,
                  currentInstallment: d.current_installment,
                  isPaid: d.is_paid ?? false,
                  relatedTransactionId: d.related_transaction_id,
                })
              );
              setTransactions((prev) => [...incomeTransactions, ...prev]);
            }
          }
        }
      } else {
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
          is_paid: false,
          is_shared: newTx.isShared,
          shared_with: newTx.sharedWith,
          i_owe: newTx.iOwe,
        };

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
            isPaid: data.is_paid ?? false,
            isShared: data.is_shared,
            sharedWith: data.shared_with,
            iOwe: data.i_owe,
            installmentGroupId: data.installment_group_id,
            excludedDates: data.excluded_dates ?? [],
          };
          setTransactions((prev) => [transaction, ...prev]);

          // Se é uma DESPESA vinculada a amigo com conta dividida (não iOwe), cria income de 50%
          // Se iOwe = true (conta única), significa que EU devo ao amigo, então não cria income
          if (newTx.isShared && newTx.sharedWith && newTx.type === "expense" && !newTx.iOwe) {
            const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
            // Conta dividida: amigo me deve 50% do valor
            const incomeAmount = Math.round(((newTx.amount || 0) / 2) * 100) / 100;

            const incomePayload = {
              user_id: session.user.id,
              description: incomeDescription,
              amount: incomeAmount,
              type: "income" as const,
              category: "Other",
              payment_method: newTx.paymentMethod,
              date: newTx.date,
              is_recurring: newTx.isRecurring,
              frequency: newTx.frequency,
              is_paid: false,
              related_transaction_id: data.id,
            };

            const { data: incomeData, error: incomeError } = await supabase
              .from("transactions")
              .insert(incomePayload)
              .select()
              .single();

            if (incomeError) {
              console.error(
                "Error creating income for shared expense:",
                incomeError
              );
            } else if (incomeData) {
              await supabase
                .from("transactions")
                .update({ related_transaction_id: incomeData.id })
                .eq("id", data.id);

              setTransactions((prev) =>
                prev.map((t) =>
                  t.id === data.id
                    ? { ...t, relatedTransactionId: incomeData.id }
                    : t
                )
              );

              const incomeTransaction: Transaction = {
                id: incomeData.id,
                description: incomeData.description,
                amount: incomeData.amount,
                type: incomeData.type,
                category: incomeData.category,
                paymentMethod: incomeData.payment_method,
                date: incomeData.date,
                createdAt: new Date(incomeData.created_at).getTime(),
                isRecurring: incomeData.is_recurring,
                frequency: incomeData.frequency,
                isPaid: incomeData.is_paid ?? false,
                relatedTransactionId: data.id,
              };
              setTransactions((prev) => [incomeTransaction, ...prev]);
            }
          }

          // Se estava editando uma transação virtual como "single", adiciona a data ao excluded_dates
          if (pendingVirtualEdit) {
            const originalTransaction = transactions.find((t) => t.id === pendingVirtualEdit.originalId);
            if (originalTransaction) {
              const currentExcludedDates = originalTransaction.excludedDates || [];
              const newExcludedDates = [...currentExcludedDates, pendingVirtualEdit.excludeDate];

              await supabase
                .from("transactions")
                .update({ excluded_dates: newExcludedDates })
                .eq("id", pendingVirtualEdit.originalId);

              setTransactions((prev) =>
                prev.map((t) =>
                  t.id === pendingVirtualEdit.originalId
                    ? { ...t, excludedDates: newExcludedDates }
                    : t
                )
              );
            }
            setPendingVirtualEdit(null);
          }
        }
      }

      setEditingTransaction(null);
      setCurrentEditMode(null);
    } catch (err) {
      console.error("Error saving transaction:", err);
      showError("Error saving transaction. Please try again.", "Save Error");
    }
  };

  // Função auxiliar para abrir o formulário para nova transação
  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setCurrentEditMode(null);
    setPendingVirtualEdit(null);
    setIsFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    const isVirtual = transaction.isVirtual;
    const isInstallment =
      transaction.installments && transaction.installments > 1;

    // Mostra dialog de opções apenas para:
    // 1. Transações virtuais (ocorrências de recorrentes) - permite editar single/all_future/all
    // 2. Transações parceladas (múltiplas transações reais) - permite editar single/all_future/all
    // 
    // Transações recorrentes originais (não virtuais) são editadas diretamente
    // porque são a única transação real - as virtuais são geradas a partir dela
    if (isVirtual || isInstallment) {
      setPendingEditTransaction(transaction);
      setEditOptionsDialogOpen(true);
    } else {
      // Para transações simples ou recorrentes originais, resetar o modo de edição e limpar estados pendentes
      setCurrentEditMode(null);
      setPendingVirtualEdit(null);
      setEditingTransaction(transaction);
      setIsFormOpen(true);
    }
  };

  const handleEditOptionSelect = async (option: EditOption) => {
    if (!pendingEditTransaction || !session) return;

    setEditOptionsDialogOpen(false);
    setCurrentEditMode(option);

    // Determinar a transação a editar e a data virtual
    let transactionToEdit: Transaction;
    let virtualDate: string | undefined;

    if (pendingEditTransaction.isVirtual) {
      // Para transação virtual, encontra a original
      const originalId = pendingEditTransaction.originalTransactionId;
      const originalTransaction = transactions.find((t) => t.id === originalId);
      
      // Extrai a data da ocorrência virtual
      const virtualDatePart = pendingEditTransaction.id.split("_recurring_")[1];
      if (originalTransaction && virtualDatePart) {
        const [origYear, origMonth, origDay] = originalTransaction.date.split("-").map(Number);
        const [targetYear, targetMonth] = virtualDatePart.split("-").map(Number);
        const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
        const adjustedDay = Math.min(origDay, daysInTargetMonth);
        virtualDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;
      }

      if (originalTransaction) {
        transactionToEdit = {
          ...originalTransaction,
          isVirtual: true, // Mantém flag para saber que veio de virtual
          originalTransactionId: originalId,
        };
      } else {
        transactionToEdit = pendingEditTransaction;
      }

      // Para "single" em virtual, configura o pending virtual edit
      if (option === "single" && originalId && virtualDate) {
        setPendingVirtualEdit({ originalId, excludeDate: virtualDate });
      }
    } else {
      // Para transação parcelada real
      transactionToEdit = pendingEditTransaction;
    }

    // Usa o novo formulário de edição de recorrência
    setRecurringEditTransaction(transactionToEdit);
    setRecurringEditMode(option);
    setRecurringVirtualDate(virtualDate);
    setIsRecurringFormOpen(true);
    setPendingEditTransaction(null);
  };

  // Handler para salvar do formulário de edição de recorrência
  const handleRecurringEditSave = async (
    newTx: Omit<Transaction, "id" | "createdAt">,
    editId?: string,
    editMode?: EditOption
  ) => {
    if (!session || !recurringEditTransaction) return;

    try {
      const originalTx = recurringEditTransaction.isVirtual
        ? transactions.find((t) => t.id === recurringEditTransaction.originalTransactionId)
        : recurringEditTransaction;

      if (!originalTx) return;

      if (editMode === "single") {
        // Para "single", cria uma nova transação (não edita)
        const dbPayload = {
          user_id: session.user.id,
          description: newTx.description,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          payment_method: newTx.paymentMethod,
          date: newTx.date,
          is_recurring: false, // Não é mais recorrente
          is_paid: false,
          is_shared: newTx.isShared,
          shared_with: newTx.sharedWith,
          i_owe: newTx.iOwe,
        };

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
            isRecurring: false,
            isPaid: false,
            isShared: data.is_shared,
            sharedWith: data.shared_with,
            iOwe: data.i_owe,
          };
          setTransactions((prev) => [transaction, ...prev]);

          // Se tinha pendingVirtualEdit, adiciona a data ao excluded_dates
          if (pendingVirtualEdit) {
            const currentExcludedDates = originalTx.excludedDates || [];
            const newExcludedDates = [...currentExcludedDates, pendingVirtualEdit.excludeDate];

            await supabase
              .from("transactions")
              .update({ excluded_dates: newExcludedDates })
              .eq("id", pendingVirtualEdit.originalId);

            setTransactions((prev) =>
              prev.map((t) =>
                t.id === pendingVirtualEdit.originalId
                  ? { ...t, excludedDates: newExcludedDates }
                  : t
              )
            );
            setPendingVirtualEdit(null);
          }
        }
      } else if (editMode === "all_future") {
        // Para "all_future", materializa as ocorrências passadas e atualiza a original
        const targetDate = new Date(newTx.date);
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth() + 1;

        const [origYear, origMonth, origDay] = originalTx.date.split("-").map(Number);

        // Gerar transações materializadas para meses passados
        const materializedTransactions: Array<{
          user_id: string;
          description: string;
          amount: number;
          type: string;
          category: string;
          payment_method: string;
          date: string;
          is_recurring: boolean;
          is_paid: boolean;
          is_shared?: boolean;
          shared_with?: string;
        }> = [];

        let currentYear = origYear;
        let currentMonth = origMonth;

        while (
          currentYear < targetYear ||
          (currentYear === targetYear && currentMonth < targetMonth)
        ) {
          if (!(currentYear === origYear && currentMonth === origMonth)) {
            const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
            const adjustedDay = Math.min(origDay, daysInMonth);
            const materializedDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

            // Verifica se não está no excluded_dates
            const excludedDates = originalTx.excludedDates || [];
            if (!excludedDates.includes(materializedDate)) {
              materializedTransactions.push({
                user_id: session.user.id,
                description: originalTx.description,
                amount: originalTx.amount,
                type: originalTx.type,
                category: originalTx.category,
                payment_method: originalTx.paymentMethod,
                date: materializedDate,
                is_recurring: false,
                is_paid: false,
                is_shared: originalTx.isShared,
                shared_with: originalTx.sharedWith,
              });
            }
          }

          if (originalTx.frequency === "monthly") {
            currentMonth++;
            if (currentMonth > 12) {
              currentMonth = 1;
              currentYear++;
            }
          } else if (originalTx.frequency === "yearly") {
            currentYear++;
          }
        }

        // Inserir transações materializadas
        const materializedDates: string[] = materializedTransactions.map((mt) => mt.date);

        if (materializedTransactions.length > 0) {
          const { data: insertedData, error: insertError } = await supabase
            .from("transactions")
            .insert(materializedTransactions)
            .select();

          if (insertError) {
            console.error("Error materializing past transactions:", insertError);
          } else if (insertedData) {
            const newTransactions: Transaction[] = insertedData.map((d) => ({
              id: d.id,
              description: d.description,
              amount: d.amount,
              type: d.type,
              category: d.category,
              paymentMethod: d.payment_method,
              date: d.date,
              createdAt: new Date(d.created_at).getTime(),
              isRecurring: false,
              isPaid: d.is_paid ?? false,
              isShared: d.is_shared,
              sharedWith: d.shared_with,
            }));
            setTransactions((prev) => [...newTransactions, ...prev]);
          }
        }

        // Atualizar a transação original com nova data e novos valores
        const currentExcludedDates = originalTx.excludedDates || [];
        const updatedExcludedDates = [...new Set([...currentExcludedDates, ...materializedDates])];

        const updatedPayload = {
          description: newTx.description,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          payment_method: newTx.paymentMethod,
          date: newTx.date,
          is_recurring: newTx.isRecurring,
          frequency: newTx.frequency,
          is_shared: newTx.isShared,
          shared_with: newTx.sharedWith,
          excluded_dates: updatedExcludedDates,
        };

        const { error: updateError } = await supabase
          .from("transactions")
          .update(updatedPayload)
          .eq("id", originalTx.id);

        if (updateError) throw updateError;

        setTransactions((prev) =>
          prev.map((t) => {
            if (t.id === originalTx.id) {
              return {
                ...t,
                description: newTx.description,
                amount: newTx.amount,
                type: newTx.type,
                category: newTx.category,
                paymentMethod: newTx.paymentMethod,
                date: newTx.date,
                isRecurring: newTx.isRecurring,
                frequency: newTx.frequency,
                isShared: newTx.isShared,
                sharedWith: newTx.sharedWith,
                excludedDates: updatedExcludedDates,
              };
            }
            return t;
          })
        );
      } else if (editMode === "all") {
        // Para "all", simplesmente atualiza a transação original
        const updatedPayload = {
          description: newTx.description,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          payment_method: newTx.paymentMethod,
          is_recurring: newTx.isRecurring,
          frequency: newTx.frequency,
          is_shared: newTx.isShared,
          shared_with: newTx.sharedWith,
        };

        const { error: updateError } = await supabase
          .from("transactions")
          .update(updatedPayload)
          .eq("id", originalTx.id);

        if (updateError) throw updateError;

        setTransactions((prev) =>
          prev.map((t) => {
            if (t.id === originalTx.id) {
              return {
                ...t,
                description: newTx.description,
                amount: newTx.amount,
                type: newTx.type,
                category: newTx.category,
                paymentMethod: newTx.paymentMethod,
                isRecurring: newTx.isRecurring,
                frequency: newTx.frequency,
                isShared: newTx.isShared,
                sharedWith: newTx.sharedWith,
              };
            }
            return t;
          })
        );
      }

      // Limpar estados
      setIsRecurringFormOpen(false);
      setRecurringEditTransaction(null);
      setRecurringEditMode(null);
      setRecurringVirtualDate(undefined);
      setCurrentEditMode(null);
      setPendingVirtualEdit(null);
    } catch (err) {
      console.error("Error saving recurring transaction:", err);
      showError("Error saving transaction. Please try again.", "Save Error");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    // Verifica se é uma transação virtual (gerada automaticamente de recorrente)
    const isVirtualTransaction = id.includes("_recurring_");
    let transactionToDelete: Transaction | undefined;

    if (isVirtualTransaction) {
      // Para transações virtuais, extrai o ID original e cria um objeto representando a ocorrência virtual
      const originalId = id.split("_recurring_")[0];
      const virtualDatePart = id.split("_recurring_")[1]; // formato: YYYY-MM
      const originalTransaction = transactions.find((t) => t.id === originalId);
      
      if (!originalTransaction) return;

      // Cria um objeto de transação virtual para o dialog
      transactionToDelete = {
        ...originalTransaction,
        id: id,
        date: virtualDatePart ? `${virtualDatePart}-01` : originalTransaction.date,
        isVirtual: true,
        originalTransactionId: originalId,
      };
    } else {
      transactionToDelete = transactions.find((t) => t.id === id);
      if (!transactionToDelete) return;
    }

    // Mostra dialog de opções apenas para:
    // 1. Transações virtuais (ocorrências de recorrentes) - permite deletar single/all_future/all
    // 2. Transações parceladas (múltiplas transações reais) - permite deletar single/all_future/all
    // 
    // Transações recorrentes originais (não virtuais) pedem confirmação simples
    // pois deletar a original remove toda a recorrência
    const isInstallment = transactionToDelete.installments && transactionToDelete.installments > 1;

    if (isVirtualTransaction || isInstallment) {
      setPendingDeleteTransaction(transactionToDelete);
      setDeleteOptionsDialogOpen(true);
      return;
    }

    // Para transações normais, confirmação simples
    const relatedTransaction = transactionToDelete.relatedTransactionId
      ? transactions.find(
          (t) => t.id === transactionToDelete!.relatedTransactionId
        )
      : null;

    let deleteRelated = false;

    if (relatedTransaction) {
      const isExpense = transactionToDelete.type === "expense";
      const relatedType = isExpense
        ? "income (reimbursement)"
        : "original expense";
      const relatedDesc = relatedTransaction.description;

      const result = await choice({
        title: "Delete Linked Transaction",
        message: `This transaction has a related ${relatedType}:\n"${relatedDesc}"\n\nWhat would you like to do?`,
        variant: "warning",
        choices: [
          {
            label: "Delete Both",
            value: "both",
            variant: "contained",
            color: "error",
          },
          {
            label: "Delete Only This One",
            value: "this",
            variant: "outlined",
            color: "warning",
          },
        ],
      });

      if (result === null) return;
      deleteRelated = result === "both";
    } else {
      const confirmed = await confirm({
        title: "Delete Transaction",
        message:
          "Are you sure you want to delete this transaction? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "danger",
      });

      if (!confirmed) return;
    }

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;

      let idsToRemove = [id];

      if (deleteRelated && relatedTransaction) {
        const { error: relatedError } = await supabase
          .from("transactions")
          .delete()
          .eq("id", relatedTransaction.id);

        if (relatedError) {
          console.error("Error deleting related transaction:", relatedError);
        } else {
          idsToRemove.push(relatedTransaction.id);
        }
      } else if (relatedTransaction) {
        await supabase
          .from("transactions")
          .update({ related_transaction_id: null })
          .eq("id", relatedTransaction.id);

        setTransactions((prev) =>
          prev.map((t) =>
            t.id === relatedTransaction.id
              ? { ...t, relatedTransactionId: undefined }
              : t
          )
        );
      }

      setTransactions((prev) =>
        prev.filter((t) => !idsToRemove.includes(t.id))
      );
    } catch (err) {
      console.error("Error deleting transaction:", err);
      showError(
        "Error deleting transaction. Please try again.",
        "Delete Error"
      );
    }
  };

  // Handler para as opções de delete do dialog
  const handleDeleteOptionSelect = async (option: DeleteOption) => {
    if (!pendingDeleteTransaction || !session) return;

    setDeleteOptionsDialogOpen(false);
    
    const isVirtual = pendingDeleteTransaction.isVirtual;
    const isInstallment = pendingDeleteTransaction.installments && pendingDeleteTransaction.installments > 1;
    const isRecurring = pendingDeleteTransaction.isRecurring && !isInstallment;
    const originalId = isVirtual 
      ? pendingDeleteTransaction.originalTransactionId 
      : pendingDeleteTransaction.id;

    if (!originalId) return;

    try {
      if (option === "single") {
        // Deletar apenas esta transação/ocorrência específica
        if (isVirtual) {
          // Para transação virtual (recorrente automática), adiciona a data ao excluded_dates
          const virtualDatePart = pendingDeleteTransaction.id.split("_recurring_")[1];
          const originalTransaction = transactions.find((t) => t.id === originalId);
          
          if (originalTransaction && virtualDatePart) {
            const [origYear, origMonth, origDay] = originalTransaction.date.split("-").map(Number);
            const [targetYear, targetMonth] = virtualDatePart.split("-").map(Number);
            const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
            const adjustedDay = Math.min(origDay, daysInTargetMonth);
            const skipDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

            // Adiciona a data ao excluded_dates da transação original
            const currentExcludedDates = originalTransaction.excludedDates || [];
            const newExcludedDates = [...currentExcludedDates, skipDate];

            const { error } = await supabase
              .from("transactions")
              .update({ excluded_dates: newExcludedDates })
              .eq("id", originalId);

            if (error) throw error;

            // Atualiza o estado local com a nova lista de datas excluídas
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === originalId
                  ? { ...t, excludedDates: newExcludedDates }
                  : t
              )
            );
          }
        } else if (isInstallment) {
          // Para parcela específica, deleta apenas esta parcela
          const confirmed = await confirm({
            title: "Delete This Installment",
            message: `Delete only installment ${pendingDeleteTransaction.currentInstallment || 1}/${pendingDeleteTransaction.installments}?`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
          });

          if (!confirmed) return;

          const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", pendingDeleteTransaction.id);
          if (error) throw error;

          setTransactions((prev) =>
            prev.filter((t) => t.id !== pendingDeleteTransaction.id)
          );
        } else {
          // Para transação recorrente real (não virtual), deleta apenas esta
          const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", pendingDeleteTransaction.id);
          if (error) throw error;

          setTransactions((prev) =>
            prev.filter((t) => t.id !== pendingDeleteTransaction.id)
          );
        }
      } else if (option === "all_future") {
        // Deletar esta e todas as futuras
        if (isInstallment) {
          // Para parcelas, deleta esta e as próximas
          const currentInstallment = pendingDeleteTransaction.currentInstallment || 1;
          
          // Encontra todas as parcelas relacionadas usando installment_group_id (preferido) ou fallback
          let relatedInstallments: typeof transactions;
          
          if (pendingDeleteTransaction.installmentGroupId) {
            // Usar installment_group_id para encontrar parcelas relacionadas
            relatedInstallments = transactions.filter((t) => 
              t.installmentGroupId === pendingDeleteTransaction.installmentGroupId &&
              (t.currentInstallment || 1) >= currentInstallment
            );
          } else {
            // Fallback para transações antigas sem installment_group_id
            relatedInstallments = transactions.filter((t) => {
              const sameDescription = t.description === pendingDeleteTransaction.description;
              const sameCategory = t.category === pendingDeleteTransaction.category;
              const samePaymentMethod = t.paymentMethod === pendingDeleteTransaction.paymentMethod;
              const sameInstallments = t.installments === pendingDeleteTransaction.installments;
              const isFutureOrCurrent = (t.currentInstallment || 1) >= currentInstallment;
              
              return sameDescription && sameCategory && samePaymentMethod && sameInstallments && isFutureOrCurrent;
            });
          }

          const idsToDelete = relatedInstallments.map((t) => t.id);

          if (idsToDelete.length === 0) return;

          const confirmed = await confirm({
            title: "Delete Future Installments",
            message: `Delete installments ${currentInstallment} to ${pendingDeleteTransaction.installments}? (${idsToDelete.length} installment${idsToDelete.length > 1 ? 's' : ''})`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
          });

          if (!confirmed) return;

          const { error } = await supabase
            .from("transactions")
            .delete()
            .in("id", idsToDelete);
          if (error) throw error;

          setTransactions((prev) =>
            prev.filter((t) => !idsToDelete.includes(t.id))
          );
        } else {
          // Para recorrentes, deleta a transação original (que para as virtuais futuras)
          const confirmed = await confirm({
            title: "Delete Future Occurrences",
            message: "This will delete the recurring transaction and stop all future occurrences. Are you sure?",
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
          });

          if (!confirmed) return;

          const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", originalId);
          if (error) throw error;

          setTransactions((prev) =>
            prev.filter((t) => t.id !== originalId)
          );
        }
      } else if (option === "all") {
        // Deletar todas as ocorrências/parcelas
        if (isInstallment) {
          // Para parcelas, deleta todas as parcelas relacionadas usando installment_group_id (preferido) ou fallback
          let relatedInstallments: typeof transactions;
          
          if (pendingDeleteTransaction.installmentGroupId) {
            // Usar installment_group_id para encontrar parcelas relacionadas
            relatedInstallments = transactions.filter((t) => 
              t.installmentGroupId === pendingDeleteTransaction.installmentGroupId
            );
          } else {
            // Fallback para transações antigas sem installment_group_id
            relatedInstallments = transactions.filter((t) => {
              const sameDescription = t.description === pendingDeleteTransaction.description;
              const sameCategory = t.category === pendingDeleteTransaction.category;
              const samePaymentMethod = t.paymentMethod === pendingDeleteTransaction.paymentMethod;
              const sameInstallments = t.installments === pendingDeleteTransaction.installments;
              
              return sameDescription && sameCategory && samePaymentMethod && sameInstallments;
            });
          }

          const idsToDelete = relatedInstallments.map((t) => t.id);

          if (idsToDelete.length === 0) return;

          const confirmed = await confirm({
            title: "Delete All Installments",
            message: `Delete all ${idsToDelete.length} installments of "${pendingDeleteTransaction.description}"?`,
            confirmText: "Delete All",
            cancelText: "Cancel",
            variant: "danger",
          });

          if (!confirmed) return;

          const { error } = await supabase
            .from("transactions")
            .delete()
            .in("id", idsToDelete);
          if (error) throw error;

          setTransactions((prev) =>
            prev.filter((t) => !idsToDelete.includes(t.id))
          );
        } else {
          // Para recorrentes, deleta a transação original
          const confirmed = await confirm({
            title: "Delete All Occurrences",
            message: "This will delete the recurring transaction and all its occurrences. Are you sure?",
            confirmText: "Delete All",
            cancelText: "Cancel",
            variant: "danger",
          });

          if (!confirmed) return;

          const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", originalId);
          if (error) throw error;

          setTransactions((prev) =>
            prev.filter((t) => t.id !== originalId)
          );
        }
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      showError(
        "Error deleting transaction. Please try again.",
        "Delete Error"
      );
    }

    setPendingDeleteTransaction(null);
  };

  const handleTogglePaid = async (id: string, isPaid: boolean) => {
    try {
      // Verifica se é uma transação virtual (gerada automaticamente de recorrente)
      const isVirtualTransaction = id.includes("_recurring_");

      if (isVirtualTransaction) {
        // Para transações virtuais, materializa criando uma nova transação no banco
        const originalId = id.split("_recurring_")[0];
        const virtualDatePart = id.split("_recurring_")[1]; // formato: YYYY-MM
        const originalTransaction = transactions.find((t) => t.id === originalId);

        if (!originalTransaction) return;

        // Calcula a data correta para a ocorrência virtual
        const [origYear, origMonth, origDay] = originalTransaction.date.split("-").map(Number);
        const [targetYear, targetMonth] = virtualDatePart.split("-").map(Number);
        const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
        const adjustedDay = Math.min(origDay, daysInTargetMonth);
        const virtualDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`;

        // Cria uma nova transação materializada (cópia da original com a data da ocorrência)
        const newTransaction = {
          description: originalTransaction.description,
          amount: originalTransaction.amount,
          type: originalTransaction.type,
          category: originalTransaction.category,
          payment_method: originalTransaction.paymentMethod,
          date: virtualDate,
          is_recurring: false, // Não é mais recorrente, é uma ocorrência única
          frequency: null,
          installments: null,
          current_installment: null,
          is_paid: isPaid,
          is_shared: originalTransaction.isShared,
          shared_with: originalTransaction.sharedWith,
          related_transaction_id: originalTransaction.relatedTransactionId,
          user_id: session?.user?.id,
        };

        const { data, error } = await supabase
          .from("transactions")
          .insert(newTransaction)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const mappedTransaction: Transaction = {
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
            isPaid: data.is_paid ?? true,
            isShared: data.is_shared,
            sharedWith: data.shared_with,
            relatedTransactionId: data.related_transaction_id,
            installmentGroupId: data.installment_group_id,
            excludedDates: data.excluded_dates ?? [],
          };

          setTransactions((prev) => [...prev, mappedTransaction]);
        }
      } else {
        // Para transações normais, apenas atualiza o status
        const { error } = await supabase
          .from("transactions")
          .update({ is_paid: isPaid })
          .eq("id", id);
        if (error) throw error;
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isPaid } : t))
        );
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
    }
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

  const handleRemoveCategory = async (
    type: TransactionType,
    category: string
  ) => {
    const confirmed = await confirm({
      title: "Remove Category",
      message: `Are you sure you want to remove the category "${category}"?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "warning",
    });

    if (confirmed) {
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

  const handleRemovePaymentMethod = async (method: string) => {
    const confirmed = await confirm({
      title: "Remove Payment Method",
      message: `Are you sure you want to remove the payment method "${method}"?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "warning",
    });

    if (confirmed) {
      const updatedMethods = paymentMethods.filter((m) => m !== method);
      setPaymentMethods(updatedMethods);
      updateSettingsInDb(categories, updatedMethods);
    }
  };

  // Friends Handler
  const handleAddFriend = async (friendName: string) => {
    if (!friends.includes(friendName)) {
      const updatedFriends = [...friends, friendName].sort();
      setFriends(updatedFriends);

      if (session) {
        try {
          await supabase.from("user_settings").upsert({
            user_id: session.user.id,
            friends: updatedFriends,
          });
        } catch (err) {
          console.error("Error saving friends:", err);
        }
      }
    }
  };

  // Color Handlers
  const handleUpdateCategoryColor = async (
    type: TransactionType,
    category: string,
    colors: ColorConfig
  ) => {
    const newCategoryColors = {
      ...categoryColors,
      [type]: {
        ...categoryColors[type],
        [category]: colors,
      },
    };
    setCategoryColors(newCategoryColors);

    if (session) {
      try {
        await supabase.from("user_settings").upsert({
          user_id: session.user.id,
          category_colors: newCategoryColors,
        });
      } catch (err) {
        console.error("Error saving category colors:", err);
      }
    }
  };

  const handleUpdatePaymentMethodColor = async (
    method: string,
    colors: ColorConfig
  ) => {
    const newPaymentMethodColors = {
      ...paymentMethodColors,
      [method]: colors,
    };
    setPaymentMethodColors(newPaymentMethodColors);

    if (session) {
      try {
        await supabase.from("user_settings").upsert({
          user_id: session.user.id,
          payment_method_colors: newPaymentMethodColors,
        });
      } catch (err) {
        console.error("Error saving payment method colors:", err);
      }
    }
  };

  // Handler para marcar todas as transações de um método de pagamento como pagas
  const handlePayAllTransactions = async (
    paymentMethod: string,
    month: number,
    year: number
  ) => {
    if (!session) return;

    const confirmed = await confirm({
      title: "Pagar Fatura Completa",
      message: `Deseja marcar todas as despesas não pagas de "${paymentMethod}" em ${month + 1}/${year} como pagas?`,
      confirmText: "Pagar Tudo",
      cancelText: "Cancelar",
      severity: "info",
    });

    if (!confirmed) return;

    try {
      // Encontra transações não pagas do mês/ano para este método
      const targetMonth = month + 1;
      const unpaidIds = transactions
        .filter((t) => {
          const [y, m] = t.date.split("-");
          return (
            t.paymentMethod === paymentMethod &&
            parseInt(y) === year &&
            parseInt(m) === targetMonth &&
            t.type === "expense" &&
            !t.isPaid &&
            !t.isVirtual
          );
        })
        .map((t) => t.id);

      if (unpaidIds.length === 0) return;

      // Atualiza no banco
      const { error } = await supabase
        .from("transactions")
        .update({ is_paid: true })
        .in("id", unpaidIds);

      if (error) throw error;

      // Atualiza estado local
      setTransactions((prev) =>
        prev.map((t) =>
          unpaidIds.includes(t.id) ? { ...t, isPaid: true } : t
        )
      );
    } catch (err) {
      console.error("Error paying all transactions:", err);
      showError("Erro ao marcar transações como pagas");
    }
  };

  const handleUpdateDisplayName = async (newName: string) => {
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

  // Handler para transações criadas via Smart Input (IA)
  const handleSmartInputTransaction = (
    parsedTx: Omit<ParsedTransaction, "confidence" | "rawInput">
  ) => {
    // Converte o ParsedTransaction para o formato esperado pelo handleAddTransaction
    const transaction: Omit<Transaction, "id" | "createdAt"> = {
      description: parsedTx.description,
      amount: parsedTx.amount || 0,
      type: parsedTx.type,
      category: parsedTx.category,
      paymentMethod: parsedTx.paymentMethod,
      date: parsedTx.date,
      isRecurring: false,
      isPaid: false,
    };
    handleAddTransaction(transaction);
  };

  return (
    <ThemeContext.Provider
      value={{ themePreference, setThemePreference: updateThemePreference }}
    >
      <ColorsContext.Provider value={colorsContextValue}>
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "background.default",
            display: "flex",
          }}
        >
          {/* Sidebar - Desktop Only */}
          {!isMobile && (
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
          )}

          {/* Mobile Header & Drawer */}
          {isMobile && (
            <>
              <MobileHeader
                onMenuOpen={() => setIsMobileDrawerOpen(true)}
                onLogout={handleLogout}
              />
              <MobileDrawer
                open={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
                themePreference={themePreference}
                onThemeChange={updateThemePreference}
                currentView={currentView}
                onNavigate={setCurrentView}
                onLogout={handleLogout}
                displayName={displayName}
                userEmail={session.user.email || ""}
                onOpenProfile={() => setIsProfileModalOpen(true)}
              />
            </>
          )}

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 1.5, sm: 2, md: 3, lg: 4 },
              mt: { xs: "64px", lg: 0 },
              // Extra padding para bottom navigation (64px) + safe area + FABs
              pb: { xs: "140px", lg: 4 },
              maxWidth: "100vw",
              overflowX: "hidden",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {currentView === "dashboard" ? (
                selectedPaymentMethod ? (
                  <Suspense fallback={<ViewLoading />}>
                    <PaymentMethodDetailView
                      paymentMethod={selectedPaymentMethod}
                      transactions={transactions}
                      selectedMonth={filters.month}
                      selectedYear={filters.year}
                      onDateChange={(month, year) =>
                        setFilters({ ...filters, month, year })
                      }
                      onBack={() => setSelectedPaymentMethod(null)}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                      onTogglePaid={handleTogglePaid}
                    />
                  </Suspense>
                ) : (
                  <>
                    {/* Dashboard Header / Controls */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant={isMobile ? "h6" : "h5"}
                          sx={{ fontWeight: "bold", color: "text.primary" }}
                        >
                          Dashboard
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {isMobile
                            ? displayName || session.user.email?.split("@")[0]
                            : `Welcome, ${displayName || session.user.email}`}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        <AdvancedFiltersButton
                          hasActiveFilters={
                            advancedFilters.startDate !== null ||
                            advancedFilters.endDate !== null ||
                            advancedFilters.type !== "all" ||
                            advancedFilters.categories.length > 0 ||
                            advancedFilters.paymentMethods.length > 0
                          }
                          activeFiltersCount={
                            (advancedFilters.startDate || advancedFilters.endDate ? 1 : 0) +
                            (advancedFilters.type !== "all" ? 1 : 0) +
                            advancedFilters.categories.length +
                            advancedFilters.paymentMethods.length
                          }
                          showFilters={showAdvancedFilters}
                          onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          compact={isMobile}
                        />
                        <DateFilter
                          month={filters.month}
                          year={filters.year}
                          onDateChange={(month, year) =>
                            setFilters({ ...filters, month, year })
                          }
                          showIcon
                          compact={isMobile}
                          disabled={
                            advancedFilters.startDate !== null ||
                            advancedFilters.endDate !== null ||
                            advancedFilters.type !== "all" ||
                            advancedFilters.categories.length > 0 ||
                            advancedFilters.paymentMethods.length > 0
                          }
                          disabledMessage="Remova os filtros avançados para usar o filtro de mês"
                        />
                        {!isMobile && (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleNewTransaction}
                          >
                            New Transaction
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {/* Advanced Filters Panel */}
                    <Suspense fallback={null}>
                      <AdvancedFilters
                        transactions={transactions}
                        filters={advancedFilters}
                        onFiltersChange={setAdvancedFilters}
                        showFilters={showAdvancedFilters}
                        onToggleFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      />
                    </Suspense>

                    <SummaryCards
                      summary={summary}
                      transactions={transactions}
                      selectedMonth={filters.month}
                      selectedYear={filters.year}
                    />

                    {/* Category & Payment Breakdown */}
                    <CategoryBreakdown
                      transactions={dashboardFilteredTransactions}
                      onPaymentMethodClick={(method) => {
                        setSelectedPaymentMethod(method);
                        setCurrentView("paymentMethods");
                      }}
                      onCategoryClick={(category, type) => {
                        setSelectedCategoryNav({ name: category, type });
                        setCurrentView("categories");
                      }}
                    />

                    {/* Analytics Charts */}
                    <AnalyticsView 
                      transactions={analyticsTransactions} 
                      hasAdvancedFilters={
                        advancedFilters.startDate !== null ||
                        advancedFilters.endDate !== null ||
                        advancedFilters.type !== "all" ||
                        advancedFilters.categories.length > 0 ||
                        advancedFilters.paymentMethods.length > 0
                      }
                      advancedFilters={advancedFilters}
                    />

                    {/* Mobile FAB for Dashboard */}
                    {isMobile && (
                      <Fab
                        color="primary"
                        onClick={handleNewTransaction}
                        aria-label="Add new transaction"
                        sx={{
                          position: "fixed",
                          bottom: 24,
                          right: 24,
                          zIndex: 1100,
                          width: 56,
                          height: 56,
                        }}
                      >
                        <AddIcon sx={{ fontSize: 28 }} />
                      </Fab>
                    )}
                  </>
                )
              ) : currentView === "transactions" ? (
                <Suspense fallback={<ViewLoading />}>
                  <TransactionsView
                    transactions={transactions}
                    onNewTransaction={handleNewTransaction}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    onTogglePaid={handleTogglePaid}
                    selectedMonth={filters.month}
                    selectedYear={filters.year}
                    onDateChange={(month, year) =>
                      setFilters({ ...filters, month, year })
                    }
                  />
                </Suspense>
              ) : currentView === "splits" ? (
                <Suspense fallback={<ViewLoading />}>
                  <SplitsView
                    transactions={transactions}
                    onNewTransaction={handleNewTransaction}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    onTogglePaid={handleTogglePaid}
                  />
                </Suspense>
              ) : currentView === "shared" ? (
                <Suspense fallback={<ViewLoading />}>
                  <SharedView
                    transactions={transactions}
                    friends={friends}
                    userName={displayName}
                    onNewTransaction={handleNewTransaction}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    onTogglePaid={handleTogglePaid}
                  />
                </Suspense>
              ) : currentView === "recurring" ? (
                <Suspense fallback={<ViewLoading />}>
                  <RecurringView
                    transactions={transactions}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    onTogglePaid={handleTogglePaid}
                    onNewTransaction={handleNewTransaction}
                  />
                </Suspense>
              ) : currentView === "nixai" ? (
                <Suspense fallback={<ViewLoading />}>
                  <NixAIView
                    transactions={transactions}
                    categories={categories}
                    paymentMethods={paymentMethods}
                    onTransactionCreate={handleSmartInputTransaction}
                  />
                </Suspense>
              ) : currentView === "budgets" ? (
                <Suspense fallback={<ViewLoading />}>
                  <BudgetsView
                    transactions={transactions}
                    categories={categories}
                    userId={session.user.id}
                    selectedMonth={filters.month}
                    selectedYear={filters.year}
                    onDateChange={(month, year) =>
                      setFilters({ ...filters, month, year })
                    }
                  />
                </Suspense>
              ) : currentView === "goals" ? (
                <Suspense fallback={<ViewLoading />}>
                  <GoalsView userId={session.user.id} />
                </Suspense>
              ) : currentView === "paymentMethods" ? (
                selectedPaymentMethod ? (
                  <Suspense fallback={<ViewLoading />}>
                    <PaymentMethodDetailView
                      paymentMethod={selectedPaymentMethod}
                      transactions={transactions}
                      selectedMonth={filters.month}
                      selectedYear={filters.year}
                      onDateChange={(month, year) =>
                        setFilters({ ...filters, month, year })
                      }
                      onBack={() => setSelectedPaymentMethod(null)}
                      onPayAll={handlePayAllTransactions}
                      onTogglePaid={handleTogglePaid}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                    />
                  </Suspense>
                ) : (
                  <Suspense fallback={<ViewLoading />}>
                    <PaymentMethodsView
                      transactions={transactions}
                      paymentMethods={paymentMethods}
                      paymentMethodColors={paymentMethodColors}
                      selectedMonth={filters.month}
                      selectedYear={filters.year}
                      onDateChange={(month, year) =>
                        setFilters({ ...filters, month, year })
                      }
                      onSelectPaymentMethod={setSelectedPaymentMethod}
                      onPayAll={handlePayAllTransactions}
                      onAddPaymentMethod={handleAddPaymentMethod}
                      onRemovePaymentMethod={handleRemovePaymentMethod}
                      onUpdatePaymentMethodColor={handleUpdatePaymentMethodColor}
                    />
                  </Suspense>
                )
              ) : currentView === "categories" ? (
                <Suspense fallback={<ViewLoading />}>
                  <CategoriesView
                    transactions={transactions}
                    categories={categories}
                    categoryColors={categoryColors}
                    selectedMonth={filters.month}
                    selectedYear={filters.year}
                    onDateChange={(month, year) =>
                      setFilters({ ...filters, month, year })
                    }
                    onAddCategory={handleAddCategory}
                    onRemoveCategory={handleRemoveCategory}
                    onUpdateCategoryColor={handleUpdateCategoryColor}
                    onTogglePaid={handleTogglePaid}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    initialSelectedCategory={selectedCategoryNav}
                    onClearInitialCategory={() => setSelectedCategoryNav(null)}
                  />
                </Suspense>
              ) : currentView === "pluggyConnections" ? (
                <Suspense fallback={<ViewLoading />}>
                  <PluggyConnectionsView 
                    userId={session.user.id} 
                    onTransactionsRefresh={onRefreshData}
                  />
                </Suspense>
              ) : null}
            </Box>
          </Box>

          <TransactionForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
              setCurrentEditMode(null);
              setPendingVirtualEdit(null);
            }}
            onSave={handleAddTransaction}
            categories={categories}
            paymentMethods={paymentMethods}
            editTransaction={editingTransaction}
            friends={friends}
            onAddFriend={handleAddFriend}
            transactions={transactions}
            currentBalance={summary.balance}
          />

          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            displayName={displayName}
            userEmail={session.user.email || ""}
            onUpdateDisplayName={handleUpdateDisplayName}
            onChangeEmail={handleChangeEmail}
            onResetPassword={handleResetPassword}
          />

          <EditOptionsDialog
            isOpen={editOptionsDialogOpen}
            onClose={() => {
              setEditOptionsDialogOpen(false);
              setPendingEditTransaction(null);
            }}
            onSelect={handleEditOptionSelect}
            transaction={pendingEditTransaction}
          />

          <RecurringEditForm
            isOpen={isRecurringFormOpen}
            onClose={() => {
              setIsRecurringFormOpen(false);
              setRecurringEditTransaction(null);
              setRecurringEditMode(null);
              setRecurringVirtualDate(undefined);
              setCurrentEditMode(null);
              // NÃO resetar pendingVirtualEdit aqui - é usado por handleRecurringEditSave
              // e é resetado no final dessa função
            }}
            onSave={handleRecurringEditSave}
            transaction={recurringEditTransaction}
            editMode={recurringEditMode || "single"}
            categories={categories}
            paymentMethods={paymentMethods}
            virtualDate={recurringVirtualDate}
          />

          <DeleteOptionsDialog
            isOpen={deleteOptionsDialogOpen}
            onClose={() => {
              setDeleteOptionsDialogOpen(false);
              setPendingDeleteTransaction(null);
            }}
            onSelect={handleDeleteOptionSelect}
            transaction={pendingDeleteTransaction}
          />

          <Suspense fallback={null}>
            <GlobalSearch
              open={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              transactions={transactions}
              onNavigate={(view) => setCurrentView(view as typeof currentView)}
              onSelectTransaction={(tx) => {
                handleEditTransaction(tx);
              }}
            />
          </Suspense>

        </Box>
      </ColorsContext.Provider>
    </ThemeContext.Provider>
  );
};

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

  // State for Friends (para shared expenses)
  const [friends, setFriends] = useState<string[]>([]);

  // State for Colors
  const [categoryColors, setCategoryColors] = useState<CategoryColors>({
    income: {},
    expense: {},
  });
  const [paymentMethodColors, setPaymentMethodColors] =
    useState<PaymentMethodColors>({});

  // State for user profile
  const [displayName, setDisplayName] = useState<string>("");

  // State for Filters
  const [filters, setFilters] = useState<FilterState>(() => {
    const { month, year } = getInitialMonthYear();
    return { month, year };
  });

  // Theme preference state
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    () => {
      const saved = localStorage.getItem("themePreference") as ThemePreference;
      return saved || "system";
    }
  );

  // Detecta preferência do sistema
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // Computed dark mode based on preference
  const darkMode = useMemo(() => {
    if (themePreference === "system") {
      return prefersDarkMode;
    }
    return themePreference === "dark";
  }, [themePreference, prefersDarkMode]);

  // Seleciona o tema MUI
  const theme = useMemo(() => {
    return darkMode ? darkTheme : lightTheme;
  }, [darkMode]);

  // Helper functions para cores
  const getCategoryColor = (
    type: TransactionType,
    category: string
  ): ColorConfig => {
    const typeColors = categoryColors[type];
    if (typeColors && typeColors[category]) {
      return typeColors[category];
    }
    return type === "income" ? DEFAULT_INCOME_COLORS : DEFAULT_EXPENSE_COLORS;
  };

  const getPaymentMethodColor = (method: string): ColorConfig => {
    return paymentMethodColors[method] || DEFAULT_PAYMENT_COLORS;
  };

  const colorsContextValue = useMemo(
    () => ({
      categoryColors,
      paymentMethodColors,
      getCategoryColor,
      getPaymentMethodColor,
    }),
    [categoryColors, paymentMethodColors]
  );

  // Detecta se é mobile
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  // Salva preferência de tema no localStorage
  useEffect(() => {
    localStorage.setItem("themePreference", themePreference);
  }, [themePreference]);

  // Auth & Data Fetching
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Verifica se a sessão era temporária (usuário não marcou "Manter-me conectado")
      // Se tem sessão, não tem "remember_session" no localStorage, e não tem "temp_session" no sessionStorage
      // significa que o navegador foi fechado e reaberto - devemos fazer signOut
      if (session) {
        const rememberSession = localStorage.getItem("nix_remember_session");
        const tempSession = sessionStorage.getItem("nix_temp_session");

        if (!rememberSession && !tempSession) {
          // Sessão era temporária e navegador foi fechado - fazer signOut
          await supabase.auth.signOut();
          setSession(null);
          setLoadingInitial(false);
          return;
        }
      }

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
          isPaid: t.is_paid ?? true, // Default true para transações existentes
          isShared: t.is_shared,
          sharedWith: t.shared_with,
          iOwe: t.i_owe,
          relatedTransactionId: t.related_transaction_id,
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
        // Load colors
        if (settings.category_colors) {
          setCategoryColors(settings.category_colors);
        }
        if (settings.payment_method_colors) {
          setPaymentMethodColors(settings.payment_method_colors);
        }
        // Load friends
        if (settings.friends) {
          setFriends(settings.friends);
        }
      } else {
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

  // Loading screen
  if (loadingInitial) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.default",
            }}
          >
            <CircularProgress color="primary" size={48} />
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  // Login screen
  if (!session) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <LoginView />
        </LocalizationProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <NotificationProvider>
          <ConfirmDialogProvider>
            <AppContent
              session={session}
              transactions={transactions}
              setTransactions={setTransactions}
              categories={categories}
              setCategories={setCategories}
              paymentMethods={paymentMethods}
              setPaymentMethods={setPaymentMethods}
              friends={friends}
              setFriends={setFriends}
              displayName={displayName}
              setDisplayName={setDisplayName}
              themePreference={themePreference}
              updateThemePreference={updateThemePreference}
              categoryColors={categoryColors}
              setCategoryColors={setCategoryColors}
              paymentMethodColors={paymentMethodColors}
              setPaymentMethodColors={setPaymentMethodColors}
              filters={filters}
              setFilters={setFilters}
              updateSettingsInDb={updateSettingsInDb}
              onRefreshData={() => fetchData(session.user.id)}
            />
          </ConfirmDialogProvider>
        </NotificationProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
