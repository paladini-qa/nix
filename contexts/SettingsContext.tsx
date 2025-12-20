import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";
import {
  ThemePreference,
  TransactionType,
  ColorConfig,
  CategoryColors,
  PaymentMethodColors,
} from "../types";
import {
  CATEGORIES as DEFAULT_CATEGORIES,
  PAYMENT_METHODS as DEFAULT_PAYMENT_METHODS,
} from "../constants";

// ============================================
// Default Colors
// ============================================

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

// ============================================
// Context Types
// ============================================

interface SettingsContextValue {
  // Categories
  categories: { income: string[]; expense: string[] };
  addCategory: (type: TransactionType, category: string) => void;
  removeCategory: (type: TransactionType, category: string) => Promise<boolean>;
  
  // Payment Methods
  paymentMethods: string[];
  addPaymentMethod: (method: string) => void;
  removePaymentMethod: (method: string) => Promise<boolean>;
  
  // Friends
  friends: string[];
  addFriend: (name: string) => Promise<void>;
  
  // Colors
  categoryColors: CategoryColors;
  paymentMethodColors: PaymentMethodColors;
  getCategoryColor: (type: TransactionType, category: string) => ColorConfig;
  getPaymentMethodColor: (method: string) => ColorConfig;
  updateCategoryColor: (
    type: TransactionType,
    category: string,
    colors: ColorConfig
  ) => Promise<void>;
  updatePaymentMethodColor: (method: string, colors: ColorConfig) => Promise<void>;
  
  // Theme
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
  
  // Display Name
  displayName: string;
  setDisplayName: (name: string) => Promise<void>;
  
  // Loading
  isLoading: boolean;
}

// ============================================
// Context
// ============================================

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

// ============================================
// Provider
// ============================================

