// Keep the original names as keys for storage, filters and financial rules.
const CATEGORY_LABELS = new Map([
  ["Salary", "Salário"],
  ["Investments", "Investimentos"],
  ["Freelance", "Trabalho autônomo"],
  ["Gifts", "Presentes"],
  ["Other", "Outros"],
  ["Food", "Alimentação"],
  ["Housing", "Moradia"],
  ["Transportation", "Transporte"],
  ["Healthcare", "Saúde"],
  ["Entertainment", "Lazer"],
  ["Education", "Educação"],
  ["Shopping", "Compras"],
  ["Subscriptions", "Assinaturas"],
]);

const PAYMENT_METHOD_LABELS = new Map([
  ["Credit Card", "Cartão de crédito"],
  ["Debit Card", "Cartão de débito"],
  ["Cash", "Dinheiro"],
  ["Bank Transfer", "Transferência bancária"],
]);

export const categoryLabel = (name: string): string => CATEGORY_LABELS.get(name) ?? name;
export const paymentMethodLabel = (name: string): string => PAYMENT_METHOD_LABELS.get(name) ?? name;
