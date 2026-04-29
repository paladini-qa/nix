import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { ThemePreference, CategoryColors, PaymentMethodColors, PaymentMethodConfig } from "../types";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD_CONFIGS } from "../constants";

export const SETTINGS_KEY = ["user_settings"];

export function useSettingsQuery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (!data) {
        // Initialize settings if they don't exist
        const initialSettings = {
          user_id: userId,
          categories_income: DEFAULT_CATEGORIES.income,
          categories_expense: DEFAULT_CATEGORIES.expense,
          payment_methods: DEFAULT_PAYMENT_METHODS,
          payment_method_configs: DEFAULT_PAYMENT_METHOD_CONFIGS,
          theme_preference: "system",
        };
        await supabase.from("user_settings").insert(initialSettings);
        return initialSettings;
      }

      return data;
    },
    enabled: !!userId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!userId) return;
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, ...updates });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });

  return {
    ...query,
    updateSettings: updateSettingsMutation.mutateAsync,
  };
}
