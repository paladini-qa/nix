import { z } from "zod";

// =============================================
// TRANSACTION SCHEMAS
// =============================================

export const transactionTypeSchema = z.enum(["income", "expense"]);

export const frequencySchema = z.enum(["monthly", "yearly"]);

export const transactionSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be less than 200 characters"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(999999999.99, "Amount is too large"),
  type: transactionTypeSchema,
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  isRecurring: z.boolean().optional(),
  frequency: frequencySchema.optional(),
  installments: z
    .number()
    .int()
    .min(2, "Installments must be at least 2")
    .max(48, "Maximum 48 installments")
    .optional(),
  currentInstallment: z.number().int().min(1).optional(),
  isPaid: z.boolean().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

// Schema para criar transação (sem campos opcionais de sistema)
export const createTransactionSchema = transactionSchema.refine(
  (data) => {
    // Se tem parcelas, não pode ser recorrente
    if (data.installments && data.installments > 1 && data.isRecurring) {
      return false;
    }
    return true;
  },
  { message: "Transaction cannot be both recurring and have installments" }
);

// =============================================
// BUDGET SCHEMAS
// =============================================

export const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  type: transactionTypeSchema,
  limitAmount: z
    .number({ invalid_type_error: "Limit must be a number" })
    .positive("Limit must be greater than 0")
    .max(999999999.99, "Amount is too large"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

// =============================================
// GOAL SCHEMAS
// =============================================

export const goalSchema = z.object({
  name: z
    .string()
    .min(1, "Goal name is required")
    .max(100, "Name must be less than 100 characters"),
  targetAmount: z
    .number({ invalid_type_error: "Target must be a number" })
    .positive("Target must be greater than 0"),
  currentAmount: z
    .number({ invalid_type_error: "Current amount must be a number" })
    .min(0, "Current amount cannot be negative")
    .default(0),
  deadline: z.string().optional(),
  category: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#6366f1"),
  icon: z.string().default("savings"),
});

export type GoalInput = z.infer<typeof goalSchema>;

// =============================================
// ACCOUNT SCHEMAS
// =============================================

export const accountTypeSchema = z.enum([
  "checking",
  "savings",
  "credit_card",
  "cash",
  "investment",
  "other",
]);

export const accountSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(50, "Name must be less than 50 characters"),
  type: accountTypeSchema,
  initialBalance: z.number({ invalid_type_error: "Balance must be a number" }),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#6366f1"),
  icon: z.string().optional(),
});

export type AccountInput = z.infer<typeof accountSchema>;

// =============================================
// TAG SCHEMAS
// =============================================

export const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(30, "Name must be less than 30 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Tag can only contain letters, numbers, spaces, hyphens and underscores"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#6366f1"),
});

export type TagInput = z.infer<typeof tagSchema>;

// =============================================
// USER SETTINGS SCHEMAS
// =============================================

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);

export const displayNameSchema = z
  .string()
  .max(50, "Name must be less than 50 characters")
  .optional();

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password is too long");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = loginSchema.extend({
  displayName: z.string().min(1, "Name is required").max(50),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

// =============================================
// VALIDATION HELPERS
// =============================================

/**
 * Valida dados e retorna resultado tipado
 */
export function validate<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Extrai mensagens de erro formatadas
 */
export function getErrorMessages(error: z.ZodError): Record<string, string> {
  const messages: Record<string, string> = {};
  const issues = error.issues || error.errors || [];
  issues.forEach((err: any) => {
    const path = err.path?.join(".") || "root";
    if (!messages[path]) {
      messages[path] = err.message;
    }
  });
  return messages;
}

/**
 * Retorna primeira mensagem de erro
 */
export function getFirstError(error: z.ZodError): string {
  const issues = error.issues || error.errors || [];
  return issues[0]?.message || "Validation error";
}

