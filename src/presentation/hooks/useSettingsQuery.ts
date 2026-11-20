import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/infrastructure/database/supabaseClient";
import { ThemePreference, CategoryColors, PaymentMethodColors, PaymentMethodConfig } from "@/domain/entities";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD_CONFIGS } from "@/shared/constants";

export function useSettingsQuery(userId?: string) {
  const queryClient = useQueryClient();
  const settingsKey = ["user_settings", userId];

  const query = useQuery({
    queryKey: settingsKey,
    queryFn: async () => {
      if (!userId) return null;
      // TODO: move to application service — layer violation
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
        // TODO: move to application service — layer violation
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
      // TODO: move to application service — layer violation
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, ...updates });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKey });
    },
  });

  return {
    ...query,
    updateSettings: updateSettingsMutation.mutateAsync,
  };
}
