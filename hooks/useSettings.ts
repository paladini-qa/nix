import { useState, useCallback } from "react";
import {
  TransactionType,
  ThemePreference,
  ColorConfig,
  CategoryColors,
  PaymentMethodColors,
} from "../types";
import {
  CATEGORIES as DEFAULT_CATEGORIES,
  PAYMENT_METHODS as DEFAULT_PAYMENT_METHODS,
} from "../constants";
import { supabase } from "../services/supabaseClient";

export interface UserSettings {
  displayName: string;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  themePreference: ThemePreference;
  categoryColors: CategoryColors;
  paymentMethodColors: PaymentMethodColors;
}

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

/**
 * Hook para gerenciamento de configurações do usuário
 */
export function useSettings() {
  const [displayName, setDisplayNameState] = useState("");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    DEFAULT_PAYMENT_METHODS
  );
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");
  const [categoryColors, setCategoryColors] = useState<CategoryColors>({
    income: {},
    expense: {},
  });
  const [paymentMethodColors, setPaymentMethodColors] =
    useState<PaymentMethodColors>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca configurações do usuário
  const fetchSettings = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: settings, error: fetchError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (settings) {
        setCategories({
          income: settings.categories_income || DEFAULT_CATEGORIES.income,
          expense: settings.categories_expense || DEFAULT_CATEGORIES.expense,
        });
        setPaymentMethods(settings.payment_methods || DEFAULT_PAYMENT_METHODS);
        if (settings.theme_preference) {
          setThemePreferenceState(settings.theme_preference as ThemePreference);
        }
        if (settings.display_name) {
          setDisplayNameState(settings.display_name);
        }
        if (settings.category_colors) {
          setCategoryColors(settings.category_colors);
        }
        if (settings.payment_method_colors) {
          setPaymentMethodColors(settings.payment_method_colors);
        }
      } else {
        // Cria configurações padrão para novo usuário
        await supabase.from("user_settings").insert({
          user_id: userId,
          categories_income: DEFAULT_CATEGORIES.income,
          categories_expense: DEFAULT_CATEGORIES.expense,
          payment_methods: DEFAULT_PAYMENT_METHODS,
          theme_preference: "system",
        });
      }
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza categorias e métodos de pagamento no banco
  const updateCategoriesAndPaymentMethods = useCallback(
    async (
      userId: string,
      newCategories: typeof categories,
      newPaymentMethods: string[]
    ) => {
      try {
        const { error } = await supabase.from("user_settings").upsert({
          user_id: userId,
          categories_income: newCategories.income,
          categories_expense: newCategories.expense,
          payment_methods: newPaymentMethods,
        });
        if (error) throw error;
      } catch (err: any) {
        console.error("Error saving settings:", err);
        setError(err.message || "Failed to save settings");
        throw err;
      }
    },
    []
  );

  // Adiciona categoria
  const addCategory = useCallback(
    async (userId: string, type: TransactionType, category: string) => {
      if (!categories[type].includes(category)) {
        const updatedCats = {
          ...categories,
          [type]: [...categories[type], category].sort(),
        };
        setCategories(updatedCats);
        await updateCategoriesAndPaymentMethods(
          userId,
          updatedCats,
          paymentMethods
        );
      }
    },
    [categories, paymentMethods, updateCategoriesAndPaymentMethods]
  );

  // Remove categoria
  const removeCategory = useCallback(
    async (userId: string, type: TransactionType, category: string) => {
      const updatedCats = {
        ...categories,
        [type]: categories[type].filter((c) => c !== category),
      };
      setCategories(updatedCats);
      await updateCategoriesAndPaymentMethods(
        userId,
        updatedCats,
        paymentMethods
      );
    },
    [categories, paymentMethods, updateCategoriesAndPaymentMethods]
  );

  // Adiciona método de pagamento
  const addPaymentMethod = useCallback(
    async (userId: string, method: string) => {
      if (!paymentMethods.includes(method)) {
        const updatedMethods = [...paymentMethods, method].sort();
        setPaymentMethods(updatedMethods);
        await updateCategoriesAndPaymentMethods(
          userId,
          categories,
          updatedMethods
        );
      }
    },
    [categories, paymentMethods, updateCategoriesAndPaymentMethods]
  );

  // Remove método de pagamento
  const removePaymentMethod = useCallback(
    async (userId: string, method: string) => {
      const updatedMethods = paymentMethods.filter((m) => m !== method);
      setPaymentMethods(updatedMethods);
      await updateCategoriesAndPaymentMethods(
        userId,
        categories,
        updatedMethods
      );
    },
    [categories, paymentMethods, updateCategoriesAndPaymentMethods]
  );

  // Atualiza preferência de tema
  const setThemePreference = useCallback(
    async (userId: string, theme: ThemePreference) => {
      setThemePreferenceState(theme);
      try {
        const { error } = await supabase.from("user_settings").upsert({
          user_id: userId,
          theme_preference: theme,
        });
        if (error) throw error;
      } catch (err: any) {
        console.error("Error saving theme preference:", err);
        setError(err.message || "Failed to save theme preference");
      }
    },
    []
  );

  // Atualiza nome de exibição
  const setDisplayName = useCallback(async (userId: string, name: string) => {
    setDisplayNameState(name);
    try {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: userId,
        display_name: name.trim() || null,
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Error saving display name:", err);
      setError(err.message || "Failed to save display name");
    }
  }, []);

  // Atualiza cor de categoria
  const updateCategoryColor = useCallback(
    async (
      userId: string,
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

      try {
        await supabase.from("user_settings").upsert({
          user_id: userId,
          category_colors: newCategoryColors,
        });
      } catch (err: any) {
        console.error("Error saving category colors:", err);
        setError(err.message || "Failed to save category colors");
      }
    },
    [categoryColors]
  );

  // Atualiza cor de método de pagamento
  const updatePaymentMethodColor = useCallback(
    async (userId: string, method: string, colors: ColorConfig) => {
      const newPaymentMethodColors = {
        ...paymentMethodColors,
        [method]: colors,
      };
      setPaymentMethodColors(newPaymentMethodColors);

      try {
        await supabase.from("user_settings").upsert({
          user_id: userId,
          payment_method_colors: newPaymentMethodColors,
        });
      } catch (err: any) {
        console.error("Error saving payment method colors:", err);
        setError(err.message || "Failed to save payment method colors");
      }
    },
    [paymentMethodColors]
  );

  // Retorna cor de categoria (com fallback)
  const getCategoryColor = useCallback(
    (type: TransactionType, category: string): ColorConfig => {
      const typeColors = categoryColors[type];
      if (typeColors && typeColors[category]) {
        return typeColors[category];
      }
      return type === "income" ? DEFAULT_INCOME_COLORS : DEFAULT_EXPENSE_COLORS;
    },
    [categoryColors]
  );

  // Retorna cor de método de pagamento (com fallback)
  const getPaymentMethodColor = useCallback(
    (method: string): ColorConfig => {
      return paymentMethodColors[method] || DEFAULT_PAYMENT_COLORS;
    },
    [paymentMethodColors]
  );

  // Reseta configurações para padrão
  const resetToDefaults = useCallback(async (userId: string) => {
    setCategories(DEFAULT_CATEGORIES);
    setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    setCategoryColors({ income: {}, expense: {} });
    setPaymentMethodColors({});

    try {
      await supabase.from("user_settings").upsert({
        user_id: userId,
        categories_income: DEFAULT_CATEGORIES.income,
        categories_expense: DEFAULT_CATEGORIES.expense,
        payment_methods: DEFAULT_PAYMENT_METHODS,
        category_colors: {},
        payment_method_colors: {},
      });
    } catch (err: any) {
      console.error("Error resetting settings:", err);
      setError(err.message || "Failed to reset settings");
    }
  }, []);

  // Limpa erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    displayName,
    categories,
    paymentMethods,
    themePreference,
    categoryColors,
    paymentMethodColors,
    loading,
    error,

    // Actions
    fetchSettings,
    addCategory,
    removeCategory,
    addPaymentMethod,
    removePaymentMethod,
    setThemePreference,
    setDisplayName,
    updateCategoryColor,
    updatePaymentMethodColor,
    getCategoryColor,
    getPaymentMethodColor,
    resetToDefaults,
    clearError,
  };
}

export default useSettings;



