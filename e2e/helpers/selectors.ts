/**
 * Seletores reutilizáveis para os testes E2E.
 * Centraliza referências à UI para facilitar manutenção.
 */

export const LOGIN = {
  emailInput: 'label:has-text("Email") + div input, input[type="email"]',
  passwordInput: 'label:has-text("Senha") + div input, input[type="password"]',
  submitButton: 'button[type="submit"]',
  errorAlert: '[role="alert"]',
};

export const NAV = {
  /** Sidebar ou bottom-nav — qualquer link de navegação */
  link: (label: string) => `[aria-label="${label}"], nav >> text="${label}"`,
};

export const TRANSACTIONS = {
  addButton: 'button:has-text("Nova"), button:has-text("Adicionar"), button[aria-label*="nova transação" i]',
  form: '[role="dialog"], form',
  descriptionInput: 'input[name="description"], label:has-text("Descrição") >> .. >> input',
  amountInput: 'input[name="amount"], label:has-text("Valor") >> .. >> input',
  saveButton: 'button:has-text("Salvar"), button[type="submit"]:has-text("salvar")',
};
