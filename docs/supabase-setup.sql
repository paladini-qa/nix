-- =============================================
-- NIX - Script de Criação do Banco de Dados Supabase
-- =============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/[seu-projeto]/sql

-- =============================================
-- 1. TABELA: transactions
-- =============================================
-- Armazena todas as transações financeiras dos usuários

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency TEXT CHECK (frequency IN ('monthly', 'yearly') OR frequency IS NULL),
    installments INTEGER CHECK (installments IS NULL OR installments >= 2),
    current_installment INTEGER CHECK (current_installment IS NULL OR current_installment >= 1),
    is_paid BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with TEXT,
    i_owe BOOLEAN DEFAULT FALSE,
    related_transaction_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Para bancos existentes, adicione a coluna is_paid:
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT TRUE;

-- Para bancos existentes, adicione a coluna is_shared (gastos compartilhados 50/50):
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- Para bancos existentes, adicione a coluna shared_with (nome do amigo com quem dividiu):
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS shared_with TEXT;

-- Para bancos existentes, adicione a coluna related_transaction_id (link entre expense e income compartilhada):
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS related_transaction_id UUID;

-- Para bancos existentes, adicione a coluna i_owe (true = amigo pagou e eu devo, false = eu paguei e amigo deve):
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS i_owe BOOLEAN DEFAULT FALSE;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Comentários na tabela
COMMENT ON TABLE public.transactions IS 'Transações financeiras dos usuários';
COMMENT ON COLUMN public.transactions.type IS 'Tipo: income (receita) ou expense (despesa)';
COMMENT ON COLUMN public.transactions.frequency IS 'Frequência de recorrência: monthly ou yearly';
COMMENT ON COLUMN public.transactions.installments IS 'Número total de parcelas';
COMMENT ON COLUMN public.transactions.current_installment IS 'Número da parcela atual';
COMMENT ON COLUMN public.transactions.is_shared IS 'Gasto compartilhado 50/50 com outra pessoa';
COMMENT ON COLUMN public.transactions.shared_with IS 'Nome do amigo com quem o gasto foi dividido';
COMMENT ON COLUMN public.transactions.i_owe IS 'Se true, amigo pagou e eu devo. Se false, eu paguei e amigo me deve';
COMMENT ON COLUMN public.transactions.related_transaction_id IS 'ID da transação relacionada (link entre expense e income de shared expense)';

-- =============================================
-- 2. TABELA: user_settings
-- =============================================
-- Armazena configurações personalizadas de cada usuário

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    categories_income TEXT[] DEFAULT ARRAY['Salary', 'Investments', 'Freelance', 'Gifts', 'Other'],
    categories_expense TEXT[] DEFAULT ARRAY['Food', 'Housing', 'Transportation', 'Healthcare', 'Entertainment', 'Education', 'Shopping', 'Subscriptions', 'Other'],
    payment_methods TEXT[] DEFAULT ARRAY['Credit Card', 'Debit Card', 'Pix', 'Cash', 'Bank Transfer', 'Boleto'],
    friends TEXT[] DEFAULT ARRAY[]::TEXT[],
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    category_colors JSONB DEFAULT '{}'::jsonb,
    payment_method_colors JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Para usuários existentes, adicione as colunas de cores:
-- ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS category_colors JSONB DEFAULT '{}'::jsonb;
-- ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS payment_method_colors JSONB DEFAULT '{}'::jsonb;

-- Para usuários existentes, adicione a coluna friends (lista de amigos para shared expenses):
-- ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS friends TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Comentários na tabela
COMMENT ON TABLE public.user_settings IS 'Configurações personalizadas do usuário';
COMMENT ON COLUMN public.user_settings.display_name IS 'Nome de exibição do usuário';
COMMENT ON COLUMN public.user_settings.categories_income IS 'Lista de categorias de receita personalizadas';
COMMENT ON COLUMN public.user_settings.categories_expense IS 'Lista de categorias de despesa personalizadas';
COMMENT ON COLUMN public.user_settings.payment_methods IS 'Lista de métodos de pagamento personalizados';
COMMENT ON COLUMN public.user_settings.theme_preference IS 'Preferência de tema: light, dark ou system';
COMMENT ON COLUMN public.user_settings.category_colors IS 'Cores personalizadas para categorias (JSONB com primary e secondary)';
COMMENT ON COLUMN public.user_settings.payment_method_colors IS 'Cores personalizadas para métodos de pagamento (JSONB com primary e secondary)';
COMMENT ON COLUMN public.user_settings.friends IS 'Lista de amigos para shared expenses';

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================
-- Garante que cada usuário só acesse seus próprios dados

