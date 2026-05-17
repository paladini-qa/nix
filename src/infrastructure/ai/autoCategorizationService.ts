/**
 * Serviço de regras de auto-categorização.
 * Persiste regras no localStorage para evitar migração de banco.
 */

export interface AutoCategorizationRule {
  id: string;
  pattern: string;    // substring case-insensitive para comparar com descrição
  category: string;
  type: "income" | "expense";
}

const STORAGE_KEY = "nix_autocategorization_rules";

export function getRules(): AutoCategorizationRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRules(rules: AutoCategorizationRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function addRule(rule: Omit<AutoCategorizationRule, "id">): AutoCategorizationRule {
  const rules = getRules();
  const newRule: AutoCategorizationRule = { ...rule, id: crypto.randomUUID() };
  rules.push(newRule);
  saveRules(rules);
  return newRule;
}

export function deleteRule(id: string): void {
  const rules = getRules().filter((r) => r.id !== id);
  saveRules(rules);
}

/**
 * Aplica regras de auto-categorização a uma descrição.
 * Retorna a categoria correspondente ou undefined se nenhuma regra bater.
 */
export function applyRules(
  description: string,
  type: "income" | "expense"
): string | undefined {
  const rules = getRules();
  const lower = description.toLowerCase();
  const match = rules.find(
    (r) => r.type === type && lower.includes(r.pattern.toLowerCase())
  );
  return match?.category;
}
