import { describe, it, expect } from "vitest";
import {
  transactionSchema,
  budgetSchema,
  goalSchema,
  accountSchema,
  tagSchema,
  loginSchema,
  validate,
  getErrorMessages,
  getFirstError,
} from "../../schemas";

describe("Transaction Schema", () => {
  const validTransaction = {
    description: "Groceries",
    amount: 150.5,
    type: "expense" as const,
    category: "Food",
    paymentMethod: "Credit Card",
    date: "2024-01-15",
  };

  it("should validate a correct transaction", () => {
    const result = transactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
  });

  it("should reject empty description", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative amount", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid type", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid date format", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      date: "15/01/2024",
    });
    expect(result.success).toBe(false);
  });

  it("should validate optional recurring fields", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      isRecurring: true,
      frequency: "monthly",
    });
    expect(result.success).toBe(true);
  });

  it("should validate installments", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      installments: 12,
      currentInstallment: 1,
    });
    expect(result.success).toBe(true);
  });

  it("should reject installments less than 2", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      installments: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("Budget Schema", () => {
  const validBudget = {
    category: "Food",
    type: "expense" as const,
    limitAmount: 1000,
    month: 1,
    year: 2024,
  };

  it("should validate a correct budget", () => {
    const result = budgetSchema.safeParse(validBudget);
    expect(result.success).toBe(true);
  });

  it("should reject zero limit", () => {
    const result = budgetSchema.safeParse({
      ...validBudget,
      limitAmount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid month", () => {
    const result = budgetSchema.safeParse({
      ...validBudget,
      month: 13,
    });
    expect(result.success).toBe(false);
  });
});

describe("Goal Schema", () => {
  const validGoal = {
    name: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 2500,
  };

  it("should validate a correct goal", () => {
    const result = goalSchema.safeParse(validGoal);
    expect(result.success).toBe(true);
  });

  it("should reject negative current amount", () => {
    const result = goalSchema.safeParse({
      ...validGoal,
      currentAmount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("should use default values", () => {
    const result = goalSchema.safeParse({
      name: "Test",
      targetAmount: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentAmount).toBe(0);
      expect(result.data.color).toBe("#6366f1");
      expect(result.data.icon).toBe("savings");
    }
  });
});

describe("Account Schema", () => {
  const validAccount = {
    name: "Main Account",
    type: "checking" as const,
    initialBalance: 5000,
  };

  it("should validate a correct account", () => {
    const result = accountSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
  });

  it("should allow negative balance for credit cards", () => {
    const result = accountSchema.safeParse({
      ...validAccount,
      type: "credit_card",
      initialBalance: -2000,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid account type", () => {
    const result = accountSchema.safeParse({
      ...validAccount,
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("Tag Schema", () => {
  it("should validate a correct tag", () => {
    const result = tagSchema.safeParse({
      name: "Important",
      color: "#ff0000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid color format", () => {
    const result = tagSchema.safeParse({
      name: "Test",
      color: "red",
    });
    expect(result.success).toBe(false);
  });

  it("should reject special characters in name", () => {
    const result = tagSchema.safeParse({
      name: "Test@#$",
      color: "#000000",
    });
    expect(result.success).toBe(false);
  });
});

describe("Login Schema", () => {
  it("should validate correct credentials", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("Validation Helpers", () => {
  it("validate should return success with data", () => {
    const result = validate(tagSchema, { name: "Test", color: "#000000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Test");
    }
  });

  it("validate should return errors on failure", () => {
    const result = validate(tagSchema, { name: "", color: "invalid" });
    expect(result.success).toBe(false);
  });

  it("getErrorMessages should return field errors", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    if (!result.success) {
      const messages = getErrorMessages(result.error);
      expect(messages).toHaveProperty("email");
      expect(messages).toHaveProperty("password");
    }
  });

  it("getFirstError should return first error message", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    if (!result.success) {
      const message = getFirstError(result.error);
      expect(typeof message).toBe("string");
      expect(message.length).toBeGreaterThan(0);
    }
  });
});





