import { supabase } from "@/infrastructure/database/supabaseClient";
import { Account, AccountWithBalance, AccountType, Transaction } from "@/domain/entities";
import { accountSchema } from "@/shared/schemas";

// Tipo que representa a linha retornada pelo Supabase para a tabela accounts
interface DbAccount {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Serviço para gerenciamento de contas/carteiras
 */
export const accountService = {
  /**
   * Busca todas as contas do usuário
   */
  async getAll(): Promise<Account[]> {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data || []).map(mapDbToAccount);
  },

  /**
   * Busca contas ativas
   */
  async getActive(): Promise<Account[]> {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    return (data || []).map(mapDbToAccount);
  },

  /**
   * Busca uma conta por ID
   */
  async getById(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data ? mapDbToAccount(data) : null;
  },

  /**
   * Cria uma nova conta
   */
  async create(
    userId: string,
    account: Omit<Account, "id" | "isActive" | "createdAt" | "updatedAt">
  ): Promise<Account> {
    const validated = accountSchema.parse(account);

    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        name: validated.name,
        type: validated.type,
        initial_balance: validated.initialBalance,
        color: validated.color,
        icon: validated.icon,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDbToAccount(data);
  },

  /**
   * Atualiza uma conta
   */
  async update(
    id: string,
    updates: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>
  ): Promise<Account> {
    const validated = accountSchema.partial().parse(updates);

    const dbUpdates: Record<string, unknown> = {};
    if (validated.name !== undefined) dbUpdates.name = validated.name;
    if (validated.type !== undefined) dbUpdates.type = validated.type;
    if (validated.initialBalance !== undefined) dbUpdates.initial_balance = validated.initialBalance;
    if (validated.color !== undefined) dbUpdates.color = validated.color;
    if (validated.icon !== undefined) dbUpdates.icon = validated.icon;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await supabase
      .from("accounts")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return mapDbToAccount(data);
  },

  /**
   * Remove uma conta
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Arquiva/desativa uma conta
   */
  async archive(id: string): Promise<Account> {
    return this.update(id, { isActive: false });
  },

  /**
   * Reativa uma conta arquivada
   */
  async unarchive(id: string): Promise<Account> {
    return this.update(id, { isActive: true });
  },

  /**
   * Calcula saldos das contas baseado nas transações
   * Nota: Requer que as transações tenham account_id (implementação futura)
   */
  calculateBalances(
    accounts: Account[],
    transactions: Transaction[]
  ): AccountWithBalance[] {
    return accounts.map((account) => {
      // Por enquanto, retorna saldo inicial já que account_id ainda não está implementado nas transações
      // Quando implementado, filtrar transações por account_id
      const accountTxs = transactions; // Placeholder: filtrar por account_id quando disponível
      
      // Calcula totais (quando account_id for implementado)
      // const totalIncome = accountTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      // const totalExpense = accountTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      // const currentBalance = account.initialBalance + totalIncome - totalExpense;

      return {
        ...account,
        currentBalance: account.initialBalance,
        totalIncome: 0,
        totalExpense: 0,
      };
    });
  },

  /**
   * Retorna tipos de conta com labels
   */
  getAccountTypes(): { value: AccountType; label: string }[] {
    return [
      { value: "checking", label: "Checking Account" },
      { value: "savings", label: "Savings Account" },
      { value: "credit_card", label: "Credit Card" },
      { value: "cash", label: "Cash" },
      { value: "investment", label: "Investment" },
      { value: "other", label: "Other" },
    ];
  },
};

// Helper para mapear dados do banco
function mapDbToAccount(data: DbAccount): Account {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    initialBalance: data.initial_balance,
    color: data.color || "#6366f1",
    icon: data.icon || "account_balance",
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export default accountService;