-- Habilitar RLS nas tabelas
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para transactions
CREATE POLICY "Usuários podem ver apenas suas próprias transações"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias transações"
    ON public.transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias transações"
    ON public.transactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias transações"
    ON public.transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para user_settings
CREATE POLICY "Usuários podem ver apenas suas próprias configurações"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias configurações"
    ON public.user_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- 4. TRIGGER: Atualizar updated_at automaticamente
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_settings_updated
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 5. CONFIGURAÇÕES DO SUPABASE AUTH (Manual)
-- =============================================
-- 
-- No Dashboard do Supabase, configure:
--
-- 1. Authentication > Providers
--    - Habilite Email provider
--    - (Opcional) Configure provedores OAuth como Google, GitHub, etc.
--
-- 2. Authentication > URL Configuration
--    - Site URL: URL do seu app em produção
--    - Redirect URLs: URLs permitidas para redirecionamento após login
--
-- 3. Authentication > Email Templates (opcional)
--    - Personalize os templates de email de confirmação e recuperação de senha
--
-- =============================================

-- =============================================
-- 6. TABELA: budgets
-- =============================================
-- Armazena orçamentos mensais por categoria

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount > 0),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, type, month, year)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(year, month);

-- Comentários
COMMENT ON TABLE public.budgets IS 'Orçamentos mensais por categoria';
COMMENT ON COLUMN public.budgets.limit_amount IS 'Limite de gastos para a categoria no mês';

-- RLS para budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus próprios orçamentos"
    ON public.budgets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios orçamentos"
    ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios orçamentos"
    ON public.budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios orçamentos"
    ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER on_budgets_updated
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 7. TABELA: goals
-- =============================================
-- Armazena metas financeiras dos usuários

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    deadline DATE,
    category TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'savings',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON public.goals(is_completed);

-- Comentários
COMMENT ON TABLE public.goals IS 'Metas financeiras dos usuários';
COMMENT ON COLUMN public.goals.target_amount IS 'Valor alvo da meta';
COMMENT ON COLUMN public.goals.current_amount IS 'Valor atual economizado';

-- RLS para goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias metas"
    ON public.goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias metas"
    ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias metas"
    ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias metas"
    ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER on_goals_updated
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 8. TABELA: accounts
-- =============================================
-- Armazena contas/carteiras do usuário

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'other')),
    initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'account_balance',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- Comentários
COMMENT ON TABLE public.accounts IS 'Contas e carteiras do usuário';
COMMENT ON COLUMN public.accounts.type IS 'Tipo: checking, savings, credit_card, cash, investment, other';
COMMENT ON COLUMN public.accounts.initial_balance IS 'Saldo inicial da conta';

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias contas"
    ON public.accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias contas"
    ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias contas"
    ON public.accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias contas"
    ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER on_accounts_updated
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Adicionar coluna account_id na tabela transactions (para bancos existentes)
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

-- =============================================
-- 9. TABELA: tags
-- =============================================
-- Tags personalizadas para transações

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Tabela de junção para tags de transações
CREATE TABLE IF NOT EXISTS public.transaction_tags (
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction ON public.transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag ON public.transaction_tags(tag_id);

-- Comentários
COMMENT ON TABLE public.tags IS 'Tags personalizadas do usuário';
COMMENT ON TABLE public.transaction_tags IS 'Relacionamento many-to-many entre transações e tags';

-- RLS para tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias tags"
    ON public.tags FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias tags"
    ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias tags"
    ON public.tags FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias tags"
    ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- RLS para transaction_tags (baseado na transação)
CREATE POLICY "Usuários podem ver tags de suas transações"
    ON public.transaction_tags FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

CREATE POLICY "Usuários podem adicionar tags às suas transações"
    ON public.transaction_tags FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

CREATE POLICY "Usuários podem remover tags de suas transações"
    ON public.transaction_tags FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

-- =============================================
-- VERIFICAÇÃO (Execute após criar as tabelas)
-- =============================================
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM information_schema.columns WHERE table_name = 'transactions';
-- SELECT * FROM information_schema.columns WHERE table_name = 'user_settings';
-- SELECT * FROM information_schema.columns WHERE table_name = 'budgets';
-- SELECT * FROM information_schema.columns WHERE table_name = 'goals';