interface SettingsProviderProps {
  children: ReactNode;
  session: Session;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  session,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Categories
  const [categories, setCategories] = useState<{ income: string[]; expense: string[] }>(
    DEFAULT_CATEGORIES
  );
  
  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    DEFAULT_PAYMENT_METHODS
  );
  
  // Friends
  const [friends, setFriends] = useState<string[]>([]);
  
  // Colors
  const [categoryColors, setCategoryColors] = useState<CategoryColors>({
    income: {},
    expense: {},
  });
  const [paymentMethodColors, setPaymentMethodColors] = useState<PaymentMethodColors>(
    {}
  );
  
  // Theme
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem("themePreference") as ThemePreference;
    return saved || "system";
  });
  
  // Display Name
  const [displayName, setDisplayNameState] = useState<string>("");

  // ============================================
  // Fetch Settings
  // ============================================
  
  const fetchSettings = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: settings, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
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
        if (settings.friends) {
          setFriends(settings.friends);
        }
      } else {
        // Create default settings
        await supabase.from("user_settings").insert({
          user_id: session.user.id,
          categories_income: DEFAULT_CATEGORIES.income,
          categories_expense: DEFAULT_CATEGORIES.expense,
          payment_methods: DEFAULT_PAYMENT_METHODS,
          theme_preference: "system",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("themePreference", themePreference);
  }, [themePreference]);

  // ============================================
  // Update Functions
  // ============================================
  
  const updateSettingsInDb = useCallback(
    async (
      newCategories: typeof categories,
      newPaymentMethods: string[]
    ) => {
      if (!session?.user?.id) return;
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
    },
    [session?.user?.id]
  );

  // ============================================
  // Category Functions
  // ============================================
  
  const addCategory = useCallback(
    (type: TransactionType, category: string) => {
      if (!categories[type].includes(category)) {
        const updatedCats = {
          ...categories,
          [type]: [...categories[type], category].sort(),
        };
        setCategories(updatedCats);
        updateSettingsInDb(updatedCats, paymentMethods);
      }
    },
    [categories, paymentMethods, updateSettingsInDb]
  );

  const removeCategory = useCallback(
    async (type: TransactionType, category: string): Promise<boolean> => {
      const updatedCats = {
        ...categories,
        [type]: categories[type].filter((c) => c !== category),
      };
      setCategories(updatedCats);
      await updateSettingsInDb(updatedCats, paymentMethods);
      return true;
    },
    [categories, paymentMethods, updateSettingsInDb]
  );

  // ============================================
  // Payment Method Functions
  // ============================================
  
  const addPaymentMethod = useCallback(
    (method: string) => {
      if (!paymentMethods.includes(method)) {
        const updatedMethods = [...paymentMethods, method].sort();
        setPaymentMethods(updatedMethods);
        updateSettingsInDb(categories, updatedMethods);
      }
    },
    [categories, paymentMethods, updateSettingsInDb]
  );

  const removePaymentMethod = useCallback(
    async (method: string): Promise<boolean> => {
      const updatedMethods = paymentMethods.filter((m) => m !== method);
      setPaymentMethods(updatedMethods);
      await updateSettingsInDb(categories, updatedMethods);
      return true;
    },
    [categories, paymentMethods, updateSettingsInDb]
  );

  // ============================================
  // Friends Functions
  // ============================================
  
  const addFriend = useCallback(
    async (friendName: string) => {
      if (!friends.includes(friendName) && session?.user?.id) {
        const updatedFriends = [...friends, friendName].sort();
        setFriends(updatedFriends);
        try {
          await supabase.from("user_settings").upsert({
            user_id: session.user.id,
            friends: updatedFriends,
          });
        } catch (err) {
          console.error("Error saving friends:", err);
        }
      }
    },
    [friends, session?.user?.id]
  );

  // ============================================
  // Color Functions
  // ============================================
  
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

  const getPaymentMethodColor = useCallback(
    (method: string): ColorConfig => {
      return paymentMethodColors[method] || DEFAULT_PAYMENT_COLORS;
    },
    [paymentMethodColors]
  );

  const updateCategoryColor = useCallback(
    async (type: TransactionType, category: string, colors: ColorConfig) => {
      const newCategoryColors = {
        ...categoryColors,
        [type]: {
          ...categoryColors[type],
          [category]: colors,
        },
      };
      setCategoryColors(newCategoryColors);

      if (session?.user?.id) {
        try {
          await supabase.from("user_settings").upsert({
            user_id: session.user.id,
            category_colors: newCategoryColors,
          });
        } catch (err) {
          console.error("Error saving category colors:", err);
        }
      }
    },
    [categoryColors, session?.user?.id]
  );

  const updatePaymentMethodColor = useCallback(
    async (method: string, colors: ColorConfig) => {
      const newPaymentMethodColors = {
        ...paymentMethodColors,
        [method]: colors,
      };
      setPaymentMethodColors(newPaymentMethodColors);

      if (session?.user?.id) {
        try {
          await supabase.from("user_settings").upsert({
            user_id: session.user.id,
            payment_method_colors: newPaymentMethodColors,
          });
        } catch (err) {
          console.error("Error saving payment method colors:", err);
        }
      }
    },
    [paymentMethodColors, session?.user?.id]
  );

  // ============================================
  // Theme Functions
  // ============================================
  
  const setThemePreference = useCallback(
    async (theme: ThemePreference) => {
      setThemePreferenceState(theme);
      if (session?.user?.id) {
        try {
          await supabase.from("user_settings").upsert({
            user_id: session.user.id,
            theme_preference: theme,
          });
        } catch (err) {
          console.error("Error saving theme preference:", err);
        }
      }
    },
    [session?.user?.id]
  );

  // ============================================
  // Display Name Functions
  // ============================================
  
  const setDisplayName = useCallback(
    async (name: string) => {
      setDisplayNameState(name);
      if (session?.user?.id) {
        try {
          await supabase.from("user_settings").upsert({
            user_id: session.user.id,
            display_name: name.trim() || null,
          });
        } catch (err) {
          console.error("Error saving display name:", err);
        }
      }
    },
    [session?.user?.id]
  );

  // ============================================
  // Context Value
  // ============================================
  
  const value: SettingsContextValue = useMemo(
    () => ({
      categories,
      addCategory,
      removeCategory,
      paymentMethods,
      addPaymentMethod,
      removePaymentMethod,
      friends,
      addFriend,
      categoryColors,
      paymentMethodColors,
      getCategoryColor,
      getPaymentMethodColor,
      updateCategoryColor,
      updatePaymentMethodColor,
      themePreference,
      setThemePreference,
      displayName,
      setDisplayName,
      isLoading,
    }),
    [
      categories,
      addCategory,
      removeCategory,
      paymentMethods,
      addPaymentMethod,
      removePaymentMethod,
      friends,
      addFriend,
      categoryColors,
      paymentMethodColors,
      getCategoryColor,
      getPaymentMethodColor,
      updateCategoryColor,
      updatePaymentMethodColor,
      themePreference,
      setThemePreference,
      displayName,
      setDisplayName,
      isLoading,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;

