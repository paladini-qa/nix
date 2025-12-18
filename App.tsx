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
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  Fab,
  Button,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Logout as LogOutIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Settings as SettingsIcon,
  AutoAwesome as SparklesIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
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
import ThemeSwitch from "./components/ThemeSwitch";
import DateFilter from "./components/DateFilter";
import EditOptionsDialog, { EditOption } from "./components/EditOptionsDialog";

// Lazy loaded components (loaded on demand)
const TransactionsView = lazy(() => import("./components/TransactionsView"));
const SettingsView = lazy(() => import("./components/SettingsView"));
const PaymentMethodDetailView = lazy(
  () => import("./components/PaymentMethodDetailView")
);
const NixAIView = lazy(() => import("./components/NixAIView"));
const RecurringView = lazy(() => import("./components/RecurringView"));
const SplitsView = lazy(() => import("./components/SplitsView"));

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
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const { showError } = useNotification();
  const { confirm, choice } = useConfirmDialog();

  const [currentView, setCurrentView] = useState<
    "dashboard" | "transactions" | "splits" | "recurring" | "nixai" | "settings"
  >("dashboard");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [editOptionsDialogOpen, setEditOptionsDialogOpen] = useState(false);
  const [pendingEditTransaction, setPendingEditTransaction] =
    useState<Transaction | null>(null);
  const [currentEditMode, setCurrentEditMode] = useState<EditOption | null>(
    null
  );

  // Helper: Gera transações recorrentes virtuais para o mês/ano selecionado
  const generateRecurringTransactions = useMemo(() => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = filters.month + 1;
    const targetYear = filters.year;

    transactions.forEach((t) => {
      if (!t.isRecurring || !t.frequency) return;

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

        virtualTransactions.push({
          ...t,
          id: `${t.id}_recurring_${targetYear}-${String(targetMonth).padStart(
            2,
            "0"
          )}`,
          date: virtualDate,
          isVirtual: true,
          originalTransactionId: t.id,
        });
      }
    });

    return virtualTransactions;
  }, [transactions, filters]);

  // Filtered Transactions
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

  // Summary
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
        };

        if (editMode === "all" || editMode === "all_future") {
          const originalTx = editingTransaction;
          if (!originalTx) return;

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
              return t.id === originalTx.id;
            }

            return false;
          });

          const idsToUpdate = relatedTxs.map((t) => t.id);

          const { error } = await supabase
            .from("transactions")
            .update(dbPayload)
            .in("id", idsToUpdate);

          if (error) throw error;

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
          };

          const { data, error } = await supabase
            .from("transactions")
            .update(singlePayload)
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
              isPaid: data.is_paid ?? true,
            };
            setTransactions((prev) =>
              prev.map((t) => (t.id === editId ? transaction : t))
            );
          }
        }
      } else if (newTx.installments && newTx.installments > 1) {
        const totalInstallments = newTx.installments;
        const installmentAmount =
          Math.round((newTx.amount / totalInstallments) * 100) / 100;
        const totalFromInstallments = installmentAmount * totalInstallments;
        const remainder =
          Math.round((newTx.amount - totalFromInstallments) * 100) / 100;

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
          }));
          setTransactions((prev) => [...newTransactions, ...prev]);
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
          };
          setTransactions((prev) => [transaction, ...prev]);

          // Se é um gasto compartilhado, cria automaticamente uma income para o reembolso
          if (newTx.isShared && newTx.sharedWith) {
            const incomeDescription = `${newTx.description} - ${newTx.sharedWith}`;
            const incomeAmount = Math.round((newTx.amount / 2) * 100) / 100;

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
        }
      }

      setEditingTransaction(null);
      setCurrentEditMode(null);
    } catch (err) {
      console.error("Error saving transaction:", err);
      showError("Error saving transaction. Please try again.", "Save Error");
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    const isRecurring = transaction.isRecurring && !transaction.isVirtual;
    const isInstallment =
      transaction.installments && transaction.installments > 1;

    if (isRecurring || isInstallment) {
      setPendingEditTransaction(transaction);
      setEditOptionsDialogOpen(true);
    } else {
      setEditingTransaction(transaction);
      setIsFormOpen(true);
    }
  };

  const handleEditOptionSelect = async (option: EditOption) => {
    if (!pendingEditTransaction || !session) return;

    setEditOptionsDialogOpen(false);
    setCurrentEditMode(option);
    setEditingTransaction(pendingEditTransaction);
    setIsFormOpen(true);
    setPendingEditTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    const transactionToDelete = transactions.find((t) => t.id === id);
    if (!transactionToDelete) return;

    const relatedTransaction = transactionToDelete.relatedTransactionId
      ? transactions.find(
          (t) => t.id === transactionToDelete.relatedTransactionId
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

  const handleTogglePaid = async (id: string, isPaid: boolean) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ is_paid: isPaid })
        .eq("id", id);
      if (error) throw error;
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isPaid } : t))
      );
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

          {/* Mobile Header */}
          {isMobile && (
            <AppBar
              position="fixed"
              sx={{
                bgcolor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
              }}
              elevation={0}
            >
              <Toolbar>
                <Typography
                  variant="h6"
                  sx={{
                    flexGrow: 1,
                    fontWeight: "bold",
                    color: "text.primary",
                  }}
                >
                  Nix
                </Typography>
                <ThemeSwitch
                  value={themePreference}
                  onChange={updateThemePreference}
                  compact
                />
                <IconButton onClick={handleLogout} color="error" sx={{ ml: 1 }}>
                  <LogOutIcon />
                </IconButton>
              </Toolbar>
            </AppBar>
          )}

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, lg: 4 },
              mt: { xs: "64px", lg: 0 },
              mb: { xs: "72px", lg: 0 },
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
                        <DateFilter
                          month={filters.month}
                          year={filters.year}
                          onDateChange={(month, year) =>
                            setFilters({ ...filters, month, year })
                          }
                          showIcon
                          compact={isMobile}
                        />
                        {!isMobile && (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setEditingTransaction(null);
                              setIsFormOpen(true);
                            }}
                          >
                            New Transaction
                          </Button>
                        )}
                      </Box>
                    </Box>

                    <SummaryCards
                      summary={summary}
                      transactions={filteredTransactions}
                    />

                    {/* Transaction History */}
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}
                      >
                        Transaction History
                      </Typography>
                      <TransactionTable transactions={filteredTransactions} />
                    </Box>

                    {/* Category & Payment Breakdown */}
                    <CategoryBreakdown
                      transactions={filteredTransactions}
                      onPaymentMethodClick={(method) =>
                        setSelectedPaymentMethod(method)
                      }
                    />

                    {/* Mobile FAB for Dashboard */}
                    {isMobile && (
                      <Fab
                        color="primary"
                        onClick={() => {
                          setEditingTransaction(null);
                          setIsFormOpen(true);
                        }}
                        sx={{
                          position: "fixed",
                          bottom: 80,
                          right: 16,
                          zIndex: 1100,
                        }}
                      >
                        <AddIcon />
                      </Fab>
                    )}
                  </>
                )
              ) : currentView === "transactions" ? (
                <Suspense fallback={<ViewLoading />}>
                  <TransactionsView
                    transactions={transactions}
                    onNewTransaction={() => {
                      setEditingTransaction(null);
                      setIsFormOpen(true);
                    }}
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
                    onNewTransaction={() => {
                      setEditingTransaction(null);
                      setIsFormOpen(true);
                    }}
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
                    onNewTransaction={() => {
                      setEditingTransaction(null);
                      setIsFormOpen(true);
                    }}
                  />
                </Suspense>
              ) : currentView === "nixai" ? (
                <Suspense fallback={<ViewLoading />}>
                  <NixAIView transactions={transactions} />
                </Suspense>
              ) : (
                <Suspense fallback={<ViewLoading />}>
                  <SettingsView
                    categories={categories}
                    paymentMethods={paymentMethods}
                    categoryColors={categoryColors}
                    paymentMethodColors={paymentMethodColors}
                    onAddCategory={handleAddCategory}
                    onRemoveCategory={handleRemoveCategory}
                    onAddPaymentMethod={handleAddPaymentMethod}
                    onRemovePaymentMethod={handleRemovePaymentMethod}
                    onUpdateCategoryColor={handleUpdateCategoryColor}
                    onUpdatePaymentMethodColor={handleUpdatePaymentMethodColor}
                  />
                </Suspense>
              )}
            </Box>
          </Box>

          {/* Mobile Bottom Navigation */}
          {isMobile && (
            <Paper
              sx={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1200,
                borderTop: 1,
                borderColor: "divider",
              }}
              elevation={3}
            >
              <BottomNavigation
                value={currentView}
                onChange={(_, newValue) => setCurrentView(newValue)}
                showLabels
              >
                <BottomNavigationAction
                  label="Dashboard"
                  value="dashboard"
                  icon={<DashboardIcon />}
                />
                <BottomNavigationAction
                  label="Transactions"
                  value="transactions"
                  icon={<WalletIcon />}
                />
                <BottomNavigationAction
                  label="Splits"
                  value="splits"
                  icon={<CreditCardIcon />}
                />
                <BottomNavigationAction
                  label="Recurring"
                  value="recurring"
                  icon={<RepeatIcon />}
                />
                <BottomNavigationAction
                  label="Settings"
                  value="settings"
                  icon={<SettingsIcon />}
                />
              </BottomNavigation>
            </Paper>
          )}

          <TransactionForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
              setCurrentEditMode(null);
            }}
            onSave={handleAddTransaction}
            categories={categories}
            paymentMethods={paymentMethods}
            editTransaction={editingTransaction}
            friends={friends}
            onAddFriend={handleAddFriend}
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
  const [filters, setFilters] = useState<FilterState>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
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
            />
          </ConfirmDialogProvider>
        </NotificationProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
